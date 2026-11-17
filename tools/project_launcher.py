"""Loopback-only project launcher. Runs fixed jobs; never accepts shell text."""
from __future__ import annotations
import argparse, json, mimetypes, os, secrets, subprocess, sys, threading, time, webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
from project_workspace import ROOT, cleanup_plan, save, sha
from browser_engine_probe import fresh_engine_probe

JOBS = {
    'engine-startup': ('Verify original engine startup in Chromium', ['work/verify_fresh_engine_startup.py']),
    'resume-app-main': ('Recover original app_main dependency closure', ['work/recover_boot_reachable.py','source/duke3d/src/game.cpp','app_main','--whole-unit','--install-closed-leaves']),
    'build': ('Compile original game', ['tools/build_browser_classic.py']),
    'test': ('Compiler and runtime regression tests', ['tools/verify_recovery_suite.py','--jobs','1','--timeout','240','--report','reports/project-regression.json']),
    'acceptance': ('Original game acceptance checks', ['tools/verify_port_acceptance.py','--strict']),
    'handoff': ('Create compact continuation ZIP', ['work/package_current_continuation.py']),
    'cleanup': ('Remove listed obsolete caches', ['tools/project_workspace.py','clean']),
}

class Project:
    def __init__(self, root=ROOT):
        self.root=root.resolve(); self.token=secrets.token_urlsafe(32); self.lock=threading.Lock(); self.job=None; self.process=None
    def unchanged_artifact(self, name, digest):
        path=(self.root/name).resolve()
        if not path.is_relative_to(self.root) or not path.is_file():return False
        # Timestamp/size equality does not prove unchanged bytes. Rapid
        # Windows rewrites can preserve that tuple; verification gates must
        # also reject deliberately restored timestamps on changed contents.
        return sha(path)==digest
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
                        finished={**self.job,**result}
                        save(self.root/'reports/project-job.json',finished)
                        self.process=None; self.job=finished
            threading.Thread(target=run,daemon=True).start()
            return dict(self.job)
    def status(self):
        with self.lock:job=dict(self.job) if self.job else None
        def read(name):
            try:return json.loads((self.root/name).read_text(encoding='utf-8-sig'))
            except (OSError,ValueError):return None
        acceptance=read('reports/port-acceptance.json') or {}
        profile=read('tools/browser_classic_profile.json') or {}
        component=read('factory-output/source-first/browser-classic/component-manifest.json') or {}
        proof_name=profile.get('engine_execution_report','reports/oct30-original-browser-component.json')
        proof_path=Path(proof_name)
        proof=read(proof_name) if not proof_path.is_absolute() and '..' not in proof_path.parts else None
        proof=proof or {}
        artifacts={**proof.get('artifacts',{}),**proof.get('runtime_artifacts',{})}
        attested_modules={name:digest for name,digest in component.get('artifacts',{}).items() if name.endswith('.mjs')}
        engine_verified=bool(proof.get('original_engine_startup_verified')
            and proof.get('fresh_startup_without_precalled_helpers') and not proof.get('page_errors')
            and proof.get('artifacts') and proof.get('runtime_artifacts')
            and proof.get('artifacts')==attested_modules
            and proof.get('runtime_artifacts')==component.get('runtime_artifacts')
            and all(self.unchanged_artifact(name,digest) for name,digest in artifacts.items()))
        module_root=profile.get('boot_module_root','')
        engine_path=(self.root/module_root/'source/build/src/engine.cpp.mjs').resolve() if module_root else None
        engine_available=bool(engine_path and engine_path.is_relative_to(self.root) and engine_path.is_file())
        html=self.root/'dist/index.html'; exists=html.is_file()
        attested=acceptance.get('deliverables',{}).get('offline_html',{})
        verified=bool(exists and acceptance.get('original_game_playable_verified') and attested.get('sha256')==sha(html))
        result={'game_present':exists,'gameplay_verified':verified,'game_url':'/dist/index.html' if verified else None,
            'message':'Original gameplay verified' if verified else 'Game build exists; gameplay is unverified' if exists else 'Original game is blocked; no playable dist/index.html yet',
            'failed_checks':acceptance.get('failed_checks',[]),'unverified_checks':acceptance.get('unverified_checks',[]),
            'handoff':read('reports/project-handoff.json'),'cleanup':read('reports/project-cleanup.json'),
            'job':job,'token':self.token}
        result['engine']={'available':engine_available,'verified':engine_verified,
            'url':'/engine-startup.html' if engine_available else None,
            'report_url':'/'+proof_path.as_posix() if proof else None,
            'message':'Original enginePreInit returned 0; recorded module and runtime bytes match' if engine_verified else 'Startup evidence is absent or stale; run verification for current bytes',
            'partial_units':component.get('source_units_with_partial_modules'),
            'selected_units':component.get('selected_source_units'),
            'app_main_linked':bool(component.get('entry_exports',{}).get('app_main')),
            'gameplay_verified':False}
        if result['handoff']:
            path=Path(result['handoff']['path'])
            result['handoff']['url']='/'+path.relative_to(self.root).as_posix() if path.is_relative_to(self.root) and path.is_file() else None
        if job:
            path=self.root/job['log']
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
        if path=='/api/engine-startup-config':
            profile=json.loads((self.server.project.root/'tools/browser_classic_profile.json').read_text())
            module_root=Path(profile['boot_module_root'])
            if module_root.is_absolute() or '..' in module_root.parts:return self.json(500,{'error':'Invalid module root'})
            return self.json(200,{'base':'/'+module_root.as_posix()})
        if path=='/api/engine-startup.js':
            body=('export default '+fresh_engine_probe(self.server.project.root)+';\n').encode()
            self.send_response(200);self.send_header('Content-Type','text/javascript');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body);return
        resolved=(self.server.project.root/path.lstrip('/')).resolve()
        if not resolved.is_relative_to(self.server.project.root):return self.json(403,{'error':'Outside project'})
        parts=Path(path.lstrip('/')).parts
        browser_helpers = ('/tools/source_address_runtime.mjs', '/tools/source_aggregate_runtime.mjs',
                           '/tools/source_pointer_runtime.mjs')
        allowed=not parts or path in ('/index.html','/engine-startup.html','/engine-player.html','/engine-level.html','/engine-level-runner.mjs','/grp-launcher.mjs') or path in browser_helpers or parts[0] in ('runtime','factory-output','reports','dist','handoffs') or path in ('/CONTINUE_HERE.md','/CURRENT_PORT_STATUS.md','/BUILD_PORTABILITY.md','/ENGINEERING_CHECKPOINT.md','/PORT_GUIDE.md')
        if not allowed or any(p.startswith('.') for p in parts):return self.json(404,{'error':'Not a public project artifact'})
        if resolved.is_dir() and path not in ('/','/index.html'):return self.json(404,{'error':'Directory listing disabled'})
        return super().do_GET()
    def do_HEAD(self):
        # Use the same path/host checks rather than SimpleHTTPRequestHandler's unrestricted implementation.
        return self.json(405,{'error':'Use GET'})
    def do_POST(self):
        origin=self.headers.get('Origin'); expected='http://'+self.headers.get('Host','')
        if not self.valid_host() or origin!=expected or self.headers.get('X-Project-Token')!=self.server.project.token:
            # Closing a Windows socket with an unread request body can reset
            # the connection before the client receives the rejection. Drain
            # only the same small bounded payload accepted by this endpoint.
            try:
                length=int(self.headers.get('Content-Length','0'))
                if 0<length<=1024:
                    self.connection.settimeout(2);self.rfile.read(length)
            except (ValueError,OSError):pass
            return self.json(403,{'error':'Open the local project launcher to run jobs'})
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
