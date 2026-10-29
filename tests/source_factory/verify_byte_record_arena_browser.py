#!/usr/bin/env python3
"""Native/Node/Chromium parity for Clang-sized contiguous C union record arrays."""
import asyncio, base64, json, shutil, subprocess, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
CPP=r'''
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <cstddef>
struct Cell {
 union { struct {std::int32_t x,y;}; std::int32_t pair[2];};
 std::uint16_t shade,flags;
};
static_assert(sizeof(Cell)==12, "ABI size");
static_assert(offsetof(Cell,shade)==8, "ABI shade offset");
static_assert(offsetof(Cell,flags)==10, "ABI flags offset");
int main() {
 Cell arr[4] = {};
 arr[1].x=-65;arr[1].y=0x10203040;arr[1].shade=65531;arr[1].flags=412;
 arr[2]=arr[1];arr[2].pair[0]=91;
 for (auto &v : arr) std::printf("%d,%d,%u,%u\n",v.x,v.y,v.shade,v.flags);
 for (const auto v : reinterpret_cast<std::uint8_t(&)[sizeof arr]>(arr)) std::printf("%u,",unsigned(v));
 std::printf("\n");
}
'''
SCHEMA={'size':12,'fields':{
 'x':{'offset':0,'native':'Int32Array','size':4},
 'y':{'offset':4,'native':'Int32Array','size':4},
 'pair':{'offset':0,'native':'Int32Array','size':8,'length':2},
 'shade':{'offset':8,'native':'Uint16Array','size':2},
 'flags':{'offset':10,'native':'Uint16Array','size':2}}}
JS=(ROOT/'tools/source_address_runtime.mjs').read_text()+'\n'+(ROOT/'tools/source_aggregate_runtime.mjs').read_text()+'''
function run() {
 const schema = '''+json.dumps(SCHEMA)+''';
 const a=cByteRecordArray(schema,4);
 if(!Array.isArray(a) || a.length!==4 || a[1]!==a[1])throw Error('record array identity');
 a[1].x=-65;a[1].y=0x10203040;a[1].shade=65531;a[1].flags=412;
 a[2]=a[1];a[2].pair[0]=91;
 const rows=Array.from(a,v=>[v.x,v.y,v.shade,v.flags].join(','));
 const raw=Array.from(a[cByteRecordArrayStorage],v=>v).join(',')+',';
 const checks=[];
 for(const op of [()=>{a[1]=a[0]?.x;},()=>{a[-1]=a[0]},()=>{a.length=6},()=>cByteRecordArray(schema,268435457)]) {
   try{op();checks.push(false)}catch(e){checks.push(e instanceof TypeError || e instanceof RangeError)}
 }
 if(checks.some(v=>!v))throw Error('record array rejected unproved or out-of-bounds operation');
 return [...rows,raw];
}
export {run};
'''
def execute(*cmd,cwd=None):
 p=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True,timeout=30)
 if p.returncode:raise RuntimeError(f'cmd {cmd}: {p.stderr[-1200:]}')
 return p.stdout.strip().splitlines()
async def check_browser(source,expected):
 from playwright.async_api import async_playwright
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-gpu-sandbox'])
  try:
   page=await browser.new_page();await page.set_content('<title>Record array parity</title>');errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   result=await page.evaluate('''async encoded => {const raw=atob(encoded);const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:'text/javascript'}));try{return (await import(url)).run()}finally{URL.revokeObjectURL(url)}}''',base64.b64encode(source.encode()).decode())
   if result!=expected or errors:raise AssertionError((result,expected,errors))
  finally:await browser.close()
with tempfile.TemporaryDirectory(prefix='eduke-record-arena-') as d:
 path=Path(d);(path/'main.cpp').write_text(CPP)
 execute('clang++','-std=c++17','main.cpp','-o','native',cwd=d)
 native=execute(str(path/'native'))
 (path/'check.mjs').write_text(JS+'console.log(run().join("\\n"));\n')
 node=execute('node','check.mjs',cwd=d)
 assert native==node,(native,node)
 if shutil.which('chromium'):asyncio.run(check_browser(JS,native))
 print(f'PASS native/Node/Chromium {len(native)} rows; 4 rejected invalid allocations/assignments')
