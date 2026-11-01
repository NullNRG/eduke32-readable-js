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
  const count=value=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw RangeError('Invalid C byte extent');return n;};
  const span=(pointer,amount)=>{
    const n=count(amount),bytes=sourceByteView(pointer);
    if(bytes){if(n>bytes.byteLength)throw RangeError('C byte operation exceeds original source bounds');return bytes.subarray(0,n);}
    heap.check(pointer,n);return heap.u8.subarray(pointer,pointer+n);
  };
  const compare=(a,b,limit=Infinity,fold=false)=>{
    const x=storage(a),y=storage(b);
    const lower=c=>fold&&c>=65&&c<=90?c+32:c;
    for(let i=0;i<limit;i++){const left=lower(x.read(i)),right=lower(y.read(i));if(left!==right)return left-right;if(left===0)return 0;}
    return 0;
  };
  const copy=(dest,source,n)=>{n=count(n);if(n)span(dest,n).set(span(source,n));return dest;};
  return {
    strlen:pointer=>length(storage(pointer)),
    memcpy:copy,memmove:copy,
    memset:(pointer,byte,n)=>{n=count(n);if(n)span(pointer,n).fill(Number(byte)&255);return pointer;},
    memcmp:(a,b,n)=>{n=count(n);if(!n)return 0;const x=span(a,n),y=span(b,n);for(let i=0;i<n;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;},
    strcmp:(a,b)=>compare(a,b),strcasecmp:(a,b)=>compare(a,b,Infinity,true),
    strncmp:(a,b,n)=>compare(a,b,count(n)),strncasecmp:(a,b,n)=>compare(a,b,count(n),true),
    strcpy:(dest,source)=>copy(dest,source,length(storage(source))+1),
    strncpy:(dest,source,amount)=>{
      const n=count(amount);if(!n)return dest;
      const out=span(dest,n),input=storage(source);let end=false;
      for(let i=0;i<n;i++){const byte=end?0:input.read(i);out[i]=byte;if(!byte)end=true;}return dest;
    },
    strcat:(dest,source)=>{
      const offset=length(storage(dest)),n=length(storage(source))+1;
      span(dest,offset+n).set(span(source,n),offset);return dest;
    },
    strncat:(dest,source,amount)=>{
      const limit=count(amount),offset=length(storage(dest)),input=storage(source);let n=0;
      while(n<limit&&input.read(n)!==0)n++;
      const out=span(dest,offset+n+1);if(n)out.set(span(source,n),offset);out[offset+n]=0;return dest;
    },
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
