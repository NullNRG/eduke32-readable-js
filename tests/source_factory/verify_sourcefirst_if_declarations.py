"""Native C++ if condition declarations retain evaluation order and branch scope."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
int calls;
int next(int value){calls+=1;return value;}
double next_float(double value){calls+=1;return value;}
int floating(double value){calls=0;if(double x=next_float(value))return 7+calls*100;else return -9+calls*100;}
int casts(double value){return ((bool)value)*3+static_cast<bool>(value)*5+bool(value)*7;}
struct Font {int* pixels;};
int lookup(Font font,int n){return font.pixels[n&1];}
int aggregate(int n){int pixels[2]={n,n+1};Font font={pixels};if(auto tile=lookup(font,n))return tile*3;return -7;}
int scalar(int n){calls=0;int x=91;int total=0;
 if(int x=next(n)) {total=x*7; if(int x=next(n-1))total+=x*11;else total-=x+3;}
 else {total=x-17;}
 return total+calls*1000+x;
}
int with_init(int n){calls=0;int total=0;
 if(int initial=next(n+5); int condition=next(initial-5)){total=initial+condition*3;}
 else total=initial-condition*7;
 return total+calls*100;
}
int pointers(int n){int values[3]={n,n+3,n+7};int total=0;
 for(int i=0;i<5;i++){if(int* p=(i&1)?values+1:nullptr){*p+=i;total+=*p;continue;}
 else {total+=p==nullptr?17:999;}total+=3;}
 return total+values[1]*31;
}
enum Choice {zero=0,other=2};
int enums(int n){if(Choice selected=n?other:zero)return selected+9;else return selected-7;}
struct Condition {Condition(int n):v(n){} operator bool()const{return v!=0;}int v;};
int reject_object(int n){if(Condition value=n)return 1;else return 0;}
'''
def run(args,cwd=ROOT):
 r=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert r.returncode==0,(args,r.stdout[-1200:],r.stderr[-2000:]);return r.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-if-declarations-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include <limits>\n#include "unit.cpp"\nint main(){double values[]={std::numeric_limits<double>::quiet_NaN(),0.0,-0.0,std::numeric_limits<double>::infinity(),-std::numeric_limits<double>::infinity(),1.5,-2.5};for(int n=-512;n<512;n++)printf("%d %d %d %d %d %d %d\\n",scalar(n),with_init(n),pointers(n),enums(n),floating(values[(n+512)%7]),casts(values[(n+512)%7]),aggregate(n));}')
 run(['clang++','-std=c++17',root/'main.cpp','-o',root/'native.exe'])
 expected=run([root/'native.exe']).splitlines();modules=[]
 evaluator='''async({url})=>{const m=await import(url),rows=[],values=[NaN,0,-0,Infinity,-Infinity,1.5,-2.5];for(let n=-512;n<512;n++)rows.push([m.scalar(n),m.with_init(n),m.pointers(n),m.enums(n),m.floating(values[(n+512)%7]),m.casts(values[(n+512)%7]),m.aggregate(n)].join(' '));return rows;}'''
 for mode in ('full','filtered'):
  args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode,'--require-record-layouts']
  if mode=='filtered':args+=['--filter','scalar,with_init,pointers,enums,floating,casts,aggregate','--exact-filter','--dependency-closure','--header-dependency-closure','--enum-closure']
  run(args);module=root/mode/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
  for name in ('scalar','with_init','pointers','enums','floating','casts','aggregate'):
   row=next(r for r in doc['definitions'] if r['name']==name);assert row['status']=='source-first',row
  if mode=='full':
   row=next(r for r in doc['definitions'] if r['name']=='reject_object');assert row['status']=='blocked' and 'condition-variable lifetime' in row['reason'],row
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps({'url':module.as_uri()})+')).join("\\n"));')
  assert run(['node',root/'run.mjs']).splitlines()==expected;modules.append(module)
 if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True);page=browser.new_page()
   for module in modules:assert page.evaluate(evaluator,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()})==expected
   browser.close()
print('PASS: 14336 native/full/filtered Node and optional Chromium results; if declarations, nested shadows, init order, else scope, pointer aliases, continue, enums, trivial record arguments, floating conditions and explicit casts including NaN/infinities/signed zero; class lifetime stays blocked')
