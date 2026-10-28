import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';

test('GCC x86-64 std::locale classic ABI: constructors, copy, assignment, and facet slots',()=>{
 const c=new LLVMContext(),h=c.heap;
 const make=()=>h.calloc(1,8),a=make(),b=make(),d=make();
 c.call('_ZNSt6localeC1Ev',[a]);
 const impl=Number(h.read(a,'u64'));
 assert.equal(h.read(impl+16,'u64'),48n);
 const list=Number(h.read(impl+8,'u64'));
 const ctype=Number(h.read(list,'u64')),collate=Number(h.read(list+5*8,'u64'));
 assert.ok(ctype>0&&collate>0);
 assert.equal(c.call('_ZNKSt6locale2id5_M_idEv',[c.ptr('_ZNSt5ctypeIcE2idE')]),0n);
 assert.equal(c.call('_ZNKSt6locale2id5_M_idEv',[c.ptr('_ZNSt7__cxx117collateIcE2idE')]),5n);
 assert.equal(h.read(impl,'i32'),2);
 c.call('_ZNSt6localeC1ERKS_',[b,a]);
 assert.equal(h.read(b,'u64'),BigInt(impl));assert.equal(h.read(impl,'i32'),3);
 c.call('_ZNSt6localeC1Ev',[d]);
 assert.equal(c.call('_ZNSt6localeaSERKS_',[d,b]),d);assert.equal(h.read(impl,'i32'),4);
 c.call('_ZNKSt5ctypeIcE13_M_widen_initEv',[ctype]);
 assert.equal(h.read(ctype+56,'u8'),1);
 for(let i=0;i<256;i++)assert.equal(h.read(ctype+57+i,'u8'),i);
 c.call('_ZNSt6localeD1Ev',[a]);c.call('_ZNSt6localeD1Ev',[b]);c.call('_ZNSt6localeD1Ev',[d]);
 assert.equal(h.read(impl,'i32'),1);
 assert.throws(()=>c.call('_ZNSt6localeD1Ev',[a]),/Uninitialized/);
 assert.throws(()=>c.call('_ZNKSt6locale2id5_M_idEv',[c.ptr('stdout')]),/facet id/);
});

test('glibc passwd lookup is consistent with the browser virtual uid',()=>{
 const c=new LLVMContext(),h=c.heap,uid=c.call('getuid',[]);
 const p=c.call('getpwuid',[uid]);assert.ok(p);
 assert.equal(h.read(p+16,'u32'),uid);assert.equal(h.read(p+20,'u32'),uid);
 assert.equal(h.readCString(Number(h.read(p+32,'u64'))),'/home/guest');
 assert.equal(c.call('getpwuid',[uid+1]),0);
});

test('fprintf, fwrite, fseek, fread and fclose share one real virtual FILE* stream',async()=>{
 const {createStdlib}=await import('../../runtime/stdlib.mjs');
 const {VirtualFS}=await import('../../runtime/filesystem.mjs');
 const h=new (await import('../../runtime/abi.mjs')).ABIHeap();
 const fs=new VirtualFS(),streams=new Map();const lib=createStdlib({heap:h,fs,streams}).symbols;
 const filename=h.writeCString('engine.log'),mode=h.writeCString('w+');
 const handle=lib.fopen(filename,mode),fmt=h.writeCString('Duke %d %s\n');
 assert.equal(lib.fprintf(handle,fmt,32,h.writeCString('startup')),16);
 assert.equal(lib.ftell(handle),16);assert.equal(lib.fseek(handle,0,0),0);
 const dst=h.malloc(32);assert.equal(lib.fread(dst,1,16,handle),16);
 assert.equal(new TextDecoder().decode(h.bytes(dst,16)),'Duke 32 startup\n');
 assert.equal(lib.fclose(handle),0);assert.equal(streams.has(handle),false);
 assert.deepEqual(fs.readFile('engine.log'),h.bytes(dst,16));
});

test('perror reports errno on real stderr and setvbuf refuses unsupported buffering',async()=>{
 const {createStdlib}=await import('../../runtime/stdlib.mjs');
 const h=new (await import('../../runtime/abi.mjs')).ABIHeap();
 const lines=[];const streams=new Map([['stderr',b=>lines.push(new TextDecoder().decode(b))],[9,()=>{}]]);
 const api=createStdlib({heap:h,streams}).symbols;
 h.write(api.__errno_location(),'i32',2);api.perror(h.writeCString('open'));
 assert.deepEqual(lines,['open: No such file or directory\n']);
 assert.equal(api.setvbuf(9,0,2,0),0);
 assert.equal(api.setvbuf(9,0,0,4096),-1);
 assert.equal(h.read(api.__errno_location(),'i32'),22);
});
