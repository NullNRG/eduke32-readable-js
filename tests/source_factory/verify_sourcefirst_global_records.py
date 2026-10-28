#!/usr/bin/env python3
"""Native C++ parity for global POD record zeroing, initializer fillers, nested arrays.

All values come from Clang-parsed original fixture declarations. Unsafe
pointer-bearing records/overlapping unions must remain BLOCKED, not guessed.
"""
from pathlib import Path
import json, subprocess, tempfile, sys
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd,timeout=70):
    p=subprocess.run(args,cwd=cwd,encoding='utf-8',stdout=subprocess.PIPE,
                     stderr=subprocess.PIPE,timeout=timeout)
    assert p.returncode==0,(args,p.stdout[-1800:],p.stderr[-2400:])
    return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke-global-records-') as tmp:
    base=Path(tmp)
    (base/'source.cpp').write_text(r'''
#include <stdint.h>
struct Pixel { uint16_t x; uint16_t y; };
struct Tile { Pixel p; int32_t width; };
struct Unproven { int *pointer; };
struct AssignOnly { int value; AssignOnly &operator=(AssignOnly const& other) { value=other.value; return *this; }};
static AssignOnly assignmentObjects[3];
static Pixel origin;
static Pixel center{13,21};
static const Pixel frozen{22,44};
static Tile grid[3]={ {{3,5},7}, {{9,11},13} };
static Tile zeros[4];
static Tile blocks[2][3]={ { {{1,2},3} } };
static uint8_t enable[4]={1,0,1};
enum Scene { title=2, play=7 };
static Scene stage;
static Unproven pointerZero[4];
static int globalnum=8;
static Unproven forbidden[1] = { {&globalnum} };
extern "C" int measure(int i) {
  return origin.x + center.x + frozen.y + grid[i%3].p.y + grid[2].width
       + zeros[i%4].p.x + blocks[i%2][0].p.y + blocks[0][0].width
       + (int)stage + enable[i%4] + (pointerZero[i%4].pointer==nullptr)
       + (forbidden[0].pointer==&globalnum);
}
extern "C" int independent(int i) {
  assignmentObjects[i%3].value=i+5;
  grid[2].p.x=(uint16_t)(i+3);
  zeros[0].p.y=(uint16_t)(i+7);
  return grid[0].p.x + grid[1].p.x + grid[2].p.x
       + zeros[0].p.y + zeros[1].p.y + center.y + frozen.x + assignmentObjects[i%3].value;
}
''')
    (base/'main.cpp').write_text(r'''
#include <cstdio>
extern "C" int measure(int); extern "C" int independent(int);
int main(){
  for(int i=0;i<256;i++)printf("%d,%d\n",measure(i),independent(i));
}
''')
    run(['clang++','-std=c++14','source.cpp','main.cpp','-o','native'],base)
    expected=run([str(base/'native')],base).splitlines()
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'), '--root',str(base),
         '--source','source.cpp','--out-dir',str(base/'gen')],base)
    generated=base/'gen/source.cpp.mjs'
    manifest=json.loads(generated.with_suffix('.manifest.json').read_text())
    status={item['source_name']:item for item in manifest['definitions']}
    required=['origin','center','frozen','grid','zeros','blocks','stage','pointerZero','assignmentObjects','measure','independent']
    for symbol in required:
        assert status[symbol]['status']=='source-first',status[symbol]
    assert status['forbidden']['status']=='source-first',status['forbidden']
    run(['node','--check',str(generated)],base)
    (base/'runner.mjs').write_text('import {measure,independent} from '+json.dumps(generated.as_uri())+';\n'
        +'for(let i=0;i<256;i++)console.log(`${measure(i)},${independent(i)}`);\n')
    actual=run(['node','runner.mjs'],base).splitlines()
    assert len(actual)==len(expected)
    assert actual==expected,next(((i,e,a) for i,(e,a) in enumerate(zip(expected,actual)) if e!=a),None)
    print('PASS 512 native C++ versus JS comparisons: global POD records, const globals, '
          'record arrays, implicit static initialization, aggregate filler offsets')
