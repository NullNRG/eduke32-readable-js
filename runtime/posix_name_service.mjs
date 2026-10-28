/** Synchronous, deterministic POSIX numerical name service for the browser ABI.
 * Resolves numeric IPv4/IPv6 and localhost; external DNS is not synchronously
 * available in browser JS and is explicitly rejected (EAI_AGAIN).
 * Linux x86-64 addrinfo, sockaddr_in, sockaddr_in6 and hostent layouts.
 */
export function createPosixNameService({heap,errnoLocation}={}){
 if(!heap||!errnoLocation)throw TypeError('Name service ABI requires heap and errno');
 const AF_UNSPEC=0,AF_INET=2,AF_INET6=10;
 const owns=new Map(),hostObjects=[];
 const num=n=>{n=Number(n);if(!Number.isSafeInteger(n)||n<0)throw RangeError('Invalid pointer');return n;};
 const cstr=p=>p?heap.readCString(num(p)):null;
 const ipv4=s=>{
  if(!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(s))return null;
  const nums=s.split('.').map(Number);return nums.every((n,i)=>Number.isSafeInteger(n)&&n<=255)?Uint8Array.from(nums):null;
 };
 const ipv6=s=>{
  if(typeof s!=='string'||s.includes('%'))return null;
  let words=s.split('::');if(words.length>2)return null;
  const expand=part=>{
   if(!part)return [];
   const items=part.split(':');const out=[];
   for(let i=0;i<items.length;i++){
    const v4=ipv4(items[i]);if(v4){if(i!==items.length-1)return null;out.push((v4[0]<<8)|v4[1],(v4[2]<<8)|v4[3]);}
    else {if(!/^[0-9a-fA-F]{1,4}$/.test(items[i]))return null;out.push(parseInt(items[i],16));}
   }
   return out;
  };
  const l=expand(words[0]),r=expand(words[1]??'');if(!l||!r)return null;
  if(words.length===1&&l.length!==8 || words.length===2&&l.length+r.length>=8)return null;
  const data=[...l,...new Array(8-l.length-r.length).fill(0),...r];if(data.length!==8)return null;
  return Uint8Array.from(data.flatMap(w=>[w>>8,w&255]));
 };
 const format6=bytes=>{
  const words=Array.from({length:8},(_,i)=>(bytes[i*2]<<8)|bytes[i*2+1]);
  let bestStart=-1,bestLen=1;
  for(let i=0;i<8;){if(words[i]!==0){i++;continue;}let j=i;while(j<8&&words[j]===0)j++;
    if(j-i>bestLen){bestStart=i;bestLen=j-i;}i=j;}
  if(bestStart<0)return words.map(w=>w.toString(16)).join(':');
  const l=words.slice(0,bestStart).map(w=>w.toString(16)).join(':');
  const r=words.slice(bestStart+bestLen).map(w=>w.toString(16)).join(':');
  return l+'::'+r;
 };
 const network16=(p,value)=>{heap.write(p,'u8',(value>>>8)&255);heap.write(p+1,'u8',value&255);};
 const EAI={BADFLAGS:-1,NONAME:-2,AGAIN:-3,FAMILY:-6,SOCKTYPE:-7,SERVICE:-8};
 function serviceNumber(s){
  if(s===null||s==='')return 0;
  if(/^\d+$/.test(s)){const n=Number(s);return n<=65535?n:null;}
  return ({http:80,https:443,ftp:21,ssh:22,domain:53})[s]??null;
 }
 const errno=e=>{heap.write(errnoLocation(),'i32',e);return -1;};
 const symbols={
  getaddrinfo:(nodePtr,servicePtr,hintsPtr,resPtr)=>{
   if(!resPtr)return EAI.NONAME;
   heap.check(num(resPtr),8);heap.write(num(resPtr),'u64',0n);
   const node=cstr(nodePtr),service=cstr(servicePtr);
   if(node===null&&service===null)return EAI.NONAME;
   let flags=0,family=AF_UNSPEC,socktype=0,protocol=0;
   if(hintsPtr){const p=num(hintsPtr);heap.check(p,48);flags=heap.read(p,'i32');family=heap.read(p+4,'i32');socktype=heap.read(p+8,'i32');protocol=heap.read(p+12,'i32');}
   if(flags&~(1|2|4|8|0x20|0x400))return EAI.BADFLAGS;
   if(![AF_UNSPEC,AF_INET,AF_INET6].includes(family))return EAI.FAMILY;
   if(![0,1,2].includes(socktype))return EAI.SOCKTYPE;
   const port=serviceNumber(service);if(port===null)return EAI.SERVICE;
   if(service&&!/^\d+$/.test(service)&&(flags&0x400))return EAI.NONAME;
   let addr4=null,addr6=null;
   if(node===null){addr4=Uint8Array.of(0,0,0,0);addr6=new Uint8Array(16);
     if(!(flags&1)){addr4=Uint8Array.of(127,0,0,1);addr6=new Uint8Array(16);addr6[15]=1;}}
   else {addr4=ipv4(node);addr6=ipv6(node);
     if(!addr4&&!addr6){if((flags&4)||!['localhost'].includes(node.toLowerCase()))return (flags&4)?EAI.NONAME:EAI.AGAIN;
       addr4=Uint8Array.of(127,0,0,1);addr6=new Uint8Array(16);addr6[15]=1;}
   }
   const items=[];if(addr4&&(family===AF_UNSPEC||family===AF_INET))items.push({family:AF_INET,addr:addr4});
   if(addr6&&(family===AF_UNSPEC||family===AF_INET6))items.push({family:AF_INET6,addr:addr6});
   if(!items.length)return EAI.NONAME;
   const ptrs=[];
   for(const item of items){
    const sa=heap.calloc(1,item.family===AF_INET?16:28);ptrs.push(sa);
    heap.write(sa,'u16',item.family);network16(sa+2,port);heap.u8.set(item.addr,sa+(item.family===AF_INET?4:8));
    const ai=heap.calloc(1,48);ptrs.push(ai);
    heap.write(ai,'i32',flags);heap.write(ai+4,'i32',item.family);
    heap.write(ai+8,'i32',socktype);heap.write(ai+12,'i32',protocol);
    heap.write(ai+16,'u32',item.family===AF_INET?16:28);
    heap.write(ai+24,'u64',BigInt(sa));
   }
   for(let i=1;i<ptrs.length/2;i++)heap.write(ptrs[(i-1)*2+1]+40,'u64',BigInt(ptrs[i*2+1]));
   const head=ptrs[1];owns.set(head,ptrs);heap.write(resPtr,'u64',BigInt(head));return 0;
  },
  freeaddrinfo:ptr=>{
   if(!ptr)return;
   const owned=owns.get(num(ptr));if(!owned)throw Error('freeaddrinfo called with unowned pointer');
   for(const p of owned)heap.free(p);owns.delete(num(ptr));
  },
  getnameinfo:(saPtr,salen,hostPtr,hostlen,servPtr,servlen,flags)=>{
    saPtr=num(saPtr);salen=Number(salen);flags=Number(flags);
    if(!saPtr||salen<16)return EAI.FAMILY;
    heap.check(saPtr,salen);const family=heap.read(saPtr,'u16');
    if(family!==AF_INET&&family!==AF_INET6||family===AF_INET6&&salen<28)return EAI.FAMILY;
    const bytes=heap.bytes(saPtr+(family===AF_INET?4:8),family===AF_INET?4:16);
    const port=(heap.read(saPtr+2,'u8')<<8)|heap.read(saPtr+3,'u8');
    const host=family===AF_INET?Array.from(bytes).join('.'):format6(bytes);
    const service=String(port);
    if(hostPtr){if(num(hostlen)<=enc(host).length)return -12;heap.check(num(hostPtr),num(hostlen));heap.u8.set(enc(host),num(hostPtr));heap.write(num(hostPtr)+enc(host).length,'u8',0);}
    if(servPtr){if(num(servlen)<=enc(service).length)return -12;heap.check(num(servPtr),num(servlen));heap.u8.set(enc(service),num(servPtr));heap.write(num(servPtr)+enc(service).length,'u8',0);}
    return 0;
  },
  gethostbyname:namePtr=>{
    const name=cstr(namePtr),address=ipv4(name??'')??(name?.toLowerCase()==='localhost'?Uint8Array.of(127,0,0,1):null);
    if(!address)return 0;
    // glibc hostent {char *name,*aliases;int addrtype,length;char **addr_list}
    while(hostObjects.length)heap.free(hostObjects.pop());
    const n=heap.writeCString(name),aliases=heap.calloc(1,8),data=heap.malloc(4),list=heap.calloc(2,8),host=heap.calloc(1,32);
    hostObjects.push(n,aliases,data,list,host);heap.u8.set(address,data);
    heap.write(list,'u64',BigInt(data));heap.write(host,'u64',BigInt(n));heap.write(host+8,'u64',BigInt(aliases));
    heap.write(host+16,'i32',2);heap.write(host+20,'i32',4);heap.write(host+24,'u64',BigInt(list));return host;
  },
 };
 return Object.freeze(symbols);
}
function enc(s){return new TextEncoder().encode(s);}
