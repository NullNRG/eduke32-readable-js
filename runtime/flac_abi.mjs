/** A synchronous, source-neutral native FLAC ABI for the x86-64 LLVM JS heap.
 * Metadata, PCM fixed/LPC/Rice decoding and callback invocation are implemented
 * in JS. No subprocess, network access, remote wasm, or browser codec promise.
 * FLAC stream format: https://xiph.org/flac/format.html
 * Original FLAC C header structures were layout-checked against the source's
 * supplied FLAC/format.h using a native offsetof probe.
 */
const enc=new TextEncoder();
const big16=(b,p)=>(b[p]<<8)|b[p+1];
const big24=(b,p)=>(b[p]*65536)+(b[p+1]<<8)+b[p+2];
function metadataBlocks(bytes){
  if(bytes.length<4||String.fromCharCode(...bytes.subarray(0,4))!=='fLaC')throw Error('Invalid native FLAC header');
  let at=4,done=false;const blocks=[];
  while(!done){
    if(at+4>bytes.length)throw Error('Truncated FLAC metadata');
    const h=bytes[at],type=h&127,len=big24(bytes,at+1);done=!!(h&128);at+=4;
    if(at+len>bytes.length)throw Error('Truncated FLAC metadata body');
    blocks.push({type,data:bytes.slice(at,at+len)});at+=len;
    if(blocks.length>10000)throw Error('FLAC metadata block limit');
  }
  if(!blocks.length||blocks[0].type!==0||blocks[0].data.length!==34)throw Error('Missing FLAC STREAMINFO');
  return {blocks,frameOffset:at};
}
function streamInfo(b){
  const packed=(BigInt(b[10])<<56n)|(BigInt(b[11])<<48n)|(BigInt(b[12])<<40n)|(BigInt(b[13])<<32n)|
     (BigInt(b[14])<<24n)|(BigInt(b[15])<<16n)|(BigInt(b[16])<<8n)|BigInt(b[17]);
  return {sampleRate:Number((packed>>44n)&1048575n),channels:Number((packed>>41n)&7n)+1,
    bits:Number((packed>>36n)&31n)+1,totalSamples:packed&((1n<<36n)-1n),
    minBlock:big16(b,0),maxBlock:big16(b,2)};
}
class Bits {
  constructor(b,at=0){this.b=b;this.p=at*8;}
  read(n){if(n<0||n>32||this.p+n>this.b.length*8)throw Error('Truncated FLAC frame');let v=0;
    for(let i=0;i<n;i++){v=(v*2)|((this.b[this.p>>3]>>(7-(this.p&7)))&1);this.p++;}return v>>>0;}
  signed(n){if(n===0)return 0;const v=this.read(n);return n===32?v|0:(v & (2**(n-1))) ? v-2**n:v;}
  unary(){let n=0;while(this.read(1)===0){if(++n>1e7)throw Error('Invalid FLAC unary code');}return n;}
  align(){this.p=(this.p+7)&~7;}
  get byte(){return this.p>>3;}
}
function flacFrame(bytes,offset,info){
  const bits=new Bits(bytes,offset);
  if(bits.read(14)!==0x3ffe||bits.read(1)!==0)throw Error('FLAC frame sync missing');
  const variable=bits.read(1),blockCode=bits.read(4),rateCode=bits.read(4),channelCode=bits.read(4),sampleCode=bits.read(3);
  if(bits.read(1)!==0)throw Error('FLAC reserved frame header bit');
  // UTF-8 variable-length frame/sample number. Continuations must begin '10'.
  const first=bits.read(8);let number=BigInt(first),remain=0;
  if(first>=0x80){
    let leading=0;for(let mask=0x80;first&mask;mask>>=1)leading++;
    if(leading<2||leading>7)throw Error('Invalid UTF-8 FLAC sample number');remain=leading-1;
    number=BigInt(first&((1<<(7-leading))-1));
    for(let i=0;i<remain;i++){const b=bits.read(8);if((b&0xc0)!==0x80)throw Error('Invalid FLAC sample continuation');number=(number<<6n)|BigInt(b&63);}
  }
  let block=({1:192,2:576,3:1152,4:2304,5:4608,8:256,9:512,10:1024,11:2048,12:4096,13:8192,14:16384,15:32768})[blockCode];
  if(blockCode===6)block=bits.read(8)+1;
  if(blockCode===7)block=bits.read(16)+1;
  if(!block||block>65535)throw Error('Unsupported FLAC frame block size');
  let sampleRate=({1:88200,2:176400,3:192000,4:8000,5:16000,6:22050,7:24000,8:32000,9:44100,10:48000,11:96000})[rateCode]??info.sampleRate;
  if(rateCode===12)sampleRate=bits.read(8)*1000;
  if(rateCode===13)sampleRate=bits.read(16);
  if(rateCode===14)sampleRate=bits.read(16)*10;
  if(rateCode===15||blockCode===0||channelCode>10)throw Error('Reserved FLAC header code');
  let bps=({1:8,2:12,4:16,5:20,6:24})[sampleCode]??info.bits;
  if(sampleCode===3||sampleCode===7)throw Error('Reserved FLAC sample size');
  const headerCRC=bits.read(8);
  let crc=0;for(let j=offset;j<bits.byte-1;j++){crc^=bytes[j];for(let k=0;k<8;k++)crc=(crc&128)?((crc<<1)^7)&255:(crc<<1)&255;}
  if(crc!==headerCRC)throw Error('FLAC header CRC8 mismatch');
  const channels=channelCode<=7?channelCode+1:2;
  const pcm=[];
  for(let c=0;c<channels;c++){
    const effectiveBps=bps+((channelCode===8&&c===1)||(channelCode===9&&c===0)||(channelCode===10&&c===1)?1:0);
    if(bits.read(1)!==0)throw Error('Invalid FLAC subframe padding');
    const sub=bits.read(6),wasted=bits.read(1)?bits.unary()+1:0,width=effectiveBps-wasted;
    if(width<1||width>32)throw Error('Unsupported FLAC sample bit depth');
    const x=new Array(block);
    if(sub===0){const v=bits.signed(width);x.fill(v);}
    else if(sub===1){for(let i=0;i<block;i++)x[i]=bits.signed(width);}
    else if((sub>=8&&sub<=12)||(sub>=32&&sub<=63)){
      const fixed=sub<32,order=fixed?sub-8:sub-31;
      if(order>block)throw Error('FLAC predictor larger than block');
      for(let i=0;i<order;i++)x[i]=bits.signed(width);
      let precision=0,shift=0,coefs=[];
      if(!fixed){precision=bits.read(4)+1;if(precision===16)throw Error('Invalid FLAC LPC precision');shift=bits.signed(5);
        for(let i=0;i<order;i++)coefs.push(bits.signed(precision));}
      const method=bits.read(2),partOrder=bits.read(4);
      if(method>1||block%(1<<partOrder)!==0)throw Error('Invalid FLAC residual method');
      const partitionCount=1<<partOrder,per=block/partitionCount;let cursor=order;
      for(let part=0;part<partitionCount;part++){
        const parameterBits=method===0?4:5,escape=(1<<parameterBits)-1,parameter=bits.read(parameterBits);
        const count=per-(part===0?order:0);
        const rawBits=parameter===escape?bits.read(5):0;
        for(let n=0;n<count;n++){
          const u=parameter===escape?bits.signed(rawBits):((bits.unary()*2**parameter)+bits.read(parameter));
          let v=parameter===escape?u:((u&1)?-((u+1)/2):u/2);
          if(fixed){
            const a=x[cursor-1]??0,b=x[cursor-2]??0,d=x[cursor-3]??0,e=x[cursor-4]??0;
            const p=order===0?0:order===1?a:order===2?2*a-b:order===3?3*a-3*b+d:4*a-6*b+4*d-e;
            v+=p;
          }else{
            let sum=0;for(let j=0;j<order;j++)sum+=coefs[j]*x[cursor-j-1];
            v+=shift>=0?Math.floor(sum/2**shift):sum*2**(-shift);
          }
          if(!Number.isSafeInteger(v)||v<-(2**31)||v>=2**31)throw Error('FLAC decoded sample overflow');
          x[cursor++]=v;
        }
      }
    }else throw Error('Reserved FLAC subframe type');
    if(wasted)for(let j=0;j<x.length;j++)x[j]*=2**wasted;
    pcm.push(x);
  }
  if(channelCode>=8){const l=pcm[0],r=pcm[1];for(let i=0;i<block;i++){
    const a=l[i],b=r[i];
    if(channelCode===8){r[i]=a-b;}
    if(channelCode===9){l[i]=a+b;}
    if(channelCode===10){const mid=a*2+(b&1);l[i]=Math.floor((mid+b)/2);r[i]=Math.floor((mid-b)/2);}
  }}
  bits.align();const payloadEnd=bits.byte;
  const expected=bits.read(16);let crc16=0;
  for(let j=offset;j<payloadEnd;j++){crc16^=bytes[j]<<8;for(let k=0;k<8;k++)crc16=(crc16&0x8000)?((crc16<<1)^0x8005)&65535:(crc16<<1)&65535;}
  if(expected!==crc16)throw Error('FLAC frame CRC16 mismatch');
  return {pcm,block,channels,bps,sampleRate,number,numberType:variable?1:0,bytesRead:bits.byte-offset};
}
export function createFLACABI({heap,callIndirect}={}){
  if(!heap||typeof callIndirect!=='function')throw TypeError('FLAC ABI needs heap and C callback dispatcher');
  const decoders=new Map(),chains=new Map(),iterators=new Map(),owned=new Map();
  const cstrCache=new Map();
  const cstr=s=>{if(!cstrCache.has(s))cstrCache.set(s,heap.writeCString(s));return cstrCache.get(s);};
  const check=(map,ptr,kind)=>{const o=map.get(Number(ptr));if(!o)throw Error('Invalid FLAC '+kind+' handle');return o;};
  const callback=(ptr,args)=>ptr?callIndirect(Number(ptr),args):undefined;
  const writeMetadata=blk=>{
    const ptr=heap.calloc(1,176);owned.set(ptr,[]);
    heap.write(ptr,'i32',blk.type);heap.write(ptr+8,'u32',blk.data.length);
    if(blk.type===0){const d=blk.data,inf=streamInfo(d);
      heap.write(ptr+16,'u16',inf.minBlock);heap.write(ptr+18,'u16',inf.maxBlock);
      heap.write(ptr+20,'u32',big24(d,4));heap.write(ptr+24,'u32',big24(d,7));
      heap.write(ptr+32,'u32',inf.sampleRate);heap.write(ptr+36,'u32',inf.channels);
      heap.write(ptr+40,'u32',inf.bits);heap.write(ptr+48,'u64',inf.totalSamples);
      heap.u8.set(d.subarray(18,34),ptr+56);
    }else if(blk.type===4){const d=blk.data,view=new DataView(d.buffer,d.byteOffset,d.byteLength);let at=0;
      const le=()=>{if(at+4>d.length)throw Error('FLAC comment length');const v=view.getUint32(at,true);at+=4;return v;};
      const vendorLength=le();if(at+vendorLength>d.length)throw Error('FLAC vendor length');
      const vendor=heap.calloc(vendorLength+1,1);heap.u8.set(d.subarray(at,at+vendorLength),vendor);at+=vendorLength;
      heap.write(ptr+16,'u32',vendorLength);heap.write(ptr+24,'u64',BigInt(vendor));owned.get(ptr).push(vendor);
      const count=le();if(count>100000||count>Math.floor((d.length-at)/4))throw Error('FLAC comment count');
      const entries=heap.calloc(count||1,16);heap.write(ptr+32,'u32',count);heap.write(ptr+40,'u64',BigInt(entries));owned.get(ptr).push(entries);
      for(let i=0;i<count;i++){const size=le();if(at+size>d.length)throw Error('FLAC comment entry');
        const value=heap.calloc(size+1,1);heap.u8.set(d.subarray(at,at+size),value);at+=size;
        heap.write(entries+i*16,'u32',size);heap.write(entries+i*16+8,'u64',BigInt(value));owned.get(ptr).push(value);}
    }
    return ptr;
  };
  const freeMetadata=ptr=>{if(!owned.has(Number(ptr)))return;for(const o of owned.get(Number(ptr)))heap.free(o);owned.delete(Number(ptr));heap.free(Number(ptr));};
  const readDecoder=(o)=>{
    if(o.bytes)return;
    const parts=[],buf=heap.malloc(8192),count=heap.malloc(8);let size=0;
    try{for(let t=0;t<16384;t++){
      heap.write(count,'u64',8192n);const status=Number(callback(o.callbacks.read,[o.ptr,buf,count,o.client]));
      const n=Number(heap.read(count,'u64'));
      if(status===1)break;
      if(status!==0||!Number.isSafeInteger(n)||n<=0||n>8192)throw Error('FLAC decoder read callback aborted');
      parts.push(heap.bytes(buf,n));size+=n;if(size>128*1024*1024)throw Error('FLAC stream exceeds 128MB safety limit');
    }}finally{heap.free(buf);heap.free(count);}
    o.bytes=new Uint8Array(size);let at=0;for(const p of parts){o.bytes.set(p,at);at+=p.length;}
    o.meta=metadataBlocks(o.bytes);o.offset=0;
  };
  const statusStrings=['SEARCH_FOR_METADATA','READ_METADATA','SEARCH_FOR_FRAME_SYNC','READ_FRAME','END_OF_STREAM','OGG_ERROR','SEEK_ERROR','ABORTED','MEMORY_ALLOCATION_ERROR','UNINITIALIZED'];
  const symbols={
    FLAC__stream_decoder_new:()=>{const ptr=heap.calloc(1,16);decoders.set(ptr,{ptr,state:9,ignored:false,bytes:null,offset:0,metaIndex:0});return ptr;},
    FLAC__stream_decoder_delete:ptr=>{check(decoders,ptr,'decoder');decoders.delete(ptr);heap.free(Number(ptr));},
    FLAC__stream_decoder_set_metadata_ignore_all:ptr=>{check(decoders,ptr,'decoder').ignored=true;return 1;},
    FLAC__stream_decoder_init_stream:(ptr,read,seek,tell,length,eof,write,metadata,error,client)=>{
      const o=check(decoders,ptr,'decoder');if(!read||!write||!error)return 3;
      o.callbacks={read,seek,tell,length,eof,write,metadata,error};o.client=client;o.state=0;o.bytes=null;o.meta=null;o.metaIndex=0;return 0;
    },
    FLAC__stream_decoder_process_single:ptr=>{
      const o=check(decoders,ptr,'decoder');if(o.state>=5||o.state===4)return 0;
      try{
        readDecoder(o);o.state=1;
        if(o.metaIndex<o.meta.blocks.length){const b=o.meta.blocks[o.metaIndex++];
          if(o.callbacks.metadata && (!o.ignored||b.type===0)){
            const p=writeMetadata(b);try{callback(o.callbacks.metadata,[ptr,p,o.client]);}finally{freeMetadata(p);}
          }
          o.state=2;return 1;
        }
        const start=o.offset||o.meta.frameOffset;
        if(start>=o.bytes.length){o.state=4;return 1;}
        const f=flacFrame(o.bytes,start,streamInfo(o.meta.blocks[0].data));
        o.offset=start+f.bytesRead;o.state=3;
        const frame=heap.calloc(1,2608),channelPointers=heap.calloc(f.channels,8),samples=[];
        try{
          heap.write(frame,'u32',f.block);heap.write(frame+4,'u32',f.sampleRate);heap.write(frame+8,'u32',f.channels);
          heap.write(frame+12,'u32',f.channels===2?1:0);heap.write(frame+16,'u32',f.bps);
          heap.write(frame+20,'u32',f.numberType);heap.write(frame+24,'u64',f.number);
          for(let c=0;c<f.channels;c++){const p=heap.malloc(f.block*4);samples.push(p);
            for(let i=0;i<f.block;i++)heap.write(p+i*4,'i32',f.pcm[c][i]);
            heap.write(channelPointers+c*8,'u64',BigInt(p));}
          const result=Number(callback(o.callbacks.write,[ptr,frame,channelPointers,o.client]));
          if(result!==0){o.state=7;return 0;}
        }finally{for(const p of samples)heap.free(p);heap.free(channelPointers);heap.free(frame);}
        o.state=o.offset>=o.bytes.length?4:2;return 1;
      }catch(err){o.state=7;o.lastError=String(err);callback(o.callbacks.error,[ptr,0,o.client]);return 0;}
    },
    FLAC__stream_decoder_get_state:ptr=>check(decoders,ptr,'decoder').state,
    FLAC__stream_decoder_get_resolved_state_string:ptr=>cstr(statusStrings[check(decoders,ptr,'decoder').state]??'UNKNOWN'),
    FLAC__stream_decoder_get_decode_position:(ptr,buf)=>{const o=check(decoders,ptr,'decoder');if(!o.bytes||!buf)return 0;heap.write(buf,'u64',BigInt(o.offset||o.meta.frameOffset));return 1;},
    FLAC__stream_decoder_flush:ptr=>{const o=check(decoders,ptr,'decoder');if(o.state===9)return 0;o.state=2;return 1;},
    FLAC__stream_decoder_finish:ptr=>{const o=check(decoders,ptr,'decoder');o.bytes=null;o.state=9;return 1;},
    FLAC__stream_decoder_seek_absolute:(ptr,sample)=>{
      const o=check(decoders,ptr,'decoder');try{
        readDecoder(o);let at=o.meta.frameOffset,position=0n;const target=BigInt(sample),inf=streamInfo(o.meta.blocks[0].data);
        if(!o.callbacks.seek){o.state=6;return 0;}
        while(at<o.bytes.length){const f=flacFrame(o.bytes,at,inf);const sampleAt=f.numberType===1?f.number:f.number*BigInt(f.block);
          if(sampleAt+BigInt(f.block)>target){
            if(Number(callback(o.callbacks.seek,[ptr,BigInt(at),o.client]))!==0){o.state=6;return 0;}
            o.offset=at;o.state=2;return 1;}
          at+=f.bytesRead;position=sampleAt+BigInt(f.block);
        }
        o.state=6;return 0;
      }catch{o.state=6;return 0;}
    },
    FLAC__metadata_chain_new:()=>{const p=heap.calloc(1,8);chains.set(p,{blocks:[],pointers:[],status:0});return p;},
    FLAC__metadata_chain_status:ptr=>check(chains,ptr,'metadata chain').status,
    FLAC__metadata_chain_delete:ptr=>{const o=check(chains,ptr,'metadata chain');
      for(const p of o.pointers)freeMetadata(p);chains.delete(Number(ptr));heap.free(Number(ptr));},
    FLAC__metadata_chain_read_with_callbacks:(ptr,handle,callbacksPtr)=>{
      const o=check(chains,ptr,'metadata chain');const callbacks=[];
      heap.check(Number(callbacksPtr),48);
      for(let i=0;i<6;i++)callbacks.push(Number(heap.read(Number(callbacksPtr)+i*8,'u64')));
      if(!callbacks[0]){o.status=2;return 0;}
      const buf=heap.malloc(4096),parts=[];let size=0;
      try{
        if(callbacks[2])callback(callbacks[2],[handle,0n,0]);
        for(let i=0;i<32768;i++){
          const n=Number(callback(callbacks[0],[buf,1n,4096n,handle]));
          if(!Number.isSafeInteger(n)||n<0||n>4096)throw Error('Invalid FLAC metadata read callback');
          if(n===0)break;parts.push(heap.bytes(buf,n));size+=n;
          if(size>128*1024*1024)throw Error('FLAC stream exceeds metadata safety limit');
        }
        const b=new Uint8Array(size);let at=0;for(const p of parts){b.set(p,at);at+=p.length;}
        const meta=metadataBlocks(b);for(const old of o.pointers)freeMetadata(old);
        o.blocks=meta.blocks;o.pointers=meta.blocks.map(writeMetadata);o.status=0;return 1;
      }catch(e){o.status=5;return 0;}finally{heap.free(buf);}
    },
    FLAC__metadata_iterator_new:()=>{const p=heap.calloc(1,8);iterators.set(p,{chain:null,index:0});return p;},
    FLAC__metadata_iterator_init:(ptr,chain)=>{const it=check(iterators,ptr,'iterator');it.chain=check(chains,chain,'chain');it.index=0;},
    FLAC__metadata_iterator_get_block:ptr=>{const it=check(iterators,ptr,'iterator');if(!it.chain)return 0;return it.chain.pointers[it.index]??0;},
    FLAC__metadata_iterator_next:ptr=>{const it=check(iterators,ptr,'iterator');if(!it.chain||it.index+1>=it.chain.pointers.length)return 0;it.index++;return 1;},
    FLAC__metadata_iterator_delete:ptr=>{check(iterators,ptr,'iterator');iterators.delete(Number(ptr));heap.free(Number(ptr));},
    FLAC__metadata_object_delete:ptr=>{ // Metadata obtained from iterator is owned by the chain; avoid double free.
      for(const chain of chains.values())if(chain.pointers.includes(Number(ptr)))return;
      freeMetadata(Number(ptr));
    },
  };
  return Object.freeze(symbols);
}
