"""New fragment globals retain one live address through later source imports."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd=ROOT):
 p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=120)
 assert p.returncode==0,(p.stdout[-1200:],p.stderr[-2400:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='new-fragment-storage-',dir=ROOT/'work') as directory:
 p=Path(directory);target=p/'target';source=p/'unit.cpp'
 source.write_text('''int retained=7;int added=11;static int secret=19;
extern "C" int base(){return retained;}
extern "C" void step(int n){added+=retained+n;secret+=n*3;}
extern "C" int read_state(){return added+secret;}
extern "C" int *address(){return &added;}
''')
 compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',p,'--source','unit.cpp']
 run([*compiler,'--filter','retained,base','--out-dir',target])
 symbols=p/'symbols.json';symbols.write_text(json.dumps({'retained':'unit.cpp','base':'unit.cpp'}))
 first=p/'first'
 run([*compiler,'--filter','added,secret,step','--out-dir',first,'--project-symbols',symbols,'--import-root',target])
 installer=[sys.executable,ROOT/'tools/install_verified_fragment.py','--target',target]
 run([*installer,'--manifest',first/'unit.cpp.manifest.json','--exports','added','secret','step','--report',p/'installed.json'])
 owner=json.loads((target/'unit.cpp.manifest.json').read_text())
 added=next(r for r in owner['definitions'] if r['name']=='added')['global_storage']['binding']
 secret=next(r for r in owner['definitions'] if r['name']=='secret')['private_storage']['binding']
 first_record=owner['module_fragments'][0]
 assert {added,secret}<=set(first_record['reexports'])
 assert any(r['name']=='added' for r in owner['storage_exports'])
 assert any(r['name']=='secret' for r in owner['private_storage_exports'])
 # Internal cells enter only this same-unit fragment's private symbol map.
 symbols.write_text(json.dumps({name:'unit.cpp' for name in ('retained','base','added','step')}))
 second=p/'second'
 # A complete type-context retry sees every VarDecl again. Private `secret`
 # is absent from the global provider map. Both cases must retain the actual
 # owner cells rather than quietly capture duplicate fragment storage.
 run([*compiler,'--out-dir',second,'--project-symbols',symbols,'--import-root',target])
 manifest=json.loads((second/'unit.cpp.manifest.json').read_text())
 assert not any(r['kind']=='VarDecl' for r in manifest['definitions']),manifest
 run([*installer,'--manifest',second/'unit.cpp.manifest.json','--exports','read_state','address','--report',p/'second.json'])
 main=p/'main.cpp';main.write_text('''#include <cstdio>
extern int added;extern "C" void step(int);extern "C" int read_state();extern "C" int*address();
int main(){for(int i=0;i<256;i++){step(i%11-5);printf("%d,%d,%d\\n",read_state(),added,address()==&added);}}
''')
 exe=p/'native.exe';run(['clang++','-std=c++14',source,main,'-o',exe]);expected=run([exe]).splitlines()
 driver=p/'check.mjs';driver.write_text('import * as m from '+json.dumps((target/'unit.cpp.mjs').as_uri())+';\n'
   +'for(let i=0;i<256;i++){m.step(i%11-5);console.log(`${m.read_state()},${m.added},${+(m.address()===m['+json.dumps(added)+']())}`);}\n')
 assert run(['node',driver]).splitlines()==expected
 # The installer independently rejects a duplicate even if only a new
 # function was requested for re-export. Audit before touching the owner.
 before=(target/'unit.cpp.mjs').read_bytes()
 malformed=json.loads((second/'unit.cpp.manifest.json').read_text())
 malformed['definitions'].append({'name':'secret','kind':'VarDecl','status':'source-first'})
 bad=p/'duplicate.manifest.json';bad.write_text(json.dumps(malformed))
 attempt=subprocess.run(list(map(str,[*installer,'--manifest',bad,'--exports','unpublished',
     '--report',p/'bad.json'])),cwd=ROOT,capture_output=True,text=True)
 assert attempt.returncode and 'duplicates existing original storage: secret' in attempt.stderr,attempt.stderr
 assert (target/'unit.cpp.mjs').read_bytes()==before
print('PASS 768 native values: recovered public/private storage, live ESM exports and one stable address across three source fragments')
