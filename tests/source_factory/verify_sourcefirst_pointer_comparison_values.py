"""Native dynamic end-pointer guards preserve checked loads/stores and canaries."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120)
 assert p.returncode==0,(args,p.stdout[-1600:],p.stderr[-3000:])
 return p.stdout
with tempfile.TemporaryDirectory(prefix='source-pointer-address-') as folder:
 root=Path(folder)
 (root/'unit.cpp').write_text('''extern "C" int step(unsigned char *out,int capacity,int run){
 unsigned char *p=out;unsigned char *end=out+capacity;
 (p)=out+run;
 if(p>end)return -1;if(p<out)return -2;if(p==out)return 0;
 p[-1]=(unsigned char)run;return (int)(p-out);
}
extern "C" int initial(unsigned char *out,int capacity,int run){
 unsigned char *p=out+run;unsigned char *end=out+capacity;
 if(p>end)return -1;if(p<out)return -2;if(p==out)return 0;
 p[-1]^=3;return (int)(p-out);
}
extern "C" int invalid(unsigned char *out,int capacity,int run){
 unsigned char *p=out+run,*end=out+capacity;
 if(p>end)return *p;return 0;
}
extern "C" int escaped(unsigned char *out,int capacity,int run){
 unsigned char *p=out,**alias=&p,*end=out+capacity;
 p=out+run;if(p>end)return -1;return alias!=0;
}
''')
 (root/'main.cpp').write_text('''#include <cstdio>
#include <cstdint>
extern "C" int step(unsigned char*,int,int),initial(unsigned char*,int,int);
int main(){for(int n=0;n<512;n++){unsigned char data[128];for(int i=0;i<128;i++)data[i]=0xcc;
 int capacity=n%49,run=n%81-16;
 int a=step(data+32,capacity,run),b=initial(data+32,capacity,run);uint32_t h=2166136261u;
 for(unsigned char value:data)h=(h^value)*16777619u;
 printf("%d %d %u\\n",a,b,h);}}
''')
 run(['clang++',root/'unit.cpp',root/'main.cpp','-o',root/'native'])
 expected=run([root/'native']).splitlines()
 out=root/'out';run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out])
 manifest=json.loads((out/'unit.cpp.manifest.json').read_text());assert manifest['blocked']==0,manifest
 runner=root/'run.mjs';runner.write_text('import * as m from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';'
  +'for(const name of ["invalid","escaped"]){let rejected=false;try{m[name](new Uint8Array(1),1,10)}catch(e){if(!(e instanceof RangeError))throw e;rejected=true;}if(!rejected)throw Error("Invalid memory/address cell accepted: "+name);}'
  +'for(let n=0;n<512;n++){const data=new Uint8Array(128).fill(0xcc),capacity=n%49,run=n%81-16,view=data.subarray(32,32+capacity);'
  +'const a=m.step(view,capacity,run),b=m.initial(view,capacity,run);let hash=2166136261;for(const value of data)hash=Math.imul(hash^value,16777619)>>>0;console.log([a,b,hash].join(" "));}')
 assert run(['node',runner]).splitlines()==expected
print('PASS: 1024 native/JS dynamic pointer guards and complete canary hashes; ordered local addresses retain source bounds, invalid dereferences and escaped pointer cells stay rejected')
