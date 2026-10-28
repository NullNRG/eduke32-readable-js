"""Prove exact target-ABI lowering of original C null-base field-offset macro."""
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import Emit, Unsupported, parse_clang_record_layouts
with tempfile.TemporaryDirectory() as directory:
    src=Path(directory)/'layout.cpp'
    src.write_text('''#include <stdint.h>\n#include <stddef.h>\nstruct netSector_t { int16_t wallptr; int32_t wallnum; int8_t flag; };\nstruct netField_t { const char *name; int32_t offset; int32_t bits; };\n#define SECTF(x) #x,(int32_t)(size_t)&((netSector_t*)0)->x\nstatic netField_t SectorFields[] = {{SECTF(wallptr),16},{SECTF(wallnum),32},{SECTF(flag),8}};\n''')
    clang=['clang++','-std=gnu++14']
    ast=subprocess.run([*clang,'-Xclang','-ast-dump=json','-Xclang','-ast-dump-filter=SectorFields','-fsyntax-only',str(src)],capture_output=True,text=True,check=True)
    decl=json.loads(ast.stdout)
    dump=subprocess.run([*clang,'-Xclang','-fdump-record-layouts-complete','-fsyntax-only',str(src)],capture_output=True,text=True,check=True)
    layouts=parse_clang_record_layouts(dump.stdout+dump.stderr)
    assert layouts['netSector_t']['size']==12
    em=Emit();em.record_layouts=layouts
    emitted=[]
    for item in decl['inner'][0]['inner']:
        initializer=item['inner'][1] # integer-offset initializer
        generated=em.expr(initializer)
        emitted.append(generated)
    assert emitted==['i32(i32(0))','i32(i32(4))','i32(i32(8))'],emitted
    assert all('cObjectFieldRef' not in x for x in emitted)
    em.record_layouts={}
    try:em.expr(decl['inner'][0]['inner'][0]['inner'][1])
    except Unsupported as e:assert 'needs Clang ABI' in str(e)
    else:raise AssertionError('missing ABI must fail closed')
    print('PASS: 3 Clang ABI field offsets exactly 0, 4, 8; missing layout rejected')
