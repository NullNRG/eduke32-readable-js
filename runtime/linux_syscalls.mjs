/** Linux x86_64 syscall() bridge for the exact safe services supported by
 * this native-JS process. No OS simulation or fake NUMA/thread topology.
 * File syscalls reuse the canonical virtual POSIX descriptor table.
 */
export function createLinuxSyscalls({heap,errnoLocation,fs,posix,crypto=globalThis.crypto}={}){
  if(!heap||typeof errnoLocation!=='function'||!posix||!fs)throw TypeError('Linux syscall adapter dependencies missing');
  const fail=(code=38)=>{heap.write(errnoLocation(),'i32',code);return -1n;};
  return Object.freeze({
    syscall:(number,...args)=>{
      const n=Number(number);
      switch(n){
        case 0: { // read
          const [fd,ptr,length]=args;return BigInt(posix.read(Number(fd),Number(ptr),Number(length)));
        }
        case 2: { // open
          const [path,flags=0,mode=0]=args;
          return BigInt(posix.open(Number(path),Number(flags),Number(mode)));
        }
        case 3: return BigInt(posix.close(Number(args[0])));
        case 21: { // access, using the *same* canonical mounted virtual FS
          const [path,mode]=args;
          if(!path)return fail(14);
          const mask=Number(mode);
          if((mask&~7)!==0)return fail(22);
          let name;try{name=fs.constructor.key(heap.readCString(Number(path)));}catch{return fail(14);}
          if(!fs.exists(name))return fail(2);
          // Mounted original assets are readable; don't claim executability.
          if(mask&1)return fail(13);
          // Write access is only possible to virtual overlay files.
          if((mask&2)&&!fs.overlays?.has(name))return fail(13);
          return 0n;
        }
        case 318: { // getrandom(void*,size_t,unsigned int)
          const [ptr,length,flags=0]=args;
          const count=Number(length),f=Number(flags),dest=Number(ptr);
          if(!Number.isSafeInteger(count)||count<0||count>heap.maxBytes||f&~3)return fail(22);
          if(f&2)return fail(38); // GRND_RANDOM semantics not available
          if(typeof crypto?.getRandomValues!=='function')return fail(38);
          try{
            heap.check(dest,count);
            for(let at=0;at<count;at+=65536){
              const end=at+Math.min(65536,count-at);
              // Native Uint8Array is a WebCrypto-compatible destination.
              crypto.getRandomValues(heap.u8.subarray(dest+at,dest+end));
            }
          }catch{return fail(14);}
          return BigInt(count);
        }
        // 237=mbind (NUMA), 309=getcpu (physical core), and all other
        // Linux syscalls lack a faithful browser primitive.
        default:return fail(38);
      }
    },
  });
}
