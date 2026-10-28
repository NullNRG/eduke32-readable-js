// Native-JavaScript execution of source-transpiled original EDuke32 miniz_tinfl.c.
// The test is not a replacement decompressor or a gameplay acceptance test.
import test from 'node:test';
import { strict as assert } from 'node:assert';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const built = resolve(process.env.TINFL_MODULE || 'reports/continued-boot-recovery/source/build/src/miniz_tinfl.c.mjs');
const { tinfl_decompress } = await import(pathToFileURL(built).href);
const ref = obj => ({__cReference:true, get value(){return obj.value;}, set value(value){obj.value=value;}});
const state = () => ({
  m_state:0,m_num_bits:0,m_zhdr0:0,m_zhdr1:0,m_z_adler32:0,m_final:0,
  m_type:0,m_check_adler32:0,m_dist:0,m_counter:0,m_num_extra:0,
  m_table_sizes:new Uint32Array(3),m_bit_buf:0n,m_dist_from_out_buf_start:0n,
  m_look_up:Array.from({length:3},()=>new Int16Array(1024)),
  m_tree_0:new Int16Array(576),m_tree_1:new Int16Array(64),m_tree_2:new Int16Array(38),
  m_code_size_0:new Uint8Array(288),m_code_size_1:new Uint8Array(32),m_code_size_2:new Uint8Array(19),
  m_raw_header:new Uint8Array(4),m_len_codes:new Uint8Array(457)
});
function check(input,level){
  const compressed=deflateRawSync(input,{level});
  const output=new Uint8Array(input.length+256);
  const inLength={value:compressed.length},outLength={value:output.length};
  const result=tinfl_decompress(ref({value:state()}),compressed,ref(inLength),output,output,ref(outLength),4);
  assert.equal(result,0,'original tinfl_decompress must signal DONE');
  assert.equal(Number(outLength.value),input.length);
  assert.equal(Number(inLength.value),compressed.length);
  assert.deepEqual(Buffer.from(output.subarray(0,Number(outLength.value))),input);
  assert.deepEqual(inflateRawSync(compressed),input);
}
const patterns=[
  Buffer.from('ABCD'.repeat(70)),
  Buffer.from('The quick brown fox jumps over the lazy dog '.repeat(80)),
  Buffer.from('n64 game engine/source tree '.repeat(48)),
  Buffer.from(Array.from({length:4096},(_,i)=>(i*97 + (i>>3)*53)&255)),
  Buffer.alloc(321,0xff),
  Buffer.alloc(511,0),
  Buffer.from(Array.from({length:1800},(_,i)=>(Math.imul(i+17,2654435761)>>>16)&255)),
];
for(const [i,input] of patterns.entries())for(const level of [0,1,6,9]){
  test(`original tinfl source/native JS ${i} level ${level}`,()=>check(input,level));
}
