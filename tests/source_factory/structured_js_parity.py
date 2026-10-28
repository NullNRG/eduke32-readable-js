#!/usr/bin/env python3
"""Differential LLVM-lowered vs structured JavaScript execution tests."""
import json,pathlib,subprocess,sys
BASE=pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0,str(BASE/'tools'))
from llvm_linked_backend import Emitter,definitions
from readable_js import to_readable

IR='''
define i32 @source_sum_or_difference(i32 %first, i32 %second) {
entry:
  %condition = icmp sgt i32 %first, %second
  br i1 %condition, label %greater, label %otherwise
greater:
  %difference = sub i32 %first, %second
  ret i32 %difference
otherwise:
  %sum = add i32 %first, %second
  ret i32 %sum
}
define i64 @source_wide(i64 %first, i64 %second) {
entry:
  %sum = add i64 %first, %second
  ret i64 %sum
}
define i32 @source_store(i32 %first, ptr %destination) {
entry:
  %condition = icmp ne i32 %first, 0
  br i1 %condition, label %truebranch, label %falsebranch
truebranch:
  store i32 %first, ptr %destination
  br label %done
falsebranch:
  store i32 99, ptr %destination
  br label %done
done:
  ret i32 7
}
define i32 @source_phi(i32 %first) {
entry:
  %condition = icmp sgt i32 %first, 0
  br i1 %condition, label %positive, label %negative
positive:
  br label %done
negative:
  br label %done
done:
  %result = phi i32 [ %first, %positive ], [ 17, %negative ]
  ret i32 %result
}
define i32 @source_loop(i32 %first) {
entry:
  br label %loop
loop:
  %index = phi i32 [ 0, %entry ], [ %next, %loop ]
  %next = add i32 %index, 1
  %condition = icmp slt i32 %next, %first
  br i1 %condition, label %loop, label %done
done:
  ret i32 %next
}
'''
fixtures=[]
for f in definitions(IR):
    code=Emitter().lower(*f)
    new=to_readable(code,f[0]);fixtures.append({'symbol':f[0],'original':code,'structured':new.code,'changed':new.structured})
assert [x['changed'] for x in fixtures]==[True,True,True,True,False]
node=r'''
const assert=require('node:assert/strict');
const fixtures=JSON.parse(process.argv[1]);
function exercise(source,args,budget){
  const events=[];
  const ctx={instructionBudget:budget,blockProgress:(...v)=>events.push(['progress',...v]),
    requireDefined:(v)=>v,
    store:(ptr,typ,val)=>events.push(['store',ptr,typ,val]),
    load:()=>0,offset:v=>Number(v),ptr:()=>1000};
  const f=Function('ctx','return ('+source+')')(ctx);
  try {return {value:String(f(...args)),events};}
  catch(e){return {error:String(e.message),events};}
}
const cases=[
  [[-100,2],[0,0],[99,-111],[2147483647,-1],[-2147483648,3]],
  [[1n,2n],[-1n,4n],[9223372036854775807n,1n]],
  [[0,100],[1,100],[-100,200]],
  [[-100],[0],[1],[5]],
  [[0],[1],[4]]
];
for(let i=0;i<fixtures.length;i++){
  for(const args of cases[i]){
    for(const budget of [1,2,3,6,30]){
      assert.deepEqual(exercise(fixtures[i].structured,args,budget),exercise(fixtures[i].original,args,budget),
        `${fixtures[i].symbol}: ${args} budget=${budget}`);
    }
  }
}
console.log('Structured LLVM parity: 80+ branch/budget/ABI cases passed');
'''
# BigInt is transported as strings and restored by Node to avoid JSON errors.
# Fixed node fixture codec keeps other integer arguments as numbers.
encoded=[{**x,'symbol':x['symbol']} for x in fixtures]
# Embed the fixture objects in JS literal JSON but leave bigint test cases in JS.
r=subprocess.run(['node','-e',node,json.dumps(encoded)],capture_output=True,text=True,timeout=15)
if r.returncode:
    raise SystemExit(r.stdout+'\n'+r.stderr)
print(r.stdout.strip())
