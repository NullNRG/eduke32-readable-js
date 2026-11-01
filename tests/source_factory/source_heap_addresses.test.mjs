import test from 'node:test';
import assert from 'node:assert/strict';
import {ABIHeap} from '../../runtime/abi.mjs';
import {VirtualFS} from '../../runtime/filesystem.mjs';
import {createStdlib} from '../../runtime/stdlib.mjs';
import {bindSourceCHeap} from '../../runtime/source_memory.mjs';
import {sourceAddressSpace} from '../../tools/source_address_runtime.mjs';

test('LP64 allocator arguments preserve zeroing, failure and realloc ownership',()=>{
 const heap=new ABIHeap(1024,4096),library=createStdlib({heap,fs:new VirtualFS()}).symbols;
 const p=library.calloc(17n,8n);
 assert.deepEqual([...heap.u8.subarray(p,p+136)],Array(136).fill(0));
 heap.u8.fill(211,p,p+136);
 assert.equal(library.realloc(p,1n<<62n),0);
 assert.ok(heap.allocations.has(p));assert.equal(heap.u8[p+135],211);
 assert.equal(heap.read(library.__errno_location(),'i32'),12);
 assert.equal(library.calloc(1n<<63n,4n),0);
 const q=library.realloc(p,201n);assert.equal(heap.u8[q+135],211);
 library.free(q);
 assert.throws(()=>library.calloc(1.25,8n),TypeError);
 assert.throws(()=>library.malloc(-1n),RangeError);
});
test('free/realloc retain ownership of actual typed source pointer storage',()=>{
 const heap=new ABIHeap(),library=createStdlib({heap,fs:new VirtualFS()}).symbols;
 const address=library.malloc(24),pointer={__cPointer:true,buffer:heap.buffer,lower:address,upper:address+24,offset:address,array:false};
 heap.u8.set([9,7,5,3],address);
 const enlarged=library.realloc(pointer,96);
 assert.deepEqual([...heap.u8.subarray(enlarged,enlarged+4)],[9,7,5,3]);
 library.free(heap.u8.subarray(enlarged,enlarged+96));
 assert.ok(!heap.allocations.has(enlarged));
 assert.doesNotThrow(()=>library.free(null));assert.doesNotThrow(()=>library.free(0n));
 const live=library.malloc(24),view=heap.u8.subarray(live,live+24);
 assert.throws(()=>library.free(new Uint8Array(24)),TypeError);
 assert.throws(()=>library.free(heap.u8.subarray(live+1,live+24)));
 assert.ok(heap.allocations.has(live));library.free(view);
});
test('raw malloc address selects the actual neighbouring allocation',()=>{
 const heap=new ABIHeap();bindSourceCHeap(heap);
 const first=heap.malloc(16),second=heap.malloc(16);
 assert.equal(second,first+16);
 const pointer=sourceAddressSpace.decode(second);
 assert.equal(pointer.buffer,heap.buffer);assert.equal(pointer.offset,second);
 assert.equal(pointer.lower,second);assert.equal(pointer.upper,second+16);
 heap.free(first);heap.free(second);
 assert.throws(()=>sourceAddressSpace.decode(second),RangeError);
});
