import test from 'node:test';
import assert from 'node:assert/strict';
import {ABIHeap} from '../../runtime/abi.mjs';
import {createStdlib} from '../../runtime/stdlib.mjs';
import {createSDLBrowser} from '../../runtime/sdl_browser.mjs';
import {LLVMContext} from '../../runtime/llvm_context.mjs';

test('C floating conversions preserve parsed end pointer, exponent, NaN and error status',()=>{
 const heap=new ABIHeap(),s=createStdlib({heap}).symbols, end=heap.malloc(8);
 for(const [input,result,used] of [['  -12.5e2xyz',-1250,9],['0x1.8p+2 rest',6,8],['42',42,2],['abc',0,0],['-Infinity!',-Infinity,9]]){
   const p=heap.writeCString(input);const actual=s.strtod(p,end);
   assert.equal(actual,result);assert.equal(Number(heap.read(end,'u64'))-p,used);
 }
 assert.ok(Number.isNaN(s.strtod(heap.writeCString('nan(foo)'),end)));
});

test('IPv4 and IPv6 inet_pton / inet_ntop share the actual native network byte layout',()=>{
 const heap=new ABIHeap(),s=createStdlib({heap}).symbols;
 const input=heap.writeCString('192.168.1.4'),output=heap.malloc(16),outText=heap.malloc(64);
 assert.equal(s.inet_pton(2,input,output),1);
 assert.deepEqual([...heap.bytes(output,4)],[192,168,1,4]);
 assert.equal(s.inet_ntop(2,output,outText,64),outText);
 assert.equal(heap.readCString(outText),'192.168.1.4');
 assert.equal(s.inet_pton(10,heap.writeCString('2001:db8::1'),output),1);
 assert.equal(s.inet_ntop(10,output,outText,64),outText);
 assert.equal(heap.readCString(outText),'2001:db8:0:0:0:0:0:1');
 assert.equal(s.inet_pton(2,heap.writeCString('500.1.2.3'),output),0);
});

test('SDL canvas window surfaces expose correct x86_64 SDL pixel ABI and update actual pixels',()=>{
 const heap=new ABIHeap();let rendered=null;
 const surface2d={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:frame=>{rendered=[...frame.data];}};
 const canvas={width:4,height:4,style:{},setAttribute(){},getContext:name=>name==='2d'?surface2d:null};
 const s=createSDLBrowser({heap,canvas,clock:()=>50}).symbols;
 assert.equal(s.SDL_Init(0x20),0);
 const window=s.SDL_CreateWindow(heap.writeCString('test'),0,0,2,2,0);
 assert.ok(window);const surf=s.SDL_GetWindowSurface(window);assert.ok(surf);
 const format=Number(heap.read(surf+8,'u64'));
 assert.equal(heap.read(format+16,'u8'),32);assert.equal(heap.read(format+17,'u8'),4);
 assert.equal(heap.read(format+20,'u32'),0xff);assert.equal(heap.read(format+32,'u32'),0xff000000);
 const pix=Number(heap.read(surf+32,'u64'));
 heap.u8.set([255,0,0,255],pix);
 assert.equal(s.SDL_LockSurface(surf),0);s.SDL_UnlockSurface(surf);
 assert.equal(s.SDL_UpdateWindowSurface(window),0);
 assert.deepEqual(rendered.slice(0,4),[255,0,0,255]);
 s.SDL_FreeSurface(surf);s.SDL_DestroyWindow(window);
});

test('C++ fatal helpers really fail with type-specific errors and never return fake success',()=>{
 const ctx=new LLVMContext(),p=ctx.heap.writeCString('test overflow');
 assert.throws(()=>ctx.libraries._ZSt20__throw_length_errorPKc(p),{name:'std::length_error',message:'test overflow'});
 assert.throws(()=>ctx.libraries._ZSt17__throw_bad_allocv(),{name:'std::bad_alloc'});
});

test('C23 scanf handles signed, hex, binary auto-base, string, suppression and %n',()=>{
 const heap=new ABIHeap(),s=createStdlib({heap}).symbols;
 const input=heap.writeCString(' -12 0xff 0b101 alpha!'),format=heap.writeCString('%d %x %i %5s%n');
 const values=[heap.malloc(8),heap.malloc(8),heap.malloc(8),heap.malloc(16),heap.malloc(4)];
 assert.equal(s.__isoc23_sscanf(input,format,...values),4);
 assert.equal(heap.read(values[0],'i32'),-12);
 assert.equal(heap.read(values[1],'u32'),255);
 assert.equal(heap.read(values[2],'u32'),5);
 assert.equal(heap.readCString(values[3]),'alpha');
 assert.equal(heap.read(values[4],'i32'),21);
});

test('GNU libstdc++ hash rehash policy matches actual prime table and load factor state',()=>{
 const heap=new ABIHeap(),s=createStdlib({heap}).symbols,obj=heap.malloc(16);
 heap.write(obj,'f32',1);heap.write(obj+8,'u64',0n);
 const next=s._ZNKSt8__detail20_Prime_rehash_policy11_M_next_bktEm;
 const need=s._ZNKSt8__detail20_Prime_rehash_policy14_M_need_rehashEmmm;
 assert.equal(next(obj,0n),1n);assert.equal(heap.read(obj+8,'u64'),0n);
 assert.equal(next(obj,1n),2n);assert.equal(heap.read(obj+8,'u64'),2n);
 assert.equal(next(obj,10n),11n);assert.equal(heap.read(obj+8,'u64'),11n);
 assert.deepEqual(need(obj,11n,5n,2n),[0,0n]);
 heap.write(obj+8,'u64',0n);assert.deepEqual(need(obj,0n,0n,1n),[1,13n]);
 assert.equal(heap.read(obj+8,'u64'),13n);
});

test('Static dlopen/dlsym resolves the true compiled function address and rejects non-existent libraries',()=>{
 const ctx=new LLVMContext(),h=ctx.heap,a=ctx.libraries;
 ctx.register('read_original_score',()=>17);
 const self=a.dlopen(0,2);assert.ok(self);
 const ptr=a.dlsym(self,h.writeCString('read_original_score'));
 assert.ok(ptr);assert.equal(ctx.callIndirect(ptr,[]),17);
 assert.equal(a.dlerror(),0);
 assert.equal(a.dlopen(h.writeCString('libnotthere.so'),2),0);
 const e=a.dlerror();assert.match(h.readCString(e),/external ELF shared libraries unavailable/);
 assert.equal(a.dlerror(),0);
 const info=h.malloc(32);assert.equal(a.dladdr(ptr,info),1);
 assert.equal(h.readCString(Number(h.read(info+16,'u64'))),'read_original_score');
 assert.equal(a.dlclose(self),0);
});

test('Anonymous mmap and munmap use the same real C heap, while unsupported mappings fail',()=>{
 const ctx=new LLVMContext(),h=ctx.heap,s=ctx.libraries;
 assert.equal(s.mmap(1,4096,3,0x22,-1,0n),-1);
 const ptr=s.mmap(0,4096,3,0x22,-1,0n);assert.ok(ptr>0);
 assert.equal(h.read(ptr,'i32'),0);
 h.write(ptr,'i32',0x12345678);assert.equal(h.read(ptr,'u32'),0x12345678);
 assert.equal(s.madvise(ptr,4096,0),0);
 assert.equal(s.munmap(ptr,4096),0);
 assert.equal(s.munmap(ptr,4096),-1);
});
