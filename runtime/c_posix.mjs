import {sourceByteView,sourceByteOffset,sourceSizedBytes} from './source_bytes.mjs';
/** POSIX/C host-backed calls for a single-threaded, x86-64 SysV ABI heap.
 * A clock domain that the host cannot supply is an explicit error (never fake time).
 */
export function createPosixRuntime({heap, errnoLocation, callIndirect,
  wallClock=()=>Date.now(), monotonicClock=()=>globalThis.performance?.now?.(),
  getCallFrames=()=>[], allocateTraceBuffer=null, streams=new Map()}={}) {
  if (!heap || typeof errnoLocation !== 'function') throw TypeError('POSIX heap and errno required');
  const EINVAL=22, EFAULT=14, ENOTSUP=95;
  const fail=(code)=>{heap.write(errnoLocation(),'i32',code);return -1;};
  function checkMillisecondClock(fn){
    const v=fn();
    if(typeof v!=='number'||!Number.isFinite(v)||v<0||!Number.isSafeInteger(Math.trunc(v*1e3)))
      throw Error('Host clock unavailable or outside precise supported range');
    return BigInt(Math.trunc(v*1000)); // integer microseconds, no floating bigint truncation
  }
  function writeTimeSpec(ptr,microseconds){
    const bytes=sourceSizedBytes(ptr,16,heap),view=new DataView(bytes.buffer,bytes.byteOffset,16);
    view.setBigInt64(0,microseconds/1000000n,true);
    view.setBigInt64(8,(microseconds%1000000n)*1000n,true);
  }
  // Linux x86-64 glibc signal ABI: sigaction size 152, handler +0,
  // sigset_t (128 bytes) +8, flags +136, restorer +144. All registrations
  // are PROCESS-LOCAL JS handlers: browser/OS signals CANNOT be intercepted.
  const signalActions=new Map();
  const validSignal=n=>Number.isInteger(n)&&n>=1&&n<=64&&n!==32&&n!==33;
  const emptyAction=()=>new Uint8Array(152);
  function signalActionBytes(ptr){
    if(!ptr)return emptyAction();
    heap.check(Number(ptr),152);
    return heap.bytes(Number(ptr),152);
  }
  function signalSet(sig,handler){
    sig=Number(sig);handler=Number(handler);
    if(!validSignal(sig)||!Number.isSafeInteger(handler)||handler<0)return fail(EINVAL);
    const previous=signalActions.get(sig)??emptyAction();
    const old=Number(new DataView(previous.buffer,previous.byteOffset,152).getBigUint64(0,true));
    const next=emptyAction();new DataView(next.buffer).setBigUint64(0,BigInt(handler),true);
    signalActions.set(sig,next);
    return old;
  }
  function sigaction(sig,nextPtr,oldPtr){
    sig=Number(sig);
    if(!validSignal(sig))return fail(EINVAL);
    // Read new bytes BEFORE writing old: users are allowed to overlap storage.
    const replacement=nextPtr?signalActionBytes(Number(nextPtr)):null;
    const previous=signalActions.get(sig)??emptyAction();
    if(oldPtr){heap.check(Number(oldPtr),152);heap.u8.set(previous,Number(oldPtr));}
    if(replacement)signalActions.set(sig,replacement);
    return 0;
  }
  function raise(sig){
    sig=Number(sig);
    if(!validSignal(sig))return fail(EINVAL);
    const act=signalActions.get(sig);
    const handler=act?Number(new DataView(act.buffer,act.byteOffset,152).getBigUint64(0,true)):0;
    if(handler===1)return 0; // SIG_IGN
    if(handler===0)throw Error('Default C signal action cannot be delivered in browser: '+sig);
    if(typeof callIndirect!=='function')throw Error('signal dispatch not connected');
    // SA_SIGINFO needs siginfo_t/ucontext_t that this host does not provide;
    // refuse to fake a 3-argument callback.
    const flags=new DataView(act.buffer,act.byteOffset,152).getInt32(136,true);
    if(flags & 4)throw Error('SA_SIGINFO signal delivery requires native siginfo context');
    callIndirect(handler,[sig]);
    return 0;
  }
  // Preserve translated C function call frames as actual ABI function pointers.
  // This cannot reveal native OS frames, addresses, or JIT frame offsets.
  const traceText=new Map();
  function backtrace(dst,count){
    count=Number(count);
    if(!Number.isSafeInteger(count)||count<0||count>1000000)return fail(EINVAL);
    if(!dst||count===0)return 0;
    heap.check(Number(dst),count*8);
    const frames=getCallFrames();
    let n=0;
    for(let i=frames.length-1;i>=0&&n<count;i--){
      const {address,name}=frames[i];
      if(!Number.isSafeInteger(address)||address<=0)continue;
      heap.write(Number(dst)+n*8,'u64',BigInt(address));
      traceText.set(address,name);n++;
    }
    return n;
  }
  function backtrace_symbols(addresses,count){
    count=Number(count);
    if(!Number.isSafeInteger(count)||count<0||count>16384)return 0;
    heap.check(Number(addresses),count*8);
    const encoder=new TextEncoder();
    const names=[];let total=count*8;
    for(let i=0;i<count;i++){
      const address=Number(heap.read(Number(addresses)+8*i,'u64'));
      const name=traceText.get(address)??'<unknown translated frame>';
      const line=`compiled(${name}) [0x${address.toString(16)}]`;
      const bytes=encoder.encode(line);names.push(bytes);total+=bytes.length+1;
    }
    // In the program this is mi_malloc, matching the original caller's
    // mi_free(), not an unrelated JavaScript or virtual heap allocation.
    const ptr=Number(allocateTraceBuffer?allocateTraceBuffer(total):heap.malloc(total));
    if(!Number.isSafeInteger(ptr)||ptr<=0)return 0;
    heap.check(ptr,total);
    let next=ptr+count*8;
    for(let i=0;i<count;i++){
      heap.write(ptr+i*8,'u64',BigInt(next));
      heap.u8.set(names[i],next);heap.write(next+names[i].length,'u8',0);
      next+=names[i].length+1;
    }
    return ptr;
  }
  function backtrace_symbols_fd(addresses,count,fd){
    count=Number(count);fd=Number(fd);
    if(!Number.isInteger(count)||count<0||count>16384)throw RangeError('Invalid backtrace frame count');
    const sink=streams.get(fd);
    if(typeof sink!=='function')throw Error('backtrace_symbols_fd requires a writable host descriptor');
    heap.check(Number(addresses),count*8);
    const encoder=new TextEncoder();
    for(let i=0;i<count;i++){
      const address=Number(heap.read(Number(addresses)+i*8,'u64'));
      const name=traceText.get(address)??'<unknown translated frame>';
      sink(encoder.encode(`compiled(${name}) [0x${address.toString(16)}]\n`));
    }
  }
  function bsearch(key,base,count,width,compare){
    count=Number(count);width=Number(width);
    if(!Number.isSafeInteger(count)||count<0||!Number.isSafeInteger(width)||width<1||
      !Number.isSafeInteger(count*width)||count*width>heap.maxBytes)throw RangeError('Invalid bsearch element extent');
    if(count===0)return 0;
    const direct=typeof compare==='function';
    if(!direct&&typeof callIndirect!=='function')throw Error('bsearch comparator dispatch not connected');
    const source=sourceByteView(base);
    if(source&&source.byteLength<count*width)throw RangeError('bsearch exceeds original source allocation');
    if(!source)heap.check(base,count*width);
    const recordLayout=base?.[Symbol.for('source-first.byte-record-array-layout/1')];
    const original=recordLayout?JSON.parse(recordLayout):null;
    const typed=original?.dims?.length===1&&original.schema?.size===width;
    let lower=0,upper=count;
    while(lower<upper){
      const index=lower+Math.floor((upper-lower)/2);
      let pointer=source?sourceByteOffset(base,index*width):base+index*width;
      if(typed)pointer={...pointer,__cRecordPointer:true,recordSchema:original.schema,
        recordPrototypes:base[Symbol.for('source-first.byte-record-array-prototypes/1')]||{}};
      const value=direct?compare(key,pointer):callIndirect(Number(compare),[key,pointer]);
      if(!Number.isFinite(Number(value)))throw Error('Invalid C bsearch comparator result');
      if(Number(value)===0)return pointer;
      if(Number(value)<0)upper=index;else lower=index+1;
    }
    return 0;
  }
  function qsort(base,count,width,compare){
    count=Number(count);width=Number(width);
    if(!Number.isSafeInteger(count)||count<0||!Number.isSafeInteger(width)||width<1 ||
      !Number.isSafeInteger(count*width)||count*width>heap.maxBytes)throw RangeError('Invalid qsort element extent');
    if(count<2)return;
    const direct=typeof compare==='function';
    if(!direct&&typeof callIndirect!=='function')throw Error('qsort comparator dispatch not connected');
    const source=sourceByteView(base);
    if(source&&source.byteLength<count*width)throw RangeError('qsort exceeds original source allocation');
    if(!source)heap.check(base,count*width);
    const bytes=source?source.subarray(0,count*width):heap.u8.subarray(base,base+count*width);
    const recordLayout=base?.[Symbol.for('source-first.byte-record-array-layout/1')];
    const original=recordLayout?JSON.parse(recordLayout):null;
    const typed=original?.dims?.length===1&&original.schema?.size===width;
    const address=i=>{
      const pointer=source?sourceByteOffset(base,i*width):base+i*width;
      // Keep the actual Clang layout attached when a C void* comparator
      // receives an element of a source record array. Its bytes and bounds
      // remain the same allocation; callbacks never receive detached copies.
      return typed?{...pointer,__cRecordPointer:true,recordSchema:original.schema,
        recordPrototypes:base[Symbol.for('source-first.byte-record-array-prototypes/1')]||{}}:pointer;
    };
    const swap=(i,j)=>{
      if(i===j)return;
      // Temporary bytes, not a JS object-array sort: the original comparator
      // receives valid addresses of actual contiguous elements in the C heap.
      const a=i*width,b=j*width,temp=bytes.slice(a,a+width);
      bytes.copyWithin(a,b,b+width);bytes.set(temp,b);
    };
    const cmp=(i,j)=>{
      const out=direct?compare(address(i),address(j)):callIndirect(Number(compare),[address(i),address(j)]);
      if(!Number.isFinite(Number(out)))throw Error('Invalid C qsort comparator result');
      return Number(out);
    };
    const sift=(root,end)=>{
      while(root*2+1<=end){
        let child=root*2+1;
        if(child+1<=end && cmp(child,child+1)<0)child++;
        if(cmp(root,child)>=0)return;
        swap(root,child);root=child;
      }
    };
    for(let start=Math.floor((count-2)/2);start>=0;start--)sift(start,count-1);
    for(let end=count-1;end>0;end--){swap(0,end);sift(0,end-1);}
  }
  return Object.freeze({
    // GNU mimalloc probes Linux PR_GET_THP_DISABLE (42) and
    // PR_SET_THP_DISABLE (41). Browser JavaScript cannot query/change Linux
    // transparent hugepage policy, so take the proper ENOSYS error branch.
    // No successful kernel-state modification is claimed.
    prctl:(option,..._args)=>{
      if(option===41||option===42)return fail(38);
      return fail(EINVAL);
    },
    qsort,
    bsearch,
    signal:signalSet,
    sigaction,
    raise,
    backtrace,
    backtrace_symbols,
    backtrace_symbols_fd,
    clock_gettime:(which,ptr)=>{
      if(!ptr)return fail(EFAULT);
      // Linux CLOCK_MONOTONIC_RAW (4) has no guaranteed browser equivalent.
      // Use the real high-resolution monotonic clock as a documented
      // compatibility approximation, never fabricate time values.
      if(which!==0&&which!==1&&which!==4)return fail(EINVAL);
      let micros;
      try{micros=checkMillisecondClock(which===0?wallClock:monotonicClock);}catch{return fail(ENOTSUP);}
      writeTimeSpec(ptr,micros);return 0;
    },
    gettimeofday:(ptr,timezone)=>{
      if(timezone)return fail(ENOTSUP); // obsolete timezone argument cannot be inferred
      if(!ptr)return fail(EFAULT);
      let micros;try{micros=checkMillisecondClock(wallClock);}catch{return fail(ENOTSUP);}
      heap.check(ptr,16);
      heap.write(ptr,'i64',micros/1000000n);
      heap.write(ptr+8,'i64',micros%1000000n);
      return 0;
    },
    time:ptr=>{
      const seconds=checkMillisecondClock(wallClock)/1000000n;
      if(ptr)heap.write(ptr,'i64',seconds);
      return seconds;
    },
  });
}
