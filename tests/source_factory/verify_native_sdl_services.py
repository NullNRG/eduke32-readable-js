"""Execute actual SDL2 WASM services in Chromium; never certify game boot."""
import asyncio,functools,hashlib,http.server,json,os,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BUILD=ROOT/'factory-output/browser-services/build-manifest.json'
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.wasm':'application/wasm'}
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/__native_sdl_fixture__':
            data=b'<!doctype html><title>SDL2 service fixture, not gameplay</title><link rel="icon" href="data:,"><style>body{margin:0}</style><canvas id="canvas" width="80" height="48" tabindex="0"></canvas><button id="audio">Activate test audio</button>'
            self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(data)))
            self.end_headers();self.wfile.write(data);return
        super().do_GET()
async def main():
    manifest=json.loads(BUILD.read_text())
    for item in manifest['artifacts'].values():
        assert hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest()==item['sha256']
    assert manifest['original_engine_translation_units']==[]
    from playwright.async_api import async_playwright
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    base='http://127.0.0.1:'+str(server.server_port)
    try:
        async with async_playwright() as p:
            browser=await p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
            try:
                page=await browser.new_page();errors=[];console=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('console',lambda m:console.append({'type':m.type,'text':m.text}))
                await page.goto(base+'/__native_sdl_fixture__')
                initial=await page.evaluate('''async()=>{
                  window.realAudioContexts=[];
                  if(window.AudioContext){const Original=window.AudioContext;window.AudioContext=new Proxy(Original,{construct(target,args){
                    const context=Reflect.construct(target,args);realAudioContexts.push(context);return context;}});}
                  const [{default:factory},{createSDLWasmServices},{NativeRuntime}]=await Promise.all([
                    import('/factory-output/browser-services/sdl-services.mjs'),import('/runtime/sdl_wasm_services.mjs'),import('/runtime/index.mjs')]);
                  const canvas=document.querySelector('#canvas');
                  const services=await createSDLWasmServices(factory,{canvas});services.init(0x4021);
                  const windowHandle=services.createWindow('Actual native SDL2 service test',80,48);
                  const pixels=new Uint8Array(80*48*4);
                  for(let y=0;y<48;y++)for(let x=0;x<80;x++)pixels.set([x,y,101,255],(y*80+x)*4);
                  services.presentRGBA(windowHandle,pixels,80,48);
                  const ctx=canvas.getContext('2d'),first=Array.from(ctx.getImageData(17,23,1,1).data);
                  if(first.join(',')!=='17,23,101,255')throw Error('Native SDL RGBA presentation mismatch '+first);
                  const palette=new Uint8Array(1024),indices=new Uint8Array(80*48).fill(7);
                  palette.set([41,83,127,255],7*4);services.presentIndexed(windowHandle,indices,80,48,palette);
                  const indexed=Array.from(ctx.getImageData(20,20,1,1).data);
                  if(indexed.join(',')!=='41,83,127,255')throw Error('Native SDL indexed palette mismatch '+indexed);
                  const runtime=new NativeRuntime({nativeServices:services});runtime.bindSourceMemory();
                  if(runtime.engineHost.symbols.timerInit(120)!==0)throw Error('Engine timer initialization failed');
                  const storage=runtime.heap.malloc(8);runtime.heap.u8.fill(173,storage,storage+8);
                  const engineBuffer=runtime.heap.buffer;
                  const large=new Uint8Array(2048*2049*4);for(let i=0;i<large.length;i+=4)large.set([11,37,71,255],i);
                  services.presentRGBA(windowHandle,large,2048,2049);
                  if(runtime.heap.buffer!==engineBuffer||!runtime.heap.u8.subarray(storage,storage+8).every(v=>v===173))
                    throw Error('Service memory growth changed engine memory');
                  runtime.heap.free(storage);
                  let foreignRejected=false;try{services.destroyWindow({kind:'SDL_Window',backend:'sdl2-wasm32'});}catch(e){foreignRejected=e instanceof TypeError;}
                  if(!foreignRejected)throw Error('Foreign service pointer accepted');
                  const versionPtr=runtime.heap.malloc(3);runtime.sdl.symbols.SDL_GetVersion(versionPtr);
                  const version=Array.from(runtime.heap.u8.subarray(versionPtr,versionPtr+3));runtime.heap.free(versionPtr);
                  const counter=runtime.sdl.symbols.SDL_GetPerformanceCounter(),frequency=runtime.sdl.symbols.SDL_GetPerformanceFrequency();
                  if(typeof counter!=='bigint'||typeof frequency!=='bigint'||frequency<=0n)throw Error('Native timer ABI mismatch');
                  window.services=services;window.serviceWindow=windowHandle;window.engineRuntime=runtime;
                  while(services.pollEvent());canvas.focus();
                  document.querySelector('#audio').onclick=()=>{
                    services.init(0x10);const device=services.openAudio({frequency:22050,channels:1,samples:1024});
                    const samples=new Int16Array(Math.floor(device.frequency/2)*device.channels);
                    for(let i=0;i<samples.length;i++)samples[i]=Math.round(Math.sin(2*Math.PI*440*i/device.frequency)*4096);
                    services.queueAudio(device,samples);const before=services.queuedAudio(device);services.pauseAudio(device,false);
                    window.audioResult={device,before,frequency:device.frequency,channels:device.channels};window.audioReady=true;
                  };
                  return {version,first,indexed,frequency:String(frequency),counter:String(counter),foreignRejected,
                    engineMemoryUnaffectedByServiceGrowth:true,runtimeManifest:runtime.manifest()};
                }''')
                await page.keyboard.press('ArrowRight');await page.mouse.move(20,20);await page.mouse.click(20,20)
                events=await page.evaluate('''()=>{const rows=[];for(let i=0;i<256;i++){const event=services.pollEvent();if(!event)break;rows.push(event);}return rows;}''')
                assert any(e['type']==0x300 and e['fields'][0]==79 for e in events),events
                assert any(e['type']==0x301 and e['fields'][0]==79 for e in events),events
                assert any(e['type']==0x401 for e in events),events
                await page.click('#audio');await page.wait_for_function('window.audioReady===true')
                await page.wait_for_function('services.queuedAudio(audioResult.device)<audioResult.before',timeout=5000)
                audio=await page.evaluate('''()=>{const after=services.queuedAudio(audioResult.device),contexts=realAudioContexts.map(c=>c.state);
                  if(!(after<audioResult.before)||!contexts.includes('running'))throw Error('Native queued PCM output did not run '+JSON.stringify({after,before:audioResult.before,contexts}));
                  services.closeAudio(audioResult.device);let closedRejected=false;
                  try{services.queuedAudio(audioResult.device);}catch(e){closedRejected=e instanceof TypeError;}
                  return {before:audioResult.before,after,contexts,closedRejected,frequency:audioResult.frequency,channels:audioResult.channels};}''')
                assert audio['closedRejected']
                await page.evaluate('''()=>{engineRuntime.close();let stopped=false;try{services.counter();}catch(e){stopped=true;}
                  if(!stopped)throw Error('Closed service remained callable');}''')
                assert not errors,errors
                report={'format':'native-sdl-browser-verification/1','passed':True,'browser_version':browser.version,
                    'build_manifest_sha256':hashlib.sha256(BUILD.read_bytes()).hexdigest(),'artifacts':manifest['artifacts'],
                    'native_service_checks':initial,'real_dom_events':events,'native_audio_queue':audio,
                    'page_errors':errors,'console':console,'original_engine_translation_units_in_wasm':[],
                    'original_entry_executed':False,'original_gameplay_verified':False}
                (ROOT/'reports/oct29-native-sdl-browser-verification.json').write_text(json.dumps(report,indent=2)+'\n')
                print('PASS actual SDL2 WASM: timers/version, native software RGBA/indexed presentation, real DOM input, queued PCM, isolated heaps and handle lifetimes; no game boot claim')
            except Exception as error:
                diagnostic=await page.evaluate('''()=>({audio:window.audioResult&&{before:audioResult.before,
                  after:services.queuedAudio(audioResult.device),frequency:audioResult.frequency},
                  contexts:(window.realAudioContexts||[]).map(c=>({state:c.state,time:c.currentTime}))})''')
                (ROOT/'reports/oct29-native-sdl-browser-verification.json').write_text(json.dumps({
                    'passed':False,'error':str(error),'page_errors':errors,'console':console,'diagnostic':diagnostic,
                    'original_gameplay_verified':False},indent=2)+'\n')
                raise
            finally:await browser.close()
    finally:server.shutdown();server.server_close();thread.join()
if __name__=='__main__':asyncio.run(main())
