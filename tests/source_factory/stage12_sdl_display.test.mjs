import test from 'node:test';import assert from 'node:assert/strict';
import {ABIHeap} from '../../runtime/abi.mjs';import {createSDLBrowser} from '../../runtime/sdl_browser.mjs';

test('SDL window RGBX padding stays opaque across repeated presentations without rewriting original pixels',()=>{
 const heap=new ABIHeap(),captures=[];
 const gc={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:image=>captures.push(image.data.slice())};
 const canvas={width:2,height:1,getContext:()=>gc,ownerDocument:{defaultView:{}}};
 const s=createSDLBrowser({heap,canvas}).symbols;s.SDL_Init(0x20);
 const win=s.SDL_CreateWindow(heap.writeCString('RGBX'),0,0,2,1,0),surface=s.SDL_GetWindowSurface(win);
 const format=Number(heap.read(surface+8,'u64')),pixels=Number(heap.read(surface+32,'u64'));
 assert.equal(heap.read(format,'u32'),0x16561804);
 assert.equal(heap.read(format+16,'u8'),24);assert.equal(heap.read(format+17,'u8'),4);
 assert.equal(heap.read(format+32,'u32'),0);
 for(const padding of [0,1,127,255]){
  const original=Uint8Array.of(21,97,243,padding,210,9,42,padding);heap.u8.set(original,pixels);
  for(let i=0;i<3;i++){
   assert.equal(s.SDL_UpdateWindowSurface(win),0);
   assert.deepEqual([...captures.at(-1)],[21,97,243,255,210,9,42,255]);
   assert.deepEqual([...heap.bytes(pixels,8)],[...original]);
  }
 }
 s.SDL_Quit();
});
test('SDL display modes write through original source references and bounded LP64 byte views',()=>{
 const heap=new ABIHeap(),canvas={width:640,height:480,getContext:()=>null,ownerDocument:{defaultView:{}}};
 const s=createSDLBrowser({heap,canvas}).symbols;assert.equal(s.SDL_Init(0x20),0);
 const mode={format:0,w:0,h:0,refresh_rate:0,driverdata:null};
 const ref={__cReference:true,get value(){return mode;},set value(_v){throw Error('must preserve original record identity');}};
 assert.equal(s.SDL_GetDisplayMode(0,0,ref),0);
 assert.deepEqual(mode,{format:0x16762004,w:640,h:480,refresh_rate:0,driverdata:null});
 const bytes=new Uint8Array(32).fill(0x7f),pointer={__cPointer:true,buffer:bytes.buffer,offset:8,lower:8,upper:32,array:false};
 assert.equal(s.SDL_GetDesktopDisplayMode(0,pointer),0);
 assert.equal(new DataView(bytes.buffer).getInt32(12,true),640);
 assert.deepEqual([...bytes.subarray(0,8)],Array(8).fill(0x7f));
 assert.equal(new DataView(bytes.buffer).getBigUint64(24,true),0n);
 assert.throws(()=>s.SDL_GetDisplayMode(0,0,bytes.subarray(16)),/storage/);s.SDL_Quit();
});
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

test('SDL version output borrows byte-backed C records and preserves pointer bounds',()=>{
 const heap=new ABIHeap(),s=createSDLBrowser({heap}).symbols;
 const bytes=new Uint8Array(12).fill(0xa5);
 const record={[Symbol.for('source-first.original-byte-record-storage/1')]:{bytes:bytes.subarray(4,7)}};
 s.SDL_GetVersion(record);
 assert.deepEqual([...bytes],[165,165,165,165,2,0,5,165,165,165,165,165]);
 const pointer={__cPointer:true,buffer:bytes.buffer,lower:7,upper:10,offset:7,array:false};
 s.SDL_GetVersion(pointer);assert.deepEqual([...bytes.subarray(7,10)],[2,0,5]);
 assert.throws(()=>s.SDL_GetVersion({...pointer,upper:9}),/bounds/);
 const native=heap.malloc(3);s.SDL_GetVersion(native);assert.deepEqual([...heap.bytes(native,3)],[2,0,5]);
});

test('SDL canvas window uses observed resizes, preserves unchanged surfaces and releases observers',()=>{
 const heap=new ABIHeap(),captures=[],observers=[];
 class Resize {constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this);}observe(target){this.target=target;}disconnect(){this.disconnected=true;}}
 const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:frame=>captures.push(frame.data)};
 const canvas={width:640,height:480,style:{},getContext:()=>context,ownerDocument:{defaultView:{ResizeObserver:Resize,addEventListener(){},removeEventListener(){}}}};
 const s=createSDLBrowser({heap,canvas}).symbols;s.SDL_Init(0x20);assert.equal(s.SDL_WasInit(0x4000),0x4000);
 const win=s.SDL_CreateWindow(heap.writeCString('original video flags'),0,0,640,480,0x30);
 assert.ok(win);assert.equal(canvas.style.border,'none');assert.equal(canvas.style.resize,'both');
 const surface=s.SDL_GetWindowSurface(win),format=heap.read(surface+8,'u64');
 s.SDL_SetWindowSize(win,640,480);assert.equal(s.SDL_GetWindowSurface(win),surface);assert.equal(heap.read(surface+8,'u64'),format);
 const x=new Int32Array(1),y=new Int32Array(1);s.SDL_GetWindowSize(win,x,y);assert.equal(x[0],640);assert.equal(y[0],480);
 observers[0].fn([{target:canvas,contentRect:{width:800,height:600}}]);
 assert.equal(canvas.width,800);assert.equal(canvas.height,600);s.SDL_GetWindowSize(win,x,y);assert.equal(x[0],800);assert.equal(y[0],600);
 const event=heap.malloc(56);assert.equal(s.SDL_PollEvent(event),1);assert.equal(heap.read(event,'u32'),0x200);assert.equal(heap.read(event+12,'u8'),5);
 assert.equal(heap.read(event+16,'i32'),800);assert.equal(heap.read(event+20,'i32'),600);
 s.SDL_SetWindowBordered(win,1);assert.equal(s.SDL_GetWindowFlags(win)&0x10,0);
 s.SDL_DestroyWindow(win);assert.ok(observers[0].disconnected);s.SDL_Quit();
 const absent=createSDLBrowser({heap,canvas:{width:1,height:1}}).symbols;absent.SDL_Init(0x20);
 assert.equal(absent.SDL_CreateWindow(heap.writeCString('unsupported'),0,0,1,1,0x20),0);
});
