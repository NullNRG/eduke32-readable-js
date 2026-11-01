"""Native differential probe for original CircularQueue, using current services."""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
SOURCE=ROOT/PROFILE['prepared_source_root'];MODULES=ROOT/PROFILE['boot_module_root']
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1600:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='original-queue-',dir=ROOT/'work') as temporary:
    root=Path(temporary);cpp=root/'queue.cpp'
    cpp.write_text('''#include "lru.h"
extern "C" int exercise(int n){CircularQueue<char*,16,RF_INIT> q;char bytes[32];
 for(int j=0;j<31;j++){bytes[j]=(n+j)&127;char*value=bytes+j;q.pushBack(value);}
 const auto &c=q;int value=*c.front()+*c.back()+c.size()+*q[3];q.front()=bytes+1;
 q.popFront();value+=*q.front()+q.capacity()+q.backIndex()+q.frontIndex();q.clear();return value+q.size();}
''')
    flags=['-std=gnu++14','-funsigned-char','-DNOASM','-DNDEBUG','-DEDUKE32_BROWSER=1']
    flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/audiolib/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
    main=root/'main.cpp';main.write_text('#include <cstdio>\nextern "C" int exercise(int);\nint main(){for(int n=-128;n<128;n++)printf("%d\\n",exercise(n));}')
    exe=root/'oracle.exe';run(['clang++','-O2',*flags,cpp,main,'-o',exe]);expected=run([exe]).splitlines()
    out=root/'out';source=cpp.relative_to(ROOT).as_posix()
    commands=root/'commands.json';commands.write_text(json.dumps([{'directory':str(ROOT),'file':source,
        'arguments':['clang++',*flags,'-c',source,'-o','unused.o']}]))
    print(run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',ROOT,'--source',source,'--out-dir',out,
        '--compile-commands',commands,
        '--filter','exercise','--exact-filter','--dependency-closure','--header-dependency-closure','--header-inlines',
        '--project-symbols',MODULES/'browser-combined-symbol-owners.json','--import-root',MODULES]))
    module=out/(source+'.mjs');manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    print(json.dumps({'definitions':[(r['name'],r['status'],r.get('reason')) for r in manifest['definitions']],
        'destructors':manifest['template_destructor_closure']},indent=2))
    assert next(r for r in manifest['definitions'] if r['name']=='exercise')['status']=='source-first'
    driver=root/'check.mjs';driver.write_text('''import {NativeRuntime} from '''+json.dumps((ROOT/'runtime/index.mjs').as_uri())+''';
const r=new NativeRuntime();r.bindSourceMemory();const base='''+json.dumps(MODULES.as_uri())+''';
const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(r);
(await import(base+'/source/build/src/baselayer.cpp.mjs')).engineSetupAllocator();
const m=await import('''+json.dumps(module.as_uri())+''');try{for(let n=-128;n<128;n++)console.log(m.exercise(n));}finally{release();r.close();}''')
    actual=run(['node',driver]).splitlines();assert actual==expected,next(((i,a,b)for i,(a,b)in enumerate(zip(actual,expected))if a!=b),None)
    print('PASS 256 original CircularQueue native/Node comparisons')
