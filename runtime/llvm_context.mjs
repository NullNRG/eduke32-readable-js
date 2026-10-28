import { ABIHeap } from './abi.mjs';
import { createStdlib } from './stdlib.mjs';
import { fusedMultiplyAdd } from './ieee_fma.mjs';
import { createSDLBrowser } from './sdl_browser.mjs';
import { createDlfcnSelf } from './dlfcn_self.mjs';
import {createCxxDemangleABI} from './cxx_demangle_abi.mjs';
import {createALSABrowser} from './platform_drivers/alsa_browser.mjs';

/** Whole-program shared C ABI environment for LLVM-lowered JavaScript modules.
 * Rejects unresolved imports, unsupported globals, conflicting definitions.
 * Not an implementation of the complete C++ runtime or full LLVM ABI.
 */
export class LLVMContext {
  constructor({ heap = new ABIHeap(), fs = null, libraries = {}, cpuidProvider = null, canvas = null, clock = null, stdio = {}, instructionBudget = 50000000, blockProgress = null } = {}) {
    if (!(instructionBudget === Infinity || (Number.isSafeInteger(instructionBudget) && instructionBudget > 0)))
      throw new RangeError('Invalid LLVM basic-block execution budget');
    this.instructionBudget=instructionBudget;
    if(blockProgress!==null && typeof blockProgress!=='function')throw new TypeError('blockProgress must be a callback or null');
    this.blockProgress=blockProgress;
    this.heap = heap;
    if(cpuidProvider!==null && typeof cpuidProvider!=='function')throw TypeError('CPUID provider must be a function');
    this.cpuidProvider = cpuidProvider;
    this.threadModel = 'single';
    this.pointerBytes = 8; // Clang x86_64 compiler target; wasm32 needs 4
    // A stable singleton for LLVM poison, distinguishable from undef and 0.
    // Do not treat poison as JS truthy or allow accidental Number coercion.
    this.poisonValue = Object.freeze({
      [Symbol.toPrimitive]() { throw Error('LLVM poison used as numeric value'); },
    });
    this.functions = new Map();
    this.globalPointers = new Map();
    this.aliases = new Map();
    this.globalRelocations = [];
    this.functionAddresses = new Map();
    this.functionsByAddress = new Map();
    this.blockAddresses = new Map();
    this.blocksByAddress = new Map();
    // The host module's address-bearing DSO identity is real ABI data, not a
    // fabricated function or a substitute for a compiler-generated global.
    this.defineGlobal('__dso_handle',{kind:'zeroed',size:8});
    this.store(this.ptr('__dso_handle'),'ptr',this.ptr('__dso_handle'));
    this.defineGlobal('stdout',{kind:'zeroed',size:8});
    this.defineGlobal('stderr',{kind:'zeroed',size:8});
    // glibc global: true while no other C ABI thread can exist.
    this.defineGlobal('__libc_single_threaded',{kind:'bytes',size:1,value:[1]});
    // Exact original EDuke32 driver_alsa.cpp definitions: both i32 = 0.
    // These are data relocations only. ALSA MIDI functions are not fabricated.
    this.defineGlobal('ALSA_ClientID',{kind:'zeroed',size:4});
    this.defineGlobal('ALSA_PortID',{kind:'zeroed',size:4});
    // POSIX in6addr_any: :: (all sixteen bytes zero), usable in native
    // sockaddr_in6 initialization even when sockets are unavailable.
    this.defineGlobal('in6addr_any',{kind:'zeroed',size:16});
    // libFLAC exports arrays of C string pointers, not callable functions.
    this.defineGlobal('FLAC__Metadata_ChainStatusString',{kind:'zeroed',size:15*8});
    this.defineGlobal('FLAC__StreamDecoderErrorStatusString',{kind:'zeroed',size:4*8});
    for(const [name,items] of [
      ['FLAC__Metadata_ChainStatusString',['OK','ILLEGAL_INPUT','ERROR_OPENING_FILE','NOT_A_FLAC_FILE','NOT_WRITABLE','BAD_METADATA','READ_ERROR','SEEK_ERROR','WRITE_ERROR','RENAME_ERROR','UNLINK_ERROR','MEMORY_ALLOCATION_ERROR','INTERNAL_ERROR','INVALID_CALLBACKS','READ_WRITE_MISMATCH']],
      ['FLAC__StreamDecoderErrorStatusString',['LOST_SYNC','BAD_HEADER','FRAME_CRC_MISMATCH','UNPARSEABLE_STREAM']]
    ]){
      const base=this.ptr(name);for(let i=0;i<items.length;i++)
        this.store(base+i*8,'ptr',this.heap.writeCString(items[i]));
    }
    // libstdc++ locale::id has an address-bearing 8-byte static object.
    this.defineGlobal('_ZNSt5ctypeIcE2idE',{kind:'zeroed',size:8});
    this.defineGlobal('_ZNSt7__cxx117collateIcE2idE',{kind:'zeroed',size:8});

    // Browser sandbox intentionally exports an initially empty environment.
    this.defineGlobal('environ',{kind:'zeroed',size:8});
    const emptyEnvironment=this.heap.calloc(1,8);
    this.store(this.ptr('environ'),'ptr',emptyEnvironment);
    const stdoutFile=this.heap.malloc(8),stderrFile=this.heap.malloc(8);
    this.store(this.ptr('stdout'),'ptr',stdoutFile);
    this.store(this.ptr('stderr'),'ptr',stderrFile);
    const text=new TextDecoder();
    const streamOut=stdio.stdout??(bytes=>console.log(text.decode(bytes)));
    const streamErr=stdio.stderr??(bytes=>console.error(text.decode(bytes)));
    this.stdioStreams=new Map([['stdout',streamOut],[stdoutFile,streamOut],[stderrFile,streamErr],[1,streamOut],[2,streamErr]]);

    this.destructorStack=[];
    this.callFrames=[];
    this.standard = createStdlib({heap,...(fs?{fs}:{}),callIndirect:(ptr,args)=>this.callIndirect(ptr,args), ...(clock?{clock}:{}) ,threadModel:()=>this.threadModel,streams:this.stdioStreams,
      getCallFrames:()=>this.callFrames,
      cxxLocaleIds:{ctypeId:this.ptr('_ZNSt5ctypeIcE2idE'),collateId:this.ptr('_ZNSt7__cxx117collateIcE2idE')},
      allocateTraceBuffer:n=>this.call('mi_malloc',[BigInt(n)])}).symbols;
    this.sdl = createSDLBrowser({heap,canvas,callIndirect:(ptr,args)=>this.callIndirect(ptr,args),...(clock?{clock}:{})}).symbols;
    this.libraries = {
      ...this.standard,
      ...this.sdl,
      ...createDlfcnSelf({ctx:this,heap}),
      ...createALSABrowser({heap,callCompiled:(name,args)=>this.call(name,args)}),
      ...createCxxDemangleABI({heap,
        alloc:n=>this.call('mi_malloc',[n]),
        realloc:(p,n)=>this.call('mi_realloc',[p,n])}),
      '__cxa_atexit':(fn,obj,dso)=>this.registerDestructor(fn,obj,dso),
      'atexit':fn=>this.registerExitHandler(fn),
      'exit':status=>this.exitProcess(status),
      // Default MXCSR rounding mode only (nearest, ties to even).  Never
      // claim equivalent behavior if the original program changes MXCSR.
      // rsqrt.ss changes only lane zero, preserving remaining lanes.
      'llvm.x86.sse.rsqrt.ss': v => {
        if(!Array.isArray(v)||v.length!==4||v.some(x=>typeof x!=='number'))throw TypeError('Expected <4 x float>');
        const out=v.slice();out[0]=Math.fround(1/Math.sqrt(Math.fround(v[0])));
        return out;
      },
      'llvm.x86.sse.cvtss2si': v => {
        if (!Array.isArray(v) || v.length!==4 || v[0]===undefined) throw TypeError('Invalid SSE float vector');
        const n=Math.fround(v[0]);
        if (!Number.isFinite(n)) return -2147483648;
        const floor=Math.floor(n), frac=n-floor;
        const rounded=frac<0.5?floor:frac>0.5?floor+1:(floor%2===0?floor:floor+1);
        return rounded < -2147483648 || rounded > 2147483647 ? -2147483648 : rounded|0;
      },
      'llvm.x86.sse2.cvtsd2si': v => {
        if (!Array.isArray(v) || v.length!==2 || v[0]===undefined) throw TypeError('Invalid SSE double vector');
        const n=v[0];
        if (!Number.isFinite(n)) return -2147483648;
        const floor=Math.floor(n), frac=n-floor;
        const rounded=frac<0.5?floor:frac>0.5?floor+1:(floor%2===0?floor:floor+1);
        return rounded < -2147483648 || rounded > 2147483647 ? -2147483648 : rounded|0;
      },
      // Pure LLVM intrinsics: canonical, width-explicit BigInt semantics.
      'llvm.abs.i8':(x,poisonOnMin)=>{
        const n=(x<<24)>>24;
        if(n===-128 && poisonOnMin)throw Error('llvm.abs.i8 poison');
        return (Math.abs(n)<<24)>>24;
      },
      'llvm.bitreverse.i32':x=>{
        let v=x>>>0,o=0;
        for(let i=0;i<32;i++){o=(o<<1)|(v&1);v>>>=1;}
        return o|0;
      },
      'llvm.ceil.f64':Math.ceil,
      'llvm.floor.f64':Math.floor,
      'llvm.fabs.f64':Math.abs,
      'llvm.ctpop.i32':x=>{
        let v=x>>>0,count=0;
        while(v){v&=v-1;count++;}return count;
      },
      'llvm.cttz.i32':(value,isZeroPoison)=>{
        const v=value>>>0;
        if(v===0 && isZeroPoison) throw Error('llvm.cttz.i32 poison for zero');
        if(v===0)return 32;
        return 31-Math.clz32((v&-v)>>>0);
      },
      'llvm.fshl.i64':(x,y,shift)=>{
        const n=Number(BigInt(shift)&63n), a=BigInt.asUintN(64,BigInt(x)),b=BigInt.asUintN(64,BigInt(y));
        return BigInt.asIntN(64,n===0?a:(a<<BigInt(n))|(b>>BigInt(64-n)));
      },
      'llvm.sadd.sat.i16':(x,y)=>Math.min(32767,Math.max(-32768,((x<<16)>>16)+((y<<16)>>16))),
      'llvm.smin.i8':(x,y)=>Math.min((x<<24)>>24,(y<<24)>>24),
      'llvm.smax.i8':(x,y)=>Math.max((x<<24)>>24,(y<<24)>>24),
      'llvm.umin.i8':(x,y)=>Math.min(x&255,y&255),
      'llvm.umax.i8':(x,y)=>Math.max(x&255,y&255),
      'llvm.umin.i16':(x,y)=>Math.min(x&65535,y&65535),
      'llvm.umax.i16':(x,y)=>Math.max(x&65535,y&65535),
      'llvm.uadd.sat.i32':(x,y)=>Math.min(4294967295,(x>>>0)+(y>>>0)),
      'llvm.uadd.sat.i64':(x,y)=>{
        const r=BigInt.asUintN(64,BigInt(x))+BigInt.asUintN(64,BigInt(y));
        return BigInt.asIntN(64,r>((1n<<64n)-1n)?((1n<<64n)-1n):r);
      },
      'llvm.usub.sat.i64':(x,y)=>{
        const r=BigInt.asUintN(64,BigInt(x))-BigInt.asUintN(64,BigInt(y));
        return r<0n?0n:BigInt.asIntN(64,r);
      },
      'llvm.sadd.with.overflow.i32':(x,y)=>{
        const val=BigInt(x|0)+BigInt(y|0);
        return [Number(BigInt.asIntN(32,val)),+(val<-(1n<<31n)||val>((1n<<31n)-1n))];
      },
      'llvm.smul.with.overflow.i32':(x,y)=>{
        const val=BigInt(x|0)*BigInt(y|0);
        return [Number(BigInt.asIntN(32,val)),+(val<-(1n<<31n)||val>((1n<<31n)-1n))];
      },
      'llvm.umul.with.overflow.i64':(x,y)=>{
        const val=BigInt.asUintN(64,BigInt(x))*BigInt.asUintN(64,BigInt(y));
        return [BigInt.asIntN(64,val),+(val>((1n<<64n)-1n))];
      },
      // LLVM's opaque thread identity, used by mimalloc as an equality
      // token in the selected IR. Single-thread contexts receive one stable
      // distinct heap token. Never impersonates a native TLS data segment.
      'llvm.thread.pointer':()=>{
        if(this.threadModel!=='single')throw Error('Thread pointer requires per-thread identity storage');
        if(!this.threadIdentity){this.threadIdentity=this.heap.malloc(8);this.heap.write(this.threadIdentity,'u64',1n);}
        return this.threadIdentity;
      },
      'llvm.threadlocal.address.p0': address=>{
        if(this.threadModel!=='single')throw Error('TLS requires per-thread C ABI storage');
        return address;
      },
      'llvm.invariant.start.p0':()=>undefined,
      'llvm.va_end.p0': () => undefined,
      'llvm.load.relative.i64': (base,offset) => this.loadRelative(base,offset),
      // Prefetch is only a cache-performance hint: omitting it is legal.
      'llvm.prefetch.p0': (_ptr,rw,locality,cacheType) => {
        if(![0,1].includes(rw)||![0,1,2,3].includes(locality)||![0,1].includes(cacheType))
          throw TypeError('Invalid llvm.prefetch metadata');
      },
      'llvm.va_copy.p0': (dest,source) => this.heap.memcpy(dest,source,24),
      'llvm.trap':()=>{throw Error('LLVM trap executed');},
      'llvm.debugtrap':()=>{throw Error('LLVM debugtrap executed');},
      'llvm.fmuladd.f32':(a,b,c)=>fusedMultiplyAdd(Math.fround(a),Math.fround(b),Math.fround(c),32),
      'llvm.fmuladd.f64':(a,b,c)=>fusedMultiplyAdd(a,b,c,64),
      'llvm.fshl.i32':(a,b,n)=> (n&31)===0 ? (a|0) : ((a << (n & 31)) | (b >>> (32-(n&31))))|0,
      'llvm.ctpop.i64': x => {
        let v=BigInt.asUintN(64,BigInt(x)),count=0;
        while(v){v &= v-1n;count++;} return BigInt(count);
      },
      'llvm.ctlz.i64':(v,zeroUndefined)=>{
        const n=BigInt.asUintN(64,BigInt(v));
        if(n===0n && zeroUndefined) throw Error('llvm.ctlz.i64 undefined for zero');
        return BigInt(n===0n?64:64-n.toString(2).length);
      },
      'llvm.ctlz.i32':(v,zeroUndefined)=>{
        const n=v>>>0;
        if(n===0 && zeroUndefined) throw Error('llvm.ctlz.i32 undefined for zero');
        return Math.clz32(n);
      },
      'llvm.cttz.i64':(v,zeroUndefined)=>{
        let n=BigInt.asUintN(64,BigInt(v));
        if(n===0n && zeroUndefined) throw Error('llvm.cttz.i64 undefined for zero');
        if(n===0n)return 64n;
        let count=0n;while((n&1n)===0n){count++;n>>=1n;} return count;
      },
      'llvm.fabs.f32':v=>Math.fround(Math.abs(v)),
      'llvm.ceil.f32':v=>Math.fround(Math.ceil(v)),
      'llvm.floor.f32':v=>Math.fround(Math.floor(v)),
      'llvm.rint.f32':v=>{
        const n=Math.fround(v);const f=Math.floor(n);const r=n-f;
        return Math.fround(r<.5?f:r>.5?f+1:f%2===0?f:f+1);
      },
      'llvm.rint.f64':v=>{
        const f=Math.floor(v);const r=v-f;
        return r<.5?f:r>.5?f+1:f%2===0?f:f+1;
      },
      'llvm.smin.i16':(a,b)=>Math.min(a<<16>>16,b<<16>>16),
      'llvm.smax.i16':(a,b)=>Math.max(a<<16>>16,b<<16>>16),
      'llvm.abs.i16':(v,poisonOnMin)=>{
        const n=v<<16>>16;
        if(n===-32768 && poisonOnMin)throw Error('llvm.abs.i16 poison on INT16_MIN');
        return Math.abs(n)<<16>>16;
      },
      'llvm.x86.sse2.lfence': () => undefined,
      'llvm.x86.sse2.pause': () => undefined,
      'llvm.lifetime.start.p0': () => undefined,
      'llvm.lifetime.end.p0': () => undefined,
      'llvm.memcpy.p0.p0.i64': (dst, src, n) => this.heap.memcpy(dst, src, Number(n)),
      'llvm.memmove.p0.p0.i64': (dst, src, n) => this.heap.memmove(dst, src, Number(n)),
      'llvm.memset.p0.i64': (dst, c, n) => this.heap.memset(dst, c, Number(n)),
      'llvm.smax.i32': (a,b) => Math.max(a|0,b|0),
      'llvm.smax.i64': (a,b) => BigInt.asIntN(64, BigInt(a)>BigInt(b)?BigInt(a):BigInt(b)),
      'llvm.smin.i64': (a,b) => BigInt.asIntN(64, BigInt(a)<BigInt(b)?BigInt(a):BigInt(b)),
      'llvm.bswap.i16': a => (((a & 255)<<8)|((a >>> 8)&255))&65535,
      'llvm.bswap.i32': a => (((a&255)<<24)|((a&65280)<<8)|((a>>>8)&65280)|((a>>>24)&255))|0,
      'llvm.bswap.i64': a => {
        let v=BigInt.asUintN(64,BigInt(a)), out=0n;
        for(let i=0n;i<8n;i++){out=(out<<8n)|(v&255n);v>>=8n;}
        return BigInt.asIntN(64,out);
      },
      'llvm.smin.i32': (a,b) => Math.min(a|0,b|0),
      'llvm.umin.i32': (a,b) => Math.min(a>>>0,b>>>0),
      'llvm.umin.i64': (a,b) => BigInt.asIntN(64,BigInt.asUintN(64,BigInt(a)) < BigInt.asUintN(64,BigInt(b)) ? BigInt(a) : BigInt(b)),
      'llvm.umax.i64': (a,b) => BigInt.asIntN(64,BigInt.asUintN(64,BigInt(a)) > BigInt.asUintN(64,BigInt(b)) ? BigInt(a) : BigInt(b)),
      'llvm.usub.sat.i32': (a,b) => Math.max(0,(a>>>0)-(b>>>0)),
      'llvm.umax.i32': (a,b) => Math.max(a>>>0,b>>>0)>>>0,
      'llvm.abs.i32': (a,poisonOnMin) => {
        const n=a|0;
        if (n===-2147483648 && poisonOnMin) throw Error('llvm.abs.i32: poison on INT_MIN');
        return Math.abs(n)|0;
      },
      'llvm.abs.i64': (a,poisonOnMin) => {
        const n=BigInt.asIntN(64,BigInt(a));
        if (n===-(1n<<63n) && poisonOnMin) throw Error('llvm.abs.i64: poison on INT64_MIN');
        return BigInt.asIntN(64,n<0n?-n:n);
      },
      'llvm.assume': (predicate) => {
        if (!predicate) throw Error('LLVM assumption violated');
      },
      ...libraries
    };
    this.stackBase = null;
    this.stackOffset = 0;
    this.stackCapacity = 8 * 1024 * 1024;
  }
  registerDestructor(fn,obj,dso){
    const address=Number(fn),data=Number(obj),owner=Number(dso);
    if(!Number.isSafeInteger(address)||!Number.isSafeInteger(data)||!Number.isSafeInteger(owner)||!address)
      throw TypeError('Invalid __cxa_atexit ABI pointer');
    if(!this.functionsByAddress.has(address))
      throw Error('Unresolved __cxa_atexit destructor function pointer');
    this.destructorStack.push({address,data,owner,kind:'cxa'});
    return 0;
  }
  registerExitHandler(fn){
    const address=Number(fn);
    if(!Number.isSafeInteger(address)||!address||!this.functionsByAddress.has(address))
      throw Error('Unresolved atexit callback function pointer');
    this.destructorStack.push({address,kind:'atexit',owner:null});
    return 0;
  }
  exitProcess(status){
    const code=Number(status)|0;
    this.runDestructors();
    const error=new Error('C process exited with status '+code);
    error.name='CProcessExit';error.exitStatus=code;
    throw error;
  }
  // Models the Itanium C++ ABI's reverse-registration destructor order.
  // A host may invoke this during explicit runtime shutdown; it does not
  // falsely claim that calling JS process exit/quit has been implemented.
  runDestructors(dso=null){
    const filter=dso===null?null:Number(dso);
    for(let i=this.destructorStack.length-1;i>=0;i--){
      const item=this.destructorStack[i];
      if(filter!==null&&filter!==item.owner)continue;
      this.destructorStack.splice(i,1);
      this.callIndirect(item.address,item.kind==='atexit'?[]:[item.data]);
    }
  }
  // Registers are [EAX, EBX, ECX, EDX]. A feature provider must derive
  // these from a real host interface or user-approved configuration.
  // Browsers do not expose CPUID. Missing data is a hard error, not zero.
  x86CPUID(leaf) {
    if(typeof this.cpuidProvider!=='function')
      throw Error('Host CPUID information unavailable: explicit provider required');
    const key=Number(leaf)>>>0;
    const result=this.cpuidProvider(key,0);
    if(!Array.isArray(result)||result.length!==4||result.some(v=>!Number.isInteger(v)||v<-2147483648||v>4294967295))
      throw TypeError('Invalid CPUID provider: expected four 32-bit registers');
    return result.map(v=>v|0);
  }
  // Exact 80-bit x87 values are opaque ABI values. Do not silently convert
  // them to JS double, which discards up to 11 bits of significand.
  requireX87(value) {
    if(!(value instanceof Uint8Array)||value.length!==10)
      throw TypeError('x86_fp80 requires exactly 10 raw bytes');
    return value.slice();
  }
  monotonicTickPair() {
    // Explicit portable host-clock adaptation for a known x86 rdtsc call.
    // 1e9 ticks/s, derived from the browser's monotonic high-resolution timer.
    // No synthetic CPUID bits or claimed CPU-cycle equivalence.
    if(typeof globalThis.performance?.now!=='function')
      throw Error('Host monotonic performance clock unavailable');
    const ns=BigInt(Math.floor(globalThis.performance.now()*1000000));
    const ticks=ns<this._lastMonotonicTicks?this._lastMonotonicTicks:ns;
    this._lastMonotonicTicks=ticks;
    return [Number(BigInt.asIntN(32,ticks)), Number(BigInt.asIntN(32,ticks>>32n))];
  }
  x86ReverseCopy(sourceLast, destination, byteCount) {
    const n=byteCount>>>0, src=Number(sourceLast), dst=Number(destination);
    if(!Number.isSafeInteger(src)||!Number.isSafeInteger(dst)||!Number.isInteger(byteCount))
      throw RangeError('Invalid reverse-copy pointers or count');
    // Original assembly reads down from *sourceLast* (inclusive), and writes
    // upward from destination. Its byte/word/dword instruction order is
    // observable when buffers overlap; preserve the same access groups.
    if(n){
      this.heap.check(src-n+1,n);this.heap.check(dst,n);
    }
    let input=src, output=dst;
    const transfer=width=>{
      const chunk=this.heap.u8.slice(input-width+1,input+1);
      for(let i=0;i<width;i++)this.heap.u8[output+i]=chunk[width-1-i];
      input-=width;output+=width;
    };
    if(n&1)transfer(1);
    if(n&2)transfer(2);
    for(let i=n>>>2;i>0;i--)transfer(4);
    // The LLVM inline assembly returns {rsi,rdi,ecx} even when the original
    // C wrapper ignores these registers.
    return [input,output,0];
  }
  requireDefined(value,where='observation') {
    if(value===this.poisonValue)throw Error('LLVM undefined behavior: poison at '+where);
    return value;
  }
  coerceBigIntOrPoison(value) {
    return value===this.poisonValue ? value : BigInt(value);
  }
  freezeValue(value,type) {
    if(value!==this.poisonValue)return value;
    // A single fixed value is a legal LLVM freeze refinement. The choice
    // is stable at the definition site and never silently propagates poison.
    return /^i\d+$/.test(type) && Number(type.slice(1))>32 ? 0n : 0;
  }
  defineGlobal(name, descriptor) {
    if (this.globalPointers.has(name) || this.aliases.has(name)) throw Error(`Duplicate global: ${name}`);
    if (descriptor.kind === 'alias') {
      if (!descriptor.target || descriptor.target === name) throw Error(`Invalid LLVM alias ${name}`);
      this.aliases.set(name,descriptor.target);
      return;
    }
    if (descriptor.kind === 'unsupported') throw Error(`Unsupported LLVM global ${name}: ${descriptor.declaration}`);
    const ptr = this.heap.malloc(Math.max(1, descriptor.size));
    this.globalPointers.set(name, ptr);
    if (descriptor.kind === 'zeroed') {
      this.heap.u8.fill(0,ptr,ptr+descriptor.size);
    } else if (descriptor.kind === 'bytes') {
      this.heap.u8.set(descriptor.value, ptr);
    } else if (descriptor.kind === 'relocations') {
      if (descriptor.value) this.heap.u8.set(descriptor.value, ptr);
      for (const reference of descriptor.references) this.globalRelocations.push({base:ptr, ...reference});
    } else if (descriptor.kind === 'scalar') {
      const value = descriptor.type === 'i64' ? BigInt(descriptor.value) : Number(descriptor.value);
      this.store(ptr, descriptor.type, value);
    } else throw Error('Unsupported global initializer: ' + name);
  }
  offset(n) {
    const v = Number(n);
    if (!Number.isSafeInteger(v)) throw RangeError('Pointer index exceeds safe JavaScript range');
    return v;
  }
  finishGlobals() {
    // Fail cyclic/unresolved aliases before applying any relocations.
    for (const name of this.aliases.keys()) this.ptr(name);
    // Relocate only AFTER every global has a stable address, independent of
    // C/C++ translation-unit ordering. Never silently coerce function pointers.
    for (const {base,offset,symbol,addend=0,blockaddress,relativeBase,width,integerAddress} of this.globalRelocations) {
      if(relativeBase!==undefined){
        if(width!==32)throw Error('Unsupported LLVM relative relocation width');
        const delta=this.ptr(symbol)+addend-this.ptr(relativeBase);
        if(!Number.isSafeInteger(delta)||delta<-(2**31)||delta>=2**31)throw RangeError('LLVM relative pointer overflow');
        this.store(base+offset,'i32',delta);
      } else if(blockaddress){
        if(addend!==0)throw TypeError('LLVM blockaddress relocation may not have an addend');
        this.store(base+offset,'ptr',this.blockAddress(blockaddress.function,blockaddress.label));
      } else if(integerAddress){
        if(width!==64)throw Error('Unsupported integer-address relocation width');
        this.store(base+offset,'i64',BigInt(this.ptr(symbol))+BigInt(addend));
      } else this.store(base + offset,'ptr',this.ptr(symbol)+addend);
    }
    this.globalRelocations.length = 0;
  }
  ptr(name, seen = new Set()) {
    if (this.aliases.has(name)) {
      if (seen.has(name)) throw Error('Cyclic LLVM alias: ' + name);
      seen.add(name);
      return this.ptr(this.aliases.get(name), seen);
    }
    if (this.globalPointers.has(name)) return this.globalPointers.get(name);
    if (this.functionAddresses.has(name)) return this.functionAddresses.get(name);
    if (typeof this.libraries[name] === 'function') {
      const ptr = this.heap.malloc(this.pointerBytes);
      this.functionAddresses.set(name,ptr);
      this.functionsByAddress.set(ptr,name);
      return ptr;
    }
    throw Error('Unresolved LLVM global/function address: ' + name);
  }
  register(name, fun, abi = null) {
    if(abi!==null){
      if(!Array.isArray(abi.namedTypes))throw TypeError('Invalid variadic declaration ABI');
      fun.llvmNamedTypes=abi.namedTypes;
    }
    if (this.functions.has(name)) throw Error('Duplicate function: ' + name);
    this.functions.set(name, fun);
    const ptr = this.heap.malloc(this.pointerBytes);
    this.functionAddresses.set(name,ptr);
    this.functionsByAddress.set(ptr,name);
  }
  // Pure LLVM loop strength reduction for a *structurally proven* two-pass
  // search: first nonzero byte flag on equal i32 key, then first equal key.
  // This is not keyed to any original game's symbols or function names.
  // Returning null means "execute the original LLVM CFG"; -1 means not found.
  tryTwoPassI32ByteSearch(codePtr,flagPtr,count,value) {
    if(!Number.isSafeInteger(codePtr)||!Number.isSafeInteger(flagPtr)||
       !Number.isInteger(count)||count<1||count>1048576||
       codePtr%4!==0||typeof value!=='bigint'||value<0n||value>4294967295n){
      return null;
    }
    // Validate both ranges before taking the accelerated path. A malformed
    // input is allowed to reach the original LLVM path and raise its error.
    try {
      this.heap.check(codePtr,count*4);
      this.heap.check(flagPtr,count);
    } catch { return null; }
    const codes=new Uint32Array(this.heap.buffer,codePtr,count);
    const flags=this.heap.u8;
    const key=Number(value);
    for(let i=0;i<count;i++){
      if(codes[i]===key && flags[flagPtr+i]!==0)return i;
    }
    for(let i=0;i<count;i++){
      if(codes[i]===key)return i;
    }
    return -1;
  }
  // Source-neutral LLVM loop optimization: binary arithmetic and data are
  // unchanged, but the per-element basic-block dispatch is eliminated.
  tryDescendingI32Threshold(tablePtr,target,startIndex) {
    if(!Number.isSafeInteger(tablePtr)||tablePtr%4!==0||
       !Number.isInteger(target)||!Number.isInteger(startIndex)||
       startIndex<2||startIndex>1024)return null;
    try{this.heap.check(tablePtr+8,(startIndex-1)*4);}catch{return null;}
    const view=this.heap.view;
    for(let i=startIndex;i>=2;i--){
      if(view.getInt32(tablePtr+i*4,true)<=target)return i;
    }
    return 1;
  }
  // Structural LLVM loop optimization: for one 256-byte row, perform the
  // exact sequential reads and writes of: dst[row+i]=src[row+map[i]].
  // Read C ABI pointers and data from their original heap. Do NOT use a
  // copied palette: aliasing requires read/modify/write order to be retained.
  // Returning false preserves execution of the original LLVM basic blocks.
  tryRemap256(sourceSlot,destSlot,mapPtr,rowOffset,destRowOffset=rowOffset) {
    if(typeof destRowOffset!=='bigint'||destRowOffset<0n||destRowOffset>BigInt(Number.MAX_SAFE_INTEGER)||
       (destRowOffset&255n)!==0n||typeof rowOffset!=='bigint'||rowOffset<0n||rowOffset>BigInt(Number.MAX_SAFE_INTEGER)||
       (rowOffset&255n)!==0n||!Number.isSafeInteger(sourceSlot)||
       !Number.isSafeInteger(destSlot)||!Number.isSafeInteger(mapPtr))return false;
    const row=Number(rowOffset),destRow=Number(destRowOffset);
    let source,dest;
    try {
      this.heap.check(sourceSlot,8);this.heap.check(destSlot,8);
      source=this.load(sourceSlot,'ptr');dest=this.load(destSlot,'ptr');
      this.heap.check(mapPtr,256);
      this.heap.check(source+row,256);this.heap.check(dest+destRow,256);
      // Avoid cached pointer values if output could overwrite pointer slots:
      // the original LLVM would reload on every iteration.
      const overlaps=(p,n,q,m)=>p<q+m&&q<p+n;
      if(overlaps(dest+destRow,256,sourceSlot,8)||overlaps(dest+destRow,256,destSlot,8))return false;
    } catch {return false;}
    const bytes=this.heap.u8;
    for(let i=0;i<256;i++)bytes[dest+destRow+i]=bytes[source+row+bytes[mapPtr+i]];
    return true;
  }
  // Semantic specialization of source-compiled LLVM slicing-by-eight CRC32.
  // The linker only requests this for a structural IR match; before replacing
  // anything we compare against the ORIGINAL translated function across
  // lengths, seeds and actual input bytes. The original stays available as
  // an automatic fallback. This is a generic checksum optimization.
  specializeSlicingCRC32(name,tableName) {
    const original=this.functions.get(name);
    if(typeof original!=='function')throw Error('Missing checksum definition '+name);
    const tablePtr=this.ptr(tableName);
    const ctx=this;
    if(tablePtr%4!==0)throw Error('Unaligned CRC32 slicing table');
    this.checksumOptimizations ??= [];
    const record={name,tableName,algorithm:'crc32-slicing-by-eight',verified:false,disabled:false};
    this.checksumOptimizations.push(record);
    function accelerated(ptr,length,seed) {
      const n=Number(length),addr=Number(ptr);
      if(!Number.isSafeInteger(n)||!Number.isSafeInteger(addr)||n<0||!Number.isInteger(seed))
        return original(ptr,length,seed);
      ctx.heap.check(addr,n);
      ctx.heap.check(tablePtr,8192);
      // Avoid retaining views across ABIHeap growth (it reallocates its buffer).
      const bytes=ctx.heap.u8;
      const view=ctx.heap.view;
      const T=new Uint32Array(ctx.heap.buffer,tablePtr,2048);
      let crc=(~seed)>>>0,i=0;
      for(;i+8<=n;i+=8){
        const x=(view.getUint32(addr+i,true)^crc)>>>0;
        const y=view.getUint32(addr+i+4,true);
        crc=(T[y>>>24]^T[256+((y>>>16)&255)]^
             T[512+((y>>>8)&255)]^T[768+(y&255)]^
             T[1024+(x>>>24)]^T[1280+((x>>>16)&255)]^
             T[1536+((x>>>8)&255)]^T[1792+(x&255)])>>>0;
      }
      for(;i<n;i++)crc=(T[(crc^bytes[addr+i])&255]^(crc>>>8))>>>0;
      return (~crc)|0;
    }
    const functionWrapper=(ptr,length,seed)=>{
      if(!record.verified&&!record.disabled){
        const n=Number(length);
        if(Number.isSafeInteger(n)&&n>=64){
          try {
            for(const sampleLen of [0,1,2,3,7,8,9,15,16,31,32,63,64]){
              for(const sampleSeed of [0,0x12345678,-1]){
                const expected=original(ptr,sampleLen,sampleSeed);
                const actual=accelerated(ptr,sampleLen,sampleSeed);
                if(actual!==expected)throw Error(`CRC32 parity mismatch length=${sampleLen} seed=${sampleSeed}`);
              }
            }
            const expected=original(ptr,n,seed),actual=accelerated(ptr,n,seed);
            if(actual!==expected)throw Error('CRC32 full-buffer parity mismatch');
            record.verified=true;
          }catch(err){record.disabled=true;record.reason=String(err);}
        }
      }
      if(record.disabled||!record.verified)return original(ptr,length,seed);
      return accelerated(ptr,length,seed);
    };
    this.functions.set(name,functionWrapper);
    return record;
  }
  blockAddress(name,label) {
    if(!this.functions.has(name))throw Error('Unlinked LLVM blockaddress function: '+name);
    const key=JSON.stringify([name,label]);
    if(this.blockAddresses.has(key))return this.blockAddresses.get(key);
    const ptr=this.heap.malloc(this.pointerBytes);
    this.blockAddresses.set(key,ptr);
    this.blocksByAddress.set(ptr,{functionName:name,label});
    return ptr;
  }
  resolveBlockAddress(ptr,functionName,allowedLabels) {
    if(!Number.isSafeInteger(ptr))throw TypeError('LLVM indirectbr pointer is not an address');
    const found=this.blocksByAddress.get(ptr);
    if(!found || found.functionName!==functionName || !allowedLabels.includes(found.label))
      throw Error('LLVM indirectbr target not a permitted block in '+functionName);
    return found.label;
  }
  callIndirect(ptr,args,argTypes=null) {
    if (!Number.isSafeInteger(ptr)) throw TypeError('Invalid function pointer');
    const symbol=this.functionsByAddress.get(ptr);
    if (!symbol) throw Error('Unlinked indirect C/C++ function pointer: '+ptr);
    return this.call(symbol,args,argTypes);
  }
  call(name, args, argTypes=null) {
    const mark = this.stackOffset;
    const seen = new Set();
    while (this.aliases.has(name)) {
      if (seen.has(name)) throw Error('Cyclic LLVM alias: ' + name);
      seen.add(name);
      name = this.aliases.get(name);
    }
    const f = this.functions.get(name) ?? this.libraries[name];
    if (typeof f !== 'function') throw Error(`Unresolved C/C++ function: ${name}`);
    this.callFrames.push({name,address:this.functionAddresses.get(name)??0});
    try {
      if(f.llvmNamedTypes!==undefined){
        const n=f.llvmNamedTypes.length;
        if(args.length<n)throw TypeError('Missing named arguments in variadic C call '+name);
        if(!Array.isArray(argTypes)) {
          if(args.length!==n)throw TypeError('Variadic C call requires LLVM argument types: '+name);
          argTypes=f.llvmNamedTypes.slice();
        }
        if(argTypes.length!==args.length || argTypes.slice(0,n).some((t,i)=>t!==f.llvmNamedTypes[i]))
          throw TypeError('Incompatible variadic C argument types: '+name);
        return f(...args,{__llvmVaTypes:true,types:argTypes.slice(n)});
      }
      return f(...args);
    } finally { this.callFrames.pop(); this.stackOffset = mark; }
  }
  // llvm.load.relative.i64(base, byteOffset) reads the signed 32-bit
  // relocation from base+offset and adds it to the original table base.
  loadRelative(base,offset){
    const table=this.offset(base),delta=this.load(table+this.offset(offset),'i32');
    return table+delta;
  }
  // x86_64 SysV ABI.  A va_list is a 24-byte __va_list_tag: gp_offset,
  // fp_offset, overflow_arg_area and reg_save_area.  The compiler's original
  // va_arg IR consumes and updates these fields, not a JS-specific iterator.
  createVaFrame(namedTypes,namedValues,values,types) {
    if(this.pointerBytes!==8)throw Error('SysV va_list needs 64-bit pointers');
    if(!Array.isArray(types)||values.length!==types.length||namedTypes.length!==namedValues.length)
      throw TypeError('Invalid variadic argument metadata');
    const entries=[...namedTypes.map((t,i)=>[t,namedValues[i]]),...types.map((t,i)=>[t,values[i]])];
    let gp=0,fp=0,overflowBytes=0;
    const kinds=[];
    for(const [type,value] of entries){
      const kind=type==='double'||type==='float'?'fp':/^(?:i(?:1|8|16|32|64)|ptr)$/.test(type)?'gp':
        type==='x86_fp80'?'extended':null;
      if(!kind)throw Error('Unsupported SysV variadic argument type: '+type);
      const isVar=kinds.length>=namedTypes.length;
      if(isVar&&type==='float')throw Error('Unpromoted float in variadic C call');
      let slot;
      if(kind==='gp'&&gp<6)slot={kind,index:gp++,type,value};
      else if(kind==='fp'&&fp<8)slot={kind,index:fp++,type,value};
      else {
        // x86-64 SysV long double (80 bits) uses a 16-byte stack slot,
        // aligned to 16; exhausted GP and FP arguments use 8-byte slots.
        const align=kind==='extended'?16:8;
        overflowBytes=(overflowBytes+align-1)&~(align-1);
        slot={kind:'overflow',offset:overflowBytes,type,value};
        overflowBytes+=kind==='extended'?16:8;
      }
      kinds.push(slot);
    }
    const registerArea=this.alloca(176,16);
    const overflowArea=this.alloca(Math.max(16,overflowBytes),16);
    this.heap.u8.fill(0,registerArea,registerArea+176);
    this.heap.u8.fill(0,overflowArea,overflowArea+Math.max(16,overflowBytes));
    const put=(address,item)=>{
      if(item.type==='x86_fp80')this.heap.u8.set(this.requireX87(item.value),address);
      else if(item.type==='double'||item.type==='float')this.store(address,'double',Number(item.value));
      else if(item.type==='ptr'||item.type==='i64')this.store(address,'i64',BigInt(item.value));
      else this.store(address,'i64',BigInt.asIntN(64,BigInt(item.value)));
    };
    for(const slot of kinds){
      const address=slot.kind==='gp'?registerArea+slot.index*8:
        slot.kind==='fp'?registerArea+48+slot.index*16:overflowArea+slot.offset;
      put(address,slot);
    }
    let namedGp=0,namedFp=0,namedOverflowBytes=0;
    for(const slot of kinds.slice(0,namedTypes.length)){
      if(slot.kind==='gp')namedGp++;
      else if(slot.kind==='fp')namedFp++;
      else namedOverflowBytes=slot.offset+(slot.type==='x86_fp80'?16:8);
    }
    return {gpOffset:namedGp*8,fpOffset:48+namedFp*16,
      overflowPtr:overflowArea+namedOverflowBytes,registerPtr:registerArea};
  }
  vaStart(ptr,frame){
    if(!frame||!Number.isSafeInteger(ptr))throw TypeError('Invalid llvm.va_start');
    this.store(ptr,'i32',frame.gpOffset);
    this.store(ptr+4,'i32',frame.fpOffset);
    this.store(ptr+8,'ptr',frame.overflowPtr);
    this.store(ptr+16,'ptr',frame.registerPtr);
  }
  alloca(bytes, alignment=8) {
    if (!Number.isSafeInteger(bytes) || bytes<0) throw RangeError('Invalid LLVM alloca size');
    if (!Number.isInteger(alignment)||alignment<1||alignment>4096||(alignment&(alignment-1)))
      throw RangeError('Invalid LLVM alloca alignment');
    if (this.stackBase === null) this.stackBase = this.heap.malloc(this.stackCapacity+4096);
    const alignedBase=(this.stackBase+this.stackOffset+alignment-1)&~(alignment-1);
    const offset=alignedBase-this.stackBase;
    const next=offset+Math.max(1,bytes);
    if (next>this.stackCapacity) throw Error('C function stack capacity exceeded');
    this.stackOffset=next;
    return alignedBase;
  }
  // Fixed-vector lane helpers preserve LLVM SSA value semantics.  Poison
  // lanes are represented by undefined, never replaced with fabricated zeros.
  vectorInsert(vector, value, index, count, type) {
    if (!Array.isArray(vector) || vector.length !== count) throw TypeError('Invalid LLVM vector');
    const lane = Number(index);
    if (!Number.isInteger(lane) || lane < 0 || lane >= count) throw RangeError('LLVM insertelement lane out of range');
    const next = vector.slice();
    next[lane] = type==='float' ? Math.fround(value) :
      type==='i64' ? BigInt.asIntN(64,BigInt(value)) : value;
    return next;
  }
  vectorExtract(vector, index, count, type) {
    if (!Array.isArray(vector) || vector.length !== count) throw TypeError('Invalid LLVM vector');
    const lane = Number(index);
    if (!Number.isInteger(lane) || lane < 0 || lane >= count) throw RangeError('LLVM extractelement lane out of range');
    const value = vector[lane];
    if (value === undefined) throw Error('Observed LLVM poison/undef vector lane');
    return type==='float' ? Math.fround(value) : value;
  }
  vectorBinary(op,left,right,count,type) {
    if(!Array.isArray(left)||!Array.isArray(right)||left.length!==count||right.length!==count||!Number.isInteger(count)||count<1||count>16)
      throw TypeError('Invalid LLVM binary vector input');
    return Array.from({length:count},(_,i)=>{
      const a=left[i],b=right[i];
      if(a===undefined||b===undefined)return undefined;
      let result;
      switch(op) {
        case 'fadd':case 'add':result=a+b;break;
        case 'fsub':case 'sub':result=a-b;break;
        case 'fmul':case 'mul':result=a*b;break;
        case 'fdiv':result=a/b;break;
        case 'and':result=a&b;break;
        case 'or':result=a|b;break;
        case 'xor':result=a^b;break;
        case 'shl':case 'lshr':case 'ashr':{
          const width = Number(type.slice(1));
          if(!Number.isInteger(width)||width<1||width>64)throw RangeError('Invalid vector integer shift width');
          const shift = Number(b);
          // LLVM shifts at/above the bit width produce poison, not modulo-width shifts.
          if(!Number.isInteger(shift)||shift<0||shift>=width)return undefined;
          if(width>32){
            const x=BigInt(a),n=BigInt(shift);
            result=op==='shl' ? x<<n : op==='ashr' ? BigInt.asIntN(width,x)>>n : BigInt.asUintN(width,x)>>n;
          } else {
            const signed=(a<<(32-width))>>(32-width);
            const unsigned=width===32?(a>>>0):(a&((1<<width)-1));
            result=op==='shl'? signed<<shift : op==='ashr'? signed>>shift : unsigned>>>shift;
          }
          break;
        }
        default:throw Error('Unsupported LLVM vector arithmetic '+op);
      }
      if(type==='float')return Math.fround(result);
      if(type==='double')return result;
      if(type==='i64')return BigInt.asIntN(64,BigInt(result));
      const width=Number(type.slice(1));
      if(width>32||width<8)throw Error('Unsupported LLVM integer vector width');
      return (result<<(32-width))>>(32-width);
    });
  }
  vectorShuffle(left,right,mask,leftCount,rightCount) {
    if(!Array.isArray(left)||!Array.isArray(right)||left.length!==leftCount||right.length!==rightCount||!Array.isArray(mask))
      throw TypeError('Invalid LLVM shuffle input');
    return mask.map(lane=>{
      if(lane===null)return undefined;
      if(!Number.isInteger(lane)||lane<0||lane>=leftCount+rightCount)throw RangeError('Invalid LLVM shuffle lane');
      return lane<leftCount?left[lane]:right[lane-leftCount];
    });
  }
  #vectorStride(type) {
    const sizes={float:4,double:8,i8:1,i16:2,i32:4,i64:8};
    const stride=sizes[type];
    if (!stride) throw Error('Unsupported LLVM vector element type: '+type);
    return stride;
  }
  vectorLoad(ptr, count, type) {
    const stride=this.#vectorStride(type);
    if (!Number.isInteger(count) || count<1 || count>16) throw RangeError('Invalid LLVM vector length');
    this.heap.check(ptr, count*stride);
    return Array.from({length:count},(_,i)=>this.load(ptr+i*stride,type));
  }
  vectorStore(ptr, vector, count, type) {
    const stride=this.#vectorStride(type);
    if (!Array.isArray(vector) || vector.length!==count || !Number.isInteger(count) || count<1 || count>16) throw TypeError('Invalid LLVM vector store');
    this.heap.check(ptr, count*stride);
    // Reject undefined values before writing *any* lanes.
    if (vector.some(v=>v===undefined)) throw Error('Observed LLVM poison/undef vector lane');
    for (let i=0;i<count;i++) this.store(ptr+i*stride,type,vector[i]);
  }
  reinterpretVectorBits(source, value, destination) {
    // Bit-exact LLVM bitcast across arbitrary fixed vectors and scalar values
    // of identical storage width, in the Clang x86_64 little-endian ABI.
    const describe = type => {
      const match = /^<(\d+) x (i8|i16|i32|i64|float|double)>$/.exec(type);
      const laneType = match ? match[2] : type;
      const count = match ? Number(match[1]) : 1;
      const sizes = {i8:1,i16:2,i32:4,i64:8,float:4,double:8};
      if (!sizes[laneType] || count < 1 || count > 16) throw TypeError('Unsupported LLVM bitcast type '+type);
      return {laneType,count,bytes:count*sizes[laneType],vector:!!match,stride:sizes[laneType]};
    };
    const src=describe(source),dst=describe(destination);
    if(src.bytes!==dst.bytes)throw TypeError('LLVM bitcast size mismatch '+source+' -> '+destination);
    const lanes=src.vector ? value : [value];
    if(!Array.isArray(lanes)||lanes.length!==src.count)throw TypeError('LLVM bitcast lane count mismatch');
    const bytes=new DataView(new ArrayBuffer(src.bytes));
    const write={i8:(off,v)=>bytes.setInt8(off,Number(v)),i16:(off,v)=>bytes.setInt16(off,Number(v),true),
      i32:(off,v)=>bytes.setInt32(off,Number(v),true),i64:(off,v)=>bytes.setBigInt64(off,BigInt(v),true),
      float:(off,v)=>bytes.setFloat32(off,Number(v),true),double:(off,v)=>bytes.setFloat64(off,Number(v),true)};
    const read={i8:off=>bytes.getInt8(off),i16:off=>bytes.getInt16(off,true),
      i32:off=>bytes.getInt32(off,true),i64:off=>bytes.getBigInt64(off,true),
      float:off=>bytes.getFloat32(off,true),double:off=>bytes.getFloat64(off,true)};
    lanes.forEach((v,i)=>{
      if(v===undefined)throw Error('Observed poison/undef LLVM bitcast lane');
      if((src.laneType==='float'||src.laneType==='double')&&Number.isNaN(v))
        throw Error('Cannot preserve input NaN payload through JS number');
      write[src.laneType](i*src.stride,v);
    });
    const result=Array.from({length:dst.count},(_,i)=>read[dst.laneType](i*dst.stride));
    if((dst.laneType==='float'||dst.laneType==='double')&&result.some(Number.isNaN))
      throw Error('Cannot preserve output NaN payload through JS number');
    return dst.vector ? result : result[0];
  }
  reinterpretBits(source, value, destination) {
    const data=new DataView(new ArrayBuffer(8));
    if(source==='i32' && destination==='float'){
      data.setInt32(0,Number(value)|0,true);
      const result=data.getFloat32(0,true);
      if(Number.isNaN(result))throw Error('Bitcast of NaN payload is not represented exactly in JavaScript');
      return result;
    }
    if(source==='float' && destination==='i32'){
      if(Number.isNaN(value))throw Error('Bitcast of NaN payload is not represented exactly in JavaScript');
      data.setFloat32(0,value,true);return data.getInt32(0,true);
    }
    if(source==='i64' && destination==='double'){
      data.setBigInt64(0,BigInt(value),true);
      const result=data.getFloat64(0,true);
      if(Number.isNaN(result))throw Error('Bitcast of NaN payload is not represented exactly in JavaScript');
      return result;
    }
    if(source==='double' && destination==='i64'){
      if(Number.isNaN(value))throw Error('Bitcast of NaN payload is not represented exactly in JavaScript');
      data.setFloat64(0,value,true);return data.getBigInt64(0,true);
    }
    throw Error('Unsupported LLVM bitcast '+source+' -> '+destination);
  }
  aggregateInsert(value, item, index, length) {
    if (!Array.isArray(value) || value.length!==length || index<0 || index>=length)
      throw TypeError('Invalid LLVM aggregate insert');
    const copy=value.slice();copy[index]=item;return copy;
  }
  aggregateExtract(value, index, length) {
    if (!Array.isArray(value) || value.length!==length || index<0 || index>=length)
      throw TypeError('Invalid LLVM aggregate extract');
    if (value[index]===undefined) throw Error('Observed poison/undef LLVM aggregate field');
    return value[index];
  }
  x86DivRem(bits, low, high, divisor) {
    if (bits!==32 && bits!==64) throw RangeError('Invalid x86 DIV width');
    const w=BigInt(bits), mask=(1n<<w)-1n;
    const numerator=((BigInt(high)&mask)<<w)|(BigInt(low)&mask);
    const d=BigInt(divisor)&mask;
    if (d===0n) throw RangeError('x86 DIV divide-by-zero');
    const quotient=numerator/d;
    if (quotient>mask) throw RangeError('x86 DIV quotient overflow');
    const rem=numerator%d;
    return bits===64?[BigInt.asIntN(64,quotient),BigInt.asIntN(64,rem)]:[Number(BigInt.asIntN(32,quotient)),Number(BigInt.asIntN(32,rem))];
  }
  assumeAlignment(ptr, alignment) {
    if (!Number.isSafeInteger(ptr) || !Number.isSafeInteger(alignment) || alignment<1 || (alignment & (alignment-1))!==0)
      throw TypeError('Invalid LLVM alignment assumption');
    if (ptr%alignment!==0) throw RangeError('Violation of LLVM alignment assumption');
  }
  atomicFence(order) {
    if (!['acquire','release','acq_rel','seq_cst'].includes(order)) throw TypeError('Invalid LLVM fence order');
    if (this.threadModel!=='single') throw Error('Cross-thread fences require shared-memory atomics');
    // Under an enforced single-thread memory model, operations execute in
    // source order. No guarantee is made for multi-threaded C++ code.
  }
  // LLVM atomic operations on the explicitly single-threaded browser target.
  // An ArrayBuffer plus one JS event loop preserves each instruction's sequential
  // effects, but DOES NOT provide inter-thread memory-order guarantees.
  #checkAtomic(ptr, type, order, operation, alignment) {
    const widths = {i8:1, i16:2, i32:4, i64:8, ptr:this.pointerBytes};
    const width = widths[type];
    if (!width) throw Error('Unsupported atomic type: '+type);
    const accepted = {
      load: ['unordered','monotonic','acquire','seq_cst'],
      store:['unordered','monotonic','release','seq_cst'],
      rmw:['monotonic','acquire','release','acq_rel','seq_cst']
    };
    if (!accepted[operation].includes(order)) throw Error('Invalid LLVM atomic ordering '+order+' for '+operation);
    if (!Number.isSafeInteger(ptr) || ptr % width !== 0 || (alignment && alignment < width)) {
      throw RangeError('Unaligned LLVM atomic access');
    }
    this.heap.check(ptr, width);
    if (this.threadModel !== 'single') throw Error('Concurrent LLVM atomics require a real shared-memory backend');
    return width;
  }
  atomicLoad(ptr, type, order, alignment=0) {
    this.#checkAtomic(ptr,type,order,'load',alignment);
    return this.load(ptr,type);
  }
  atomicStore(ptr, type, value, order, alignment=0) {
    this.#checkAtomic(ptr,type,order,'store',alignment);
    this.store(ptr,type,type==='i64'?BigInt(value):value);
  }
  atomicCmpXchg(ptr, type, expected, replacement, successOrder, failureOrder, alignment=0) {
    this.#checkAtomic(ptr,type,successOrder,'rmw',alignment);
    if (!['monotonic','acquire','seq_cst'].includes(failureOrder)) throw Error('Invalid cmpxchg failure ordering');
    // Current LLVM LangRef permits release/acquire and other combinations;
    // only failure 'release'/'acq_rel' are invalid. Single-threaded host
    // executes atomics in program order; a true concurrent backend is gated.
    const old=this.load(ptr,type);
    const width=type==='ptr'?this.pointerBytes*8:Number(type.slice(1));
    const cast=n=>width===64?BigInt.asUintN(64,BigInt(n)) :
      width===32?Number(n)>>>0 : Number(n)&((1<<width)-1);
    const success=cast(old)===cast(expected);
    if (success) this.store(ptr,type,cast(replacement));
    return [old,success?1:0];
  }
  atomicRMW(ptr, type, operation, value, order, alignment=0) {
    const bytes=this.#checkAtomic(ptr,type,order,'rmw',alignment);
    const width=bytes*8;
    const old=this.load(ptr,type);
    const signed=n=>width===64?BigInt.asIntN(64,BigInt(n)):(Number(n)<<(32-width)>>(32-width));
    const unsigned=n=>width===64?BigInt.asUintN(64,BigInt(n)):(width===32?Number(n)>>>0:Number(n)&((1<<width)-1));
    const uold=unsigned(old), uval=unsigned(value);
    let next;
    switch(operation) {
      case 'xchg': next=uval;break;
      case 'add':next=uold+uval;break;
      case 'sub':next=uold-uval;break;
      case 'and':next=uold & uval;break;
      case 'or':next=uold | uval;break;
      case 'xor':next=uold ^ uval;break;
      case 'nand':next=~(uold & uval);break;
      case 'max':next=signed(old)>signed(value)?old:value;break;
      case 'min':next=signed(old)<signed(value)?old:value;break;
      case 'umax':next=uold>uval?uold:uval;break;
      case 'umin':next=uold<uval?uold:uval;break;
      default:throw Error('Unsupported LLVM atomicrmw: '+operation);
    }
    next=unsigned(next);
    this.store(ptr,type,next);
    return old;
  }
  load(ptr, type) {
    // Hot path: most game memory accesses are scalar. Resolve directly to the
    // ABI data view rather than allocating a lookup object and running an iN
    // regular expression for every load. Preserve all existing bounds checks.
    switch(type){
      case 'ptr':return Number(this.heap.read(ptr,this.pointerBytes===8?'u64':'u32'));
      case 'i1':return this.heap.read(ptr,'u8');
      case 'i8':return this.heap.read(ptr,'i8');
      case 'i16':return this.heap.read(ptr,'i16');
      case 'i32':return this.heap.read(ptr,'i32');
      case 'i64':return this.heap.read(ptr,'i64');
      case 'float':return this.heap.read(ptr,'f32');
      case 'double':return this.heap.read(ptr,'f64');
    }
    const wide=/^i(\d+)$/.exec(type);
    if(wide){
      const bits=Number(wide[1]);
      if(bits>=1&&bits<=128){
        const bytes=Math.ceil(bits/8);
        this.heap.check(ptr,bytes);
        let val=0n;
        for(let i=bytes-1;i>=0;i--)val=(val<<8n)|BigInt(this.heap.u8[ptr+i]);
        const decoded=BigInt.asIntN(bits,val);
        return bits<=32?Number(decoded):decoded;
      }
    }
    return this.heap.read(ptr,type);
  }
  store(ptr, type, value) {
    switch(type){
      case 'ptr':return this.heap.write(ptr,this.pointerBytes===8?'u64':'u32',this.pointerBytes===8?BigInt(value):value);
      case 'i1':return this.heap.write(ptr,'u8',value);
      case 'i8':return this.heap.write(ptr,'i8',value);
      case 'i16':return this.heap.write(ptr,'i16',value);
      case 'i32':return this.heap.write(ptr,'i32',value);
      case 'i64':return this.heap.write(ptr,'i64',BigInt(value));
      case 'float':return this.heap.write(ptr,'f32',value);
      case 'double':return this.heap.write(ptr,'f64',value);
    }
    const wide=/^i(\d+)$/.exec(type);
    if(wide){
      const bits=Number(wide[1]);
      if(bits>=1&&bits<=128){
        const bytes=Math.ceil(bits/8);
        this.heap.check(ptr,bytes);
        let val=BigInt.asUintN(bits,BigInt(value));
        for(let i=0;i<bytes;i++){this.heap.u8[ptr+i]=Number(val&255n);val>>=8n;}
        return;
      }
    }
    return this.heap.write(ptr,type,value);
  }
  validate(references) {
    const unbound = references.filter(name => !this.functions.has(name) && !this.globalPointers.has(name) && !this.aliases.has(name) && typeof this.libraries[name] !== 'function');
    if (unbound.length) throw Error(`Unlinked functions/globals: ${unbound.join(', ')}`);
    return true;
  }
}
