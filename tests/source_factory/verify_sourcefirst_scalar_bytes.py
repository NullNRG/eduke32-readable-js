"""Reinterpreted scalar addresses retain one original mutable byte allocation."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    r=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert r.returncode==0,(args,r.stdout[-1600:],r.stderr[-2500:])
    return r.stdout
with tempfile.TemporaryDirectory(prefix='source-scalar-bytes-') as directory:
    p=Path(directory)
    code='''extern "C" void mutate_ref(long long &value){
 unsigned char *bytes=(unsigned char*)&value;bytes[2]^=0x42;value+=17;
}
extern "C" long long scalar_bytes(long long key,int index){
 unsigned char *bytes=(unsigned char const *)&key;
 unsigned h=5381;for(auto p=bytes,end=p+sizeof(key);p<end;p++)h=((h<<5)+h)^*p;
 bytes[index&7]^=(unsigned char)(index+31);
 long long local=key^0x12ac5634;
 void *address=&local;unsigned char *alias=(unsigned char*)&local;
 alias[(index+3)&7]^=0x55;local+=71;
 mutate_ref(local);
 if((void*)alias!=address)return -999;
 int sum=0;
 for(int i=0;i<3;i++){int temporary=index+i;unsigned char *part=(unsigned char*)&temporary;part[0]^=3;sum+=temporary;}
 return local^(long long)h^sum;
}
extern "C" int uninitialized_bytes(){int x;return *(unsigned char*)&x;}
extern "C" void fill_output(void *destination,unsigned value){
 unsigned char *bytes=(unsigned char*)destination;
 for(int i=0;i<4;i++)bytes[i]=(unsigned char)(value>>(i*8));
}
extern "C" unsigned initialized_by_callee(unsigned input){
 unsigned value;fill_output(&value,input);value^=0x1a42u;return value;
}
static unsigned read_short_bytes(const void *address) {
 const auto bytes=static_cast<const unsigned char *>(address);
 return bytes[0]+256u*bytes[1];
}
extern "C" unsigned initialized_before_escape(unsigned input) {
 unsigned short value;
 value=(unsigned short)(input ^ 0x7ac5u);
 return read_short_bytes(&value);
}
extern "C" unsigned conditionally_initialized(unsigned input) {
 unsigned short value;
 if(input) value=(unsigned short)input;
 return read_short_bytes(&value);
}
'''.replace('unsigned char *bytes=(unsigned char const *)&key;','unsigned char *bytes=(unsigned char*)&key;')
    (p/'unit.cpp').write_text(code)
    (p/'main.cpp').write_text('''#include <cstdio>
#include <cstdint>
extern "C" long long scalar_bytes(long long,int);
extern "C" unsigned initialized_by_callee(unsigned);
extern "C" unsigned initialized_before_escape(unsigned);
int main(){uint64_t state=0x75abf14a;
 for(int i=0;i<256;i++){state=state*6364136223846793005ULL+1442695040888963407ULL;
 printf("%lld %lld %u %u\\n",(long long)state,scalar_bytes((long long)state,i),initialized_by_callee((unsigned)state),initialized_before_escape((unsigned)state));}}
''')
    exe=p/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14','-O1',str(p/'unit.cpp'),str(p/'main.cpp'),'-o',str(exe)])
    expected=[line.split() for line in run([str(exe)]).splitlines()]
    run([sys.executable,'tools/source_ast_to_js.py','--root',str(p),'--source','unit.cpp','--out-dir',str(p/'out')])
    module=p/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={row['name']:row for row in manifest['definitions']}
    assert all(rows[name]['status']=='source-first' for name in ('scalar_bytes','mutate_ref','initialized_by_callee','fill_output','initialized_before_escape')),rows
    assert all(rows[name]['status']=='blocked' and 'initialization' in rows[name]['reason']
               for name in ('uninitialized_bytes','conditionally_initialized')),rows
    js='''async ({module,cases})=>{const m=await import(module);return cases.map((row,index)=>{
      const input=Number(BigInt.asUintN(32,BigInt(row[0])));
      return String(m.scalar_bytes(BigInt(row[0]),index))+' '+m.initialized_by_callee(input)+' '+m.initialized_before_escape(input);});}'''
    (p/'check.mjs').write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps({'module':module.as_uri(),'cases':expected})+')));')
    actual=json.loads(run(['node',str(p/'check.mjs')]))
    assert actual==[' '.join(row[1:]) for row in expected],[(i,a,e) for i,(a,e) in enumerate(zip(actual,expected)) if a!=' '.join(e[1:])][:5]
    report={'passed':True,'native_node_cases':256,'parameter_local_reference_and_byte_aliases_verified':True,
        'uninitialized_byte_reads_rejected':True,'conditional_initialization_rejected':True,
        'dominating_assignment_before_read_only_escape_verified':True,
        'original_mutable_callee_output_storage_verified':True,'gameplay_verified':False}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            actual=page.evaluate(js,{'module':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode(),'cases':expected})
            assert actual==[' '.join(row[1:]) for row in expected] and not errors,(actual[:5],errors)
            report.update(chromium_cases=256,browser_version=browser.version);browser.close()
    (ROOT/'reports/oct26-scalar-bytes-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
