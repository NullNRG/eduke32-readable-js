#!/usr/bin/env python3
"""Original Build CRC initialization: C++ source vs generated JS in Node and Chromium.

The functions are extracted byte-for-byte from the original source tree; no
handwritten reimplementation substitutes for a game function. Also exercises
cross-Clang-AST header VarDecl ownership during the engine.cpp filtered build.
"""
from __future__ import annotations
import asyncio, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path
from playwright.async_api import async_playwright
from verify_browser_closure_chromium import inline_graph

ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'factory-output/source-tree/eduke32-master'
OUT=ROOT/'factory-output/source-first/engine-startup-crc'
REPORT=ROOT/'reports/browser-target/original-build-crc-parity.json'

def checked(command, **kwargs):
    run=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,timeout=35,**kwargs)
    if run.returncode:
        raise AssertionError(f'{command!r} failed: {run.stdout[-1200:]} {run.stderr[-1200:]}')
    return run.stdout

def original_function(path,signature):
    text=path.read_text()
    hits=list(re.finditer(re.escape(signature)+r'\s*\{',text))
    if len(hits)!=1:raise AssertionError(f'Function does not have unique original source body: {signature}')
    start=hits[0].start();end=hits[0].end();depth=1
    while depth and end<len(text):
        depth+=(text[end]=='{')-(text[end]=='}');end+=1
    if depth:raise AssertionError('Unbalanced original source function')
    return text[start:end]

def compile_orig():
    OUT.mkdir(parents=True,exist_ok=True)
    for source,entry in [('source/build/src/engine.cpp','initcrc16'),
                         ('source/build/src/crc32.cpp','initcrc32table')]:
        checked([sys.executable,'tools/source_ast_to_js.py','--root',str(SRC),'--source',source,
            '--filter',entry,'--dependency-closure','--out-dir',str(OUT)])
        manifest=json.loads((OUT/(source+'.manifest.json')).read_text())
        assert manifest['blocked']==0, (entry, manifest['definitions'])
        assert any(x['name']==entry and x['status']=='source-first' for x in manifest['definitions'])
        if entry=='initcrc16':
            header=[x for x in manifest['definitions'] if x['name']=='crctab16']
            assert len(header)==1 and header[0]['status']=='source-first' and header[0]['header_global_definition']['source_header']=='source/build/include/build.h'

async def browser_tables():
    urls=inline_graph({'crc16': 'factory-output/source-first/engine-startup-crc/source/build/src/engine.cpp.mjs',
                       'crc32': 'factory-output/source-first/engine-startup-crc/source/build/src/crc32.cpp.mjs'})
    errors=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        try:
            page=await browser.new_page()
            page.on('pageerror',lambda error: errors.append(str(error)))
            await page.set_content('<html><body><canvas></canvas></body></html>')
            result=await page.evaluate('''async urls=>{
                const a=await import(urls.crc16),b=await import(urls.crc32);
                a.initcrc16();b.initcrc32table();
                return {crc16:[...a.crctab16],crc32:b.crc32table.map(row=>[...row])};
            }''',urls)
            assert not errors,errors
            return result
        finally:await browser.close()

async def main():
    compile_orig()
    engine=SRC/'source/build/src/engine.cpp'
    crc=SRC/'source/build/src/crc32.cpp'
    cpp='''#include <cstdint>\n#include <iostream>\n#define POLY 0xEDB88320\n#define BITNESS64 1\nint32_t crctab16[256];\nuint32_t crc32table[8][256];\n'''
    cpp+=original_function(engine,'void initcrc16()')+'\n'
    cpp+=original_function(crc,'void initcrc32table(void)')+'\n'
    cpp+='''int main() { initcrc16();initcrc32table();
        std::cout << "{\\"crc16\\":[";
        for(int i=0;i<256;i++)std::cout<<(i?",":"")<<crctab16[i];
        std::cout<<"],\\"crc32\\":[";
        for(int i=0;i<8;i++) { std::cout<<(i?",[":"[");
          for(int j=0;j<256;j++)std::cout<<(j?",":"")<<crc32table[i][j];
          std::cout<<"]"; }
        std::cout<<"]}\\n";
    }\n'''
    with tempfile.TemporaryDirectory() as tmp:
        source=Path(tmp)/'source.cpp'; exe=Path(tmp)/'native'
        source.write_text(cpp)
        checked(['clang++','-std=c++17','-O1',str(source),'-o',str(exe)])
        native=json.loads(checked([str(exe)]))
    js='''import * as a from './factory-output/source-first/engine-startup-crc/source/build/src/engine.cpp.mjs';
import * as b from './factory-output/source-first/engine-startup-crc/source/build/src/crc32.cpp.mjs';
a.initcrc16();b.initcrc32table();console.log(JSON.stringify({crc16:[...a.crctab16],crc32:b.crc32table.map(r=>[...r])}));'''
    node=json.loads(checked(['node','--input-type=module','-e',js]))
    chromium=await browser_tables()
    assert native==node==chromium,'Original Build CRC table parity mismatch'
    assert len(native['crc16'])==256 and len(native['crc32'])==8 and all(len(x)==256 for x in native['crc32'])
    result={'format':'eduke32-original-build-crc-parity/1','status':'PASS',
        'functions':['source/build/src/engine.cpp::initcrc16','source/build/src/crc32.cpp::initcrc32table'],
        'original_header_global_recovered':'source/build/include/build.h::crctab16',
        'crc16_table_entries':256,'crc32_table_entries':2048,
        'native_node_chromium_exact_matches':2304,
        'original_app_main_executed':False,'original_gameplay_verified':False}
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))

if __name__=='__main__':asyncio.run(main())
