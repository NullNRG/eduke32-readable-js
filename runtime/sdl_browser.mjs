import { WebGL2Renderer } from './renderers.mjs';
import { sourceByteView, sourceSizedBytes, sourceHeapAddress } from './source_bytes.mjs';

/** Partial SDL2 ABI backed by an actual HTML canvas and monotonic host clock.
 * No fabricated input, audio, GPU, or filesystem services. Unsupported SDL
 * subsystems report failure instead of returning success with no behavior.
 */
export function createSDLBrowser({ heap, canvas=null, callIndirect=null, clock=()=>globalThis.performance?.now?.(), gamepads=()=>globalThis.navigator?.getGamepads?.(), physicalDPI=null, framePresenter=null, controllerMappings=null }={}) {
  if(!heap)throw TypeError('SDL browser ABI requires a heap');
  const TIMER=0x1,AUDIO=0x10,VIDEO=0x20,EVENTS=0x4000;
  const eventTarget=canvas?.ownerDocument?.defaultView??canvas;
  const eventCapable=typeof eventTarget?.addEventListener==='function' && typeof eventTarget?.removeEventListener==='function';
  const JOYSTICK=0x200,GAMECONTROLLER=0x2000;
  let gamepadCapable=false;try{gamepadCapable=gamepads?.()!=null;}catch{}
  const supported=TIMER|(globalThis.AudioContext||globalThis.webkitAudioContext?AUDIO:0)|(canvas?VIDEO:0)|(eventCapable?EVENTS:0)|(gamepadCapable?(JOYSTICK|GAMECONTROLLER):0);
  let initialized=0, lastError='', nextID=1;
  const activePointers=new Set();
  const gamma=[0,1,2].map(()=>Uint16Array.from({length:256},(_,i)=>i*257));
  const gammaView=pointer=>{
    if(!pointer)return null;
    const source=sourceByteView(pointer);
    if(source){
      if(source.byteLength<512)throw new RangeError('SDL gamma ramp exceeds source allocation');
      return new DataView(source.buffer,source.byteOffset,512);
    }
    const address=Number(pointer);heap.check(address,512);
    return new DataView(heap.u8.buffer,heap.u8.byteOffset+address,512);
  };
  const windows=new Map();
  const events=[];const keyState=heap.calloc(512,1);
  let eventAttached=false,modState=0,mouseX=0,mouseY=0,mouseButtons=0;
  const eventSize=56;
  // SDL2's 56-byte SDL_Event union, built with little-endian x86-64 field
  // offsets; only the event variants actually constructed below are advertised.
  const makeEvent=(type)=>{
    const bytes=new Uint8Array(eventSize),view=new DataView(bytes.buffer);
    view.setUint32(0,type,true);view.setUint32(4,Math.floor(clock())>>>0,true);
    view.setUint32(8,windows.values().next().value?.id??0,true);
    return {bytes,view};
  };
  const enqueue=bytes=>{if(events.length<1024)events.push(bytes);};
  const keyLookup=(code,key)=>{
    if(typeof code!=='string')return null;
    if(/^Key[A-Z]$/.test(code))return [4+code.charCodeAt(3)-65,code.charCodeAt(3)+32];
    if(/^Digit[0-9]$/.test(code))return [code==='Digit0'?39:29+Number(code[5]),48+Number(code[5])];
    const special={Enter:[40,13],Escape:[41,27],Backspace:[42,8],Tab:[43,9],Space:[44,32],ArrowRight:[79,1073741903],ArrowLeft:[80,1073741904],ArrowDown:[81,1073741905],ArrowUp:[82,1073741906],ShiftLeft:[225,1073742049],ShiftRight:[229,1073742053],ControlLeft:[224,1073742048],ControlRight:[228,1073742052],AltLeft:[226,1073742050],AltRight:[230,1073742054],Delete:[76,127]};
    return special[code]??null;
  };
  const modifier=e=>(e.shiftKey?3:0)|(e.ctrlKey?0xc0:0)|(e.altKey?0x300:0)|(e.metaKey?0xc00:0);
  const handlers={
    keydown:e=>{
      if(!(initialized&EVENTS))return;
      const info=keyLookup(e.code,e.key);if(!info)return;
      const [scan,key]=info;keyState&& (heap.u8[keyState+scan]=1);
      modState=modifier(e);
      const ev=makeEvent(0x300);ev.bytes[12]=1;ev.bytes[13]=e.repeat?1:0;
      ev.view.setInt32(16,scan,true);ev.view.setInt32(20,key,true);ev.view.setUint16(24,modState,true);
      enqueue(ev.bytes);
    },
    keyup:e=>{
      if(!(initialized&EVENTS))return;
      const info=keyLookup(e.code,e.key);if(!info)return;
      const [scan,key]=info;heap.u8[keyState+scan]=0;modState=modifier(e);
      const ev=makeEvent(0x301);ev.bytes[12]=0;
      ev.view.setInt32(16,scan,true);ev.view.setInt32(20,key,true);ev.view.setUint16(24,modState,true);
      enqueue(ev.bytes);
    },
    mousemove:e=>{
      if(!(initialized&EVENTS))return;
      const x=Math.trunc(e.offsetX??e.clientX??mouseX),y=Math.trunc(e.offsetY??e.clientY??mouseY);
      const dx=x-mouseX,dy=y-mouseY;mouseX=x;mouseY=y;
      const ev=makeEvent(0x400);ev.view.setUint32(16,mouseButtons,true);
      ev.view.setInt32(20,x,true);ev.view.setInt32(24,y,true);
      ev.view.setInt32(28,dx,true);ev.view.setInt32(32,dy,true);enqueue(ev.bytes);
    },
    mousedown:e=>mouseButton(e,true),
    mouseup:e=>mouseButton(e,false),
    pointerdown:e=>{if(e.target===canvas && Number.isInteger(e.pointerId))activePointers.add(e.pointerId);},
    pointerup:e=>{activePointers.delete(e.pointerId);},
    pointercancel:e=>{activePointers.delete(e.pointerId);},
  };
  function mouseButton(e,down){
    if(!(initialized&EVENTS))return;
    // SDL: left=1, middle=2, right=3; DOM: left=0, middle=1, right=2.
    const button=({0:1,1:2,2:3,3:4,4:5})[e.button];if(!button)return;
    const bit=1<<(button-1);mouseButtons=down?(mouseButtons|bit):(mouseButtons&~bit);
    mouseX=Math.trunc(e.offsetX??e.clientX??mouseX);
    mouseY=Math.trunc(e.offsetY??e.clientY??mouseY);
    const ev=makeEvent(down?0x401:0x402);
    ev.bytes[16]=button;ev.bytes[17]=down?1:0;ev.bytes[18]=1;
    ev.view.setInt32(20,mouseX,true);ev.view.setInt32(24,mouseY,true);enqueue(ev.bytes);
  }
  const attach=()=>{
    if(eventAttached||!eventCapable)return;
    for(const [name,handler] of Object.entries(handlers))eventTarget.addEventListener(name,handler);
    eventAttached=true;
  };
  const detach=()=>{
    if(!eventAttached)return;
    for(const [name,handler] of Object.entries(handlers))eventTarget.removeEventListener(name,handler);
    eventAttached=false;
    heap.memset(keyState,0,512);mouseButtons=0;events.length=0;activePointers.clear();
  };

  const errorPtr=heap.malloc(1024);
  const setError=(text)=>{
    lastError=String(text).slice(0,1022);
    heap.u8.fill(0,errorPtr,errorPtr+1024);
    heap.u8.set(new TextEncoder().encode(lastError),errorPtr);
    return -1;
  };
  const getWindow=ptr=>{
    if(!windows.has(ptr))throw Error('Invalid SDL_Window handle');
    return windows.get(ptr);
  };
  // Original-source JS lowering represents C string literals as bounded
  // Uint8Array storage, while an ABI heap caller supplies numeric pointers.
  // Accept both representations without changing SDL's host implementation.
  const inputPtr=(ptr)=>{
    ptr=sourceByteView(ptr)??ptr;
    if(ptr===0||ptr===null||ptr===undefined)return '';
    if(ptr instanceof Uint8Array){
      const terminator=ptr.indexOf(0);
      if(terminator<0)throw new TypeError('C string literal lacks terminating NUL');
      return new TextDecoder('utf-8',{fatal:true}).decode(ptr.slice(0,terminator));
    }
    if(!Number.isSafeInteger(ptr)||ptr<0)throw new TypeError('SDL string must be a C heap address or NUL-terminated bytes');
    return heap.readCString(ptr);
  };
  const writeInt=(ptr,val)=>{
    if(!ptr)return;
    if(ptr.__cReference===true){ptr.value=val|0;return;}
    const bytes=sourceSizedBytes(ptr,4,heap);
    new DataView(bytes.buffer,bytes.byteOffset,4).setInt32(0,val|0,true);
  };
  const begin=flags=>{
    flags=flags>>>0;
    if(flags & ~supported)return setError('SDL subsystem unavailable in browser runtime: 0x'+(flags&~supported).toString(16));
    initialized|=flags;if(flags&GAMECONTROLLER)initialized|=JOYSTICK;
    // SDL video and joystick initialization imply the event subsystem.
    if(initialized&(VIDEO|JOYSTICK))initialized|=EVENTS;if(initialized&EVENTS)attach();return 0;
  };
  const monotonic=()=>{
    const now=clock();
    if(typeof now!=='number'||!Number.isFinite(now)||now<0)throw Error('Monotonic clock unavailable');
    return BigInt(Math.floor(now*1e6));
  };
  // Browser Gamepad API "standard" mapping -> SDL2 controller button/axis codes.
  // Device state is read live; no synthetic controller or keyboard-to-pad fallback.
  const gamepadSnapshot=()=>{
    const found=gamepads?.();return found?Array.from(found).filter(x=>x&&x.connected!==false):[];
  };
  const controllerDevices=()=>gamepadSnapshot().filter(x=>x.mapping==='standard');
  const controllerHandles=new Map(),joystickHandles=new Map(),constStrings=new Map();
  const cachedString=value=>{
    if(value==null)return 0;
    const key=String(value);if(!constStrings.has(key))constStrings.set(key,heap.writeCString(key));
    return constStrings.get(key);
  };
  const controllerButton=[0,1,2,3,8,16,9,10,11,4,5,12,13,14,15];
  const controllerAxis=['leftx','lefty','rightx','righty','triggerleft','triggerright'];
  const controllerButtonNames=['a','b','x','y','back','guide','start','leftstick','rightstick','leftshoulder','rightshoulder','dpup','dpdown','dpleft','dpright'];
  const deviceForHandle=(handles,ptr)=>{
    const device=handles.get(Number(ptr));if(!device)return null;
    return gamepadSnapshot().find(x=>x.index===device.index)??null;
  };
  const ensureController=(ptr)=>{
    const dev=deviceForHandle(controllerHandles,ptr);
    if(!dev||dev.mapping!=='standard')throw Error('Disconnected or invalid SDL game controller');
    return dev;
  };
  const axisValue=v=>{const n=Math.max(-1,Math.min(1,Number(v)||0));return n<=-1?-32768:Math.round(n*32767);};
  let currentCursor=0,cursorVisible=true,joystickEvents=true;
  const previousControllers=new Map();
  function pumpControllers(){
    if(!joystickEvents||!(initialized&EVENTS)||!(initialized&(JOYSTICK|GAMECONTROLLER)))return;
    const current=controllerDevices();const alive=new Set();
    for(const pad of current){
      alive.add(pad.index);
      const axes=[0,1,2,3].map(i=>axisValue(pad.axes?.[i]??0)).concat([
        Math.round(Number(pad.buttons?.[6]?.value??0)*32767),
        Math.round(Number(pad.buttons?.[7]?.value??0)*32767),
      ]);
      const buttons=controllerButton.map(i=>+!!pad.buttons?.[i]?.pressed);
      const old=previousControllers.get(pad.index);
      if(!old){
        const ev=makeEvent(0x653);ev.view.setInt32(8,gamepadSnapshot().findIndex(x=>x.index===pad.index),true);enqueue(ev.bytes);
      }else{
        for(let i=0;i<axes.length;i++)if(axes[i]!==old.axes[i]){
          const ev=makeEvent(0x650);ev.view.setInt32(8,pad.index,true);
          ev.bytes[12]=i;ev.view.setInt16(16,axes[i],true);enqueue(ev.bytes);
        }
        for(let i=0;i<buttons.length;i++)if(buttons[i]!==old.buttons[i]){
          const ev=makeEvent(buttons[i]?0x651:0x652);ev.view.setInt32(8,pad.index,true);
          ev.bytes[12]=i;ev.bytes[13]=buttons[i];enqueue(ev.bytes);
        }
      }
      previousControllers.set(pad.index,{axes,buttons});
    }
    for(const id of previousControllers.keys())if(!alive.has(id)){
      const ev=makeEvent(0x654);ev.view.setInt32(8,id,true);enqueue(ev.bytes);previousControllers.delete(id);
    }
  }
  const cursors=new Map();
  // SDL_SYSTEM_CURSOR_ARROW through SDL_SYSTEM_CURSOR_NO (SDL 2.0 enum).
  const cursorNames=['default','text','wait','crosshair','progress','nwse-resize','nesw-resize','ew-resize','ns-resize','move','not-allowed','not-allowed'];
  const updateCursor=()=>{
    if(canvas?.style)canvas.style.cursor=cursorVisible?(cursors.get(currentCursor)??'default'):'none';
  };
  // Browser SDL display and framebuffer state. Only implement observable
  // operations supported by the attached canvas, not native WM/GPU handles.
  const hints=new Map(),environment=new Map();
  const surfaceHandles=new Map(),rwHandles=new Map();
  let textInput=false,windowSurface=0,clipboard='';
  let originalFramePresenter=framePresenter?.backend==='webgl2'?framePresenter:null, displayAttempted=!!originalFramePresenter;
  const ensureDisplay=()=>{
    if(displayAttempted)return !!(originalFramePresenter||getCanvas2D());
    displayAttempted=true;
    if(!canvas)return false;
    try{originalFramePresenter=new WebGL2Renderer(canvas);}catch{originalFramePresenter=null;}
    return !!(originalFramePresenter||getCanvas2D());
  };
  // Synchronous SDL clipboard semantics are implemented only for this sandbox.
  // navigator.clipboard is asynchronous and permissioned: do NOT report an
  // unverified OS clipboard read/write as successful.
  let clipboardOwned=false;
  const clipboardText=()=>{
    const bytes=new TextEncoder().encode(clipboard);
    const ptr=heap.malloc(bytes.length+1);
    heap.u8.set(bytes,ptr);heap.write(ptr+bytes.length,'u8',0);
    return ptr; // SDL_GetClipboardText caller owns and SDL_free()s this.
  };
  const getCanvas2D=()=>{const ctx=canvas?.getContext?.('2d');return ctx&&typeof ctx.putImageData==='function'?ctx:null;};
  const makeMode=(dst,w,h,refresh=0)=>{
    if(dst?.__cReference===true){
      const mode=dst.value;
      const storage=mode?.[Symbol.for('source-first.original-byte-record-storage/1')];
      if(storage)dst=storage.bytes;
      else {
        if(!mode||!['format','w','h','refresh_rate','driverdata'].every(name=>Object.hasOwn(mode,name)))
          throw TypeError('SDL display-mode reference lacks its original declared fields');
        mode.format=0x16762004;mode.w=w;mode.h=h;mode.refresh_rate=refresh;mode.driverdata=null;return;
      }
    }
    const bytes=sourceByteView(dst);
    if(bytes){
      if(bytes.byteLength<24)throw RangeError('SDL_DisplayMode exceeds original LP64 source storage');
      bytes.subarray(0,24).fill(0);
      const data=new DataView(bytes.buffer,bytes.byteOffset,24);
      data.setUint32(0,0x16762004,true);data.setInt32(4,w,true);
      data.setInt32(8,h,true);data.setInt32(12,refresh,true);return;
    }
    if(!dst)return;heap.check(dst,24);heap.memset(dst,0,24);
    // SDL_PIXELFORMAT_RGBA32 is RGBA8888 in native little-endian bytes;
    // SDL_PIXELFORMAT_ABGR8888 (0x16762004) is RGBA byte order on LE.
    heap.write(dst,'u32',0x16762004);heap.write(dst+4,'i32',w);
    heap.write(dst+8,'i32',h);heap.write(dst+12,'i32',refresh);
  };
  const createSurface=(pixels,w,h,pitch,ownsPixels=false,opaque=false)=>{
    if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<=0||h<=0||w>32768||h>32768||pitch<w*4){
      setError('Invalid RGBA SDL_Surface dimensions');return 0;
    }
    if(!pixels){setError('SDL_Surface has no pixels');return 0;}
    heap.check(pixels,pitch*h);
    const fmt=heap.malloc(64),ptr=heap.malloc(96);
    heap.memset(fmt,0,64);heap.memset(ptr,0,96);
    // Window surfaces use SDL_PIXELFORMAT_XBGR8888: RGB bytes plus unused X.
    // EDuke32's original software blitter writes RGB masks, never alpha.
    heap.write(fmt,'u32',opaque?0x16561804:0x16762004);heap.write(fmt+16,'u8',opaque?24:32);heap.write(fmt+17,'u8',4);
    // SDL_PixelFormat masks, offsets 16..28. RGBA in memory on little endian.
    [0x000000ff,0x0000ff00,0x00ff0000,opaque?0:0xff000000].forEach((mask,i)=>heap.write(fmt+20+i*4,'u32',mask));
    heap.write(ptr+8,'u64',BigInt(fmt));heap.write(ptr+16,'i32',w);
    heap.write(ptr+20,'i32',h);heap.write(ptr+24,'i32',pitch);
    heap.write(ptr+32,'u64',BigInt(pixels));heap.write(ptr+72,'i32',w);heap.write(ptr+76,'i32',h);heap.write(ptr+88,'i32',1);
    surfaceHandles.set(ptr,{pixels,fmt,w,h,pitch,ownsPixels,opaque,locks:0});return ptr;
  };
  const destroySurface=ptr=>{
    const s=surfaceHandles.get(Number(ptr));if(!s)throw Error('Invalid SDL_Surface');
    if(s.locks)throw Error('Cannot free locked SDL_Surface');
    if(s.ownsPixels)heap.free(s.pixels);
    heap.free(s.fmt);heap.free(ptr);surfaceHandles.delete(ptr);
  };
  const updateSurface=ptr=>{
    const sf=surfaceHandles.get(ptr);
    if(!sf||!ensureDisplay())return setError('Browser framebuffer presentation unavailable');
    if(sf.w!==canvas.width||sf.h!==canvas.height)return setError('Surface size differs from canvas');
    try{
      const gammaIdentity=gamma.every(r=>r.every((v,i)=>v===i*257));
      // Ordinary path: transfer original source bytes directly to GPU, even
      // with padded rows. Gamma correction is only applied when requested.
      if(originalFramePresenter&&gammaIdentity&&!sf.opaque){
        originalFramePresenter.drawRGBA(heap.u8.subarray(sf.pixels,sf.pixels+sf.pitch*sf.h),sf.w,sf.h,sf.pitch);
        return 0;
      }
      const frame=new Uint8ClampedArray(sf.w*sf.h*4);
      for(let y=0;y<sf.h;y++){
        const row=heap.u8.subarray(sf.pixels+y*sf.pitch,sf.pixels+y*sf.pitch+sf.w*4);
        frame.set(row,y*sf.w*4);
      }
      // Canvas ImageData interprets its fourth byte as alpha. SDL window X
      // padding is ignored; preserve source pixels and make only the transfer
      // image opaque, equally for Canvas and WebGL presentation.
      if(sf.opaque)for(let p=3;p<frame.length;p+=4)frame[p]=255;
      if(!gammaIdentity){
        for(let p=0;p<frame.length;p+=4)
          for(let c=0;c<3;c++)frame[p+c]=Math.round(gamma[c][frame[p+c]]/257);
      }
      if(originalFramePresenter)originalFramePresenter.drawRGBA(frame,sf.w,sf.h);
      else{
        const ctx=getCanvas2D(),image=ctx.createImageData(sf.w,sf.h);
        image.data.set(frame);ctx.putImageData(image,0,0);
      }
      return 0;
    }catch(error){return setError('Browser framebuffer presentation failed: '+error.message);}
  };
  const audioCtxType=globalThis.AudioContext??globalThis.webkitAudioContext;
  let audioContext=null;const audioDevices=new Map();let nextAudioDevice=1;
  const audioSpec=(ptr)=>({freq:heap.read(ptr,'i32'),format:heap.read(ptr+4,'u16'),channels:heap.read(ptr+6,'u8'),samples:heap.read(ptr+8,'u16'),callback:Number(heap.read(ptr+16,'u64')),userdata:Number(heap.read(ptr+24,'u64'))});
  const writeAudioSpec=(ptr,s)=>{
    heap.check(ptr,32);heap.memset(ptr,0,32);
    heap.write(ptr,'i32',s.freq);heap.write(ptr+4,'u16',s.format);
    heap.write(ptr+6,'u8',s.channels);heap.write(ptr+8,'u16',s.samples);
    heap.write(ptr+12,'u32',s.samples*s.channels*(s.format===0x8010?2:4));
    heap.write(ptr+16,'u64',BigInt(s.callback));heap.write(ptr+24,'u64',BigInt(s.userdata));
  };
  const openAudio=(name,isCapture,want,got,allowed)=>{
    if(!(initialized&0x10)||!audioCtxType){setError('WebAudio unavailable/not initialized');return 0;}
    if(isCapture){setError('Browser microphone capture needs asynchronous permission');return 0;}
    if(name){setError('Only the browser default audio device is supported');return 0;}
    heap.check(want,32);const spec=audioSpec(want);
    if(spec.freq<8000||spec.freq>192000||![1,2].includes(spec.channels)||![0x8010,0x8120].includes(spec.format)||!spec.callback){
      setError('Unsupported SDL audio callback format/configuration');return 0;
    }
    // ScriptProcessor callback is synchronous on browser main thread and can
    // call the genuine compiled C audio callback. No fabricated samples.
    if(typeof callIndirect!=='function'){setError('Compiled audio callback bridge unavailable');return 0;}
    if(!audioContext)audioContext=new audioCtxType({sampleRate:spec.freq});
    if(!audioContext.createScriptProcessor){setError('Synchronous callback bridge unavailable');return 0;}
    const size=2**Math.max(8,Math.min(14,Math.ceil(Math.log2(spec.samples||1024))));
    const node=audioContext.createScriptProcessor(size,0,spec.channels);
    const sampleBytes=spec.format===0x8010?2:4,buffer=heap.malloc(size*spec.channels*sampleBytes);
    const id=nextAudioDevice++;const entry={node,buffer,spec:{...spec,samples:size},paused:true};
    node.onaudioprocess=event=>{
      if(entry.paused)return;const out=event.outputBuffer;
      const n=out.length*spec.channels*sampleBytes;
      heap.memset(buffer,0,n);
      try{callIndirect(spec.callback,[spec.userdata,buffer,n]);}
      catch(e){entry.paused=true;console.error('Original SDL audio callback failed',e);return;}
      for(let c=0;c<spec.channels;c++){
        const ch=out.getChannelData(c);
        for(let i=0;i<out.length;i++){
          const p=buffer+(i*spec.channels+c)*sampleBytes;
          ch[i]=spec.format===0x8010?heap.read(p,'i16')/32768:heap.read(p,'f32');
        }
      }
    };
    node.connect(audioContext.destination);audioDevices.set(id,entry);
    if(got)writeAudioSpec(got,entry.spec);
    return id;
  };
  const spinlock=value=>{
    if(value?.__cReference===true)return {load:()=>value.value,compareExchange:(before,after)=>{
      const previous=value.value;if(previous===before)value.value=after;return previous;},store:next=>{value.value=next;}};
    const view=sourceByteView(value);
    const address=view?view.byteOffset:Number(value),buffer=view?view.buffer:heap.u8.buffer;
    if(view){if(view.length<4)throw new RangeError('SDL spinlock exceeds original storage');}
    else heap.check(address,4);
    if(!Number.isSafeInteger(address)||address%4)throw new RangeError('SDL spinlock requires aligned int storage');
    const data=new Int32Array(buffer,address,1);
    if(typeof SharedArrayBuffer!=='undefined'&&buffer instanceof SharedArrayBuffer)
      return {load:()=>Atomics.load(data,0),compareExchange:(before,after)=>Atomics.compareExchange(data,0,before,after),store:next=>Atomics.store(data,0,next)};
    // Source/game callbacks execute on this browser event thread. A regular
    // ArrayBuffer has no concurrent worker writers; keep the same lock word.
    return {load:()=>data[0],compareExchange:(before,after)=>{const previous=data[0];if(previous===before)data[0]=after;return previous;},store:next=>{data[0]=next;}};
  };
  const symbols={
    SDL_AtomicTryLock:lock=>+(spinlock(lock).compareExchange(0,1)===0),
    SDL_Init:begin,
    SDL_InitSubSystem:begin,
    SDL_WasInit:flags=> (flags===0?initialized:(initialized & (flags>>>0)))>>>0,
    SDL_QuitSubSystem:flags=>{initialized &= ~(flags>>>0);if(!(initialized&EVENTS))detach();},
    SDL_Quit:()=>{detach();if(windowSurface){destroySurface(windowSurface);windowSurface=0;}
      if(originalFramePresenter && originalFramePresenter!==framePresenter)originalFramePresenter.destroy();
      originalFramePresenter=framePresenter?.backend==='webgl2'?framePresenter:null;displayAttempted=!!originalFramePresenter;
      for(const handle of rwHandles.keys())heap.free(handle);rwHandles.clear();
      for(const [ptr,win] of windows){win.observer?.disconnect();heap.free(ptr);}
      windows.clear();previousControllers.clear();for(const d of audioDevices.values()){d.node.disconnect();heap.free(d.buffer);}audioDevices.clear();audioContext?.close?.();audioContext=null;initialized=0;},
    SDL_PumpEvents:pumpControllers, // DOM listeners plus live gamepad state deltas.
    SDL_PollEvent:ptr=>{
      pumpControllers();
      if(!(initialized&EVENTS))return 0;
      if(!events.length)return 0;
      if(!ptr)return 1; // SDL_PollEvent(NULL) checks pending input without dequeue.
      heap.check(ptr,eventSize);heap.u8.set(events.shift(),ptr);return 1;
    },
    SDL_FlushEvent:type=>{for(let i=events.length-1;i>=0;i--)if(new DataView(events[i].buffer).getUint32(0,true)===(type>>>0))events.splice(i,1);},
    SDL_PeepEvents:(ptr,count,action,minType,maxType)=>{
      if(!(initialized&EVENTS))return setError('SDL event subsystem is not initialized');
      if(!Number.isInteger(count)||count<0)return setError('Invalid SDL event count');
      if(action===0){ // SDL_ADDEVENT adds caller-supplied 56-byte ABI records.
        heap.check(ptr,count*eventSize);
        const before=events.length;
        for(let i=0;i<count;i++)enqueue(heap.bytes(ptr+i*eventSize,eventSize));
        return events.length-before;
      }
      if(action!==1&&action!==2)return setError('Unsupported SDL peep action');
      if(count===0)return 0;
      heap.check(ptr,count*eventSize);
      let written=0;
      for(let i=0;i<events.length&&written<count;){
        const ev=events[i],type=new DataView(ev.buffer,ev.byteOffset).getUint32(0,true);
        if(type>=(minType>>>0)&&type<=(maxType>>>0)){
          heap.u8.set(ev,ptr+written*eventSize);written++;
          if(action===2){events.splice(i,1);continue;}
        }
        i++;
      }
      return written;
    },
    SDL_GetKeyboardState:numKeys=>{if(numKeys)heap.write(numKeys,'i32',512);return keyState;},
    SDL_GetModState:()=>modState,
    SDL_GetMouseState:(xptr,yptr)=>{writeInt(xptr,mouseX);writeInt(yptr,mouseY);return mouseButtons;},
    SDL_GetError:()=>errorPtr,
    SDL_SetClipboardText:ptr=>{
      if(!ptr)return setError('Null SDL clipboard text');
      clipboard=heap.readCString(ptr);clipboardOwned=true;
      // A C ABI sandbox clipboard, intentionally not the system clipboard.
      return 0;
    },
    SDL_GetClipboardText:()=>clipboardText(),
    SDL_HasClipboardText:()=>+(clipboardOwned&&clipboard.length>0),
    SDL_GetPerformanceCounter:monotonic,
    SDL_GetPerformanceFrequency:()=>1000000000n,
    SDL_CreateWindow:(titlePtr,x,y,w,h,flags)=>{
      if(!(initialized & VIDEO)){setError('SDL video subsystem is not initialized');return 0;}
      if(!Number.isInteger(w)||!Number.isInteger(h)||w<=0||h<=0){setError('Invalid SDL window dimensions');return 0;}
      // Browser window decorations belong to the host. BORDERLESS maps to
      // the canvas border; RESIZABLE uses actual observed CSS dimensions.
      // Exclusive fullscreen, hidden and Vulkan remain unsupported here.
      const unsupported=(flags>>>0)&~(0x2|0x4|0x10|0x20);
      if(unsupported){setError('Unsupported SDL window flags 0x'+unsupported.toString(16));return 0;}
      if(flags&0x2){
        if(typeof canvas?.getContext!=='function'||!canvas.getContext('webgl2')){
          setError('WebGL2 unavailable; cannot create SDL OpenGL window');return 0;
        }
      }
      if(windows.size){setError('Only one canvas-backed SDL window is supported');return 0;}
      const Observer=canvas?.ownerDocument?.defaultView?.ResizeObserver;
      if((flags&0x20) && (!canvas?.style || typeof Observer!=='function')){
        setError('Resizable canvas requires DOM style and ResizeObserver');return 0;
      }
      const ptr=heap.malloc(16),id=nextID++;
      const title=inputPtr(titlePtr);
      canvas.width=w;canvas.height=h;
      if(typeof canvas.setAttribute==='function')canvas.setAttribute('aria-label',title);
      const win={id,w,h,title,flags:flags>>>0,observer:null};windows.set(ptr,win);
      if(flags&0x10)canvas.style.border='none';
      if(flags&0x20){
        Object.assign(canvas.style,{resize:'both',overflow:'hidden',width:w+'px',height:h+'px'});
        win.observer=new Observer(entries=>{
          const entry=entries.find(e=>e.target===canvas);if(!entry||!windows.has(ptr))return;
          const w=Math.round(entry.contentRect.width),h=Math.round(entry.contentRect.height);
          if(w<=0||h<=0||w>32768||h>32768||(win.w===w&&win.h===h))return;
          if(windowSurface){destroySurface(windowSurface);windowSurface=0;}
          win.w=w;win.h=h;canvas.width=w;canvas.height=h;
          const event=makeEvent(0x200);event.bytes[12]=5;
          event.view.setInt32(16,w,true);event.view.setInt32(20,h,true);enqueue(event.bytes);
        });win.observer.observe(canvas);
      }
      return ptr;
    },
    SDL_DestroyWindow:ptr=>{getWindow(ptr).observer?.disconnect();windows.delete(ptr);heap.free(ptr);},
    SDL_GetWindowID:ptr=>getWindow(ptr).id,
    SDL_GetWindowFlags:ptr=>{
      const win=getWindow(ptr);
      const full=canvas?.ownerDocument?.fullscreenElement===canvas;
      return (win.flags&~0x1001)|(full?0x1001:0);
    },
    SDL_GetWindowSize:(ptr,wPtr,hPtr)=>{const w=getWindow(ptr);writeInt(wPtr,w.w);writeInt(hPtr,w.h);},
    SDL_GL_GetDrawableSize:(ptr,wPtr,hPtr)=>{getWindow(ptr);writeInt(wPtr,canvas.width);writeInt(hPtr,canvas.height);},
    SDL_SetWindowSize:(ptr,w,h)=>{
      const win=getWindow(ptr);
      if(!Number.isInteger(w)||!Number.isInteger(h)||w<=0||h<=0)
        throw RangeError('Invalid SDL window dimensions');
      if(win.w===w&&win.h===h)return;
      if(windowSurface){destroySurface(windowSurface);windowSurface=0;}win.w=w;win.h=h;canvas.width=w;canvas.height=h;
      if(win.flags&0x20)Object.assign(canvas.style,{width:w+'px',height:h+'px'});
    },
    SDL_SetWindowTitle:(ptr,titlePtr)=>{
      const win=getWindow(ptr);win.title=inputPtr(titlePtr);
      if(typeof canvas.setAttribute==='function')canvas.setAttribute('aria-label',win.title);
    },
    SDL_GetNumVideoDisplays:()=> initialized&VIDEO?1:setError('SDL video subsystem is not initialized'),
    SDL_AtomicLock:lock=>{if(spinlock(lock).compareExchange(0,1)!==0)throw new Error('SDL spinlock contention cannot be serviced synchronously on browser main thread');},
    SDL_AtomicUnlock:lock=>{const cell=spinlock(lock);if(cell.load()!==1)throw new Error('Unlock of non-held SDL spinlock');cell.store(0);},
    SDL_GetKeyboardFocus:()=>{
      const win=[...windows.keys()][0]??0;
      return canvas?.ownerDocument?.activeElement===canvas?win:0;
    },
    SDL_GetWindowDisplayIndex:ptr=>{getWindow(ptr);return 0;},
    SDL_SetThreadPriority:priority=>{
      // SDL_THREAD_PRIORITY_NORMAL is meaningful in a cooperative, single
      // browser-main-thread target. Higher OS scheduling classes do not exist.
      if(priority===0)return 0;
      return setError('Browser cannot request native thread scheduling priority '+priority);
    },
    SDL_SetWindowFullscreen:(ptr,flags)=>{
      getWindow(ptr);
      if(flags!==0 && flags!==0x1001)return setError('Exclusive fullscreen cannot be requested in the browser');
      const doc=canvas?.ownerDocument;
      if(!doc)return setError('Browser fullscreen host unavailable');
      if(flags===0){
        if(doc.fullscreenElement!==canvas)return 0;
        if(typeof doc.exitFullscreen!=='function')return setError('Fullscreen exit unavailable');
        try{doc.exitFullscreen()?.catch?.(e=>setError('Fullscreen exit rejected: '+e.message));}
        catch(e){return setError('Fullscreen exit rejected: '+e.message);}
        return 0; // Request accepted; fullscreen status reflects the real DOM.
      }
      if(typeof canvas.requestFullscreen!=='function')return setError('Fullscreen request unavailable');
      try{canvas.requestFullscreen()?.catch?.(e=>setError('Fullscreen rejected: '+e.message));}
      catch(e){return setError('Fullscreen rejected: '+e.message);}
      return 0; // Request scheduled, not a claim that the DOM is fullscreen.
    },
    SDL_GetRelativeMouseMode:()=>+(canvas?.ownerDocument?.pointerLockElement===canvas),
    SDL_GetCurrentVideoDriver:()=>initialized&VIDEO?cachedString('canvas'):0,
    SDL_GetRevision:()=>cachedString('EDuke32-SourceFactory-SDL2-browser-adapter'),
    SDL_GetVersion:ptr=>{sourceSizedBytes(ptr,3,heap).set([2,0,5]);},
    SDL_GetKeyName:key=>{
      key=Number(key)|0;
      if(key>=32&&key<=126)return cachedString(String.fromCharCode(key).toUpperCase());
      const names={13:'Return',27:'Escape',8:'Backspace',9:'Tab',127:'Delete',1073741903:'Right',1073741904:'Left',1073741905:'Down',1073741906:'Up'};
      return cachedString(names[key]??'');
    },
    SDL_NumJoysticks:()=>gamepadSnapshot().length,
    SDL_JoystickEventState:state=>{
      if(state>=0)joystickEvents=!!state;
      return +joystickEvents;
    },
    SDL_IsGameController:index=>+(controllerDevices().some(d=>d.index===gamepadSnapshot()[index]?.index)),
    SDL_GameControllerNameForIndex:index=>{
      const d=gamepadSnapshot()[Number(index)];return d?.mapping==='standard'?cachedString(d.id):0;
    },
    SDL_JoystickNameForIndex:index=>cachedString(gamepadSnapshot()[Number(index)]?.id),
    SDL_GameControllerOpen:index=>{
      const d=gamepadSnapshot()[Number(index)];if(!d||d.mapping!=='standard'){setError('No standard-mapped controller at index');return 0;}
      const ptr=heap.malloc(8);controllerHandles.set(ptr,{index:d.index});return ptr;
    },
    SDL_GameControllerClose:ptr=>{if(!controllerHandles.delete(Number(ptr)))throw Error('Invalid SDL controller handle');heap.free(ptr);},
    SDL_GameControllerName:ptr=>cachedString(ensureController(ptr).id),
    SDL_GameControllerGetSerial:ptr=>{ensureController(ptr);return 0;}, // Web Gamepad API supplies no serial.
    SDL_GameControllerGetAxis:(ptr,axis)=>{
      const d=ensureController(ptr);axis=Number(axis);
      if(axis<0||axis>5||!Number.isInteger(axis))return 0;
      if(axis<4)return axisValue(d.axes?.[axis]??0);
      return Math.max(0,Math.min(32767,Math.round(Number(d.buttons?.[axis===4?6:7]?.value??0)*32767)));
    },
    SDL_GameControllerGetButton:(ptr,button)=>{
      const d=ensureController(ptr);const idx=controllerButton[Number(button)];
      return idx===undefined?0:+!!d.buttons?.[idx]?.pressed;
    },
    SDL_GameControllerHasAxis:(ptr,axis)=>{
      const d=ensureController(ptr);axis=Number(axis);
      return +(Number.isInteger(axis)&&axis>=0&&axis<=5&&(axis<4?d.axes?.length>axis:d.buttons?.length>(axis===4?6:7)));
    },
    SDL_GameControllerHasButton:(ptr,button)=>{
      const d=ensureController(ptr);const idx=controllerButton[Number(button)];return +(idx!==undefined&&d.buttons?.length>idx);
    },
    SDL_GameControllerHasRumble:ptr=>{
      const d=ensureController(ptr);return +(typeof d.vibrationActuator?.playEffect==='function');
    },
    SDL_GameControllerGetStringForAxis:axis=>cachedString(controllerAxis[Number(axis)]),
    SDL_GameControllerGetStringForButton:button=>cachedString(controllerButtonNames[Number(button)]),
    SDL_JoystickOpen:index=>{
      const d=gamepadSnapshot()[Number(index)];if(!d){setError('Invalid joystick index');return 0;}
      const ptr=heap.malloc(8);joystickHandles.set(ptr,{index:d.index});return ptr;
    },
    SDL_JoystickClose:ptr=>{if(!joystickHandles.delete(Number(ptr)))throw Error('Invalid SDL joystick handle');heap.free(ptr);},
    SDL_JoystickNumAxes:ptr=>deviceForHandle(joystickHandles,ptr)?.axes?.length??-1,
    SDL_JoystickNumButtons:ptr=>deviceForHandle(joystickHandles,ptr)?.buttons?.length??-1,
    SDL_JoystickNumBalls:ptr=>deviceForHandle(joystickHandles,ptr)?0:-1,
    SDL_JoystickNumHats:ptr=>deviceForHandle(joystickHandles,ptr)?0:-1,
    SDL_JoystickHasRumble:ptr=>+(typeof deviceForHandle(joystickHandles,ptr)?.vibrationActuator?.playEffect==='function'),
    SDL_CreateSystemCursor:which=>{
      const css=cursorNames[Number(which)];if(!css){setError('Invalid SDL system cursor');return 0;}
      if(!canvas?.style){setError('Browser canvas cursor styling unavailable');return 0;}
      const ptr=heap.malloc(8);cursors.set(ptr,css);return ptr;
    },
    SDL_SetCursor:ptr=>{if(ptr&&!cursors.has(ptr))throw Error('Invalid SDL cursor handle');currentCursor=ptr;updateCursor();},
    SDL_FreeCursor:ptr=>{if(!cursors.delete(Number(ptr)))throw Error('Invalid SDL cursor handle');if(currentCursor===ptr)currentCursor=0;heap.free(ptr);updateCursor();},
    SDL_ShowCursor:toggle=>{
      const was=+cursorVisible;
      if(toggle>=0){if(!canvas?.style){setError('Browser canvas cursor styling unavailable');return -1;}cursorVisible=!!toggle;updateCursor();}
      return toggle<0?+cursorVisible:was;
    },
    // Browser-backed video and 32-bit RGBA software surfaces.
    SDL_GetDisplayDPI:(index,ddpi,hdpi,vdpi)=>{
      if(index!==0||!(initialized&VIDEO))return setError('No canvas display');
      // Browser devicePixelRatio is CSS scaling, not physical pixel density.
      // Only a host-measured, explicitly supplied calibration is accurate.
      const dpi=physicalDPI;
      if(!dpi||![dpi.diagonal,dpi.horizontal,dpi.vertical].every(x=>Number.isFinite(x)&&x>0))
        return setError('Physical monitor DPI is not available from browser APIs');
      for(const [ptr,key] of [[ddpi,'diagonal'],[hdpi,'horizontal'],[vdpi,'vertical']])
        if(ptr)heap.write(Number(ptr),'f32',dpi[key]);
      return 0;
    },
    SDL_GetDisplayName:index=>index===0&&initialized&VIDEO?cachedString('Canvas Display'):0,
    SDL_GetDesktopDisplayMode:(index,dst)=>index===0&&initialized&VIDEO?(makeMode(dst,canvas.width,canvas.height),0):setError('No canvas display'),
    SDL_GetDisplayMode:(index,mode,dst)=>index===0&&mode===0&&initialized&VIDEO?(makeMode(dst,canvas.width,canvas.height),0):setError('Invalid display mode'),
    SDL_GetNumDisplayModes:index=>index===0&&initialized&VIDEO?1:setError('No canvas display'),
    SDL_GetClosestDisplayMode:(index,want,closest)=>{
      if(index!==0||!closest||!want||!(initialized&VIDEO))return 0;
      heap.check(want,24);makeMode(closest,canvas.width,canvas.height);return closest;
    },
    // SDL display-mode selection changes the mode requested for *future*
    // fullscreen transitions. We support the canvas' single exact mode only.
    SDL_SetWindowDisplayMode:(ptr,mode)=>{
      const win=getWindow(ptr);
      if(!mode){win.displayMode=null;return 0;}
      heap.check(mode,24);
      const format=heap.read(mode,'u32'),w=heap.read(mode+4,'i32'),h=heap.read(mode+8,'i32');
      if(w!==canvas.width||h!==canvas.height||format!==0x16762004)
        return setError('Requested display mode is not available on this canvas');
      win.displayMode={format,w,h,refresh:heap.read(mode+12,'i32')};return 0;
    },
    // A browser alert is a genuine synchronous modal dialog. Require a
    // hosting window.alert; never pretend a dialog was presented.
    SDL_ShowSimpleMessageBox:(flags,title,message,parent)=>{
      if(parent)getWindow(parent);
      const alert=canvas?.ownerDocument?.defaultView?.alert;
      if(typeof alert!=='function')return setError('Synchronous browser alert unavailable');
      alert.call(canvas.ownerDocument.defaultView, inputPtr(title)+'\n'+inputPtr(message));return 0;
    },
    SDL_ShowMessageBox:(data,result)=>{
      if(!data)return setError('Null SDL_MessageBoxData');
      heap.check(data,56);
      const win=Number(heap.read(data+8,'u64'));
      if(win)getWindow(win);
      const title=Number(heap.read(data+16,'u64'));
      const message=Number(heap.read(data+24,'u64'));
      const count=heap.read(data+32,'i32');
      const buttons=Number(heap.read(data+40,'u64'));
      const host=canvas?.ownerDocument?.defaultView;
      if(!host||count<1||count>2||!buttons)
        return setError('SDL modal dialog requires a host and one or two buttons');
      heap.check(buttons,count*16);
      const label=i=>inputPtr(Number(heap.read(buttons+16*i+8,'u64')));
      const id=i=>heap.read(buttons+16*i+4,'i32');
      let picked;
      if(count===1){
        if(typeof host.alert!=='function')return setError('Browser alert unavailable');
        host.alert(inputPtr(title)+'\n'+inputPtr(message)+'\n['+label(0)+']');picked=id(0);
      } else {
        if(typeof host.confirm!=='function')return setError('Browser confirm unavailable');
        const ok=host.confirm(inputPtr(title)+'\n'+inputPtr(message)+'\nOK: '+label(0)+' | Cancel: '+label(1));
        picked=id(ok?0:1);
      }
      if(result)heap.write(result,'i32',picked);
      return 0;
    },
    // A favicon is the browser's nearest real per-document window icon.
    // Feed it directly from the original SDL_Surface pixel bytes.
    SDL_SetWindowIcon:(ptr,surface)=>{
      getWindow(ptr);
      const sf=surfaceHandles.get(Number(surface)),doc=canvas?.ownerDocument;
      if(!sf||!doc?.createElement||!doc?.head?.appendChild)
        throw Error('Window icon surface or DOM unavailable');
      const cv=doc.createElement('canvas');cv.width=sf.w;cv.height=sf.h;
      const gc=cv.getContext?.('2d');
      if(!gc?.createImageData||!gc.putImageData||!cv.toDataURL)
        throw Error('Cannot render browser window icon');
      const frame=gc.createImageData(sf.w,sf.h);
      for(let y=0;y<sf.h;y++)frame.data.set(heap.u8.subarray(sf.pixels+y*sf.pitch,sf.pixels+y*sf.pitch+sf.w*4),y*sf.w*4);
      gc.putImageData(frame,0,0);
      const link=doc.querySelector?.('link[rel="icon"]')??doc.createElement('link');
      link.rel='icon';link.href=cv.toDataURL('image/png');
      if(!link.parentNode)doc.head.appendChild(link);
    },
    SDL_GetWindowGammaRamp:(ptr,red,green,blue)=>{
      getWindow(ptr);if(!ensureDisplay())return setError('No browser display for SDL gamma ramp');
      const views=[red,green,blue].map(gammaView);
      views.forEach((view,c)=>{if(view)for(let i=0;i<256;i++)view.setUint16(i*2,gamma[c][i],true);});return 0;
    },
    SDL_SetWindowGammaRamp:(ptr,red,green,blue)=>{
      getWindow(ptr);if(!ensureDisplay())return setError('No browser display for SDL gamma ramp');
      const views=[red,green,blue].map(gammaView);
      views.forEach((view,c)=>{if(view)for(let i=0;i<256;i++)gamma[c][i]=view.getUint16(i*2,true);});
      return 0; // Gamma remap is applied at SDL_UpdateWindowSurface, not destructively.
    },
    SDL_CaptureMouse:enabled=>{
      if(!canvas?.setPointerCapture||!canvas?.releasePointerCapture||!canvas?.hasPointerCapture)
        return setError('DOM pointer capture unavailable');
      if(enabled){const id=activePointers.values().next().value;
        if(id===undefined)return setError('No active pointer to capture');
        try{canvas.setPointerCapture(id);}catch(e){return setError('Pointer capture denied: '+e.message);}
        return canvas.hasPointerCapture(id)?0:setError('Pointer capture not granted');
      }
      try{for(const id of activePointers)if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
      catch(e){return setError('Pointer capture release failed: '+e.message);}
      return 0;
    },
    SDL_GetWindowPosition:(ptr,x,y)=>{getWindow(ptr);writeInt(x,0);writeInt(y,0);},
    SDL_SetWindowPosition:(ptr,x,y)=>{
      getWindow(ptr);if(Number(x)!==0||Number(y)!==0)setError('Browser window placement is controlled by the document');
    },
    SDL_CreateRGBSurfaceFrom:(pixels,w,h,depth,pitch,rmask,gmask,bmask,amask)=>{
      if(depth!==32||rmask!==0xff||gmask!==0xff00||bmask!==0xff0000||amask!==0xff000000){
        setError('SDL RGB surface format requires RGBA byte order');return 0;
      }
      return createSurface(pixels,w,h,pitch,false);
    },
    SDL_GetWindowSurface:ptr=>{
      getWindow(ptr);if(!ensureDisplay()){setError('Canvas display unavailable');return 0;}
      if(!windowSurface){const pixels=heap.malloc(canvas.width*canvas.height*4);
          windowSurface=createSurface(pixels,canvas.width,canvas.height,canvas.width*4,true,true);
      }
      return windowSurface;
    },
    SDL_UpdateWindowSurface:ptr=>{getWindow(ptr);return updateSurface(windowSurface);},
    SDL_FreeSurface:ptr=>{if(ptr===windowSurface)windowSurface=0;destroySurface(ptr);},
    SDL_LockSurface:ptr=>{const sf=surfaceHandles.get(Number(ptr));if(!sf)return setError('Invalid SDL_Surface');sf.locks++;return 0;},
    SDL_UnlockSurface:ptr=>{const sf=surfaceHandles.get(Number(ptr));if(!sf||!sf.locks)throw Error('Unlock of nonlocked SDL_Surface');sf.locks--;},
    SDL_RWFromConstMem:(ptr,size)=>{
      if(!Number.isSafeInteger(size)||size<0){setError('Invalid SDL_RWops buffer size');return 0;}
      const bytes=sourceSizedBytes(ptr,size,heap);const handle=heap.malloc(40);rwHandles.set(handle,{bytes,size,pos:0,readOnly:true});return handle;
    },
    SDL_RWclose:pointer=>{
      const handle=sourceHeapAddress(pointer,heap);
      if(!rwHandles.has(handle))return setError('Invalid or closed SDL_RWops');
      rwHandles.delete(handle);heap.free(handle);return 0;
    },
    SDL_GameControllerAddMappingsFromRW:(pointer,freesrc)=>{
      const handle=sourceHeapAddress(pointer,heap),rw=rwHandles.get(handle);
      if(!rw)return setError('Invalid or closed SDL_RWops');
      try{
        if(typeof controllerMappings!=='function')return setError('Custom controller databases require the native SDL2 service');
        const result=controllerMappings(rw.bytes.subarray(rw.pos));
        if(!Number.isSafeInteger(result)||result<0)return setError('Native SDL2 controller database load failed');
        rw.pos=rw.size;return result;
      }catch(error){return setError('Native SDL2 controller database: '+error.message);}
      finally{if(freesrc){rwHandles.delete(handle);heap.free(handle);}}
    },
    SDL_SetHint:(name,value)=>{const key=inputPtr(name);if(!key)return 0;
      hints.set(key,inputPtr(value));return 1;
    },
    SDL_GetHint:name=>{
      const key=inputPtr(name);return hints.has(key)?cachedString(hints.get(key)):0;
    },
    SDL_getenv:name=>{
      const key=inputPtr(name);return environment.has(key)?cachedString(environment.get(key)):0;
    },
    SDL_setenv:(name,value,overwrite)=>{
      const key=inputPtr(name);if(!key||key.includes('='))return setError('Invalid environment name');
      if(overwrite||!environment.has(key))environment.set(key,inputPtr(value));return 0;
    },
    SDL_StartTextInput:()=>{textInput=true;},
    SDL_StopTextInput:()=>{textInput=false;},
    SDL_IsTextInputActive:()=>+textInput,
    SDL_SetTextInputRect:ptr=>{if(ptr)heap.check(ptr,16);},
    SDL_GetMouseFocus:()=>canvas?.ownerDocument?.activeElement===canvas?[...windows.keys()][0]??0:0,
    SDL_GetGlobalMouseState:(x,y)=>{writeInt(x,mouseX);writeInt(y,mouseY);return mouseButtons;},
    SDL_SetWindowBordered:(ptr,bordered)=>{
      const win=getWindow(ptr);if(canvas?.style)canvas.style.border=bordered?'initial':'none';
      win.flags=bordered?win.flags&~0x10:win.flags|0x10;
    },
    SDL_SetWindowGrab:(ptr,grab)=>{
      getWindow(ptr);if(canvas){canvas.tabIndex=0;if(grab)canvas.focus?.();else canvas.blur?.();}
    },
    SDL_WarpMouseInWindow:(ptr,x,y)=>{
      getWindow(ptr);const previousX=mouseX,previousY=mouseY;
      mouseX=Math.trunc(x);mouseY=Math.trunc(y);
      const ev=makeEvent(0x400);ev.view.setUint32(16,mouseButtons,true);
      ev.view.setInt32(20,mouseX,true);ev.view.setInt32(24,mouseY,true);
      ev.view.setInt32(28,mouseX-previousX,true);ev.view.setInt32(32,mouseY-previousY,true);
      enqueue(ev.bytes); // Virtual pointer motion; cannot reposition OS cursor.
    },
    SDL_SetRelativeMouseMode:enabled=>{
      if(!canvas?.requestPointerLock||!canvas?.ownerDocument?.exitPointerLock)
        return setError('Browser pointer lock unavailable');
      const promise=enabled?canvas.requestPointerLock():canvas.ownerDocument.exitPointerLock();
      promise?.catch?.(e=>setError('Pointer lock denied: '+e.message));
      return 0; // Requested asynchronously; SDL_GetRelativeMouseMode reports actual state.
    },
    SDL_GameControllerRumble:(ptr,low,high,duration)=>{
      let pad;try{pad=ensureController(ptr);}catch{return setError('Disconnected controller');}
      const actuator=pad.vibrationActuator;
      if(typeof actuator?.playEffect!=='function')return setError('Gamepad vibration unavailable');
      actuator.playEffect('dual-rumble',{duration:Math.max(0,duration),strongMagnitude:high/65535,weakMagnitude:low/65535})
        .catch(e=>setError('Gamepad rumble rejected: '+e.message));
      return 0;
    },
    SDL_JoystickRumble:(ptr,low,high,duration)=>{
      const pad=deviceForHandle(joystickHandles,ptr),actuator=pad?.vibrationActuator;
      if(typeof actuator?.playEffect!=='function')return setError('Joystick vibration unavailable');
      actuator.playEffect('dual-rumble',{duration:Math.max(0,duration),strongMagnitude:high/65535,weakMagnitude:low/65535})
        .catch(e=>setError('Joystick rumble rejected: '+e.message));
      return 0;
    },
    SDL_GetNumAudioDrivers:()=>audioCtxType?1:0,
    SDL_GetAudioDriver:index=>index===0&&audioCtxType?cachedString('webaudio'):0,
    SDL_GetCurrentAudioDriver:()=>audioDevices.size?cachedString('webaudio'):0,
    SDL_GetAudioDeviceName:(index,capture)=>index===0&&!capture&&audioCtxType?cachedString('Browser Default Output'):0,
    SDL_OpenAudioDevice:openAudio,
    SDL_PauseAudioDevice:(id,pause)=>{
      const d=audioDevices.get(Number(id));if(!d)throw Error('SDL audio device is closed');
      d.paused=!!pause;
      if(!pause)audioContext?.resume?.().catch(e=>setError('Audio context resume failed: '+e.message));
    },
    SDL_LockAudioDevice:id=>{
      const d=audioDevices.get(Number(id));if(!d)throw Error('Invalid audio device');
      if(d.locked)throw Error('Reentrant SDL audio lock');d.locked=true;
    },
    SDL_UnlockAudioDevice:id=>{
      const d=audioDevices.get(Number(id));if(!d?.locked)throw Error('Unlock of unlocked audio device');d.locked=false;
    },
    SDL_CloseAudio:()=>{for(const d of audioDevices.values()){d.node.disconnect();heap.free(d.buffer);}audioDevices.clear();},
    SDL_OpenURL:ptr=>{
      const url=inputPtr(ptr);let u;
      try{u=new URL(url,canvas?.ownerDocument?.location?.href??'https://example.invalid/');}catch{return setError('Invalid URL');}
      if(!['http:','https:','mailto:'].includes(u.protocol))return setError('Unsupported URL scheme');
      const view=canvas?.ownerDocument?.defaultView;
      if(!view?.open)return setError('Browser window opener unavailable');
      return view.open(u.href,'_blank','noopener')===null?setError('Popup blocked'):0;
    },
    SDL_free:ptr=>heap.free(ptr),
  };
  return Object.freeze({symbols:Object.freeze(symbols)});
}
