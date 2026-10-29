// Standard C allocation adapter. Uses the project's existing ABIHeap, with
// 16-byte malloc alignment for the selected LP64 ABI. Original custom game
// allocators remain original source functions and are never replaced here.
const cCHeap = (()=>{
  const apiKey=Symbol.for('source-first.standard-C-allocation-api/2');
  if(globalThis[apiKey])return globalThis[apiKey];
  const key=Symbol.for('source-first.native-C-heap/2');
  const get=()=>{
    const heap=globalThis[key]||(globalThis[key]=new ABIHeap());
    cSourceAddresses.registerHeap(heap);return heap;
  };
  const count=value=>{
    if(typeof value!=='bigint'&&!(typeof value==='number'&&Number.isSafeInteger(value)))
      throw new TypeError('C allocation requires integral size_t');
    const n=BigInt(value);if(n<0n||n>0xffffffffffffffffn)throw new RangeError('Invalid C size_t allocation');
    return n;
  };
  const allocate=size=>{
    const heap=get(),amount=count(size);
    if(amount>BigInt(heap.maxBytes))return null;
    let ptr;
    // Original allocator code reserves small integer pointer values for
    // sentinels (IsReadable compares against 16384). Real C allocations must
    // stay outside that range, including recycled browser-service blocks.
    try{ptr=heap.malloc(Number(amount),16,65536);}
    catch(error){if(error instanceof RangeError&&error.message==='C heap capacity exceeded')return null;throw error;}
    return heap.borrow(ptr,Number(amount)||1);
  };
  const base=pointer=>{
    const heap=get(),bits=cSourceAddresses.encode(pointer);
    if(bits>BigInt(Number.MAX_SAFE_INTEGER))throw new TypeError('C free requires original C heap allocation');
    const ptr=Number(bits);
    if(!heap.allocations.has(ptr))throw new TypeError('C free/realloc requires allocation base');
    return ptr;
  };
  const release=ptr=>{const heap=get(),size=heap.allocations.get(ptr);heap.free(ptr);cSourceAddresses.forgetHeap(ptr,size);};
  const api={
    malloc:allocate,
    calloc(n,size){const total=count(n)*count(size);return total>0xffffffffffffffffn?null:allocate(total);},
    free(pointer){if(pointer!==null)release(base(pointer));},
    realloc(pointer,size){
      const amount=count(size);if(pointer===null)return allocate(amount);
      const heap=get(),ptr=base(pointer);
      if(amount===0n){release(ptr);return null;}
      const next=allocate(amount);if(next===null)return null;
      const length=Math.min(heap.allocations.get(ptr),Number(amount));
      next.set(new Uint8Array(heap.buffer,ptr,length));release(ptr);return next;
    }
  };
  globalThis[apiKey]=api;return api;
})();
