"""Native two-TU alias and independent-copy parity for template union storage."""
from pathlib import Path
import json,os,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
def run(command,cwd):
 result=subprocess.run(command,cwd=cwd,capture_output=True,text=True,timeout=150)
 assert result.returncode==0,(command,result.stdout[-1200:],result.stderr[-2600:])
 return result.stdout
with tempfile.TemporaryDirectory(prefix='eduke-crossunit-byte-') as scratch:
 tmp=Path(scratch)
 (tmp/'types.h').write_text(r'''
#pragma once
template<class T>struct Pair {T x,y;};
template<class T>struct Position {union {struct {T x,y,z;};Pair<T>xy;};};
typedef struct {Position<int> p;int values[3];} Unit;
typedef Unit Alias;
#ifdef PROVIDER
#define OWN
#else
#define OWN extern
#endif
OWN Unit storage[4];
OWN Position<float> floating[2];
OWN Position<double> precise[2];
''')
 (tmp/'provider.cpp').write_text(r'''
#define PROVIDER
#include "types.h"
extern "C" int provider_read(int i){return storage[i%4].p.x+storage[i%4].p.xy.y+storage[i%4].values[1];}
''')
 (tmp/'consumer.cpp').write_text(r'''
#include "types.h"
extern "C" int mutate_copy(int i){
 int a=i%4;
 storage[a].p.x=i*19;
 storage[a].p.xy.y=i*13-200;
 storage[a].values[1]=i*7;
 floating[i%2].xy.x=(float)(i*3);
 floating[i%2].y=(float)(i*5);
 precise[i%2].xy.x=(double)(i*11);
 precise[i%2].y=(double)(i*17);
 Unit copy=storage[a];
 copy.p.xy.x+=31;
 copy.values[1]+=47;
 return copy.p.x+storage[a].p.x+copy.values[1]+storage[a].values[1]
  +(int)floating[i%2].x+(int)floating[i%2].xy.y
  +(int)precise[i%2].x+(int)precise[i%2].xy.y;
}
''')
 (tmp/'main.cpp').write_text(r'''#include <cstdio>
extern "C" int mutate_copy(int),provider_read(int);
int main(){for(int i=0;i<512;i++){int a=mutate_copy(i),b=provider_read(i);printf("%d,%d\n",a,b);}}
''')
 native=tmp/('native.exe' if os.name=='nt' else 'native')
 run(['clang++','-std=c++14','-funsigned-char','provider.cpp','consumer.cpp','main.cpp','-o',str(native)],tmp)
 expected=run([str(native)],tmp).splitlines()
 plan=tmp/'plan.json'
 plan.write_text(json.dumps({'root':str(tmp),'units':[{'source':name} for name in ('provider.cpp','consumer.cpp')]}))
 out=tmp/'generated'
 build=json.loads(run([sys.executable,str(ROOT/'tools/source_first_project.py'),
  '--plan',str(plan),'--out-dir',str(out),'--strict'],tmp))
 assert build['source_definitions_blocked']==0 and not build['invalid_imports'],build
 (tmp/'run.mjs').write_text('import * as p from '+json.dumps((out/'provider.cpp.mjs').as_uri())+';\n'
  +'import * as c from '+json.dumps((out/'consumer.cpp.mjs').as_uri())+';\n'
  +'for(let i=0;i<512;i++)console.log(`${c.mutate_copy(i)},${p.provider_read(i)}`);\n')
 observed=run(['node','run.mjs'],tmp).splitlines()
 assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected)) if a!=b),None)
 print('PASS 1024 native two-TU values: exact int/float/double template union layouts, provider-owned aliases, consumer aggregate copy independence and complete import audit')
