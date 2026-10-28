/** Browser presentation backends. The WebGL2 path transports pixels from
 * original compiled source rendering; it does not substitute scene logic.
 */
export class Canvas2DRenderer {
  constructor(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas2D not available');
    this.canvas = canvas; this.ctx = ctx; this.backend = 'canvas2d';
    this.image = null;
  }
  resize(width, height) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1)
      throw RangeError('Invalid framebuffer dimensions');
    this.canvas.width = width; this.canvas.height = height; this.image = null;
  }
  clear(r = 0, g = 0, b = 0) {
    this.ctx.fillStyle = `rgb(${r},${g},${b})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  checkFrame(bytes, width, height, pitch, channels) {
    if (!(bytes instanceof Uint8Array || bytes instanceof Uint8ClampedArray))
      throw TypeError('Framebuffer requires original byte storage');
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 ||
        width > 16384 || height > 16384 || !Number.isSafeInteger(pitch) || pitch < width * channels ||
        bytes.byteLength < (height - 1) * pitch + width * channels)
      throw RangeError('Framebuffer exceeds source byte storage');
  }
  imageFor(width, height) {
    // A persistent browser ImageData buffer avoids allocation every original
    // engine frame, particularly when presenting 320x200 software pixels.
    if (!this.image || this.image.width !== width || this.image.height !== height)
      this.image = this.ctx.createImageData(width, height);
    return this.image;
  }
  /** Direct presentation of original RGBA bytes, respecting C framebuffer row pitch. */
  drawRGBA(bytes, width, height, pitch = width * 4) {
    this.checkFrame(bytes, width, height, pitch, 4);
    const image = this.imageFor(width, height), dst = image.data;
    for (let y = 0; y < height; y++)
      dst.set(bytes.subarray(y * pitch, y * pitch + width * 4), y * width * 4);
    this.ctx.putImageData(image, 0, 0);
  }
  /** Present original 8-bit palette-indexed pixels, reusing the same output buffer. */
  drawIndexed(indices, width, height, pitch, palette) {
    this.checkFrame(indices, width, height, pitch, 1);
    if (!(palette instanceof Uint8Array || palette instanceof Uint8ClampedArray) || palette.length !== 1024)
      throw TypeError('Indexed framebuffer requires a 256-entry RGBA palette');
    const image = this.imageFor(width, height), rgba = image.data;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const k = indices[y * pitch + x] * 4, o = (y * width + x) * 4;
      rgba[o] = palette[k]; rgba[o + 1] = palette[k + 1];
      rgba[o + 2] = palette[k + 2]; rgba[o + 3] = palette[k + 3];
    }
    this.ctx.putImageData(image, 0, 0);
  }
  destroy() { this.image = null; }
}
/** Presentation-only bridge for the ORIGINAL software renderer's output.
 * Byte rows, palette and pitches belong to the compiled EDuke32 framebuffer;
 * none of the engine's scene/rasterization rules are reimplemented here.
 * RGBA and 8-bit indexed source pixels both upload without a per-pixel JS loop.
 */
export class WebGL2Renderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.canvas=canvas; this.gl=gl; this.backend='webgl2'; this.lost=false;
    this.program=null;this.vao=null;this.frameTexture=null;this.paletteTexture=null;
    this.frameShape=null;this.paletteShape=null;
    this.staging=new Uint8Array(0);
    this.onLost=event=>{event.preventDefault();this.lost=true;this.resetResources(false);};
    this.onRestored=()=>{this.lost=false;this.resetResources(false);};
    canvas.addEventListener('webglcontextlost',this.onLost);
    canvas.addEventListener('webglcontextrestored',this.onRestored);
  }
  resize(w,h){
    if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1)throw RangeError('Invalid framebuffer dimensions');
    this.canvas.width=w;this.canvas.height=h;
    if(!this.lost)this.gl.viewport(0,0,w,h);
  }
  clear(r=0,g=0,b=0){
    if(this.lost)return;
    this.gl.clearColor(r/255,g/255,b/255,1);this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
  compileShader(type,source){
    const gl=this.gl,shader=gl.createShader(type);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
      const log=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error('GLSL: '+log);
    }
    return shader;
  }
  createProgram(vertex,fragment){
    const gl=this.gl,program=gl.createProgram();
    const vs=this.compileShader(gl.VERTEX_SHADER,vertex),fs=this.compileShader(gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
      const log=gl.getProgramInfoLog(program);gl.deleteProgram(program);throw Error('GLSL link: '+log);
    }
    return program;
  }
  ensureResources(){
    if(this.lost)throw Error('WebGL context lost');
    if(this.program)return;
    const gl=this.gl;
    this.program=this.createProgram(`#version 300 es
      void main(){vec2 pos=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
        gl_Position=vec4(pos*2.0-1.0,0.0,1.0);}`,`#version 300 es
      precision highp float;precision highp int;
      uniform sampler2D uFrame;uniform sampler2D uPalette;
      uniform int uIndexed;uniform ivec2 uSize;out vec4 result;
      void main(){ivec2 pixel=ivec2(gl_FragCoord.xy);
        // Browser framebuffer origin is bottom-left, source rows top-down.
        pixel.y=uSize.y-1-pixel.y;
        vec4 raw=texelFetch(uFrame,pixel,0);
        int index=int(round(raw.r*255.0));
        result=uIndexed==1?texelFetch(uPalette,ivec2(index,0),0):raw;
      }`);
    this.vao=gl.createVertexArray();
    this.frameTexture=gl.createTexture();this.paletteTexture=gl.createTexture();
    for(const tex of [this.frameTexture,this.paletteTexture]){
      gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    }
    gl.useProgram(this.program);
    gl.uniform1i(gl.getUniformLocation(this.program,'uFrame'),0);
    gl.uniform1i(gl.getUniformLocation(this.program,'uPalette'),1);
  }
  /** An optional non-tight pitch is copied by ROW (not pixel) into reusable storage. */
  packed(bytes,width,height,pitch,channels){
    if(!(bytes instanceof Uint8Array || bytes instanceof Uint8ClampedArray))throw TypeError('Framebuffer requires original byte storage');
    if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<=0||height<=0||
       width>16384||height>16384||!Number.isSafeInteger(pitch)||pitch<width*channels||
       bytes.byteLength<(height-1)*pitch+width*channels)throw RangeError('Framebuffer exceeds source byte storage');
    const row=width*channels;
    if(pitch===row)return bytes.subarray(0,row*height);
    const needed=row*height;
    if(this.staging.length<needed)this.staging=new Uint8Array(needed);
    for(let y=0;y<height;y++)this.staging.set(bytes.subarray(y*pitch,y*pitch+row),y*row);
    return this.staging.subarray(0,needed);
  }
  upload(texture,shape,width,height,internal,format,bytes){
    const gl=this.gl;
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    const key=`${width}/${height}/${internal}/${format}`;
    if(this[shape]!==key){
      gl.texImage2D(gl.TEXTURE_2D,0,internal,width,height,0,format,gl.UNSIGNED_BYTE,bytes);
      this[shape]=key;
    }else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,width,height,format,gl.UNSIGNED_BYTE,bytes);
  }
  /** Source bytes must be RGBA in memory. No fabricated game frames. */
  drawRGBA(bytes,width,height,pitch=width*4){
    const data=this.packed(bytes,width,height,pitch,4);
    this.present(data,width,height,false);
  }
  /** Source bytes are palette indices; palette must contain 256*4 RGBA bytes. */
  drawIndexed(indices,width,height,pitch,palette){
    const data=this.packed(indices,width,height,pitch,1);
    if(!(palette instanceof Uint8Array || palette instanceof Uint8ClampedArray)||palette.length!==1024)
      throw TypeError('Indexed framebuffer requires a 256-entry RGBA palette');
    this.present(data,width,height,true,palette);
  }
  present(data,width,height,indexed,palette=null){
    this.ensureResources();
    const gl=this.gl;
    gl.viewport(0,0,this.canvas.width,this.canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    this.upload(this.frameTexture,'frameShape',width,height,indexed?gl.R8:gl.RGBA8,indexed?gl.RED:gl.RGBA,data);
    if(indexed){
      gl.activeTexture(gl.TEXTURE1);
      this.upload(this.paletteTexture,'paletteShape',256,1,gl.RGBA8,gl.RGBA,palette);
    }
    gl.useProgram(this.program);
    gl.uniform1i(gl.getUniformLocation(this.program,'uIndexed'),indexed?1:0);
    gl.uniform2i(gl.getUniformLocation(this.program,'uSize'),width,height);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  resetResources(deleteExisting=true){
    const gl=this.gl;
    if(deleteExisting){
      if(this.program)gl.deleteProgram(this.program);
      if(this.vao)gl.deleteVertexArray(this.vao);
      if(this.frameTexture)gl.deleteTexture(this.frameTexture);
      if(this.paletteTexture)gl.deleteTexture(this.paletteTexture);
    }
    this.program=null;this.vao=null;this.frameTexture=null;this.paletteTexture=null;
    this.frameShape=null;this.paletteShape=null;
  }
  destroy(){
    this.resetResources(!this.lost);
    this.canvas.removeEventListener('webglcontextlost',this.onLost);
    this.canvas.removeEventListener('webglcontextrestored',this.onRestored);
  }
}
/** Explicit integration point for an actual THREE namespace provided by caller.
 * No external CDN, fake 3D library, or implicit global download.
 */
export class ThreeRenderer {
  constructor(canvas, THREE) {
    if (!THREE?.WebGLRenderer || !THREE?.Scene || !THREE?.PerspectiveCamera) throw new Error('Pass an installed Three.js package namespace');
    this.THREE = THREE; this.backend = 'threejs';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
  }
  resize(w, h) { this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
  clear(r = 0, g = 0, b = 0) { this.renderer.setClearColor((r << 16) | (g << 8) | b, 1); this.renderer.clear(); }
  render() { this.renderer.render(this.scene, this.camera); }
  destroy() { this.renderer.dispose(); }
}
export function createRenderer(canvas, { preferred = 'auto', THREE = null } = {}) {
  if (preferred === 'threejs') return new ThreeRenderer(canvas, THREE);
  if (preferred !== 'canvas2d') {
    try { return new WebGL2Renderer(canvas); } catch (e) { if (preferred === 'webgl2') throw e; }
  }
  return new Canvas2DRenderer(canvas);
}
