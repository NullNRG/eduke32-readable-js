// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/osd.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { OSD_ParsingScript } from "./osd.cpp.mjs";
import { current_verbosity_cutoff } from "./loguru.cpp.mjs";
import { __cxx_private_cell_a920b40f756adfb47f87522c } from "./osd.cpp.mjs";
import { hash_findcase } from "./hash.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { __cxx_global_cell_5a97be12fac9e104b96ea90d } from "./osd.cpp.mjs";
import { sscanf } from "../../../browser-abi/libc_provider.mjs";
import { strtol } from "../../../browser-abi/libc_provider.mjs";
import { strtoul } from "../../../browser-abi/libc_provider.mjs";

// Bounded source-language pointer aliases over native JS typed buffers/arrays.
// Embedded in generated ES modules; never a CPU, ISA or opcode interpreter.
const cPointer = source => {
  if (source?.__cDeferredPointer === true) return cPointer(source.resolve());
  if (source && source.__cPointer === true) return source;
  if(source?.__cReference===true&&source.value?.[Symbol.for('source-first.original-byte-record-storage/1')])
    return cPointer(source.value);
  const record=source?.[Symbol.for('source-first.original-byte-record-storage/1')];
  if(record)return cPointer(record.bytes);
  const allocation=source&&globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(source);
  if (allocation) return {__cPointer:true,buffer:allocation.slots,lower:0,
    upper:allocation.extent,offset:0,array:true,stride:allocation.extent};
  if (Array.isArray(source)) {
    const bytes=source[Symbol.for('source-first.clang-byte-record-array/1')];
    return { __cPointer:true, buffer:source, lower:0, upper:bytes?bytes.length:source.length,
      offset:0,array:true,stride:bytes&&source.length?bytes.length/source.length:1 };
  }
  if (!ArrayBuffer.isView(source) || source instanceof DataView)
    throw new TypeError('C pointer requires bounded array storage');
  return { __cPointer:true, buffer:source.buffer, lower:source.byteOffset,
    upper:source.byteOffset+source.byteLength, offset:source.byteOffset, array:false };
};
// A static C array address is a link-time relocation. Resolve its proven
// source owner on use, after module initialization; do not read an ESM binding
// early while merely constructing a forward/static pointer initializer.
const cStaticPointer = resolve => ({__cDeferredPointer:true, resolve});
const cPointerElementRef = (source,index) => {
  if (source?.__cDeferredPointer===true || source?.__cDeferredReference===true)
    return cPointerElementRef(source.resolve(),index);
  // C++ native_t is pointer-sized (64-bit on this build) and lowers to
  // BigInt. Convert only when the index is representable exactly in JS.
  if (typeof index === 'bigint') {
    if (index < -BigInt(Number.MAX_SAFE_INTEGER) || index > BigInt(Number.MAX_SAFE_INTEGER))
      throw new RangeError('C pointer index exceeds exactly representable bounds');
    index = Number(index);
  }
  if (!Number.isSafeInteger(index)) throw new TypeError('C pointer index requires an integer');
  if (source?.__cReference===true) {
    // An original field/element lvalue already implements its zero-offset
    // dereference, including packed pointer fields without a pointer-array
    // registration. Other indices still require actual bounded array storage.
    if (index===0) return source;
    if (source.__cPointer!==true) throw new RangeError('C single-object pointer escapes original storage');
  }
  const pointer=cPointer(source);
  if(pointer.__cRecordPointer===true){
    const api=globalThis[Symbol.for('source-first.record-pointer-views/1')];
    if(!api)throw new TypeError('Original record-pointer view provider missing');
    return api.element(pointer,index);
  }
  if (!pointer.array) {
    const allocation=globalThis[Symbol.for('source-first.pointer-array-allocations/1')]?.get(pointer.buffer);
    const offset=pointer.offset+index*8;
    if(!allocation)throw new TypeError('C aggregate/pointer slot requires a proven source array');
    if(!Number.isSafeInteger(offset)||offset%8||offset<pointer.lower||offset+8>pointer.upper||
        offset<allocation.lower||offset+8>allocation.upper)throw new RangeError('Pointer slot escapes original LP64 allocation');
    return {...pointer,__cReference:true,offset,get value(){return allocation.read(offset);},set value(value){allocation.write(offset,value);}};
  }
  const stride=pointer.stride || 1;
  const offset=pointer.offset+index*stride;
  if (!Number.isSafeInteger(offset) || offset<pointer.lower || offset>=pointer.upper || offset%stride)
    throw new RangeError('C aggregate/pointer array index escapes original bounds');
  const slot=offset/stride;
  return {...pointer,__cReference:true,offset,get value(){return pointer.buffer[slot];},set value(next){pointer.buffer[slot]=next;}};
};
const cTypedPointer = (source, Type) => {
  if (!Type || !Number.isSafeInteger(Type.BYTES_PER_ELEMENT)) throw new TypeError('Unsupported pointer element type');
  if (source===null) return null;
  const pointerBytes=source?.[Symbol.for('source-first.clang-byte-record-array/1')];
  if(pointerBytes)return cPointer(pointerBytes);
  if (Array.isArray(source)) return { ...cPointer(source), upper:source.length*Type.BYTES_PER_ELEMENT, stride:Type.BYTES_PER_ELEMENT };
  const pointer=cPointer(source);
  if(pointer.__cRecordPointer===true){
    const {__cRecordPointer,recordSchema,recordPrototypes,...raw}=pointer;
    return raw;
  }
  return pointer;
};
const cPointerOffset = (source, delta, stride=1) => {
  const initial=cPointer(source);
  const p=Array.isArray(source) ? {...initial, upper:source.length*stride, stride} : initial;
  if (p.array && p.stride!==stride) throw new TypeError('Cannot reinterpret JS numeric-array element widths');
  const change=Number(delta)*stride, next=p.offset+change;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || next<p.lower || next>p.upper)
    throw new RangeError('C pointer escapes original array bounds');
  if(p.__cPointer===true&&p.__cReference===true){
    if(next===p.offset)return p;
    return {__cPointer:true,buffer:p.buffer,array:p.array,lower:p.lower,upper:p.upper,offset:next,
      ...(p.array?{stride:p.stride}: {})};
  }
  const result={...p,offset:next};
  return result;
};
const cDeref = (source, Type) => {
  if (source && !ArrayBuffer.isView(source) && source.__cPointer !== true &&
      typeof source==='object' && 'value' in source) return source;
  const p=cPointer(source);
  if (p.array) {
    if (p.offset>=p.upper) throw new RangeError('C array pointer dereferences one-past-end');
    if (Type.BYTES_PER_ELEMENT!==p.stride || p.offset%p.stride!==0)
      throw new TypeError('Array element type does not match original pointer stride');
    const index=p.offset/p.stride;
    return {get value(){return p.buffer[index];}, set value(value){p.buffer[index]=value;}};
  }
  const width=Type?.BYTES_PER_ELEMENT;
  if (!Number.isSafeInteger(width) || width<=0 || p.offset+width>p.upper)
    throw new RangeError('C typed pointer dereference out of bounds');
  const access=new Map([
    [Uint8Array,['getUint8','setUint8']], [Int8Array,['getInt8','setInt8']],
    [Uint16Array,['getUint16','setUint16']], [Int16Array,['getInt16','setInt16']],
    [Uint32Array,['getUint32','setUint32']], [Int32Array,['getInt32','setInt32']],
    [Float32Array,['getFloat32','setFloat32']], [Float64Array,['getFloat64','setFloat64']],
    [BigInt64Array,['getBigInt64','setBigInt64']], [BigUint64Array,['getBigUint64','setBigUint64']]
  ]).get(Type);
  if (!access) throw new TypeError('Unsupported C pointer scalar type');
  const view=new DataView(p.buffer,p.offset,width);
  return {get value(){return view[access[0]](0,true);},
          set value(next){view[access[1]](0,next,true);}};
};
// An address-reinterpreted scalar has one native byte allocation. Reads via
// its source identifier and all typed/byte aliases share the same DataView.
const cScalarStorage = (Type, initial) => {
  const array=new Type([initial]),pointer=cPointer(array),reference=cDeref(pointer,Type);
  return {...pointer,__cReference:true,
    get value(){return reference.value;},set value(value){reference.value=value;}};
};
const cPointerCompare = (left,right,op) => {
  if (left?.__cDeferredReference===true) left=left.resolve();
  if (right?.__cDeferredReference===true) right=right.resolve();
  if(left?.__cReference===true&&left.__cPointer!==true&&left.value?.[Symbol.for('source-first.original-byte-record-storage/1')])left=left.value;
  if(right?.__cReference===true&&right.__cPointer!==true&&right.value?.[Symbol.for('source-first.original-byte-record-storage/1')])right=right.value;
  if (left===null || right===null) {
    if (op==='==' || op==='!=') return op==='==' ? left===right : left!==right;
    throw new TypeError('Cannot order a null C pointer');
  }
  if(typeof left==='function'||typeof right==='function'){
    if(op==='=='||op==='!=')return op==='=='?left===right:left!==right;
    throw new TypeError('Cannot order original function pointers');
  }
  const opaqueRecord=value=>value?.[Symbol.for('source-first.original-record-storage/1')]===true&&
    !value[Symbol.for('source-first.original-byte-record-storage/1')];
  if(opaqueRecord(left)||opaqueRecord(right)){
    if(op==='=='||op==='!=')return op==='=='?left===right:left!==right;
    throw new TypeError('Cannot order nonbyte original record pointers');
  }
  // Scalar global addresses are stable owner-created reference objects, not
  // array-buffer addresses. Equality is legal; ordering unrelated scalar
  // objects is deliberately rejected rather than guessed.
  if (left?.__cReference===true&&left.__cPointer!==true || right?.__cReference===true&&right.__cPointer!==true) {
    if (op==='==' || op==='!=') return op==='==' ? left===right : left!==right;
    throw new TypeError('Cannot order scalar reference pointers');
  }
  const pointerAddress=value=>cPointer(value?.[Symbol.for('source-first.original-byte-record-storage/1')]?.bytes||value);
  const a=Array.isArray(left) && right?.__cPointer && right.array
    ? {...cPointer(left),upper:left.length*right.stride,stride:right.stride} : pointerAddress(left);
  const b=Array.isArray(right) && a.array
    ? {...cPointer(right),upper:right.length*a.stride,stride:a.stride} : pointerAddress(right);
  const address=p=>{const bytes=p.array&&p.buffer[Symbol.for('source-first.clang-byte-record-array/1')];
    return bytes?{buffer:bytes.buffer,offset:bytes.byteOffset+p.offset,lower:bytes.byteOffset+p.lower,upper:bytes.byteOffset+p.upper}:p;};
  const addressA=address(a),addressB=address(b);
  const equal=addressA.buffer===addressB.buffer && addressA.offset===addressB.offset;
  if (op==='==') return equal;
  if (op==='!=') return !equal;
  if (addressA.buffer!==addressB.buffer || addressA.lower!==addressB.lower || addressA.upper!==addressB.upper)
    throw new TypeError('Cannot order pointers to different source array bounds');
  switch(op){case '<':return addressA.offset<addressB.offset;case '<=':return addressA.offset<=addressB.offset;
    case '>':return addressA.offset>addressB.offset;case '>=':return addressA.offset>=addressB.offset;}
  throw new TypeError('Invalid C pointer comparison');
};
const cPointerDiff = (left,right,stride) => {
  const address=value=>{
    const p=Array.isArray(value)?{...cPointer(value),upper:value.length*stride,stride}:cPointer(value);
    const bytes=p.array&&p.buffer[Symbol.for('source-first.clang-byte-record-array/1')];
    return bytes?{buffer:bytes.buffer,lower:bytes.byteOffset+p.lower,upper:bytes.byteOffset+p.upper,offset:bytes.byteOffset+p.offset}:p;
  };
  const a=address(left),b=address(right);
  if (a.buffer!==b.buffer || a.lower!==b.lower || a.upper!==b.upper)
    throw new TypeError('Cannot subtract pointers to different source arrays');
  const delta=(a.offset-b.offset)/stride;
  if (!Number.isSafeInteger(delta)) throw new RangeError('Misaligned C pointer difference');
  return delta;
};

const cRecordObject = source => {
  if (source?.__cDeferredPointer === true || source?.__cDeferredReference === true) return cRecordObject(source.resolve());
  if (source?.__cReference === true) return source.value;
  if (Array.isArray(source)) { if (!source.length) throw new RangeError("C record pointer dereferences empty array"); return source[0]; }
  if (source?.__cRecordPointer === true) return globalThis[Symbol.for("source-first.record-pointer-views/1")].deref(source);
  if (source?.__cPointer === true) {
    if (!source.array) throw new TypeError("C record pointer requires source-backed object slots");
    return cPointerElementRef(source,0).value;
  }
  return source;
};
const cStaticReference = resolve => ({ __cReference:true, __cDeferredReference:true, resolve, get value() { return resolve().value; }, set value(value) { resolve().value=value; } });
const cObjectFieldRef = (owner, field) => { const storage=owner?.[Symbol.for("source-first.original-byte-record-storage/1")]; if(storage)return globalThis[Symbol.for("source-first.record-pointer-views/1")].fieldReference(owner,field); const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); };
const cRef = (read, write) => ({ __cReference:true, get value() { return read(); }, set value(v) { write(v); } });
const cArrayRef = (array, index) => cRef(() => array[index], v => { array[index] = v; });
// Native JavaScript implementation of verified C byte-memory operations.
// This is not CPU emulation. All accesses remain inside the original storage.
// A C source pointer represented by an opaque JS array of nonbyte values is
// rejected: its object representation has not been proven or materialized.
const cByteMemory = (() => {
  const extent = (source, amount) => {
    const n = Number(amount);
    if ((typeof amount !== 'number' && typeof amount !== 'bigint') ||
        !Number.isSafeInteger(n) || n < 0) throw new RangeError('invalid C byte count');
    let buffer, start, lower, upper;
    if (source?.__cDeferredPointer===true || source?.__cDeferredReference===true)
      return extent(source.resolve(),amount);
    if (source?.__cReference===true&&source.__cPointer!==true) return extent(source.value,amount);
    if (source && source.__cPointer === true) {
      const records=source.array && source.buffer?.[Symbol.for('source-first.clang-byte-record-array/1')];
      if (records instanceof Uint8Array) {
        buffer=records.buffer;start=records.byteOffset+source.offset;
        lower=records.byteOffset+source.lower;upper=records.byteOffset+source.upper;
        if (source.upper>records.byteLength) throw new RangeError('C record pointer bounds exceed original allocation');
      } else if (source.array || !(source.buffer instanceof ArrayBuffer))
        throw new TypeError('C byte operation needs actual contiguous byte storage');
      else {({buffer,lower,upper}=source); start=source.offset;}
    } else if (ArrayBuffer.isView(source) && !(source instanceof DataView)) {
      ({buffer}=source); start=source.byteOffset;
      lower=start; upper=start+source.byteLength;
    } else {
      const bytes=source?.[Symbol.for('source-first.clang-byte-record-array/1')] ||
                  source?.[Symbol.for('source-first.original-byte-record-storage/1')]?.bytes;
      if (!(bytes instanceof Uint8Array))
        throw new TypeError('C byte operation requires bounded native TypedArray or C pointer');
      ({buffer}=bytes);start=bytes.byteOffset;lower=start;upper=start+bytes.byteLength;
    }
    if (!Number.isSafeInteger(start) || start<lower || start>upper ||
        !Number.isSafeInteger(upper) || n>upper-start)
      throw new RangeError('C byte operation exceeds original allocation');
    return {buffer,start,n,view:new Uint8Array(buffer,start,n)};
  };
  const cstring = source => {
    // C's char* addresses have bounded storage, not JavaScript UTF-16 strings.
    // Accept the same owned byte views as memcpy and stop only at a NUL byte.
    if (source && source.__cPointer === true) {
      if (source.array || !(source.buffer instanceof ArrayBuffer) ||
          !Number.isSafeInteger(source.offset) || source.offset<source.lower ||
          source.offset>source.upper)
        throw new TypeError('unproven C char pointer storage');
      return new Uint8Array(source.buffer,source.offset,source.upper-source.offset);
    }
    if (ArrayBuffer.isView(source) && !(source instanceof DataView))
      return new Uint8Array(source.buffer,source.byteOffset,source.byteLength);
    throw new TypeError('C string needs bounded native byte storage');
  };
  const terminator = value => {
    const view=cstring(value), idx=view.indexOf(0);
    if (idx<0) throw new RangeError('unterminated C string exceeds its allocation');
    return {view,idx};
  };
  const pair = (dest,src,count,overlapAllowed) => {
    const d=extent(dest,count),s=extent(src,count);
    const overlaps=d.buffer===s.buffer && d.start<s.start+d.n && s.start<d.start+d.n;
    if (overlaps && !overlapAllowed) throw new RangeError('overlapping C memcpy has undefined behavior');
    return {d,s};
  };
  // ISO C printf-compatible byte formatting for *verified* sprintf/snprintf
  // declarations. Only byte-representable scalar conversions are supported;
  // unsupported ABI conversions fail closed instead of silently corrupting
  // source game data or overflowing a C allocation.
  const asCBytes = value => {
    if (typeof value === 'string') {
      const bytes = new Uint8Array(value.length + 1);
      for (let i=0;i<value.length;i++) {
        const n=value.charCodeAt(i);
        if (n>255) throw new TypeError('C literal contains nonbyte Unicode');
        bytes[i]=n;
      }
      return bytes;
    }
    return cstring(value);
  };
  const toText = bytes => {
    let s=''; for (let i=0;i<bytes.length;i++) s+=String.fromCharCode(bytes[i]);
    return s;
  };
  const asInteger = value => {
    if (typeof value === 'bigint') return value;
    if (typeof value !== 'number' || !Number.isSafeInteger(value))
      throw new TypeError('C printf integer requires proven integral scalar');
    return BigInt(value);
  };
  const formatC = (format,args) => {
    const raw=asCBytes(format),nul=raw.indexOf(0);
    if(nul<0)throw new RangeError('unterminated printf format');
    const fmt=toText(raw.subarray(0,nul));
    let output='',at=0;
    const next=()=>{if(at>=args.length)throw new TypeError('missing C vararg');return args[at++];};
    for(let i=0;i<fmt.length;) {
      if(fmt[i]!=='%') {output+=fmt[i++];continue;}
      i++;
      if(fmt[i]==='%'){output+='%';i++;continue;}
      let flags='';while(i<fmt.length && '-+ #0'.includes(fmt[i]))flags+=fmt[i++];
      let width=null;
      if(fmt[i]==='*') {width=Number(asInteger(next()));i++;}
      else {const start=i;while(/[0-9]/.test(fmt[i]??''))i++;
        if(i>start)width=Number(fmt.slice(start,i));}
      if(width!==null && width<0) {flags+='-';width=-width;}
      let precision=null;
      if(fmt[i]==='.') {
        i++;if(fmt[i]==='*'){precision=Number(asInteger(next()));i++;if(precision<0)precision=null;}
        else {const start=i;while(/[0-9]/.test(fmt[i]??''))i++;
          precision=Number(fmt.slice(start,i)||'0');}
      }
      let length='';
      if('hljztL'.includes(fmt[i]??'') && i<fmt.length){length=fmt[i++];
        if((length==='h'||length==='l')&&fmt[i]===length)length+=fmt[i++];}
      const spec=fmt[i++];
      if(!spec || !'diuoxXcspfFeEgG'.includes(spec))
        throw new TypeError('unsupported C printf conversion: '+spec);
      if(width!==null && (!Number.isSafeInteger(width)||width>1_000_000) ||
        precision!==null && (!Number.isSafeInteger(precision)||precision>1_000_000))
        throw new RangeError('C printf width or precision outside safe bound');
      let result='',sign='',prefix='';
      if('diuoxX'.includes(spec)) {
        if(!['','h','hh','l','ll','j','z','t'].includes(length))
          throw new TypeError('unproven integer printf length');
        const bits=length==='hh'?8:length==='h'?16:['l','ll','j','z','t'].includes(length)?64:32;
        const signed=spec==='d'||spec==='i';
        let n=asInteger(next()); n=signed?BigInt.asIntN(bits,n):BigInt.asUintN(bits,n);
        if(n<0n){sign='-';n=-n;}
        else if(signed){sign=flags.includes('+')?'+':flags.includes(' ')?' ':'';}
        const base='xX'.includes(spec)?16:spec==='o'?8:10;
        result=n.toString(base);
        if(spec==='X')result=result.toUpperCase();
        if(precision===0 && n===0n)result='';
        if(precision!==null)result=result.padStart(precision,'0');
        if(flags.includes('#')) {
          if('xX'.includes(spec) && n!==0n) prefix=spec==='X'?'0X':'0x';
          if(spec==='o' && !result.startsWith('0')) prefix='0';
        }
      } else if(spec==='s') {
        if(length)throw new TypeError('wide printf string unsupported');
        const bytes=asCBytes(next());const zero=bytes.indexOf(0);
        if(precision===null && zero<0)throw new RangeError('unterminated C printf string');
        const end=precision===null?zero:Math.min(precision,zero<0?bytes.length:zero);
        if(end>bytes.length)throw new RangeError('C string formatting overreads source');
        result=toText(bytes.subarray(0,end));
      } else if(spec==='c') {
        if(length)throw new TypeError('wide printf character unsupported');
        result=String.fromCharCode(Number(BigInt.asUintN(8,asInteger(next()))));
      } else if('fFeEgG'.includes(spec)) {
        if(length && length!=='l')throw new TypeError('unproven floating printf length');
        const n=Number(next());if(Number.isNaN(n)){result='nan';}
        else if(!Number.isFinite(n)){result='inf';sign=n<0?'-':flags.includes('+')?'+':'';}
        else {
          if(n<0 || Object.is(n,-0))sign='-';
          else sign=flags.includes('+')?'+':flags.includes(' ')?' ':'';
          const v=Math.abs(n),p=precision===null?6:precision;
          if(p>100)throw new RangeError('C float precision exceeds proven implementation');
          if(spec==='f'||spec==='F')result=v.toFixed(p);
          else if(spec==='e'||spec==='E') {
            result=v.toExponential(p).replace(/e([+-])(\d)$/, 'e$10$2');
          } else {
            result=v.toPrecision(Math.max(1,p)).replace(/(\.\d*?)0+(e|$)/,'$1$2').replace(/\.(e|$)/,'$1');
          }
          if(flags.includes('#')&&!result.includes('.'))result=result.replace(/(e|$)/,'.'+'$1');
        }
        if(/[FEG]/.test(spec))result=result.toUpperCase();
      } else throw new TypeError('unsupported printf conversion');
      const left=flags.includes('-'),fill=flags.includes('0')&&!left&&precision===null?'0':' ';
      const n=sign.length+prefix.length+result.length;
      if(width!==null&&n<width) {
        const pad=fill.repeat(width-n);
        output+=left?sign+prefix+result+pad:fill==='0'?sign+prefix+pad+result:pad+sign+prefix+result;
      } else output+=sign+prefix+result;
      if(output.length>16_777_216)throw new RangeError('C printf output excessive');
    }
    return output;
  };
  const writeFormatted = (dest,limit,format,args,truncates) => {
    const rendered=formatC(format,args);
    const available=Number(limit);
    if(!Number.isSafeInteger(available)||available<0)throw new RangeError('invalid C printf destination extent');
    // snprintf with n=0 must never dereference dest (C permits null).
    if(!available && truncates)return rendered.length;
    const bytes=extent(dest,truncates?available:rendered.length+1);
    if(!truncates && rendered.length+1>bytes.n)throw new RangeError('sprintf overflow');
    const actual=Math.min(rendered.length,bytes.n-1);
    for(let i=0;i<actual;i++)bytes.view[i]=rendered.charCodeAt(i);
    bytes.view[actual]=0;
    return rendered.length;
  };
  return Object.freeze({
    sprintf(dest,format,...args) {
      // The destination is a known bounded source-level C allocation.
      const d=extent(dest,0);const cap=dest&&dest.__cPointer===true?dest.upper-d.start:dest.byteLength;return writeFormatted(dest,cap,format,args,false);
    },
    snprintf(dest,limit,format,...args) {return writeFormatted(dest,limit,format,args,true);},
    memcpy(dest,src,count) {
      const {d,s}=pair(dest,src,count,false);d.view.set(s.view);return dest;
    },
    memmove(dest,src,count) {
      const {d,s}=pair(dest,src,count,true);d.view.set(s.view.slice());return dest;
    },
    memset(dest,byte,count) {
      const d=extent(dest,count);
      if (typeof byte!=='number' || !Number.isFinite(byte)) throw new TypeError('C memset requires integer scalar');
      d.view.fill(Math.trunc(byte)&255);return dest;
    },
    memcmp(a,b,count) {
      const x=extent(a,count).view,y=extent(b,count).view;
      for (let i=0;i<x.length;i++) if (x[i]!==y[i]) return x[i]-y[i];
      return 0;
    },
    strlen(value) { return terminator(value).idx; },
    strcmp(a,b) {
      const x=terminator(a).view,y=terminator(b).view;
      for (let i=0;;i++) {
        const d=x[i]-y[i];
        if (d || x[i]===0) return d;
      }
    },
    strncmp(a,b,n) {
      const count=Number(n);
      if (!Number.isSafeInteger(count) || count<0) throw new RangeError('invalid C string bound');
      if (count===0) return 0;
      const x=cstring(a),y=cstring(b);
      for (let i=0;i<count;i++) {
        if (i>=x.length || i>=y.length) throw new RangeError('C string read exceeds allocation');
        const d=x[i]-y[i];
        if (d || x[i]===0) return d;
      }
      return 0;
    },
    strcasecmp(a,b) {
      const x=terminator(a).view,y=terminator(b).view;
      const fold=v=>v>=65&&v<=90?v+32:v;
      for(let i=0;;i++){
        const d=fold(x[i])-fold(y[i]);
        if(d||x[i]===0)return d;
      }
    },
    strncasecmp(a,b,n) {
      const count=Number(n);
      if(!Number.isSafeInteger(count)||count<0)throw new RangeError('invalid bounded C case compare');
      if(count===0)return 0;
      const x=cstring(a),y=cstring(b),fold=v=>v>=65&&v<=90?v+32:v;
      for(let i=0;i<count;i++){
        if(i>=x.length||i>=y.length)throw new RangeError('C case compare reads beyond allocation');
        const d=fold(x[i])-fold(y[i]);
        if(d||x[i]===0)return d;
      }
      return 0;
    },
    strcpy(dest,src) {
      const {idx}=terminator(src);
      const {d,s}=pair(dest,src,idx+1,false);
      d.view.set(s.view);return dest;
    },
    strncpy(dest,src,n) {
      const count=Number(n);
      if (!Number.isSafeInteger(count) || count<0) throw new RangeError('invalid C string copy bound');
      const d=extent(dest,count);
      if (!count)return dest;
      const s=cstring(src);
      let copied=0;
      while (copied<count && copied<s.length && s[copied]!==0)copied++;
      if (copied===s.length && copied<count)throw new RangeError('C string read exceeds allocation');
      // strncpy includes the NUL if encountered, then pads with NULs.
      const readBytes=Math.min(count,copied+(copied<s.length && s[copied]===0?1:0));
      const srcExtent=extent(src,readBytes);
      if (d.buffer===srcExtent.buffer && d.start<srcExtent.start+readBytes &&
          srcExtent.start<d.start+count)
        throw new RangeError('overlapping C strncpy has undefined behavior');
      d.view.fill(0);
      if (copied)d.view.set(srcExtent.view.subarray(0,copied));
      return dest;
    }
  });
})();

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const u64 = value => BigInt.asUintN(64, BigInt(value));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/src/osd.cpp:2226
const __cxx_literal_4d66d46129e199593a26 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_546b4594bda44ece3959 = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 102, 39, 0]);
const __cxx_literal_e22ec087e098d4422a66 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_f3c2feb72076cc96e10b = Uint8Array.from([37, 115, 32, 91, 37, 100, 45, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_57ff4d8cfe98bbc4a5c9 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_9d0f3b18b77a7dd3b6bc = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 102, 39, 0]);
const __cxx_literal_034fa3fe05a2bc76dc01 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_9a7d2973bd4ffb697928 = Uint8Array.from([37, 115, 32, 91, 37, 100, 45, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_fc6d246229b35cee389d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_75971243a5af9a9cdbee = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 100, 39, 0]);
const __cxx_literal_20603fc1ba8e4217c7a5 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_4f46942b4de238c5a704 = Uint8Array.from([37, 115, 32, 91, 37, 100, 37, 99, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_83f07f3086a417686170 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_9ea42a8be95fe9ce1295 = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 100, 39, 0]);
const __cxx_literal_e332aaed53662cd48645 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_4999400708ee62b0827c = Uint8Array.from([37, 115, 32, 91, 37, 100, 45, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_ad727c6404eefc8f70de = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_9a23d7dc35995e0ad661 = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 115, 39, 0]);
const __cxx_literal_c3feb1803c2cc66fbaf7 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_74e333b94ce9ba72cc78 = Uint8Array.from([37, 115, 58, 32, 37, 115, 0]);
export function osdfunc_printvar(cvaridx) {
  let pData = cRecordObject((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).cvars, cvaridx).value).pData);
  switch (u32((pData.flags & u32(63)))) {
    case u32(1): {
      ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_4d66d46129e199593a26, u32(2233), __cxx_literal_546b4594bda44ece3959, pData.name, (cDeref(pData.__cxx_anonymous_2.f, Float32Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_e22ec087e098d4422a66, u32(2234), __cxx_literal_f3c2feb72076cc96e10b, pData.name, pData.min, pData.max, pData.desc));
    return i32(0);
    case u32(32): {
      ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_57ff4d8cfe98bbc4a5c9, u32(2237), __cxx_literal_9d0f3b18b77a7dd3b6bc, pData.name, (cDeref(pData.__cxx_anonymous_2.d, Float64Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_034fa3fe05a2bc76dc01, u32(2238), __cxx_literal_9a7d2973bd4ffb697928, pData.name, pData.min, pData.max, pData.desc));
    return i32(0);
    case u32(2):
    case u32(8): {
      ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_fc6d246229b35cee389d, u32(2242), __cxx_literal_75971243a5af9a9cdbee, pData.name, (cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_20603fc1ba8e4217c7a5, u32(2243), __cxx_literal_4f46942b4de238c5a704, pData.name, pData.min, i32((Boolean(u32((pData.flags & u32(8)))) ? 47 : 45)), pData.max, pData.desc));
    return i32(0);
    case u32(4): {
      ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_83f07f3086a417686170, u32(2246), __cxx_literal_9ea42a8be95fe9ce1295, pData.name, (cDeref(pData.__cxx_anonymous_2.u32, Uint32Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_e332aaed53662cd48645, u32(2247), __cxx_literal_4999400708ee62b0827c, pData.name, pData.min, pData.max, pData.desc));
    return i32(0);
    case u32(16): {
      ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_ad727c6404eefc8f70de, u32(2250), __cxx_literal_9a23d7dc35995e0ad661, pData.name, pData.__cxx_anonymous_2.string));
    }
    ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_c3feb1803c2cc66fbaf7, u32(2251), __cxx_literal_74e333b94ce9ba72cc78, pData.name, pData.desc));
    return i32(0);
    default: {
      __builtin_unreachable();
    }
  }
}

// C/C++ source: source/build/src/osd.cpp:2258
const __cxx_literal_45f5fe9c90c4f0753595 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_56dca669102ca3ce07cb = Uint8Array.from([67, 118, 97, 114, 32, 39, 37, 115, 39, 32, 105, 115, 32, 114, 101, 97, 100, 45, 111, 110, 108, 121, 46, 0]);
const __cxx_literal_4bb73787178007656591 = Uint8Array.from([37, 102, 0]);
const __cxx_literal_b700af412fbfcbe12446 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_38cb7fbf40cee4c75915 = Uint8Array.from([37, 115, 32, 37, 102, 0]);
const __cxx_literal_a23797d2254302f0160a = Uint8Array.from([37, 108, 102, 0]);
const __cxx_literal_93bee99ac0bb3cefec76 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_5e060154fe6df2f06c34 = Uint8Array.from([37, 115, 32, 37, 102, 0]);
const __cxx_literal_10a41f9a866c11fad853 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_9dbf3bc508a30218790d = Uint8Array.from([37, 115, 32, 37, 100, 0]);
const __cxx_literal_69b90e2de497d52f08a0 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_567a2f92317a9f42e442 = Uint8Array.from([37, 115, 32, 37, 100, 0]);
const __cxx_literal_50c85817a53987d24853 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_361213e66b1d5ff082d8 = Uint8Array.from([37, 115, 32, 37, 115, 0]);
export function osdcmd_cvar_set(parm) {
  let printValue = i32((cRecordObject(parm).numparms == 0));
  let cvaridx = i32(hash_findcase(__cxx_private_cell_a920b40f756adfb47f87522c(), cRecordObject(parm).name));
  (cvaridx >= 0);
  let pData = cRecordObject((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).cvars, cvaridx).value).pData);
  if (Boolean(u32((pData.flags & u32(64))))) {
    ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_45f5fe9c90c4f0753595, u32(2269), __cxx_literal_56dca669102ca3ce07cb, pData.name));
    return i32(0);
  }
  if (Boolean(printValue)) {
    return i32(osdfunc_printvar(cvaridx));
  }
  switch (u32((pData.flags & u32(63)))) {
    case u32(1): {
      sscanf((cPointerElementRef(cRecordObject(parm).parms, 0).value), __cxx_literal_4bb73787178007656591, pData.__cxx_anonymous_2.f);
      ((cDeref(pData.__cxx_anonymous_2.f, Float32Array).value) = Math.fround(clamp__header_8a7517c11404((cDeref(pData.__cxx_anonymous_2.f, Float32Array).value), pData.min, pData.max)));
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((__cxx_lvalue_0.value | u32(8192)))))(cObjectFieldRef(pData, "flags"));
      if ((!Boolean(OSD_ParsingScript()))) {
        ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_b700af412fbfcbe12446, u32(2285), __cxx_literal_38cb7fbf40cee4c75915, pData.name, (cDeref(pData.__cxx_anonymous_2.f, Float32Array).value)));
      }
    }
    break;
    case u32(32): {
      sscanf((cPointerElementRef(cRecordObject(parm).parms, 0).value), __cxx_literal_a23797d2254302f0160a, pData.__cxx_anonymous_2.d);
      ((cDeref(pData.__cxx_anonymous_2.d, Float64Array).value) = clamp__header_d02f8e4f541f((cDeref(pData.__cxx_anonymous_2.d, Float64Array).value), pData.min, pData.max));
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = u32((__cxx_lvalue_1.value | u32(8192)))))(cObjectFieldRef(pData, "flags"));
      if ((!Boolean(OSD_ParsingScript()))) {
        ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_93bee99ac0bb3cefec76, u32(2295), __cxx_literal_5e060154fe6df2f06c34, pData.name, (cDeref(pData.__cxx_anonymous_2.d, Float64Array).value)));
      }
    }
    break;
    case u32(2):
    case u32(8): {
      ((cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value) = i32(clamp__header_b0c3fa1a2e69(atoi_safe__header_164228c95589((cPointerElementRef(cRecordObject(parm).parms, 0).value)), pData.min, pData.max)));
      if ((u32((pData.flags & u32(63))) == u32(8))) {
        ((cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value) = i32(((cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value) != 0)));
      }
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = u32((__cxx_lvalue_2.value | u32(8192)))))(cObjectFieldRef(pData, "flags"));
      if ((!Boolean(OSD_ParsingScript()))) {
        ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_10a41f9a866c11fad853, u32(2309), __cxx_literal_9dbf3bc508a30218790d, pData.name, (cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value)));
      }
    }
    break;
    case u32(4): {
      ((cDeref(pData.__cxx_anonymous_2.u32, Uint32Array).value) = u32(clamp__header_a39de2443867(strtoul((cPointerElementRef(cRecordObject(parm).parms, 0).value), null, 0), pData.min, pData.max)));
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = u32((__cxx_lvalue_3.value | u32(8192)))))(cObjectFieldRef(pData, "flags"));
      if ((!Boolean(OSD_ParsingScript()))) {
        ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_69b90e2de497d52f08a0, u32(2318), __cxx_literal_567a2f92317a9f42e442, pData.name, (cDeref(pData.__cxx_anonymous_2.u32, Uint32Array).value)));
      }
    }
    break;
    case u32(16): {
      cByteMemory.strncpy(pData.__cxx_anonymous_2.string, (cPointerElementRef(cRecordObject(parm).parms, 0).value), u64(i32((pData.max - 1))));
      ((cDeref(cPointerOffset(pData.__cxx_anonymous_2.string, i32((pData.max - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((0) & 255)) & 255));
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = u32((__cxx_lvalue_4.value | u32(8192)))))(cObjectFieldRef(pData, "flags"));
      if ((!Boolean(OSD_ParsingScript()))) {
        ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_50c85817a53987d24853, u32(2328), __cxx_literal_361213e66b1d5ff082d8, pData.name, pData.__cxx_anonymous_2.string));
      }
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(0);
}

export function clamp__header_b0c3fa1a2e69(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function clamp__header_8a7517c11404(__cxx_in, min, max) {
  return Math.fround(((__cxx_in <= Math.fround(Math.fround(min))) ? Math.fround(Math.fround(min)) : ((__cxx_in >= Math.fround(Math.fround(max))) ? Math.fround(Math.fround(max)) : __cxx_in)));
}

export function clamp__header_d02f8e4f541f(__cxx_in, min, max) {
  return ((__cxx_in <= min) ? min : ((__cxx_in >= max) ? max : __cxx_in));
}

// C/C++ source: source/build/include/compat.h:698
export function atoi_safe__header_164228c95589(str) {
  return i32(strtol(str, null, 10));
}

export function clamp__header_a39de2443867(__cxx_in, min, max) {
  return u64(((__cxx_in <= u64(min)) ? u64(min) : ((__cxx_in >= u64(max)) ? u64(max) : __cxx_in)));
}
