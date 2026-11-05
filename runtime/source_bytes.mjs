/** Borrow actual source-first byte storage at a browser/library boundary.
 * Numeric heap addresses remain numeric. No pointer tokens are invented and
 * no copying detaches writes from the original C allocation.
 */
export function sourceByteView(value) {
  const seen=new Set();
  while(value?.__cDeferredPointer===true){
    if(seen.has(value))throw TypeError('Cyclic deferred source pointer');
    seen.add(value);value=value.resolve();
  }
  if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
  const record=value?.[Symbol.for('source-first.original-byte-record-storage/1')];
  if(record?.bytes instanceof Uint8Array)return record.bytes;
  const arrayBytes=value?.[Symbol.for('source-first.clang-byte-record-array/1')];
  if(arrayBytes instanceof Uint8Array)return arrayBytes;
  if(value?.__cPointer!==true)return null;
  const {buffer,lower,upper,offset,array}=value;
  if(array!==false || !(buffer instanceof ArrayBuffer))
    throw TypeError('Host byte service requires original byte-backed source storage');
  if(![lower,upper,offset].every(Number.isSafeInteger) || lower<0 || offset<lower ||
      upper<offset || upper>buffer.byteLength)
    throw RangeError('Source pointer escapes original byte bounds');
  return new Uint8Array(buffer,offset,upper-offset);
}

/** Keep the original allocation bounds when a host routine returns an alias. */
export function sourceByteOffset(value, delta) {
  const bytes=sourceByteView(value);
  if(!bytes || !Number.isSafeInteger(delta) || delta<0 || delta>bytes.byteLength)
    throw RangeError('Host return pointer escapes original source storage');
  const seen=new Set();
  while(value?.__cDeferredPointer===true){
    if(seen.has(value))throw TypeError('Cyclic deferred source pointer');
    seen.add(value);value=value.resolve();
  }
  if(value?.__cPointer===true)return {...value,offset:value.offset+delta};
  return {__cPointer:true,buffer:bytes.buffer,lower:bytes.byteOffset,
    upper:bytes.byteOffset+bytes.byteLength,offset:bytes.byteOffset+delta,array:false};
}

/** Convert a borrowed view back to the address in its ORIGINAL native C heap.
 * Stack/global buffers and storage from other heaps never gain free/realloc
 * ownership merely because they have a compatible byte representation.
 */
export function sourceHeapAddress(value, heap) {
  if(value===null||value===0||value===0n)return 0;
  if(typeof value==='bigint'){
    if(value<0n||value>BigInt(Number.MAX_SAFE_INTEGER))throw RangeError('C heap address exceeds exact range');
    value=Number(value);
  }
  if(Number.isSafeInteger(value)&&value>0){heap.check(value,0);return value;}
  const bytes=sourceByteView(value);
  if(!bytes||bytes.buffer!==heap.buffer)throw TypeError('C allocation service requires storage from its own heap');
  heap.check(bytes.byteOffset,0);return bytes.byteOffset;
}

/** Borrow a bounded host I/O span, without converting source stack storage
 * into a heap address or allocating a detached output buffer. */
export function sourceSizedBytes(value, count, heap) {
  count=Number(count);
  if(!Number.isSafeInteger(count)||count<0)throw RangeError('Invalid source byte count');
  const bytes=sourceByteView(value);
  if(!bytes){
    const address=sourceHeapAddress(value,heap);heap.check(address,count);
    return heap.u8.subarray(address,address+count);
  }
  if(count>bytes.length)throw RangeError('Host I/O exceeds original source byte bounds');
  return bytes.subarray(0,count);
}

export function sourceCString(value, heap) {
  const bytes=sourceByteView(value);
  if(!bytes)return heap.readCString(sourceHeapAddress(value,heap));
  const end=bytes.indexOf(0);
  if(end<0)throw RangeError('Source string is not NUL-terminated within original byte bounds');
  // Browser TextDecoder rejects resizable-heap views. Only the immutable
  // string input is copied; writable I/O spans still alias original storage.
  return new TextDecoder().decode(bytes.slice(0,end));
}

/** Typed scalar output marshaling at a synchronous host I/O boundary.
 * Actual byte-backed storage is borrowed. A source scalar lvalue instead
 * carries a Clang-selected primitive type; partial writes preserve its other
 * bytes, then commit through the SAME original setter before returning.
 * This temporary transfer span is never exposed as the scalar's C address.
 */
export function sourceOutputBytes(value,count,heap) {
  const tag=value?.[Symbol.for('source-first.scalar-lvalue-io/1')];
  if(!tag || sourceByteView(value))return {bytes:sourceSizedBytes(value,count,heap),commit(){}};
  const types=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,BigInt64Array,BigUint64Array,Float32Array,Float64Array];
  if(value?.__cReference!==true||tag.abi!=='source-scalar-lvalue-io/1'||!types.includes(tag.Type)||typeof Object.getOwnPropertyDescriptor(value,'value')?.set!=='function')
    throw TypeError('Host scalar output requires a verified writable source lvalue');
  count=Number(count);const width=tag.Type.BYTES_PER_ELEMENT;
  if(!Number.isSafeInteger(count)||count<0||count>width)throw RangeError('Host scalar output exceeds its original type width');
  const transfer=new tag.Type([value.value]),bytes=new Uint8Array(transfer.buffer,0,count);
  let completed=false;
  return {bytes,commit(written){
    if(completed)throw TypeError('Source scalar transfer already committed');
    if(!Number.isSafeInteger(written)||written<0||written>count)throw RangeError('Invalid host scalar output length');
    completed=true;if(written)value.value=transfer[0];
  }};
}
