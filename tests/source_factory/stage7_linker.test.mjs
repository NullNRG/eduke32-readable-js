import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';
import {ABIHeap} from '../../runtime/abi.mjs';
import {VirtualFS} from '../../runtime/filesystem.mjs';
import {createStdlib} from '../../runtime/stdlib.mjs';
import {createSDLBrowser} from '../../runtime/sdl_browser.mjs';

test('POSIX VFS supports reads, writes, append, seek, stat and errno',()=>{
  const heap=new ABIHeap(),fs=new VirtualFS(),api=createStdlib({heap,fs}).symbols;
  fs.mountBytes('duke/test.bin',new Uint8Array([1,2,3,4]));
  const name=heap.writeCString('duke/test.bin'),r=heap.malloc(16),st=heap.malloc(144);
  const fd=api.open(name,0);assert.ok(fd>=3);
  assert.equal(api.read(fd,r,3),3n);assert.deepEqual([...heap.bytes(r,3)],[1,2,3]);
  assert.equal(api.lseek(fd,-2n,1),1n);
  assert.equal(api.read(fd,r,5),3n);assert.deepEqual([...heap.bytes(r,3)],[2,3,4]);
  assert.equal(api.fstat(fd,st),0);assert.equal(heap.read(st+48,'i64'),4n);
  assert.equal(api.close(fd),0);assert.equal(api.read(fd,r,1),-1);assert.equal(heap.read(api.__errno_location(),'i32'),9);
  const fname=heap.writeCString('new.txt'),written=heap.writeCString('ABCD');
  const wr=api.open(fname,64|1|512,0o644);assert.ok(wr);
  assert.equal(api.write(wr,written,4),4n);assert.equal(api.close(wr),0);
  const ap=api.open(fname,1024|1);assert.equal(api.write(ap,written+1,2),2n);
  assert.deepEqual([...fs.readFile('new.txt')],[65,66,67,68,66,67]);
  assert.equal(api.close(ap),0);
  assert.equal(api.stat(fname,st),0);assert.equal(heap.read(st+48,'i64'),6n);
  assert.equal(api.unlink(fname),0);assert.equal(fs.exists('new.txt'),false);
  assert.equal(api.unlink(name),-1);assert.equal(heap.read(api.__errno_location(),'i32'),30);
});

test('POSIX VFS directories, cwd, Linux dirent64 and parent resolution',()=>{
  const heap=new ABIHeap(),fs=new VirtualFS(),api=createStdlib({heap,fs}).symbols;
  fs.mountBytes('game/maps/e1.map',new Uint8Array([99]));
  const name=p=>heap.writeCString(p),p=api.opendir(name('game'));
  assert.ok(p);let names=[];for(let e;(e=api.readdir(p));)names.push(heap.readCString(e+19));
  assert.deepEqual(names,['.','..','maps']);assert.equal(api.closedir(p),0);
  assert.equal(api.chdir(name('game/maps')),0);
  const buf=heap.malloc(256);assert.equal(api.getcwd(buf,256),buf);assert.equal(heap.readCString(buf),'/game/maps');
  assert.equal(api.mkdir(name('../../save'),0o777),0);
  assert.equal(api.chdir(name('/save')),0);
  assert.equal(api.getcwd(buf,256),buf);assert.equal(heap.readCString(buf),'/save');
});

test('GNU C-locale pointer tables retain glibc classification and case transforms',()=>{
  const ctx=new LLVMContext();const s=ctx.libraries,h=ctx.heap;
  const b=Number(h.read(s.__ctype_b_loc(),'u64'));
  const up=Number(h.read(s.__ctype_toupper_loc(),'u64'));
  assert.equal(h.read(b+65*2,'u16'),0xd508); // A: upper alpha xdigit print graph alnum
  assert.equal(h.read(b+97*2,'u16'),0xd608); // a: lower alpha print graph alnum
  assert.equal(h.read(b+32*2,'u16'),0x6001); // space: print space blank
  assert.equal(h.read(up+97*4,'i32'),65);
  assert.equal(h.read(up+255*4,'i32'),255);
  assert.equal(h.read(up-4,'i32'),-1); // EOF
});

test('POSIX single-thread TLS is keyed to real ABI storage',()=>{
  const s=new LLVMContext().libraries;const ctx=new LLVMContext();const h=ctx.heap,a=ctx.libraries;
  const key=h.malloc(4);assert.equal(a.pthread_key_create(key,0),0);
  const n=h.read(key,'u32');assert.equal(a.pthread_getspecific(n),0);
  assert.equal(a.pthread_setspecific(n,0x1234),0);assert.equal(a.pthread_getspecific(n),0x1234);
  assert.equal(a.pthread_self(),1n);assert.equal(a.pthread_key_delete(n),0);
  assert.equal(a.pthread_setspecific(n,3),22);
});

test('SDL bridge polls live standard-mapped gamepads and tracks cursor resources',()=>{
  const h=new ABIHeap();let devices=[{index:3,id:'Test Standard Pad',connected:true,mapping:'standard',axes:[-1,0.5,0,1],buttons:Array.from({length:17},(_,i)=>({pressed:i===0||i===12,value:i===6?.25:i===7?.75:0}))}];
  const canvas={style:{cursor:'default'},width:640,height:480,addEventListener(){},removeEventListener(){}};
  const s=createSDLBrowser({heap:h,canvas,clock:()=>55,gamepads:()=>devices}).symbols;
  assert.equal(s.SDL_NumJoysticks(),1);
  assert.equal(s.SDL_IsGameController(0),1);
  const gp=s.SDL_GameControllerOpen(0),joy=s.SDL_JoystickOpen(0);assert.ok(gp&&joy);
  assert.equal(h.readCString(s.SDL_GameControllerName(gp)),'Test Standard Pad');
  assert.equal(s.SDL_GameControllerGetAxis(gp,0),-32768);
  assert.equal(s.SDL_GameControllerGetAxis(gp,4),8192);
  assert.equal(s.SDL_GameControllerGetAxis(gp,5),24575);
  assert.equal(s.SDL_GameControllerGetButton(gp,0),1);
  assert.equal(s.SDL_GameControllerGetButton(gp,11),1);
  assert.equal(s.SDL_GameControllerGetButton(gp,12),0);
  assert.equal(s.SDL_JoystickNumAxes(joy),4);assert.equal(s.SDL_JoystickNumButtons(joy),17);
  const cursor=s.SDL_CreateSystemCursor(1);s.SDL_SetCursor(cursor);
  assert.equal(canvas.style.cursor,'text');assert.equal(s.SDL_ShowCursor(0),1);
  assert.equal(canvas.style.cursor,'none');assert.equal(s.SDL_ShowCursor(-1),0);
  assert.equal(s.SDL_ShowCursor(1),0);assert.equal(canvas.style.cursor,'text');
  s.SDL_FreeCursor(cursor);assert.equal(canvas.style.cursor,'default');
  devices=[];assert.throws(()=>s.SDL_GameControllerGetAxis(gp,0),/Disconnected/);
  s.SDL_GameControllerClose(gp);s.SDL_JoystickClose(joy);
});

test('Compiler bridge invokes real functions for libc and SDL symbols',()=>{
  const ctx=new LLVMContext({canvas:{width:4,height:4,style:{}}});
  assert.equal(ctx.libraries.lldiv(-17n,5n).join(','),'-3,-2');
  const ver=ctx.heap.malloc(3);ctx.libraries.SDL_GetVersion(ver);
  assert.deepEqual([...ctx.heap.bytes(ver,3)],[2,0,5]);
  assert.equal(ctx.libraries['llvm.x86.sse.rsqrt.ss']([4,2,3,4])[0],0.5);
});

test('POSIX descriptor duplication shares position but not FD_CLOEXEC flag',()=>{
 const heap=new ABIHeap(),fs=new VirtualFS(),a=createStdlib({heap,fs}).symbols;
 fs.mountBytes('x',Uint8Array.of(10,20,30));const f=a.open(heap.writeCString('x'),0);
 const g=a.fcntl(f,0,10);assert.equal(g,10);
 assert.equal(a.fcntl(f,2,1),0);assert.equal(a.fcntl(f,1),1);assert.equal(a.fcntl(g,1),0);
 const buf=heap.malloc(8);
 assert.equal(a.read(f,buf,1),1n);assert.equal(heap.read(buf,'u8'),10);
 assert.equal(a.read(g,buf,1),1n);assert.equal(heap.read(buf,'u8'),20);
 assert.equal(a.close(f),0);assert.equal(a.read(g,buf,1),1n);assert.equal(heap.read(buf,'u8'),30);
 assert.equal(a.close(g),0);
});

test('Controller delta producer emits SDL2 ABI controller add, axis, button, removal',()=>{
 const heap=new ABIHeap(),canvas={width:10,height:10,style:{},addEventListener(){},removeEventListener(){}};
 let connected=[{index:5,connected:true,mapping:'standard',id:'Pad',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))}];
 const s=createSDLBrowser({heap,canvas,clock:()=>123,gamepads:()=>connected}).symbols;
 assert.equal(s.SDL_Init(0x4000|0x2000),0);
 const evt=heap.malloc(56);
 assert.equal(s.SDL_PollEvent(evt),1);assert.equal(heap.read(evt,'u32'),0x653);
 connected[0].axes[0]=0.25;connected[0].buttons[0].pressed=true;
 assert.equal(s.SDL_PollEvent(evt),1);assert.equal(heap.read(evt,'u32'),0x650);
 assert.equal(heap.read(evt+12,'u8'),0);assert.equal(heap.read(evt+16,'i16'),8192);
 assert.equal(s.SDL_PollEvent(evt),1);assert.equal(heap.read(evt,'u32'),0x651);
 assert.equal(heap.read(evt+12,'u8'),0);
 connected=[];assert.equal(s.SDL_PollEvent(evt),1);assert.equal(heap.read(evt,'u32'),0x654);
 assert.equal(s.SDL_PollEvent(evt),0);
});

test('Actual timezone and chrono ABI operations include gmtoff, tm_zone and nanoseconds',()=>{
 const ctx=new LLVMContext({clock:()=>123.456,stdio:{stdout:()=>{}}}),h=ctx.heap,s=ctx.libraries;
 const t=h.malloc(8);h.write(t,'i64',0n);const out=h.malloc(56);
 assert.equal(s.localtime_r(t,out),out);
 assert.ok(h.read(out+4*5,'i32')>=69);
 assert.ok(h.read(out+40,'i64')%60n===0n);
 assert.ok(h.readCString(Number(h.read(out+48,'u64'))).length>0);
 assert.equal(s['_ZNSt6chrono3_V212steady_clock3nowEv'](),123456000n);
 const err=s.strerror(2);assert.match(h.readCString(err),/No such file/);
});

test('Process exit runs mixed C and C++ registered destructors in reverse order',()=>{
 const c=new LLVMContext(),events=[],a=c.libraries;
 c.register('cleanupA',()=>events.push('a'));
 c.register('cleanupB',()=>events.push('b'));
 const idA=c.functionAddresses.get('cleanupA'),idB=c.functionAddresses.get('cleanupB');
 assert.equal(a.atexit(idA),0);assert.equal(a.__cxa_atexit(idB,0,c.ptr('__dso_handle')),0);
 assert.throws(()=>a.exit(7),e=>e.name==='CProcessExit'&&e.exitStatus===7);
 assert.deepEqual(events,['b','a']);
});
