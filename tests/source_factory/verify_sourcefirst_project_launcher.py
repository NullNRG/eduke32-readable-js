"""Exercise real local jobs, request isolation, cleanup and continuation integrity."""
import hashlib, http.client, json, os, sys, tempfile, threading, time, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from project_launcher import Project, Handler, JOBS, ThreadingHTTPServer
import project_launcher as launcher
from project_workspace import cleanup, cleanup_plan, package

def main():
    with tempfile.TemporaryDirectory(prefix='eduke-launcher-') as temp:
        root=Path(temp)
        for directory in ('work','tools','runtime','tests','reports','input-data','factory-output/source-first/kept','factory-output/source-tree','handoffs'):(root/directory).mkdir(parents=True)
        (root/'index.html').write_text('launcher')
        (root/'runtime/keep.mjs').write_text('export const value=37;')
        (root/'input-data/DUKE3D.GRP').write_bytes(b'asset-fixture')
        (root/'factory-output/source-first/kept/unit.mjs').write_text('export function original() {return 37;}')
        (root/'factory-output/source-first/kept/checkpoint.json').write_text('{}')
        (root/'work/ast-cache-clock').mkdir();(root/'work/ast-cache-clock/old.json').write_bytes(b'old-cache'*100)
        (root/'work/private.txt').write_text('not publicly served')
        (root/'tools/probe.py').write_text('import time\nprint("real job output",flush=True)\ntime.sleep(0.3)\nraise SystemExit(7)\n')
        (root/'tools/source_address_runtime.mjs').write_text('export const abi="test";')
        assert cleanup_plan(root)['bytes']==900
        result=cleanup(root); assert result['removed_bytes']==900 and not (root/'work/ast-cache-clock').exists()
        assert (root/'runtime/keep.mjs').is_file() and cleanup_plan(root)['bytes']==0
        archive=package(root)
        with zipfile.ZipFile(archive['path']) as z:
            manifest=json.loads(z.read('EDuke32_SourceFactory/CONTINUATION_MANIFEST.json'))
            names={r['path'] for r in manifest['files']}
            assert {'input-data/DUKE3D.GRP','runtime/keep.mjs','factory-output/source-first/kept/unit.mjs'}<=names
            assert not any('ast-cache' in name for name in names)
            for row in manifest['files']:assert hashlib.sha256(z.read('EDuke32_SourceFactory/'+row['path'])).hexdigest()==row['sha256']
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler); server.project=Project(root)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        origin=f'http://127.0.0.1:{server.server_port}'
        def request(method,path,body=None,headers=None):
            client=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=10)
            client.request(method,path,body,headers or {}); response=client.getresponse(); data=response.read(); status=response.status;client.close();return status,data
        try:
            status,raw=request('GET','/api/status'); assert status==200; state=json.loads(raw)
            assert not state['game_present'] and not state['gameplay_verified']
            assert request('GET','/api/status',headers={'Host':'evil.invalid'})[0]==403
            assert request('GET','/work/private.txt')[0]==404
            assert request('GET','/tools/source_address_runtime.mjs')[0]==200
            assert request('GET','/tools/probe.py')[0]==404
            assert request('GET','/../private.txt')[0]==403
            assert request('GET','/reports/')[0]==404
            assert request('POST','/api/jobs','{"action":"build"}')[0]==403
            headers={'Origin':origin,'X-Project-Token':state['token'],'Content-Type':'application/json'}
            assert request('POST','/api/jobs','{"action":"shell"}',headers)[0]==400
            assert request('POST','/api/jobs','{"action":"test"}',{**headers,'Origin':'http://evil.invalid'})[0]==403
            original=JOBS['test'];JOBS['test']=('Fixture command',['tools/probe.py'])
            saved_save=launcher.save;persisting=threading.Event();release=threading.Event()
            def delayed_save(path,data):
                if path.name=='project-job.json' and data.get('returncode')==7:
                    persisting.set();assert release.wait(5),'Test did not release persistence gate'
                return saved_save(path,data)
            launcher.save=delayed_save
            try:
                assert request('POST','/api/jobs','{"action":"test"}',headers)[0]==202
                assert request('POST','/api/jobs','{"action":"test"}',headers)[0]==409
                try:
                    assert persisting.wait(5),'Job never reached final persistence'
                    assert server.project.job['status']=='running','Completion became visible before the exit code was saved'
                    assert json.loads((root/'reports/project-job.json').read_text())['status']=='running'
                finally:release.set()
                deadline=time.monotonic()+10
                while server.project.job['status']=='running' and time.monotonic()<deadline:time.sleep(.02)
                state=server.project.status();assert state['job']['status']=='failed' and state['job']['returncode']==7
                assert 'real job output' in state['log_tail']
                assert json.loads((root/'reports/project-job.json').read_text())['returncode']==7
            finally:release.set();launcher.save=saved_save;JOBS['test']=original
            (root/'dist').mkdir();(root/'dist/index.html').write_text('unverified game')
            assert server.project.status()['game_present'] and not server.project.status()['gameplay_verified']
            (root/'reports/port-acceptance.json').write_text(json.dumps({'original_game_playable_verified':True,'deliverables':{'offline_html':{'sha256':'stale'}}}))
            assert not server.project.status()['gameplay_verified']
        finally:server.shutdown();server.server_close();thread.join()
    print('Project jobs, origin/token checks, failure logs, truthful play status, conservative cleanup and ZIP payload hashes passed')
if __name__=='__main__':main()
