"""Original single-base constructors initialize the same native allocation."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='byte-constructors-') as folder:
    root=Path(folder)
    (root/'types.hpp').write_text('''#include <atomic>
struct Base {int value; explicit Base(int n):value(n*3){value+=2;} };
struct Child:Base {
 int number;std::atomic<int> flag;Child*self;
 Child(int n):Base(n+2),number(n+7),flag(n+11),self(this){number+=value;}
 int adjust(int n){flag.store(flag.load()+n);return number+flag.load();}
};
struct DefaultBase {int base=37;DefaultBase()=default;};
struct DefaultChild:DefaultBase {int number=19;explicit DefaultChild(int n){number+=n;}};
struct Other {int other;};
struct Multiple:Base,Other {Multiple():Base(2){other=3;}};
struct Virtual:virtual Base {Virtual():Base(2){}};
struct Nontrivial:Base {Nontrivial():Base(2){}~Nontrivial(){value=0;}};
''')
    (root/'unit.cpp').write_text('''#include "types.hpp"
extern "C" int exercise(int n){Child*p=new Child(n);
 int result=p->adjust(n+5)+p->value+(p->self==p?10000:0);
 p->self->number+=3;result+=p->number;delete p;return result;}
extern "C" int defaults(int n){auto*p=new DefaultChild(n);int v=p->base+p->number;delete p;return v;}
Multiple*reject_multiple(){return new Multiple;}
Virtual*reject_virtual(){return new Virtual;}
Nontrivial*reject_destructor(){return new Nontrivial;}
extern "C" int through_callee(int n){return exercise(n)+defaults(n);}
''')
    (root/'main.cpp').write_text('''#include <cstdio>
extern "C" int exercise(int);extern "C" int defaults(int);
int main(){for(int n=0;n<256;n++)printf("%d %d\\n",exercise(n),defaults(n));}
''')
    oracle=root/'oracle.exe';run(['clang++','-std=c++14','-O1',root/'unit.cpp',root/'main.cpp','-o',oracle])
    expected=[list(map(int,line.split())) for line in run([oracle]).splitlines()]
    for filtered in (False,True,'indirect'):
        out=root/str(filtered);args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,
            '--source','unit.cpp','--out-dir',out,'--require-record-layouts','--header-dependency-closure']
        if filtered:args+=['--filter','through_callee' if filtered=='indirect' else 'exercise,defaults,reject_multiple,reject_virtual,reject_destructor','--exact-filter','--dependency-closure']
        run(args);module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
        rows={r['name']:r for r in manifest['definitions']}
        assert rows['exercise']['status']=='source-first',[(r['name'],r['status'],r.get('reason'),r.get('missing_dependencies')) for r in manifest['definitions'] if r['name']=='exercise' or r.get('original_byte_constructor')]
        assert rows['defaults']['status']=='source-first',rows['defaults']
        if filtered!='indirect':
            for name in ('reject_multiple','reject_virtual','reject_destructor'):
                assert rows[name]['status']=='blocked',rows[name]
        constructors=[r for r in manifest['definitions'] if r.get('original_byte_constructor')]
        assert len(constructors)>=4 and all(r['status']=='source-first' for r in constructors),constructors
        expression='async url=>{const {exercise,defaults}=await import(url);return Array.from({length:256},(_,n)=>[exercise(n),defaults(n)]);}'
        runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+expression+')('+json.dumps(module.as_uri())+')));')
        actual=json.loads(run(['node',runner]));assert actual==expected,(actual[:3],expected[:3],module.read_text()[-11000:])
        if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                    actual=page.evaluate(expression,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
                    assert actual==expected and not errors,(actual[:3],expected[:3],errors)
                finally:browser.close()
print('PASS 1536 native/Node and native/Chromium constructor results: direct/transitive allocation, original base/body/member order, DMI, atomics, self aliases and delete; multiple/virtual/nontrivial destruction rejected')
