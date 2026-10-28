/** Browser POSIX anonymous mappings in the shared C heap.
 * mmap() is implemented for PRIVATE|ANONYMOUS mappings only. The host
 * does not expose page protection or arbitrary fixed virtual addresses.
 */
export function createPosixMemory({heap,errnoLocation}={}) {
  if(!heap||!errnoLocation)throw TypeError('POSIX mappings need heap and errno');
  const maps=new Map();const fail=(errno)=>{heap.write(errnoLocation(),'i32',errno);return -1;};
  return Object.freeze({
    mmap:(addr,length,prot,flags,fd,offset)=>{
      const size=Number(length),f=Number(flags);
      // MAP_PRIVATE 0x02, MAP_ANONYMOUS 0x20, optional MAP_NORESERVE 0x4000.
      if(addr||!(f&0x20)||!(f&0x02)||(f&~(0x02|0x20|0x4000))||Number(fd)!==-1||BigInt(offset)!==0n){
        fail(95);return -1;
      }
      // The JS ABI heap cannot enforce read-only, executable or inaccessible
      // pages. Only the already read/write mapping is supportable faithfully.
      // PROT_READ | PROT_WRITE = 3 (Linux x86-64).
      if(prot!==3){fail(95);return -1;}
      if(!Number.isSafeInteger(size)||size<=0||size>heap.maxBytes-4096){fail(12);return -1;}
      try{
        const rounded=Math.ceil(size/4096)*4096;
        const raw=heap.malloc(rounded+4095);
        const ptr=Math.ceil(raw/4096)*4096;
        heap.memset(ptr,0,rounded);
        maps.set(ptr,{length:size,rounded,raw,prot});return ptr;
      }catch{fail(12);return -1;}
    },
    munmap:(ptr,size)=>{
      const record=maps.get(Number(ptr));
      if(!record||record.length!==Number(size))return fail(22);
      maps.delete(Number(ptr));heap.free(record.raw);return 0;
    },
    mprotect:(addr,length,prot)=>{
      const p=Number(addr),n=Number(length),bits=Number(prot);
      if(!Number.isSafeInteger(p)||p%4096!==0||!Number.isSafeInteger(n)||n<=0)return fail(22);
      const mapping=[...maps].find(([base,m])=>p>=base&&p+n<=base+m.rounded);
      if(!mapping)return fail(12); // ENOMEM: unmapped pages
      // Read/write memory remains read/write. All other modes REQUIRE access
      // barriers that this JS heap cannot currently guarantee.
      if(bits!==3)return fail(95);
      return 0;
    },
    madvise:(ptr,length,advice)=>{
      // MADV_NORMAL/RANDOM/SEQUENTIAL are pure advisory scheduling hints;
      // discarding/residency-changing advice is NOT legal to ignore.
      const start=Number(ptr),size=Number(length);
      if(!Number.isSafeInteger(size)||size<0||!Number.isSafeInteger(start))return fail(22);
      heap.check(start,size);
      if([0,1,2].includes(Number(advice)))return 0;
      return fail(95);
    },
    sigemptyset:ptr=>{heap.memset(Number(ptr),0,128);return 0;},
  });
}
