"""Clang rotations and proven empty macro barriers retain native behavior."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    r=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert r.returncode==0,(args,r.stdout[-1200:],r.stderr[-2500:])
    return r.stdout
with tempfile.TemporaryDirectory(prefix='source-rotate-barrier-') as directory:
    p=Path(directory)
    (p/'barrier.h').write_text('''#define PREFIX static inline
#define BODY(tag) unsigned long long named_##tag(unsigned long long v) { __asm__("" : "+r"(v));return v^123; }
PREFIX BODY(original)
''')
    alternatives=[]
    for bits in (8,16,32,64):
        for direction in ('left','right'):
            alternatives.append('case '+str(len(alternatives))+': return __builtin_rotate'+direction+str(bits)+'(value,shift);')
    (p/'unit.cpp').write_text('#include "barrier.h"\nextern "C" unsigned long long rotation(int which,unsigned long long value,int shift){value=named_original(value);switch(which){'+''.join(alternatives)+'default:return 0;}}\n'
        +'int effect(int &n){n+=3;return n;} int discarded(){unsigned char bytes[2]={};int n=0;(void)(bytes+2);(void)(++n);(void)effect(n);return n;}\n')
    (p/'main.cpp').write_text('''#include <cstdio>
extern "C" unsigned long long rotation(int,unsigned long long,int);
int main(){for(int i=0;i<256;i++)for(int j=0;j<8;j++)printf("%llu\\n",rotation(j,0xf235eea135779bdfULL+i,i-70));}
''')
    exe=p/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-O1',str(p/'unit.cpp'),str(p/'main.cpp'),'-o',str(exe)])
    expected=run([str(exe)]).splitlines()
    run([sys.executable,'tools/source_ast_to_js.py','--root',str(p),'--source','unit.cpp','--out-dir',str(p/'out'),'--header-dependency-closure'])
    module=p/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={r['name']:r for r in manifest['definitions']}
    assert rows['rotation']['status']=='source-first',rows
    generated=next(r for r in rows.values() if r.get('source_name')=='named_original')
    assert generated['macro_header_definition']['source_header']=='barrier.h'
    assert generated['original_empty_asm_barriers'][0]['source']=='barrier.h'
    js='''async url=>{const m=await import(url),out=[];if(m.discarded()!==4)throw Error('discarded expression lost side effects');for(let i=0;i<256;i++)for(let j=0;j<8;j++)out.push(String(m.rotation(j,0xf235eea135779bdfn+BigInt(i),i-70)));return out;}'''
    (p/'check.mjs').write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    actual=json.loads(run(['node',str(p/'check.mjs')]))
    assert actual==expected,[(i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b][:4]
    (p/'reject.cpp').write_text('''int instruction(int v){__asm__("add $1,%0":"+r"(v));return v;}
int output(int v){__asm__("":"=r"(v));return v;}
int memory(int v){__asm__("":"+r"(v)::"memory");return v;}
int effect(int *v){__asm__("":"+r"(v[(*v)++]));return *v;}
''')
    run([sys.executable,'tools/source_ast_to_js.py','--root',str(p),'--source','reject.cpp','--out-dir',str(p/'out')])
    negative=json.loads((p/'out/reject.cpp.manifest.json').read_text())
    assert negative['blocked']==4 and negative['emitted']==0,negative['definitions']
    report={'passed':True,'native_node_cases':2048,'widths':[8,16,32,64],'directions':['left','right'],
        'negative_and_wrapping_counts':True,'macro_specifier_and_body_provenance':True,
        'nonempty_or_unsafe_assembly_rejected':4,'gameplay_verified':False}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pwt:
            browser=pwt.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
            assert actual==expected;report['native_chromium_cases']=2048;browser.close()
    (ROOT/'reports/oct27-rotation-barriers-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
