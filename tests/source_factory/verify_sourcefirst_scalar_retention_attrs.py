"""Original used/unused/asm-label scalars retain C initialization and aliases."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE='''
int __attribute__((used)) zero;
int __attribute__((used)) value = 37;
const int __attribute__((used)) constant = 19;
long long __attribute__((unused)) wide = 0x123456789LL;
int named __asm__("retained_native_symbol");
int * __attribute__((used)) alias = &zero;
int check(int n) {
 int const initial=zero+named;
 *alias=n;value+=n%7;named=n%13;
 return initial+*alias+value+constant+(int)(wide>>24);
}
'''
def run(command,cwd):
 result=subprocess.run(list(map(str,command)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert result.returncode==0,(result.stdout[-1800:],result.stderr[-2500:])
 return result.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-scalar-retention-') as temporary:
 root=Path(temporary);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=0;n<512;n++)printf("%d\\n",check(n));}')
 run(['clang++','main.cpp','-o',root/'native.exe'],root)
 expected=run([root/'native.exe'],root)
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/'out'],root)
 module=root/'out/unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
 assert doc['blocked']==0,[(r['name'],r.get('reason')) for r in doc['definitions'] if r['status']=='blocked']
 (root/'run.mjs').write_text('const m=await import('+json.dumps(module.as_uri())+');console.log(Array.from({length:512},(_,n)=>m.check(n)).join("\\n"));')
 assert run(['node',root/'run.mjs'],root)==expected
print('PASS: 512 native/JS scalar states, original zero/constant/wide initialization, asm-label identity and pointer writes; retention annotations are not initializer expressions')
