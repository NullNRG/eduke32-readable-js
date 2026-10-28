/**
 * Source-equivalent scalar divider generators from the bundled libdivide.h.
 * Browser-native, no CPU emulation or game-specific data. Numbers represent
 * signed 32-bit inputs; bigint represents signed 64-bit inputs exactly.
 * The output records have the same two fields as libdivide_s{32,64}_t.
 */
const NEG = 0x80, ADD = 0x40;
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
  return {magic:bits===32?Number(magic):magic,more};
}
export function libdivide_s32_gen(d){return generate(d,32,false);}
export function libdivide_s32_branchfree_gen(d){return generate(d,32,true);}
export function libdivide_s64_gen(d){return generate(d,64,false);}
export function libdivide_s64_branchfree_gen(d){return generate(d,64,true);}
