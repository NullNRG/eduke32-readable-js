#!/usr/bin/env python3
"""Native parity for automatic POD null function-pointer slots and callbacks."""
from pathlib import Path
import json,subprocess,tempfile,sys
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,text=True,capture_output=True,timeout=80)
 assert p.returncode==0,(args,p.stdout[-1100:],p.stderr[-1300:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke-callback-zero-') as temp:
 d=Path(temp)
 (d/'unit.cpp').write_text('''typedef struct { void (*emit)(int); int (*calc)(int); void *unused; int flags; } Callbacks;
enum Controls { FIRST=4, SECOND };
int total=0;
void emit(int n){total+=n;}
int calc(int n){return n*3;}
int invoke(int n){n+=SECOND;Callbacks cb={};cb.emit=emit;cb.calc=calc;cb.flags=n;cb.emit(n);return cb.calc(n)+total+cb.flags+(cb.unused==nullptr)+(cb.emit!=nullptr);}
''')
 (d/'main.cpp').write_text('''#include <cstdio>
int invoke(int);
int main(){for(int i=0;i<256;i++)std::printf("%d\\n",invoke(i%31));}
''')
 run(['clang++','-std=c++17','unit.cpp','main.cpp','-o','native'],d)
 expected=run([str(d/'native')],d).splitlines()
 out=d/'out'
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(d),'--source','unit.cpp',
      '--filter','invoke,total,emit,calc','--enum-closure','--out-dir',str(out)],d)
 mod=out/'unit.cpp.mjs';mf=json.loads(mod.with_suffix('.manifest.json').read_text());
 assert 'Callbacks' in mf['pod_record_closure']['proven'],mf['pod_record_closure']
 assert mf['enum_closure']['proven_values'].get('SECOND')==5,mf['enum_closure']
 assert all(x['status']=='source-first' for x in mf['definitions'] if x['name'] not in ('<anonymous>',)),[(x['name'],x.get('reason')) for x in mf['definitions'] if x['status']!='source-first']
 run(['node','--check',str(mod)],d)
 (d/'test.mjs').write_text('''import {invoke} from './out/unit.cpp.mjs';for(let i=0;i<256;i++)console.log(invoke(i%31));''')
 actual=run(['node','test.mjs'],d).splitlines()
 assert actual==expected,next(((i,e,a) for i,(e,a) in enumerate(zip(expected,actual)) if e!=a),None)
 print('PASS 256 native C++/JS callback-POD lifetime, zero-init, function alias comparisons')
