import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';
import {ABIHeap} from '../../runtime/abi.mjs';
import {createSDLBrowser} from '../../runtime/sdl_browser.mjs';
import {createStdlib} from '../../runtime/stdlib.mjs';

test('POSIX syslog reuses C formatter and emits to an actual configured sink',()=>{
  const heap=new ABIHeap(),output=[],streams=new Map([['stderr', b=>output.push(new TextDecoder().decode(b))]]);
  const s=createStdlib({heap,streams}).symbols;
  s.openlog(heap.writeCString('engine'),0,8);
  s.syslog(6,heap.writeCString('device %d %s'),21,heap.writeCString('ready'));
  assert.deepEqual(output,['engine: device 21 ready\n']);
  s.closelog();s.syslog(5,heap.writeCString('done'));
  assert.deepEqual(output,['engine: device 21 ready\n','done\n']);
  assert.throws(()=>s.syslog(5,heap.writeCString('%q'),1),/Unsupported C printf directive/);
});

test('backtrace_symbols_fd emits actual original compiled frame addresses',()=>{
  const c=new LLVMContext({stdio:{stderr:()=>{}}}),h=c.heap,output=[];
  // The compiler-produced runtime takes translated stack frames, not JS stack strings.
  const streams=new Map([[7,b=>output.push(new TextDecoder().decode(b))]]);
  const s=createStdlib({heap:h,streams,getCallFrames:()=>[{address:1000,name:'compiled_A'}]}).symbols;
  const buf=h.malloc(8);assert.equal(s.backtrace(buf,1),1);
  s.backtrace_symbols_fd(buf,1,7);
  assert.deepEqual(output,['compiled(compiled_A) [0x3e8]\n']);
  assert.throws(()=>s.backtrace_symbols_fd(buf,1,99),/writable host descriptor/);
});

test('SDL synchronous clipboard is isolated to this program and returns owned memory',()=>{
  const heap=new ABIHeap(),symbols=createSDLBrowser({heap}).symbols;
  assert.equal(symbols.SDL_HasClipboardText(),0);
  const p=symbols.SDL_GetClipboardText();assert.equal(heap.readCString(p),'');symbols.SDL_free(p);
  assert.equal(symbols.SDL_SetClipboardText(heap.writeCString('Copied \u03c0')),0);
  assert.equal(symbols.SDL_HasClipboardText(),1);
  const a=symbols.SDL_GetClipboardText(),b=symbols.SDL_GetClipboardText();
  assert.notEqual(a,b);assert.equal(heap.readCString(a),'Copied \u03c0');
  symbols.SDL_free(a);assert.equal(heap.readCString(b),'Copied \u03c0');symbols.SDL_free(b);
  assert.equal(symbols.SDL_SetClipboardText(0),-1);
});

test('fopen/fileno and raw POSIX read/write/lseek observe one shared file cursor',()=>{
  const heap=new ABIHeap(),s=createStdlib({heap}).symbols;
  const path=heap.writeCString('save.dat'),readWrite=heap.writeCString('w+');
  const f=s.fopen(path,readWrite);assert.ok(f);
  const fd=s.fileno(f);assert.ok(fd>=3);
  const data=heap.writeCString('ABC');assert.equal(s.write(fd,data,3),3n);
  assert.equal(s.ftell(f),3);
  assert.equal(s.fseek(f,0,0),0);
  const dest=heap.calloc(4,1);assert.equal(s.fread(dest,1,2,f),2);
  assert.equal(heap.readCString(dest),'AB');
  assert.equal(s.lseek(fd,0n,1),2n);
  assert.equal(s.fclose(f),0);
  assert.equal(s.fcntl(fd,3),-1);
});

test('fdopen attaches an existing descriptor, freopen preserves FILE* but replaces backing descriptor',()=>{
  const heap=new ABIHeap(),s=createStdlib({heap}).symbols;
  const name=heap.writeCString('first.log'),other=heap.writeCString('second.log'),mode=heap.writeCString('w+');
  const fd=s.open(name,2|64|512,0o666);assert.ok(fd>=3);
  const file=s.fdopen(fd,mode);assert.ok(file);assert.equal(s.fileno(file),fd);
  assert.equal(s.fputs(heap.writeCString('first'),file),1);
  const originalFile=file;
  assert.equal(s.freopen(other,mode,file),originalFile);
  assert.notEqual(s.fileno(file),fd);
  assert.equal(s.fputs(heap.writeCString('second'),file),1);
  assert.equal(s.fseek(file,0,0),0);
  const ptr=heap.calloc(32,1);assert.equal(s.fread(ptr,1,6,file),6);
  assert.equal(heap.readCString(ptr),'second');
  assert.equal(s.fclose(file),0);
});

test('SDL thread priority rejects unavailable host scheduling, fullscreen flags follow actual DOM',async()=>{
  const heap=new ABIHeap(),doc={fullscreenElement:null},canvas={ownerDocument:doc,width:1,height:1,requestFullscreen(){doc.fullscreenElement=canvas;return Promise.resolve();},getContext:()=>null};
  doc.exitFullscreen=()=>{doc.fullscreenElement=null;return Promise.resolve();};
  const s=createSDLBrowser({heap,canvas}).symbols;
  assert.equal(s.SDL_Init(0x20),0);
  const w=s.SDL_CreateWindow(heap.writeCString('a'),0,0,200,100,0);
  assert.ok(w);assert.equal(s.SDL_SetThreadPriority(0),0);
  assert.equal(s.SDL_SetThreadPriority(2),-1);
  assert.match(heap.readCString(s.SDL_GetError()),/native thread scheduling/);
  assert.equal(s.SDL_SetWindowFullscreen(w,0x1),-1);
  assert.equal(s.SDL_SetWindowFullscreen(w,0x1001),0);
  assert.equal(s.SDL_GetWindowFlags(w)&0x1001,0x1001);
  assert.equal(s.SDL_SetWindowFullscreen(w,0),0);
  assert.equal(s.SDL_GetWindowFlags(w)&0x1001,0);
});
