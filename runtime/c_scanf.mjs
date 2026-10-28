/** Legacy and C23 C-locale scanning over heap or original source storage.
 * Supports integer, decimal float, byte string/character conversions and
 * assignment suppression. Wide characters, long double, hexadecimal float,
 * locale-specific scans and allocating %m conversions are not implemented.
 */
import {sourceByteView} from './source_bytes.mjs';
export function createCScanf({heap}={}){
  if(!heap)throw TypeError('C scanner requires heap');
  const signed=(n,bits)=>BigInt.asIntN(bits,n),unsigned=(n,bits)=>BigInt.asUintN(bits,n);
  function string(value){
    const bytes=sourceByteView(value)??heap.bytes(Number(value),heap.strlen(Number(value))+1);
    const end=bytes.indexOf(0);
    if(end<0)throw RangeError('scanf string lacks a NUL inside original storage');
    let result='';for(let i=0;i<end;i++)result+=String.fromCharCode(bytes[i]);
    return result;
  }
  function write(ptr,kind,value){
    const bytes=sourceByteView(ptr);
    if(!bytes){
      if(typeof ptr!=='number'&&typeof ptr!=='bigint')throw TypeError('scanf output requires verified storage');
      heap.write(Number(ptr),kind,value);return;
    }
    const methods={u8:['setUint8',1],u16:['setUint16',2],u32:['setUint32',4],u64:['setBigUint64',8],f32:['setFloat32',4],f64:['setFloat64',8]};
    const [method,size]=methods[kind];
    if(bytes.byteLength<size)throw RangeError('scanf output exceeds original source bounds');
    new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength)[method](0,value,true);
  }
  function scan(allowBinaryPrefix,input,format,...args){
    const source=string(input),fmt=string(format);
    let f=0,pos=0,assigned=0,ai=0,consumedAny=false;
    const isSpace=c=>c!==undefined && ' \t\n\r\v\f'.includes(c);
    const digits={d:/^[+-]?\d+/,u:/^[+-]?\d+/,o:/^[+-]?[0-7]+/,x:/^[+-]?(?:0[xX])?[\da-fA-F]+/,X:/^[+-]?(?:0[xX])?[\da-fA-F]+/,p:/^(?:0[xX])?[\da-fA-F]+/};
    const integer=(text,conv)=>{
      let base=conv==='o'?8:conv==='x'||conv==='X'||conv==='p'?16:10;
      if(conv==='i'){
        const n=text.replace(/^[+-]/,'');base=/^0[xX]/.test(n)?16:allowBinaryPrefix&&/^0[bB]/.test(n)?2:/^0\d/.test(n)?8:10;
      }
      let rest=text,negative=false;
      if(rest[0]==='+'||rest[0]==='-'){negative=rest[0]==='-';rest=rest.slice(1);}
      if(base===16&&/^0[xX]/.test(rest))rest=rest.slice(2);
      if(base===2&&/^0[bB]/.test(rest))rest=rest.slice(2);
      let value=0n;for(const c of rest.toLowerCase()){
        const v=c>='0'&&c<='9'?c.charCodeAt(0)-48:c.charCodeAt(0)-87;
        if(v<0||v>=base)throw RangeError('Invalid scanf integer digit');value=value*BigInt(base)+BigInt(v);
      }
      return negative?-value:value;
    };
    function storeInt(ptr,value,length,forcePtr=false,isSigned=true){
      const bits=forcePtr||length==='ll'||length==='l'||length==='j'||length==='z'||length==='t'?64:
        length==='hh'?8:length==='h'?16:32;
      const kind=bits===64?'u64':bits===32?'u32':bits===16?'u16':'u8';
      if(ptr?.__cReference===true){
        if(forcePtr)throw TypeError('scanf cannot reconstruct an original source pointer from text');
        const encoded=isSigned?signed(value,bits):unsigned(value,bits);
        ptr.value=bits===64?encoded:Number(encoded);return;
      }
      const encoded=unsigned(value,bits);write(ptr,kind,bits===64?encoded:Number(encoded));
    }
    function storeFloat(ptr,value,length){
      if(length==='L')throw TypeError('scanf long double requires original extended-float storage');
      if(ptr?.__cReference===true){ptr.value=length==='l'?value:Math.fround(value);return;}
      write(ptr,length==='l'?'f64':'f32',value);
    }
    for(;f<fmt.length;){
      if(isSpace(fmt[f])){while(f<fmt.length&&isSpace(fmt[f]))f++;while(pos<source.length&&isSpace(source[pos]))pos++;continue;}
      if(fmt[f]!=='%'){
        if(source[pos]!==fmt[f])break;f++;pos++;consumedAny=true;continue;
      }
      f++;if(fmt[f]==='%'){if(source[pos]!=='%')break;f++;pos++;consumedAny=true;continue;}
      let suppress=false;if(fmt[f]==='*'){suppress=true;f++;}
      let width=0;while(/[0-9]/.test(fmt[f]??'')&&f<fmt.length){width=width*10+Number(fmt[f++]);}
      if(!Number.isSafeInteger(width)||width>1e8)throw RangeError('scanf excessive field width');
      let length='';if('hljztL'.includes(fmt[f]??'')&&f<fmt.length){length=fmt[f++];if((length==='h'||length==='l')&&fmt[f]===length){length+=fmt[f++];}}
      const spec=fmt[f++];if(!spec)break;
      if('cs['.includes(spec)&&length)throw TypeError('scanf wide-character storage is not implemented');
      if(spec==='n'){
        if(!suppress){if(ai>=args.length)throw TypeError('Missing sscanf %n pointer');storeInt(args[ai++],BigInt(pos),length);}
        continue;
      }
      if(spec!=='c'&&spec!=='['){while(pos<source.length&&isSpace(source[pos]))pos++;}
      const available=source.slice(pos,width?pos+width:undefined);let token='',value;
      if(spec==='c'){const count=width||1; if(available.length<count)break;token=available.slice(0,count);}
      else if(spec==='s'){token=/^\S+/.exec(available)?.[0]??'';}
      else if(spec==='['){
        let inverse=false;if(fmt[f]==='^'){inverse=true;f++;}
        const first=f; if(fmt[f]===']')f++;
        while(f<fmt.length&&fmt[f]!==']')f++;
        if(f===fmt.length)throw Error('Unterminated scanf scanset');
        const bracket=fmt.slice(first,f++);
        const accepts=c=>{
          let okay=false;for(let i=0;i<bracket.length;i++){
            if(bracket[i+1]==='-'&&i+2<bracket.length){if(c>=bracket[i]&&c<=bracket[i+2])okay=true;i+=2;}
            else if(bracket[i]===c)okay=true;
          }
          return inverse?!okay:okay;
        };
        let n=0;while(n<available.length&&accepts(available[n]))n++;token=available.slice(0,n);
      }else if('diuoxXp'.includes(spec)){
        const re=spec==='i'?(allowBinaryPrefix?/^[+-]?(?:0[xX][\da-fA-F]+|0[bB][01]+|0[0-7]*|[1-9]\d*)/:/^[+-]?(?:0[xX][\da-fA-F]+|0[0-7]*|[1-9]\d*)/):digits[spec];
        token=re.exec(available)?.[0]??'';if(token)value=integer(token,spec);
      }else if('aAeEfFgG'.includes(spec)){
        if(/^[+-]?0[xX]/.test(available))throw TypeError('scanf hexadecimal floating conversion is not implemented');
        const re=/^[+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|(?:inf(?:inity)?|nan(?:\([^)]*\))?))/i;
        token=re.exec(available)?.[0]??'';
        if(token&&/^[eE]/.test(available.slice(token.length)))token='';
        if(token)value=/^[+-]?inf/i.test(token)?(token[0]==='-'?-Infinity:Infinity):/^[+-]?nan/i.test(token)?NaN:Number(token);
      }else throw Error('Unsupported scanf conversion %'+spec);
      if(!token)break;
      if(!suppress){
        if(ai>=args.length)throw TypeError('Missing sscanf output pointer for %'+spec);
        const out=args[ai++];
        if('diuoxXp'.includes(spec))storeInt(out,value,length,spec==='p','di'.includes(spec));
        else if('aAeEfFgG'.includes(spec))storeFloat(out,value,length);
        else {
          const bytes=Uint8Array.from(token,char=>char.charCodeAt(0)),terminates=spec!=='c';
          const destination=sourceByteView(out),size=bytes.length+(terminates?1:0);
          if(destination){
            if(destination.length<size)throw RangeError('scanf string output exceeds original source bounds');
            destination.set(bytes);if(terminates)destination[bytes.length]=0;
          }else{
            if(typeof out!=='number'&&typeof out!=='bigint')throw TypeError('scanf string output requires verified storage');
            const pointer=Number(out);heap.check(pointer,size);heap.u8.set(bytes,pointer);
            if(terminates)heap.write(pointer+bytes.length,'u8',0);
          }
        }
        assigned++;
      }
      pos+=token.length;consumedAny=true;
    }
    return assigned===0&&!consumedAny&&pos>=source.length?-1:assigned;
  }
  return Object.freeze({sscanf:(...args)=>scan(false,...args),
    __isoc99_sscanf:(...args)=>scan(false,...args),__isoc23_sscanf:(...args)=>scan(true,...args)});
}
