import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';

test('CPUID requires a real explicit provider, preserves EAX/EBX/ECX/EDX with 32-bit ABI',()=>{
  const missing=new LLVMContext();
  assert.throws(()=>missing.x86CPUID(0),/explicit provider required/);
  const history=[];
  const ctx=new LLVMContext({cpuidProvider:(leaf,subleaf)=>{
    history.push([leaf,subleaf]);return [0x80000003,0x756e6547,0x6c65746e,0x49656e69];
  }});
  assert.deepEqual(ctx.x86CPUID(-2147483648),[-2147483645,0x756e6547,0x6c65746e,0x49656e69]);
  assert.deepEqual(history,[[0x80000000,0]]);
  assert.throws(()=>new LLVMContext({cpuidProvider:()=>[1,2,3]}).x86CPUID(0),/four 32-bit/);
  assert.throws(()=>new LLVMContext({cpuidProvider:()=>[1,2,3,2**53]}).x86CPUID(0),/four 32-bit/);
});

test('x87 long double ABI preserves 80 raw bits, uses a 16-byte variadic stack slot',()=>{
  const ctx=new LLVMContext(),h=ctx.heap;
  const one=Uint8Array.from([0,0,0,0,0,0,0,128,255,63]);
  const minus=Uint8Array.from([0,0,0,0,0,0,0,128,255,191]);
  assert.deepEqual(ctx.requireX87(one),one);
  assert.throws(()=>ctx.requireX87(1.0),/10 raw bytes/);
  assert.throws(()=>ctx.requireX87(new Uint8Array(8)),/10 raw bytes/);
  const frame=ctx.createVaFrame(['i32'],[7],[one,99,minus],['x86_fp80','i32','x86_fp80']);
  const first=frame.overflowPtr;
  assert.equal(first%16,0);
  assert.deepEqual(h.bytes(first,10),one);
  assert.deepEqual(h.bytes(first+16,10),minus);
  assert.equal(h.read(frame.registerPtr+8,'i64'),99n);
  assert.deepEqual(h.bytes(first+10,6),new Uint8Array(6));
  const list=ctx.alloca(24,8);ctx.vaStart(list,frame);
  assert.equal(Number(h.read(list+8,'u64')),first);
  // If a named x87 parameter consumes a stack slot, va_start starts after it.
  const named=ctx.createVaFrame(['x86_fp80','i32'],[one,5],[minus],['x86_fp80']);
  const list2=ctx.alloca(24,8);ctx.vaStart(list2,named);
  assert.equal(Number(h.read(list2+8,'u64'))%16,0);
  assert.deepEqual(h.bytes(Number(h.read(list2+8,'u64')),10),minus);
});

test('SDL2 browser adapter enforces subsystem support and owns real canvas handles',()=>{
  const calls=[];const canvas={width:0,height:0,
    getContext:(name)=>{calls.push(name);return name==='webgl2'?{}:null;},
    setAttribute:(name,value)=>{calls.push([name,value]);}};
  let tick=100.125;
  const ctx=new LLVMContext({canvas,clock:()=>tick}),h=ctx.heap,s=ctx.libraries;
  assert.equal(s.SDL_Init(0),0);
  assert.equal(s.SDL_WasInit(0),0);
  assert.equal(s.SDL_InitSubSystem(0x20|0x1),0);
  assert.equal(s.SDL_WasInit(0x20|0x1),0x21);
  assert.equal(s.SDL_InitSubSystem(0x10),-1); // no silent audio success
  assert.match(h.readCString(s.SDL_GetError()),/unavailable/);
  assert.equal(s.SDL_GetPerformanceFrequency(),1000000000n);
  assert.equal(s.SDL_GetPerformanceCounter(),100125000n);
  tick+=2.5; assert.equal(s.SDL_GetPerformanceCounter(),102625000n);
  const title=h.writeCString('A real canvas window');
  const win=s.SDL_CreateWindow(title,0,0,320,200,0x2|0x4);
  assert.ok(win>0);assert.equal(canvas.width,320);assert.equal(canvas.height,200);
  assert.ok(calls.includes('webgl2'));
  assert.equal(s.SDL_GetWindowID(win),1);
  assert.equal(s.SDL_GetWindowFlags(win),6);
  const w=h.malloc(4),height=h.malloc(4);
  s.SDL_GetWindowSize(win,w,height);
  assert.equal(h.read(w,'i32'),320);assert.equal(h.read(height,'i32'),200);
  s.SDL_SetWindowSize(win,640,480);
  s.SDL_GL_GetDrawableSize(win,w,height);
  assert.equal(h.read(w,'i32'),640);assert.equal(h.read(height,'i32'),480);
  assert.equal(s.SDL_GetNumVideoDisplays(),1);
  assert.equal(s.SDL_CreateWindow(title,0,0,640,480,0),0); // second window unavailable
  s.SDL_DestroyWindow(win);
  assert.throws(()=>s.SDL_GetWindowID(win),/Invalid SDL_Window/);
  s.SDL_QuitSubSystem(0x20);
  assert.equal(s.SDL_CreateWindow(title,0,0,64,64,0),0);
  s.SDL_Quit();assert.equal(s.SDL_WasInit(0),0);
});

test('C locale and bounded string functions preserve byte-indexed pointers',()=>{
  const ctx=new LLVMContext(),h=ctx.heap,c=ctx.libraries;
  for(let x=-1;x<256;x++){
    const alpha=(x>=65&&x<=90)||(x>=97&&x<=122);
    assert.equal(Boolean(c.isalpha(x)),alpha);
    assert.equal(Boolean(c.isxdigit(x)),(x>=48&&x<=57)||(x>=65&&x<=70)||(x>=97&&x<=102));
    assert.equal(Boolean(c.isspace(x)),x===32||(x>=9&&x<=13));
    assert.equal(Boolean(c.isupper(x)),x>=65&&x<=90);
    assert.equal(Boolean(c.islower(x)),x>=97&&x<=122);
  }
  const a=h.writeCString('bananaban'),b=h.writeCString('ana'),d=h.malloc(30);
  h.write(d,'u8',65);h.write(d+1,'u8',0);
  assert.equal(c.strstr(a,b),a+1);
  assert.equal(c.strstr(a,h.writeCString('')),a);
  assert.equal(c.strstr(a,h.writeCString('xyz')),0);
  assert.equal(c.strncat(d,b,2),d);
  assert.equal(h.readCString(d),'Aan');
  assert.equal(c.strncat(d,b,0),d);
  assert.equal(c.strncat(d,b,12),d);
  assert.equal(h.readCString(d),'Aanana');
  assert.throws(()=>c.strncat(d,b,-1),RangeError);
});

test('C libm adapters preserve signed zeros and ordinary finite values',()=>{
  const c=new LLVMContext().libraries;
  assert.equal(c.sin(-0),-0);assert.equal(c.cos(0),1);
  assert.equal(c.exp(0),1);assert.equal(c.sqrt(4),2);
  assert.equal(c.ldexp(0.75,4),12);
  assert.equal(c.ldexpf(0.75,4),12);
  assert.equal(c.atanf(0),0);
  assert.ok(Math.abs(c.atan2f(1,1)-Math.PI/4)<1e-7);
  assert.ok(Math.abs(c.log10f(1000)-3)<1e-6);
  assert.equal(c.expf(0),1);
  assert.equal(c.tanf(0),0);
});

test('C integer parsing preserves 64-bit values, base prefixes, endptr and errno',()=>{
  const ctx=new LLVMContext(),h=ctx.heap,c=ctx.libraries;
  const end=h.malloc(8),errno=c.__errno_location();
  const parse=(func,input,base=0)=>{
    const ptr=h.writeCString(input);h.write(errno,'i32',0);
    const value=c[func](ptr,end,base);
    return [value,Number(h.read(end,'u64'))-ptr,h.read(errno,'i32')];
  };
  assert.deepEqual(parse('strtol','  -0x1F tail'),[-31n,7,0]);
  assert.deepEqual(parse('strtol','0b101'),[0n,1,0]);
  assert.deepEqual(parse('__isoc23_strtol','0b101'),[5n,5,0]);
  assert.deepEqual(parse('strtol','0x'),[0n,1,0]);
  assert.deepEqual(parse('strtol','+'),[0n,0,0]);
  assert.deepEqual(parse('strtol','9223372036854775807'),[9223372036854775807n,19,0]);
  assert.deepEqual(parse('strtol','9223372036854775808'),[9223372036854775807n,19,34]);
  assert.deepEqual(parse('strtol','-9223372036854775809'),[-9223372036854775808n,20,34]);
  assert.deepEqual(parse('strtoul','-1'),[18446744073709551615n,2,0]);
  assert.deepEqual(parse('__isoc23_strtoul','0b11'),[3n,4,0]);
  assert.deepEqual(parse('strtoul','18446744073709551616'),[18446744073709551615n,20,34]);
});
