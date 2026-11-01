import { sourceByteView } from './source_bytes.mjs';
/** Byte-oriented C99-style printf formatter for heap and source-first C views.
 * Deliberately rejects unsupported format extensions instead of silently
 * printing incorrect data.  All output sizes and %n side effects are checked.
 */
export function createCPrintf(heap, {streams=new Map()}={}) {
  const enc=new TextEncoder();
  // POSIX syslog shares the exact existing C printf formatter and ABI heap.
  // In the browser there is no system journald/syslog daemon: forward to the
  // configured diagnostic stderr sink, and reject unrepresentable formats.
  let syslogIdent='',syslogOptions=0,syslogFacility=8;
  const logErr=bytes=>{const sink=streams.get('stderr');if(!sink)throw Error('syslog requires stderr host sink');sink(bytes);};
  function numberFrom(x){const n=Number(x);if(!Number.isSafeInteger(n)||n<0)throw RangeError('Invalid C size');return n;}
  function stringBytes(value,limit=null){
    value=sourceByteView(value)??value;
    if(value instanceof Uint8Array){
      const end=value.indexOf(0);
      if(end<0 && (limit===null || limit>value.length))throw RangeError('Unterminated source C string');
      const length=end<0?limit:limit===null?end:Math.min(end,limit);
      return value.slice(0,length);
    }
    if(limit!==null){
      const result=[];
      for(let i=0;i<limit;i++){const byte=heap.read(value+i,'u8');if(!byte)break;result.push(byte);}
      return Uint8Array.from(result);
    }
    return heap.bytes(value,heap.strlen(value));
  }
  function fmtValues(ptr, next){
    ptr=sourceByteView(ptr)??ptr;
    const source=ptr instanceof Uint8Array?new TextDecoder().decode(stringBytes(ptr)):heap.readCString(ptr);
    const chunks=[];let count=0;
    const emit=(bytes)=>{chunks.push(bytes);count+=bytes.length;};
    for(let i=0;i<source.length;){
      if(source[i]!=='%'){
        let end=i+1;while(end<source.length&&source[end]!=='%')end++;
        emit(enc.encode(source.slice(i,end)));i=end;continue;
      }
      if(source[++i]==='%'){emit(Uint8Array.of(37));i++;continue;}
      const match=/^([-+ #0]*)(\*|\d+)?(?:\.(\*|\d*))?(hh|ll|h|l|j|z|t|L)?([diuoxXcspnfFeEgGaA])/.exec(source.slice(i));
      if(!match)throw Error('Unsupported C printf directive: '+source.slice(i,i+24));
      i+=match[0].length;
      let [,flags,widthPart,precPart,length='',spec]=match;
      let width=0,precision=null;
      if(widthPart){width=widthPart==='*'?Number(next('i32')):Number(widthPart);}
      if(!Number.isSafeInteger(width)||Math.abs(width)>100000)throw RangeError('Invalid printf width');
      if(width<0){flags+='-';width=-width;}
      if(precPart!==undefined){precision=precPart==='*'?Number(next('i32')):precPart===''?0:Number(precPart);}
      if(precision!==null&&(!Number.isSafeInteger(precision)||precision>100000))throw RangeError('Invalid printf precision');
      if(precision!==null&&precision<0)precision=null;
      const left=flags.includes('-'),alternate=flags.includes('#');
      const pad=bytes=>{
        if(width<=bytes.length)return bytes;
        const padding=new Uint8Array(width-bytes.length).fill(32);
        const result=new Uint8Array(width);
        if(left){result.set(bytes);result.set(padding,bytes.length);}
        else {result.set(padding);result.set(bytes,padding.length);}
        return result;
      };
      if(spec==='n'){
        const argument=next('ptr'),pos=sourceByteView(argument)??argument;
        const bytes=length==='hh'?1:length==='h'?2:['ll','l','j','z','t'].includes(length)?8:4;
        const value=bytes===8?BigInt(count):count;
        if(pos?.__cReference===true)pos.value=value;
        else if(ArrayBuffer.isView(pos)){
          if(pos.byteLength<bytes)throw RangeError('printf count exceeds source storage');
          const view=new DataView(pos.buffer,pos.byteOffset,pos.byteLength);
          view[bytes===8?'setBigInt64':bytes===4?'setInt32':bytes===2?'setInt16':'setInt8'](0,value,true);
        }else{
          heap.check(pos,bytes);
          heap.write(pos,bytes===8?'i64':bytes===4?'i32':bytes===2?'i16':'i8',value);
        }
        continue;
      }
      if(spec==='s'){
        if(length==='l'||length==='L')throw Error('Wide C printf strings are unsupported');
        const addr=next('ptr');
        let bytes=addr===0||addr===null?enc.encode('(null)'):stringBytes(addr,precision);
        if(precision!==null)bytes=bytes.slice(0,precision);
        emit(pad(bytes));continue;
      }
      if(spec==='c'){
        if(length==='l')throw Error('Wide C printf characters are unsupported');
        emit(pad(Uint8Array.of(Number(next('i32'))&255)));continue;
      }
      if('diuoxXp'.includes(spec)){
        const signed='di'.includes(spec),isPtr=spec==='p';
        const bits=isPtr||['ll','l','j','z','t'].includes(length)?64:length==='h'?16:length==='hh'?8:32;
        const val=BigInt(next(isPtr?'ptr':bits===64?'i64':'i32'));
        const num=signed?BigInt.asIntN(bits,val):BigInt.asUintN(bits,val);
        const negative=signed&&num<0n;
        const magnitude=negative?-num:num;
        const base=spec==='o'?8:spec==='x'||spec==='X'||isPtr?16:10;
        let digits=(precision===0&&magnitude===0n)?'':magnitude.toString(base);
        if(spec==='X')digits=digits.toUpperCase();
        if(precision!==null)digits=digits.padStart(precision,'0');
        let prefix=negative?'-':signed&&flags.includes('+')?'+':signed&&flags.includes(' ')?' ':'';
        if(isPtr){if(val===0n){emit(pad(enc.encode('(nil)')));continue;}prefix='0x';}
        else if(alternate&&base===16&&magnitude!==0n)prefix=spec==='X'?'0X':'0x';
        else if(alternate&&base===8&&!digits.startsWith('0'))prefix+='0';
        let result=prefix+digits;
        if(!left&&flags.includes('0')&&precision===null&&width>result.length)
          result=prefix+'0'.repeat(width-result.length)+digits;
        emit(pad(enc.encode(result)));continue;
      }
      if('fFeEgG'.includes(spec)){
        if(length==='L')throw Error('80-bit long double printf is unsupported');
        const v=Number(next('double'));
        const p=precision===null?6:precision;
        if(p>100)throw Error('Floating printf precision beyond validated range');
        let rendered;
        if(Number.isNaN(v))rendered='nan';
        else if(!Number.isFinite(v))rendered='inf';
        else if('fF'.includes(spec))rendered=Math.abs(v).toFixed(p);
        else if('eE'.includes(spec))rendered=Math.abs(v).toExponential(p);
        else rendered=Math.abs(v).toPrecision(p||1);
        if('eEgG'.includes(spec)) rendered=rendered.replace(/e([+-])(\d+)$/,(_m,sign,exponent)=>'e'+sign+exponent.padStart(2,'0'));
        if('gG'.includes(spec)&&!alternate){
          const parts=rendered.split('e');
          parts[0]=parts[0].includes('.')?parts[0].replace(/0+$/,'').replace(/\.$/,''):parts[0];
          rendered=parts.join('e');
        }
        if(v<0||Object.is(v,-0))rendered='-'+rendered;
        else if(flags.includes('+'))rendered='+'+rendered;
        else if(flags.includes(' '))rendered=' '+rendered;
        if(/[EFG]/.test(spec))rendered=rendered.toUpperCase();
        if(!left&&flags.includes('0')&&width>rendered.length){
          const sign=/^[ +\-]/.test(rendered)?rendered[0]:'';
          rendered=sign+'0'.repeat(width-rendered.length)+rendered.slice(sign.length);
        }
        emit(pad(enc.encode(rendered)));continue;
      }
      throw Error('Unsupported printf specifier: '+spec);
    }
    const bytes=new Uint8Array(count);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return bytes;
  }
  function vaGetter(ptr){
    // Source-translated callers already pass promoted JavaScript arguments.
    // Consume their exact va_list cursor instead of treating it as a numeric
    // SysV save-area address. va_copy owns an independent index on this list.
    if(ptr?.__cVaList===true){
      const check=()=>{
        if(ptr.ended||!Array.isArray(ptr.values)||!Number.isSafeInteger(ptr.index)||ptr.index<0)
          throw TypeError('Invalid or ended source C va_list');
      };
      check();
      return ()=>{check();if(ptr.index>=ptr.values.length)throw RangeError('Source C va_list exhausted');return ptr.values[ptr.index++];};
    }
    heap.check(ptr,24);
    return type=>{
      const fp=type==='double';
      const slot=ptr+(fp?4:0);let offset=heap.read(slot,'u32');
      let address;
      if(offset<(fp?176:48)){
        address=Number(heap.read(ptr+16,'u64'))+offset;
        heap.write(slot,'u32',offset+(fp?16:8));
      }else{
        const overflow=Number(heap.read(ptr+8,'u64'));
        address=overflow;
        heap.write(ptr+8,'u64',BigInt(overflow+8));
      }
      if(fp)return heap.read(address,'f64');
      const raw=heap.read(address,'u64');
      return type==='i32'?Number(BigInt.asIntN(32,raw)):type==='i64'?BigInt.asIntN(64,raw):Number(raw);
    };
  }
  function write(dst,size,bytes){
    dst=sourceByteView(dst)??dst;
    size=numberFrom(size);
    if(size){
      const n=Math.min(bytes.length,size-1);
      if(dst instanceof Uint8Array){
        if(size>dst.length)throw RangeError('printf destination exceeds source storage');
        dst.set(bytes.subarray(0,n));dst[n]=0;
      }else{heap.check(dst,size);heap.u8.set(bytes.subarray(0,n),dst);heap.u8[dst+n]=0;}
    }
    return bytes.length;
  }
  const fromArgs=(args)=>{let i=0;return type=>{if(i>=args.length)throw Error('Missing C variadic formatting argument');return args[i++];};};
  function output(file,bytes){
    const sink=streams.get(Number(file));
    if(!sink)throw Error('Unsupported C FILE* stream');
    sink(bytes.slice());
  }
  return {
    openlog:(ident,options,facility)=>{
      syslogIdent=ident?heap.readCString(ident):'';
      syslogOptions=Number(options)|0;
      syslogFacility=Number(facility)|0;
    },
    closelog:()=>{syslogIdent='';syslogOptions=0;syslogFacility=8;},
    syslog:(priority,format,...args)=>{
      priority=Number(priority)|0;
      if((priority&7)>7||priority<0||!format)throw RangeError('Invalid syslog priority or format');
      const content=fmtValues(format,fromArgs(args));
      const label=syslogIdent?syslogIdent+((syslogOptions&1)?'['+'translated'+']':'')+': ':'';
      const prefix=enc.encode(label);
      const bytes=new Uint8Array(prefix.length+content.length+1);
      bytes.set(prefix);bytes.set(content,prefix.length);bytes[bytes.length-1]=10;
      // Explicit output through genuine configured sink, no simulated OS daemon.
      logErr(bytes);
    },
    fprintf:(file,format,...args)=>{
      const bytes=fmtValues(format,fromArgs(args));output(file,bytes);return bytes.length;
    },
    printf:(format,...args)=>{
      const bytes=fmtValues(format,fromArgs(args));
      const sink=streams.get('stdout');if(!sink)throw Error('C stdout stream unavailable');
      sink(bytes.slice());return bytes.length;
    },
    fputs:(str,file)=>{const bytes=stringBytes(str);output(file,bytes);return 1;},
    fputc:(char,file)=>{output(file,Uint8Array.of(Number(char)&255));return Number(char)&255;},
    fflush:file=>{
      if(file===0)return 0;
      if(!streams.has(Number(file)))throw Error('Unsupported fflush FILE*');
      // Host sinks are unbuffered and accept each byte block synchronously.
      return 0;
    },
    snprintf:(dest,n,format,...args)=>write(dest,n,fmtValues(format,fromArgs(args))),
    sprintf:(dest,format,...args)=>{const bytes=fmtValues(format,fromArgs(args));return write(dest,bytes.length+1,bytes);},
    vsnprintf:(dest,n,format,list)=>write(dest,n,fmtValues(format,vaGetter(list))),
  };
}
