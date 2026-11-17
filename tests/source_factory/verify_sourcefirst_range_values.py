"""Array range values are independent locals, with original pointer aliases."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-2500:]);return p.stdout
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='range-values-') as folder:
    root=Path(folder)
    (root/'unit.cpp').write_text('''void increment(int& n){n+=9;}
void redirect(int*& p,int* q){p=q;}
extern "C" int scalar(int n){int array[4]={n,n+1,n+2,n+3};int sum=0;
 for(int value:array){increment(value);sum+=value;value=999;}
 for(int value:array)sum+=value;return sum;}
extern "C" int pointers(int n){int values[3]={n,n+3,n+7};int* slots[3]={&values[0],&values[1],&values[2]};
 for(int* p:slots){*p+=2;redirect(p,&values[0]);p=nullptr;}
 int sum=0;for(int* p:slots)sum+=*p;return sum;}
extern "C" int patterns(){static char const* extensions[]={"*.grp","*.ssi","*.dat","*.zip"};
 int sum=0;for(char const* p:extensions){sum+=p[2];p=nullptr;}return sum;}
struct Nested { union { int *slot; long long bits; }; };
void write_value(int *ptr,int n){*ptr=n;}
extern "C" int nested_field(int n){
 int values[2]={n,n+1};Nested records[2]={{{&values[0]}},{{&values[1]}}};
 int delta=24;
 for(auto &entry:records){write_value(entry.slot,n+delta);entry.slot=nullptr;delta+=2;}
 return values[0]+2*values[1];
}
struct Record{int n;};int reject(){Record r[2]{};int s=0;for(Record x:r)s+=x.n;return s;}
''')
    (root/'main.cpp').write_text('''#include <cstdio>
extern "C" int scalar(int),pointers(int),patterns(),nested_field(int);
int main(){printf("%d\\n",patterns());for(int n=-128;n<128;n++)printf("%d,%d,%d\\n",scalar(n),pointers(n),nested_field(n));}
''')
    exe=root/'oracle.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe])
    expected=run([exe]).splitlines();out=root/'out'
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--require-record-layouts'])
    module=out/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={r['name']:r for r in doc['definitions']}
    for n in ('scalar','pointers','patterns','nested_field'):assert rows[n]['status']=='source-first',rows[n]
    assert rows['reject']['status']=='blocked' and 'by-value requires' in rows['reject']['reason'],rows['reject']
    js='async url=>{const m=await import(url);return [String(m.patterns()),...Array.from({length:256},(_,i)=>{const n=i-128;return [m.scalar(n),m.pointers(n),m.nested_field(n)].join(",");})];}'
    runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    assert json.loads(run(['node',runner]))==expected
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            try:
                page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
                assert actual==expected and not errors,(actual[:4],errors)
            finally:browser.close()
print('PASS native/Node/Chromium: 768 scalar/pointer results plus original-style GRP search patterns; pointer values from nested fields retain source identity; record copies stay blocked')
