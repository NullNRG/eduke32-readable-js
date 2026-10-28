#!/usr/bin/env python3
"""Native parity for declaration metadata, zero storage and trivial array construction."""
from pathlib import Path
import json,os,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
FRONT=Path(os.environ.get('EDUKE32_ARRAY_TEST_FRONTEND',ROOT/'tools/source_ast_to_js.py'))
def run(command,cwd):
    p=subprocess.run(command,cwd=cwd,capture_output=True,text=True,timeout=100)
    assert p.returncode==0,(command,p.stdout[-1800:],p.stderr[-3500:])
    return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke-static-arrays-') as tmp:
    directory=Path(tmp)
    (directory/'unit.cpp').write_text(r'''
#include <stdint.h>
typedef unsigned short Word;
static Word table[8] __attribute__((used));
/** Static integer grid has no runtime initializer. */
static int grid[2][3] __attribute__((unused));
static char root[19] __attribute__((used));
static bool gates[4] __attribute__((used));
enum class Tiny : unsigned char { Zero=0, High=255 };
enum class Signed : signed short { Zero=0, Low=-32000 };
enum class Wide : unsigned long long { Zero=0, High=0xfedcba9876543210ull };
static Tiny tiny[2][3] __attribute__((used));
static Signed signed_values[3] __attribute__((used));
static Wide wide[2] __attribute__((used));
struct Point { int x; unsigned short y; };
struct Pod {Point point; int samples[3]; int *address;};
static Pod pods[2][3] __attribute__((used));
struct Defaulted {int value; Defaulted()=default;};
static Defaulted defaults[4] __attribute__((used));
struct Nontrivial {int value; Nontrivial():value(41){}};
static Nontrivial reject_constructor[3];
struct MemberInit {int value=23;};
static MemberInit reject_member_init[2];
enum Unknown { UnknownZero, UnknownOne };
static Unknown reject_unknown_enum[3];
static int reject_alignment[4] __attribute__((aligned(32)));
extern "C" int initially_zero(){
 int total=0;
 for(int i=0;i<8;i++)total+=table[i];
 for(int i=0;i<2;i++)for(int j=0;j<3;j++)
   total+=grid[i][j]+(unsigned)tiny[i][j]+pods[i][j].point.x+pods[i][j].point.y
          +pods[i][j].samples[0]+(pods[i][j].address!=nullptr);
 for(int i=0;i<4;i++)total+=defaults[i].value+gates[i];
 for(int i=0;i<19;i++)total+=root[i];
 return total;
}
extern "C" int mutate(int i){
 table[i%8]=(Word)(i*1009);
 grid[i%2][i%3]=i-400;
 root[i%18]=(char)('A'+i%26);
 gates[i%4]=(i&1)!=0;
 tiny[i%2][i%3]=(Tiny)(i&255);
 signed_values[i%3]=(Signed)(i-32100);
 pods[i%2][i%3].point.x=i*3;
 pods[i%2][i%3].samples[1]=i*7;
 defaults[i%4].value=i+17;
 return table[(i+3)%8]+grid[(i+1)%2][(i+2)%3]+root[(i+7)%18]
       +(unsigned)tiny[(i+1)%2][(i+1)%3]+(int)signed_values[(i+2)%3]
       +pods[(i+1)%2][(i+1)%3].point.x+pods[i%2][i%3].samples[1]
       +defaults[(i+2)%4].value+gates[(i+1)%4];
}
extern "C" unsigned long long wide_value(int i){
 wide[i%2]=(i&1)?Wide::High:Wide::Zero;return (unsigned long long)wide[i%2];
}
extern "C" int local_static(int i){
 static int counters[3];
 static Defaulted records[2];
 counters[i%3]+=i;
 records[i%2].value+=i+1;
 return counters[(i+1)%3]+records[(i+1)%2].value;
}
extern "C" int dynamic_static(int i){static int captures[2]={i,3};return captures[0];}
extern "C" int enum_pointer(int i){
 Tiny *p=&tiny[i%2][0];
 p[1]=(Tiny)(i&255);
 bool *flags=gates;
 flags[i%4]=!flags[(i+1)%4];
 return (unsigned)p[1]+100*(p==&tiny[i%2][0])+(int)(p+2-p)+flags[i%4];
}
extern "C" unsigned long long wide_pointer(){
 Wide *p=wide;*p=Wide::Zero;++p;*p=Wide::High;
 return (unsigned long long)*p+(p==&wide[1]);
}
extern "C" int enum_sizes(){return sizeof(tiny)+sizeof(signed_values)+sizeof(wide);}
''')
    (directory/'main.cpp').write_text(r'''#include <cstdio>
extern "C" int initially_zero(),mutate(int),enum_sizes(),local_static(int),enum_pointer(int),dynamic_static(int);
extern "C" unsigned long long wide_value(int),wide_pointer();
int main(){printf("%d,%d\n",initially_zero(),enum_sizes());
 for(int i=0;i<512;i++){int a=mutate(i);unsigned long long b=wide_value(i);int c=local_static(i),d=enum_pointer(i);unsigned long long e=wide_pointer();printf("%d,%llu,%d,%d,%llu\n",a,b,c,d,e);} printf("%d,%d\n",dynamic_static(17),dynamic_static(-900));}
''')
    native=directory/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14','-funsigned-char','unit.cpp','main.cpp','-o',str(native)],directory)
    expected=run([str(native)],directory).splitlines()
    run([sys.executable,str(FRONT),'--root',str(directory),'--source','unit.cpp',
         '--out-dir',str(directory/'generated')],directory)
    module=directory/'generated/unit.cpp.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={row['source_name']:row for row in manifest['definitions']}
    for name in ('table','grid','root','gates','tiny','signed_values','wide','pods','defaults',
                 'initially_zero','mutate','wide_value','enum_sizes','local_static','enum_pointer','wide_pointer','dynamic_static'):
        assert rows[name]['status']=='source-first',(name,rows[name])
    for name in ('reject_constructor','reject_member_init','reject_unknown_enum','reject_alignment'):
        assert rows[name]['status']=='blocked',(name,rows[name])
    run(['node','--check',str(module)],directory)
    (directory/'runner.mjs').write_text('import * as s from '+json.dumps(module.as_uri())+';\n'
        +'console.log(`${s.initially_zero()},${s.enum_sizes()}`);\n'
        +'for(let i=0;i<512;i++)console.log(`${s.mutate(i)},${s.wide_value(i)},${s.local_static(i)},${s.enum_pointer(i)},${s.wide_pointer()}`);\n'
        +'console.log(`${s.dynamic_static(17)},${s.dynamic_static(-900)}`);\n')
    observed=run(['node','runner.mjs'],directory).splitlines()
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected)) if a!=b),None)
    print('PASS 2564 native C++/JS values: metadata-only scalar/nested/bool/fixed-enum/POD arrays, exact enum widths, independent trivial default construction; nontrivial constructors/default members, unknown enum ABI and unproven alignment stay blocked')
