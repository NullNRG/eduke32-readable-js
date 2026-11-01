import { sourceByteView } from './source_bytes.mjs';
import { createCPrintf } from './c_printf.mjs';
/** Browser console backend for the exact Loguru C++ printf-style log ABI.
 * Original LOG_F call sites retain their verbosity, source location, arguments
 * and format string. Unknown conversion directives fail, never silently drop
 * game messages or route logging calls to libc's floating-point log().
 */
let activeHeap=null;
export function bindLoguruHeap(heap) {
  if(activeHeap)throw Error('Loguru heap already bound');
  if(typeof heap?.readCString!=='function')throw TypeError('Loguru requires the engine ABI heap');
  activeHeap=heap;
  return ()=>{if(activeHeap===heap)activeHeap=null;};
}
const heap=new Proxy({}, {get(_target,key){
  if(!activeHeap)throw Error('Numeric Loguru pointer requires the engine ABI heap');
  const value=activeHeap[key];return typeof value==='function'?value.bind(activeHeap):value;
}});
const decodeCString = value => {
  if (typeof value === 'string') return value;
  value=sourceByteView(value)??value;
  if (!(value instanceof Uint8Array)) return heap.readCString(value);
  const end=value.indexOf(0);
  if(end<0) throw new TypeError('Unterminated Loguru C string');
  return new TextDecoder().decode(value.slice(0,end));
};
export function loguru_log(verbosity,file,line,format,...arguments_) {
  if (!Number.isInteger(verbosity) || !Number.isInteger(line) || line<0)
    throw new TypeError('Invalid original Loguru message metadata');
  const chunks=[];
  const cString=value=>typeof value==='string'?new TextEncoder().encode(value+'\0'):value;
  const formatter=createCPrintf(heap,{streams:new Map([['stdout',bytes=>chunks.push(bytes)]])});
  formatter.printf(cString(format),...arguments_.map(cString));
  const size=chunks.reduce((n,bytes)=>n+bytes.length,0),bytes=new Uint8Array(size);
  let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const output=`${decodeCString(file)}:${line} ${new TextDecoder().decode(bytes)}`;
  if(verbosity<0)console.error(output);
  else console.info(output);
}
