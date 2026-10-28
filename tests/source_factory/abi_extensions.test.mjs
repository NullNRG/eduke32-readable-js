import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';

test('C99 output formatting, 64-bit conversions, truncation and %n',()=>{
  const ctx=new LLVMContext(),h=ctx.heap,c=ctx.standard;
  const dst=h.malloc(100),str=h.writeCString('HELLO'),nptr=h.malloc(8);
  const fmt=h.writeCString('%+08d:%04x:%-7.3s:%lld:%8.2f:%%');
  assert.equal(c.snprintf(dst,100,fmt,7,255,str,123456789123n,2.5),45);
  assert.equal(h.readCString(dst),'+0000007:00ff:HEL    :123456789123:    2.50:%');
  const fmt2=h.writeCString('%u-%s');
  assert.equal(c.snprintf(dst,8,fmt2,4294967295,str),16);
  assert.equal(h.readCString(dst),'4294967');
  const fmt3=h.writeCString('A%hhn:B%lln');
  assert.equal(c.sprintf(dst,fmt3,nptr,nptr),3);
  assert.equal(h.read(nptr,'i64'),3n);
  assert.throws(()=>c.snprintf(dst,8,h.writeCString('%a'),1.25),/Unsupported/);
  assert.throws(()=>c.snprintf(dst,-1,fmt2,1,str),RangeError);
});

test('sysv varargs register save / overflow area and va_start / va_copy',()=>{
  const ctx=new LLVMContext(),h=ctx.heap;
  const frame=ctx.createVaFrame(['i32','double'],[13,1.5],
    [100n,2.5,200n,3.5,300n,4.5,400n,5.5,500n,6.5,600n,7.5,700n,8.5,800n,9.5],
    ['i64','double','i64','double','i64','double','i64','double','i64','double','i64','double','i64','double','i64','double']);
  const list=ctx.alloca(24,8);ctx.vaStart(list,frame);
  assert.equal(h.read(list,'u32'),8);
  assert.equal(h.read(list+4,'u32'),64);
  assert.equal(h.read(Number(h.read(list+16,'u64'))+8,'i64'),100n);
  assert.equal(h.read(Number(h.read(list+16,'u64'))+64,'f64'),2.5);
  const duplicate=ctx.alloca(24,8);ctx.libraries['llvm.va_copy.p0'](duplicate,list);
  assert.deepEqual(Array.from(h.bytes(duplicate,24)),Array.from(h.bytes(list,24)));
  assert.throws(()=>ctx.createVaFrame([],[],[1.25],['float']),/Unpromoted float/);
});

test('LLVM i32 relative pointer tables relocated against exact base',()=>{
  const ctx=new LLVMContext(),table='entries',targets=['first','second','third'];
  for(const target of targets)ctx.defineGlobal(target,{kind:'bytes',size:2,value:[target.length,0]});
  ctx.defineGlobal(table,{kind:'relocations',size:12,references:targets.map((target,i)=>({offset:i*4,symbol:target,relativeBase:table,width:32}))});
  ctx.finishGlobals();
  const base=ctx.ptr(table);
  for(let i=0;i<targets.length;i++){
    const value=ctx.libraries['llvm.load.relative.i64'](base,BigInt(i*4));
    assert.equal(value,ctx.ptr(targets[i]));
  }
  assert.throws(()=>ctx.libraries['llvm.load.relative.i64'](-4,0),RangeError);
});

test('C locale strings preserve NUL and unsigned byte semantics',()=>{
  const ctx=new LLVMContext(),h=ctx.heap,c=ctx.standard;
  const a=h.writeCString('abC'),b=h.writeCString('abD'),dst=h.malloc(8);
  assert.equal(c.strncmp(a,b,0),0);
  assert.ok(c.strncmp(a,b,3)<0);
  assert.equal(c.strncasecmp(a,h.writeCString('ABC'),4),0);
  assert.equal(c.strchr(a,0),a+3);
  assert.equal(c.strrchr(a,'C'.charCodeAt(0)),a+2);
  assert.equal(c.memchr(a,98,3),a+1);
  assert.equal(c.strncpy(dst,a,7),dst);
  assert.deepEqual(Array.from(h.bytes(dst,7)),[97,98,67,0,0,0,0]);
  assert.equal(c.tolower(65),97);assert.equal(c.toupper(122),90);
  assert.equal(c.isalnum(57),1);assert.equal(c.isalnum(58),0);
  assert.equal(c.sinf(Math.PI/2),Math.fround(Math.sin(Math.fround(Math.PI/2))));
});
