#!/usr/bin/env python3
"""End-to-end Chromium test of the actual browser runtime, NOT Duke gameplay.

Serves unchanged runtime ES modules over HTTP, runs SDL window/input and
original-byte framebuffer presentation in a real DOM, records evidence.
The strict original-game acceptance gate is always separate.
"""
import asyncio
import base64
import re
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import shutil
import zlib

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'reports/browser-runtime-chromium.json'
SCREENSHOT = ROOT / 'reports/browser-runtime-chromium.png'

try:
    from playwright.async_api import async_playwright
except ImportError:
    async_playwright = None

def offline_module_uri(module_path, cache=None):
    """Package unmodified source modules into importable data URLs for browser sandboxes.

    Rewrites ONLY import specifiers from relative ES modules, never C/JS source
    semantics. No network, localhost, CDN, or dependency manager is involved.
    """
    if cache is None: cache = {}
    module_path = module_path.resolve()
    if module_path in cache: return cache[module_path]
    pattern = re.compile(r"(from\s+)(['\"])(\.[^'\"]+)(['\"])")
    source = module_path.read_text()
    def link(match):
        target = (module_path.parent / match.group(3)).resolve()
        target.relative_to(ROOT)
        if not target.is_file(): raise FileNotFoundError(target)
        uri = offline_module_uri(target, cache)
        return match.group(1) + match.group(2) + uri + match.group(4)
    source = pattern.sub(link, source)
    uri = 'data:text/javascript;base64,' + base64.b64encode(source.encode()).decode('ascii')
    cache[module_path] = uri
    return uri

def save(report):
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2, sort_keys=True) + '\n')

async def main():
    report = {'format': 'eduke32-real-browser-runtime-test/1',
              'timestamp_utc': datetime.now(timezone.utc).isoformat(),
              'original_game_playable_verified': False,
              'test_scope': 'real browser SDL native window, input and framebuffer bridge ONLY',
              'tests': {}, 'browser_errors': []}
    chromium = os.environ.get('EDUKE_CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('google-chrome')
    if async_playwright is None or not chromium:
        report['status'] = 'UNAVAILABLE'; report['reason'] = 'Playwright or Chromium not installed'
        save(report); print(json.dumps(report, indent=2)); raise SystemExit(2)
    module_uri = offline_module_uri(ROOT / 'runtime/index.mjs')
    current_miniz = sorted((ROOT / 'factory-output/source-first/automatic').rglob('miniz_tinfl.c.mjs'))
    miniz_path = (current_miniz[0] if len(current_miniz) == 1
                  else ROOT / 'reports/continued-boot-recovery/source/build/src/miniz_tinfl.c.mjs')
    if not miniz_path.is_file():
        raise RuntimeError('Original source-generated miniz module missing: '+str(miniz_path))
    report['original_source_js_module'] = {'path':str(miniz_path.relative_to(ROOT)),
        'sha256':sha256(miniz_path.read_bytes()).hexdigest()}
    miniz_uri = offline_module_uri(miniz_path)
    originals = [bytes((n * 79 + n//3 * 37) & 255 for n in range(4608)),
                 bytes('Original EDuke32 source-derived JS browser check! '.encode() * 80)]
    compressed_tests = []
    for level, plain in zip((0, 9), originals):
        encoder = zlib.compressobj(level=level, wbits=-15)
        compressed_tests.append({'compressed': list(encoder.compress(plain)+encoder.flush()),
                                 'expected': list(plain)})
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=chromium,
            headless=True, args=['--no-sandbox', '--use-angle=swiftshader',
                                 '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'])
        try:
            page = await browser.new_page(viewport={'width': 640, 'height': 480})
            page.on('pageerror', lambda err: report['browser_errors'].append(str(err)))
            await page.set_content('<!doctype html><html><body></body></html>')
            await page.evaluate('''async (uri) => {
                const { NativeRuntime } = await import(uri);
                document.body.replaceChildren();
                const canvas = document.createElement('canvas');
                canvas.id='original-framebuffer';
                canvas.style.cssText='width:300px;height:200px;image-rendering:pixelated';
                document.body.appendChild(canvas);
                const runtime=new NativeRuntime({canvas, renderer:'canvas2d'});
                const api=runtime.linker.require(['SDL_Init','SDL_CreateWindow',
                    'SDL_GetWindowSurface','SDL_UpdateWindowSurface',
                    'SDL_PollEvent','SDL_GetKeyboardState','SDL_Quit']);
                const heap=runtime.heap;
                if(api.SDL_Init(0x4020)!==0)throw Error('SDL video/events init failed: '+heap.readCString(runtime.sdl.symbols.SDL_GetError()));
                const win=api.SDL_CreateWindow(heap.writeCString('original framebuffer'), 0,0,3,2,4);
                if(!win)throw Error('SDL_CreateWindow failed');
                const surface=api.SDL_GetWindowSurface(win);
                if(!surface)throw Error('SDL_GetWindowSurface failed');
                const ptr=Number(heap.read(surface+32,'u64'));
                const pitch=heap.read(surface+24,'i32');
                // Each pixel originates from C ABI memory. No game image is synthesized.
                const rows=[[255,0,0,255,0,255,0,255,0,0,255,255],
                            [255,255,0,255,0,255,255,255,255,0,255,255]];
                for(let row=0;row<2;row++) heap.u8.set(rows[row],ptr+row*pitch);
                if(api.SDL_UpdateWindowSurface(win)!==0)throw Error('SDL_UpdateWindowSurface failed');
                globalThis.__edukeTest={api,heap,runtime,canvas,pitch,
                    initialPixels:Array.from(canvas.getContext('2d').getImageData(0,0,3,2).data)};
            }''', module_uri)
            expected=[255,0,0,255,0,255,0,255,0,0,255,255,
                      255,255,0,255,0,255,255,255,255,0,255,255]
            pixel=await page.evaluate('globalThis.__edukeTest.initialPixels')
            assert pixel==expected, ('SDL original RGBA framebuffer differs in actual Chromium', pixel)
            report['tests']['sdl2_native_canvas_rgba_pixels'] = 'passed'
            indexed=await page.evaluate('''() => {
                const {runtime,canvas}=globalThis.__edukeTest;
                const palette=new Uint8Array(1024);
                const colors=[[0,0,0,255],[60,120,240,255],[240,120,60,255],[20,220,100,255]];
                colors.forEach((color,i)=>palette.set(color,i*4));
                runtime.renderer.drawIndexed(Uint8Array.from([1,2,99,3,1,99]),2,2,3,palette);
                return Array.from(canvas.getContext('2d').getImageData(0,0,2,2).data);
            }''')
            assert indexed==[60,120,240,255,240,120,60,255,20,220,100,255,60,120,240,255],indexed
            report['tests']['canvas2d_indexed_palette_and_padded_rows'] = 'passed'
            await page.keyboard.down('w')
            down=await page.evaluate('''() => {
                const {api,heap}=globalThis.__edukeTest;
                const p=heap.malloc(56);let found=null;
                while(api.SDL_PollEvent(p)){
                    const type=heap.read(p,'u32');
                    if(type===0x300)found={type,scan:heap.read(p+16,'i32'),state:heap.read(p+12,'u8')};
                }
                return {found,keyboardState:heap.u8[api.SDL_GetKeyboardState(0)+26]};
            }''')
            assert down['found']=={'type':768,'scan':26,'state':1} and down['keyboardState']==1, down
            report['tests']['real_keyboard_keydown_event_scancode'] = 'passed'
            await page.keyboard.up('w')
            up=await page.evaluate('''() => {
                const {api,heap}=globalThis.__edukeTest;
                const p=heap.malloc(56);let type=0;
                while(api.SDL_PollEvent(p))if(heap.read(p,'u32')===0x301)type=0x301;
                return {type,keyboardState:heap.u8[api.SDL_GetKeyboardState(0)+26]};
            }''')
            assert up=={'type':769,'keyboardState':0}, up
            report['tests']['real_keyboard_keyup_event_scancode'] = 'passed'
            await page.locator('#original-framebuffer').click(position={'x':80,'y':60})
            mouse=await page.evaluate('''() => {
                const {api,heap}=globalThis.__edukeTest;
                const p=heap.malloc(56),types=[];
                while(api.SDL_PollEvent(p))types.push(heap.read(p,'u32'));
                return types;
            }''')
            assert 0x401 in mouse and 0x402 in mouse, mouse
            report['tests']['real_mouse_button_events'] = 'passed'
            decompressed = await page.evaluate('''async ({uri,cases}) => {
                const {tinfl_decompress} = await import(uri);
                const ref=obj=>({__cReference:true,get value(){return obj.value;},set value(v){obj.value=v;}});
                const makeState=()=>({
                    m_state:0,m_num_bits:0,m_zhdr0:0,m_zhdr1:0,m_z_adler32:0,m_final:0,
                    m_type:0,m_check_adler32:0,m_dist:0,m_counter:0,m_num_extra:0,
                    m_table_sizes:new Uint32Array(3),m_bit_buf:0n,m_dist_from_out_buf_start:0n,
                    m_look_up:Array.from({length:3},()=>new Int16Array(1024)),
                    m_tree_0:new Int16Array(576),m_tree_1:new Int16Array(64),m_tree_2:new Int16Array(38),
                    m_code_size_0:new Uint8Array(288),m_code_size_1:new Uint8Array(32),m_code_size_2:new Uint8Array(19),
                    m_raw_header:new Uint8Array(4),m_len_codes:new Uint8Array(457)
                });
                return cases.map(item=>{
                    const input=Uint8Array.from(item.compressed);
                    const result=new Uint8Array(item.expected.length+256);
                    const inLength={value:input.length},outLength={value:result.length};
                    const status=tinfl_decompress(ref({value:makeState()}),input,ref(inLength),result,result,ref(outLength),4);
                    const ok=status===0 && Number(outLength.value)===item.expected.length &&
                        Number(inLength.value)===input.length &&
                        result.subarray(0,item.expected.length).every((x,i)=>x===item.expected[i]);
                    return {status,produced:Number(outLength.value),consumed:Number(inLength.value),ok};
                });
            }''', {'uri':miniz_uri,'cases':compressed_tests})
            assert len(decompressed)==len(compressed_tests) and all(result['ok'] for result in decompressed),decompressed
            report['tests']['original_source_generated_decompressor_in_chromium'] = 'passed'
            await page.locator('#original-framebuffer').screenshot(path=str(SCREENSHOT))
            report['screenshot']={'path':str(SCREENSHOT.relative_to(ROOT)),
                                  'sha256':sha256(SCREENSHOT.read_bytes()).hexdigest()}
            await page.evaluate('globalThis.__edukeTest.runtime.close()')
            if report['browser_errors']:
                raise AssertionError('Browser console exceptions: '+str(report['browser_errors']))
            report['status'] = 'PASSED_RUNTIME_ONLY'
            report['tests']['no_browser_exceptions'] = 'passed'
        except Exception as error:
            report['status']='FAILED'; report['reason']=str(error)
            raise
        finally:
            await browser.close()
            save(report)
    print(json.dumps(report, indent=2)); print('NOTE: original game app_main/level/gameplay NOT verified')

if __name__=='__main__':
    asyncio.run(main())
