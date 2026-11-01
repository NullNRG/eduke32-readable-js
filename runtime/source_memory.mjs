import { ABIHeap } from './abi.mjs';
// Initialize the authoritative ABI before legacy and incremental source
// modules load their embedded compatibility copies. Every module shares the
// same real address regions and allocation bounds in this browser isolate.
import { sourceAddressSpace } from '../tools/source_address_runtime.mjs';

/** Bind browser services and compiled C allocation to the same byte heap.
 * Call before importing compiled modules with dynamic/global initialization.
 * Replacing a live address space is rejected; existing source views stay valid.
 */
export function bindSourceCHeap(heap) {
  if (!(heap instanceof ABIHeap)) throw new TypeError('Source C allocation requires the canonical ABIHeap');
  const key=Symbol.for('source-first.native-C-heap/2');
  if(globalThis[key]&&globalThis[key]!==heap)throw new TypeError('Cannot replace the original source C heap');
  const addresses=globalThis[Symbol.for('source-lp64-addresses/2')];
  if(addresses)addresses.registerHeap(heap);
  else globalThis[key]=heap;
  return heap;
}
