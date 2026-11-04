import test from 'node:test';
import assert from 'node:assert/strict';
import {ABIHeap} from '../../runtime/abi.mjs';
import {createSDLBrowser} from '../../runtime/sdl_browser.mjs';

test('controller database RWops retain original bytes, close ownership and explicit unsupported failure',()=>{
 const heap=new ABIHeap(),baseline=heap.allocations.size;
 const bytes=Uint8Array.from([65,66,67,10]);
 const s=createSDLBrowser({heap}).symbols;
 const rw=s.SDL_RWFromConstMem(bytes,bytes.length);
 assert.ok(heap.allocations.has(rw));
 assert.equal(s.SDL_GameControllerAddMappingsFromRW(rw,1),-1);
 assert.ok(!heap.allocations.has(rw));
 assert.match(heap.readCString(s.SDL_GetError()),/native SDL2 service/);
 assert.equal(s.SDL_RWclose(rw),-1);
 assert.deepEqual([...bytes],[65,66,67,10]);
 // SDL_GetError owns one cached string allocation; ordinary RWops own only
 // their handles, never the caller's input memory.
 const input=heap.malloc(4);heap.u8.set(bytes,input);
 let seen;
 const native=createSDLBrowser({heap,controllerMappings:value=>{
   seen=value;assert.equal(value.buffer,heap.buffer);return 2;
 }}).symbols;
 const allocations=heap.allocations.size;
 const handle=native.SDL_RWFromConstMem(heap.borrow(input,4),4);
 assert.equal(native.SDL_GameControllerAddMappingsFromRW(handle,0),2);
 assert.equal(seen.byteOffset,input);assert.ok(heap.allocations.has(handle));
 assert.equal(native.SDL_RWclose(handle),0);assert.ok(heap.allocations.has(input));
 heap.free(input);assert.equal(heap.allocations.size,allocations-1);
 assert.ok(allocations>=baseline);
});
