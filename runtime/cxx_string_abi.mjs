/** libstdc++11 x86-64 std::basic_string<char> ABI, 32 bytes, SSO capacity 15.
 * Implements externally emitted _M_* helpers in the selected GNU ABI.
 * Cannot substitute for C++ exception unwinding/RTTI or other architectures.
 */
export function createCxxStringABI({heap}={}){
  if(!heap)throw TypeError('C++ string runtime requires heap');
  const prefix='_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE';
  const bounded=x=>{
    const n=typeof x==='bigint'?Number(x):Number(x);
    if(!Number.isSafeInteger(n)||n<0)throw RangeError('C++ string size exceeds addressable ABI heap');return n;
  };
  const pointer=object=>Number(heap.read(object,'u64'));
  const length=object=>bounded(heap.read(object+8,'u64'));
  const local=object=>object+16;
  const capacity=object=>pointer(object)===local(object)?15:bounded(heap.read(object+16,'u64'));
  const checkObj=obj=>{heap.check(obj,32);const data=pointer(obj);if(!data)throw Error('Uninitialized std::string object');return data;};
  const setLength=(obj,n)=>{
    n=bounded(n);const data=checkObj(obj);
    if(n>capacity(obj))throw RangeError('std::string size exceeds capacity');
    heap.write(obj+8,'u64',BigInt(n));heap.write(data+n,'u8',0);
  };
  function create(obj,requiredPtr,oldCapacity){
    heap.check(obj,32);heap.check(requiredPtr,8);
    let desired=bounded(heap.read(requiredPtr,'u64'));
    const old=bounded(oldCapacity);
    if(desired>Math.floor(heap.maxBytes/2))throw RangeError('std::length_error');
    // libstdc++ _M_create grows exponentially when requested < 2*old capacity.
    if(old>0&&desired>old&&desired<old*2)desired=old*2;
    if(desired+1>heap.maxBytes)throw RangeError('std::length_error');
    const buf=heap.malloc(desired+1);
    heap.write(requiredPtr,'u64',BigInt(desired));return buf;
  }
  function initialize(obj){heap.check(obj,32);heap.write(obj,'u64',BigInt(local(obj)));heap.write(obj+8,'u64',0n);heap.write(local(obj),'u8',0);}
  function update(obj,bytes){
    const oldPtr=checkObj(obj),oldCapacity=capacity(obj),n=bytes.length;
    if(n>oldCapacity){
      const max=heap.malloc(8);heap.write(max,'u64',BigInt(n));
      let next,newCapacity;
      try{next=create(obj,max,oldCapacity);newCapacity=bounded(heap.read(max,'u64'));}finally{heap.free(max);}
      heap.u8.set(bytes,next);heap.write(next+n,'u8',0);
      if(oldPtr!==local(obj))heap.free(oldPtr);
      heap.write(obj,'u64',BigInt(next));heap.write(obj+16,'u64',BigInt(newCapacity));
    }else heap.u8.set(bytes,oldPtr);
    setLength(obj,n);
  }
  function replace(obj,pos,len1,source,len2){
    pos=bounded(pos);len1=bounded(len1);len2=bounded(len2);
    const data=checkObj(obj),old=length(obj);
    if(pos>old)throw RangeError('std::out_of_range');
    const removed=Math.min(old-pos,len1),newsize=old-removed+len2;
    if(!Number.isSafeInteger(newsize)||newsize>heap.maxBytes)throw RangeError('std::length_error');
    const replacement=source?heap.bytes(source,len2):new Uint8Array(len2);
    const output=new Uint8Array(newsize);
    output.set(heap.bytes(data,pos),0);output.set(replacement,pos);
    const tail=old-pos-removed;
    if(tail)output.set(heap.bytes(data+pos+removed,tail),pos+len2);
    update(obj,output);return obj;
  }
  const ret={
    [prefix+'9_M_createERmm']:(obj,required,old)=>create(obj,required,old),
    [prefix+'9_M_mutateEmmPKcm']:(obj,pos,len1,source,len2)=>{
      // libstdc++ caller updates _M_length after mutation. Replacing bytes
      // writes valid storage, but _M_mutate itself does not assign the length.
      const old=length(obj),start=bounded(pos),remove=Math.min(bounded(len1),old-start);
      if(start>old)throw RangeError('std::out_of_range');
      const snapshot=source?heap.bytes(source,bounded(len2)):new Uint8Array(bounded(len2));
      const before=heap.bytes(pointer(obj),start);
      const after=heap.bytes(pointer(obj)+start+remove,old-start-remove);
      const nextlen=before.length+snapshot.length+after.length;
      const oldptr=pointer(obj),oldCap=capacity(obj);
      const cap=heap.malloc(8);heap.write(cap,'u64',BigInt(nextlen));
      let replacement,finalCap;
      try{replacement=create(obj,cap,oldCap);finalCap=bounded(heap.read(cap,'u64'));}finally{heap.free(cap);}
      heap.u8.set(before,replacement);heap.u8.set(snapshot,replacement+before.length);
      heap.u8.set(after,replacement+before.length+snapshot.length);
      heap.write(replacement+nextlen,'u8',0);
      if(oldptr!==local(obj))heap.free(oldptr);
      heap.write(obj,'u64',BigInt(replacement));heap.write(obj+16,'u64',BigInt(finalCap));
      // Preserve old string length; caller performs _M_set_length.
    },
    [prefix+'9_M_appendEPKcm']:(obj,src,n)=>replace(obj,length(obj),0,src,n),
    [prefix+'9_M_assignERKS4_']:(obj,other)=>{
      if(obj!==other)update(obj,heap.bytes(checkObj(other),length(other)));
    },
    [prefix+'10_M_replaceEmmPKcm']:replace,
    [prefix+'14_M_replace_auxEmmmc']:(obj,pos,removed,count,c)=>{
      count=bounded(count);const fill=new Uint8Array(count).fill(Number(c)&255);
      const data=heap.malloc(count||1);heap.u8.set(fill,data);
      try{return replace(obj,pos,removed,data,count);}finally{heap.free(data);}
    },
    [prefix+'12_M_constructEmc']:(obj,count,c)=>{
      initialize(obj);const n=bounded(count);
      update(obj,new Uint8Array(n).fill(Number(c)&255));
    },
    [prefix+'6resizeEmc']:(obj,n,c)=>{
      n=bounded(n);const len=length(obj);
      if(n>len)replace(obj,len,0,0,n-len);
      if(n>len)heap.u8.fill(Number(c)&255,pointer(obj)+len,pointer(obj)+n);
      if(n<len)setLength(obj,n);
    },
    [prefix+'7reserveEm']:(obj,n)=>{
      n=bounded(n);if(n<=capacity(obj))return;
      const oldPtr=checkObj(obj),size=length(obj),oldCapacity=capacity(obj);
      const cap=heap.malloc(8);heap.write(cap,'u64',BigInt(n));
      let next,newCapacity;
      try{next=create(obj,cap,oldCapacity);newCapacity=bounded(heap.read(cap,'u64'));}finally{heap.free(cap);}
      heap.memcpy(next,oldPtr,size+1);
      if(oldPtr!==local(obj))heap.free(oldPtr);
      heap.write(obj,'u64',BigInt(next));heap.write(obj+16,'u64',BigInt(newCapacity));
    },
    [prefix+'4findEPKcmm']:(obj,needle,pos,n)=>{
      const hay=checkObj(obj),size=length(obj),count=bounded(n),start=bounded(pos);
      if(start>size||count>size-start)return -1n;
      if(count===0)return BigInt(start);
      heap.check(needle,count);
      for(let i=start;i+count<=size;i++)if(heap.memcmp(hay+i,needle,count)===0)return BigInt(i);
      return -1n;
    },
    [prefix+'D2Ev']:obj=>{
      const data=checkObj(obj);if(data!==local(obj))heap.free(data);
      initialize(obj);
    },
  };
  // The const-qualified find overload uses the same read-only algorithm.
  ret['_ZNKSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE4findEPKcmm']=ret[prefix+'4findEPKcmm'];
  return Object.freeze(ret);
}
