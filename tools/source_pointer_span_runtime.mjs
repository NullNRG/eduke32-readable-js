// Source-language C++ pointer-span iteration, NOT a duck-typed JS iterable.
// The emitter has verified native begin() == data and end() == data + size
// from the class's original Clang AST. Runtime checks enforce bounds/stride.
const cxxPointerSpan = (owner, dataName, sizeName, stride) => {
  if (!owner || typeof owner !== 'object' ||
      !Object.prototype.hasOwnProperty.call(owner, dataName) ||
      !Object.prototype.hasOwnProperty.call(owner, sizeName))
    throw new TypeError('C++ pointer span requires declared instance storage');
  if (!Number.isSafeInteger(stride) || stride <= 0)
    throw new TypeError('Invalid native pointer element width');
  const count = owner[sizeName];
  if (typeof count !== 'number' && typeof count !== 'bigint')
    throw new TypeError('C++ span length must be an integer');
  const length = Number(count);
  if (!Number.isSafeInteger(length) || length < 0 || BigInt(length) !== BigInt(count))
    throw new RangeError('Invalid C++ span size');
  const storage = owner[dataName];
  if (length === 0 && storage == null) return {length:0, get(){throw new RangeError('Empty C++ span');}};
  let array, start, capacity;
  if (Array.isArray(storage)) {
    array = storage; start = 0; capacity = array.length;
  } else if (ArrayBuffer.isView(storage) && !(storage instanceof DataView) &&
             storage.BYTES_PER_ELEMENT === stride) {
    array = storage; start = 0; capacity = array.length;
  } else if (storage && storage.__cPointer === true && storage.array === true &&
             Array.isArray(storage.buffer)) {
    if (!Number.isSafeInteger(storage.stride) || storage.stride !== stride ||
        !Number.isSafeInteger(storage.lower) || !Number.isSafeInteger(storage.upper) ||
        !Number.isSafeInteger(storage.offset) || storage.offset < storage.lower ||
        storage.upper > storage.buffer.length * stride ||
        storage.offset % stride !== 0 || storage.lower % stride !== 0 ||
        storage.upper % stride !== 0 || storage.offset > storage.upper)
      throw new TypeError('C++ span pointer stride/bounds do not match source type');
    array = storage.buffer;
    start = storage.offset / stride;
    capacity = (storage.upper - storage.offset) / stride;
  } else {
    // A raw ArrayBuffer cannot be interpreted as a C++ pointer-to-pointer:
    // it lacks valid JS pointee identity / relocation information.
    throw new TypeError('C++ span requires proven bounded pointer-slot storage');
  }
  if (length > capacity || start + length > array.length)
    throw new RangeError('C++ span end escapes backing storage');
  return { length, get(index) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= length)
      throw new RangeError('C++ span element out of bounds');
    return array[start + index];
  }};
};
