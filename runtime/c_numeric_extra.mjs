/** C/POSIX numeric and host-information APIs, x86_64 glibc ABI.
 * All exported operations have a defined implementation; forbidden browser
 * system operations remain unresolved rather than receiving success stubs.
 */
import {sourceByteView,sourceByteOffset,sourceCString} from './source_bytes.mjs';
export function createCNumericExtra({heap,errnoLocation,random=Math.random}={}){
  if(!heap||!errnoLocation)throw TypeError('C numeric runtime needs ABI heap');
  const EINVAL=22,ERANGE=34;
  let seed=1;
  const err=e=>heap.write(errnoLocation(),'i32',e);
  const parseFloat=(input,endPtr)=>{
    if(!input){err(EINVAL);return 0;}
    const borrowed=sourceByteView(input);
    const original=sourceCString(input,heap);
    const start=/^[\x09-\x0d\x20]*/.exec(original)[0].length;
    const text=original.slice(start);
    const special=/^[+-]?(?:inf(?:inity)?|nan(?:\([^)]*\))?)/i.exec(text);
    const decimal=/^[+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/.exec(text);
    const hex=/^([+-]?)0[xX]((?:[0-9a-fA-F]+(?:\.[0-9a-fA-F]*)?|\.[0-9a-fA-F]+))(?:[pP]([+-]?\d+))?/.exec(text);
    let chosen=null,value=0;
    // A hex floating literal needs a mandatory binary exponent in ISO C.
    if(hex && hex[3]!==undefined){
      chosen=hex[0];const integer=hex[2].split('.');
      let v=0;for(const digit of integer[0])v=v*16+parseInt(digit,16);
      for(let i=0;i<(integer[1]??'').length;i++)v+=parseInt(integer[1][i],16)/Math.pow(16,i+1);
      value=v*Math.pow(2,Number(hex[3]));if(hex[1]==='-')value=-value;
    }
    if(decimal && (!chosen||decimal[0].length>chosen.length)) {chosen=decimal[0];value=Number(chosen);}
    if(special && (!chosen||special[0].length>chosen.length)){
      chosen=special[0];value=/^[+-]?nan/i.test(chosen)?NaN:chosen[0]==='-'?-Infinity:Infinity;
    }
    if(endPtr){
      const consumed=chosen?start+chosen.length:0;
      const address=borrowed?(consumed===0?input:sourceByteOffset(input,consumed)):Number(input)+consumed;
      if(endPtr.__cReference===true)endPtr.value=address;
      else{
        if(borrowed)throw TypeError('Source floating end pointer requires original reference storage');
        if(typeof endPtr!=='number'&&typeof endPtr!=='bigint')throw TypeError('C floating end pointer lacks verified pointer storage');
        heap.write(Number(endPtr),'u64',BigInt(address));
      }
    }
    if(!chosen)return 0;
    if(!special && !Number.isFinite(value))err(ERANGE);
    if(!special && value===0){
      const mantissa=/^[+-]?0[xX]/.test(chosen)?chosen.replace(/^[+-]?0[xX]/,'').split(/[pP]/)[0]:chosen.replace(/^[+-]/,'').split(/[eE]/)[0];
      if(/[1-9a-f]/i.test(mantissa))err(ERANGE);
    }
    return value;
  };
  const inetAddr=(value)=>{
    // inet_addr accepts 1-4 dotted groups and C-style octal/hex; this
    // deliberately restricts to well-defined modern dotted decimal.
    const parts=value.split('.');if(parts.length!==4)return 0xffffffff;
    const nums=parts.map(p=>/^\d{1,3}$/.test(p)?Number(p):NaN);
    if(nums.some(n=>!Number.isInteger(n)||n<0||n>255))return 0xffffffff;
    return ((nums[0])|(nums[1]<<8)|(nums[2]<<16)|(nums[3]<<24))>>>0;
  };
  const formatInet=(src,af)=>{
    if(af===2){heap.check(src,4);return Array.from(heap.bytes(src,4)).join('.');}
    if(af===10){heap.check(src,16);const w=[];
      for(let i=0;i<8;i++)w.push(((heap.read(src+i*2,'u8')<<8)|heap.read(src+i*2+1,'u8')).toString(16));
      // Straight eight-group IPv6 is legal; compression is optional.
      return w.join(':');
    }
    return null;
  };
  let inetStatic=0,passwdRecord=0;
  const sandboxUid=65534;
  const passwd=()=>{
    if(!passwdRecord){
      // x86-64 glibc struct passwd: name +0, passwd +8, uid +16,
      // gid +20, gecos +24, home +32, shell +40 (48 bytes).
      // Matches this adapter's virtual unprivileged getuid(), not the host user.
      passwdRecord=heap.calloc(1,48);
      for(const [off,val] of [[0,'guest'],[8,'x'],[24,'Browser sandbox'],[32,'/home/guest'],[40,'/bin/false']])
        heap.write(passwdRecord+off,'u64',BigInt(heap.writeCString(val)));
      heap.write(passwdRecord+16,'u32',sandboxUid);
      heap.write(passwdRecord+20,'u32',sandboxUid);
    }
    return passwdRecord;
  };
  return Object.freeze({
    rand:()=>{ // ISO C provides RAND_MAX>=32767. LCG deterministic, not crypto.
      seed=(Math.imul(seed,1103515245)+12345)>>>0;return (seed>>>1)&0x7fffffff;
    },
    srand:n=>{seed=Number(n)>>>0;},
    strtod:parseFloat,
    inet_addr:ptr=>inetAddr(heap.readCString(ptr)),
    inet_ntoa:ptr=>{
      if(!inetStatic)inetStatic=heap.malloc(16);
      const bytes=new TextEncoder().encode(formatInet(ptr,2));
      heap.memset(inetStatic,0,16);heap.u8.set(bytes,inetStatic);return inetStatic;
    },
    inet_pton:(af,src,dst)=>{
      const s=heap.readCString(src);
      if(af===2){const ip=inetAddr(s);if(ip===0xffffffff&&s!=='255.255.255.255')return 0;
        heap.check(dst,4);for(let i=0;i<4;i++)heap.write(dst+i,'u8',(ip>>>(i*8))&255);return 1;
      }
      if(af!==10){err(97);return -1;}
      // IPv6 :: compression with at most one double-colon; embedded IPv4 unsupported.
      if(!/^[0-9a-fA-F:]+$/.test(s))return 0;
      const k=s.indexOf('::');if(k!==-1&&s.indexOf('::',k+2)!==-1)return 0;
      const parts=s.split('::');if(parts.length>2)return 0;
      const a=parts[0]?parts[0].split(':'):[],b=parts.length===2&&parts[1]?parts[1].split(':'):[];
      if([...a,...b].some(x=>!x||x.length>4||!/^[\da-f]+$/i.test(x)))return 0;
      if(k===-1 && a.length!==8)return 0;
      if(k!==-1&&a.length+b.length>=8)return 0;
      const all=k===-1?a:[...a,...Array(8-a.length-b.length).fill('0'),...b];
      heap.check(dst,16);all.forEach((t,i)=>{let n=parseInt(t,16);heap.write(dst+2*i,'u8',n>>>8);heap.write(dst+2*i+1,'u8',n&255);});return 1;
    },
    inet_ntop:(af,src,dst,size)=>{
      const s=formatInet(src,af);if(s===null){err(97);return 0;}
      const bytes=new TextEncoder().encode(s);size=Number(size);
      if(bytes.length+1>size){err(28);return 0;}
      heap.check(dst,bytes.length+1);heap.u8.set(bytes,dst);heap.write(dst+bytes.length,'u8',0);return dst;
    },
    getpid:()=>1, // one virtual in-browser process, stable identity
    getuid:()=>sandboxUid, // sandboxed unprivileged virtual identity, not OS UID
    getpwuid:uid=>Number(uid)===sandboxUid?passwd():0,
    sysconf:name=>{
      // x86_64 glibc constants: _SC_CLK_TCK=2, _SC_PAGESIZE=30.
      if(name===2)return 100n;
      if(name===30)return 4096n;
      if(name===84){const n=globalThis.navigator?.hardwareConcurrency;return BigInt(Number.isInteger(n)&&n>0?n:1);}
      err(EINVAL);return -1n;
    },
    gethostname:(ptr,size)=>{
      const name='eduke-browser';size=Number(size);
      if(!Number.isSafeInteger(size)||size<name.length+1){err(36);return -1;}
      heap.check(ptr,size);heap.u8.set(new TextEncoder().encode(name),ptr);heap.write(ptr+name.length,'u8',0);return 0;
    },
  });
}
