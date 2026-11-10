"""Prove same-unit fragments preserve private state and address identity."""
import copy, functools, json, os, subprocess, sys, tempfile, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import storage_import_error
from source_ast_to_js import private_address_binding
from expose_verified_private_storage import expose

def run(args,ok=True):
    p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert (p.returncode==0)==ok,(args,p.stdout,p.stderr)
    return p.stdout

with tempfile.TemporaryDirectory(prefix='source-private-fragments-') as temporary:
    temp=Path(temporary);source=temp/'source';source.mkdir();owner=temp/'owner';fragment=temp/'fragment'
    (source/'helpers.hpp').write_text('static inline int finish_step(int x){return x+9;}\n')
    (source/'owner.cpp').write_text('''
#include "helpers.hpp"
static unsigned short state=65000;
static unsigned short *alias=&state;
static short table[4]={1,2,3,4};
struct Frame {short width,height; unsigned short *data;};
static Frame frame={4,6,0};
extern "C" int owner_read(){return state+table[3]+frame.width+frame.height;}
extern "C" unsigned short *owner_address(){return &state;}
extern "C" int fragment_step(int x){
  unsigned short *p=&state;
  *p += x;
  *alias += 3;
  __builtin_memset(&table,-1,sizeof(table));
  table[3]=x*7;
  __builtin_memset(&frame,0,sizeof(frame));
  frame.width=x;frame.height=x+1;frame.data=&state;*frame.data+=1;
  return p==owner_address() ? finish_step(state+table[0]) : -1;
}
''')
    compiler=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(source),'--source','owner.cpp']
    run(compiler+['--out-dir',str(owner),'--require-record-layouts','--header-dependency-closure'])
    manifest=json.loads((owner/'owner.cpp.manifest.json').read_text())
    # The byte-backed POD object needs no emitted C++ class factory. Its
    # unused pointer-field class lowering remains honestly blocked.
    assert [(r['name'],r.get('reason')) for r in manifest['definitions'] if r['status']=='blocked']==[
        ('Frame','class pointer/reference field requires ownership/alias lowering')],manifest
    cells={r['name']:r for r in manifest['private_storage_exports']}
    assert set(cells)=={'state','alias','table','frame'},cells
    # Upgrade a historical owner by exposing the existing functions, retaining
    # every original byte and exactly the same lazy address identities.
    legacy=temp/'legacy';legacy.mkdir();old=copy.deepcopy(manifest)
    code=(owner/'owner.cpp.mjs').read_text()
    for name,cell in cells.items():code=code.replace('export function '+cell['binding']+'() { return '+private_address_binding('owner.cpp',name)+'(); }','')
    old.pop('private_storage_exports')
    for row in old['definitions']:row.pop('private_storage',None)
    from source_scalar_helpers import declaration as scalar_declaration
    for case,changed in [('initializer',code.replace('65000','64999',1)),
                         ('narrowing',code.replace(scalar_declaration('u32'),scalar_declaration('u32').replace('>>> 0','| 0'))),
                         ('getter',code.replace('get value() { return state; }','get value() { return state + 1; }'))]:
        if changed==code:raise AssertionError('Negative fixture did not change original storage')
        bad=temp/('bad-'+case);bad.mkdir()
        (bad/'owner.cpp.mjs').write_text(changed);(bad/'owner.cpp.manifest.json').write_text(json.dumps(old))
        before_bad=(bad/'owner.cpp.mjs').read_bytes()
        try:expose(owner/'owner.cpp.manifest.json',bad,['state'],temp/'rejected.json')
        except ValueError:pass
        else:raise AssertionError('Unproven storage upgrade accepted')
        assert (bad/'owner.cpp.mjs').read_bytes()==before_bad
    (legacy/'owner.cpp.mjs').write_text(code);(legacy/'owner.cpp.manifest.json').write_text(json.dumps(old))
    original_bytes=(legacy/'owner.cpp.mjs').read_bytes()
    expose(owner/'owner.cpp.manifest.json',legacy,['state','alias','table','frame'],temp/'upgrade.json')
    assert (legacy/'owner.cpp.mjs').read_bytes().startswith(original_bytes)
    manifest=json.loads((legacy/'owner.cpp.manifest.json').read_text());owner=legacy
    index=temp/'symbols.json';index.write_text(json.dumps({name:'owner.cpp' for name in ('state','alias','table','frame','owner_address','owner_read')}))
    run(compiler+['--filter','fragment_step','--out-dir',str(fragment),'--project-symbols',str(index),
        '--import-root',str(owner),'--dependency-closure','--header-dependency-closure'])
    fm=json.loads((fragment/'owner.cpp.manifest.json').read_text())
    assert next(r for r in fm['definitions'] if r['name']=='fragment_step')['status']=='source-first',fm
    assert all(r['name'] in ('fragment_step','Frame') or r.get('source_name')=='finish_step' for r in fm['definitions']),fm
    assert 'finish_step' in fm['dependency_closure']['additional_ast_filters'],fm
    assert not any(r['kind']=='VarDecl' for r in fm['definitions'])
    units={'owner.cpp':{'manifest':manifest,'module':owner/'owner.cpp.mjs'}}
    deps=[r for r in fm['imports'] if r.get('abi')=='source-private-cell/1']
    assert {r['name'] for r in deps}=={'state','alias','table','frame'},deps
    for dep in deps:
        assert storage_import_error(dep,units) is None
        for key,value in [('consumer_source','other.cpp'),('owner_source','other.cpp'),('original_type','double'),('binding','fabricated')]:
            assert storage_import_error({**dep,key:value},units),(key,dep)
    broken=copy.deepcopy(units);broken['owner.cpp']['manifest']['private_storage_exports']=[]
    assert storage_import_error(deps[0],broken)
    missing=temp/'missing.mjs';missing.write_text('export let state=65000;')
    broken=copy.deepcopy(units);broken['owner.cpp']['module']=missing
    assert storage_import_error(deps[0],broken)
    # A different original unit cannot gain private access through a name map.
    (source/'other.cpp').write_text('extern unsigned short state; int forbidden(){state++;return state;}')
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(source),'--source','other.cpp',
         '--out-dir',str(temp/'other'),'--project-symbols',str(index),'--import-root',str(owner)],ok=False)
    native=temp/('native.exe' if os.name=='nt' else 'native')
    driver=temp/'driver.cpp';driver.write_text('#include <stdio.h>\nextern "C" int fragment_step(int); extern "C" int owner_read();\nint main(){for(int i=0;i<256;i++)printf("%d %d\\n",fragment_step(i+1),owner_read());}\n')
    # Evaluate calls in separate statements: printf argument order differs by ABI.
    driver.write_text(driver.read_text().replace('printf("%d %d\\n",fragment_step(i+1),owner_read());','{int v=fragment_step(i+1);printf("%d %d\\n",v,owner_read());}'))
    run(['clang++','-std=c++14',str(source/'owner.cpp'),str(driver),'-o',str(native)])
    expected=[[int(v) for v in line.split()] for line in run([str(native)]).splitlines()]
    runner=temp/'runner.mjs'
    runner.write_text('import {fragment_step} from "./fragment/owner.cpp.mjs";\nimport {owner_read} from "./owner/owner.cpp.mjs";\n'
        'export const actual=Array.from({length:256},(_,i)=>{const v=fragment_step(i+1);return [v,owner_read()];});\n'
        'if(typeof window==="undefined")console.log(JSON.stringify(actual));else window.actual=actual;\n')
    runner.write_text(runner.read_text().replace('./owner/owner.cpp.mjs','./legacy/owner.cpp.mjs'))
    actual=json.loads(run(['node',str(runner)]));assert actual==expected,(actual[:4],expected[:4])
    report={'passed':True,'native_node_cases':len(expected),'private_storage_reinitialized':False,
        'original_address_identity_verified':True,'cross_source_access_rejected':True,'contract_tamper_rejected':True,
        'gameplay_verified':False}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        class Quiet(SimpleHTTPRequestHandler):
            extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
            def log_message(self,*args):pass
        (temp/'index.html').write_text('<script type="module" src="runner.mjs"></script>')
        server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(temp)))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
                page.goto(f'http://127.0.0.1:{server.server_port}/');page.wait_for_function('Array.isArray(window.actual)')
                assert page.evaluate('window.actual')==expected and not errors,errors
                report.update(chromium_cases=len(expected),browser_version=browser.version);browser.close()
        finally:server.shutdown();server.server_close();thread.join()
    (ROOT/'reports/oct23-private-fragment-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
