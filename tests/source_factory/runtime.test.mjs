import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ABIHeap, VirtualFS, SymbolLinker, NativeRuntime, bindSourceFreeAllocator } from '../../runtime/index.mjs';

function syntheticGRP() {
  const payload = new Uint8Array([1, 2, 3, 4, 5]);
  const data = new Uint8Array(16 + 16 + payload.length);
  data.set(new TextEncoder().encode('KenSilverman'), 0);
  new DataView(data.buffer).setUint32(12, 1, true);
  data.set(new TextEncoder().encode('FIRST.MAP'), 16);
  new DataView(data.buffer).setUint32(28, payload.length, true);
  data.set(payload, 32);
  return data;
}
test('ABI exact integer and floating read/write, BigInt64 and buffer growth', () => {
  const h = new ABIHeap(64);
  const a = h.malloc(32);
  h.write(a, 'u32', 0x87654321);
  assert.equal(h.read(a, 'u32'), 0x87654321);
  h.write(a + 8, 'i64', -0x7fffffff123456n);
  assert.equal(h.read(a + 8, 'i64'), -0x7fffffff123456n);
  h.write(a + 18, 'f32', 2.5);
  assert.equal(h.read(a + 18, 'f32'), 2.5);
  const b = h.malloc(4096);
  assert.ok(b >= a + 32);
  assert.equal(h.read(a, 'u32'), 0x87654321);
  assert.equal(ABIHeap.u32(-1), 0xffffffff);
  assert.equal(ABIHeap.i64(0xffffffffffffffffn), -1n);
});
test('ABI memory operations are byte-exact and overlap-safe', () => {
  const h = new ABIHeap(128), a = h.malloc(40), b = h.malloc(40);
  for (let i = 0; i < 40; i++) h.u8[a + i] = i;
  h.memcpy(b, a, 40);
  assert.deepEqual([...h.bytes(a, 40)], [...h.bytes(b, 40)]);
  h.memmove(b + 2, b, 36);
  assert.equal(h.u8[b + 2], 0);
  assert.equal(h.u8[b + 37], 35);
  h.memset(a, 255, 2);
  assert.equal(h.memcmp(a, b, 2) > 0, true);
});
test('ABI allocations, realloc, free and error detection', () => {
  const h = new ABIHeap();
  const ptr = h.writeCString('hi 🤖');
  assert.equal(h.readCString(ptr), 'hi 🤖');
  assert.equal(h.strlen(ptr), new TextEncoder().encode('hi 🤖').length);
  const ptr2 = h.realloc(ptr, 96);
  assert.equal(h.readCString(ptr2), 'hi 🤖');
  h.free(ptr2);
  assert.throws(() => h.free(ptr2), /double free/);
  assert.throws(() => h.read(-4), RangeError);
  assert.throws(() => h.calloc(Number.MAX_SAFE_INTEGER, 3), RangeError);
});

test('source nullptr and object references cross the allocator host boundary', () => {
  const runtime = new NativeRuntime(), libc = runtime.library.symbols;
  const cell = {__cReference:true,value:null};
  const release = bindSourceFreeAllocator(() => cell, libc.free);
  try {
    libc.free(null);
    const address = libc.realloc(null, 37);
    assert.ok(runtime.heap.allocations.has(address));
    const oldPointer = cell.value;
    assert.equal(oldPointer.__cReference, true);
    oldPointer.value.Free(address);
    assert.equal(runtime.heap.allocations.has(address), false);
    oldPointer.value.Free(null);
    assert.throws(() => oldPointer.value.Free(address), /double free/);
    assert.throws(() => libc.free(undefined), /requires storage from its own heap/);
    assert.throws(() => libc.realloc(undefined, 8), /requires storage from its own heap/);
    assert.equal(oldPointer.value.Alloc, undefined);
  } finally {
    release();runtime.close();
  }
  assert.equal(cell.value, null);
});
test('VirtualFS mounts authentic KenSilverman GRP archive, case-insensitively', () => {
  const v = new VirtualFS();
  const entries = v.mountGRP(syntheticGRP());
  assert.deepEqual(entries.map(e => e.name), ['first.map']);
  assert.deepEqual([...v.readFile('FIRST.MAP')], [1, 2, 3, 4, 5]);
  v.writeFile('First.Map', [9, 8]);
  assert.deepEqual([...v.readFile('first.map')], [9, 8]);
  v.remove('first.map');
  assert.deepEqual([...v.readFile('first.map')], [1, 2, 3, 4, 5]);
  assert.throws(() => v.readFile('../secret'), /Path traversal/);
  assert.throws(() => v.mountGRP(new Uint8Array(100)), /signature/);
});
test('VirtualFS catches GRP directory overflow and invalid count', () => {
  const grp = syntheticGRP();
  new DataView(grp.buffer).setUint32(28, 0xffffffff, true);
  assert.throws(() => new VirtualFS().mountGRP(grp), /outside archive/);
});
test('Real Duke archive has expected directory and maps', () => {
  const input = process.env.EDUKE_DUKE_GRP;
  if (!input) return;
  const data = fs.readFileSync(input);
  const v = new VirtualFS();
  v.mountGRP(data);
  assert.ok(v.list().filter(n => n.endsWith('.map')).length >= 40);
  assert.ok(v.readFile('E1L1.MAP').length > 10_000);
});
test('Explicit linker resolves implemented APIs and rejects missing externals', () => {
  const linker = new SymbolLinker();
  linker.register('math', { mul: (a,b) => a*b });
  assert.equal(linker.require(['mul']).mul(4,3), 12);
  assert.throws(() => linker.require(['SDL_Init', 'Game_Main']), /SDL_Init, Game_Main/);
  assert.throws(() => linker.register('duplicate', { mul: () => 0 }), /Duplicate symbol/);
  assert.equal(linker.manifest().totalSymbols, 1);
});
test('C-style I/O through ABI heap and mounted VirtualFS', () => {
  const runtime = new NativeRuntime();
  runtime.fs.mountGRP(syntheticGRP());
  const { heap } = runtime, libc = runtime.library.symbols;
  const name = heap.writeCString('FIRST.MAP'), mode = heap.writeCString('rb');
  const fd = libc.fopen(name, mode);
  const ptr = libc.malloc(16);
  assert.equal(libc.fread(ptr, 1, 5, fd), 5);
  assert.deepEqual([...heap.bytes(ptr, 5)], [1, 2, 3, 4, 5]);
  assert.equal(libc.ftell(fd), 5);
  assert.equal(libc.fseek(fd, -3, 1), 0);
  assert.equal(libc.fread(ptr, 1, 3, fd), 3);
  assert.deepEqual([...heap.bytes(ptr, 3)], [3, 4, 5]);
  assert.equal(libc.fclose(fd), 0);
  assert.throws(() => libc.fread(ptr, 1, 1, fd), /EBADF/);
  runtime.registerCompiledModule('generated.math', { sum: (a,b)=>a+b }, ['memcpy']);
  assert.equal(runtime.linker.require(['sum']).sum(3, 4), 7);
  assert.throws(() => runtime.registerCompiledModule('missing', {}, ['RealEDukeEngineMain']), /Unresolved external/);
  runtime.close();
});
