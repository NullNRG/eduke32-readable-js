#!/usr/bin/env python3
"""Native parity for typedef-driven global arrays and recursive C++ aggregate zeroing.

Clang is the type/layout oracle. Borrowed pointer copies must preserve the
original lvalue and independent pointer slots, rather than infer ownership.
"""
from pathlib import Path
import subprocess,tempfile,json,sys
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd,seconds=75):
    p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=seconds)
    assert p.returncode==0,(args,p.stdout[-1200:],p.stderr[-2500:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke-bulk-types-') as temp:
    d=Path(temp)
    (d/'source.cpp').write_text('''
#include <stdint.h>
typedef unsigned char ByteAlias;
typedef ByteAlias ByteAlias2;
typedef signed short SignedAlias;
typedef uint32_t WordAlias;
static ByteAlias2 lut[5] = {255,3,7,11,13};
static SignedAlias diff[4] = {-32768,-41,256,32767};
static WordAlias words[4] = {0xffffffffu,0x80000001u,3000000000u,17};
static ByteAlias2 namebytes[7] = "Hi";
struct Item {int16_t x; uint32_t y;};
struct Grid { Item a; uint16_t b[3]; };
struct Unsafe { int *p; };
static Unsafe pointer_bearing_records[2];
extern "C" int zero_ptr(int i) { return pointer_bearing_records[i&1].p == nullptr; }
extern "C" Unsafe borrowed_pointer_copy(Unsafe x) { return x; }
extern "C" int borrowed_copy(int i) {
 int value=i;Unsafe a{&value};Unsafe b=borrowed_pointer_copy(a);
 *b.p+=7;b.p=nullptr;return value+1000*(a.p!=nullptr)+10000*(b.p==nullptr);
}
extern "C" unsigned int globals(int i) {
  unsigned j=(unsigned)i % 4;
  return (unsigned)(lut[j] + (int)diff[j] + words[j] + namebytes[j]);
}
extern "C" int zeroed(int i) {
  Grid value{};
  value.a.x = (int16_t)i;
  value.b[1] = (uint16_t)(i*3);
  return value.a.x + (int)value.a.y + value.b[0] + value.b[1] + value.b[2];
}
''')
    # Capture originals with Clang, as they would be compiled into any normal C++ program.
    (d/'main.cpp').write_text('''#include <cstdio>
extern "C" unsigned int globals(int);extern "C" int zeroed(int);extern "C" int zero_ptr(int);
extern "C" int borrowed_copy(int);
int main(){for(int i=-175;i<175;i++)printf("%u,%d,%d,%d\\n",globals(i),zeroed(i),zero_ptr(i),borrowed_copy(i));}
''')
    run(['clang++','-std=c++14','source.cpp','main.cpp','-o','native'],d)
    expected=run([str(d/'native')],d).splitlines()
    cmd=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'), '--root',str(d),
         '--source','source.cpp','--out-dir',str(d/'generated')]
    run(cmd,d)
    path=d/'generated/source.cpp.mjs'
    manifest=json.loads(path.with_suffix('.manifest.json').read_text())
    rows={v['source_name']:v for v in manifest['definitions']}
    for name in ('globals','zeroed','lut','diff','words','namebytes'):
        assert rows[name]['status']=='source-first',(name,rows[name])
    assert rows['pointer_bearing_records']['status']=='source-first',rows['pointer_bearing_records']
    assert rows['borrowed_pointer_copy']['status']=='source-first',rows['borrowed_pointer_copy']
    assert rows['borrowed_copy']['status']=='source-first',rows['borrowed_copy']
    assert rows['zero_ptr']['status']=='source-first',rows['zero_ptr']
    run(['node','--check',str(path)],d)
    (d/'runner.mjs').write_text('import {globals,zeroed,zero_ptr,borrowed_copy} from '+json.dumps(path.as_uri())+';\n'
        +'for(let i=-175;i<175;i++)console.log(`${globals(i)},${zeroed(i)},${zero_ptr(i)},${borrowed_copy(i)}`);\n')
    observed=run(['node','runner.mjs'],d).splitlines()
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected)) if a!=b),None)
    print('PASS 1400 native parity comparisons for typedef arrays, aggregate zeroing, null storage and borrowed pointer copy/mutation')
