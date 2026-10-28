import test from 'node:test';import assert from 'node:assert/strict';
import {ABIHeap} from '../../runtime/abi.mjs';import {createSDLBrowser} from '../../runtime/sdl_browser.mjs';
test('SDL gamma ramp matches original Uint16 ABI and changes actual displayed RGB pixels',()=>{
 const heap=new ABIHeap(),captures=[];
 const gc={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:(frame)=>captures.push(frame.data.slice())};
 const canvas={width:1,height:1,getContext:()=>gc,ownerDocument:{defaultView:{}}};
 const s=createSDLBrowser({heap,canvas}).symbols;
 assert.equal(s.SDL_Init(0x20),0);
 const window=s.SDL_CreateWindow(heap.writeCString('test'),0,0,1,1,0);
 assert.ok(window);const surface=s.SDL_GetWindowSurface(window);assert.ok(surface);
 const pixel=Number(heap.read(surface+32,'u64'));heap.u8.set([20,120,240,255],pixel);
 assert.equal(s.SDL_UpdateWindowSurface(window),0);
 assert.deepEqual([...captures.at(-1)],[20,120,240,255]);
 const r=heap.malloc(512),g=heap.malloc(512),b=heap.malloc(512);
 assert.equal(s.SDL_GetWindowGammaRamp(window,r,g,b),0);
 assert.equal(heap.read(r+20*2,'u16'),20*257);
 for(let i=0;i<256;i++)heap.write(r+i*2,'u16',65535-257*i);
 assert.equal(s.SDL_SetWindowGammaRamp(window,r,0,0),0);
 assert.equal(s.SDL_UpdateWindowSurface(window),0);
 assert.deepEqual([...captures.at(-1)],[235,120,240,255]);
 assert.deepEqual([...heap.bytes(pixel,4)],[20,120,240,255]); // non-destructive GPU/display transform
});
test('SDL_CaptureMouse only reports success for actual active DOM pointer capture',()=>{
 const heap=new ABIHeap(),handlers=new Map(),captured=new Set();
 const host={addEventListener:(n,f)=>handlers.set(n,f),removeEventListener:n=>handlers.delete(n)};
 const canvas={ownerDocument:{defaultView:host},getContext:()=>null,
    setPointerCapture:id=>captured.add(id),releasePointerCapture:id=>captured.delete(id),hasPointerCapture:id=>captured.has(id)};
 const s=createSDLBrowser({heap,canvas}).symbols;
 assert.equal(s.SDL_Init(0x4000),0);
 assert.equal(s.SDL_CaptureMouse(1),-1);
 handlers.get('pointerdown')({target:canvas,pointerId:21});
 assert.equal(s.SDL_CaptureMouse(1),0);assert.equal(captured.has(21),true);
 assert.equal(s.SDL_CaptureMouse(0),0);assert.equal(captured.has(21),false);
 handlers.get('pointerup')({target:canvas,pointerId:21});
 assert.equal(s.SDL_CaptureMouse(1),-1);
});
test('SDL gamma source pointers preserve byte bounds, offsets and output aliases',()=>{
 const heap=new ABIHeap();
 const canvas={width:1,height:1,ownerDocument:{defaultView:{}},getContext:()=>({createImageData:()=>({data:new Uint8ClampedArray(4)}),putImageData:()=>{}})};
 const s=createSDLBrowser({heap,canvas}).symbols;s.SDL_Init(0x20);
 const win=s.SDL_CreateWindow(heap.writeCString('source ramps'),0,0,1,1,0);
 const bytes=new Uint8Array(1544);bytes.fill(0xa5);
 const pointer=offset=>({__cPointer:true,buffer:bytes.buffer,lower:4,upper:1540,offset,array:false});
 const input=new DataView(bytes.buffer);
 for(let channel=0;channel<3;channel++)for(let i=0;i<256;i++)input.setUint16(4+channel*512+i*2,(i*257+channel*1337)&65535,true);
 assert.equal(s.SDL_SetWindowGammaRamp(win,pointer(4),pointer(516),pointer(1028)),0);
 const expected=bytes.slice(4,1540);bytes.fill(0,4,1540);
 assert.equal(s.SDL_GetWindowGammaRamp(win,pointer(4),pointer(516),pointer(1028)),0);
 assert.deepEqual(bytes.subarray(4,1540),expected);
 assert.deepEqual([...bytes.subarray(0,4)],[165,165,165,165]);
 assert.deepEqual([...bytes.subarray(1540)],[165,165,165,165]);
 const short=new Uint16Array(255),valid=new Uint16Array(256);valid.fill(77);
 assert.throws(()=>s.SDL_SetWindowGammaRamp(win,valid,short,null),/source allocation/);
 const saved=new Uint16Array(256);s.SDL_GetWindowGammaRamp(win,saved,null,null);
 assert.equal(saved[1],257); // All channels validate before any gamma state changes.
 assert.throws(()=>s.SDL_GetWindowGammaRamp(win,valid,short,null),/source allocation/);
 assert.ok(valid.every(v=>v===77)); // All outputs validate before writing.
 assert.throws(()=>s.SDL_SetWindowGammaRamp(win,{...pointer(4),upper:bytes.byteLength+1},null,null),/bounds/);
});
