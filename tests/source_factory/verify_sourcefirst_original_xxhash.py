"""Differential check of original scalar XXH3_64bits, including palette extent."""
import base64,hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=next(p for p in Path(__file__).resolve().parents if (p/'tools/source_ast_to_js.py').is_file())
HEADER=ROOT/'factory-output/source-tree/eduke32-master/source/build/include/xxhash.h'
MODULE=ROOT/'runtime/xxhash_source.mjs'
provenance=json.loads(MODULE.with_suffix('.provenance.json').read_text())
assert provenance['module_sha256']==hashlib.sha256(MODULE.read_bytes()).hexdigest()
assert provenance['source_header_sha256']==hashlib.sha256(HEADER.read_bytes()).hexdigest()
def run(args):
    p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1000:],p.stderr[-3500:])
    return p.stdout
lengths=list(range(258))+[511,512,513,767,768,769,1023,1024,1025,2047,2048,4095,4096,16384]
with tempfile.TemporaryDirectory(prefix='original-xxhash-parity-') as directory:
    folder=Path(directory);exe=folder/('native.exe' if os.name=='nt' else 'native')
    (folder/'main.c').write_text('''#define XXH_IMPLEMENTATION 1
#define XXH_STATIC_LINKING_ONLY 1
#define XXH_VECTOR 0
#define XXH_NO_PREFETCH 1
#define XXH_NO_STREAM 1
#define NDEBUG 1
#include "xxhash.h"
#include <stdio.h>
int main(){unsigned char bytes[16416];int lengths[]={'''+','.join(map(str,lengths))+'''};
for(int c=0;c<sizeof(lengths)/sizeof(lengths[0]);c++){
 int len=lengths[c],offset=c%17;
 for(int i=0;i<len;i++)bytes[offset+i]=(unsigned char)((i*29+len*7+c*13)^(i>>3));
 printf("%llu\\n",(unsigned long long)XXH3_64bits(c==0?NULL:bytes+offset,len));
}return 0;}
''')
    run(['clang','-std=gnu11','-O2','-I'+str(HEADER.parent),str(folder/'main.c'),'-o',str(exe)])
    expected=run([str(exe)]).splitlines()
    js='''async ({url,lengths})=>{const m=await import(url);return lengths.map((len,c)=>{
 const offset=c%17,bytes=new Uint8Array(len+32);bytes.fill(0xa5);
 for(let i=0;i<len;i++)bytes[offset+i]=((i*29+len*7+c*13)^(i>>3))&255;
 const copy=bytes.slice(),input=c===0?null:bytes.subarray(offset,offset+len);
 const result=String(m.XXH3_64bits(input,BigInt(len)));
 if(bytes.some((v,i)=>v!==copy[i]))throw Error('checksum mutated original input');
 return result;});}'''
    (folder/'check.mjs').write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps({'url':MODULE.as_uri(),'lengths':lengths})+')));')
    actual=json.loads(run(['node',str(folder/'check.mjs')]))
    assert actual==expected,[(lengths[i],a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b][:5]
    report={'format':'original-xxhash-source-parity/1','passed':True,'native_node_cases':len(lengths),
        'source_header_sha256':hashlib.sha256(HEADER.read_bytes()).hexdigest(),
        'module_sha256':hashlib.sha256(MODULE.read_bytes()).hexdigest(),
        'compiler_sha256':provenance['compiler_frontend_sha256'],
        'verification_compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
        'export':'XXH3_64bits','tested_lengths':lengths,'unaligned_source_views':True,
        'input_bytes_unchanged':True,'gameplay_verified':False}
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
        page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        actual=page.evaluate(js,{'url':'data:text/javascript;base64,'+base64.b64encode(MODULE.read_bytes()).decode(),'lengths':lengths})
        assert actual==expected and not errors,(actual[:5],errors)
        report.update(native_chromium_cases=len(lengths),browser_version=browser.version);browser.close()
    (ROOT/'reports/oct27-original-xxhash-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='tested_lengths'},indent=2))
