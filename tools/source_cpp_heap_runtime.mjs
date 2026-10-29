// Standard C++ allocation for source-lowered scalar arrays and managed classes.
// Class instances retain their ORIGINAL constructor/destructor bodies and this
// identity. They are not advertised as byte-backed native records. Raw class
// serialization still requires the separate proven byte-record ABI.
const cxxHeap = (() => {
  const symbol=Symbol.for('source-first.cpp-heap/1');
  const state=globalThis[symbol] || (globalThis[symbol]={objects:new WeakMap(),buffers:new WeakMap(),arrays:new WeakMap(),bytes:0});
  const constructors={Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,
                      BigInt64Array,BigUint64Array,Float32Array,Float64Array};
  const reserve=(count,width,align)=>{
    const n=Number(count);
    if((typeof count!=='number'&&typeof count!=='bigint')||!Number.isSafeInteger(n)||n<0||
        !Number.isSafeInteger(width)||width<1||!Number.isSafeInteger(align)||align<1||
        (align&(align-1))||!Number.isSafeInteger(n*width)||n*width>268435456||
        state.bytes+n*width>536870912)
      throw new RangeError('Standard C++ allocation exceeds bounded native-JS heap');
    const extent=n*width;state.bytes+=extent;
    return {count:n,extent,live:true};
  };
  const release=allocation=>{if(allocation.live){
    try{globalThis[Symbol.for('source-lp64-addresses/2')]?.forgetAllocation(allocation.pointer);}
    finally{allocation.live=false;state.bytes-=allocation.extent;}
  }};
  const native=(name,count,width,align,type,array,initialize)=>{
    const C=constructors[name];
    if(!C||C.BYTES_PER_ELEMENT!==width)throw new TypeError('C++ scalar allocation ABI mismatch');
    const allocation=reserve(count,width,align);
    try {
      const value=new C(allocation.count);
      allocation.type=type;allocation.array=array;allocation.pointer=value;
      if(initialize!==null){const initial=initialize();if(array){
          if(initial!==null)throw new TypeError('C++ array initializer requires verified element construction');
        }else value[0]=initial;}
      state.buffers.set(value.buffer,allocation);return value;
    }catch(error){release(allocation);throw error;}
  };
  const object=(size,align,type,construct,destroy)=>{
    const allocation=reserve(1,size,align);
    try{
      const value=construct();
      if(!value||typeof value!=='object'||ArrayBuffer.isView(value)||Array.isArray(value)||state.objects.has(value))
        throw new TypeError('C++ new requires a distinct original class instance');
      if(destroy!==null&&typeof value[destroy]!=='function')throw new TypeError('Original heap destructor is unavailable');
      Object.assign(allocation,{type,array:false,pointer:value,destroy,slots:[value]});
      state.arrays.set(allocation.slots,allocation);
      state.objects.set(value,allocation);return value;
    }catch(error){release(allocation);throw error;}
  };
  const destroy=(pointer,array,type)=>{
    if(pointer===null)return;
    if(pointer?.__cDeferredPointer===true||pointer?.__cDeferredReference===true)return destroy(pointer.resolve(),array,type);
    let allocation=state.objects.get(pointer),offset=0;
    if(!allocation&&ArrayBuffer.isView(pointer)){
      allocation=state.buffers.get(pointer.buffer);offset=pointer.byteOffset;
    }else if(!allocation&&pointer?.__cPointer===true){
      allocation=(pointer.array?state.arrays:state.buffers).get(pointer.buffer);offset=pointer.offset;
    }
    if(!allocation||!allocation.live)throw new TypeError('C++ delete requires a live original allocation');
    if(offset!==0||allocation.array!==array||allocation.type!==type)
      throw new TypeError('C++ delete base, array form or source type mismatch');
    try {if(allocation.destroy!==null&&allocation.destroy!==undefined)allocation.pointer[allocation.destroy]();}
    finally {release(allocation);}
  };
  return Object.freeze({native,object,destroy});
})();
