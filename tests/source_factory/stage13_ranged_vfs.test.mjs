import test from 'node:test';
import assert from 'node:assert/strict';
import {ABIHeap} from '../../runtime/abi.mjs';
import {VirtualFS} from '../../runtime/filesystem.mjs';
import {createStdlib} from '../../runtime/stdlib.mjs';
import {createSDLBrowser} from '../../runtime/sdl_browser.mjs';

test('POSIX large resource reads and seeks never clone complete GRP archive',()=>{
  const heap=new ABIHeap(),fs=new VirtualFS();
  const resource=new Uint8Array(20*1024*1024);
  resource[0]=123;resource[resource.length-1]=231;
  fs.mountBytes('big.grp',resource);
  // Intentionally trap the old expensive whole-file copying path.
  fs.readFile=()=>{throw Error('Unexpected full archive clone');};
  const s=createStdlib({heap,fs}).symbols;
  const fd=s.open(heap.writeCString('big.grp'),0,0);
  assert.ok(fd>=3);
  const buf=heap.malloc(4);
  assert.equal(s.read(fd,buf,1),1n);
  assert.equal(heap.read(buf,'u8'),123);
  assert.equal(s.lseek(fd,-1n,2),BigInt(resource.length-1));
  assert.equal(s.read(fd,buf,3),1n);
  assert.equal(heap.read(buf,'u8'),231);
  const stat=heap.malloc(144);assert.equal(s.fstat(fd,stat),0);
  assert.equal(heap.read(stat+48,'i64'),BigInt(resource.length));
  assert.equal(s.close(fd),0);
});

test('ranged filesystem reads preserve POSIX EOF and bounds',()=>{
 const fs=new VirtualFS();fs.mountBytes('data.bin',Uint8Array.from([1,2,3,4,5]));
 const out=new Uint8Array(6).fill(9);
 assert.equal(fs.size('data.bin'),5);
 assert.equal(fs.readInto('data.bin',3,out,1,4),2);
 assert.deepEqual([...out],[9,4,5,9,9,9]);
 assert.equal(fs.readInto('data.bin',500,out),0);
 assert.throws(()=>fs.readInto('data.bin',-1,out),RangeError);
 assert.throws(()=>fs.readInto('data.bin',0,out,5,2),RangeError);
 assert.deepEqual([...fs.readFile('data.bin')],[1,2,3,4,5]);
});

test('SDL_GetDisplayDPI uses measured host physical DPI, never fabricated CSS scaling',()=>{
 const h=new ABIHeap(),canvas={width:640,height:480,getContext:()=>null};
 let s=createSDLBrowser({heap:h,canvas}).symbols;
 assert.equal(s.SDL_Init(0x20),0);
 const a=h.malloc(4),b=h.malloc(4),c=h.malloc(4);
 assert.equal(s.SDL_GetDisplayDPI(0,a,b,c),-1);
 assert.match(h.readCString(s.SDL_GetError()),/not available/);
 s=createSDLBrowser({heap:h,canvas,physicalDPI:{diagonal:134,horizontal:121,vertical:147}}).symbols;
 assert.equal(s.SDL_Init(0x20),0);
 assert.equal(s.SDL_GetDisplayDPI(0,a,b,c),0);
 assert.deepEqual([h.read(a,'f32'),h.read(b,'f32'),h.read(c,'f32')],[134,121,147]);
 assert.equal(s.SDL_GetDisplayDPI(2,a,b,c),-1);
});

test('GRP extraction uses zero-copy subarray views of the mounted original archive',()=>{
 const name=new TextEncoder().encode('HELLO.TXT');
 const grp=new Uint8Array(16+16+4),label=new TextEncoder().encode('KenSilverman');grp.set(label);grp[12]=1;
 grp.set(name,16);new DataView(grp.buffer).setUint32(28,4,true);
 grp.set([10,20,30,40],32);
 const fs=new VirtualFS();fs.mountGRP(grp);
 assert.equal(fs.size('hello.txt'),4);
 assert.strictEqual(fs.files.get('hello.txt').buffer,grp.buffer);
 assert.deepEqual([...fs.readFile('HELLO.TXT')],[10,20,30,40]);
});
