"""C++ condition declarations are recreated on every while test."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=150)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='while-declaration-',dir=ROOT/'work') as temporary:
    root=Path(temporary)
    (root/'unit.cpp').write_text('''
int next_value(int *cursor){int value=*cursor;*cursor=value-1;return value;}
int scalar_case(int n){int cursor=n%23,sum=0;
 while(int value=next_value(&cursor)){if(value%3==0)continue;sum+=value;if(sum>80)break;}
 return sum*31+cursor;}
int pointer_case(int n){int data[8]={3,5,7,11,13,17,19,23};int cursor=n%8,sum=0;
 while(auto*p=cursor?&data[--cursor]:nullptr){if(*p==11)continue;sum+=*p;}
 return sum*17+cursor;}
struct Guard{int value;Guard(int n):value(n){}~Guard(){value=0;}operator bool()const{return value!=0;}};
int reject_lifetime(int n){while(Guard object=n){n--;if(n<0)break;}return n;}
''')
    (root/'main.cpp').write_text('''#include <cstdio>
int scalar_case(int),pointer_case(int);
int main(){for(int n=0;n<256;n++)printf("%d %d\\n",scalar_case(n),pointer_case(n));}
''')
    oracle=root/'oracle.exe';run(['clang++','-std=c++14','-O1',root/'unit.cpp',root/'main.cpp','-o',oracle])
    expected=[list(map(int,line.split())) for line in run([oracle]).splitlines()]
    out=root/'out';run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
        '--out-dir',out,'--header-dependency-closure','--require-record-layouts'])
    module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={r['name']:r for r in manifest['definitions']}
    assert all(rows[name]['status']=='source-first' for name in ('scalar_case','pointer_case')),rows
    assert rows['reject_lifetime']['status']=='blocked',rows['reject_lifetime']
    js='async url=>{const m=await import(url);return Array.from({length:256},(_,n)=>[m.scalar_case(n),m.pointer_case(n)]);}'
    runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    actual=json.loads(run(['node',runner]));assert actual==expected,(actual[:3],expected[:3])
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            try:
                page=browser.new_page();actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
                assert actual==expected,(actual[:3],expected[:3])
            finally:browser.close()
print('PASS 512 native/Node/Chromium scalar and pointer while-condition results: repeated tests, continue, break; nontrivial object lifetime rejected')
