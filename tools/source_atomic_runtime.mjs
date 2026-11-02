// Source-level atomics for the selected single-isolate browser configuration.
// Operate on the original lvalue; no shadow atomic state or instruction VM.
// Shared worker storage requires a separate concurrent backend and is rejected.
const cAtomic = (source, Type, operation, order, value=null, expected=null, failure=0, weak=false) => {
  const allowed={load:[0,1,2,5],store:[0,3,5],exchange:[0,1,2,3,4,5],compare:[0,1,2,3,4,5]};
  if(!(allowed[operation]??allowed.exchange).includes(Number(order)))throw new RangeError('Invalid source atomic memory order');
  if(operation==='compare'){
    // Match the selected Clang native contract: success and failure orders
    // are independent. Failure only loads, so release/acq_rel are invalid.
    // Original AtomicSList64::pop uses release/acquire even in gnu++14;
    // Clang emits that exact pair. See WG21 P0418R2 and LLVM cmpxchg.
    if(!allowed.load.includes(Number(failure)))throw new RangeError('Invalid source atomic failure order');
  }
  const pointer=Type===null;
  if(!pointer&&![Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,BigInt64Array,BigUint64Array].includes(Type))
    throw new TypeError('Source atomic requires a proven integral/pointer type');
  const rejectShared=address=>{
    const width=pointer?8:Type.BYTES_PER_ELEMENT;
    const buffer=ArrayBuffer.isView(address)?address.buffer:address?.buffer;
    if(typeof SharedArrayBuffer==='function'&&buffer instanceof SharedArrayBuffer)
      throw new TypeError('Shared source atomics require a concurrent backend');
    if(address?.__cPointer===true&&!address.array&&address.offset%width)
      throw new RangeError('Unaligned source atomic address');
    if(ArrayBuffer.isView(address)&&address.byteOffset%width)
      throw new RangeError('Unaligned source atomic address');
  };
  rejectShared(source);
  const reference=pointer?cPointerElementRef(source,0):cDeref(source,Type);
  const coerce=pointer?x=>x:x=>new Type([x])[0];
  if(operation==='load')return reference.value;
  if(operation==='store'){reference.value=coerce(value);return;}
  const previous=reference.value;
  if(operation==='compare'){
    rejectShared(expected);
    const destination=pointer?cPointerElementRef(expected,0):cDeref(expected,Type);
    const equal=pointer?cPointerCompare(previous,destination.value,'=='):previous===destination.value;
    if(equal)reference.value=coerce(value);else destination.value=previous;
    // Weak comparison may succeed whenever strong comparison succeeds.
    return equal;
  }
  if(operation==='exchange'){reference.value=coerce(value);return previous;}
  if(pointer)throw new TypeError('Source pointer atomic arithmetic requires a proven byte stride');
  const [operator,result]=operation.split(':');let next;
  switch(operator){
    case 'add':next=previous+value;break;
    case 'sub':next=previous-value;break;
    case 'and':next=previous&value;break;
    case 'or':next=previous|value;break;
    case 'xor':next=previous^value;break;
    case 'nand':next=~(previous&value);break;
    default:throw new TypeError('Unsupported source atomic operation: '+operation);
  }
  next=coerce(next);reference.value=next;return result==='new'?next:previous;
};
