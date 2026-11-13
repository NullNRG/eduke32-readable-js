"""Native scalar reference members retain target bytes and static temporary lifetime."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
short sound=7;
int mutable_sound=11;
struct Cue { const int &sound; unsigned char frame; };
struct MutableCue { int &sound; unsigned char frame; };
struct CueTable { const Cue *sounds; unsigned count; };
int reject_automatic_temporary(){const Cue local={42,3};return local.sound;}
int exercise(int n) {
 sound=(short)n; mutable_sound=n+3;
 static const Cue converted[]={{sound,1},{sound,19}};
 static const Cue aliases[]={{mutable_sound,2},{mutable_sound,8}};
 Cue copy=converted[0];
 MutableCue direct={mutable_sound,5};
 direct.sound+=4;
 static const CueTable tables[]={{converted,2},{aliases,2}};
 int total=0;
 for(const CueTable &table:tables) {
  for(unsigned i=0;i<table.count;++i) {
   const Cue &source=table.sounds[i]; total+=source.sound+source.frame;
  }
 }
 return converted[0].sound*3+converted[1].sound*7+copy.sound*11
   +aliases[0].sound*13+aliases[1].sound*17+direct.frame
   +1000*(&converted[0].sound!=&converted[1].sound)
   +2000*(&copy.sound==&converted[0].sound)
   +4000*(&aliases[0].sound==&mutable_sound)+total;
}
'''
def run(args,cwd=ROOT):
 r=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert r.returncode==0,(args,r.stdout[-1200:],r.stderr[-2500:]);return r.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-reference-members-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=-512;n<512;n++)printf("%d\\n",exercise(n));}')
 run(['clang++','-std=c++14',root/'main.cpp','-o',root/'native.exe'])
 expected=run([root/'native.exe']).splitlines();modules=[]
 evaluator='''async({url})=>{const m=await import(url),rows=[];for(let n=-512;n<512;n++)rows.push(String(m.exercise(n)));return rows;}'''
 for mode in ('full','filtered'):
  args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode,'--require-record-layouts']
  if mode=='filtered':args+=['--filter','exercise','--exact-filter','--dependency-closure','--header-dependency-closure']
  run(args);module=root/mode/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
  assert next(r for r in doc['definitions'] if r['name']=='exercise')['status']=='source-first',[(r['name'],r.get('reason')) for r in doc['definitions'] if r['status']=='blocked']
  if mode=='full':
   rejected=next(r for r in doc['definitions'] if r['name']=='reject_automatic_temporary')
   assert rejected['status']=='blocked' and 'static lifetime' in rejected['reason'],rejected
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps({'url':module.as_uri()})+')).join("\\n"));')
  assert run(['node',root/'run.mjs']).splitlines()==expected;modules.append(module)
 if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True);page=browser.new_page()
   for module in modules:assert page.evaluate(evaluator,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()})==expected
   browser.close()
print('PASS: 2048 native/full/filtered Node and optional Chromium reference-member results; static conversions, shared mutable lvalues, distinct temporary addresses and trivial copies')
