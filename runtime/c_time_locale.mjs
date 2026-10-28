/** C-locale/POSIX time and errno adapters using the host's actual local time.
 * x86-64 glibc struct tm: 9x i32, padding, gmtoff i64, zone char*.
 */
export function createCTimeLocale({heap,errnoLocation,wallClock=()=>Date.now(),monotonicClock=()=>globalThis.performance?.now?.()}={}){
  if(!heap||!errnoLocation)throw TypeError('C time ABI requires heap and errno');
  const fail=code=>{heap.write(errnoLocation(),'i32',code);return 0;};
  const strings=new Map(),intern=s=>{
    const name=String(s);if(!strings.has(name))strings.set(name,heap.writeCString(name));return strings.get(name);
  };
  const errnoNames=new Map([
    [1,'Operation not permitted'],[2,'No such file or directory'],[3,'No such process'],
    [4,'Interrupted system call'],[5,'Input/output error'],[6,'No such device or address'],
    [9,'Bad file descriptor'],[11,'Resource temporarily unavailable'],[12,'Cannot allocate memory'],
    [13,'Permission denied'],[14,'Bad address'],[16,'Device or resource busy'],
    [17,'File exists'],[20,'Not a directory'],[21,'Is a directory'],
    [22,'Invalid argument'],[28,'No space left on device'],[30,'Read-only file system'],
    [34,'Numerical result out of range'],[35,'Resource deadlock avoided'],
    [38,'Function not implemented'],[95,'Operation not supported'],
  ]);
  const errorText=n=>errnoNames.get(Number(n))??`Unknown error ${Number(n)}`;
  let localtimeBuffer=0;
  function writeTM(input,out){
    if(!input||!out)return fail(22);
    heap.check(input,8);heap.check(out,56);
    const seconds=heap.read(input,'i64');
    const milliseconds=Number(seconds)*1000;
    if(!Number.isFinite(milliseconds)||Math.abs(milliseconds)>8.64e15)return fail(75);
    const d=new Date(milliseconds);if(Number.isNaN(d.getTime()))return fail(75);
    const first=new Date(d.getFullYear(),0,1),july=new Date(d.getFullYear(),6,1);
    const offset=d.getTimezoneOffset(),standard=Math.max(first.getTimezoneOffset(),july.getTimezoneOffset());
    const yday=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,1))/86400000);
    const values=[d.getSeconds(),d.getMinutes(),d.getHours(),d.getDate(),d.getMonth(),d.getFullYear()-1900,d.getDay(),yday,+(offset<standard)];
    heap.memset(out,0,56);values.forEach((value,i)=>heap.write(out+i*4,'i32',value));
    heap.write(out+40,'i64',BigInt(-offset*60));
    let zone='';
    try{zone=new Intl.DateTimeFormat('en-US',{timeZoneName:'short'}).formatToParts(d).find(x=>x.type==='timeZoneName')?.value??'';}catch{}
    if(!zone)zone=d.toString().match(/\(([^)]+)\)$/)?.[1]??'Local';
    heap.write(out+48,'u64',BigInt(intern(zone)));
    return out;
  }
  const nowNS=fn=>{
    const value=fn();if(!Number.isFinite(value)||value<0)throw Error('Time source not available');
    return BigInt(Math.trunc(value*1000000));
  };
  return Object.freeze({
    localtime_r:(input,out)=>writeTM(input,out),
    localtime:input=>{if(!localtimeBuffer)localtimeBuffer=heap.malloc(56);return writeTM(input,localtimeBuffer);},
    strerror:err=>intern(errorText(err)),
    strerror_r:(err,ptr,size)=>{
      const data=new TextEncoder().encode(errorText(err));size=Number(size);
      if(!Number.isSafeInteger(size)||size<0)return 0;
      if(size){heap.check(ptr,size);const n=Math.min(size-1,data.length);heap.u8.set(data.subarray(0,n),ptr);heap.write(ptr+n,'u8',0);}
      // This selected GNU ABI returns char* (unlike XSI's int variant).
      return data.length>=size?intern(errorText(err)):ptr;
    },
    '_ZNSt6chrono3_V212steady_clock3nowEv':()=>nowNS(monotonicClock),
    '_ZNSt6chrono3_V212system_clock3nowEv':()=>nowNS(wallClock),
    '_ZNSt6thread20hardware_concurrencyEv':()=>{
      const count=globalThis.navigator?.hardwareConcurrency;
      return Number.isInteger(count)&&count>0?count:0;
    },
  });
}
