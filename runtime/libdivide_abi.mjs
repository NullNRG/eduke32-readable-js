/**
 * Source-equivalent scalar divider generators from the bundled libdivide.h.
 * Browser-native, no CPU emulation or game-specific data. Numbers represent
 * signed 32-bit inputs; bigint represents signed 64-bit inputs exactly.
 * The output records have the same two fields as libdivide_s{32,64}_t.
 */
const NEG = 0x80, ADD = 0x40;
// The bundled header packs each scalar divider to {magic, uint8_t more}.
// Return both its readable fields and its exact LP64 source byte ABI, so a
// source-compiled implicit record assignment copies real bytes in place.
function dividerRecord(magic,more,bits,signed) {
  const width=bits/8,bytes=new Uint8Array(width+1),view=new DataView(bytes.buffer);
  const native=bits===64?(signed?'BigInt64Array':'BigUint64Array'):(signed?'Int32Array':'Uint32Array');
  const schema={align:1,arrayAlign:1,fields:{magic:{native,offset:0,size:width},more:{native:'Uint8Array',offset:width,size:1}},overlaps:false,size:width+1,union:false};
  const read=bits===64?(signed?'getBigInt64':'getBigUint64'):(signed?'getInt32':'getUint32');
  const write=bits===64?(signed?'setBigInt64':'setBigUint64'):(signed?'setInt32':'setUint32');
  const result={};
  Object.defineProperties(result,{
    magic:{enumerable:true,get:()=>view[read](0,true),set:value=>view[write](0,bits===64?BigInt(value):Number(value),true)},
    more:{enumerable:true,get:()=>bytes[width],set:value=>{bytes[width]=Number(value);}},
    [Symbol.for('source-first.original-record-storage/1')]:{value:true},
    [Symbol.for('source-first.original-byte-record-storage/1')]:{value:Object.freeze({bytes,schema:JSON.stringify(schema)})}
  });
  result.magic=magic;result.more=more;return result;
}
function generate(d, bits, branchfree) {
  const width=BigInt(bits);
  if (bits===32) {
    if (typeof d !== 'number' || !Number.isInteger(d) || d < -2147483648 || d > 2147483647)
      throw new RangeError('s32 generator requires a signed 32-bit integer');
  } else if (typeof d !== 'bigint' || BigInt.asIntN(64,d)!==d) {
    throw new RangeError('s64 generator requires an exact signed 64-bit bigint');
  }
  const n=BigInt(d);
  if(n===0n)throw new RangeError('libdivide cannot generate a zero divisor');
  const magnitude=n<0n?-n:n;
  const log=magnitude.toString(2).length-1;
  let magic=0n, more=0;
  if ((magnitude&(magnitude-1n))===0n) {
    more=log|(n<0n?NEG:0);
  } else {
    // This is libdivide's double-width integer quotient; BigInt avoids loss
    // of precision in the original uint128 / uint64 intermediate.
    const numerator=1n << BigInt(log + bits-1);
    let proposal=numerator/magnitude;
    const rem=numerator%magnitude;
    if(!branchfree && magnitude-rem<(1n<<BigInt(log))){
      more=log-1;
    } else {
      proposal=proposal*2n;
      if(rem*2n>=magnitude)proposal+=1n;
      more=log|ADD;
    }
    magic=BigInt.asIntN(bits,proposal+1n);
    if(n<0n){
      more|=NEG;
      if(!branchfree)magic=BigInt.asIntN(bits,-magic);
    }
  }
  return dividerRecord(bits===32?Number(magic):magic,more,bits,true);
}
export function libdivide_s32_gen(d){return generate(d,32,false);}
export function libdivide_s32_branchfree_gen(d){return generate(d,32,true);}
export function libdivide_s64_gen(d){return generate(d,64,false);}
export function libdivide_s64_branchfree_gen(d){return generate(d,64,true);}

// libdivide_internal_u32_gen from the bundled header. BigInt implements the
// helper's exact 64/32 quotient; each original uint32_t operation wraps at 32.
function generateUnsigned32(d, branchfree) {
  if (!Number.isInteger(d) || d < 1 || d > 0xffffffff)
    throw new RangeError('u32 generator requires a nonzero unsigned 32-bit integer');
  if (branchfree && d === 1)
    throw new RangeError('libdivide branchfree unsigned divisor cannot be one');
  const log = 31 - Math.clz32(d);
  if ((BigInt(d) & (BigInt(d)-1n)) === 0n)
    return dividerRecord(0,log-Number(branchfree),32,false);
  const numerator = 1n << BigInt(32+log), divisor = BigInt(d);
  let proposal = Number(numerator/divisor), remainder = Number(numerator%divisor);
  let more = log;
  if (branchfree || d-remainder >= 2**log) {
    proposal = (proposal+proposal) >>> 0;
    const twice = (remainder+remainder) >>> 0;
    if (twice >= d || twice < remainder) proposal = (proposal+1) >>> 0;
    more |= ADD;
  }
  return dividerRecord((proposal+1)>>>0,branchfree ? more & 0x1f : more,32,false);
}
export function libdivide_u32_gen(d){return generateUnsigned32(d,false);}
export function libdivide_u32_branchfree_gen(d){return generateUnsigned32(d,true);}
