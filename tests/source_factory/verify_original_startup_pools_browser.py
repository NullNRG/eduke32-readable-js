#!/usr/bin/env python3
"""Source-derived Build engine startup pool and NOASM provider browser smoke test.

Importing table declarations proves their initialization, NOT execution of
initdivtables/enginePreInit or that numeric POD arrays have a native pointer ABI.
"""
import asyncio,base64,json,shutil,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'factory-output/source-tree/eduke32-master'
COMPILER=ROOT/'tools/source_ast_to_js.py'
TABLES=('divtable64','divtable32','bfdivtable64','bfdivtable32')

def run(args):
    p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=80)
    if p.returncode:raise AssertionError((args,p.stdout[-1800:],p.stderr[-1800:]))

with tempfile.TemporaryDirectory(prefix='build-original-tables-') as directory:
    out=Path(directory)
    run([sys.executable,str(COMPILER),'--root',str(SRC),'--source','source/build/src/pragmas.cpp',
         '--filter','initdivtables,'+','.join(TABLES),
         '--header-dependency-closure','--enum-closure','--out-dir',str(out/'pragmas')])
    path=out/'pragmas/source/build/src/pragmas.cpp.mjs'
    manifest=json.loads(path.with_suffix('.manifest.json').read_text())
    rows={r['name']:r for r in manifest['definitions']}
    assert set(TABLES).issubset(rows)
    assert all(rows[t]['status']=='source-first' for t in TABLES)
    assert rows['initdivtables']['status']=='blocked'
    # These four missing original libdivide generators must remain visible.
    missing=rows['initdivtables'].get('unresolved_references',[])
    assert set(('libdivide_s32_gen','libdivide_s64_gen','libdivide_s32_branchfree_gen','libdivide_s64_branchfree_gen')).issubset(missing),missing
    assert set(manifest['implicit_member_closure']['proven'])==set((
        'libdivide_s32_t','libdivide_s64_t','libdivide_s32_branchfree_t','libdivide_s64_branchfree_t'))
    run([sys.executable,str(COMPILER),'--root',str(SRC),'--source','source/build/src/baselayer.cpp',
         '--filter','makeasmwriteable','--out-dir',str(out/'baselayer')])
    asm=out/'baselayer/source/build/src/baselayer.cpp.mjs'
    j=json.loads(asm.with_suffix('.manifest.json').read_text())
    row=[r for r in j['definitions'] if r['name']=='makeasmwriteable']
    assert len(row)==1 and row[0]['status']=='source-first',row
    # The real project compile flags must explicitly select NOASM.
    commands=json.loads((ROOT/'factory-output/compile_commands.json').read_text())
    original=next(c for c in commands if c['file']=='source/build/src/baselayer.cpp')
    assert '-DNOASM' in original['arguments'], 'not a verified NOASM build'
    run(['node','--check',str(path)]);run(['node','--check',str(asm)])
    js=("import * as p from "+json.dumps(path.as_uri())+';\nimport {makeasmwriteable} from '+json.dumps(asm.as_uri())+';\n'+
        'for (const name of '+json.dumps(TABLES)+') { const a=p[name]; if(a.length!==16384) throw new Error(name);\n'+
        'for (const i of [0,17,16383]) if(a[i].magic!==0 && a[i].magic!==0n || a[i].more!==0)throw new Error("zero "+name);}\n'+
        'makeasmwriteable();console.log("PASS source Build tables + NOASM function");\n')
    script=out/'check.mjs';script.write_text(js)
    p=subprocess.run(['node',str(script)],cwd=ROOT,capture_output=True,text=True,timeout=30)
    assert p.returncode==0,(p.stdout,p.stderr)
    if shutil.which('chromium'):
        async def chrome():
            from playwright.async_api import async_playwright
            async with async_playwright() as pw:
                browser=await pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,
                    args=['--no-sandbox','--disable-gpu-sandbox'])
                try:
                    page=await browser.new_page();await page.set_content('<title>Original Build startup ABI</title>')
                    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                    result=await page.evaluate('''async o=>{
                        const toUrl=b=>URL.createObjectURL(new Blob([Uint8Array.from(atob(b),c=>c.charCodeAt(0))],{type:'text/javascript'}));
                        const uris=[toUrl(o.table),toUrl(o.asm)];
                        try {
                          const t=await import(uris[0]), a=await import(uris[1]);
                          for(const name of o.names) {
                            if(t[name].length!==16384) throw new Error('extent '+name);
                            for(const i of [0,17,16383]){
                              const row=t[name][i];
                              if(BigInt(row.magic)!==0n || row.more!==0)throw new Error('initial '+name);
                            }
                          }
                          a.makeasmwriteable();
                          return {tables:o.names.length,records:16384*o.names.length,asm:'executed'};
                        } finally {uris.forEach(URL.revokeObjectURL);}
                    }''',{'table':base64.b64encode(path.read_bytes()).decode(),
                           'asm':base64.b64encode(asm.read_bytes()).decode(),'names':TABLES})
                    assert result=={'tables':4,'records':65536,'asm':'executed'},result
                    assert not errors,errors
                finally:await browser.close()
        asyncio.run(chrome())
    print('PASS original Build: 4x16384 source-compiled POD table records and NOASM makeasmwriteable in Node/Chromium; initdivtables unlinked')
