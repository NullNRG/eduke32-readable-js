from pathlib import Path
import json,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_first_toolchain import frontend_config
from source_ast_to_js import parse_clang_record_layouts
from bitfield_layout import direct_fields
root=ROOT/'work/bitfield-native';root.mkdir(exist_ok=True)
cpp=r'''
#include <cstdio>
#include <cstring>
struct Bits {unsigned a:3;signed b:9;unsigned:4;unsigned c:16;unsigned long long d:37;signed long long e:13;bool f:1;};
struct __attribute__((packed)) PackedBits {unsigned char lead;unsigned x:9;signed y:13;unsigned tail:5;};
int main(){for(int n=0;n<1024;n++){Bits b;PackedBits p;memset(&b,0,sizeof(b));memset(&p,0,sizeof(p));
b.a=n;b.b=n-600;b.c=n*37;b.d=(unsigned long long)n*12345678901ull;b.e=n*13-9000;b.f=n&1;
p.lead=n;p.x=n*3;p.y=n*17-8000;p.tail=n;
unsigned sum=0;for(unsigned i=0;i<sizeof(b);i++)sum+=((unsigned char*)&b)[i];for(unsigned i=0;i<sizeof(p);i++)sum+=((unsigned char*)&p)[i];
printf("%d,%d,%u,%llu,%lld,%d,%u,%d,%d,%u,%u\n",b.a,b.b,b.c,(unsigned long long)b.d,(long long)b.e,b.f,p.lead,p.x,p.y,p.tail,sum);}}
'''
(root/'unit.cpp').write_text(cpp)
front,flags=frontend_config(True)
p=subprocess.run([front,*flags,'-std=c++14','-Xclang','-fdump-record-layouts-complete','-fsyntax-only','unit.cpp'],cwd=root,capture_output=True,text=True);assert p.returncode==0,p.stderr
layouts=parse_clang_record_layouts(p.stdout+p.stderr)
for block in (p.stdout+p.stderr).split('*** Dumping AST Record Layout'):
 for name in ('Bits','PackedBits'):
  if '\\'+name in block:continue
  import re
  if re.search(r'^\s*0\s*\|\s*struct '+name+r'\s*$',block,re.M):layouts[name]['fields']=direct_fields(block)
print({name:layouts[name]for name in ('Bits','PackedBits')})
native=root/'native.exe';p=subprocess.run(['clang++','-std=c++14','-mno-ms-bitfields','unit.cpp','-o',str(native)],cwd=root,capture_output=True,text=True);assert p.returncode==0,p.stderr
expected=subprocess.check_output([str(native)],text=True).splitlines()
js=(ROOT/'work/bitfield_accessors.mjs').read_text()+'\nconst layouts='+json.dumps({name:layouts[name]for name in ('Bits','PackedBits')})+';\n'
js+='''const metadata=(field)=>({...field,signed:!/^unsigned|^_Bool|^bool/.test(field.declaration),wide:/long long/.test(field.declaration),boolean:/^(?:bool|_Bool)/.test(field.declaration)});
for(let n=0;n<1024;n++){const b=new Uint8Array(layouts.Bits.size),p=new Uint8Array(layouts.PackedBits.size),values=[n,n-600,n*37,BigInt(n)*12345678901n,n*13-9000,n&1,n,n*3,n*17-8000,n];let i=0,rows=[];
for(const [name,bytes]of [['Bits',b],['PackedBits',p]])for(const field of layouts[name].fields){const f=metadata(field),last=field.declaration.split(' ').at(-1);if(!/^[a-z]+$/.test(last)||['unsigned','int'].includes(last))continue;
if(field.bit_width){writeBitField(bytes,f,values[i++]);rows.push(readBitField(bytes,f));}else{bytes[field.offset]=values[i++]&255;rows.push(bytes[field.offset]);}}
rows=rows.map(v=>typeof v==='boolean'?Number(v):v);rows.push([...b,...p].reduce((a,b)=>a+b,0));console.log(rows.join(','));}
'''
(root/'run.mjs').write_text(js);actual=subprocess.check_output(['node',str(root/'run.mjs')],text=True).splitlines()
assert actual==expected,next(((i,a,b)for i,(a,b)in enumerate(zip(actual,expected))if a!=b),None)
print('PASS: 11264 native values for signed, unsigned, bool, 64-bit, packed and unnamed-padding bitfields')
