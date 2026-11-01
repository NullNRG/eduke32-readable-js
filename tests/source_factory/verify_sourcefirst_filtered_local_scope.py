"""Clang name filters must not promote locals to global JavaScript storage."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory(prefix='filtered-local-scope-',dir=ROOT/'work') as directory:
 p=Path(directory);(p/'unit.cpp').write_text('''int numwalls=7;
int original(){int numwallsofloop=3;const int danumwalls=numwalls+numwallsofloop;static int numwalls_local=9;return danumwalls+numwalls_local++;}
extern "C" int inspect(){return original();}
''')
 command=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(p),'--source','unit.cpp','--filter','numwalls','--out-dir',str(p/'out')]
 result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True);assert result.returncode==0,(result.stdout,result.stderr)
 m=json.loads((p/'out/unit.cpp.manifest.json').read_text());assert [r['name'] for r in m['definitions']]==['numwalls'],m
 # Full function lowering must still preserve the actual local lifetimes.
 command[command.index('numwalls')]='original,inspect'
 command+=['--dependency-closure']
 result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True);assert result.returncode==0,(result.stdout,result.stderr)
 m=json.loads((p/'out/unit.cpp.manifest.json').read_text());assert not any(r['name'] in ('numwallsofloop','danumwalls','numwalls_local') for r in m['definitions']),m
 js='import {inspect} from '+json.dumps((p/'out/unit.cpp.mjs').as_uri())+';console.log([inspect(),inspect(),inspect()].join(","));'
 result=subprocess.run(['node','--input-type=module','-e',js],capture_output=True,text=True);assert result.returncode==0,result.stderr
 assert result.stdout.strip()=='19,20,21',result.stdout
 # Exact recovery must not pull similarly named unrelated declarations into
 # the startup graph. This is independent of Clang's substring query syntax.
 command=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(p),'--source','unit.cpp','--filter','original','--exact-filter','--dependency-closure','--out-dir',str(p/'exact')]
 (p/'unit.cpp').write_text('int original(){return 17;} int unrelated_original(){return 91;}')
 result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True);assert result.returncode==0,(result.stdout,result.stderr)
 m=json.loads((p/'exact/unit.cpp.manifest.json').read_text());assert [r['name'] for r in m['definitions']]==['original'],m
print('PASS: matching automatic/const/static locals excluded from global inventory; original local lifetimes and exact declaration selection verified')
