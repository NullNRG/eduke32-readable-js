import test from 'node:test';
import assert from 'node:assert/strict';
import { WebGL2Renderer } from '../../runtime/renderers.mjs';
import { NativeRuntime } from '../../runtime/index.mjs';

function fakeCanvas(){
  const calls=[],handlers=new Map();let next=1;
  const gl=new Proxy({
    RGBA8:0x8058,R8:0x8229,RED:0x1903,RGBA:0x1908,TRIANGLES:4,
    TEXTURE0:0x84c0,TEXTURE1:0x84c1,LINK_STATUS:0x8b82,COMPILE_STATUS:0x8b81,
    UNSIGNED_BYTE:0x1401,UNPACK_ALIGNMENT:0xcf5,TEXTURE_2D:0xde1,
    createShader:()=>++next,createProgram:()=>++next,createTexture:()=>++next,createVertexArray:()=>++next,
    getShaderParameter:()=>true,getProgramParameter:()=>true,
    getUniformLocation:(_p,name)=>name,
  },{get:(obj,key)=>key in obj?obj[key]:(...a)=>{calls.push([key,...a]);}});
  const canvas={width:2,height:2,style:{},addEventListener:(kind,fn)=>handlers.set(kind,fn),
    removeEventListener:kind=>handlers.delete(kind),getContext:kind=>kind==='webgl2'?gl:null};
  return {canvas,gl,calls,handlers};
}

test('original framebuffer GPU bridge uploads padded RGBA rows and does incremental updates',()=>{
  const {canvas,calls,handlers}=fakeCanvas();
  const renderer=new WebGL2Renderer(canvas);
  const frame=Uint8Array.from([255,0,0,255,0,255,0,255,99,99,99,99,
                              0,0,255,255,255,255,255,255,88,88,88,88]);
  renderer.drawRGBA(frame,2,2,12);
  const images=calls.filter(c=>c[0]==='texImage2D');
  assert.equal(images.length,1);
  assert.deepEqual([...images[0][9]], [...frame.slice(0,8),...frame.slice(12,20)]);
  renderer.drawRGBA(frame,2,2,12);
  assert.equal(calls.filter(c=>c[0]==='texImage2D').length,1);
  assert.equal(calls.filter(c=>c[0]==='texSubImage2D').length,1);
  assert.equal(calls.filter(c=>c[0]==='drawArrays').length,2);
  assert.throws(()=>renderer.drawRGBA(new Uint8Array(7),2,2), /exceeds source byte storage/);
  handlers.get('webglcontextlost')({preventDefault(){}});
  assert.throws(()=>renderer.drawRGBA(frame,2,2,12), /context lost/);
  handlers.get('webglcontextrestored')();
  renderer.drawRGBA(frame,2,2,12);
  assert.equal(calls.filter(c=>c[0]==='texImage2D').length,2);
  renderer.destroy();
});

test('original indexed buffer uploads R8 pixels and authentic 256-entry palette',()=>{
  const {canvas,calls}=fakeCanvas();const renderer=new WebGL2Renderer(canvas);
  const palette=new Uint8Array(1024);palette.fill(255);
  renderer.drawIndexed(Uint8Array.from([1,2,99,3,4,99]),2,2,3,palette);
  const images=calls.filter(c=>c[0]==='texImage2D');
  assert.equal(images.length,2);
  assert.equal(images[0][4],2);
  assert.equal(images[0][5],2);
  assert.deepEqual([...images[0][9]],[1,2,3,4]);
  assert.equal(images[1][4],256);
  assert.throws(()=>renderer.drawIndexed(new Uint8Array(4),2,2,2,new Uint8Array(512)),/256-entry/);
  renderer.destroy();
});

test('the canonical runtime resolves SDL2 to browser-native bindings without an SDL2 binary',()=>{
  const {canvas,calls}=fakeCanvas();
  const runtime=new NativeRuntime({canvas,renderer:'webgl2'});
  const api=runtime.linker.require(['SDL_Init','SDL_CreateWindow','SDL_GetWindowSurface','SDL_UpdateWindowSurface']);
  assert.equal(api.SDL_Init(0x20),0);
  const title=runtime.heap.writeCString('original engine');
  const win=api.SDL_CreateWindow(title,0,0,2,2,4);
  assert.ok(win>0);
  const surface=api.SDL_GetWindowSurface(win);
  assert.ok(surface>0);
  const pixels=Number(runtime.heap.read(surface+32,'u64'));
  runtime.heap.u8.set([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255],pixels);
  assert.equal(api.SDL_UpdateWindowSurface(win),0);
  assert.equal(calls.filter(c=>c[0]==='drawArrays').length,1);
  runtime.close();
});
