import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';

test('SDL2 real browser listeners produce ABI-packed keyboard and mouse events',()=>{
  const listeners=new Map();const canvas={width:0,height:0,
    addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type),
    setAttribute:()=>{}};
  const ctx=new LLVMContext({canvas,clock:()=>1234.5});const h=ctx.heap,s=ctx.libraries;
  assert.equal(s.SDL_Init(0x4000|0x20),0);assert.equal(listeners.size,8); // keyboard/mouse and pointer-capture lifecycle listeners
  const win=s.SDL_CreateWindow(h.writeCString('Input'),0,0,640,480,0);assert.ok(win);
  const keyptr=h.malloc(56),num=h.malloc(4);
  const keys=s.SDL_GetKeyboardState(num);
  assert.equal(h.read(num,'i32'),512);assert.equal(h.read(keys+4,'u8'),0);
  listeners.get('keydown')({code:'KeyA',key:'A',shiftKey:true,ctrlKey:false,altKey:false,metaKey:false,repeat:false});
  assert.equal(h.read(keys+4,'u8'),1);assert.equal(s.SDL_PollEvent(0),1);
  assert.equal(s.SDL_PollEvent(keyptr),1);
  assert.equal(h.read(keyptr,'u32'),0x300);
  assert.equal(h.read(keyptr+4,'u32'),1234);
  assert.equal(h.read(keyptr+8,'u32'),s.SDL_GetWindowID(win));
  assert.equal(h.read(keyptr+16,'i32'),4);
  assert.equal(h.read(keyptr+20,'i32'),97); // SDLK_a even when Shift is held
  assert.equal(h.read(keyptr+24,'u16'),3);
  assert.equal(s.SDL_GetModState(),3);
  listeners.get('keyup')({code:'KeyA',key:'a',shiftKey:false,ctrlKey:false,altKey:false,metaKey:false});
  assert.equal(h.read(keys+4,'u8'),0);
  assert.equal(s.SDL_PollEvent(keyptr),1);assert.equal(h.read(keyptr,'u32'),0x301);
  listeners.get('mousemove')({offsetX:45,offsetY:20});
  listeners.get('mousedown')({button:0,offsetX:45,offsetY:20});
  const x=h.malloc(4),y=h.malloc(4);
  assert.equal(s.SDL_GetMouseState(x,y),1);
  assert.equal(h.read(x,'i32'),45);assert.equal(h.read(y,'i32'),20);
  assert.equal(s.SDL_PeepEvents(keyptr,1,1,0x400,0x402),1);
  assert.equal(h.read(keyptr,'u32'),0x400);
  assert.equal(s.SDL_PeepEvents(keyptr,1,2,0x401,0x401),1);
  assert.equal(h.read(keyptr,'u32'),0x401);
  assert.equal(h.read(keyptr+16,'u8'),1);
  s.SDL_FlushEvent(0x400);assert.equal(s.SDL_PollEvent(keyptr),0);
  s.SDL_Quit();assert.equal(listeners.size,0);assert.equal(h.read(keys+4,'u8'),0);
});

test('SDL event subsystem refuses fake success if no actual input target exists',()=>{
 const c=new LLVMContext({canvas:{width:0,height:0}}),s=c.libraries;
 assert.equal(s.SDL_InitSubSystem(0x4000),-1);
 assert.match(c.heap.readCString(s.SDL_GetError()),/unavailable/);
 assert.equal(s.SDL_PollEvent(c.heap.malloc(56)),0);
});
