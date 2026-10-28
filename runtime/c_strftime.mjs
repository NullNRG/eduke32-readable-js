/** C strftime over the x86_64 glibc 56-byte struct tm.
 * The supported conversion set is deliberately explicit: any unsupported
 * specifier raises an error instead of manufacturing a date/time string.
 */
export function createCStrftime({heap}={}){
  if(!heap)throw TypeError('strftime needs the ABI heap');
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const enc=new TextEncoder();
  const pad=(v,n=2,char='0')=>String(v).padStart(n,char);
  function format(formatPtr,tm){
    heap.check(tm,56);
    const [sec,min,hour,mday,month,yr,weekday,yday,isdst]=Array.from({length:9},(_,i)=>heap.read(tm+4*i,'i32'));
    const year=yr+1900;
    if(month<0||month>11||weekday<0||weekday>6||mday<1||mday>31||hour<0||hour>23||min<0||min>59||sec<0||sec>60||yday<0||yday>365)
      throw RangeError('Invalid struct tm values');
    const gmtoff=Number(heap.read(tm+40,'i64'));
    const zonePtr=Number(heap.read(tm+48,'u64'));
    const zone=zonePtr?heap.readCString(zonePtr):'';
    const offsetSign=gmtoff<0?'-':'+';
    const offset=pad(Math.floor(Math.abs(gmtoff)/3600))+pad(Math.floor((Math.abs(gmtoff)%3600)/60));
    const twelve=hour%12||12;
    const parts={
      Y:()=>pad(year,4),y:()=>pad(((year%100)+100)%100),C:()=>pad(Math.floor(year/100)),
      m:()=>pad(month+1),d:()=>pad(mday),e:()=>pad(mday,2,' '),
      H:()=>pad(hour),k:()=>pad(hour,2,' '),I:()=>pad(twelve),l:()=>pad(twelve,2,' '),
      M:()=>pad(min),S:()=>pad(sec),p:()=>hour<12?'AM':'PM',P:()=>hour<12?'am':'pm',
      a:()=>days[weekday].slice(0,3),A:()=>days[weekday],
      b:()=>months[month].slice(0,3),h:()=>months[month].slice(0,3),B:()=>months[month],
      w:()=>String(weekday),u:()=>String(weekday||7),j:()=>pad(yday+1,3),
      z:()=>offsetSign+offset,Z:()=>zone,n:()=> '\n',t:()=> '\t',
      s:()=>String(Math.trunc((Date.UTC(year,month,mday,hour,min,sec)-gmtoff*1000)/1000)),
      '%':()=>'%'
    };
    const composite={F:'%Y-%m-%d',T:'%H:%M:%S',R:'%H:%M',D:'%m/%d/%y',r:'%I:%M:%S %p',x:'%m/%d/%y',X:'%H:%M:%S',c:'%a %b %e %H:%M:%S %Y'};
    const src=heap.readCString(formatPtr);
    function expand(value,depth=0){
      if(depth>8)throw Error('strftime format recursion');
      let out='';
      for(let i=0;i<value.length;i++){
        if(value[i]!=='%'){out+=value[i];continue;}
        if(++i>=value.length)throw Error('Incomplete strftime conversion');
        let spec=value[i];
        if(spec==='E'||spec==='O'){
          if(++i>=value.length)throw Error('Incomplete strftime modifier');spec=value[i];
        }
        if(composite[spec])out+=expand(composite[spec],depth+1);
        else if(parts[spec])out+=parts[spec]();
        else throw Error('Unsupported strftime specifier %'+spec);
      }
      return out;
    }
    return enc.encode(expand(src));
  }
  return Object.freeze({
    strftime:(dest,capacity,pattern,tm)=>{
      const length=Number(capacity);
      if(!Number.isSafeInteger(length)||length<0)throw RangeError('Invalid strftime capacity');
      if(!length)return 0n;
      const data=format(pattern,tm);
      if(data.length>=length)return 0n;
      heap.check(dest,length);
      heap.u8.set(data,dest);heap.write(dest+data.length,'u8',0);
      return BigInt(data.length);
    },
  });
}
