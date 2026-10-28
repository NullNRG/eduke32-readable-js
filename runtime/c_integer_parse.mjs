/** C locale strtol/strtoul/strtoll with 64-bit long on the SysV x86-64 ABI.
 * Distinguishes C23 0b-prefix recognition from legacy strtol behavior.
 */
import {sourceByteView,sourceByteOffset} from './source_bytes.mjs';
export function createCIntegerParse({heap,errnoLocation}){
  if(!heap||typeof errnoLocation!=='function')throw TypeError('C integer parser requires ABI heap and errno');
  const isSpace=c=>c===32||(c>=9&&c<=13);
  const digit=c=>c>=48&&c<=57?c-48:c>=65&&c<=90?c-65+10:c>=97&&c<=122?c-97+10:-1;
  const parser=(allowBinaryPrefix,unsigned)=>(ptr,endPtr,base)=>{
    const borrowed=sourceByteView(ptr);
    const n=borrowed?borrowed.indexOf(0):heap.strlen(ptr);
    if(n<0)throw RangeError('C integer input lacks a NUL inside original source storage');
    const bytes=borrowed??heap.bytes(ptr,n);
    const setEnd=idx=>{
      if(!endPtr)return;
      const address=borrowed?(idx===0?ptr:sourceByteOffset(ptr,idx)):Number(ptr)+idx;
      if(endPtr.__cReference===true){endPtr.value=address;return;}
      if(borrowed)throw TypeError('Source integer end pointer requires original reference storage');
      if(typeof endPtr!=='number'&&typeof endPtr!=='bigint')
        throw TypeError('C integer end pointer lacks verified pointer storage');
      heap.write(Number(endPtr),'u64',BigInt(address));
    };
    base=Number(base);
    if(!Number.isInteger(base)||(base!==0&&(base<2||base>36))){
      heap.write(errnoLocation(),'i32',22); // EINVAL
      setEnd(0);return 0n;
    }
    let i=0;
    while(i<n&&isSpace(bytes[i]))i++;
    let negative=false;
    if(i<n&&(bytes[i]===43||bytes[i]===45)){negative=bytes[i]===45;i++;}
    // Prefix is consumed only if a digit of that base follows it.
    const prefix=(letter, radix)=>i+2<n&&bytes[i]===48&&
      (bytes[i+1]===letter||bytes[i+1]===letter-32)&&
      digit(bytes[i+2])>=0&&digit(bytes[i+2])<radix;
    if((base===0||base===16)&&prefix(120,16)){
      base=16;i+=2;
    }else if(allowBinaryPrefix&&(base===0||base===2)&&prefix(98,2)){
      base=2;i+=2;
    }else if(base===0)base=bytes[i]===48?8:10;
    const begin=i;
    let value=0n;
    const radix=BigInt(base);
    for(;i<n;i++){
      const d=digit(bytes[i]);if(d<0||d>=base)break;
      value=value*radix+BigInt(d);
    }
    if(i===begin){setEnd(0);return 0n;}
    setEnd(i);
    const MASK=(1n<<64n)-1n,MAX=(1n<<63n)-1n,MIN=1n<<63n;
    if(unsigned){
      if(value>MASK){heap.write(errnoLocation(),'i32',34);return MASK;}
      return BigInt.asUintN(64,negative?-value:value);
    }
    const bound=negative?MIN:MAX;
    if(value>bound){heap.write(errnoLocation(),'i32',34);return negative?-MIN:MAX;}
    return negative?-value:value;
  };
  const signedLegacy=parser(false,false),unsignedLegacy=parser(false,true);
  const signedC23=parser(true,false),unsignedC23=parser(true,true);
  return Object.freeze({
    strtol:signedLegacy,strtoll:signedLegacy,strtoul:unsignedLegacy,strtoull:unsignedLegacy,
    __isoc23_strtol:signedC23,__isoc23_strtoll:signedC23,
    __isoc23_strtoul:unsignedC23,__isoc23_strtoull:unsignedC23
  });
}
