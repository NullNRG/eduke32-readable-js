"""Native aggregate addresses cross real libc services without losing storage."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=120)
    assert p.returncode==0,(p.stdout[-1300:],p.stderr[-2800:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='source-aggregate-host-',dir=ROOT/'work') as temporary:
    root=Path(temporary);owner=root/'owner';fragment=root/'fragment';source=root/'unit.cpp'
    source.write_text('''extern "C" void *memset(void*,int,unsigned long);
struct Data {unsigned short code;unsigned char tail;};
static unsigned short pixels[32];static Data record={91,13};static unsigned char *pointer=(unsigned char*)pixels;
extern "C" void fill(){memset(&pixels,255,sizeof(pixels));memset(&record,0,sizeof(record));}
extern "C" int read_state(int i){return pixels[i]+record.code+record.tail;}
extern "C" bool alias(){return (void*)&pixels==(void*)pixels;}
extern "C" unsigned char **pointer_slot(){return &pointer;}
''')
    compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp']
    run([*compiler,'--filter','pixels,record,pointer,read_state','--exact-filter','--dependency-closure','--require-record-layouts','--out-dir',owner])
    service=owner/'services.mjs';service.write_text('import {NativeRuntime} from '+json.dumps((ROOT/'runtime/index.mjs').as_uri())+''';
const runtime=new NativeRuntime();runtime.bindSourceMemory();
export const memset=runtime.library.symbols.memset;
export const close=()=>runtime.close();
''')
    service.with_suffix('.manifest.json').write_text(json.dumps({'native_pointer_abi':'source-lp64-addresses/2'}))
    symbols=root/'symbols.json';symbols.write_text(json.dumps({'memset':'services'}))
    run([*compiler,'--filter','fill,alias,pointer_slot','--exact-filter','--dependency-closure',
        '--project-symbols',symbols,'--import-root',owner,'--out-dir',fragment])
    module=fragment/'unit.cpp.mjs';document=json.loads(module.with_suffix('.manifest.json').read_text())
    assert document['blocked']==0,document['definitions']
    driver=root/'check.mjs';driver.write_text('import * as m from '+json.dumps(module.as_uri())+';import * as o from '+json.dumps((owner/'unit.cpp.mjs').as_uri())+';import {close} from '+json.dumps(service.as_uri())+''';
try{m.fill();for(let i=0;i<32;i++)console.log(`${o.read_state(i)},${+m.alias()}`);
 if(m.pointer_slot().__cReference!==true)throw Error('Pointer slot was mistaken for its pointee bytes');
}finally{close();}
''')
    main=root/'main.cpp';main.write_text('#include <cstdio>\nextern "C" void fill();extern "C" int read_state(int);extern "C" bool alias();\nint main(){fill();for(int i=0;i<32;i++)printf("%d,%d\\n",read_state(i),alias());}')
    exe=root/'oracle.exe';run(['clang++','-std=c++14',source,main,'-o',exe]);expected=run([exe]).splitlines()
    assert run(['node',driver]).splitlines()==expected
print('PASS 64 native values: original array/record addresses, identical pointer base, real host memset and retained pointer-to-pointer slot identity')
