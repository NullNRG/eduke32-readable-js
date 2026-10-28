/** Machine-generated linker contract from actual runtime exports.
 * Invoked by the LLVM whole-program linker; no handwritten symbol count.
 */
import {LLVMContext} from '../runtime/llvm_context.mjs';
const ctx=new LLVMContext();
const exports=Object.keys(ctx.libraries);
console.log(JSON.stringify({format:'eduke-runtime-symbols/1',symbols:exports,globals:[...ctx.globalPointers.keys()]}));
