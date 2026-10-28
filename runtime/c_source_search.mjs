import {sourceByteView,sourceByteOffset} from './source_bytes.mjs';

/** C byte searches for both the host heap and original source allocations. */
export function createCSourceSearch({heap}) {
  const storage=pointer=>{
    const bytes=sourceByteView(pointer);
    if(!bytes)return {read:i=>heap.read(pointer+i,'u8'),at:i=>pointer+i,
      check:n=>heap.check(pointer,n),nil:0};
    const check=n=>{if(n>bytes.byteLength)throw RangeError('C search exceeds original source bounds');};
    return {read:i=>{check(i+1);return bytes[i];},at:i=>sourceByteOffset(pointer,i),check,nil:null};
  };
  const length=object=>{let n=0;while(object.read(n)!==0)n++;return n;};
  return {
    strchr(pointer,character){
      const s=storage(pointer),c=Number(character)&255;
      for(let i=0;;i++){const byte=s.read(i);if(byte===c)return s.at(i);if(byte===0)return s.nil;}
    },
    strrchr(pointer,character){
      const s=storage(pointer),c=Number(character)&255;let hit=s.nil;
      for(let i=0;;i++){const byte=s.read(i);if(byte===c)hit=s.at(i);if(byte===0)return hit;}
    },
    memchr(pointer,character,amount){
      const s=storage(pointer),c=Number(character)&255,n=Number(amount);
      if(!Number.isSafeInteger(n)||n<0)throw RangeError('memchr size');
      s.check(n);for(let i=0;i<n;i++)if(s.read(i)===c)return s.at(i);
      return s.nil;
    },
    strstr(haystack,needle){
      const h=storage(haystack),n=storage(needle),count=length(n);
      if(count===0)return haystack;
      const total=length(h);
      for(let i=0;i+count<=total;i++){
        let j=0;while(j<count&&h.read(i+j)===n.read(j))j++;
        if(j===count)return h.at(i);
      }
      return h.nil;
    }
  };
}
