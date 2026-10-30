import { sourceByteView } from './source_bytes.mjs';

/** Typed boundary to SDL2-only WASM. Engine pointers/records stay in JS LP64.
 * Service handles are opaque, instance-owned objects; bytes cross explicitly.
 * This does not implement or replace EDuke32 simulation or world rendering.
 */
export async function createSDLWasmServices(factory, options = {}) {
  if(typeof factory!=='function')throw new TypeError('Compiled SDL2 service factory required');
  // SDL2's pinned Emscripten video/event backend selects the DOM #canvas.
  // Enforce that contract instead of presenting successfully without input.
  if(options.canvas&&(options.canvas.id!=='canvas'||options.canvas.ownerDocument?.getElementById('canvas')!==options.canvas))
    throw new TypeError('SDL2 WASM requires the provided DOM canvas to have id="canvas"');
  const module=await factory(options);
  const exports=['service_version','sdl_version','alloc','free','error','init','shutdown','counter','frequency','ticks',
    'create_window','destroy_window','present_rgba','present_indexed','poll_event','audio_open',
    'audio_frequency','audio_channels','audio_queue','audio_queued','audio_pause','audio_close'];
  for(const name of exports)if(typeof module['_sf_'+name]!=='function')throw new Error('Missing native SDL service '+name);
  if(module._sf_service_version()!==1)throw new Error('Unsupported native SDL service ABI');
  const windows=new Map(),audio=new Map();let closed=false;
  const live=()=>{if(closed)throw new Error('Native SDL service is closed');};
  const bytes=value=>{
    const result=sourceByteView(value);
    if(!(result instanceof Uint8Array))throw new TypeError('Service needs bounded engine byte storage');
    return result;
  };
  const error=()=>{
    const pointer=module._sf_error()>>>0,heap=module.HEAPU8;
    if(!pointer)return 'SDL service failed';
    const end=heap.indexOf(0,pointer);
    if(end<0)throw new Error('Unterminated native SDL error string');
    return new TextDecoder().decode(heap.subarray(pointer,end));
  };
  const checked=result=>{if(result<0)throw new Error(error());return result;};
  const allocate=(size,body)=>{
    live();if(!Number.isSafeInteger(size)||size<=0||size>0x7fffffff)throw new RangeError('Invalid service buffer size');
    const pointer=module._sf_alloc(size)>>>0;if(!pointer)throw new RangeError('Native SDL service allocation failed');
    try{return body(pointer);}finally{module._sf_free(pointer);}
  };
  const copied=(source,body)=>{const view=bytes(source);return allocate(Math.max(1,view.length),pointer=>{
    module.HEAPU8.set(view,pointer);return body(pointer,view.length);
  });};
  const handle=(table,value)=>{live();if(!table.has(value))throw new TypeError('Foreign or closed SDL service handle');return table.get(value);};
  const count=value=>{live();if(typeof value!=='bigint')throw new TypeError('SDL uint64 service result requires BigInt');return value;};
  const shape=(source,width,height,pitch,bpp)=>{
    if(![width,height,pitch].every(Number.isSafeInteger)||width<=0||height<=0||pitch<width*bpp||pitch>0x7fffffff)
      throw new RangeError('Invalid original framebuffer shape');
    const view=bytes(source);if(height*pitch>view.length)throw new RangeError('Framebuffer exceeds original engine allocation');
    return view.subarray(0,height*pitch);
  };
  const api={
    backend:'sdl2-wasm32',engineABI:'source-lp64-addresses/2',
    init(flags){live();return checked(module._sf_init(flags>>>0));},
    version(){live();const version=module._sf_sdl_version()>>>0;return Object.freeze([version>>>16,(version>>>8)&255,version&255]);},
    counter(){live();return count(module._sf_counter());},frequency(){live();return count(module._sf_frequency());},ticks(){live();return count(module._sf_ticks());},
    createWindow(title,width,height){
      if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<=0||height<=0)throw new RangeError('Invalid SDL window size');
      const text=typeof title==='string'?new TextEncoder().encode(title+'\0'):bytes(title);
      if(!text.length||text[text.length-1]!==0)throw new TypeError('Original window title must be NUL terminated');
      const pointer=copied(text,p=>module._sf_create_window(p,width,height))>>>0;
      if(!pointer)throw new Error(error());
      const window=Object.freeze({kind:'SDL_Window',backend:'sdl2-wasm32'});windows.set(window,pointer);return window;
    },
    destroyWindow(window){module._sf_destroy_window(handle(windows,window));windows.delete(window);},
    presentRGBA(window,source,width,height,pitch=width*4){
      const destination=handle(windows,window),view=shape(source,width,height,pitch,4);
      return copied(view,p=>checked(module._sf_present_rgba(destination,p,width,height,pitch)));
    },
    presentIndexed(window,source,width,height,palette,pitch=width){
      const destination=handle(windows,window),view=shape(source,width,height,pitch,1),rgba=bytes(palette);
      if(rgba.length!==1024)throw new RangeError('Original indexed palette requires 256 RGBA colors');
      return copied(view,p=>copied(rgba,c=>checked(module._sf_present_indexed(destination,p,width,height,pitch,c))));
    },
    pollEvent(){return allocate(64,p=>{
      if(!module._sf_poll_event(p))return null;
      const data=Array.from(new Int32Array(module.HEAPU8.buffer,p,16));
      return Object.freeze({type:data[0]>>>0,timestamp:data[1]>>>0,fields:data.slice(2,15),unmapped:!!data[15]});
    });},
    openAudio({frequency=44100,channels=2,samples=1024}={}){
      live();if(!Number.isSafeInteger(frequency)||frequency<8000||frequency>192000||
          !Number.isSafeInteger(channels)||channels<1||channels>8||!Number.isSafeInteger(samples)||samples<128||samples>16384)
        throw new RangeError('Invalid native PCM device configuration');
      const device=module._sf_audio_open(frequency,channels,samples)>>>0;if(!device)throw new Error(error());
      const output=Object.freeze({kind:'SDL_AudioDevice',backend:'sdl2-wasm32',
        frequency:module._sf_audio_frequency(),channels:module._sf_audio_channels(),format:'signed-16-little-endian'});
      audio.set(output,device);return output;
    },
    queueAudio(device,source){const id=handle(audio,device),view=bytes(source);
      if(view.length%(device.channels*2))throw new RangeError('PCM byte count is not a complete frame');
      return copied(view,p=>checked(module._sf_audio_queue(id,p,view.length)));
    },
    queuedAudio(device){return module._sf_audio_queued(handle(audio,device))>>>0;},
    pauseAudio(device,pause){module._sf_audio_pause(handle(audio,device),pause?1:0);},
    closeAudio(device){module._sf_audio_close(handle(audio,device));audio.delete(device);},
    bindSDL(heap,original){
      live();if(!heap?.check||!original)throw new TypeError('Original browser SDL table and engine heap required');
      // Pointer-free timing and the three-byte SDL_version record have exact
      // representations on both ABIs. Surface/event pointer marshalling is
      // exposed above and must be connected explicitly, never cast across heaps.
      return Object.freeze({...original,
        SDL_GetPerformanceCounter:()=>api.counter(),SDL_GetPerformanceFrequency:()=>api.frequency(),
        SDL_GetVersion(target){
          const view=sourceByteView(target);
          if(view){if(view.length<3)throw new RangeError('SDL version exceeds original storage');view.set(api.version(),0);}
          else{heap.check(target,3);heap.u8.set(api.version(),target);}
        }});
    },
    close(){if(closed)return;for(const id of audio.values())module._sf_audio_close(id);
      for(const pointer of windows.values())module._sf_destroy_window(pointer);
      audio.clear();windows.clear();module._sf_shutdown();closed=true;}
  };
  return Object.freeze(api);
}
