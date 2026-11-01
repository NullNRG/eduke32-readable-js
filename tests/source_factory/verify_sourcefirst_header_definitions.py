"""Recover header-instantiated C functions only in the proven selected owner."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_standard_heap_contract import create as heap_contract,validate as validate_program
from source_header_definitions import create,load
def run(args):
 p=subprocess.run([str(x) for x in args],cwd=ROOT,capture_output=True,text=True,timeout=150)
 assert p.returncode==0,(args,p.stderr[-2200:],p.stdout[-800:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='source-header-definitions-',dir=ROOT/'work') as temporary:
 d=Path(temporary)
 (d/'library.h').write_text('''extern "C" int library(int);
#ifdef IMPLEMENT_LIBRARY
extern "C" int library(int value){return value*7+13;}
#endif
extern "C" int ambiguous(int value){return value+2;}
''')
 (d/'owner.cpp').write_text('#define IMPLEMENT_LIBRARY\n#include "library.h"\n')
 (d/'consumer.cpp').write_text('#include "library.h"\nextern "C" int entry(int x){return library(x);}\n')
 commands=d/'commands.json';commands.write_text(json.dumps([{'file':name,'directory':str(d),'arguments':['g++','-std=c++14','-c',name]} for name in ('owner.cpp','consumer.cpp')]))
 database=d/'index.sqlite'
 run([sys.executable,ROOT/'tools/source_semantic_index.py','--root',d,'--commands',commands,'--out',database])
 heap_contract(d,commands,database);contract=create(d,commands,database)
 owners,proof=load(d,commands,validate_program(d,commands))
 assert 'library' in owners,contract
 assert owners['library']['owner']=='owner.cpp',owners
 assert 'ambiguous' not in owners and any(r['name']=='ambiguous' for r in contract['evidence']['rejected'])
 output=d/'out'
 emit=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',d,'--compile-commands',commands,'--out-dir',output]
 run(emit+['--source','owner.cpp','--filter','library','--exact-filter'])
 manifest=json.loads((output/'owner.cpp.manifest.json').read_text())
 row=next(r for r in manifest['definitions'] if r['name']=='library')
 assert row['status']=='source-first' and row['header_definition_owner']['owner']=='owner.cpp',row
 # Observing a declaration is insufficient to claim its implementation.
 run(emit+['--source','consumer.cpp','--filter','library','--exact-filter'])
 observation=json.loads((output/'consumer.cpp.manifest.json').read_text())
 assert observation['emitted']==0,observation
 symbols=d/'symbols.json';symbols.write_text(json.dumps({'library':'owner.cpp'}))
 run(emit+['--source','consumer.cpp','--filter','entry','--project-symbols',symbols])
 (d/'run.mjs').write_text('import {entry} from '+json.dumps((output/'consumer.cpp.mjs').as_uri())+';for(let x=-128;x<128;x++)console.log(entry(x));')
 actual=run(['node',d/'run.mjs']).splitlines()
 # The duplicate-definition negative fixture stays outside the native link.
 (d/'native.txt').write_text('#include <cstdio>\n#define IMPLEMENT_LIBRARY\n#include "library.h"\nint main(){for(int x=-128;x<128;x++)printf("%d\\n",library(x));}')
 run(['clang++','-x','c++',d/'native.txt','-o',d/'native.exe']);assert actual==run([d/'native.exe']).splitlines()
 path=commands.with_suffix('.header-definitions.json');tampered=json.loads(path.read_text());tampered['evidence']['definitions'][0]['owner']='consumer.cpp';path.write_text(json.dumps(tampered))
 try:load(d,commands,validate_program(d,commands));raise AssertionError('Fabricated header owner accepted')
 except ValueError as error:assert 'ownership evidence changed' in str(error),error
print('PASS: 256 native source/header JS values, exact selected-unit ownership, declaration-only and multi-owner rejection, fabricated-owner rejection')
