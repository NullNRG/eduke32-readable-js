const readBitField=(bytes,field)=>{
 const count=Math.ceil((field.bit_start+field.bit_width)/8);let raw=0n;
 for(let i=0;i<count;i++)raw|=BigInt(bytes[field.offset+i])<<BigInt(i*8);
 let value=BigInt.asUintN(field.bit_width,raw>>BigInt(field.bit_start));
 if(field.signed)value=BigInt.asIntN(field.bit_width,value);
 return field.boolean?value!==0n:field.wide?value:Number(value);
};
const writeBitField=(bytes,field,value)=>{
 const count=Math.ceil((field.bit_start+field.bit_width)/8),mask=((1n<<BigInt(field.bit_width))-1n)<<BigInt(field.bit_start);let raw=0n;
 for(let i=0;i<count;i++)raw|=BigInt(bytes[field.offset+i])<<BigInt(i*8);
 raw=(raw&~mask)|(BigInt.asUintN(field.bit_width,BigInt(value))<<BigInt(field.bit_start));
 for(let i=0;i<count;i++)bytes[field.offset+i]=Number((raw>>BigInt(i*8))&255n);
};
