import test from 'node:test';
import assert from 'node:assert/strict';
import {NativeRuntime} from '../../runtime/index.mjs';
import {ABIHeap} from '../../runtime/abi.mjs';
import {createStdlib} from '../../runtime/stdlib.mjs';
const string=value=>new TextEncoder().encode(value+'\0');
const pointer=(bytes,offset=0)=>({__cPointer:true,array:false,buffer:bytes.buffer,
  lower:bytes.byteOffset,upper:bytes.byteOffset+bytes.byteLength,offset:bytes.byteOffset+offset});

test('original bounded C paths and byte outputs share POSIX and stdio storage',()=>{
  const rt=new NativeRuntime();
  try{
    const c=rt.library.symbols,heap=rt.heap;
    const normalized=new Uint8Array(64).fill(0x7a);normalized.set(string('a//b/../asset.bin'),4);
    assert.equal(c.Bcorrectfilename(pointer(normalized,4),0),0);
    assert.equal(new TextDecoder().decode(normalized.subarray(4,4+11)),'a/asset.bin');
    assert.equal(normalized[3],0x7a);
    const copied=new Uint8Array(16).fill(0x7a),copyTarget=pointer(copied,2);
    assert.equal(c.Bstrncpyz(copyTarget,pointer(string('abcdef')),4),copyTarget);
    assert.deepEqual([...copied.subarray(1,7)],[122,97,98,99,0,122]);
    rt.fs.mountBytes('asset.bin',new Uint8Array([3,11,29,47,83,127]));
    const path=pointer(string('asset.bin')),fd=c.open(path,0);
    assert.ok(fd>=3);
    const stat=new Uint8Array(160).fill(0xa7),output=new Uint8Array(12).fill(0xd3);
    assert.equal(c.fstat(fd,pointer(stat,8)),0);
    assert.equal(new DataView(stat.buffer).getBigInt64(56,true),6n);
    assert.ok(stat.subarray(0,8).every(x=>x===0xa7));
    assert.ok(stat.subarray(152).every(x=>x===0xa7));
    assert.equal(c.read(fd,pointer(output,3),4),4n);
    assert.deepEqual([...output],[211,211,211,3,11,29,47,211,211,211,211,211]);
    assert.throws(()=>c.read(fd,pointer(output,11),2),/bounds/);
    assert.equal(c.lseek(fd,0n,1),4n,'rejected read must not move file cursor');
    assert.equal(c.close(fd),0);
    const file=c.fopen(path,pointer(string('rb'))),handle=pointer(heap.borrow(file,8));
    assert.ok(file>0);assert.ok(c.fileno(handle)>=3);
    assert.equal(c.fread(pointer(output,2),2,2,handle),2);
    assert.deepEqual([...output.subarray(2,6)],[3,11,29,47]);
    assert.equal(c.ftell(handle),4);assert.equal(c.fseek(handle,0,0),0);
    assert.equal(c.fgetc(handle),3);assert.equal(c.ferror(handle),0);
    assert.equal(c.fclose(handle),0);
    const written=c.fopen(pointer(string('out.bin')),pointer(string('wb')));
    assert.equal(c.fwrite(pointer(output,2),2,2,pointer(heap.borrow(written,8))),2);
    assert.equal(c.fclose(written),0);
    assert.deepEqual([...rt.fs.readFile('out.bin')],[3,11,29,47]);
    const cwd=new Uint8Array(32).fill(0x7b),cwdPointer=pointer(cwd,2);
    assert.equal(c.getcwd(cwdPointer,20),cwdPointer);assert.equal(cwd[2],47);assert.equal(cwd[3],0);
    assert.equal(cwd[1],0x7b);assert.equal(cwd[22],0x7b);
    assert.throws(()=>c.fopen(pointer(new Uint8Array([65,66])),string('rb')),/NUL-terminated/);
  }finally{rt.close();}
});

test('captured stream output owns the bytes emitted by write and fwrite',()=>{
  const heap=new ABIHeap(),captured=[],streams=new Map([[1,bytes=>captured.push(bytes)]]);
  const c=createStdlib({heap,streams}).symbols;
  const bytes=new Uint8Array([65,66]),address=heap.writeCString('CD');
  assert.equal(c.write(1,pointer(bytes),2),2n);
  assert.equal(c.fwrite(address,1,2,1),2);
  bytes[0]=90;heap.u8[address]=91;
  assert.deepEqual(captured.map(value=>[...value]),[[65,66],[67,68]]);
});

test('binary search returns aliases of original byte storage and checks callback/extent errors',()=>{
 const rt=new NativeRuntime();try{
 const c=rt.library.symbols,raw=new Int32Array([-20,-4,3,9,25]);
 const compare=(key,value)=>key-new DataView(value.buffer,value.offset,4).getInt32(0,true);
 const found=c.bsearch(9,raw,5,4,compare);
 assert.equal(found.buffer,raw.buffer);assert.equal(found.offset,12);
 new DataView(found.buffer).setInt32(found.offset,10,true);assert.equal(raw[3],10);
 assert.equal(c.bsearch(-3,raw,5,4,compare),0);assert.equal(c.bsearch(null,null,0,4,null),0);
 assert.throws(()=>c.bsearch(1,raw,6,4,compare),/allocation/);
 assert.throws(()=>c.bsearch(1,raw,-1,4,compare),/extent/);
 assert.throws(()=>c.bsearch(1,raw,5,4,()=>NaN),/comparator/);
 const p=rt.heap.malloc(20);rt.heap.u8.set(new Uint8Array(raw.buffer),p);
 assert.equal(c.bsearch(10,p,5,4,(key,value)=>key-rt.heap.read(value,'i32')),p+12);
 }finally{rt.close();}
});
