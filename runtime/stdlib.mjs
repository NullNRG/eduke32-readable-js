import { ABIHeap } from './abi.mjs';
import { sourceHeapAddress } from './source_bytes.mjs';
import { VirtualFS } from './filesystem.mjs';
import { createCPrintf } from './c_printf.mjs';
import { createCIntegerParse } from './c_integer_parse.mjs';
import { createPosixRuntime } from './c_posix.mjs';
import { createPthreadSingle } from './c_pthreads.mjs';
import { createPosixVFS } from './posix_vfs.mjs';
import { createCLocaleABI } from './c_locale_abi.mjs';
import { createCxxStringABI } from './cxx_string_abi.mjs';
import { createCTimeLocale } from './c_time_locale.mjs';
import { createCNumericExtra } from './c_numeric_extra.mjs';
import { createCxxFailureABI } from './cxx_failure_abi.mjs';
import { createCxxHashtableABI } from './cxx_hashtable_abi.mjs';
import { createCScanf } from './c_scanf.mjs';
import { createPosixMemory } from './posix_memory.mjs';
import { createCxxRBTreeABI } from './cxx_rbtree_abi.mjs';
import { createCStrftime } from './c_strftime.mjs';
import { createLinuxSyscalls } from './linux_syscalls.mjs';
import { createCxxLocaleABI } from './cxx_locale_abi.mjs';
import { createFLACABI } from './flac_abi.mjs';
import { createPosixNameService } from './posix_name_service.mjs';
import { createPosixProcessServices } from './posix_process_services.mjs';
import { createCSourceSearch } from './c_source_search.mjs';
/** Implemented subset of the C ABI and browser-safe POSIX-like APIs.
 * Unsupported symbols are a hard linker failure, not silent no-op functions.
 */
export function createStdlib({ heap = new ABIHeap(), fs = new VirtualFS(), stdout = console.log, callIndirect = null, clock = null, wallClock = null, threadModel = ()=>'single', streams=new Map(), getCallFrames=()=>[], allocateTraceBuffer=null, cxxLocaleIds=null } = {}) {
  const handles = new Map(); let nextHandle = 3;
  let errnoPtr=null;
  const errnoLocation=()=>{if(errnoPtr===null){errnoPtr=heap.malloc(4);heap.write(errnoPtr,'i32',0);}return errnoPtr;};
  const getHandle = fd => { const h = handles.get(fd); if (!h) throw new Error('EBADF: ' + fd); return h; };
  const posix=createPosixVFS({heap,fs,errnoLocation,streams});
  function registerFile(fd,mode,name,existingPtr=0){
    const ptr=existingPtr||heap.malloc(8);
    const h={fd,mode,name,eof:false,error:false};handles.set(ptr,h);
    if(mode[0]!=='r'||mode.includes('+'))streams.set(ptr,bytes=>{
      const p=heap.malloc(Math.max(1,bytes.length));
      try{
        heap.u8.set(bytes,p);
        const n=posix.write(fd,p,bytes.length);
        if(n!==BigInt(bytes.length)){h.error=true;throw Error('C FILE* write failed');}
      }finally{heap.free(p);}
    });
    return ptr;
  }
  function openCFile(namePtr,modePtr,existingPtr=0){
    if(!namePtr||!modePtr)return 0;
    const name=heap.readCString(namePtr),mode=heap.readCString(modePtr);
    if(!/^[rwa]\+?b?$|^[rwa]b\+?$/.test(mode))return 0;
    const access=mode.includes('+')?2:mode[0]==='r'?0:1;
    const flag=access+(mode[0]==='w'?(64|512):mode[0]==='a'?(64|1024):0);
    const fd=posix.open(namePtr,flag,0o666);
    if(fd<0)return 0;
    return registerFile(fd,mode,VirtualFS.key(name),existingPtr);
  }
  const cPosix=createPosixRuntime({heap,errnoLocation,callIndirect,
      ...(clock?{monotonicClock:clock}:{}),...(wallClock?{wallClock}:{}),
      getCallFrames, allocateTraceBuffer, streams});
  const library = {
    ...createCPrintf(heap,{streams}),
    ...createCIntegerParse({heap,errnoLocation}),
    ...cPosix,
    ...createPosixProcessServices({heap,errnoLocation,raiseSignal:cPosix.raise}),
    ...createPthreadSingle({heap,callIndirect,threadModel}),
    ...posix,
    ...createLinuxSyscalls({heap,fs,errnoLocation,posix}),
    ...createCLocaleABI({heap}),
    ...createCxxStringABI({heap}),
    ...createCTimeLocale({heap,errnoLocation,...(clock?{monotonicClock:clock}:{}),...(wallClock?{wallClock}:{})}),
    ...createCNumericExtra({heap,errnoLocation}),
    ...createCxxFailureABI({heap}),
    ...createCxxHashtableABI({heap}),
    ...createCScanf({heap}),
    ...createPosixMemory({heap,errnoLocation}),
    ...createPosixNameService({heap,errnoLocation}),
    ...createCxxRBTreeABI({heap}),
    ...(cxxLocaleIds?createCxxLocaleABI({heap,...cxxLocaleIds}):{}),
    ...createCStrftime({heap}),
    ...(callIndirect?createFLACABI({heap,callIndirect}):{}),
    malloc: n => heap.malloc(n),
    calloc: (n, size) => heap.calloc(n, size),
    // Source C++ nullptr lowers to null; the numeric host heap represents it
    // as address zero. Undefined and invalid non-null pointers still fail.
    realloc: (ptr, size) => heap.realloc(sourceHeapAddress(ptr,heap), size),
    free: ptr => heap.free(sourceHeapAddress(ptr,heap)),
    memcpy: (dst, src, n) => heap.memcpy(dst, src, n),
    memmove: (dst, src, n) => heap.memmove(dst, src, n),
    memset: (dst, value, n) => heap.memset(dst, value, n),
    memcmp: (a, b, n) => heap.memcmp(a, b, n),
    strlen: ptr => heap.strlen(ptr),
    strcmp: (a, b) => {
      const as = heap.readCString(a), bs = heap.readCString(b);
      return as < bs ? -1 : as > bs ? 1 : 0;
    },
    puts: ptr => { const str = heap.readCString(ptr); stdout(str); return str.length + 1; },
    strcpy: (dest, src) => {
      const n = heap.strlen(src) + 1;
      heap.memmove(dest, src, n);
      return dest;
    },
    strcat: (dest, src) => {
      const end = dest + heap.strlen(dest);
      const n = heap.strlen(src) + 1;
      heap.memmove(end, src, n);
      return dest;
    },
    bcmp: (a,b,n) => heap.memcmp(a,b,Number(n)),
    strcasecmp: (a,b) => {
      // POSIX C-locale ASCII fold, with unsigned-character byte ordering.
      let i = 0;
      for (;;) {
        let x = heap.read(a+i,'u8'), y = heap.read(b+i,'u8');
        if (x >= 65 && x <= 90) x += 32;
        if (y >= 65 && y <= 90) y += 32;
        if (x !== y) return x-y;
        if (x === 0) return 0;
        i++;
      }
    },
    // Byte-wise C locale routines: unlike JS string comparison they preserve
    // unsigned char ordering, zero padding, and terminating-NUL searches.
    strncpy: (dst,src,n) => {
      n=Number(n);if(!Number.isSafeInteger(n)||n<0)throw RangeError('strncpy size');
      heap.check(dst,n);let terminated=false;
      for(let i=0;i<n;i++){
        let c=0;
        if(!terminated){c=heap.read(src+i,'u8');if(c===0)terminated=true;}
        heap.write(dst+i,'u8',c);
      }
      return dst;
    },
    strncmp: (a,b,n) => {
      n=Number(n);if(!Number.isSafeInteger(n)||n<0)throw RangeError('strncmp size');
      for(let i=0;i<n;i++){
        const x=heap.read(a+i,'u8'),y=heap.read(b+i,'u8');
        if(x!==y)return x-y;
        if(x===0)return 0;
      }
      return 0;
    },
    strncasecmp: (a,b,n) => {
      n=Number(n);if(!Number.isSafeInteger(n)||n<0)throw RangeError('strncasecmp size');
      const lower=c=>c>=65&&c<=90?c+32:c;
      for(let i=0;i<n;i++){
        const x=lower(heap.read(a+i,'u8')),y=lower(heap.read(b+i,'u8'));
        if(x!==y)return x-y;
        if(x===0)return 0;
      }
      return 0;
    },
    tolower: c => {c=Number(c);return c>=65&&c<=90?c+32:c;},
    toupper: c => {c=Number(c);return c>=97&&c<=122?c-32:c;},
    isalnum: c => {c=Number(c);return (c>=48&&c<=57)||(c>=65&&c<=90)||(c>=97&&c<=122)?1:0;},
    // C-locale <ctype.h> classification accepts EOF (-1) and unsigned char.
    isalpha: c => {c=Number(c);return (c>=65&&c<=90)||(c>=97&&c<=122)?1:0;},
    islower: c => {c=Number(c);return c>=97&&c<=122?1:0;},
    isupper: c => {c=Number(c);return c>=65&&c<=90?1:0;},
    isspace: c => {c=Number(c);return c===32||(c>=9&&c<=13)?1:0;},
    isxdigit: c => {c=Number(c);return (c>=48&&c<=57)||(c>=65&&c<=70)||(c>=97&&c<=102)?1:0;},
    strncat: (dest,src,limit) => {
      const n=Number(limit);
      if(!Number.isSafeInteger(n)||n<0)throw RangeError('Invalid strncat limit');
      const end=dest+heap.strlen(dest),length=Math.min(n,heap.strlen(src));
      heap.check(end,length+1);
      for(let i=0;i<length;i++)heap.write(end+i,'u8',heap.read(src+i,'u8'));
      heap.write(end+length,'u8',0);
      return dest;
    },
    // Browser libm mappings. IEEE JS math is not asserted bit-identical to
    // native libm on all inputs; regression tests check numerical tolerance.
    sin: x => Math.sin(x),
    cos: x => Math.cos(x),
    tan: x => Math.tan(x),
    sqrt: x => Math.sqrt(x),
    exp: x => Math.exp(x),
    expf: x => Math.fround(Math.exp(Math.fround(x))),
    atanf: x => Math.fround(Math.atan(Math.fround(x))),
    atan2f: (y,x) => Math.fround(Math.atan2(Math.fround(y),Math.fround(x))),
    tanf: x => Math.fround(Math.tan(Math.fround(x))),
    log10f: x => Math.fround(Math.log10(Math.fround(x))),
    ldexp: (x,n) => Number(x)*Math.pow(2,n|0),
    ldexpf: (x,n) => Math.fround(Math.fround(x)*Math.pow(2,n|0)),
    sqrtf: x => Math.fround(Math.sqrt(Math.fround(x))),
    sinf: x => Math.fround(Math.sin(Math.fround(x))),
    cosf: x => Math.fround(Math.cos(Math.fround(x))),
    acosf: x => Math.fround(Math.acos(Math.fround(x))),
    logf: x => Math.fround(Math.log(Math.fround(x))),
    powf: (x,y) => Math.fround(Math.pow(Math.fround(x),Math.fround(y))),
    exp2f: x => Math.fround(Math.pow(2,Math.fround(x))),
    exp2: x => Math.pow(2,x),
    fmodf: (x,y) => Math.fround(Math.fround(x)%Math.fround(y)),
    log: x => Math.log(x),
    pow: (x,y) => Math.pow(x,y),
    fmod: (x,y) => x%y,
    abort: () => { throw Error('C abort() invoked'); },
    __h_errno_location: (()=>{let ptr=0;return ()=>{if(!ptr)ptr=heap.calloc(1,4);return ptr;};})(),
    lrint: x=>{const f=Math.floor(x),r=x-f;return BigInt(r<.5?f:r>.5?f+1:f%2===0?f:f+1);},
    lrintf: x=>{const v=Math.fround(x);const f=Math.floor(v),r=v-f;return BigInt(r<.5?f:r>.5?f+1:f%2===0?f:f+1);},
    llrintf: x=>{const v=Math.fround(x);const f=Math.floor(v),r=v-f;return BigInt(r<.5?f:r>.5?f+1:f%2===0?f:f+1);},
    lldiv:(num,den)=>{const a=BigInt(num),b=BigInt(den);if(b===0n)throw RangeError('lldiv divide by zero');return [a/b,a%b];},
    dirname:(ptr)=>{
      if(!ptr)return heap.writeCString('.');
      let len=heap.strlen(ptr);
      while(len>1&&heap.read(ptr+len-1,'u8')===47)len--;
      if(len===0)return heap.writeCString('.');
      let slash=len-1;while(slash>=0&&heap.read(ptr+slash,'u8')!==47)slash--;
      if(slash<0)return heap.writeCString('.');
      while(slash>0&&heap.read(ptr+slash-1,'u8')===47)slash--;
      heap.write(ptr+(slash===0?1:slash),'u8',0);
      return ptr;
    },
    // C perror emits the current errno and a caller prefix to stderr.
    perror:prefix=>{
      const errno=heap.read(errnoLocation(),'i32');
      const names={0:'Success',2:'No such file or directory',9:'Bad file descriptor',12:'Cannot allocate memory',13:'Permission denied',17:'File exists',22:'Invalid argument',28:'No space left on device',34:'Numerical result out of range',38:'Function not implemented',95:'Operation not supported'};
      const label=prefix?heap.readCString(prefix):'';
      const payload=new TextEncoder().encode((label?label+': ':'')+(names[errno]??'Unknown error '+errno)+'\n');
      const sink=streams.get('stderr');if(!sink)throw Error('stderr unavailable');sink(payload);
    },
    // Our C FILE* layer is synchronous and unbuffered. Only _IONBF is a
    // valid reconfiguration. Other buffering modes return EINVAL, not success.
    setvbuf:(file,buffer,mode,size)=>{
      if(!streams.has(Number(file))||mode!==2){heap.write(errnoLocation(),'i32',22);return -1;}
      return 0;
    },
    __errno_location: errnoLocation,
    // C FILE* and POSIX descriptors now share one open-file description and
    // offset. This avoids a second independent virtual-filesystem cursor.
    fopen: (namePtr, modePtr) => openCFile(namePtr,modePtr),
    fdopen: (fd, modePtr) => {
      const mode=heap.readCString(modePtr);
      const flags=posix.fcntl(fd,3);
      if(flags<0 || !mode || !/^[rwa]\+?b?$|^[rwa]b\+?$/.test(mode))return 0;
      const access=flags&3;
      if((mode.includes('+')&&access!==2)||(mode[0]==='r'&&access===1)||(mode[0]!=='r'&&access===0))return 0;
      return registerFile(fd,mode,'',0);
    },
    fileno: file => handles.has(Number(file))?handles.get(Number(file)).fd:-1,
    freopen: (namePtr,modePtr,file) => {
      const current=handles.get(Number(file));if(!current)return 0;
      const original=current.name;
      streams.delete(Number(file));handles.delete(Number(file));
      posix.close(current.fd);
      const name=namePtr?heap.readCString(namePtr):original;
      if(!name){heap.free(Number(file));return 0;}
      const next=openCFile(heap.writeCString(name),modePtr,Number(file));
      if(!next)heap.free(Number(file));
      return next;
    },
    fgetc: file => {
      const h=getHandle(file),ptr=heap.malloc(1);
      try{const n=posix.read(h.fd,ptr,1);if(n<=0n){h.eof=true;return -1;}h.eof=false;return heap.read(ptr,'u8');}
      finally{heap.free(ptr);}
    },
    ferror: file => streams.has(Number(file))?0:+!!getHandle(file).error,
    fread: (ptr, size, count, file) => {
      size=Number(size);count=Number(count);
      if(size===0||count===0)return 0;
      if(!Number.isSafeInteger(size*count)||size<0||count<0)throw RangeError('fread overflow');
      const h=getHandle(file),n=posix.read(h.fd,ptr,size*count);
      if(n<0n){h.error=true;return 0;}
      h.eof=Number(n)<size*count;
      return Math.floor(Number(n)/size);
    },
    fwrite: (ptr,size,count,file) => {
      size=Number(size);count=Number(count);
      if(size===0||count===0)return 0;
      if(!Number.isSafeInteger(size*count)||size<0||count<0)throw RangeError('fwrite overflow');
      const sink=streams.get(Number(file));
      if(sink){sink(heap.bytes(Number(ptr),size*count));return count;}
      const h=getHandle(file),n=posix.write(h.fd,ptr,size*count);
      if(n<0n){h.error=true;return 0;}return Math.floor(Number(n)/size);
    },
    fseek: (file,offset,whence) => {
      const h=getHandle(file),pos=posix.lseek(h.fd,BigInt(offset),whence);
      if(pos<0n){h.error=true;return -1;}h.eof=false;return 0;
    },
    ftell: file => {
      const h=getHandle(file),pos=posix.lseek(h.fd,0n,1);
      if(pos<0n){h.error=true;return -1;}return Number(pos);
    },
    fclose: file => {
      const h=handles.get(Number(file));if(!h)return -1;
      handles.delete(Number(file));streams.delete(Number(file));
      heap.free(Number(file));return posix.close(h.fd);
    },
    getenv: _namePtr => 0,
    clock_gettime_ms: () => globalThis.performance?.now?.() || Date.now()
  };
  // One byte implementation handles both numeric heap addresses and bounded
  // source views, including mixed calls. Preserve aliases instead of copying
  // strings through temporary heap allocations at each browser boundary.
  Object.assign(library,createCSourceSearch({heap}));
  return { heap, fs, symbols: Object.freeze(library) };
}
