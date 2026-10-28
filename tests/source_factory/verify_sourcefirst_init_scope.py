#!/usr/bin/env python3
"""Native parity for C++17 if/switch initializer lexical scoping."""
from pathlib import Path
import json
import subprocess
import sys
import tempfile
ROOT=Path(__file__).resolve().parents[2]

def run(argv, cwd):
    p=subprocess.run(argv,cwd=cwd,capture_output=True,text=True,timeout=80)
    assert p.returncode==0,(argv,p.stdout[-1000:],p.stderr[-1500:])
    return p.stdout

with tempfile.TemporaryDirectory(prefix='eduke-init-scope-') as temp:
    root=Path(temp)
    (root/'source.cpp').write_text(r'''
extern "C" int scoped(int n) {
  int sum=5;
  if(int v=n+3; v&1) { sum+=v; } else { sum-=v; }
  if(int v=n*2; v>100) { sum-=v; } else { sum+=v; }
  switch(int v=n%11; v&3) {
    case 0: sum+=v; break;
    case 1: sum-=v; break;
    case 2: sum+=v*2; break;
    default: sum-=v*3; break;
  }
  return sum;
}
struct Unsafe { int value; ~Unsafe() { value=0; } };
extern "C" int forbidden(int n) {
  if(Unsafe x{n}; x.value>3) return x.value;
  return n;
}
''')
    (root/'main.cpp').write_text('''
#include <cstdio>
extern "C" int scoped(int);
int main(){for(int i=0;i<512;i++)printf("%d\\n",scoped(i));}
''')
    run(['clang++','-std=c++17','source.cpp','main.cpp','-o','native'],root)
    expected=run([str(root/'native')],root).splitlines()
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),
         '--source','source.cpp','--out-dir',str(root/'out'), '--extra=-std=c++17'],root)
    module=root/'out/source.cpp.mjs'
    report=json.loads(module.with_suffix('.manifest.json').read_text())
    results={x['source_name']:x for x in report['definitions']}
    assert results['scoped']['status']=='source-first',results['scoped']
    assert results['forbidden']['status']=='blocked',results['forbidden']
    run(['node','--check',str(module)],root)
    (root/'runner.mjs').write_text('import {scoped} from '+json.dumps(module.as_uri())+';\n'+
        'for(let i=0;i<512;i++)console.log(scoped(i));\n')
    actual=run(['node','runner.mjs'],root).splitlines()
    assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),None)
    print('PASS 512 native C++/JS comparisons for if-init, switch-init, shadowed lexical locals, '
          'switch cases and destructor safety rejection')
