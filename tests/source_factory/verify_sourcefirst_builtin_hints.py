#!/usr/bin/env python3
"""Native parity for Clang-proven builtin hints and byte swapping."""
from pathlib import Path
import subprocess,sys,tempfile
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from source_ast_to_js import parse_json_stream,produce,BUILTIN_JS
with tempfile.TemporaryDirectory() as temp:
    p=Path(temp)
    (p/'test.cpp').write_text('''#include <stdint.h>
int hinted(int x) { return __builtin_expect(x,17); }
int probable(int x) { return __builtin_expect_with_probability(x,2,0.75); }
unsigned short swapped(unsigned short x) { return __builtin_bswap16(x); }
''')
    (p/'driver.cpp').write_text('''#include <cstdio>
int hinted(int);int probable(int);unsigned short swapped(unsigned short);
int main(){for(int i=0;i<384;i++){int a=i*197-36000;printf("%d %d %u\\n",hinted(a),probable(a),swapped((unsigned short)a));}}
''')
    def run(args):
        r=subprocess.run(args,cwd=p,text=True,capture_output=True,timeout=50)
        assert r.returncode==0,(args,r.stderr[-1400:]);return r.stdout
    run(['clang++','-std=c++14','test.cpp','driver.cpp','-o','native'])
    native=run([str(p/'native')])
    ast=parse_json_stream(run(['clang++','-std=c++14','-Xclang','-ast-dump=json','-fsyntax-only','test.cpp']))
    code,rows=produce(ast,p/'test.cpp','test.cpp',source_root=p)
    assert all(r['status']=='source-first' for r in rows),rows
    (p/'test.mjs').write_text('const i32=x=>Number(x)|0; const i64=x=>BigInt.asIntN(64,BigInt(x)); const u32=x=>Number(x)>>>0;\n'+BUILTIN_JS['__builtin_bswap16']+'\n'+'\n'.join(code)+'''
for(let i=0;i<384;i++){let a=i*197-36000;console.log(`${hinted(a)} ${probable(a)} ${swapped(a&65535)}`);}
''')
    js=run(['node','test.mjs'])
    assert js==native,(js[:500],native[:500])
    print('PASS: 1,152 native C++/JS builtin-hint and 16-bit byteswap results')
