#!/usr/bin/env python3
"""Verify LLVM poison control-flow and real game-data global relocations."""
import json, pathlib, subprocess, sys, tempfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from llvm_linked_backend import Emitter, GLOBAL, global_defs
from llvm_layout import Layout

body='''
entry:
  %same = select i1 %0, i32 42, i32 poison
  br i1 %0, label %good, label %bad
good:
  br label %merge
bad:
  br label %merge
merge:
  %choice = phi i32 [ 17, %good ], [ poison, %bad ]
  %result = select i1 %0, i32 %choice, i32 %same
  %frozen = freeze i32 %result
  ret i32 %frozen
'''
# A poisoned PHI value is legal to compute. freeze selects one concrete
# refinement when it is actually chosen; the well-defined path returns 17.
reduced='''
entry:
  %v = select i1 %0, i32 42, i32 poison
  %f = freeze i32 %v
  ret i32 %f
'''
call='''
entry:
  %result = call i32 @identity(i32 noundef poison)
  ret i32 %result
'''
# The unchosen poison path must not invalidate execution of a defined edge.
phi='''
entry:
  br i1 %0, label %yes, label %no
yes:
  br label %merge
no:
  br label %merge
merge:
  %result = phi i32 [ 12, %yes ], [ poison, %no ]
  %freeze = freeze i32 %result
  ret i32 %freeze
'''
def compile_expr(name,args,body):
 return Emitter().lower(name,args,body)
compiled=[compile_expr('selected','i1 %0',body),compile_expr('frozen','i1 %0',reduced),compile_expr('noundef','',call),compile_expr('incoming','i1 %0',phi)]
# Recover actual, original LLVM global initializers rather than synthesizing
# fabricated game asset tables. All six previously unsupported definitions
# must now be correctly decoded into byte arrays and relocations.
seen={}; all_desc=[]
for filename in (ROOT/'factory-output/whole-program/llvm').glob('*.ll'):
 ir=filename.read_text(errors='replace')
 if not any(token in ir for token in ('g_keyAsciiTable','ADLIB_TimbreBank','svgm_secwsp')):continue
 lay=Layout(ir)
 for name,desc in global_defs(ir,lay).items():
  if not any(k in name for k in ('g_keyAsciiTable','ADLIB_TimbreBank','svgm_secwsp','svgm_script','svgm_anmisc')):continue
  if desc['kind']=='unsupported':raise AssertionError('Unsupported recovered global '+name)
  seen.setdefault(name,desc)
assert all(k in seen for k in ("_ZL15g_keyAsciiTable", "ADLIB_TimbreBank", "_ZL11svgm_secwsp", "_ZL11svgm_script", "_ZL11svgm_anmisc")),seen.keys()
assert seen['_ZL15g_keyAsciiTable']['size']==128
assert seen['ADLIB_TimbreBank']['size']==3328
assert seen['_ZL11svgm_secwsp']['size']==960
assert seen['_ZL11svgm_script']['size']==480
assert seen['_ZL11svgm_anmisc']['size']==768
assert any(r.get('integerAddress') and r.get('width')==64 for r in seen['_ZL11svgm_secwsp']['references'])

with tempfile.TemporaryDirectory(dir=ROOT/'tests') as tmp:
 f=pathlib.Path(tmp)/'parity.mjs'
 source='''import assert from 'node:assert/strict';
import {LLVMContext} from '''+json.dumps((ROOT/'runtime/llvm_context.mjs').as_uri())+''';
const ctx=new LLVMContext();
ctx.register('identity',v=>v);
const selected='''+compiled[0]+''';
const frozen='''+compiled[1]+''';
const noundef='''+compiled[2]+''';
const incoming='''+compiled[3]+''';
assert.equal(selected(1),17);
assert.equal(selected(0),0);
assert.equal(frozen(1),42);
assert.equal(frozen(0),0);
assert.equal(incoming(1),12);
assert.equal(incoming(0),0);
assert.throws(()=>noundef(),/LLVM undefined behavior: poison at noundef call argument/);
assert.throws(()=>ctx.requireDefined(ctx.poisonValue,'branch'),/LLVM undefined behavior/);
ctx.defineGlobal('pointed',{kind:'bytes',size:8,value:Array(8).fill(0)});
ctx.defineGlobal('holder',{kind:'relocations',size:8,value:Array(8).fill(0),references:[{offset:0,symbol:'pointed',width:64,integerAddress:true}]});
ctx.finishGlobals();
assert.equal(ctx.load(ctx.ptr('holder'),'i64'),BigInt(ctx.ptr('pointed')));
assert.notEqual(ctx.ptr('pointed'),0);
console.log('PASS poison, PHI, freeze, noundef, and i64 ptrtoint relocation');
'''
 f.write_text(source)
 proc=subprocess.run(['node',str(f)],text=True,capture_output=True)
 if proc.returncode:raise AssertionError(proc.stderr)
 print(proc.stdout.strip())
print('PASS actual EDuke32 global initializer layouts, byte arrays and relocations')
