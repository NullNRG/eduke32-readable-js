import test from 'node:test';
import assert from 'node:assert/strict';
import {ABIHeap} from '../../runtime/abi.mjs';
import {VirtualFS} from '../../runtime/filesystem.mjs';
import {createPosixMemory} from '../../runtime/posix_memory.mjs';
import {createPosixVFS} from '../../runtime/posix_vfs.mjs';

test('mmap allocates true page-aligned heap addresses and mprotect only claims supported R/W permissions',()=>{
  const heap=new ABIHeap(),errno=heap.malloc(4),errnoLocation=()=>errno;
  const v=createPosixMemory({heap,errnoLocation});
  const p=v.mmap(0,8192,3,0x22,-1,0n);
  assert.ok(p>0&&p%4096===0);
  heap.write(p,'i32',0x12345678);
  assert.equal(v.mprotect(p,4096,3),0);
  assert.equal(heap.read(p,'i32'),0x12345678);
  assert.equal(v.mprotect(p,4096,1),-1);
  assert.equal(heap.read(errno,'i32'),95);
  assert.equal(v.mprotect(p+1,4096,3),-1);
  assert.equal(heap.read(errno,'i32'),22);
  assert.equal(v.mprotect(p+8192,4096,3),-1);
  assert.equal(heap.read(errno,'i32'),12);
  assert.equal(v.munmap(p,8192),0);
  assert.equal(v.mprotect(p,4096,3),-1);
  assert.equal(heap.read(errno,'i32'),12);
  assert.equal(v.mmap(0,4096,0,0x22,-1,0n),-1);
  assert.equal(heap.read(errno,'i32'),95);
});

test('poll reflects actual immediate virtual-file readiness and POLLNVAL without pretending a socket exists',()=>{
  const heap=new ABIHeap(),fs=new VirtualFS(),errno=heap.malloc(4),errnoLocation=()=>errno;
  fs.writeFile('x.txt',Uint8Array.from([1,2,3]));
  const v=createPosixVFS({heap,fs,errnoLocation});
  const fd=v.open(heap.writeCString('x.txt'),0,0);
  assert.ok(fd>2);
  const addr=heap.malloc(24);
  const put=(i,descriptor,events)=>{heap.write(addr+i*8,'i32',descriptor);heap.write(addr+i*8+4,'u16',events);};
  put(0,fd,5);put(1,65500,5);put(2,-1,5);
  assert.equal(v.poll(addr,3,0),2);
  assert.equal(heap.read(addr+6,'u16'),1);
  assert.equal(heap.read(addr+14,'u16'),0x20);
  assert.equal(heap.read(addr+22,'u16'),0);
  put(0,fd,4);put(1,-1,0);put(2,-1,0);
  assert.equal(v.poll(addr,3,100),-1);
  assert.equal(heap.read(errno,'i32'),38);
  assert.equal(v.close(fd),0);
  assert.equal(v.poll(addr,1,0),1);
  assert.equal(heap.read(addr+6,'u16'),0x20);
});
