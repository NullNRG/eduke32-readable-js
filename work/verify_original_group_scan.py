"""Compare original archive recognition in native C++, Node and Chromium.

Only the supplied raw archive is mounted. This is original resource discovery,
not execution of app_main, menus, rendering or gameplay.
"""
import functools,hashlib,http.server,json,os,sqlite3,sys,tempfile,threading
from pathlib import Path
from verify_original_vfs import ROOT,MODULES,SOURCE,PROFILE,Quiet,native,run
sys.path.insert(0,str(ROOT/'tools'))
from source_runtime_helpers import runtime_fingerprints

DRIVER=r'''#include <cstdio>
#include <cstdlib>
#include <cstdarg>
#include "compat.h"
#include "osd.h"
#include "crc32.h"
#include "grpscan.h"
#include "scriptfile.h"
#include "common.h"
// Native host log sink; all archive recognition and ownership is original.
int OSD_Printf(const char*f,...){va_list a;va_start(a,f);int r=vfprintf(stderr,f,a);va_end(a);return r;}
int main(int argc,char**argv){if(argc!=2||chdir(argv[1]))return 2;
engineCreateAllocator();initcrc32table();ScanGroups();
int count=0;for(auto*p=foundgrps;p;p=p->next){count++;
printf("%s\t%s\t%d\t%d\t%d\t%d\n",p->filename,p->type->name,p->type->size,p->type->crcval,p->type->game,p->type->dependency);}
FreeGroups();if(count!=1||foundgrps||listgrps)return 3;engineDestroyAllocator();}
'''

def main():
    artifacts={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in MODULES.rglob('*.mjs')}
    runtime_artifacts=runtime_fingerprints(ROOT)
    probe_artifacts={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ('work/probe_original_group_scan.mjs','work/run_original_group_scan.mjs')}
    with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='original-group-scan-') as name:
        folder=Path(name);fixture=folder/'assets';fixture.mkdir()
        os.link(ROOT/'input-data/DUKE3D.GRP',fixture/'DUKE3D.GRP')
        database=ROOT/PROFILE['build_root']/'reports/semantic-index.sqlite'
        connection=sqlite3.connect(database.resolve().as_uri()+'?mode=ro',uri=True)
        try:
            records=[json.loads(r) for r, in connection.execute(
                'select record from declarations where name=? and definition=1',('getatoken',))]
            records=[r for r in records if r['kind']=='FUNCTION_DECL' and r['file']=='source/build/src/common.cpp']
            assert len(records)==1,records
            record=records[0];begin,end=record['definition_extent']
            exact=(SOURCE/record['file']).read_bytes()[begin:end].decode()
        finally:connection.close()
        lines=native(folder,DRIVER+'\n'+exact,[fixture],['source/duke3d/src/grpscan.cpp',
            'source/build/src/scriptfile.cpp','source/build/src/crc32.cpp'])
    expected=[]
    for line in lines:
        filename,name,size,crc,game,dependency=line.split('\t')
        expected.append(dict(filename=filename.lower(),name=name,size=int(size),crc=int(crc),game=int(game),dependency=int(dependency)))
    if '--native-only' in sys.argv:
        print(json.dumps(expected,indent=2));return
    def normalized(groups):return [{**g,'filename':g['filename'].lower()} for g in groups]
    checkpoint=ROOT/'reports/nov03-original-group-node.json'
    saved=json.loads(checkpoint.read_text()) if '--resume-node' in sys.argv and checkpoint.is_file() else {}
    if saved.get('artifacts')==artifacts and saved.get('runtime_artifacts')==runtime_artifacts and saved.get('probe_artifacts')==probe_artifacts:
        node=saved['result']
    else:
        output=run(['node','work/run_original_group_scan.mjs'],timeout=600)
        lines=[line.removeprefix('SOURCE_GROUP_SCAN_RESULT ') for line in output.splitlines() if line.startswith('SOURCE_GROUP_SCAN_RESULT ')]
        assert len(lines)==1,output[-3000:]
        node=json.loads(lines[0])
        checkpoint.write_bytes((json.dumps({'artifacts':artifacts,'runtime_artifacts':runtime_artifacts,'probe_artifacts':probe_artifacts,'result':node},indent=2)+'\n').encode())
    assert normalized(node['groups'])==expected,(node,expected)
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start();errors=[];logs=[]
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            try:
                page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('console',lambda message:logs.append({'type':message.type,'text':message.text}))
                page.goto('http://127.0.0.1:'+str(server.server_port)+'/__original_vfs_probe__')
                actual=page.evaluate('''async()=>{
                  const base=new URL('/',location.href);
                  const {probeOriginalGroupScan}=await import('/work/probe_original_group_scan.mjs');
                  const response=await fetch('/input-data/DUKE3D.GRP');if(!response.ok)throw Error('Missing local asset');
                  return probeOriginalGroupScan({base,bytes:new Uint8Array(await response.arrayBuffer())});
                }''')
                assert normalized(actual['groups'])==expected and not errors,(actual,expected,errors)
                version=browser.version
            finally:browser.close()
    finally:server.shutdown();server.server_close()
    report={'passed':True,'scope':'Original GRP discovery and cleanup, after original enginePreInit',
        'native_node_chromium_match':True,'browser_version':version,'result':actual,
        'node_scan_milliseconds':node['scan_milliseconds'],
        'native_filename_case_normalization':'Compare ASCII-insensitive filenames; original Build path cleaning lowercases names in the Linux browser profile.',
        'console':logs,'page_errors':errors,'app_main_executed':False,'gameplay_verified':False,
        'artifacts':artifacts,'runtime_artifacts':runtime_artifacts,'probe_artifacts':probe_artifacts,
        'inputs_unchanged':artifacts=={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in MODULES.rglob('*.mjs')}
            and runtime_artifacts==runtime_fingerprints(ROOT)}
    assert report['inputs_unchanged'],'Execution inputs changed during verification'
    (ROOT/'reports/nov03-original-group-discovery.json').write_bytes((json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps({k:v for k,v in report.items() if k not in ('artifacts','runtime_artifacts')},indent=2))

if __name__=='__main__':main()
