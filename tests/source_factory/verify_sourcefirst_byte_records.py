#!/usr/bin/env python3
"""Native oracle for exact Clang numeric POD union storage and object copies.

The source-AST target is Linux LP64. The native executable runs on the host;
these fixtures deliberately use only fixed-width types with matching layouts.
This is function parity evidence, not a native engine/gameplay oracle.
"""
from pathlib import Path
import json
import os
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]


def run(args, cwd):
    result = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=90)
    assert result.returncode == 0, (args, result.stdout[-2500:], result.stderr[-3500:])
    return result.stdout


SOURCE = r'''
union Word { unsigned int bits; unsigned char bytes[4]; };
struct Outer {
    unsigned char pre;
    union { unsigned int word; unsigned char bytes[4]; };
    unsigned short after;
};
struct __attribute__((packed)) Packed {
    unsigned char pre;
    union { unsigned int word; unsigned char bytes[4]; };
    unsigned short after;
};
union FloatWord { float number; unsigned int bits; };
union ByteInit { unsigned char bytes[4]; unsigned int bits; };
static Word globals[2] = {{0x12345678u}, {0xabcdef01u}};
static Outer empty;
extern "C" unsigned int named(unsigned int x) {
    Word value={x}; value.bytes[2]=(unsigned char)(x>>3);
    return value.bits ^ ((unsigned int)value.bytes[0]<<24);
}
extern "C" unsigned int anonymous(unsigned int x) {
    Outer value={3,{x},7};
    value.bytes[1]=(unsigned char)(x>>11);
    Outer copy=value; copy.bytes[3] ^= 0x5a;
    return value.word ^ copy.word ^ value.pre ^ ((unsigned int)value.after<<16);
}
extern "C" unsigned int packed(unsigned int x) {
    Packed value={9,{x},17};
    value.bytes[3]=(unsigned char)(x>>5);
    return value.word ^ ((unsigned int)value.pre<<8) ^ value.after;
}
extern "C" unsigned int floatbits(unsigned int x) {
    FloatWord value={((float)(x&65535))/16.0f};return value.bits;
}
extern "C" unsigned int initialized(unsigned int x) {
    ByteInit value={{1,2,3}};
    return value.bits ^ globals[x&1].bits ^ empty.word;
}
struct BadPointer { union { unsigned int bits; int *p; }; };
struct BadBitfield { union { unsigned int bits; unsigned int flags:9; }; };
extern "C" unsigned int reject_pointer(unsigned int x) {BadPointer v={};v.bits=x;return v.bits;}
extern "C" unsigned int bitfield_value(unsigned int x) {BadBitfield v={};v.flags=x;return v.flags;}
'''

with tempfile.TemporaryDirectory(prefix='eduke-byte-record-') as tmp:
    directory = Path(tmp)
    (directory/'unit.cpp').write_text(SOURCE)
    (directory/'driver.cpp').write_text(r'''
#include <cstdio>
extern "C" unsigned int named(unsigned int),anonymous(unsigned int),packed(unsigned int),floatbits(unsigned int),initialized(unsigned int),bitfield_value(unsigned int);
int main(){for(unsigned int i=0;i<1024;i++){unsigned int x=i*0x9e3779b9u;
printf("%u,%u,%u,%u,%u,%u\n",named(x),anonymous(x),packed(x),floatbits(x),initialized(x),bitfield_value(x));}}
''')
    native = directory/('native.exe' if os.name == 'nt' else 'native')
    run(['clang++', '-std=c++14', '-funsigned-char', '-fno-strict-aliasing',
         'unit.cpp', 'driver.cpp', '-o', str(native)], directory)
    expected = run([str(native)], directory).splitlines()
    run([sys.executable, str(ROOT/'tools/source_ast_to_js.py'), '--root', str(directory),
         '--source', 'unit.cpp', '--out-dir', str(directory/'out')], directory)
    module = directory/'out/unit.cpp.mjs'
    report = json.loads(module.with_suffix('.manifest.json').read_text())
    rows = {row['source_name']: row for row in report['definitions']}
    for name in ('named', 'anonymous', 'packed', 'floatbits', 'initialized', 'globals', 'empty', 'bitfield_value'):
        assert rows[name]['status'] == 'source-first', (name, rows[name])
    assert rows['reject_pointer']['status']=='source-first',rows['reject_pointer']
    run(['node', '--check', str(module)], directory)
    (directory/'runner.mjs').write_text('import * as s from '+json.dumps(module.as_uri())+';\n'+r'''
for(let i=0;i<1024;i++){
  const x=Math.imul(i,0x9e3779b9)>>>0;
  if(s.reject_pointer(x)!==x)throw Error('Numeric union member changed through a pointer alternative');
  console.log([s.named(x),s.anonymous(x),s.packed(x),s.floatbits(x),s.initialized(x),s.bitfield_value(x)].join(','));
}
''')
    observed = run(['node', 'runner.mjs'], directory).splitlines()
    assert observed == expected, next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected))
                                      if a != b), ('different output lengths',len(observed),len(expected)))
    print('PASS 6144 native C++/JavaScript values: overlapping named/anonymous unions, packed offsets, independent copies, float representation and global storage; numeric members of pointer unions preserve bytes; bitfield masking verified')
