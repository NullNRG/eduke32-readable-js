/** Typed 32-bit-address-space ABI adapter for lowerable C/C++ functions.
 * This is a native-JS *compatibility layer*, not a complete C++ ABI or emulator.
 * Undefined C accesses throw deliberately rather than silently corrupt memory.
 */
export class ABIHeap {
  constructor(bytes = 1 << 20, maxBytes = 512 << 20) {
    this.maxBytes = maxBytes;
    // Growing a C heap must not detach source record/field views retained by
    // compiled functions. Modern JS engines can grow the same buffer object.
    // Older engines still use the copy path until a borrowed view is issued.
    this.buffer = new ArrayBuffer(bytes, { maxByteLength: maxBytes });
    this.borrowedViewsIssued = false;
    this.top = 16;
    this.allocations = new Map();
    this.freed = [];
    this.#refresh();
  }
  #refresh() {
    this.view = new DataView(this.buffer);
    this.u8 = new Uint8Array(this.buffer);
  }
  static u32(x) { return x >>> 0; }
  static i32(x) { return x | 0; }
  static u64(x) { return BigInt.asUintN(64, BigInt(x)); }
  static i64(x) { return BigInt.asIntN(64, BigInt(x)); }
  static align(n, alignment = 8) {
    if (!Number.isSafeInteger(n) || n < 0 || !Number.isInteger(alignment) || alignment < 1 || (alignment & (alignment - 1))) throw new RangeError('Invalid alignment');
    return Math.ceil(n / alignment) * alignment;
  }
  ensure(size) {
    if (size <= this.buffer.byteLength) return;
    let newSize = this.buffer.byteLength;
    if (size > this.maxBytes) throw new RangeError('C heap capacity exceeded');
    while (newSize < size) newSize = Math.min(newSize * 2, this.maxBytes);
    if (this.buffer.resizable === true) {
      this.buffer.resize(newSize);
    } else {
      if (this.borrowedViewsIssued) throw new Error('Stable C heap aliases require resizable ArrayBuffer support');
      const replacement = new ArrayBuffer(newSize);
      new Uint8Array(replacement).set(this.u8);
      this.buffer = replacement;
    }
    this.#refresh();
  }
  malloc(size, alignment = 8, minimumAddress = 0) {
    if (!Number.isSafeInteger(size) || size < 0) throw new RangeError('Invalid malloc size');
    if (!Number.isSafeInteger(minimumAddress) || minimumAddress < 0) throw new RangeError('Invalid allocation address floor');
    const requested = ABIHeap.align(Math.max(size, 1), alignment);
    const slot = this.freed.findIndex(b => b.size >= requested && b.ptr % alignment === 0 && b.ptr >= minimumAddress);
    if (slot >= 0) {
      const block = this.freed.splice(slot, 1)[0];
      this.allocations.set(block.ptr, block.size);
      this.u8.fill(0, block.ptr, block.ptr + block.size);
      return block.ptr;
    }
    const ptr = ABIHeap.align(Math.max(this.top, minimumAddress), alignment);
    this.ensure(ptr + requested);
    this.allocations.set(ptr, requested);
    this.top = ptr + requested;
    return ptr;
  }
  calloc(count, size) {
    if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(size) || size < 0 || !Number.isSafeInteger(count * size)) throw new RangeError('calloc size overflow');
    const ptr = this.malloc(count * size);
    this.u8.fill(0, ptr, ptr + count * size);
    return ptr;
  }
  free(ptr) {
    if (ptr === 0) return;
    const size = this.allocations.get(ptr);
    if (size === undefined) throw new Error('double free / invalid allocation');
    this.allocations.delete(ptr);
    this.freed.push({ ptr, size });
  }
  realloc(ptr, newSize) {
    if (ptr === 0) return this.malloc(newSize);
    if (newSize === 0) { this.free(ptr); return 0; }
    const old = this.allocations.get(ptr);
    if (old === undefined) throw new Error('realloc invalid pointer');
    if (newSize <= old) return ptr;
    const next = this.malloc(newSize);
    this.u8.copyWithin(next, ptr, ptr + old);
    this.free(ptr);
    return next;
  }
  check(ptr, size = 1) {
    if (!Number.isSafeInteger(ptr) || !Number.isSafeInteger(size) || ptr < 0 || size < 0 || ptr + size > this.top || ptr + size > this.buffer.byteLength) throw new RangeError(`Invalid memory access: address=${ptr} size=${size} top=${this.top} capacity=${this.buffer.byteLength}`);
  }
  read(ptr, type = 'i32') {
    const entries = { u8: [1, 'getUint8'], i8: [1, 'getInt8'], u16: [2, 'getUint16'], i16: [2, 'getInt16'], u32: [4, 'getUint32'], i32: [4, 'getInt32'], u64: [8, 'getBigUint64'], i64: [8, 'getBigInt64'], f32: [4, 'getFloat32'], f64: [8, 'getFloat64'] };
    const entry = entries[type]; if (!entry) throw new TypeError('Unknown C ABI type ' + type);
    this.check(ptr, entry[0]); return this.view[entry[1]](ptr, true);
  }
  write(ptr, type, value) {
    const entries = { u8: [1, 'setUint8'], i8: [1, 'setInt8'], u16: [2, 'setUint16'], i16: [2, 'setInt16'], u32: [4, 'setUint32'], i32: [4, 'setInt32'], u64: [8, 'setBigUint64'], i64: [8, 'setBigInt64'], f32: [4, 'setFloat32'], f64: [8, 'setFloat64'] };
    const entry = entries[type]; if (!entry) throw new TypeError('Unknown C ABI type ' + type);
    this.check(ptr, entry[0]); this.view[entry[1]](ptr, value, true);
  }
  bytes(ptr, length) { this.check(ptr, length); return this.u8.slice(ptr, ptr + length); }
  borrow(ptr, length) {
    this.check(ptr, length);
    const live = [...this.allocations].some(([base, size]) => ptr >= base && ptr + length <= base + size);
    if (!live) throw new RangeError('Borrowed C view must remain within one live allocation');
    this.borrowedViewsIssued = true;
    return new Uint8Array(this.buffer, ptr, length);
  }
  memcpy(dst, src, length) { this.check(dst, length); this.check(src, length); this.u8.copyWithin(dst, src, src + length); return dst; }
  memmove(dst, src, length) { return this.memcpy(dst, src, length); }
  memset(dst, value, length) { this.check(dst, length); this.u8.fill(value & 255, dst, dst + length); return dst; }
  memcmp(a, b, length) {
    this.check(a, length); this.check(b, length);
    for (let i = 0; i < length; i++) if (this.u8[a + i] !== this.u8[b + i]) return this.u8[a + i] - this.u8[b + i];
    return 0;
  }
  strlen(ptr) { this.check(ptr); let pos = ptr; while (pos < this.top && this.u8[pos] !== 0) pos++; if (pos === this.top) throw new Error('Unterminated C string'); return pos - ptr; }
  // Web TextDecoder rejects views backed by a resizable ArrayBuffer. Copy
  // only the bytes crossing this browser boundary; retain the heap identity.
  readCString(ptr) { const len = this.strlen(ptr); return new TextDecoder().decode(this.u8.slice(ptr, ptr + len)); }
  writeCString(text) { const bytes = new TextEncoder().encode(String(text)); const ptr = this.malloc(bytes.length + 1); this.u8.set(bytes, ptr); this.u8[ptr + bytes.length] = 0; return ptr; }
}
