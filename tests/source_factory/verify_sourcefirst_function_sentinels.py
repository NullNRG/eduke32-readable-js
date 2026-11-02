"""Source integer function addresses remain values, never invented callbacks."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=150)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='function-sentinels-',dir=ROOT/'work') as temporary:
    root=Path(temporary)
    (root/'unit.cpp').write_text('''#include <stdint.h>
using F=int(*)(int);struct Holder{F fn;};
int plus(int n){return n+71;}
unsigned long long bits_case(int n){unsigned long long bits=n%4==0?4919:n%4==1?57005:n%4==2?0:~0ull;
 Holder h{(F)(uintptr_t)bits};return (unsigned long long)(uintptr_t)h.fn;}
int select_case(int n){Holder h{n%3?plus:(F)4919};
 if(h.fn==(F)4919)return -3;if(h.fn==(F)57005)return -5;
 F again=(F)(uintptr_t)h.fn;if(again!=h.fn)return -7;return again(n);}
int invalid_call(){return ((F)4919)(1);}
int invalid_read(){return *(int*)(void*)(F)4919;}
''')
    (root/'main.cpp').write_text('''#include <cstdio>
unsigned long long bits_case(int);int select_case(int);
int main(){for(int n=0;n<256;n++)printf("%llu %d\\n",bits_case(n),select_case(n));}
''')
    oracle=root/'oracle.exe';run(['clang++','-std=c++14','-O1',root/'unit.cpp',root/'main.cpp','-o',oracle])
    expected=[line.split() for line in run([oracle]).splitlines()]
    out=root/'out';run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
        '--out-dir',out,'--header-dependency-closure','--require-record-layouts'])
    module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={r['name']:r for r in manifest['definitions']}
    assert all(rows[name]['status']=='source-first' for name in ('bits_case','select_case','invalid_call','invalid_read')),rows
    js='''async url=>{const m=await import(url);let caught=0;
     const result=Array.from({length:256},(_,n)=>[String(m.bits_case(n)),String(m.select_case(n))]);
     for(const f of [m.invalid_call,m.invalid_read]){try{f();}catch(e){caught++;}}
     if(caught!==2)throw Error('Integer function sentinels became callable/readable');return result;}'''
    runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    actual=json.loads(run(['node',runner]));assert actual==expected,(actual[:3],expected[:3])
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            try:
                actual=browser.new_page().evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
                assert actual==expected,(actual[:3],expected[:3])
            finally:browser.close()
print('PASS 512 native/Node/Chromium function-address values: sentinel storage/comparison, integer round trips and real callback round trips/calls; invalid calls/data reads rejected')
