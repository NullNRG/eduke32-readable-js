#!/usr/bin/env python3
"""Native C++ oracle for the exact four libdivide scalar generator records."""
import json,subprocess,tempfile,pathlib,os
ROOT=pathlib.Path(__file__).resolve().parents[2]
HEADER=ROOT/'factory-output/source-tree/eduke32-master/source/build/include'
CXX=r'''
#include <cstdio>
#include <cstdint>
#include "libdivide.h"
int main(){
  for(int i=1;i<16384;++i){
    auto a=libdivide::libdivide_s32_gen(i);
    auto b=libdivide::libdivide_s32_branchfree_gen(i);
    auto c=libdivide::libdivide_s64_gen(i);
    auto d=libdivide::libdivide_s64_branchfree_gen(i);
    std::printf("%d %d %u %d %u %lld %u %lld %u\\n",i,a.magic,a.more,b.magic,b.more,
      (long long)c.magic,c.more,(long long)d.magic,d.more);
  }
}
'''
# Source code is raw Python string, so the C++ escape must be one backslash.
CXX=CXX.replace('\\\\n','\\n')
with tempfile.TemporaryDirectory() as tmp:
    src=pathlib.Path(tmp)/'oracle.cpp';exe=pathlib.Path(tmp)/'oracle'
    src.write_text(CXX)
    p=subprocess.run(['clang++','-std=c++17','-O2','-I',str(HEADER),str(src),'-o',str(exe)],capture_output=True,text=True)
    assert p.returncode==0,p.stderr
    p=subprocess.run([str(exe)],capture_output=True,text=True,check=True)
    expected=[]
    for line in p.stdout.splitlines():
      bits=[int(x) for x in line.split()]
      assert len(bits)==9,(line,bits)
      expected.append(bits)
    js=r'''
import * as l from './runtime/libdivide_abi.mjs';
const rows=[];
for(let i=1;i<16384;i++) {
 const a=l.libdivide_s32_gen(i),b=l.libdivide_s32_branchfree_gen(i),
       c=l.libdivide_s64_gen(BigInt(i)),d=l.libdivide_s64_branchfree_gen(BigInt(i));
 rows.push([i,a.magic,a.more,b.magic,b.more,c.magic.toString(),c.more,d.magic.toString(),d.more]);
}
console.log(JSON.stringify(rows));
'''
    runner=pathlib.Path(tmp)/'check.mjs';runner.write_text(js.replace("'./runtime/libdivide_abi.mjs'",json.dumps((ROOT/'runtime/libdivide_abi.mjs').as_uri())))
    p=subprocess.run(['node',str(runner)],capture_output=True,text=True,check=True)
    actual=json.loads(p.stdout)
    for row in actual: row[5]=int(row[5]); row[7]=int(row[7])
    assert expected==actual, next(({'i':i+1,'expected':x,'actual':y} for i,(x,y) in enumerate(zip(expected,actual)) if x!=y), 'length')
    print(f'PASS: {len(expected)*4} native C++ / JavaScript libdivide records agree')

# Exact signed edge cases, including INT_MIN/INT64_MIN, must not be passed
# through JavaScript Number for the 64-bit path.
EDGE_CPP=r'''
#include <cstdio>
#include <cstdint>
#include "libdivide.h"
int main() {
  const int32_t x32[]={INT32_MIN,-100000,-17,-9,-3,-2,-1,1,2,3,9,17,INT32_MAX};
  for(auto d:x32){
    auto a=libdivide::libdivide_s32_gen(d);
    auto b=libdivide::libdivide_s32_branchfree_gen(d);
    std::printf("32 %d %d %u %d %u\n",d,a.magic,a.more,b.magic,b.more);
  }
  const int64_t x64[]={INT64_MIN,-9223372036854775807LL,-100000LL,-17LL,-9LL,-3LL,-2LL,-1LL,1LL,2LL,3LL,9LL,17LL,9223372036854775807LL};
  for(auto d:x64){
    auto a=libdivide::libdivide_s64_gen(d);
    auto b=libdivide::libdivide_s64_branchfree_gen(d);
    std::printf("64 %lld %lld %u %lld %u\n",(long long)d,(long long)a.magic,a.more,(long long)b.magic,b.more);
  }
}
'''
with tempfile.TemporaryDirectory() as tmp:
    src=pathlib.Path(tmp)/'edge.cpp';exe=pathlib.Path(tmp)/'edge'
    src.write_text(EDGE_CPP)
    proc=subprocess.run(['clang++','-std=c++17','-O2','-I',str(HEADER),str(src),'-o',str(exe)],capture_output=True,text=True)
    assert proc.returncode==0,proc.stderr
    p=subprocess.run([str(exe)],capture_output=True,text=True,check=True)
    oracle=[tuple(int(n) for n in row.split()) for row in p.stdout.splitlines()]
    assert len(oracle)==27,len(oracle)
    js=r'''
import * as l from 'LIB';
let out=[];
for(const d of [-2147483648,-100000,-17,-9,-3,-2,-1,1,2,3,9,17,2147483647]) {
 const a=l.libdivide_s32_gen(d),b=l.libdivide_s32_branchfree_gen(d);
 out.push([32,d,a.magic,a.more,b.magic,b.more].map(String));
}
for(const s of ['-9223372036854775808','-9223372036854775807','-100000','-17','-9','-3','-2','-1','1','2','3','9','17','9223372036854775807']) {
 const d=BigInt(s),a=l.libdivide_s64_gen(d),b=l.libdivide_s64_branchfree_gen(d);
 out.push([64,d,a.magic,a.more,b.magic,b.more].map(String));
}
console.log(JSON.stringify(out));
'''
    script=pathlib.Path(tmp)/'edge.mjs';script.write_text(js.replace("'LIB'",json.dumps((ROOT/'runtime/libdivide_abi.mjs').as_uri())))
    p=subprocess.run(['node',str(script)],capture_output=True,text=True,check=True)
    generated=[tuple(int(n) for n in row) for row in json.loads(p.stdout)]
    assert oracle==generated,next(({'expected':a,'got':b} for a,b in zip(oracle,generated) if a!=b),'length')
    print('PASS: 27 signed edge divisors × 2 libdivide generator modes = 54 records')
