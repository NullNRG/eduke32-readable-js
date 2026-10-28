import { sourceByteView } from './source_bytes.mjs';
/** Browser console backend for the exact Loguru C++ printf-style log ABI.
 * Original LOG_F call sites retain their verbosity, source location, arguments
 * and format string. Unknown conversion directives fail, never silently drop
 * game messages or route logging calls to libc's floating-point log().
 */
const decodeCString = value => {
  if (typeof value === 'string') return value;
  value=sourceByteView(value)??value;
  if (!(value instanceof Uint8Array)) throw new TypeError('Loguru needs a C string');
  const end=value.indexOf(0);
  if(end<0) throw new TypeError('Unterminated Loguru C string');
  return new TextDecoder('utf-8',{fatal:true}).decode(value.slice(0,end));
};
export function loguru_log(verbosity,file,line,format,...arguments_) {
  if (!Number.isInteger(verbosity) || !Number.isInteger(line) || line<0)
    throw new TypeError('Invalid original Loguru message metadata');
  const location=decodeCString(file), template=decodeCString(format);
  let index=0;
  const message=template.replace(/%(?:([+\-0 #]*)(\d*)(?:\.(\d+))?(?:hh|ll|h|l|z|t|j)?([%sdicuxXfFgGeE]))/g,
    (full, flags, width,precision,conversion) => {
      if(conversion==='%') return '%';
      if(index>=arguments_.length)throw new RangeError('Missing Loguru format argument');
      let value=arguments_[index++],output;
      if(conversion==='s') output=decodeCString(value);
      else if(conversion==='c') output=String.fromCharCode(Number(value)&255);
      else if('diuxX'.includes(conversion)) {
        if(typeof value!=='bigint' && !Number.isSafeInteger(Number(value)))
          throw new TypeError('Loguru integer argument outside exact precision');
        const signed=conversion==='d'||conversion==='i';
        let n=BigInt(value);
        if(!signed)n=BigInt.asUintN(32,n);
        output=n.toString('xX'.includes(conversion)?16:10);
        if(conversion==='X')output=output.toUpperCase();
      } else {
        if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError('Invalid Loguru float argument');
        output=precision!==undefined ? value.toFixed(Number(precision)) : String(value);
      }
      if(precision!==undefined&&conversion==='s')output=output.slice(0,Number(precision));
      if(width&&Number(width)>output.length) {
        const pad=(flags.includes('0')?'0':' ').repeat(Math.min(1024,Number(width)-output.length));
        output=flags.includes('-')?output+pad:pad+output;
      }
      return output;
    });
  // Reject an unsupported directive rather than printing a broken log line.
  if(/%(?!%)(?:[+\-0 #]*\d*(?:\.\d+)?(?:hh|ll|h|l|z|t|j)?)?[a-zA-Z]/.test(message))
    throw new TypeError('Unsupported Loguru C format conversion');
  if(index!==arguments_.length)throw new RangeError('Extra Loguru format arguments');
  const output=`${location}:${line} ${message}`;
  if(verbosity<0)console.error(output);
  else console.info(output);
}
