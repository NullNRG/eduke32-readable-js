"""Original AtomicSList64 methods over native-constructed object snapshots.

This deliberately does not claim JavaScript construction or console startup.
"""
import base64,functools,hashlib,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
SOURCE=ROOT/PROFILE['prepared_source_root']
def run(args):
    task=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=240)
    assert task.returncode==0,(args,task.stdout[-1800:],task.stderr[-3500:]);return task.stdout
with tempfile.TemporaryDirectory(prefix='original-atomic-list-',dir=ROOT/'work') as folder:
    root=Path(folder);header=root/'fixture.hpp';cpp=root/'list.cpp'
    original_header=SOURCE/'source/build/include/atomiclist.h'
    # One exact original header copy keeps the test's semantic root free of
    # archived duplicate trees. No original game source/config is modified.
    (root/'atomiclist.h').write_bytes(original_header.read_bytes())
    header.write_text('''#include "atomiclist.h"
struct Item:AtomicSListNode<Item>{int value;};
struct Container{AtomicSList64<Item> pending;Item nodes[4];};
''')
    cpp.write_text('''#include "fixture.hpp"
extern "C" int exercise(Container*p,int n){
 int result=p->pending.isEmpty()?1:0;
 for(int i=0;i<4;i++){
  int index=(n+i)&3;
  p->pending.push(&p->nodes[index]);
  result+=p->pending.first()==&p->nodes[index]?17:0;
 }
 Item *cursor=p->pending.first();
 for(int i=0;i<4;i++){
  int index=(n+3-i)&3;
  result+=cursor==&p->nodes[index]?101:0;
  result+=cursor->value;
  cursor=cursor->m_next;
 }
 result+=(cursor==nullptr?1009:0)+(p->pending.isEmpty()?0:2017);
 for(int i=0;i<4;i++){
  int index=(n+3-i)&3;Item*taken=p->pending.pop();
  result+=(taken==&p->nodes[index]?503:0)+taken->value;
 }
 return result+(p->pending.isEmpty()?3001:0)+(p->pending.pop()==nullptr?4001:0);
}
''')
    main=root/'main.cpp';main.write_text('''#include "fixture.hpp"
#include <cstdio>
extern "C" int exercise(Container*,int);
int main(){for(int n=0;n<256;n++){Container object{};
 for(int i=0;i<4;i++)object.nodes[i].value=n*103+i*17;
 auto bytes=(unsigned char*)&object;
 for(unsigned i=0;i<sizeof(object);i++)printf("%02x",bytes[i]);
 printf(" %d\\n",exercise(&object,n));}}
''')
    flags=['-std=gnu++14','-funsigned-char','-DNOASM','-DNDEBUG','-DEDUKE32_BROWSER=1']
    flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/audiolib/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
    oracle=root/'oracle.exe';run(['clang++','-O2',*flags,cpp,main,'-o',oracle]);cases=[line.split() for line in run([oracle]).splitlines()]
    ir=root/'original-list-native.ll'
    run(['clang++','-O1','-S','-emit-llvm',*flags,cpp,'-o',ir])
    native_cmpxchg=[line.strip() for line in ir.read_text().splitlines() if 'cmpxchg' in line]
    assert native_cmpxchg,native_cmpxchg
    print(json.dumps({'native_gnupp14_original_cmpxchg':native_cmpxchg}),flush=True)
    source=cpp.name;out=root/'out';commands=root/'commands.json'
    commands.write_text(json.dumps([{'directory':str(root),'file':source,'arguments':['clang++',*flags,'-c',source,'-o','unused.o']}]))
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source',source,'--out-dir',out,
        '--compile-commands',commands,'--filter','exercise','--exact-filter','--dependency-closure',
        '--header-dependency-closure','--require-record-layouts'])
    module=out/(source+'.mjs');manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    row=next(row for row in manifest['definitions'] if row['name']=='exercise')
    assert row['status']=='source-first',[(r['name'],r['status'],r.get('reason')) for r in manifest['definitions']]
    methods=[row['original_byte_method'] for row in manifest['definitions'] if row.get('original_byte_method')]
    original=[row for row in methods if Path(row['source_header']).name=='atomiclist.h']
    assert {'push','pop','first','isEmpty'}<={row['original_name'] for row in original},original
    js='''async({url,cases})=>{const {exercise}=await import(url);return cases.map((row,n)=>{
 const bytes=Uint8Array.from(row[0].match(/../g),x=>parseInt(x,16));return String(exercise(bytes,n));});}'''
    runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps({'url':module.as_uri(),'cases':cases})+')));')
    wanted=[row[1] for row in cases];observed=json.loads(run(['node',runner]));assert observed==wanted,(observed[:3],wanted[:3])
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
        try:
            page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            observed=page.evaluate(js,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode(),'cases':cases})
            assert observed==wanted and not errors,(observed[:3],wanted[:3],errors)
            version=browser.version
        finally:browser.close()
    report={'format':'original-atomic-list-native-parity/1','passed':True,'native_node_chromium_cases':256,
        'browser_version':version,'page_errors':errors,'original_methods':['push','pop','first','isEmpty'],
        'source_header':'source/build/include/atomiclist.h',
        'header_sha256':hashlib.sha256((SOURCE/'source/build/include/atomiclist.h').read_bytes()).hexdigest(),
        'fixture_sha256':hashlib.sha256(cpp.read_bytes()).hexdigest(),
        'fixture_header_is_byte_identical_to_original':(root/'atomiclist.h').read_bytes()==original_header.read_bytes(),
        'compiler_frontend_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
        'compiler_and_runtime_helpers':{str(path.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(path.read_bytes()).hexdigest()
            for path in sorted((ROOT/'tools').glob('source_*')) if path.suffix in ('.py','.mjs')},
        'emitted_module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),
        'methods':methods,'original_cpp_lifetimes_executed_by_native_oracle':True,
        'javascript_constructed_list_or_nodes':False,'pop_verified':True,
        'native_gnupp14_original_cmpxchg':native_cmpxchg,
        'console_initialization_verified':False,'gameplay_verified':False}
    (ROOT/'reports/nov02-original-atomic-list-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='methods'},indent=2))
