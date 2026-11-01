"""Recover wide/deep original call graphs; disclose bounded query exhaustion."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run([str(x) for x in args],cwd=ROOT,capture_output=True,text=True,timeout=120)
 assert p.returncode==0,(args,p.stderr[-2000:],p.stdout[-1000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='source-dependency-fixedpoint-',dir=ROOT/'work') as temporary:
 d=Path(temporary);unit=d/'unit.cpp'
 declarations='\n'.join(f'int branch{i}(int);' for i in range(60))+'\nint deep0(int);int left(int);int right(int);'
 bodies='\n'.join(f'int branch{i}(int x){{return x+{i};}}' for i in range(60))
 bodies+='\n'+'\n'.join(f'int deep{i}(int);' for i in range(13))
 bodies+='\n'+'\n'.join(f'int deep{i}(int x){{return deep{i+1}(x)+1;}}' for i in range(12))
 bodies+='\nint deep12(int x){return x*3;}\nint left(int x){return x>0?right(x-1)+1:7;}\nint right(int x){return x>0?left(x-1)+2:9;}'
 entry='extern "C" int entry(int x){return '+'+'.join(f'branch{i}(x)' for i in range(60))+'+deep0(x)+left(x&7);}'
 unit.write_text(declarations+'\n'+entry+'\n'+bodies)
 command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',d,'--source','unit.cpp','--filter','entry','--exact-filter','--dependency-closure','--out-dir',d/'out']
 run(command)
 module=d/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 assert manifest['blocked']==0,manifest
 closure=manifest['dependency_closure']
 assert len(closure['additional_ast_filters'])==75 and not closure['budget_exhausted'],closure
 (d/'run.mjs').write_text('import {entry} from '+json.dumps(module.as_uri())+';for(let x=-64;x<64;x++)console.log(entry(x));')
 actual=run(['node',d/'run.mjs']).splitlines()
 (d/'oracle.cpp').write_text('#include <cstdio>\nextern "C" int entry(int);int main(){for(int x=-64;x<64;x++)printf("%d\\n",entry(x));}')
 run(['clang++',unit,d/'oracle.cpp','-o',d/'oracle.exe'])
 assert actual==run([d/'oracle.exe']).splitlines()
 run(command+['--dependency-query-limit','4'])
 limited=json.loads(module.with_suffix('.manifest.json').read_text())
 assert limited['blocked']>0 and limited['dependency_closure']['budget_exhausted'],limited
 assert len(limited['dependency_closure']['additional_ast_filters'])==4
 assert limited['dependency_closure']['unqueried_references']
print('PASS: 75-declaration wide/deep/cyclic source closure, 128 native comparisons, explicit exhausted-budget blockers')
