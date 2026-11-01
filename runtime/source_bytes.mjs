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
