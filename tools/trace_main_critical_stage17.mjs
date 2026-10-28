// Developer-only original-source execution trace. Missing externs throw on use.
// NEVER included in playable builds or the standard runtime manifest.
import {readFileSync} from 'node:fs';
import {boot} from '../factory-output/whole-program/linked.mjs';
import {ABIHeap} from '../runtime/abi.mjs';
import {VirtualFS} from '../runtime/filesystem.mjs';
const report=JSON.parse(readFileSync(new URL('../factory-output/whole-program/symbol-link-report.json',import.meta.url),'utf8'));
const library=Object.fromEntries(report.unresolved_symbols.map(s=>[s,()=>{throw Error('MISSING_EXTERNAL_CALLED: '+s)}]));
if(!process.env.EDUKE_NATIVE_CPUID_JSON)throw Error('Set EDUKE_NATIVE_CPUID_JSON to a JSON file of REAL host CPUID registers from tools/cpuid_probe_stage10.c; this is a developer-only diagnostic');
const hostCPUID=JSON.parse(readFileSync(process.env.EDUKE_NATIVE_CPUID_JSON,'utf8'));
const cpuidProvider=(leaf,subleaf)=>{if(subleaf!==0)throw Error('Host CPUID subleaf unavailable');const regs=hostCPUID[String(leaf>>>0)];if(!regs)throw Error('Host CPUID leaf unavailable '+leaf);return regs;};
const now=Date.now();
try{
 const heap=new ABIHeap(1<<20,Number(process.env.EDUKE_MAX_HEAP_MB||256)<<20);
 const fs=new VirtualFS();
 if(process.env.EDUKE_GRP_FILE){
   const bytes=new Uint8Array(readFileSync(process.env.EDUKE_GRP_FILE));
   fs.mountBytes('DUKE3D.GRP',bytes);
   fs.mountGRP(bytes);
 }
 const ctx=boot({heap,fs,libraries:library,cpuidProvider,
  instructionBudget:Number(process.env.EDUKE_BLOCK_BUDGET||50000000),
  blockProgress:(name,block,fuel)=>process.stderr.write(`[LLVM progress] ${name} block=${block} visits=${fuel}\n`),
  stdio:{stdout:bytes=>process.stdout.write(Buffer.from(bytes)),stderr:bytes=>process.stderr.write(Buffer.from(bytes))}});
 const argv=heap.calloc(2,8);const prog=heap.writeCString('eduke32');heap.write(argv,'u64',BigInt(prog));
 const focus=new Map();const delegate=ctx.call.bind(ctx);
 ctx.call=(name,args,types=null)=>{
   if(/palette|art|engine|tile|color|blend/i.test(name)){
      const n=(focus.get(name)||0)+1;focus.set(name,n);
      if(n===1 || n===10 || n===100 || n===1000 || n===10000)
         process.stderr.write(`[STARTUP_FUNC] ${Math.round((Date.now()-now)/1000)}s ${name} calls=${n}\n`);
   }
   return delegate(name,args,types);
 };
 console.log('original_functions_registered',ctx.functions.size,'boot_ms',Date.now()-now);
 const retval=ctx.call('main',[1,argv]);console.log('original_main_return',retval);
}catch(e){console.log('original_main_diagnostic_failure',e?.stack?.slice(0,1800)??String(e));process.exitCode=3;}
