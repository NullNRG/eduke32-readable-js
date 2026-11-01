import { sourceByteView } from './source_bytes.mjs';
/** Real browser replacements for original Build platform *directory* services.
 *  Bgethomedir/Bgetappdir in compat.cpp return owned char* strings. The
 *  browser analogue is a user-specific area in the mounted virtual FS, never
 *  a host OS directory. Caller must Xfree/free the returned C allocation.
 *  No gameplay or engine symbol is provided by this module.
 */
export function createBuildBrowserPlatform({ heap, symbols, fs, homeDirectory = '/home/browser', applicationDirectory = '/' }) {
  if (!heap || !fs?.addSearchPath || !symbols?.malloc || !symbols?.mkdir || !symbols?.stat)
    throw new TypeError('Build browser directories need a working C heap and POSIX VFS');
  const validate = path => {
    if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') ||
        path.includes('\\') || path.split('/').some(x => x === '.' || x === '..') ||
        !/^\/[a-zA-Z0-9_./-]*$/.test(path))
      throw new TypeError('Browser directory must be an absolute canonical VFS path');
    return path.replace(/\/+$/, '') || '/';
  };
  const home=validate(homeDirectory), appdir=validate(applicationDirectory);
  const pathPointer = value => heap.writeCString(value);
  const withPath = (name,fn) => {
    const ptr=pathPointer(name);
    try { return fn(ptr); } finally { heap.free(ptr); }
  };
  const prepareDirectory = path => {
    let prefix='';
    for(const part of path.split('/').filter(Boolean)) {
      prefix+='/'+part;
      withPath(prefix, ptr => {
        const info=heap.malloc(144);
        try {
          if(symbols.stat(ptr,info)===0){
            const mode=heap.read(info+24,'u32');
            if((mode&0o170000)!==0o040000)throw new Error('VFS home path is not a directory: '+prefix);
          } else if(symbols.mkdir(ptr,0o700)!==0) {
            throw new Error('Cannot create browser virtual directory: '+prefix);
          }
        } finally { heap.free(info); }
      });
    }
  };
  // Make the home and its *parent* config directory valid for the original
  // G_ExtPreInit() logic (which only mkdirs the final app-specific directory).
  prepareDirectory(home);
  prepareDirectory(home==='/'?'/':home+'/.config');
  prepareDirectory(appdir);
  // These are C++ header inlines in Build, but their implementation is
  // strictly filesystem/OS work. Translate to the same virtual POSIX backend.
  const withBorrowedCPath = (path, callback) => {
    path=sourceByteView(path)??path;
    if (Number.isSafeInteger(path) && path > 0) return callback(path);
    if (!(path instanceof Uint8Array)) throw new TypeError('Expected C pointer or NUL-terminated original char array');
    const zero=path.indexOf(0);
    if (zero<0) throw new TypeError('Build path is not NUL-terminated');
    const ptr=heap.malloc(zero+1);
    try{heap.u8.set(path.subarray(0,zero+1),ptr);return callback(ptr)}
    finally{heap.free(ptr)}
  };
  const statMode = path => withBorrowedCPath(path,ptr=>{
    const info=heap.malloc(144);
    try {return symbols.stat(ptr,info)===0 ? heap.read(info+24,'u32') : null;}
    finally {heap.free(info);}
  });
  // Original Build search-path ABI: newest entries first; user bitmask removes
  // only selected entries, and listsearchpath(1) resets the iteration cursor.
  // The same entries drive VirtualFS fallback reads of mounted GRP/files.
  const paths=[];
  let iterator=-1;
  const addsearchpath_user=(path,user) => withBorrowedCPath(path,ptr=>{
    const info=heap.malloc(144);
    try {
      if(symbols.stat(ptr,info)!==0) return -2; // Build: missing path
      if((heap.read(info+24,'u32')&0o170000)!==0o040000)return -1;
      let str=heap.readCString(ptr).replace(/\\/g,'/').replace(/\/+$/,'');
      if (!str)str='/';
      // Canonicalization errors are explicit; do not smuggle paths outside VFS.
      str=validate(str);
      const owned=heap.writeCString(str+(str==='/'?'':'/'));
      paths.unshift({ptr:owned,path:str,user:user|0});
      fs.addSearchPath(str,user);
      iterator=-1;
      return 0;
    } finally {heap.free(info);}
  });
  const removesearchpaths_withuser=mask => {
    for(let i=paths.length-1;i>=0;i--) if(paths[i].user&(mask|0)) {
      heap.free(paths[i].ptr);paths.splice(i,1);
    }
    fs.removeSearchPathsWithUser(mask);
    iterator=-1;
  };
  const listsearchpath=initp=> {
    iterator=initp?0:iterator+1;
    return paths[iterator]?.ptr??0;
  };
  // Browser POSIX implementation of original Build's path-only
  // `Bcorrectfilename` (source/build/src/compat.cpp). Operating-system drive
  // conventions are absent in the browser target; byte tokenization and the
  // original dot/dotdot/trailing-slash behavior are preserved. This routine
  // edits the ORIGINAL caller's buffer; it is not a no-op linker symbol.
  const Bcorrectfilename=(filename,removefn) => {
    filename=sourceByteView(filename)??filename;
    let original, commit;
    if(filename instanceof Uint8Array){
      const n=filename.indexOf(0);
      if(n<0)throw new TypeError('Build filename lacks a NUL byte');
      original=filename.subarray(0,n);
      commit=bytes=>{if(bytes.length>=filename.length)throw new RangeError('filename overflow');
        filename.fill(0,0,bytes.length+1);filename.set(bytes,0);};
    } else if(Number.isSafeInteger(filename)&&filename>0){
      if(filename>=heap.u8.length)throw new RangeError('filename pointer outside heap');
      const end=heap.u8.indexOf(0,filename);
      if(end<0)throw new TypeError('Build filename pointer lacks NUL');
      original=heap.u8.subarray(filename,end);
      commit=bytes=>{if(bytes.length>original.length)throw new RangeError('filename overflow');
        heap.u8.set(bytes,filename);heap.u8[filename+bytes.length]=0;};
    } else throw new TypeError('Build filename needs writable C bytes');
    if(original.length>65535)throw new RangeError('Build filename exceeds bounded conversion');
    const lead=original[0]===47,trail=original.length>0&&original.at(-1)===47;
    const components=[];let pos=0;
    // Split on '/' bytes, keeping arbitrary non-ASCII file name bytes as-is.
    while(pos<original.length){
      while(pos<original.length&&original[pos]===47)pos++;
      const start=pos;while(pos<original.length&&original[pos]!==47)pos++;
      const part=original.subarray(start,pos);
      if(!part.length||(part.length===1&&part[0]===46))continue;
      if(part.length===2&&part[0]===46&&part[1]===46){
        if(components.length)components.pop();continue;
      }
      if(components.length>=64)throw new RangeError('Build filename exceeds 64 tokens');
      components.push(part);
    }
    let trailing=trail;
    if(!trailing&&removefn){if(components.length)components.pop();trailing=true;}
    if(components.length===0&&trailing&&lead)trailing=false;
    const chunks=[];let count=0;
    if(lead){chunks.push(Uint8Array.of(47));count++;}
    for(let i=0;i<components.length;i++){
      if(i){chunks.push(Uint8Array.of(47));count++;}
      chunks.push(components[i]);count+=components[i].length;
    }
    if(trailing){chunks.push(Uint8Array.of(47));count++;}
    const bytes=new Uint8Array(count);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    commit(bytes);return 0;
  };
  // Source/build/include/compat.h::Bstrncpyz. Exactly mirrors the source
  // contract: copy min(strlen(src)+1,n-1) bytes and set dst[n-1] to NUL.
  // Both original JS byte buffers and explicitly heap-owned C pointers work.
  const Bstrncpyz=(dst,src,n)=>{
    const length=typeof n==='bigint'?Number(n):n;
    if(!Number.isSafeInteger(length)||length<0||length>65536)
      throw new RangeError('Invalid original Bstrncpyz length');
    if(!length)return dst;
    const view=(value,need,writable)=>{
      value=sourceByteView(value)??value;
      if(value instanceof Uint8Array){
        if(need>value.length)throw new RangeError('Bstrncpyz buffer extent is too short');
        return value;
      }
      if(Number.isSafeInteger(value)&&value>0&&value+need<=heap.u8.length)
        return heap.u8.subarray(value);
      throw new TypeError('Bstrncpyz requires C byte storage');
    };
    const target=view(dst,length,true),input=view(src,1,false);
    const end=input.indexOf(0);
    if(end<0)throw new TypeError('Unterminated Bstrncpyz source');
    const copied=Math.min(end+1,length-1);
    target.set(input.slice(0,copied),0);
    target[length-1]=0;
    return dst;
  };
  return Object.freeze({
    Bstrncpyz,
    Bcorrectfilename,
    // Original Build common.cpp::testkopen returns 1 iff kopen4load can
    // open the resource. All supported browser resources (including GRP
    // entries and search paths) are mounted in this same VirtualFS.
    // It must inspect actual bytes rather than reporting unconditional success.
    testkopen: (filename, searchfirst) => {
      filename=sourceByteView(filename)??filename;
      if (!Number.isInteger(Number(searchfirst)))
        throw new TypeError('Build search precedence flag must be integral');
      let path;
      if (filename instanceof Uint8Array) {
        const terminator=filename.indexOf(0);
        if (terminator<0) throw new TypeError('Unterminated original Build filename');
        path=new TextDecoder().decode(filename.slice(0,terminator));
      } else if (Number.isSafeInteger(filename) && filename>0) {
        path=heap.readCString(filename);
      } else throw new TypeError('Build testkopen requires an original C path');
      if (!path) return 0;
      // searchfirst only changes which file takes precedence when both
      // copies exist; it does not change existence, the only output here.
      return fs.exists(path) ? 1 : 0;
    },
    addsearchpath_user, removesearchpaths_withuser, listsearchpath,
    buildvfs_exists: path => statMode(path)!==null?1:0,
    buildvfs_isdir: path => {
      const mode=statMode(path);
      return mode!==null && (mode&0o170000)===0o040000 ? 1:0;
    },
    Bgethomedir: () => pathPointer(home),
    Bgetappdir: () => pathPointer(appdir),
  });
}

/** Bind a generated source-first sm_allocator global *only* to the original
 * xfree/_sm_free Free method currently exercised by startup. Unsupported
 * allocator methods remain absent, so unverified code throws instead of
 * pretending that a full C++ allocator was translated.
 */
export function bindSourceFreeAllocator(getCell, free) {
  const cell=getCell?.();
  if (cell?.__cReference!==true || typeof free!=='function')
    throw new TypeError('Need source-verified allocator lvalue and real C free');
  if (cell.value!==null)throw new Error('Original allocator already initialized');
  // Older source modules access pointer.value directly; current modules use
  // the shared C reference marker to dereference object pointers. Preserve
  // the same object and callable for both generated ABIs.
  cell.value=Object.freeze({__cReference:true,value:Object.freeze({Free:free})});
  let released=false;
  return ()=>{if(!released){released=true;cell.value=null;}};
}
