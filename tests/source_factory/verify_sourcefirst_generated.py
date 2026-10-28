#!/usr/bin/env python3
"""Prove Make-generated shader inputs and source-first JavaScript byte parity."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_generated import recover

source=ROOT/'factory-output/source-tree/eduke32-master'
commands=json.loads((ROOT/'factory-output/compile_commands.json').read_text())
missing=['obj/build/polymost1Frag.glsl.cpp','obj/build/polymost1Vert.glsl.cpp']
assert all(any(x['file']==m for x in commands) for m in missing)
assert 'R"shader' in (source/'GNUmakefile').read_text()
with tempfile.TemporaryDirectory() as td:
    scratch=Path(td)
    (scratch/'source/build/src').mkdir(parents=True)
    (scratch/'GNUmakefile').write_bytes((source/'GNUmakefile').read_bytes())
    for f in missing:
        symbol=Path(f).name[:-len('.glsl.cpp')]
        target=scratch/'source/build/src'/(symbol+'.glsl')
        original=source/'source/build/src'/(symbol+'.glsl')
        target.write_bytes(original.read_bytes())
    rows=recover(scratch,missing)
    assert len(rows)==2
    assert len(recover(scratch,missing))==2  # Idempotent; verify existing inputs against exact original rule.
    for entry in rows:
        symbol=Path(entry['source']).name[:-len('.glsl.cpp')]
        shader=(scratch/entry['make_input']).read_bytes()
        cxx=(scratch/entry['source']).read_bytes()
        assert cxx==f'extern char const *{symbol};\nchar const *{symbol} = R"shader('.encode()+shader+b')shader";\n'
        # Verify the recovered translation unit is valid C++ in the original compiler environment.
        clang=subprocess.run(['clang++','-std=gnu++14','-fsyntax-only',str(scratch/entry['source'])],capture_output=True,text=True)
        assert clang.returncode==0,clang.stderr
    # Parity-test the complete real C++-to-JavaScript source-first extraction.
    out=scratch/'readable'
    for entry in rows:
        origin=source/entry['make_input']
        src=scratch/entry['source']
        symbol=src.name[:-len('.glsl.cpp')]
        result=subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),
            '--root',str(scratch),'--source',entry['source'],
            '--compile-commands',str(ROOT/'factory-output/compile_commands.json'),
            '--out-dir',str(out)],capture_output=True,text=True,cwd=ROOT)
        assert result.returncode==0,result.stderr
        manifest=json.loads((out/(entry['source']+'.mjs')).with_suffix('.manifest.json').read_text())
        assert manifest['emitted']==1 and manifest['blocked']==0,manifest
        module=(out/(entry['source']+'.mjs')).resolve()
        js="import * as m from "+json.dumps(module.as_uri())+"; const p=m["+json.dumps(symbol)+"];"+'''
let bytes;
if(ArrayBuffer.isView(p) && !(p instanceof DataView)) {
  bytes=new Uint8Array(p.buffer,p.byteOffset,p.byteLength);
} else if(p && p.__cPointer===true && !p.array && p.buffer instanceof ArrayBuffer &&
          p.offset>=p.lower && p.upper<=p.buffer.byteLength) {
  bytes=new Uint8Array(p.buffer,p.offset,p.upper-p.offset);
} else throw Error('unbounded GLSL char pointer');
if(bytes.at(-1)!==0)throw Error('GLSL C string has no terminal NUL');
process.stdout.write(JSON.stringify(Array.from(bytes.subarray(0,bytes.length-1))));
'''
        check=subprocess.run(['node','--input-type=module','-e',js],capture_output=True,text=True)
        assert check.returncode==0,check.stderr
        assert bytes(json.loads(check.stdout))==origin.read_bytes(),symbol
print('PASS: 2 original GNUmakefile shader sources generated, 2 C++ AST outputs, exact GLSL byte parity, 0 blocked definitions')
