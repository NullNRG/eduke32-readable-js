#!/usr/bin/env python3
"""Real Chromium WebGL2 checks for the original framebuffer presentation bridge.

Tests transport using known byte patterns; does NOT claim original Duke game frames.
"""
import asyncio
import pathlib
import os
import shutil
try:
    from playwright.async_api import async_playwright
except ImportError:
    async_playwright=None

ROOT=pathlib.Path(__file__).resolve().parents[2]

async def main():
    if async_playwright is None:
        print('SKIP Chromium framebuffer readback: playwright unavailable; Node contract tests are still required')
        return
    chromium=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('google-chrome')
    if not chromium:
        print('SKIP Chromium framebuffer readback: browser executable unavailable; Node contract tests are still required')
        return
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=chromium,headless=True,
            args=['--no-sandbox','--use-angle=swiftshader',
                  '--enable-unsafe-swiftshader','--disable-gpu-sandbox'])
        try:
            page=await browser.new_page()
            await page.set_content('<!doctype html><canvas width="2" height="2"></canvas>')
            # Network access is blocked in this test sandbox. Execute the exact
            # renderer source in page scope, stripping only ESM export keywords.
            renderer=(ROOT/'runtime/renderers.mjs').read_text().replace('export class ','class ').replace('export function ','function ')
            await page.evaluate('(source)=>{(0,eval)(source+";globalThis.WebGL2Renderer=WebGL2Renderer;globalThis.Canvas2DRenderer=Canvas2DRenderer;");}',renderer)
            result=await page.evaluate('''async()=>{
              const c=document.querySelector('canvas');
              const gpu=c.getContext('webgl2');
              if(!gpu){
                const {Canvas2DRenderer}=globalThis;
                const r=new Canvas2DRenderer(c);
                const frame=Uint8Array.from([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]);
                r.drawRGBA(frame,2,2);
                const output=Array.from(r.ctx.getImageData(0,0,2,2).data);
                r.destroy();return {skippedGPU:true,canvas2d:output};
              }
              const r=new WebGL2Renderer(c);
              const gl=r.gl;
              const read=()=>{const data=new Uint8Array(16);gl.readPixels(0,0,2,2,gl.RGBA,gl.UNSIGNED_BYTE,data);return Array.from(data);};
              // The source top row: red, green. Bottom row: blue, white.
              const rgba=Uint8Array.from([255,0,0,255,0,255,0,255,99,99,99,99,
                                          0,0,255,255,255,255,255,255,88,88,88,88]);
              r.drawRGBA(rgba,2,2,12);
              const direct=read();
              const p=new Uint8Array(1024);for(let i=0;i<256;i++)p[i*4+3]=255;
              p.set([255,0,0,255],4);p.set([0,255,0,255],8);
              p.set([0,0,255,255],12);p.set([255,255,255,255],16);
              r.drawIndexed(Uint8Array.from([1,2,99,3,4,99]),2,2,3,p);
              const indexed=read();
              r.destroy();
              return {direct,indexed};
            }''')
            expected=[0,0,255,255,255,255,255,255,255,0,0,255,0,255,0,255]
            if result.get('skippedGPU'):
                assert result['canvas2d']==[255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255],result
                print('PASS real Chromium Canvas2D fallback; SKIP WebGL2 GPU readback (context unavailable on host)')
            else:
                assert result['direct']==expected, ('RGBA framebuffer orientation/contents',result)
                assert result['indexed']==expected, ('Indexed framebuffer orientation/contents',result)
                print('PASS real Chromium WebGL2 original framebuffer bridge: RGBA + indexed/palette + pitch + vertical orientation')
        finally:
            await browser.close()

if __name__=='__main__':asyncio.run(main())
