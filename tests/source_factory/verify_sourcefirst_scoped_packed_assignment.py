"""Filtered namespace-owned packed POD assignment versus original native C++."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd=ROOT):
 p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=120);assert p.returncode==0,(p.stdout[-1500:],p.stderr[-2500:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='scoped-packed-assignment-',dir=ROOT/'work') as directory:
 p=Path(directory)
 (p/'records.hpp').write_text('''#pragma once
namespace library {struct __attribute__((packed)) Divider {unsigned magic;unsigned char more;};
static inline Divider generate(unsigned x){return {x*1664525u+1013904223u,(unsigned char)(x%31)};}}
struct Holder {library::Divider divide;};
''')
 (p/'unit.cpp').write_text('''#include "records.hpp"
static Holder state;
extern "C" void initialize(unsigned n){state.divide=library::generate(n);}
extern "C" unsigned read_magic(){return state.divide.magic;}
extern "C" unsigned read_more(){return state.divide.more;}
''')
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',p,'--source','unit.cpp','--filter','initialize,read_magic,read_more',
      '--exact-filter','--dependency-closure','--header-dependency-closure','--header-inlines','--out-dir',p/'out'])
 manifest=json.loads((p/'out/unit.cpp.manifest.json').read_text());assert manifest['blocked']==0,manifest
 (p/'main.cpp').write_text('''#include <cstdio>
extern "C" void initialize(unsigned);extern "C" unsigned read_magic();extern "C" unsigned read_more();
int main(){for(unsigned i=0;i<1024;i++){initialize(i*314159u);printf("%u,%u\\n",read_magic(),read_more());}}
''')
 exe=p/'native.exe';run(['clang++','-std=c++14',p/'unit.cpp',p/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
 (p/'check.mjs').write_text('import * as m from '+json.dumps((p/'out/unit.cpp.mjs').as_uri())+';\nfor(let i=0;i<1024;i++){m.initialize(i*314159);console.log(`${m.read_magic()},${m.read_more()}`);}\n')
 assert run(['node',p/'check.mjs']).splitlines()==expected
print('PASS 2048 native values: filtered source, original header identity, scoped packed POD move assignment and retained field storage')
