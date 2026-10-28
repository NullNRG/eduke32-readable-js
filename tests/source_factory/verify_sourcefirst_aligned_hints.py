"""Native/JS proof of standalone aligned arrays and non-evaluating Clang hints."""
import base64,hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=next(p for p in Path(__file__).resolve().parents if (p/'tools/source_ast_to_js.py').is_file())
def run(args):
    r=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert r.returncode==0,(args,r.stdout[-1600:],r.stderr[-3000:])
    return r.stdout
with tempfile.TemporaryDirectory(prefix='source-aligned-hints-') as folder:
    p=Path(folder)
    source='''extern "C" int unavailable_hint_call();
alignas(64) unsigned char original_secret[192]={3,9,5,31};
extern "C" unsigned long long aligned_case(int index){
 alignas(64) unsigned long long acc[8]={11,23,37,49,53,67,71,83};
 alignas(32) unsigned char temporary[64];
 alignas(128) static unsigned char kept[64]={7};
 unsigned char *alias=(unsigned char*)acc;
 for(int i=0;i<64;i++)temporary[i]=(unsigned char)(index*5+i);
 alias[index&63]^=temporary[index&63];
 original_secret[(index+7)%192]^=(unsigned char)index;
 kept[index&63]^=(unsigned char)(index+11);
 int side=4;
 __builtin_assume(++side);
 __builtin_assume(unavailable_hint_call());
 __builtin_assume(index>=0);
 return acc[index&7]^original_secret[(index+7)%192]^kept[index&63]
       ^(unsigned long long)(side+__alignof__(acc)+__alignof__(original_secret)+__alignof__(kept));
}
'''
    (p/'unit.cpp').write_text(source)
    (p/'main.cpp').write_text('''#include <cstdio>
extern "C" unsigned long long aligned_case(int);
int main(){for(int i=0;i<256;i++)printf("%llu\\n",aligned_case(i));}
''')
    exe=p/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14','-O1',str(p/'unit.cpp'),str(p/'main.cpp'),'-o',str(exe)])
    expected=run([str(exe)]).splitlines()
    run([sys.executable,'tools/source_ast_to_js.py','--root',str(p),'--source','unit.cpp','--out-dir',str(p/'out')])
    module=p/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={r['name']:r for r in manifest['definitions']}
    assert rows['aligned_case']['status']=='source-first',rows['aligned_case']
    assert rows['original_secret']['status']=='source-first',rows['original_secret']
    js='''async ({module})=>{const m=await import(module);
 const alignment=globalThis[Symbol.for('source-first.allocation-alignment/1')].get(m.original_secret.buffer);
 if(alignment!==64||m.original_secret.length!==192)throw Error('alignment/storage extent');
 const cases=Array.from({length:256},(_,i)=>String(m.aligned_case(i)));
 if(m.original_secret.byteOffset!==0)throw Error('original allocation moved');
 return cases;}'''
    (p/'check.mjs').write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps({'module':module.as_uri()})+')));')
    actual=json.loads(run(['node',str(p/'check.mjs')]))
    assert actual==expected,[(i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b][:5]
    # This feature proves scalar arrays, not over-aligned records or integers.
    (p/'rejected.cpp').write_text('extern "C" int rejected(){alignas(64) int x=2;return x;}')
    run([sys.executable,'tools/source_ast_to_js.py','--root',str(p),'--source','rejected.cpp','--out-dir',str(p/'out')])
    rejected=json.loads((p/'out/rejected.cpp.manifest.json').read_text())['definitions']
    assert any(r['name']=='rejected' and r['status']=='blocked' and 'alignment' in r['reason'] for r in rejected),rejected
    report={'passed':True,'native_node_cases':256,'global_local_static_storage_and_byte_aliasing':True,
            'unevaluated_side_effect_and_unresolved_call':True,'explicit_variable_alignof':True,
            'unimplemented_overaligned_scalar_rejected':True,'gameplay_verified':False,
            'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest()}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            actual=page.evaluate(js,{'module':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()})
            assert actual==expected and not errors,(actual[:5],errors)
            report.update(chromium_cases=256,browser_version=browser.version);browser.close()
    (ROOT/'reports/oct27-aligned-hints-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
