/** IEEE-754 fused multiply-add, with one final round-to-nearest/ties-even.
 *
 * JavaScript has no native fma. The usual a*b+c is NOT generally equivalent
 * to llvm.fmuladd: it can round twice. This implementation uses exact binary
 * integer arithmetic for finite inputs before rounding to the requested
 * floating-point format. It intentionally does not model alternative FP
 * rounding modes or floating-point exception status flags.
 */
const bits = new DataView(new ArrayBuffer(8));
function unpack(x, width) {
  if (width === 32) {
    bits.setFloat32(0, x, true);
    const u=BigInt(bits.getUint32(0, true));
    const sign=(u>>31n)&1n;
    const exp=Number((u>>23n)&255n), fraction=u&((1n<<23n)-1n);
    if (exp===255) return {sign, kind:fraction?'nan':'inf'};
    return {sign,kind:'finite',mant:exp?((1n<<23n)|fraction):fraction,
      exponent:(exp?exp-127:1-127)-23};
  }
  bits.setFloat64(0, x, true);
  const u=bits.getBigUint64(0,true);
  const sign=(u>>63n)&1n;
  const exp=Number((u>>52n)&2047n),fraction=u&((1n<<52n)-1n);
  if (exp===2047) return {sign,kind:fraction?'nan':'inf'};
  return {sign,kind:'finite',mant:exp?((1n<<52n)|fraction):fraction,
    exponent:(exp?exp-1023:1-1023)-52};
}
function toFloat(sign,expField,fraction,width) {
  if (width===32) {
    const u=(sign<<31n)|(BigInt(expField)<<23n)|fraction;
    bits.setUint32(0,Number(u),true);return bits.getFloat32(0,true);
  }
  bits.setBigUint64(0,(sign<<63n)|(BigInt(expField)<<52n)|fraction,true);
  return bits.getFloat64(0,true);
}
function roundedShift(value,shift) {
  if (shift<=0) return value<<BigInt(-shift);
  const n=BigInt(shift), q=value>>n, remainder=value-(q<<n), halfway=1n<<(n-1n);
  return remainder>halfway || (remainder===halfway && (q&1n)===1n) ? q+1n:q;
}
function encodeSigned(sign,positiveMant,exponent,width) {
  const f=width===32?23:52, bias=width===32?127:1023;
  const maxExp=bias,minNorm=1-bias;
  if (positiveMant===0n) return toFloat(sign,0,0n,width);
  let highest=positiveMant.toString(2).length+exponent-1;
  const inf=width===32?255:2047;
  if (highest>maxExp)return toFloat(sign,inf,0n,width);
  if (highest>=minNorm) {
    const length=positiveMant.toString(2).length;
    let significand=roundedShift(positiveMant,length-(f+1));
    if (significand === (1n<<BigInt(f+1))) {significand >>=1n;highest++;}
    if (highest>maxExp)return toFloat(sign,inf,0n,width);
    return toFloat(sign,highest+bias,significand-(1n<<BigInt(f)),width);
  }
  const subExp=minNorm-f;
  const significand=roundedShift(positiveMant,subExp-exponent);
  if (significand >= (1n<<BigInt(f))) return toFloat(sign,1,0n,width);
  return toFloat(sign,0,significand,width);
}
export function fusedMultiplyAdd(a,b,c,width) {
  if (width!==32 && width!==64) throw RangeError('Unsupported IEEE binary format');
  const x=unpack(a,width),y=unpack(b,width),z=unpack(c,width);
  if (x.kind==='nan'||y.kind==='nan'||z.kind==='nan') return NaN;
  const productSign=x.sign^y.sign;
  if ((x.kind==='inf'&&y.mant===0n)||(y.kind==='inf'&&x.mant===0n))return NaN;
  if (x.kind==='inf'||y.kind==='inf') {
    if(z.kind==='inf'&&productSign!==z.sign)return NaN;
    return productSign?-Infinity:Infinity;
  }
  if(z.kind==='inf')return z.sign?-Infinity:Infinity;
  const xyMant=x.mant*y.mant,xyExp=x.exponent+y.exponent;
  const exp=Math.min(xyExp,z.exponent);
  const xy=(productSign?-xyMant:xyMant)<<BigInt(xyExp-exp);
  const zm=(z.sign?-z.mant:z.mant)<<BigInt(z.exponent-exp);
  const result=xy+zm;
  if(result===0n) {
    // In round-to-nearest, exact cancellation gives +0 unless both terms
    // were negative zero; this also covers -0*-0 + -0 correctly.
    return productSign===1n && z.sign===1n ? -0 : 0;
  }
  return encodeSigned(result<0n?1n:0n,result<0n?-result:result,exp,width);
}
