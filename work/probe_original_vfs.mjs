// Diagnostic over the actual compiled original file APIs. No engine state is
// seeded. Mounting the raw archive is the browser platform's ordinary file I/O.
export async function probeOriginalVFS({base,bytes=null,traceHost=false}) {
  const trace=[];
  const {NativeRuntime}=await import(new URL('runtime/index.mjs',base));
  const {sourceByteView}=await import(new URL('runtime/source_bytes.mjs',base));
  const runtime=new NativeRuntime({memoryBytes:16<<20});runtime.bindSourceMemory();
  const root='factory-output/source-first/browser-classic/browser-modules/';
  const hostTrace=[],symbols={...runtime.library.symbols};
  if(traceHost){
    const {sourceCString}=await import(new URL('runtime/source_bytes.mjs',base));
    for(const name of ['buildvfs_exists','open','stat']){
      const original=symbols[name];symbols[name]=(...args)=>{
        const path=sourceCString(args[0],runtime.heap),result=original(...args);
        hostTrace.push({name,path,result,errno:runtime.heap.read(symbols.__errno_location(),'i32')});return result;
      };
    }
  }
  const release=(await import(new URL(root+'browser-abi/libc_provider.mjs',base))).bindBrowserC(
    traceHost?{heap:runtime.heap,library:{symbols}}:runtime);
  const invoke=(name,fn)=>{const value=fn();trace.push({name,value:typeof value==='bigint'?String(value):value??null});return value;};
  try{
    if(!bytes){const response=await fetch(new URL('input-data/DUKE3D.GRP',base));if(!response.ok)throw Error('Archive fetch '+response.status);bytes=new Uint8Array(await response.arrayBuffer());}
    runtime.fs.mountBytes('DUKE3D.GRP',bytes);
    const {engineSetupAllocator}=await import(new URL(root+'source/build/src/baselayer.cpp.mjs',base));
    invoke('engineSetupAllocator',()=>engineSetupAllocator());
    const vfs=await import(new URL(root+'source/build/src/vfs.cpp.mjs',base));
    const filename=runtime.heap.writeCString('DUKE3D.GRP');
    const fd=invoke('kopen4load(raw GRP)',()=>vfs.kopen4load(filename,0));
    if(fd<0)throw Error('Original archive open failed: '+JSON.stringify({fd,hostTrace,files:runtime.fs.list('')}));
    const length=invoke('kfilelength(raw GRP)',()=>vfs.kfilelength(fd));
    if(length!==bytes.length)throw Error('Original archive length differs: '+length);
    const output=runtime.heap.malloc(128);let comparisons=0,directoryBytes=0;const oracleLines=[String(length)];
    const sample=(handle,offset,expected)=>{
      const position=invoke('klseek',()=>vfs.klseek(handle,offset,0));
      if(position!==offset)throw Error('Original seek differs: '+position);
      const count=invoke('kread',()=>vfs.kread(handle,output,expected.length));
      const actual=runtime.heap.bytes(output,expected.length);
      if(count!==expected.length||actual.some((byte,i)=>byte!==expected[i]))throw Error('Original read differs at '+offset);
      if(vfs.ktell(handle)!==offset+expected.length)throw Error('Original file position differs');
      comparisons+=expected.length;
      oracleLines.push(Array.from(actual,byte=>byte.toString(16).padStart(2,'0')).join(''));
    };
    for(const offset of [0,12,16,4096,bytes.length-128])sample(fd,offset,bytes.subarray(offset,offset+128));
    invoke('kclose(raw GRP)',()=>vfs.kclose(fd));
    if(vfs.filehan[fd]!==-1n)throw Error('Original handle was not closed');
    let directory=null;
    if(typeof vfs.initgroupfile==='function'){
      const group=invoke('initgroupfile',()=>vfs.initgroupfile(filename));
      oracleLines.push(String(group));
      if(group!==0)throw Error('Original GRP indexing failed: '+group);
      const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.length),count=view.getUint32(12,true);
      if(vfs.numgroupfiles!==1||vfs.gnumfiles[0]!==count)throw Error('Original GRP directory count differs');
      let offset=16+count*16;directory=[];
      for(let i=0;i<count;i++){
        const at=16+i*16,name=String.fromCharCode(...bytes.subarray(at,at+12)).replace(/\0.*$/,'');
        const length=view.getUint32(at+12,true);directory.push({name,length,offset});offset+=length;
      }
      const names=sourceByteView(vfs.gfilelist[0]),offsetBytes=sourceByteView(vfs.gfileoffs[0]);
      const offsets=new DataView(offsetBytes.buffer,offsetBytes.byteOffset,offsetBytes.length);
      for(let i=0;i<count;i++){
        for(let j=0;j<12;j++)if(names[i*16+j]!==bytes[16+i*16+j])throw Error('Original directory name differs: '+i);
        if(names[i*16+12]!==0||offsets.getInt32(i*4,true)!==directory[i].offset)throw Error('Original directory offset/terminator differs: '+i);
        comparisons+=17;directoryBytes+=17;
      }
      if(offsets.getInt32(count*4,true)!==bytes.length)throw Error('Original directory end offset differs');
      comparisons+=4;directoryBytes+=4;
      for(const name of ['E1L1.MAP','PALETTE.DAT','GAME.CON','TILES000.ART']){
        const entry=directory.find(row=>row.name.toUpperCase()===name);if(!entry)throw Error('Supplied archive lacks '+name);
        for(const search of [0,1]){
        const handle=invoke('kopen4load('+name+', '+search+')',()=>vfs.kopen4load(runtime.heap.writeCString(name),search));
        const actualLength=handle<0?null:vfs.kfilelength(handle);
        if(handle<0||actualLength!==entry.length)throw Error('Original resource open/length differs: '+JSON.stringify({name,handle,actualLength,expectedLength:entry.length}));
        oracleLines.push(name+':'+entry.length+':'+search);
        for(const offset of [0,4096,entry.length-128])
          sample(handle,offset,bytes.subarray(entry.offset+offset,entry.offset+offset+128));
        invoke('kclose('+name+')',()=>vfs.kclose(handle));
        }
      }
    }
    return {passed:true,archive_length:length,byte_comparisons:comparisons,
      original_directory_bytes_verified:directoryBytes,native_parity_sample_bytes:comparisons-directoryBytes,
      original_grp_index_executed:directory!==null,directory_entries:directory?.length??null,
      oracle_lines:oracleLines,trace,engine_booted:false,gameplay_verified:false};
  }finally{release();runtime.close();}
}
