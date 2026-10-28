"""Loopback-only project launcher. Runs fixed jobs; never accepts shell text."""
from __future__ import annotations
import argparse, json, mimetypes, os, secrets, subprocess, sys, threading, time, webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
from project_workspace import ROOT, cleanup_plan, save, sha

JOBS = {
    'build': ('Compile original game', ['tools/build_browser_classic.py']),
    'test': ('Compiler and runtime regression tests', ['tools/verify_recovery_suite.py','--jobs','1','--timeout','240','--report','reports/project-regression.json']),
    'acceptance': ('Original game acceptance checks', ['tools/verify_port_acceptance.py','--strict']),
    'handoff': ('Create continuation ZIP', ['tools/project_workspace.py','package']),
    'cleanup': ('Remove listed obsolete caches', ['tools/project_workspace.py','clean']),
}

class Project:
    def __init__(self, root=ROOT):
        self.root=root.resolve(); self.token=secrets.token_urlsafe(32); self.lock=threading.Lock(); self.job=None; self.process=None
    def start(self, name):
        if name not in JOBS: raise ValueError('Unknown project action')
        with self.lock:
            if self.job and self.job['status']=='running': raise RuntimeError('A project job is already running')
            label,args=JOBS[name]; stamp=str(time.time_ns()); log=self.root/'reports/project-jobs'/(stamp+'.log');log.parent.mkdir(parents=True,exist_ok=True)
            self.job={'id':stamp,'action':name,'label':label,'status':'running','started':time.time(),'log':log.relative_to(self.root).as_posix()}
            save(self.root/'reports/project-job.json',self.job)
            def run():
                try:
                    with log.open('w',encoding='utf-8') as stream:
                        with self.lock:
                            self.process=subprocess.Popen([sys.executable,*args],cwd=self.root,stdout=stream,stderr=subprocess.STDOUT,
                                env={**os.environ,'PYTHONUTF8':'1','PYTHONUNBUFFERED':'1'},**({'creationflags':subprocess.CREATE_NO_WINDOW} if os.name=='nt' else {}))
                            process=self.process
                        code=process.wait()
                    result={'status':'passed' if code==0 else 'failed','returncode':code,'finished':time.time()}
                except Exception as error:
                    result={'status':'failed','error':str(error),'finished':time.time()}
                finally:
                    with self.lock:
                        self.process=None; self.job.update(result); save(self.root/'reports/project-job.json',self.job)
            threading.Thread(target=run,daemon=True).start()
            return dict(self.job)
    def status(self):
        def read(name):
            try:return json.loads((self.root/name).read_text(encoding='utf-8-sig'))
            except (OSError,ValueError):return None
        acceptance=read('reports/port-acceptance.json') or {}
        html=self.root/'dist/index.html'; exists=html.is_file()
        attested=acceptance.get('deliverables',{}).get('offline_html',{})
        verified=bool(exists and acceptance.get('original_game_playable_verified') and attested.get('sha256')==sha(html))
        result={'game_present':exists,'gameplay_verified':verified,'game_url':'/dist/index.html' if exists else None,
            'message':'Original gameplay verified' if verified else 'Game build exists; gameplay is unverified' if exists else 'Original game is blocked; no playable dist/index.html yet',
            'failed_checks':acceptance.get('failed_checks',[]),'unverified_checks':acceptance.get('unverified_checks',[]),
            'handoff':read('reports/project-handoff.json'),'cleanup':read('reports/project-cleanup.json'),
            'job':dict(self.job) if self.job else None,'token':self.token}
        if result['handoff']:
            path=Path(result['handoff']['path'])
            result['handoff']['url']='/'+path.relative_to(self.root).as_posix() if path.is_relative_to(self.root) and path.is_file() else None
        if self.job:
            path=self.root/self.job['log']
            if path.exists():
                with path.open('rb') as stream:
                    stream.seek(max(0,path.stat().st_size-16000)); result['log_tail']=stream.read().decode('utf-8','replace')
        return result

class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.json':'application/json'}
    def __init__(self,request,client_address,server):
        super().__init__(request,client_address,server,directory=str(server.project.root))
    def log_message(self,*args): pass
    def valid_host(self):return self.headers.get('Host') in (f'127.0.0.1:{self.server.server_port}',f'localhost:{self.server.server_port}')
    def json(self,code,data):
        payload=json.dumps(data).encode(); self.send_response(code);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(payload)));self.end_headers()
        if self.command!='HEAD':self.wfile.write(payload)
    def do_GET(self):
        if not self.valid_host():return self.json(403,{'error':'Local host required'})
        path=unquote(urlsplit(self.path).path)
        if path=='/api/status':return self.json(200,self.server.project.status())
        if path=='/api/cleanup-plan':return self.json(200,cleanup_plan(self.server.project.root))
        resolved=(self.server.project.root/path.lstrip('/')).resolve()
        if not resolved.is_relative_to(self.server.project.root):return self.json(403,{'error':'Outside project'})
        parts=Path(path.lstrip('/')).parts
        allowed=not parts or path=='/index.html' or parts[0] in ('runtime','factory-output','reports','dist','handoffs') or path in ('/CONTINUE_HERE.md','/CURRENT_PORT_STATUS.md','/BUILD_PORTABILITY.md')
        if not allowed or any(p.startswith('.') for p in parts):return self.json(404,{'error':'Not a public project artifact'})
        if resolved.is_dir() and path not in ('/','/index.html'):return self.json(404,{'error':'Directory listing disabled'})
        return super().do_GET()
    def do_HEAD(self):
        # Use the same path/host checks rather than SimpleHTTPRequestHandler's unrestricted implementation.
        return self.json(405,{'error':'Use GET'})
    def do_POST(self):
        origin=self.headers.get('Origin'); expected='http://'+self.headers.get('Host','')
        if not self.valid_host() or origin!=expected or self.headers.get('X-Project-Token')!=self.server.project.token:return self.json(403,{'error':'Open the local project launcher to run jobs'})
        if self.path!='/api/jobs':return self.json(404,{'error':'Unknown endpoint'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=1024:raise ValueError('Invalid request length')
            body=json.loads(self.rfile.read(length)); name=body['action']
            if not isinstance(name,str):raise ValueError('Invalid action')
            job=self.server.project.start(name)
            return self.json(202,job)
        except (ValueError,KeyError,TypeError) as error:return self.json(400,{'error':str(error)})
        except RuntimeError as error:return self.json(409,{'error':str(error)})

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8765);parser.add_argument('--open',action='store_true');args=parser.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler);server.project=Project()
    url=f'http://127.0.0.1:{server.server_port}/';print('Project launcher: '+url,flush=True)
    if args.open:webbrowser.open(url)
    try:server.serve_forever()
    except KeyboardInterrupt:
        if server.project.process and server.project.process.poll() is None:
            print('Waiting for the active project job to finish before closing.',flush=True);server.project.process.wait()
    finally:server.server_close()
if __name__=='__main__':main()
