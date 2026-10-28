#!/usr/bin/env python3
"""C++ native parity for Clang-proven enums nested in by-value POD records."""
from pathlib import Path
import json, subprocess, tempfile, sys
ROOT=Path(__file__).resolve().parents[2]

def run(command, cwd, timeout=100):
    result=subprocess.run(command,cwd=cwd,text=True,capture_output=True,timeout=timeout)
    assert result.returncode==0,(command,result.stdout[-1000:],result.stderr[-2000:])
    return result.stdout

with tempfile.TemporaryDirectory(prefix='eduke-enum-pod-') as temp:
    root=Path(temp)
    (root/'case.cpp').write_text(r'''
#include <stdint.h>
typedef enum Animation { None=-4, Return=11, Advance=23 } Animation;
typedef struct Link { int32_t id; Animation animation; } Link;
struct Menu { Link link; uint16_t width; int32_t flags; };
static Link zero;
static Link defaults[3]={{42,Advance},{19,None}};
static Menu current={{70,Return},39,5};
static Menu many[2]={ {{9,None},8,1} };
extern "C" int check(int i) {
    defaults[2].id=i;
    many[1].link.id=i+7;
    return zero.id+zero.animation+defaults[0].id+defaults[0].animation
       +defaults[1].animation+defaults[2].id+defaults[2].animation
       +current.link.id+current.link.animation+current.width+current.flags
       +many[0].link.id+many[0].link.animation+many[0].width+many[0].flags
       +many[1].link.id+many[1].link.animation;
}
''')
    (root/'main.cpp').write_text(r'''
#include <cstdio>
extern "C" int check(int);
int main(){ for(int i=0;i<256;i++)std::printf("%d\n",check(i)); }
''')
    run(['clang++','-std=c++14','case.cpp','main.cpp','-o','native'],root)
    native=run([str(root/'native')],root).splitlines()
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),
         '--source','case.cpp','--out-dir',str(root/'out')],root)
    generated=root/'out/case.cpp.mjs'
    manifest=json.loads(generated.with_suffix('.manifest.json').read_text())
    statuses={row['name']:row for row in manifest['definitions']}
    for name in ('zero','defaults','current','many','check'):
        assert statuses[name]['status']=='source-first',statuses[name]
    run(['node','--check',str(generated)],root)
    (root/'check.mjs').write_text('import {check} from '+json.dumps(generated.as_uri())+';\n'
        +'for(let i=0;i<256;i++) console.log(check(i));\n')
    transpiled=run(['node','check.mjs'],root).splitlines()
    assert transpiled==native,next(({'i':i,'native':a,'js':b}
        for i,(a,b) in enumerate(zip(native,transpiled)) if a!=b),None)
    print('PASS 256 Clang-enum POD / nested-record native-JavaScript comparisons')
