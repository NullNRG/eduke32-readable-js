"""Native-sized integer arrays remain scalar arrays in filtered source recovery."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=120)
    assert p.returncode==0,(args,p.stdout[-1200:],p.stderr[-2400:]);return p.stdout
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='native-integer-pointers-') as name:
    root=Path(name)
    (root/'unit.cpp').write_text('''#include <stdint.h>
#include <stddef.h>
extern "C" intptr_t signed_handle(intptr_t *handles,int i,intptr_t value){
 handles[i]=value;return handles[i];}
extern "C" uintptr_t unsigned_handle(uintptr_t *handles,int i,uintptr_t value){
 handles[i]^=value;return handles[i];}
extern "C" size_t sizes(size_t *values,int i,size_t value){values[i]+=value;return values[i];}
extern "C" ptrdiff_t offsets(ptrdiff_t *values,int i,ptrdiff_t value){values[i]-=value;return values[i];}
''')
    (root/'main.cpp').write_text('''#include <stdio.h>
#include <stdint.h>
#include <stddef.h>
extern "C" intptr_t signed_handle(intptr_t*,int,intptr_t);
extern "C" uintptr_t unsigned_handle(uintptr_t*,int,uintptr_t);
extern "C" size_t sizes(size_t*,int,size_t);
extern "C" ptrdiff_t offsets(ptrdiff_t*,int,ptrdiff_t);
int main(){intptr_t a[3]={-1,3,5};uintptr_t b[3]={1,3,5};size_t c[3]={0};ptrdiff_t d[3]={0};
for(int i=0;i<256;i++){intptr_t x=0x100000000LL+i*31;
 printf("%lld,%llu,%llu,%lld\\n",(long long)signed_handle(a,i%3,-x),
 (unsigned long long)unsigned_handle(b,i%3,(uintptr_t)x),
 (unsigned long long)sizes(c,i%3,(size_t)x),(long long)offsets(d,i%3,x));}}
''')
    exe=root/'oracle.exe';run(['clang++',root/'unit.cpp',root/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
    for filtered in (False,True):
        out=root/str(filtered)
        args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out]
        if filtered:args+=['--filter','signed_handle,unsigned_handle,sizes,offsets','--exact-filter']
        run(args);module=out/'unit.cpp.mjs'
        manifest=json.loads(module.with_suffix('.manifest.json').read_text())
        assert manifest['blocked']==0,manifest
        runner=root/'run.mjs';runner.write_text('import * as m from '+json.dumps(module.as_uri())+''';
const a=new BigInt64Array([-1n,3n,5n]),b=new BigUint64Array([1n,3n,5n]),c=new BigUint64Array(3),d=new BigInt64Array(3);
for(let i=0;i<256;i++){const x=0x100000000n+BigInt(i*31);console.log([
m.signed_handle(a,i%3,-x),m.unsigned_handle(b,i%3,x),m.sizes(c,i%3,x),m.offsets(d,i%3,x)].join(','));}
''')
        actual=run(['node',runner]).splitlines();assert actual==expected,(filtered,actual[:3],expected[:3])
print('PASS 2048 native/JS results: intptr_t, uintptr_t, size_t, ptrdiff_t pointees in full and filtered recovery')
