"""Anonymous enum evidence must survive later independent dependency queries."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run([str(x) for x in args],cwd=ROOT,capture_output=True,text=True,timeout=90)
 assert p.returncode==0,(args,p.stderr[-2000:],p.stdout[-1000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='source-late-enum-',dir=ROOT/'work') as temporary:
 d=Path(temporary);(d/'unit.cpp').write_text('''struct Values {int value;Values(int x):value(x){} int operator[](int) const{return value;}};
typedef enum {FirstValue=17,LaterValue /*!< original source documentation */} Code;
int helper(int);
extern "C" int entry(int x){Values v(x);return v.operator[](0)+helper(x);}
int helper(int x){return x+LaterValue;}
''')
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',d,'--source','unit.cpp','--filter','entry','--exact-filter','--dependency-closure','--enum-closure','--out-dir',d/'out'])
 module=d/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 assert manifest['blocked']==0,manifest
 assert manifest['full_type_closure']['attempted'] and manifest['enum_closure']['proven_values']['LaterValue']==18,manifest
 (d/'run.mjs').write_text('import {entry} from '+json.dumps(module.as_uri())+';for(let x=-128;x<128;x++)console.log(entry(x));')
 observed=run(['node',d/'run.mjs']).splitlines()
 (d/'oracle.cpp').write_text('#include <cstdio>\nextern "C" int entry(int);int main(){for(int x=-128;x<128;x++)printf("%d\\n",entry(x));}')
 run(['clang++',d/'unit.cpp',d/'oracle.cpp','-o',d/'oracle.exe']);assert observed==run([d/'oracle.exe']).splitlines()
print('PASS: 256 native cases; full same-TU anonymous enum retained across later independent declaration queries')
