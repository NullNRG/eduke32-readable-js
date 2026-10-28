/** POSIX-compatible process services with explicit host capability boundaries.
 * Native Node host can supply resource counters and Atomics.wait sleep.
 * Browser host reports ENOSYS instead of fabricating counters or blocking UI.
 */
export function createPosixProcessServices({heap,errnoLocation,raiseSignal}={}){
 if(!heap||typeof errnoLocation!=='function')throw TypeError('Missing POSIX ABI dependencies');
 const fail=(code)=>{heap.write(errnoLocation(),'i32',code);return -1;};
 const timeval=(p,t)=>{
   const usec=BigInt(t);heap.write(p,'i64',usec/1000000n);heap.write(p+8,'i64',usec%1000000n);
 };
 return Object.freeze({
   getrusage:(who,ptr)=>{
     if(who!==0)return fail(22); // RUSAGE_SELF only; no child processes
     const usage=globalThis.process?.resourceUsage?.();
     if(!usage)return fail(38); // ENOSYS in browsers
     heap.check(Number(ptr),144);heap.memset(Number(ptr),0,144);
     timeval(Number(ptr),usage.userCPUTime);timeval(Number(ptr)+16,usage.systemCPUTime);
     const fields=['maxRSS','sharedMemorySize','unsharedDataSize','unsharedStackSize',
      'minorPageFault','majorPageFault','swappedOut','fsRead','fsWrite','ipcSent','ipcReceived','signalsCount',
      'voluntaryContextSwitches','involuntaryContextSwitches'];
     fields.forEach((name,i)=>heap.write(Number(ptr)+32+i*8,'i64',BigInt(usage[name]??0)));
     return 0;
   },
   nanosleep:(req,rem)=>{
     heap.check(Number(req),16);
     const sec=heap.read(Number(req),'i64'),ns=heap.read(Number(req)+8,'i64');
     if(sec<0n||ns<0n||ns>=1000000000n)return fail(22);
     // Atomics.wait is expressly forbidden on the browser's main thread;
     // there is no synchronous host sleep there. Correct ENOSYS branch.
     if(typeof globalThis.process?.resourceUsage!=='function'||typeof Atomics.wait!=='function'||typeof SharedArrayBuffer==='undefined')return fail(38);
     const ms=Number(sec)*1000+Number(ns)/1e6;
     if(!Number.isFinite(ms)||ms>3600000)return fail(22);
     const buf=new Int32Array(new SharedArrayBuffer(4));
     Atomics.wait(buf,0,0,ms);
     if(rem){heap.check(Number(rem),16);heap.memset(Number(rem),0,16);}
     return 0;
   },
   kill:(pid,sig)=>{
     if(Number(pid)!==1)return fail(3); // virtual ABI single-process pid
     if(!Number.isInteger(sig)||sig<0||sig>64)return fail(22);
     if(sig===0)return 0; // POSIX existence probe
     if(typeof raiseSignal!=='function')return fail(38);
     return raiseSignal(sig);
   },
 });
}
