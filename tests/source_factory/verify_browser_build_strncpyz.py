#!/usr/bin/env python3
"""Source-matched C Bstrncpyz boundary parity in native C++, Node and Chromium."""
import asyncio,json,shutil,subprocess,tempfile
from pathlib import Path
from verify_browser_closure_chromium import inline_graph
ROOT=Path(__file__).resolve().parents[2]
CASES=[('hello',0),('hello',1),('hello',2),('hello',5),('hello',6),('hello',8),('',1),('',8),('abcdefghi',8),('x',16)]
SOURCE=r'''
#include <algorithm>
#include <cstdio>
#include <cstring>
char* Bstrncpyz(char* dst,char const* src,size_t n){if(n>0){memcpy(dst,src,std::min(strlen(src)+1,n-1));dst[n-1]='\0';}return dst;}
int main(int argc,char**argv){for(int j=1;j<argc;j+=2){char dest[16];memset(dest,'X',sizeof(dest));Bstrncpyz(dest,argv[j],atoi(argv[j+1]));for(unsigned char c:dest)printf("%02x",c);putchar('\n');}}
'''
with tempfile.TemporaryDirectory(prefix='eduke-browser-strncpyz-') as temp:
    p=Path(temp);(p/'ref.cpp').write_text(SOURCE.replace('#include <cstring>','#include <cstring>\n#include <cstdlib>'))
    native=subprocess.run(['clang++','-std=c++14','ref.cpp','-o','ref'],cwd=p,capture_output=True,text=True,timeout=25)
    assert native.returncode==0,native.stderr
    args=[part for name,n in CASES for part in (name,str(n))]
    proc=subprocess.run([str(p/'ref'),*args],cwd=p,capture_output=True,text=True,timeout=8)
    assert proc.returncode==0,proc.stderr
    expected=proc.stdout.splitlines()
    def js_case_body():return '''(runtime,samples)=>{
        const vals=[];for(const [name,n] of samples){
            const src=new TextEncoder().encode(name+'\\0'),dst=new Uint8Array(16).fill(88);
            const result=runtime.library.symbols.Bstrncpyz(dst,src,n);
            if(result!==dst)throw Error('incorrect destination pointer');
            vals.push([...dst].map(x=>x.toString(16).padStart(2,'0')).join(''));
            const psrc=runtime.heap.writeCString(name),pdst=runtime.heap.malloc(16);
            runtime.heap.u8.fill(88,pdst,pdst+16);
            const ptr=runtime.library.symbols.Bstrncpyz(pdst,psrc,n);
            if(ptr!==pdst)throw Error('incorrect C pointer return');
            const bytes=[...runtime.heap.u8.subarray(pdst,pdst+16)].map(x=>x.toString(16).padStart(2,'0')).join('');
            if(bytes!==vals.at(-1))throw Error('heap and JS buffers differ');
            runtime.heap.free(psrc);runtime.heap.free(pdst);
        }return vals;
    }'''
    # Node execution (file-backed ESM).
    runner='''import {NativeRuntime} from '''+json.dumps((ROOT/'runtime/index.mjs').as_uri())+''';
const r=new NativeRuntime();const run='''+js_case_body()+''';
console.log(JSON.stringify(run(r,'''+json.dumps(CASES)+''')));r.close();'''
    (p/'run.mjs').write_text(runner)
    node=subprocess.run(['node','run.mjs'],cwd=p,capture_output=True,text=True,timeout=12)
    assert node.returncode==0,node.stderr
    assert json.loads(node.stdout)==expected,(json.loads(node.stdout),expected)
    async def chromium():
        from playwright.async_api import async_playwright
        modules=inline_graph({'runtime':'runtime/index.mjs'})
        async with async_playwright() as pw:
            b=await pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
            try:
                page=await b.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
                await page.set_content('<title>Build strncpyz native parity</title>')
                observed=await page.evaluate('''async ({modules,samples})=>{
                    const {NativeRuntime}=await import(modules.runtime);
                    const r=new NativeRuntime();try{return ('''+js_case_body()+''')(r,samples)}finally{r.close()}
                }''',{'modules':modules,'samples':CASES})
                assert observed==expected,(observed,expected)
                assert not errs,errs
            finally:await b.close()
    if shutil.which('chromium'):asyncio.run(chromium())
    print(f'PASS Bstrncpyz {len(CASES)} native C++ / Node / Chromium cases, 2 C buffer representations')
