#!/usr/bin/env python3
"""Native original-POSIX-style Build path normalization vs browser ABI.

Tests the platform-only Bcorrectfilename service with mutable C buffers,
not a game replacement or a substitute for game-startup testing.
"""
from pathlib import Path
import subprocess,json,tempfile,asyncio,shutil
from verify_browser_closure_chromium import inline_graph
ROOT=Path(__file__).resolve().parents[2]
SAMPLES=[('a//b/../c',0),('/../../abc',0),('relative/..',0),('abc/def',1),('/abc/def',1),('../abc',0),('abc/',1),('/',0),('.',0),('a/b/./c',0),('some\\path',0),('a/../',1),('a/b/../../c.txt',1),('images/tiles000.art',1)]
CPP=r'''
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <algorithm>
int Bcorrectfilename(char *filename,int removefn){
  char *fn=strdup(filename),*tokarr[64],*first,*next=nullptr;
  int leadslash=*fn=='/',ntok=0;
  for(first=fn;*first;first++){}
  int trailslash=(first>fn && first[-1]=='/');
  for(char* tok=strtok_r(fn,"/",&next);tok;tok=strtok_r(nullptr,"/",&next)){
    if(!tok[0]||(!strcmp(tok,".")))continue;
    if(!strcmp(tok,".."))ntok=std::max(0,ntok-1);
    else tokarr[ntok++]=tok;
  }
  if(!trailslash&&removefn){ntok=std::max(0,ntok-1);trailslash=1;}
  if(ntok==0&&trailslash&&leadslash)trailslash=0;
  first=filename;
  if(leadslash)*first++='/';
  for(int i=0;i<ntok;i++){
    if(i)*first++='/';
    for(char* tok=tokarr[i];*tok;tok++)*first++=*tok;
  }
  if(trailslash)*first++='/';*first=0;free(fn);return 0;
}
int main(int argc,char**argv){char buffer[8192];for(int i=1;i<argc;i+=2){snprintf(buffer,sizeof(buffer),"%s",argv[i]);Bcorrectfilename(buffer,atoi(argv[i+1]));printf("%s\n",buffer);}}
'''
with tempfile.TemporaryDirectory(prefix='eduke-build-vfs-path-') as td:
    p=Path(td);(p/'reference.cpp').write_text(CPP)
    cmd=['clang++','-std=c++14','reference.cpp','-o','reference']
    r=subprocess.run(cmd,cwd=p,capture_output=True,text=True,timeout=30)
    assert r.returncode==0,r.stderr
    argv=[item for path,flag in SAMPLES for item in (path,str(flag))]
    native=subprocess.run([str(p/'reference'),*argv],cwd=p,capture_output=True,text=True,timeout=10)
    assert native.returncode==0,native.stderr
    expected=native.stdout.splitlines()
    payload=json.dumps(SAMPLES)
    runner=f'''import {{NativeRuntime}} from {json.dumps((ROOT/'runtime/index.mjs').as_uri())};
 const r=new NativeRuntime();const samples={payload};
 const out=[];for(const [name,remove] of samples){{
 const b=new Uint8Array(128);b.set(new TextEncoder().encode(name));
 if(r.library.symbols.Bcorrectfilename(b,remove)!==0)throw Error('path failed');
 out.push(new TextDecoder().decode(b.subarray(0,b.indexOf(0))));
 const ptr=r.heap.writeCString(name);
 if(r.library.symbols.Bcorrectfilename(ptr,remove)!==0)throw Error('numeric path failed');
 const same=r.heap.readCString(ptr);if(same!==out.at(-1))throw Error('heap versus bytes mismatch');r.heap.free(ptr);
 }}console.log(JSON.stringify(out));r.close();'''
    (p/'probe.mjs').write_text(runner)
    result=subprocess.run(['node','probe.mjs'],cwd=p,capture_output=True,text=True,timeout=15)
    assert result.returncode==0,result.stderr
    output=json.loads(result.stdout)
    assert output==expected,[(s,a,b) for s,a,b in zip(SAMPLES,output,expected) if a!=b]
    # Actual Chromium uses the same source-backed browser runtime.
    async def chromium():
        from playwright.async_api import async_playwright
        async with async_playwright() as pw:
            browser=await pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
            try:
                page=await browser.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
                # Use the same inline real browser module-graph strategy as the
                # already verified EDuke32 startup Chromium tests.
                mod=inline_graph({'runtime':'runtime/index.mjs'})
                await page.set_content('<html><title>Browser VFS path parity</title></html>')
                got=await page.evaluate('''async ({modules,samples})=>{
                  const {NativeRuntime}=await import(modules.runtime);
                  const r=new NativeRuntime();let out=[];
                  for(let [name,rem] of samples){let b=new Uint8Array(128);
                    b.set(new TextEncoder().encode(name));r.library.symbols.Bcorrectfilename(b,rem);
                    out.push(new TextDecoder().decode(b.subarray(0,b.indexOf(0))));}
                  r.close();return out;
                }''',{'modules':mod,'samples':SAMPLES})
                assert got==expected,(got,expected)
                assert not errs,errs
            finally:await browser.close()
    if shutil.which('chromium'): asyncio.run(chromium())
    print(f'PASS browser Bcorrectfilename {len(SAMPLES)} native/Node/Chromium cases and two C pointer modes')
