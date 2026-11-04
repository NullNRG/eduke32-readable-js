// Real original archive discovery. The host mounts only the raw archive.
export async function probeOriginalGroupScan({base,bytes}) {
  const {NativeRuntime}=await import(new URL('runtime/index.mjs',base));
  const {sourceCString}=await import(new URL('runtime/source_bytes.mjs',base));
  const {cPointer}=await import(new URL('tools/source_pointer_runtime.mjs',base));
  const root=new URL('factory-output/source-first/browser-classic/browser-modules/',base);
  const runtime=new NativeRuntime({memoryBytes:128<<20});runtime.bindSourceMemory();
  let reads=0;
  const diagnostic=globalThis.process?.env.EDUKE_SCAN_DIAGNOSTIC;
  const symbols={...runtime.library.symbols};
  if(diagnostic)symbols.read=(...args)=>{const result=runtime.library.symbols.read(...args);if(++reads%100===0)console.error('archive reads',reads,String(result));return result;};
  const release=(await import(new URL('browser-abi/libc_provider.mjs',root))).bindBrowserC(diagnostic?{heap:runtime.heap,library:{symbols}}:runtime);
  const releaseSDL=(await import(new URL('browser-abi/sdl_provider.mjs',root))).bindBrowserSDL(runtime);
  const trace=[];
  const enter=(name,fn)=>{trace.push(name);return fn();};
  try {
    runtime.fs.mountBytes('DUKE3D.GRP',bytes);
    const layer=await import(new URL('source/build/src/baselayer.cpp.mjs',root));
    enter('engineSetupAllocator',()=>layer.engineSetupAllocator());
    const engine=await import(new URL('source/build/src/engine.cpp.mjs',root));
    if(enter('enginePreInit',()=>engine.enginePreInit())!==0)throw Error('Original enginePreInit failed');
    const scan=await import(new URL('source/duke3d/src/grpscan.cpp.mjs',root));
    const common=await import(new URL('source/duke3d/src/common.cpp.mjs',root));
    // Observation uses the exact Clang schema emitted with the original body.
    // It never initializes or modifies game state or guesses native offsets.
    const match=scan.FindGrpInfo.toString().match(/cRecordPointer\(grpinfo, (\{[^\n]+?\}), \{\}\)/);
    if(!match)throw Error('Original grpinfo Clang schema unavailable');
    const schema=JSON.parse(match[1]);
    const view=(value,schema)=>{
      if(value?.__cReference)return value.value;
      if(value?.__cRecordPointer)return globalThis[Symbol.for('source-first.record-pointer-views/1')].deref(value);
      if(!schema)throw Error('Original record pointer lost its Clang schema');
      return globalThis[Symbol.for('source-first.record-pointer-views/1')].deref({...cPointer(value),__cRecordPointer:true,recordSchema:schema,recordPrototypes:{}});
    };
    const started=performance.now();
    enter('G_ScanGroups',()=>common.G_ScanGroups());
    const scanMilliseconds=performance.now()-started;
    const groups=[];
    for(let pointer=scan.foundgrps;pointer;){
      const group=view(pointer),type=view(group.type,schema);
      groups.push({filename:sourceCString(group.filename,runtime.heap),name:sourceCString(type.name,runtime.heap),
        size:type.size,crc:type.crcval,game:type.game,dependency:type.dependency});
      pointer=group.next;
    }
    if(groups.length!==1||!common.g_selectedGrp)throw Error('Original game did not select its data: '+JSON.stringify({groups,trace}));
    enter('FreeGroups',()=>scan.FreeGroups());
    if(scan.foundgrps!==null||scan.listgrps!==null)throw Error('Original group cleanup did not complete');
    return {groups,trace,scan_milliseconds:scanMilliseconds,original_game_data_selected:true,gameplay_verified:false};
  }catch(error){error.message+='; original trace='+JSON.stringify(trace);throw error;}
  finally{releaseSDL();release();runtime.close();}
}
