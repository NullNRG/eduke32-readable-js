import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ABIHeap} from '../../runtime/abi.mjs';
import {createFLACABI} from '../../runtime/flac_abi.mjs';
const raw=new Uint8Array(readFileSync(new URL('../fixtures/sine22050.flac',import.meta.url)));
test('original libFLAC read/write callbacks receive real decoded PCM and actual frame headers',()=>{
 const heap=new ABIHeap(1<<20,8<<20),handlers=new Map();let seq=1000,position=0,samples=[],headers=[],errors=[];
 const add=fn=>{handlers.set(++seq,fn);return seq;};
 const dispatch=(id,args)=>{if(!handlers.has(id))throw Error('Missing callback '+id);return handlers.get(id)(...args);};
 const read=add((decoder,buf,len,user)=>{
   const n=Math.min(Number(heap.read(len,'u64')),raw.length-position);
   heap.u8.set(raw.subarray(position,position+n),buf);heap.write(len,'u64',BigInt(n));position+=n;return n?0:1;
 });
 const write=add((decoder,frame,pcm,user)=>{const n=heap.read(frame,'u32'),ch=heap.read(frame+8,'u32');
    headers.push({n,ch,sampleRate:heap.read(frame+4,'u32'),bits:heap.read(frame+16,'u32')});
    for(let i=0;i<n;i++)samples.push(heap.read(Number(heap.read(pcm,'u64'))+i*4,'i32'));
    return 0;
 });
 const error=add((decoder,status,user)=>errors.push(status));
 const sym=createFLACABI({heap,callIndirect:dispatch});
 const dec=sym.FLAC__stream_decoder_new();
 assert.equal(sym.FLAC__stream_decoder_set_metadata_ignore_all(dec),1);
 assert.equal(sym.FLAC__stream_decoder_init_stream(dec,read,0,0,0,0,write,0,error,0),0);
 for(let j=0;j<80;j++){
  const ok=sym.FLAC__stream_decoder_process_single(dec);
  if(!ok||sym.FLAC__stream_decoder_get_state(dec)===4)break;
 }
 assert.equal(errors.length,0,'FLAC decoder callback did not report errors');
 assert.ok(headers.length>0,'must decode FLAC audio frame');
 assert.equal(samples.length,2048);
 const wave=readFileSync(new URL('../fixtures/sine22050.wav',import.meta.url));
 const expected=Array.from({length:2048},(_,i)=>wave.readInt16LE(44+i*2));
 assert.deepEqual(samples,expected,'decoded FLAC PCM must match exact uncompressed original');
 assert.ok(headers.every(x=>x.sampleRate===22050&&x.bits===16&&x.ch===1));
 sym.FLAC__stream_decoder_delete(dec);
});

test('stereo high-compression FLAC and source vorbis comments are decoded through original callbacks',()=>{
 const raw=new Uint8Array(readFileSync(new URL('../fixtures/stereo44100.flac',import.meta.url)));
 const heap=new ABIHeap(1<<20,20<<20),callbacks=new Map();let next=50,pos=0;const frames=[],errors=[];
 const add=f=>{callbacks.set(++next,f);return next;};
 const dispatch=(fn,args)=>{const f=callbacks.get(Number(fn));if(!f)throw Error('missing callback '+fn);return f(...args);};
 const read=add((dec,out,count)=>{const size=Math.min(raw.length-pos,Number(heap.read(count,'u64')));
   heap.u8.set(raw.subarray(pos,pos+size),out);pos+=size;heap.write(count,'u64',BigInt(size));return size?0:1;});
 const write=add((dec,header,channels)=>{const n=heap.read(header,'u32');const pair=[];
   for(let c=0;c<2;c++){const p=Number(heap.read(channels+c*8,'u64'));
     pair.push(Array.from({length:n},(_,i)=>heap.read(p+i*4,'i32')));}
   frames.push(pair);return 0;});
 const err=add((...args)=>errors.push(args));
 const flac=createFLACABI({heap,callIndirect:dispatch}),decoder=flac.FLAC__stream_decoder_new();
 assert.equal(flac.FLAC__stream_decoder_init_stream(decoder,read,0,0,0,0,write,0,err,0),0);
 for(let i=0;i<40;i++){if(!flac.FLAC__stream_decoder_process_single(decoder))break;if(flac.FLAC__stream_decoder_get_state(decoder)===4)break;}
 assert.deepEqual(errors,[]);assert.ok(frames.length>0);
 assert.equal(frames.reduce((n,a)=>n+a[0].length,0),8192);
 const wav=readFileSync(new URL('../fixtures/stereo44100.wav',import.meta.url));
 const left=frames.flatMap(f=>f[0]),right=frames.flatMap(f=>f[1]);
 assert.deepEqual(left,Array.from({length:8192},(_,i)=>wav.readInt16LE(44+i*4)));
 assert.deepEqual(right,Array.from({length:8192},(_,i)=>wav.readInt16LE(46+i*4)));
 // Metadata callbacks use FLAC__IOCallbacks {read,write,seek,tell,eof,close}.
 let metadataPos=0;
 const mread=add((dst,elementSize,elementCount,handle)=>{
   const n=Math.min(Number(elementSize)*Number(elementCount),raw.length-metadataPos);
   heap.u8.set(raw.subarray(metadataPos,metadataPos+n),dst);metadataPos+=n;
   return BigInt(Math.floor(n/Number(elementSize)));
 });
 const mseek=add((handle,offset,whence)=>{metadataPos=Number(offset);return 0;});
 const table=heap.calloc(6,8);heap.write(table,'u64',BigInt(mread));heap.write(table+16,'u64',BigInt(mseek));
 const chain=flac.FLAC__metadata_chain_new();
 assert.equal(flac.FLAC__metadata_chain_read_with_callbacks(chain,0,table),1);
 const it=flac.FLAC__metadata_iterator_new();flac.FLAC__metadata_iterator_init(it,chain);
 const info=flac.FLAC__metadata_iterator_get_block(it);
 assert.equal(heap.read(info,'i32'),0);assert.equal(heap.read(info+32,'u32'),44100);
 assert.equal(heap.read(info+36,'u32'),2);
 let sawTag=false;
 while(flac.FLAC__metadata_iterator_next(it)){
   const blk=flac.FLAC__metadata_iterator_get_block(it);
   if(heap.read(blk,'i32')!==4)continue;
   sawTag=true;const count=heap.read(blk+32,'u32'),entries=Number(heap.read(blk+40,'u64'));
   const strings=Array.from({length:count},(_,i)=>heap.readCString(Number(heap.read(entries+i*16+8,'u64'))));
   assert.ok(strings.some(s=>s==='LOOP_START=1234'));
 }
 assert.ok(sawTag);flac.FLAC__metadata_iterator_delete(it);flac.FLAC__stream_decoder_delete(decoder);
});
