#!/usr/bin/env python3
"""Native/C++ vs Node vs Chromium bounded, Clang-layout C++ record-pointer ABI."""
from pathlib import Path
import asyncio, json, random, shutil, subprocess, sys, tempfile
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
SOURCE='tests/source_factory/source_first_record_pointer_fixture.cpp'
def run(args,cwd=ROOT):
    p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=70)
    if p.returncode:raise AssertionError((args,p.stdout[-1200:],p.stderr[-1400:]))
    return p.stdout
with tempfile.TemporaryDirectory(prefix='source_record_pointer_') as td:
    tmp=Path(td)
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),
         '--source',SOURCE,'--out-dir',str(tmp/'js')])
    mod=tmp/'js'/(SOURCE+'.mjs')
    report=json.loads(mod.with_suffix('.manifest.json').read_text())
    assert report['blocked']==0,report['definitions']
    run(['node','--check',str(mod)])
    # Prove filtered Clang AST recovery of an original TypeAliasDecl: the
    # function's AST alone contains CellPtr / CellAlias, not Cell's class body.
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),
         '--source',SOURCE,'--filter','cell_alias_sum','--out-dir',str(tmp/'filtered')])
    filtered=tmp/'filtered'/(SOURCE+'.mjs')
    filtered_manifest=json.loads(filtered.with_suffix('.manifest.json').read_text())
    assert any(d['name']=='cell_alias_sum' and d['status']=='source-first'
               for d in filtered_manifest['definitions']),filtered_manifest['definitions']
    run(['node','--check',str(filtered)])
    random.seed(103)
    inputs=[]
    for _ in range(192):
        count=random.randrange(1,18)
        cells=[{'x':random.randint(-200000,200000),'y':random.randint(-200000,200000)} for _ in range(count)]
        inputs.append({'count':count,'cells':cells})
    (tmp/'native.cpp').write_text('''#include <cstdio>\n#include "'''+str(ROOT/SOURCE)+'''"\nint main(){\n'''+''.join(
       'Cell c%d[] = {%s}; printf("%%d,%%d,%%d\\n",cell_walk(c%d,%d),cell_skip(c%d,%d),cell_alias_sum(c%d,%d));\n'%(i,','.join('{%d,%d}'%(j['x'],j['y']) for j in case['cells']),i,case['count'],i,case['count'],i,case['count'])
        for i,case in enumerate(inputs))+ '}')
    run(['clang++','-std=gnu++14',str(tmp/'native.cpp'),'-o',str(tmp/'native')])
    expected=run([str(tmp/'native')]).strip().splitlines()
    (tmp/'run.mjs').write_text('import {cell_walk,cell_skip,cell_alias_sum} from '+json.dumps(mod.as_uri())+';'
       +'import {cell_alias_sum as filtered_alias} from '+json.dumps(filtered.as_uri())+';'
       +'const inputs='+json.dumps(inputs)+';for (const {count,cells} of inputs) {'
       +'const a=cell_alias_sum(cells,count);if(filtered_alias(cells,count)!==a)throw Error("Clang alias mismatch");'
       +'console.log(cell_walk(cells,count)+","+cell_skip(cells,count)+","+a); }\n'
       +'const one=[{x:1,y:2}];let blocked=0;for(const [f,n] of [[cell_walk,2],[cell_skip,3],[filtered_alias,2]])'
       +'{try{f(one,n)}catch(e){if(e instanceof RangeError)blocked++}}'
       +'if(blocked!==3)throw Error("record pointer overrun accepted");\n')
    node=run(['node',str(tmp/'run.mjs')]).strip().splitlines()
    assert node==expected,next(((i,x,y) for i,(x,y) in enumerate(zip(node,expected)) if x!=y),None)
    async def browser():
      async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        try:
          page=await b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
          result=await page.evaluate('''async ({code,filteredCode,inputs})=>{
             const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
             const aliasUrl=URL.createObjectURL(new Blob([filteredCode],{type:'text/javascript'}));
             try{
             const {cell_walk,cell_skip,cell_alias_sum}=await import(url);
             const {cell_alias_sum: filtered_alias}=await import(aliasUrl);let out=[];
             for(const {count,cells} of inputs){const a=cell_alias_sum(cells,count);
               if(filtered_alias(cells,count)!==a)throw Error('alias mismatch');
               out.push(cell_walk(cells,count)+','+cell_skip(cells,count)+','+a);}
             let rejected=0; for(const [f,n] of [[cell_walk,2],[cell_skip,3],[filtered_alias,2]]){
               try{f([{x:1,y:2}],n)}catch(e){if(e instanceof RangeError)rejected++;}}
             return {out,rejected};} finally{URL.revokeObjectURL(url);URL.revokeObjectURL(aliasUrl);}}''',
             {'code':mod.read_text(),'filteredCode':filtered.read_text(),'inputs':inputs})
          assert not errors,errors
          return result
        finally:await b.close()
    result=asyncio.run(browser())
    assert result['out']==expected,(result['out'][:8],expected[:8])
    assert result['rejected']==3,result
    print('PASS Clang record layout + bounded pointer arithmetic, native/Node/Chromium:',len(expected),'cases across three source functions, filtered original typedef recovery, three bounds checks')
