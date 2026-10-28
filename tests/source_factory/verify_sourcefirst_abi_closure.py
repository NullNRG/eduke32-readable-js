#!/usr/bin/env python3
"""Clang-owned anonymous typedef and scalar ABI recovery; native C++ parity."""
from pathlib import Path
import json
import subprocess
import sys
import tempfile
ROOT=Path(__file__).resolve().parents[2]

def run(args,cwd,timeout=110):
    p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=timeout)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-2000:])
    return p.stdout

with tempfile.TemporaryDirectory(prefix='eduke-abi-closure-') as dirname:
    work=Path(dirname)
    (work/'types.hpp').write_text('''
#include <stdint.h>
typedef struct { short a; void (*action)(int); unsigned char b; } Midi;
typedef struct { double rate; int64_t offset; unsigned int flag; } Packet;
typedef uint16_t Word;
typedef unsigned char Byte;
''')
    (work/'source.cpp').write_text('''
#include "types.hpp"
extern "C" int abi_probe(int i) {
  return int(sizeof(Midi) + alignof(Midi)) + i;
}
extern "C" int abi_other(int i) {
  return int(sizeof(Packet[2][3]) + alignof(Packet)) + i;
}
extern "C" int abi_scalar(int i) {
  return int(sizeof(Word[7]) + alignof(Word) + sizeof(Byte)) + i;
}
''')
    (work/'main.cpp').write_text('''
#include <cstdio>
extern "C" int abi_probe(int); extern "C" int abi_other(int); extern "C" int abi_scalar(int);
int main(){ for(int i=0;i<300;++i) std::printf("%d,%d,%d\\n",abi_probe(i),abi_other(i),abi_scalar(i)); }
''')
    run(['clang++','-std=c++14','source.cpp','main.cpp','-o','native'],work)
    expected=run([str(work/'native')],work).splitlines()
    source=work/'gen'
    for name in ('abi_probe','abi_other','abi_scalar'):
        out=work/name
        run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(work),
             '--source','source.cpp','--filter',name,'--out-dir',str(out)],work)
        path=out/'source.cpp.mjs'
        report=json.loads(path.with_suffix('.manifest.json').read_text())
        item=next(x for x in report['definitions'] if x['source_name']==name)
        assert item['status']=='source-first',(name,item)
        run(['node','--check',str(path)],work)
        source.mkdir(exist_ok=True)
        (source/(name+'.mjs')).write_text(path.read_text())
    (work/'run.mjs').write_text('''
import {abi_probe} from './gen/abi_probe.mjs';
import {abi_other} from './gen/abi_other.mjs';
import {abi_scalar} from './gen/abi_scalar.mjs';
for(let i=0;i<300;i++)console.log(`${abi_probe(i)},${abi_other(i)},${abi_scalar(i)}`);
''')
    actual=run(['node','run.mjs'],work).splitlines()
    assert actual==expected, next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),None)
    sys.path.insert(0,str(ROOT/'tools'))
    from source_ast_to_js import recover_typedef_record_layouts
    # A declaration name without Clang tag ownership must never be assigned
    # an ABI layout from an unrelated same-spelled record.
    assert recover_typedef_record_layouts([{'kind':'TypedefDecl','name':'Foo'}],
                                          {'(unnamed at types.hpp:1:1)':{'size':3,'align':1}})=={}
    print('PASS 900 native C++/JS ABI closure comparisons across 3 filtered functions, '
          'nested array extents, function-pointer fields and anonymous tagged typedefs')
