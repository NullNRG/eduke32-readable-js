#!/usr/bin/env python3
"""Filtered anonymous source tables retain exact byte ABI and callbacks."""
import asyncio
import base64
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_anonymous_records import blocked_anonymous_global_arrays
from source_byte_records import cpp_layout_type


def run(command,cwd):
    result=subprocess.run(command,cwd=cwd,capture_output=True,text=True,timeout=90)
    assert result.returncode==0,(command,result.stdout[-2000:],result.stderr[-3000:])
    return result.stdout


async def browser(module,body,expected):
    executable=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE') or shutil.which('chromium')
    if not executable:return False
    from playwright.async_api import async_playwright
    async with async_playwright() as playwright:
        instance=await playwright.chromium.launch(executable_path=executable,headless=True)
        try:
            page=await instance.new_page()
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            await page.set_content('<title>Original-source anonymous table ABI</title>')
            actual=await page.evaluate('''async ({module,body}) => {
                const url=URL.createObjectURL(new Blob([Uint8Array.from(atob(module),c=>c.charCodeAt(0))],{type:'text/javascript'}));
                try {const m=await import(url);return new Function('m',body)(m);}
                finally {URL.revokeObjectURL(url);}
            }''',{'module':base64.b64encode(module.read_bytes()).decode(),'body':body})
            assert actual==expected,(actual[:4],expected[:4])
            assert not errors,errors
            return True
        finally:await instance.close()


# Recognition requests the real type AST, and cannot itself grant a layout.
spelling='struct (unnamed at source/audio.cpp:54:8)'
row={'kind':'VarDecl','status':'blocked','original_type':spelling+'[4]',
     'reason':'unsupported global array element type '+spelling}
assert blocked_anonymous_global_arrays([row])==[spelling]
assert cpp_layout_type('int (*)(void)') == cpp_layout_type('int (*)()')
assert cpp_layout_type('int (*)(int, void (*)(void))') == cpp_layout_type('int (*)(int, void (*)())')
assert cpp_layout_type('int (*)(void *)') != cpp_layout_type('int (*)()')
assert cpp_layout_type('void (*)(void)') != cpp_layout_type('int (*)()')
for change in ({'kind':'FunctionDecl'},{'original_type':spelling+'[0]'},
               {'original_type':'struct (unnamed at elsewhere.cpp:54:8)[4]'},
               {'original_type':spelling+'[]'}, {'reason':'unsupported global array element type Named'}):
    assert not blocked_anonymous_global_arrays([{**row,**change}]),change

with tempfile.TemporaryDirectory(prefix='eduke-anonymous-tables-') as temporary:
    directory=Path(temporary)
    (directory/'unit.cpp').write_text(r'''
static int increment(int x){return x+3;}
static int decrement(int x){return x-7;}
static int zero(void){return 17;}
static int notifications;
static void notify(void){notifications++;}
static struct {
 const char *name; int (*callback)(int); int code;
 int (*zero)(void); void (*notify)(void); int (*nested)(int, void (*)(void));
} drivers[4] = {
 {"First",increment,11,zero,notify,nullptr},{"Second",decrement,19},{"Null",nullptr,23}
};
static struct { int code; int (*callback)(int); } other[2]={{31,decrement}};
extern "C" int api_probe(int row,int x){
 int extra=drivers[row].zero ? drivers[row].zero() : 0;
 return extra+(drivers[row].callback ? drivers[row].callback(x)+drivers[row].code : drivers[row].code);
}
extern "C" int api_name(int row){return drivers[row].name ? drivers[row].name[0] : 0;}
extern "C" int api_mutate(int n){
 if(drivers[0].notify)drivers[0].notify();
 drivers[0].code+=n;other[0].code^=n;
 return drivers[0].code+other[0].code+other[0].callback(n)+notifications;
}
extern "C" int api_layout(){return sizeof(drivers)+sizeof(other);}
''')
    (directory/'driver.cpp').write_text(r'''#include <cstdio>
extern "C" int api_probe(int,int),api_name(int),api_mutate(int),api_layout();
int main(){for(int n=0;n<512;n++){
 printf("%d,%d,%d,%d\n",api_probe(n%4,n-256),api_name(n%4),api_mutate(n%17),api_layout());
}}
''')
    executable=directory/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14','unit.cpp','driver.cpp','-o',str(executable)],directory)
    expected=run([str(executable)],directory).splitlines()
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(directory),
         '--source','unit.cpp','--filter','api_probe,api_name,api_mutate,api_layout',
         '--dependency-closure','--out-dir',str(directory/'out')],ROOT)
    module=directory/'out/unit.cpp.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    definitions={entry['source_name']:entry for entry in manifest['definitions']}
    for name in ('drivers','other','increment','decrement','zero','notify','api_probe','api_name','api_mutate','api_layout'):
        assert definitions[name]['status']=='source-first',(name,definitions[name])
    assert manifest['full_type_closure']['attempted']
    assert definitions['drivers']['object_storage']['stride']==48
    assert definitions['other']['object_storage']['stride']==16
    assert {'increment','decrement'} <= set(manifest['dependency_closure']['additional_ast_filters'])
    run(['node','--check',str(module)],directory)
    body='''const result=[];
      const storage=Symbol.for('source-first.clang-byte-record-array/1');
      if(m.drivers[storage].byteLength!==192 || m.other[storage].byteLength!==32)throw Error('array lost contiguous ABI');
      if(m.drivers[3].callback!==null || m.drivers[3].name!==null || m.drivers[3].code!==0)throw Error('tail not zero initialized');
      if(m.drivers[0].callback!==m.increment || m.drivers[1].callback!==m.decrement || m.other[0].callback!==m.decrement)throw Error('callback identity changed');
      if(m.drivers[0].zero!==m.zero || m.drivers[0].notify!==m.notify || m.drivers[0].nested!==null)throw Error('empty or nested prototype lost callback identity');
      for(let n=0;n<512;n++)result.push([m.api_probe(n%4,n-256),m.api_name(n%4),m.api_mutate(n%17),m.api_layout()].join(','));
      return result;'''
    (directory/'runner.mjs').write_text('import * as m from '+json.dumps(module.as_uri())+';\n'
        +'console.log(new Function("m",'+json.dumps(body)+')(m).join("\\n"));\n')
    observed=run(['node','runner.mjs'],directory).splitlines()
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected)) if a!=b),None)
    chromium=asyncio.run(browser(module,body,expected))
    print('PASS 2048 native/Node'+('/Chromium' if chromium else '')
          +' values: filtered anonymous tables, exact Clang layout, source callbacks, string pointers, mutation and zero-filled tail')
