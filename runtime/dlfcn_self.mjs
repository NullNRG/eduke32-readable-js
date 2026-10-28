/** POSIX dlfcn ABI for the statically linked original-JS process image.
 * dlopen(NULL) and dlsym() resolve genuine registered compiled C symbols.
 * Opening external shared objects is unsupported and fails like dlopen would;
 * there are no synthetic function pointers, plugins, or dynamic ELF loaders.
 */
export function createDlfcnSelf({ctx,heap}={}) {
  if(!ctx||!heap)throw TypeError('dlfcn needs compiled context and heap');
  const self=heap.malloc(8);let lastError=null;
  const failure=message=>{lastError=String(message);return 0;};
  const ptr=name=>{
    if(ctx.functions.has(name)||ctx.globalPointers.has(name)||
       (Object.prototype.hasOwnProperty.call(ctx.libraries,name)&&typeof ctx.libraries[name]==='function'))
      return ctx.ptr(name);
    return 0;
  };
  const symNames=new Map();
  const getName=(symbol)=>{if(!symNames.has(symbol))symNames.set(symbol,heap.writeCString(symbol));return symNames.get(symbol);};
  let imageName=0;
  return Object.freeze({
    dlopen:(name,flags)=>{
      if(!name)return self;
      return failure('dlopen: external ELF shared libraries unavailable in self-contained JavaScript: '+heap.readCString(Number(name)));
    },
    dlsym:(handle,name)=>{
      if(Number(handle)!==self&&Number(handle)!==0) return failure('dlsym: invalid module handle');
      const key=heap.readCString(Number(name));
      // File-local symbols are not part of the dynamic symbol table.
      if(key.startsWith('__tu'))return failure('dlsym: symbol not exported: '+key);
      const value=ptr(key);if(!value)return failure('dlsym: symbol not found: '+key);
      lastError=null;return value;
    },
    dlclose:handle=>Number(handle)===self?0:-1,
    dlerror:()=>{
      const error=lastError;lastError=null;return error?heap.writeCString(error):0;
    },
    dladdr:(address,info)=>{
      const p=Number(address);const symbol=ctx.functionsByAddress.get(p) ?? [...ctx.globalPointers.entries()].find(([name,ptr])=>ptr===p)?.[0];
      if(!symbol)return 0;
      if(!imageName)imageName=heap.writeCString('<embedded original-source program>');
      heap.check(Number(info),32);heap.memset(Number(info),0,32);
      heap.write(Number(info),'u64',BigInt(imageName));
      heap.write(Number(info)+8,'u64',0n); // A JS-only executable has no ELF image base.
      heap.write(Number(info)+16,'u64',BigInt(getName(symbol)));
      heap.write(Number(info)+24,'u64',BigInt(p));
      return 1;
    },
  });
}
