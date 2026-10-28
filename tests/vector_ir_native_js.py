#!/usr/bin/env python3
"""End-to-end LLVM vector lowering regression for native JS (not Duke gameplay)."""
import json, pathlib, subprocess, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from llvm_linked_backend import definitions, Emitter
ir=r'''define i64 @xxh_lane(i64 %value) {
entry:
  %v0 = insertelement <2 x i64> poison, i64 %value, i32 0
  %v1 = insertelement <2 x i64> %v0, i64 7, i32 1
  %mask = and <2 x i64> %v1, <i64 4294967295, i64 4294967295>
  %sh = lshr <2 x i64> %mask, <i64 8, i64 1>
  %mul = mul nuw <2 x i64> %sh, <i64 3, i64 3>
  %bits = bitcast <2 x i64> %mul to <4 x i32>
  %pick = extractelement <4 x i32> %bits, i32 0
  %up = zext i32 %pick to i64
  ret i64 %up
}
define i64 @shuffle_first(i64 %value) {
entry:
  %v0 = insertelement <2 x i64> poison, i64 %value, i32 0
  %v1 = insertelement <2 x i64> %v0, i64 42, i32 1
  %dup = shufflevector <2 x i64> %v1, <2 x i64> poison, <2 x i32> zeroinitializer
  %pick = extractelement <2 x i64> %dup, i32 1
  ret i64 %pick
}'''
functions=[]
for name,args,body in definitions(ir):
    emitter=Emitter()
    functions.append('ctx.register('+json.dumps(name)+','+emitter.lower(name,args,body)+');')
base=(ROOT/'runtime'/'llvm_context.mjs').as_uri()
js='import {LLVMContext} from '+json.dumps(base)+';\nconst ctx = new LLVMContext();\n'+'\n'.join(functions)+'''
if(ctx.call('xxh_lane',[0x12345678n])!==0x369d02n)throw Error('XXHash vector constant bitcast/shift/multiply mismatch');
if(ctx.call('shuffle_first',[99n])!==99n)throw Error('LLVM zero shuffle mask mismatch');
const input=[0x1122334455667788n,0x123456789ABCDEFn];
const lanes=ctx.reinterpretVectorBits('<2 x i64>', input, '<4 x i32>');
if(lanes.length!==4||lanes[0]!==0x55667788||lanes[1]!==0x11223344||lanes[2]!==-0x76543211||lanes[3]!==0x01234567)throw Error('Vector bitcast lane/endian mismatch: '+lanes);
const back=ctx.reinterpretVectorBits('<4 x i32>',lanes,'<2 x i64>');
if(back.some((v,i)=>v!==input[i]))throw Error('Vector bitcast roundtrip mismatch');
if(ctx.vectorBinary('lshr',[-1n],[1n],1,'i64')[0]!==0x7fffffffffffffffn)throw Error('Unsigned vector right shift mismatch');
if(ctx.vectorBinary('lshr',[42n],[64n],1,'i64')[0]!==undefined)throw Error('Out-of-range shift must be poison');
console.log('PASS vector LLVM semantics and bitcast/native endian');
'''
p=subprocess.run(['node','--input-type=module','-e',js],text=True,capture_output=True)
if p.returncode:
    print(p.stderr,file=sys.stderr);sys.exit(p.returncode)
print(p.stdout.strip())
