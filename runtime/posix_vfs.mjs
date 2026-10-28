/** POSIX file-descriptor ABI over the same mounted, mutable virtual filesystem
 * that contains game resources. No claim of host-disk, networking or process access.
 * Linux x86-64 struct stat/dirent64 byte layouts are explicit.
 */
export function createPosixVFS({heap,fs,errnoLocation,streams=new Map()}={}){
  if(!heap||!fs||typeof errnoLocation!=='function')throw TypeError('POSIX VFS needs heap/fs/errno');
  const E={EPERM:1,ENOENT:2,EBADF:9,EEXIST:17,ENOTDIR:20,EISDIR:21,EINVAL:22,ENOSPC:28,EROFS:30,ERANGE:34};
  const fail=(e)=>{heap.write(errnoLocation(),'i32',E[e]??E.EINVAL);return -1;};
  const dirs=new Set(['']);let cwd='';let nextFD=3;
  const fds=new Map(),directoryHandles=new Map(),closeOnExec=new Map();
  const bytesName=p=>{if(!p)return null;return heap.readCString(p);};
  const canonical=(p)=>{
    if(typeof p!=='string')throw TypeError('Invalid path');
    const base=p.startsWith('/')?'':cwd;
    const parts=(base?base+'/':'')+p;
    return fs.constructor.key(parts);
  };
  const allFiles=()=>fs.list('');
  const isDirectory=k=>dirs.has(k)||allFiles().some(x=>x.startsWith(k?k+'/':''));
  const dirContents=k=>{
    if(!isDirectory(k))return null;
    const prefix=k?k+'/':'';
    const sub=new Map([['.',4],['..',4]]);
    for(const p of [...allFiles(),...dirs]){
      if(!p.startsWith(prefix)||p===k)continue;
      const rest=p.slice(prefix.length),first=rest.split('/')[0];if(!first)continue;
      sub.set(first,rest.includes('/')||dirs.has(prefix+first)?4:8);
    }
    return [...sub].map(([name,type])=>({name,type}));
  };
  const fileStat=(ptr,{size=0,dir=false}={})=>{
    heap.check(ptr,144);heap.memset(ptr,0,144);
    heap.write(ptr,'u64',1n);heap.write(ptr+8,'u64',1n);heap.write(ptr+16,'u64',1n);
    heap.write(ptr+24,'u32',dir?0o040755:0o100644);
    heap.write(ptr+48,'i64',BigInt(size));heap.write(ptr+56,'i64',4096n);
    heap.write(ptr+64,'i64',BigInt(Math.ceil(size/512)));
  };
  const fileInfo=k=>fs.exists(k)?{size:fs.size(k)}:isDirectory(k)?{size:0,dir:true}:null;
  const symbols={
    open:(pathPtr,flags,mode=0o666)=>{
      if(!pathPtr)return fail('ENOENT');
      let k;try{k=canonical(bytesName(pathPtr));}catch{return fail('EINVAL');}
      flags=Number(flags)|0;const access=flags&3;
      if(access===3)return fail('EINVAL');
      if(isDirectory(k))return fail('EISDIR');
      const exists=fs.exists(k),create=!!(flags&64),exclusive=!!(flags&128),truncate=!!(flags&512),append=!!(flags&1024);
      if(!exists&&!create)return fail('ENOENT');
      const parent=k.includes('/')?k.slice(0,k.lastIndexOf('/')):'';
      if(!isDirectory(parent))return fail('ENOENT');
      if(exists&&create&&exclusive)return fail('EEXIST');
      if(truncate&&access===0)return fail('EINVAL');
      if(!exists||truncate)fs.writeFile(k,new Uint8Array());
      const fd=nextFD++;fds.set(fd,{path:k,read:access!==1,write:access!==0,pos:append?fs.size(k):0,append,flags});closeOnExec.set(fd,false);return fd;
    },
    close:fd=>{if(!fds.delete(Number(fd)))return fail('EBADF');closeOnExec.delete(Number(fd));return 0;},
    fcntl:(fd,command,arg=0)=>{
      const obj=fds.get(Number(fd));if(!obj)return fail('EBADF');
      switch(Number(command)){
        case 0:case 1030:{
          let slot=Math.max(3,Number(arg));if(!Number.isSafeInteger(slot)||slot<0)return fail('EINVAL');
          while(fds.has(slot))slot++;
          fds.set(slot,obj);closeOnExec.set(slot,command===1030);nextFD=Math.max(nextFD,slot+1);
          return slot;
        }
        case 1:return +(closeOnExec.get(Number(fd))??false);
        case 2:closeOnExec.set(Number(fd),!!(Number(arg)&1));return 0;
        case 3:return obj.flags;
        case 4:obj.flags=(obj.flags&3)|(Number(arg)&(1024|2048));obj.append=!!(obj.flags&1024);return 0;
        default:return fail('EINVAL');
      }
    },
    read:(fd,ptr,count)=>{
      const h=fds.get(Number(fd));if(!h||!h.read)return fail('EBADF');
      count=Number(count);if(!Number.isSafeInteger(count)||count<0)return fail('EINVAL');
      heap.check(ptr,count);
      const n=fs.readInto(h.path,h.pos,heap.u8,ptr,count);
      h.pos+=n;return BigInt(n);
    },
    write:(fd,ptr,count)=>{
      const h=fds.get(Number(fd)),sink=streams.get(Number(fd));
      if(!h&&!sink)return fail('EBADF');
      count=Number(count);if(!Number.isSafeInteger(count)||count<0)return fail('EINVAL');
      const bytes=heap.bytes(ptr,count);
      if(sink){sink(bytes);return BigInt(count);}
      if(!h.write)return fail('EBADF');
      const old=fs.readFile(h.path);if(h.append)h.pos=old.length;
      const data=new Uint8Array(Math.max(old.length,h.pos+count));data.set(old);data.set(bytes,h.pos);
      fs.writeFile(h.path,data);h.pos+=count;return BigInt(count);
    },
    lseek:(fd,offset,whence)=>{
      const h=fds.get(Number(fd));if(!h){fail('EBADF');return -1n;}
      const len=fs.size(h.path);const base=whence===0?0:whence===1?h.pos:whence===2?len:null;
      const to=base===null?NaN:Number(BigInt(base)+BigInt(offset));
      if(!Number.isSafeInteger(to)||to<0){fail('EINVAL');return -1n;}
      h.pos=to;return BigInt(to);
    },
    fstat:(fd,buf)=>{const h=fds.get(Number(fd));if(!h)return fail('EBADF');fileStat(buf,{size:fs.size(h.path)});return 0;},
    stat:(path,buf)=>{
      let info;try{info=fileInfo(canonical(bytesName(path)));}catch{return fail('EINVAL');}
      if(!info)return fail('ENOENT');fileStat(buf,info);return 0;
    },
    mkdir:(path,mode)=>{
      let k;try{k=canonical(bytesName(path));}catch{return fail('EINVAL');}
      if(!k||isDirectory(k)||fs.exists(k))return fail('EEXIST');
      const parent=k.includes('/')?k.slice(0,k.lastIndexOf('/')):'';
      if(!isDirectory(parent))return fail('ENOENT');dirs.add(k);return 0;
    },
    unlink:path=>{
      let k;try{k=canonical(bytesName(path));}catch{return fail('EINVAL');}
      if(isDirectory(k))return fail('EISDIR');
      if(!fs.exists(k))return fail('ENOENT');
      if(!fs.overlays.has(k))return fail('EROFS');
      fs.remove(k);return 0;
    },
    realpath:(path,out)=>{
      let k;try{k=canonical(bytesName(path));}catch{fail('EINVAL');return 0;}
      if(!fileInfo(k)){fail('ENOENT');return 0;}
      const encoded=new TextEncoder().encode('/'+k);
      // POSIX realpath caller must provide PATH_MAX bytes when out != NULL;
      // the C library's maximum depends on target ABI, here 4096 bytes.
      if(encoded.length>=4096){fail('EINVAL');return 0;}
      const ptr=out||heap.malloc(encoded.length+1);heap.check(ptr,encoded.length+1);
      heap.u8.set(encoded,ptr);heap.write(ptr+encoded.length,'u8',0);return ptr;
    },
    chdir:path=>{let k;try{k=canonical(bytesName(path));}catch{return fail('EINVAL');}
      if(!isDirectory(k))return fail(fs.exists(k)?'ENOTDIR':'ENOENT');cwd=k;return 0;},
    getcwd:(buffer,size)=>{
      const name='/'+cwd,encoded=new TextEncoder().encode(name);size=Number(size);
      if(!buffer||!Number.isSafeInteger(size)||size<=encoded.length){fail('ERANGE');return 0;}
      heap.check(buffer,size);heap.u8.set(encoded,buffer);heap.u8[buffer+encoded.length]=0;return buffer;
    },
    opendir:path=>{
      let names;try{names=dirContents(canonical(bytesName(path)));}catch{return 0;}
      if(!names){fail('ENOENT');return 0;}
      const ptr=heap.malloc(280);directoryHandles.set(ptr,{names,index:0});return ptr;
    },
    readdir:ptr=>{
      const d=directoryHandles.get(Number(ptr));if(!d){fail('EBADF');return 0;}
      if(d.index>=d.names.length)return 0;
      const item=d.names[d.index++],b=new TextEncoder().encode(item.name);
      if(b.length>255)throw Error('Directory entry exceeds Linux dirent64 name size');
      heap.memset(ptr,0,280);heap.write(ptr,'u64',BigInt(d.index));heap.write(ptr+8,'i64',BigInt(d.index));
      heap.write(ptr+16,'u16',19+b.length+1);heap.write(ptr+18,'u8',item.type);heap.u8.set(b,ptr+19);
      return ptr;
    },
    closedir:ptr=>{if(!directoryHandles.delete(Number(ptr)))return fail('EBADF');heap.free(ptr);return 0;},
    poll:(array,nfds,timeout)=>{
      // pollfd is exactly {int fd; short events; short revents} (8 bytes).
      // Regular VFS files are immediately selectable on their actual access
      // modes; native sockets and asynchronous host devices are NOT emulated.
      const n=Number(nfds),wait=Number(timeout);
      if(!Number.isSafeInteger(n)||n<0||n>65536||!Number.isInteger(wait)||wait<-1)return fail('EINVAL');
      if(n&&!array)return fail('EINVAL');
      if(n)heap.check(Number(array),n*8);
      let ready=0;
      for(let i=0;i<n;i++){
        const base=Number(array)+8*i,fd=heap.read(base,'i32'),events=heap.read(base+4,'u16');
        let revents=0;
        if(fd>=0){
          const h=fds.get(fd),stream=streams.get(fd);
          if(!h&&!stream)revents=0x20; // POLLNVAL
          else{
            if(h?.read&&(events&0x1))revents|=0x1; // POLLIN
            if((h?.write||stream)&&(events&0x4))revents|=0x4; // POLLOUT
          }
        }
        heap.write(base+6,'u16',revents);
        if(revents)ready++;
      }
      if(ready||wait===0)return ready;
      // No synchronous browser wait primitive can honor positive timeouts.
      // Fail explicitly rather than reporting a fabricated timeout.
      heap.write(errnoLocation(),'i32',38);return -1;
    },
    isatty:fd=>{if(fds.has(Number(fd))||streams.has(Number(fd))){heap.write(errnoLocation(),'i32',25);return 0;}return fail('EBADF');},
  };
  return Object.freeze(symbols);
}
