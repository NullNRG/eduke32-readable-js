"""Execute all eight original GenericAllocator methods against native C++."""
import argparse,asyncio,base64,hashlib,json,os,subprocess,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'factory-output/browser-classic/source-tree/eduke32-master'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--module',type=Path,default=ROOT/'factory-output/source-first/oct29-browser-generic-allocator-addresses/source/build/src/smmalloc_generic.cpp.mjs')
parser.add_argument('--report',type=Path,default=ROOT/'reports/oct29-original-generic-allocator-full-parity.json')
args=parser.parse_args()
MODULE=args.module.resolve()
MANIFEST=json.loads(MODULE.with_suffix('.manifest.json').read_text())
METHODS={r['source_name']:r for r in MANIFEST['definitions'] if r.get('original_static_member')}
assert len(METHODS)==8 and all(r['status']=='source-first' for r in METHODS.values()),METHODS
assert not MANIFEST['imports'],MANIFEST['imports']
RUN_JS=r'''
function checkOriginalAllocator(m){
 const instance=m.Create();if(m.Invalid()!==null||!m.IsValid(instance))throw Error('Original instance contract');
 const address=globalThis[Symbol.for('source-lp64-addresses/2')];
 const bytes=p=>new Uint8Array(p.buffer,p.offset,p.upper-p.offset);
 const rows=[];
 for(let i=0;i<256;i++){
  const n=(i*37)%4097,a=1<<(i%9);let p=m.Alloc(instance,BigInt(n),BigInt(a));
  if(p===null)throw Error('Original allocation failed');
  for(let j=0;j<n;j++)bytes(p)[j]=(j*13+i)&255;
  const before=m.GetUsableSpace(instance,p),alignment=address.encode(p)%BigInt(Math.max(a,16)),readable=address.encode(p)>16384n?1:0;
  const size=n+53,align=1<<((i+3)%9);p=m.Realloc(instance,p,BigInt(size),BigInt(align));
  if(p===null)throw Error('Original reallocation failed');
  let sum=0;for(let j=0;j<n;j++)sum+=bytes(p)[j];
  rows.push(`${before},${m.GetUsableSpace(instance,p)},${alignment},${address.encode(p)%BigInt(Math.max(align,16))},${sum},${readable}`);
  m.Free(instance,p);
 }
 const p=m.Alloc(instance,68n,16n);bytes(p).fill(213,0,68);
 const failed=m.Realloc(instance,p,1n<<62n,16n);
 if(failed!==null)throw Error('Expected native allocation failure');
 let sum=0;for(let i=0;i<68;i++)sum+=bytes(p)[i];
 rows.push(`${m.GetUsableSpace(instance,p)},${sum}`);m.Free(instance,p);
 m.Free(instance,null);if(m.GetUsableSpace(instance,null)!==0n)throw Error('Null usable size');
 m.Destroy(instance);
 if(globalThis[Symbol.for('source-first.native-C-heap/2')].allocations.size!==0)throw Error('Original allocator leaked allocations');
 return rows;
}
'''
def run(args,cwd):
    r=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=150)
    if r.returncode:raise RuntimeError(r.stdout[-2000:]+'\n'+r.stderr[-5000:])
    return r.stdout.strip()
async def browser(expected):
    executable=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE')
    if not executable:raise RuntimeError('Chromium parity requires EDUKE_CHROMIUM_EXECUTABLE')
    from playwright.async_api import async_playwright
    async with async_playwright() as playwright:
        instance=await playwright.chromium.launch(executable_path=executable,headless=True)
        try:
            page=await instance.new_page();errors=[];console=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.on('console',lambda message:console.append({'type':message.type,'text':message.text}))
            await page.set_content('<title>Original EDuke32 generic allocator parity</title>')
            actual=await page.evaluate('''async ({encoded,names,body})=>{
              const url=URL.createObjectURL(new Blob([Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))],{type:'text/javascript'}));
              try{const module=await import(url),m=Object.fromEntries(Object.entries(names).map(([a,b])=>[a,module[b]]));
                return Function('m',body+';return checkOriginalAllocator(m);')(m);
              }finally{URL.revokeObjectURL(url);}
            }''',{'encoded':base64.b64encode(MODULE.read_bytes()).decode(),
                  'names':{name:r['name'] for name,r in METHODS.items()},'body':RUN_JS})
            assert actual==expected,(actual[:4],expected[:4]);assert not errors,errors
            return {'passed':True,'browser_version':instance.version,'page_errors':errors,'console':console,'cases':len(actual)}
        finally:await instance.close()
with tempfile.TemporaryDirectory(prefix='original-generic-allocator-full-') as temporary:
    directory=Path(temporary);driver=directory/'oracle.cpp';exe=directory/'oracle.exe'
    driver.write_text('#include <cstdio>\n#include <cstddef>\n#include <cstdlib>\n#include '+json.dumps((SOURCE/'source/build/src/smmalloc_generic.cpp').as_posix())+r'''
int main(){auto instance=sm::GenericAllocator::Create();
 if(sm::GenericAllocator::Invalid()!=nullptr||!sm::GenericAllocator::IsValid(instance))return 2;
 for(unsigned i=0;i<256;i++){
  size_t n=(i*37)%4097,a=size_t(1)<<(i%9);
  void*p=sm::GenericAllocator::Alloc(instance,n,a);if(!p)return 3;
  for(size_t j=0;j<n;j++)reinterpret_cast<unsigned char*>(p)[j]=(j*13+i)&255;
  size_t before=sm::GenericAllocator::GetUsableSpace(instance,p),alignment=reinterpret_cast<size_t>(p)%std::max(a,size_t(16));
  int readable=reinterpret_cast<size_t>(p)>16384;
  size_t size=n+53,align=size_t(1)<<((i+3)%9);
  p=sm::GenericAllocator::Realloc(instance,p,size,align);if(!p)return 4;
  unsigned sum=0;for(size_t j=0;j<n;j++)sum+=reinterpret_cast<unsigned char*>(p)[j];
  printf("%zu,%zu,%zu,%zu,%u,%d\n",before,sm::GenericAllocator::GetUsableSpace(instance,p),alignment,
   reinterpret_cast<size_t>(p)%std::max(align,size_t(16)),sum,readable);sm::GenericAllocator::Free(instance,p);
 }
 void*p=sm::GenericAllocator::Alloc(instance,68,16);if(!p)return 5;
 for(size_t i=0;i<68;i++)reinterpret_cast<unsigned char*>(p)[i]=213;
 if(sm::GenericAllocator::Realloc(instance,p,size_t(1)<<62,16)!=nullptr)return 6;
 unsigned sum=0;for(size_t i=0;i<68;i++)sum+=reinterpret_cast<unsigned char*>(p)[i];
 printf("%zu,%u\n",sm::GenericAllocator::GetUsableSpace(instance,p),sum);
 sm::GenericAllocator::Free(instance,p);sm::GenericAllocator::Free(instance,nullptr);
 if(sm::GenericAllocator::GetUsableSpace(instance,nullptr)!=0)return 7;
 sm::GenericAllocator::Destroy(instance);
}
''')
    flags=['-funsigned-char','-std=gnu++14','-DNOASM','-DNDEBUG','-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE','-DEDUKE32_BROWSER=1']
    flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/audiolib/include','platform/Windows/include','platform/Windows/include/SDL2')]
    run(['clang++',*flags,str(driver),'-o',str(exe)],ROOT)
    expected=run([str(exe)],directory).splitlines()
    names={name:r['name'] for name,r in METHODS.items()}
    runner=directory/'run.mjs'
    runner.write_text('import * as original from '+json.dumps(MODULE.as_uri())+';\nconst names='+json.dumps(names)+';\n'
        +'const m=Object.fromEntries(Object.entries(names).map(([a,b])=>[a,original[b]]));\n'
        +RUN_JS+'\nconsole.log(checkOriginalAllocator(m).join("\\n"));\n')
    actual=run(['node',str(runner)],directory).splitlines()
    assert actual==expected,(actual[:4],expected[:4])
    browser_result=asyncio.run(browser(expected))
    report={'format':'original-generic-allocator-full-native-parity/1','passed':True,
        'native_node_chromium_cases':len(expected),'original_methods':names,
        'source_file':'source/build/src/smmalloc_generic.cpp',
        'source_sha256':hashlib.sha256((SOURCE/'source/build/src/smmalloc_generic.cpp').read_bytes()).hexdigest(),
        'module_sha256':hashlib.sha256(MODULE.read_bytes()).hexdigest(),
        'manifest_sha256':hashlib.sha256(MODULE.with_suffix('.manifest.json').read_bytes()).hexdigest(),
        'native_pointer_abi':MANIFEST['native_pointer_abi'],'browser':browser_result,
        'checks':['original instance methods','original allocation','native alignment 1..256 clamped to 16',
                  'header size','original reallocation copies data','original free','null free and usable size',
                  'allocation failure preserves original allocation','allocation addresses exceed original pool low-address sentinel range',
                  'zero outstanding source C heap allocations'],
        'expected_rows':expected,'gameplay_verified':False,'engine_boot_verified':False}
    output=args.report.resolve()
    output.write_text(json.dumps(report,indent=2)+'\n')
    print('PASS 257 native/Node/Chromium cases for all eight original GenericAllocator methods; no engine/gameplay claim')
