"""Native/browser proof of source-owned nested union storage across fragments."""
import copy, functools, json, os, subprocess, sys, tempfile, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_private_record_schema import private_record_schema_compatible
from source_first_global_link import storage_import_error
from source_ast_to_js import private_address_binding
from expose_verified_private_storage import expose

def run(args,ok=True):
    p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert (p.returncode==0)==ok,(args,p.stdout,p.stderr)
    return p.stdout

with tempfile.TemporaryDirectory(prefix='source-private-nested-') as temporary:
    temp=Path(temporary);source=temp/'source';source.mkdir();owner=temp/'owner';fragment=temp/'fragment'
    (source/'owner.cpp').write_text('''
struct Packed {unsigned magic; unsigned char more;} __attribute__((packed));
struct Prime {unsigned v; Packed d;};
struct Table {union {unsigned size; Prime prime;}; unsigned short *items;};
static unsigned short state=123;
static Table table={256,0};
extern "C" int owner_read(){return table.prime.v+table.prime.d.magic+table.prime.d.more+(table.items?*table.items:0);}
extern "C" Table *owner_address(){return &table;}
extern "C" int fragment_step(int x){
  table.size+=x;
  table.prime.d.magic=x*3;
  table.prime.d.more=x;
  table.items=&state;
  *table.items+=x;
  return &table==owner_address() ? table.prime.v+table.prime.d.magic+table.prime.d.more+state : -1;
}
''')
    compiler=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(source),'--source','owner.cpp']
    run(compiler+['--out-dir',str(owner),'--require-record-layouts','--header-dependency-closure'])
    manifest=json.loads((owner/'owner.cpp.manifest.json').read_text())
    for name in ('state','table','owner_read','owner_address','fragment_step'):
        assert next(r for r in manifest['definitions'] if r['name']==name)['status']=='source-first',manifest
    cells={r['name']:r for r in manifest['private_storage_exports']}
    assert set(cells)=={'state','table'},cells
    schema=cells['table']['byte_record'];assert private_record_schema_compatible(schema),schema
    negatives=[]
    bad=copy.deepcopy(schema);bad['fields']['items']['size']=True;negatives.append(bad)
    bad=copy.deepcopy(schema);bad['arrayAlign']=3;negatives.append(bad)
    bad=copy.deepcopy(schema);bad['fields']['items']['offset']=0;negatives.append(bad)
    for second in ({'offset':0,'size':8,'native':'BigUint64Array'}, {'offset':0,'size':8,'pointer':True}):
        negatives.append({'size':8,'align':8,'arrayAlign':1,'union':True,'overlaps':True,
                          'fields':{'pointer':{'offset':0,'size':8,'pointer':True},'other':second}})
    negatives.append({'size':1,'align':1,'arrayAlign':1,'union':False,'overlaps':False,
                      'fields':{'value':{'offset':0,'size':True,'native':'Uint8Array'}}})
    for bad in negatives:assert not private_record_schema_compatible(bad),bad
    # Simulate the saved owner without private exports; retain all its bytes.
    legacy=temp/'legacy';legacy.mkdir();old=copy.deepcopy(manifest);code=(owner/'owner.cpp.mjs').read_text()
    for name,cell in cells.items():code=code.replace('export function '+cell['binding']+'() { return '+private_address_binding('owner.cpp',name)+'(); }','')
    old.pop('private_storage_exports')
    for row in old['definitions']:row.pop('private_storage',None)
    (legacy/'owner.cpp.mjs').write_text(code);(legacy/'owner.cpp.manifest.json').write_text(json.dumps(old))
    original=(legacy/'owner.cpp.mjs').read_bytes()
    expose(owner/'owner.cpp.manifest.json',legacy,['state','table'],temp/'upgrade.json')
    assert (legacy/'owner.cpp.mjs').read_bytes().startswith(original)
    manifest=json.loads((legacy/'owner.cpp.manifest.json').read_text());owner=legacy
    index=temp/'symbols.json';index.write_text(json.dumps({name:'owner.cpp' for name in ('state','table','owner_address','owner_read')}))
    run(compiler+['--filter','fragment_step','--out-dir',str(fragment),'--project-symbols',str(index),
        '--import-root',str(owner),'--dependency-closure','--header-dependency-closure','--require-record-layouts'])
    fm=json.loads((fragment/'owner.cpp.manifest.json').read_text())
    assert next(r for r in fm['definitions'] if r['name']=='fragment_step')['status']=='source-first',fm
    assert not any(r['kind']=='VarDecl' for r in fm['definitions']),fm
    units={'owner.cpp':{'manifest':manifest,'module':owner/'owner.cpp.mjs'}}
    deps=[r for r in fm['imports'] if r.get('abi')=='source-private-cell/1']
    assert {r['name'] for r in deps}=={'state','table'},deps
    for dep in deps:
        assert storage_import_error(dep,units) is None
        for key,value in [('consumer_source','other.cpp'),('owner_source','other.cpp')]:
            assert storage_import_error({**dep,key:value},units)
        if dep.get('byte_record'):
            bad=copy.deepcopy(dep);bad['byte_record']['fields']['items']['offset']=8
            assert storage_import_error(bad,units)
    (source/'other.cpp').write_text('struct Table; extern Table table; Table *forbidden(){return &table;}')
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(source),'--source','other.cpp',
        '--out-dir',str(temp/'other'),'--project-symbols',str(index),'--import-root',str(owner)])
    forbidden=json.loads((temp/'other/other.cpp.manifest.json').read_text())
    assert forbidden['emitted']==0 and forbidden['blocked']==1 and not forbidden['imports'],forbidden
    native=temp/('native.exe' if os.name=='nt' else 'native');driver=temp/'driver.cpp'
    driver.write_text('#include <stdio.h>\nextern "C" int fragment_step(int);extern "C" int owner_read();\nint main(){for(int i=1;i<=256;i++){int v=fragment_step(i);printf("%d %d\\n",v,owner_read());}}\n')
    run(['clang++','-std=c++14',str(source/'owner.cpp'),str(driver),'-o',str(native)])
    expected=[[int(v) for v in line.split()] for line in run([str(native)]).splitlines()]
    runner=temp/'runner.mjs';runner.write_text('import {fragment_step} from "./fragment/owner.cpp.mjs";\nimport {owner_read} from "./legacy/owner.cpp.mjs";\n'
        'export const actual=Array.from({length:256},(_,i)=>{const v=fragment_step(i+1);return [v,owner_read()];});\n'
        'if(typeof window==="undefined")console.log(JSON.stringify(actual));else window.actual=actual;\n')
    actual=json.loads(run(['node',str(runner)]));assert actual==expected,(actual[:4],expected[:4])
    report={'passed':True,'native_node_cases':len(expected),'private_storage_reinitialized':False,
        'original_address_identity_verified':True,'nested_union_alias_verified':True,
        'cross_source_access_rejected':True,'contract_tamper_rejected':True,
        'pointer_overlap_rejected':True,'schema_negative_cases':len(negatives),'gameplay_verified':False}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        class Quiet(SimpleHTTPRequestHandler):
            extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
            def log_message(self,*args):pass
        class Server(ThreadingHTTPServer):request_queue_size=128
        (temp/'index.html').write_text('<script type="module" src="runner.mjs"></script>')
        server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(temp)))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
                page.goto(f'http://127.0.0.1:{server.server_port}/');page.wait_for_function('Array.isArray(window.actual)')
                assert page.evaluate('window.actual')==expected and not errors,errors
                report.update(chromium_cases=len(expected),browser_version=browser.version);browser.close()
        finally:server.shutdown();server.server_close();thread.join()
    (ROOT/'reports/oct26-private-nested-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
