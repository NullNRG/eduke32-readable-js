// Diagnostic execution of original console startup. No engine state is seeded.
import {NativeRuntime} from '../runtime/index.mjs';
import {bindBrowserC} from '../factory-output/source-first/browser-classic/browser-modules/browser-abi/libc_provider.mjs';
import {bindBrowserSDL} from '../factory-output/source-first/browser-classic/browser-modules/browser-abi/sdl_provider.mjs';
import {writeFile} from 'node:fs/promises';
const runtime=new NativeRuntime({memoryBytes:16<<20});runtime.bindSourceMemory();
const releaseC=bindBrowserC(runtime),releaseSDL=bindBrowserSDL(runtime),trace=[];
const text=value=>globalThis[Symbol.for('source-lp64-addresses/2')].decode(runtime.heap.writeCString(value));
const enter=(name,fn)=>{trace.push({name,transition:'enter'});const value=fn();trace.push({name,transition:'return',value:value??null});return value;};
let report;
try{
 const base=await import('../factory-output/source-first/browser-classic/browser-modules/source/build/src/baselayer.cpp.mjs');
 enter('engineSetupAllocator',()=>base.engineSetupAllocator());
 const osd=await import('../factory-output/source-first/browser-classic/browser-modules/source/build/src/osd.cpp.mjs');
 enter('OSD_Init',()=>osd.OSD_Init());
 enter('OSD_Puts',()=>osd.OSD_Puts(text('Original console log-node execution\n')));
 enter('OSD_WritePendingLines',()=>osd.OSD_WritePendingLines());
 enter('OSD_Dispatch echo',()=>osd.OSD_Dispatch(text('echo original-command-dispatch')));
 enter('OSD_WritePendingLines after echo',()=>osd.OSD_WritePendingLines());
 report={passed:true,original_console_initialization_executed:true,trace};
}catch(error){report={passed:false,original_console_initialization_executed:trace.some(row=>row.name==='OSD_Init'&&row.transition==='return'),trace,error:String(error),stack:error.stack};}
finally{releaseSDL();releaseC();runtime.close();}
report.original_engine_startup_verified=false;report.gameplay_verified=false;
await writeFile(new URL('../reports/nov02-original-console-node.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
