"""A generated new C must require a source owner; proven POD zeroing must not."""
from pathlib import Path
import json,os,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
def run(command,cwd):
 result=subprocess.run(command,cwd=cwd,capture_output=True,text=True,timeout=90)
 assert result.returncode==0,(command,result.stdout[-1000:],result.stderr[-2000:])
 return result.stdout
with tempfile.TemporaryDirectory(prefix='eduke-ctor-provider-') as scratch:
 tmp=Path(scratch)
 (tmp/'types.h').write_text('struct Hidden {int value; Hidden();};\nusing HiddenAlias=Hidden;\n'
  'typedef struct {int values[2];struct {int mark;} nested;} Shape;\n')
 (tmp/'unit.cpp').write_text('#include "types.h"\nHiddenAlias phantom;\nShape storage;\n'
  'extern "C" int pod_value(int i){storage.values[i%2]=i;storage.nested.mark+=i;'
  'return storage.values[(i+1)%2]+storage.nested.mark;}\n')
 out=tmp/'generated'
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(tmp),'--source','unit.cpp',
      '--out-dir',str(out)],tmp)
 module=out/'unit.cpp.mjs'
 manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 rows={d.get('source_name',d['name']):d for d in manifest['definitions']}
 phantom=rows['phantom']
 assert phantom['status']=='blocked' and phantom['unresolved_references']==['Hidden'],phantom
 assert phantom['emitted_constructor_providers']==['Hidden'],phantom
 assert rows['storage']['status']==rows['pod_value']['status']=='source-first',rows
 assert not rows['storage'].get('emitted_constructor_providers'),rows['storage']
 assert 'export let phantom' not in module.read_text()
 # Supply the original missing native constructor only to link the oracle;
 # it is deliberately unavailable to source-first compilation above.
 (tmp/'native.cpp').write_text('#include "types.h"\n#include <cstdio>\nHidden::Hidden():value(17){}\n'
  'extern "C" int pod_value(int);\nint main(){for(int i=0;i<256;i++)printf("%d\\n",pod_value(i));}\n')
 native=tmp/('native.exe' if os.name=='nt' else 'native')
 run(['clang++','-std=c++14','unit.cpp','native.cpp','-o',str(native)],tmp)
 expected=run([str(native)],tmp).splitlines()
 (tmp/'run.mjs').write_text('import * as s from '+json.dumps(module.as_uri())+';\n'
  +'for(let i=0;i<256;i++)console.log(s.pod_value(i));\n')
 assert run(['node','run.mjs'],tmp).splitlines()==expected
 print('PASS 256 native values and constructor owner guard: unresolved alias-normalized new Hidden blocked, named anonymous POD zero storage requires no class constructor')
