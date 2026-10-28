"""Native parity for implicit POD assignment exposed by a late header call."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    result=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=90)
    assert result.returncode==0,(args,result.stdout[-1500:],result.stderr[-2000:])
    return result.stdout
with tempfile.TemporaryDirectory(prefix='source-late-pod-') as temporary:
    p=Path(temporary)
    (p/'helper.h').write_text('''namespace source_math { struct Pair {int value;short tag;}; }
static inline int late_helper(int x){
  source_math::Pair p={x,3};
  p=source_math::Pair{x*7,short(x+1)};
  return p.value+p.tag;
}
''')
    (p/'unit.cpp').write_text('#include "helper.h"\nextern "C" int entry(int x){return late_helper(x);}\n')
    (p/'main.cpp').write_text('#include <stdio.h>\nextern "C" int entry(int);\nint main(){for(int x=-128;x<128;x++)printf("%d\\n",entry(x));}\n')
    native=p/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14',str(p/'unit.cpp'),str(p/'main.cpp'),'-o',str(native)])
    expected=[int(line) for line in run([str(native)]).splitlines()]
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(p),'--source','unit.cpp',
        '--filter','entry','--out-dir',str(p/'out'),'--dependency-closure','--header-dependency-closure'])
    module=p/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    assert next(row for row in manifest['definitions'] if row['name']=='entry')['status']=='source-first',manifest
    assert 'late_helper' in manifest['dependency_closure']['additional_ast_filters'],manifest
    assert 'Pair' in manifest['implicit_member_closure']['proven'],manifest
    js='async url=>{const m=await import(url);return Array.from({length:256},(_,i)=>m.entry(i-128));}'
    (p/'check.mjs').write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    actual=json.loads(run(['node',str(p/'check.mjs')]));assert actual==expected,(actual[:5],expected[:5])
    report={'passed':True,'native_node_cases':256,'late_header_implicit_assignment_recovered':True,'gameplay_verified':False}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
            assert actual==expected and not errors,(actual[:5],errors)
            report.update(chromium_cases=256,browser_version=browser.version);browser.close()
    (ROOT/'reports/oct23-late-pod-closure-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
