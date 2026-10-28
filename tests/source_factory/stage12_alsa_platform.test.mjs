import test from 'node:test';import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';
test('missing browser ALSA sequencer selects original source error path and safely initialises pointers',()=>{
 const ctx=new LLVMContext(),h=ctx.heap,s=ctx.libraries;
 const funcs=h.malloc(56);h.memset(funcs,255,56);
 assert.equal(s._Z17ALSADrv_MIDI_InitP9midifuncs(funcs),-1);
 assert.deepEqual([...h.bytes(funcs,56)],new Array(56).fill(0));
 assert.equal(s._Z16ALSADrv_GetErrorv(),2);
 assert.match(h.readCString(s._Z19ALSADrv_ErrorStringi(-1)),/snd_seq_open/);
 assert.equal(s._Z26ALSADrv_MIDI_StartPlaybackv(),-1);
 assert.equal(s._Z16ALSADrv_GetErrorv(),1);
 const vec=h.malloc(24);h.memset(vec,255,24);
 s._Z22ALSADrv_MIDI_ListPortsv(vec);assert.deepEqual([...h.bytes(vec,24)],new Array(24).fill(0));
 assert.doesNotThrow(()=>{s._Z17ALSADrv_MIDI_Lockv();s._Z19ALSADrv_MIDI_Unlockv();s._Z25ALSADrv_MIDI_HaltPlaybackv();s._Z21ALSADrv_MIDI_Shutdownv();});
 assert.throws(()=>s._Z21ALSADrv_MIDI_SetTempoii(120,96),/uninitialised/);
});
