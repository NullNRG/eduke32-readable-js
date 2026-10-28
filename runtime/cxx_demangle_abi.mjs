import {demangledSymbols} from './generated_demangles.mjs';
/** Itanium __cxa_demangle for original statically linked symbols.
 * Symbols are demangled by GNU c++filt at BUILD time, not approximated.
 * Rejects unrecognized, malformed, and dynamic symbols honestly.
 */
export function createCxxDemangleABI({heap,alloc,realloc}={}){
 if(!heap||typeof alloc!=='function'||typeof realloc!=='function')throw TypeError('C++ demangler needs the program allocator');
 return Object.freeze({
  __cxa_demangle:(name,buffer,lenPtr,statusPtr)=>{
   let status=-2,ptr=0;
   if(!name||(Boolean(buffer)!==Boolean(lenPtr)))status=-3;
   else{
    const symbol=heap.readCString(Number(name));
    const decoded=Object.prototype.hasOwnProperty.call(demangledSymbols,symbol)?demangledSymbols[symbol]:null;
    if(decoded!==null){
     const bytes=new TextEncoder().encode(decoded), required=bytes.length+1;
     const capacity=lenPtr?Number(heap.read(Number(lenPtr),'u64')):0;
     ptr=Number(buffer&&capacity>=required?buffer:buffer?realloc(Number(buffer),BigInt(required)):alloc(BigInt(required)));
     if(ptr){
      heap.check(ptr,required);heap.u8.set(bytes,ptr);heap.write(ptr+bytes.length,'u8',0);
      if(lenPtr)heap.write(Number(lenPtr),'u64',BigInt(required));
      status=0;
     }else status=-1;
    }
   }
   if(statusPtr)heap.write(Number(statusPtr),'i32',status);
   return status===0?ptr:0;
  },
 });
}
