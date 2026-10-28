"""Original libdivide source and 128-bit arithmetic versus native Clang."""
import base64,hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from build_libdivide_source import build,HEADER
def run(args):
    r=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert r.returncode==0,(args,r.stdout[-2000:],r.stderr[-3000:])
    return r.stdout
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
with tempfile.TemporaryDirectory(prefix='source-wide-division-') as directory:
    p=Path(directory);module=p/'libdivide.mjs';provenance=build(module)
    # A temporary rebuild must reproduce the installed original provider.
    installed=ROOT/'runtime/libdivide_division_source.mjs'
    assert digest(module)==digest(installed),'Rebuild original libdivide provider before testing'
    wide='''extern "C" unsigned long long wide_unsigned(unsigned long long a,unsigned long long b,int shift){
 unsigned __int128 x=((unsigned __int128)a<<64)|b;
 x+=(unsigned __int128)0xfedcba9876543210ULL<<70;
 x=(x*x)^(~x);x>>=shift;return (unsigned long long)x;
}
extern "C" unsigned long long wide_signed(long long a,long long b){
 __int128 x=(__int128)a*b;x=-x;x+=b;x=+x;
 return (unsigned long long)(x>>63);
}
extern "C" unsigned long long wide_intermediate(unsigned long long a,unsigned long long b){
 return (a+b)/3;
}
'''
    (p/'wide.cpp').write_text(wide)
    run([sys.executable,'tools/source_ast_to_js.py','--root',str(p),'--source','wide.cpp','--out-dir',str(p/'out')])
    wide_module=p/'out/wide.cpp.mjs'
    manifest=json.loads(wide_module.with_suffix('.manifest.json').read_text())
    assert manifest['blocked']==0,manifest
    body='''#include <cstdio>
#include <cstdint>
#include <climits>
#include "libdivide.h"
extern "C" unsigned long long wide_unsigned(unsigned long long,unsigned long long,int);
extern "C" unsigned long long wide_signed(long long,long long);
extern "C" unsigned long long wide_intermediate(unsigned long long,unsigned long long);
int main(){uint64_t state=0x35a9684b7216fULL;
'''
    for kind,ctype,bits,signed in [('u32','uint32_t',32,False),('s32','int32_t',32,True),('u64','uint64_t',64,False),('s64','int64_t',64,True)]:
        fmt='%lld' if signed else '%llu';cast='long long' if signed else 'unsigned long long'
        maximum=(1<<(bits-1))-1 if signed else (1<<bits)-1
        ds=[1,2,3,7,31,1024,16383,maximum]
        if signed:ds += [-1,-2,-3,-7,-(1<<(bits-1))]
        literals=[str(v)+('LL' if signed else 'ULL') if v>=0 else ('(-9223372036854775807LL-1)' if v==-(1<<63) else str(v)+'LL') for v in ds]
        body+='{'+ctype+' divisors[]={'+','.join(literals)+'};\n'
        body+=f'''for(int i=0;i<512;i++){{
 state=state*6364136223846793005ULL+1442695040888963407ULL;
 {ctype} n=({ctype})state,d=divisors[i%(sizeof(divisors)/sizeof(divisors[0]))];
 if(i%8==0)n=0;else if(i%8==1)n=1;else if(i%8==2)n=({ctype}){maximum}ULL;
 auto a=libdivide::libdivide_{kind}_gen(d);
 printf("{kind}_do {fmt} {fmt} %u {fmt}\\n",({cast})n,({cast})a.magic,a.more,({cast})libdivide::libdivide_{kind}_do(n,&a));
'''
        if not signed:body+='if(d!=1){\n'
        body+=f'''auto b=libdivide::libdivide_{kind}_branchfree_gen(d);
 printf("{kind}_branchfree_do {fmt} {fmt} %u {fmt}\\n",({cast})n,({cast})b.magic,b.more,({cast})libdivide::libdivide_{kind}_branchfree_do(n,&b));
'''
        if not signed:body+='}\n'
        body+='}}\n'
    body+='''for(int i=0;i<256;i++){
 state=state*6364136223846793005ULL+1442695040888963407ULL;uint64_t a=state;
 state=state*6364136223846793005ULL+1442695040888963407ULL;uint64_t b=state;
 printf("wide %llu %llu %d %llu %llu %llu\\n",(unsigned long long)a,(unsigned long long)b,i%128,
 wide_unsigned(a,b,i%128),wide_signed((long long)a,(long long)b),wide_intermediate(a,b));
}}
'''
    (p/'oracle.cpp').write_text(body)
    exe=p/('oracle.exe' if os.name=='nt' else 'oracle')
    run(['clang++','-std=c++14','-O2','-I',str(ROOT/'factory-output/source-tree/eduke32-master/source/build/include'),str(p/'oracle.cpp'),str(p/'wide.cpp'),'-o',str(exe)])
    rows=[line.split() for line in run([str(exe)]).splitlines()]
    js='''async ({module,wide,rows})=>{
      const [m,w]=await Promise.all([import(module),import(wide)]);let divisions=0,arithmetic=0;
      for(const row of rows){
        if(row[0]==='wide'){
          const a=BigInt(row[1]),b=BigInt(row[2]),shift=Number(row[3]);
          const actual=[w.wide_unsigned(a,b,shift),w.wide_signed(BigInt.asIntN(64,a),BigInt.asIntN(64,b)),w.wide_intermediate(a,b)].map(String);
          if(JSON.stringify(actual)!==JSON.stringify(row.slice(4)))throw Error('128/64-bit expression mismatch: '+JSON.stringify({row,actual}));
          arithmetic++;continue;
        }
        const is64=row[0].includes('64'),n=is64?BigInt(row[1]):Number(row[1]);
        const record={magic:is64?BigInt(row[2]):Number(row[2]),more:Number(row[3])};
        const source=divisions%3===0?{__cReference:true,value:record}:divisions%3===1?[record]:record;
        const pointer=divisions%5===0?{__cDeferredPointer:true,resolve:()=>source}:source;
        const actual=String(m['libdivide_'+row[0]](n,pointer));
        if(actual!==row[4])throw Error('Original libdivide mismatch: '+JSON.stringify({row,actual}));
        divisions++;
      }
      return {divisions,arithmetic};
    }'''
    urls={'module':module.as_uri(),'wide':wide_module.as_uri(),'rows':rows}
    (p/'check.mjs').write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(urls)+')));')
    result=json.loads(run(['node',str(p/'check.mjs')]))
    report={'passed':True,'native_node':result,'source_header_sha256':provenance['source_header_sha256'],
        'module_sha256':digest(installed),'compiler_frontend_sha256':digest(ROOT/'tools/source_ast_to_js.py'),
        'original_header_compiled':True,'gameplay_verified':False}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        data=lambda value:'data:text/javascript;base64,'+base64.b64encode(value.encode()).decode()
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            actual=page.evaluate(js,{'module':data(module.read_text()),'wide':data(wide_module.read_text()),'rows':rows})
            assert actual==result and not errors,(actual,errors)
            report.update(chromium=actual,browser_version=browser.version);browser.close()
    (ROOT/'reports/oct25-original-libdivide-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
