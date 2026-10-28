// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/klzw.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
// Bounded source-language pointer aliases over native JS typed buffers/arrays.
// Embedded in generated ES modules; never a CPU, ISA or opcode interpreter.
const cPointer = source => {
  if (source?.__cDeferredPointer === true) return cPointer(source.resolve());
  if (source && source.__cPointer === true) return source;
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
    if (index!==0) throw new RangeError('C single-object pointer escapes original storage');
    return source;
  }
  const pointer=cPointer(source);
  if (!pointer.array) {
    const allocation=globalThis[Symbol.for('source-first.pointer-array-allocations/1')]?.get(pointer.buffer);
    const offset=pointer.offset+index*8;
    if(!allocation)throw new TypeError('C aggregate/pointer slot requires a proven source array');
    if(!Number.isSafeInteger(offset)||offset%8||offset<pointer.lower||offset+8>pointer.upper||
        offset<allocation.lower||offset+8>allocation.upper)throw new RangeError('Pointer slot escapes original LP64 allocation');
    return {get value(){return allocation.read(offset);},set value(value){allocation.write(offset,value);}};
  }
  const stride=pointer.stride || 1;
  const offset=pointer.offset+index*stride;
  if (!Number.isSafeInteger(offset) || offset<pointer.lower || offset>=pointer.upper || offset%stride)
    throw new RangeError('C aggregate/pointer array index escapes original bounds');
  const slot=offset/stride;
  return {get value(){return pointer.buffer[slot];},set value(next){pointer.buffer[slot]=next;}};
};
const cTypedPointer = (source, Type) => {
  if (!Type || !Number.isSafeInteger(Type.BYTES_PER_ELEMENT)) throw new TypeError('Unsupported pointer element type');
  if (source===null) return null;
  const pointerBytes=source?.[Symbol.for('source-first.clang-byte-record-array/1')];
  if(pointerBytes)return cPointer(pointerBytes);
  if (Array.isArray(source)) return { ...cPointer(source), upper:source.length*Type.BYTES_PER_ELEMENT, stride:Type.BYTES_PER_ELEMENT };
  return cPointer(source);
};
const cPointerOffset = (source, delta, stride=1) => {
  const initial=cPointer(source);
  const p=Array.isArray(source) ? {...initial, upper:source.length*stride, stride} : initial;
  if (p.array && p.stride!==stride) throw new TypeError('Cannot reinterpret JS numeric-array element widths');
  const change=Number(delta)*stride, next=p.offset+change;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || next<p.lower || next>p.upper)
    throw new RangeError('C pointer escapes original array bounds');
  return { ...p, offset:next };
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
const cPointerCompare = (left,right,op) => {
  if (left?.__cDeferredReference===true) left=left.resolve();
  if (right?.__cDeferredReference===true) right=right.resolve();
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
  if (left?.__cReference===true || right?.__cReference===true) {
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
  const a=Array.isArray(left) ? {...cPointer(left),upper:left.length*stride,stride} : cPointer(left);
  const b=Array.isArray(right) ? {...cPointer(right),upper:right.length*stride,stride} : cPointer(right);
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
  if (source?.__cPointer === true) {
    if (!source.array) throw new TypeError("C record pointer requires source-backed object slots");
    return cPointerElementRef(source,0).value;
  }
  return source;
};
const cStaticReference = resolve => ({ __cReference:true, __cDeferredReference:true, resolve, get value() { return resolve().value; }, set value(value) { resolve().value=value; } });
const cObjectFieldRef = (owner, field) => { const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); };
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
    if (source?.__cReference===true) return extent(source.value,amount);
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
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_017c8a67791fde92 = i32(3754936);
function __cxx_static_address_4cfeb7c27a2b8118d6963c63() {
  return __cxx_static_address_4cfeb7c27a2b8118d6963c63.reference || (__cxx_static_address_4cfeb7c27a2b8118d6963c63.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_017c8a67791fde92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_c42a2d232b990588 = i32(1144);
function __cxx_static_address_d4c0438b1653ce8671f39115() {
  return __cxx_static_address_d4c0438b1653ce8671f39115.reference || (__cxx_static_address_d4c0438b1653ce8671f39115.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_c42a2d232b990588; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_d44466bb5bd442ed = i32(2147483647);
function __cxx_static_address_3d46ca57c1c9f436764be136() {
  return __cxx_static_address_3d46ca57c1c9f436764be136.reference || (__cxx_static_address_3d46ca57c1c9f436764be136.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_d44466bb5bd442ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_ce064282b864adc2 = i32(2147483648);
function __cxx_static_address_cc75018fe1bdd68e9f780d5c() {
  return __cxx_static_address_cc75018fe1bdd68e9f780d5c.reference || (__cxx_static_address_cc75018fe1bdd68e9f780d5c.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_ce064282b864adc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_ba70bb59a7c36222 = i32(2147483648);
function __cxx_static_address_f1f0a8104f5a6525e4e0a49a() {
  return __cxx_static_address_f1f0a8104f5a6525e4e0a49a.reference || (__cxx_static_address_f1f0a8104f5a6525e4e0a49a.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_ba70bb59a7c36222; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_cd7357b8718822f2 = i32(65536);
function __cxx_static_address_5430c7f1028e8b5a84215845() {
  return __cxx_static_address_5430c7f1028e8b5a84215845.reference || (__cxx_static_address_5430c7f1028e8b5a84215845.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_cd7357b8718822f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_5bc50831f2cd575c = i32(32768);
function __cxx_static_address_30538109b049e0b05da793dd() {
  return __cxx_static_address_30538109b049e0b05da793dd.reference || (__cxx_static_address_30538109b049e0b05da793dd.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_5bc50831f2cd575c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_3e1d5a7d3a84c481 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_b013c004d8ef9679975646dc() {
  return __cxx_static_address_b013c004d8ef9679975646dc.reference || (__cxx_static_address_b013c004d8ef9679975646dc.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_3e1d5a7d3a84c481; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/klzw.cpp:18
export let lzwtmpbuf = new Uint8Array(17408);
function __cxx_static_address_49b3f192d21dda534c1916ab() {
  return __cxx_static_address_49b3f192d21dda534c1916ab.reference || (__cxx_static_address_49b3f192d21dda534c1916ab.reference = {
    __cReference: true,
    get value() { return lzwtmpbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let lzwrawbuf = new Uint8Array(17408);
function __cxx_static_address_f5f4fe6ec9828b1ce098b990() {
  return __cxx_static_address_f5f4fe6ec9828b1ce098b990.reference || (__cxx_static_address_f5f4fe6ec9828b1ce098b990.reference = {
    __cReference: true,
    get value() { return lzwrawbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let lzwcompbuf = new Uint8Array(17408);
function __cxx_static_address_44ae2e7bf4d886e9a5e282e8() {
  return __cxx_static_address_44ae2e7bf4d886e9a5e282e8.reference || (__cxx_static_address_44ae2e7bf4d886e9a5e282e8.reference = {
    __cReference: true,
    get value() { return lzwcompbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/klzw.cpp:19
export let lzwbuf2 = new Int16Array(17408);
function __cxx_static_address_d7bf00bc5f04be6b3fcefbee() {
  return __cxx_static_address_d7bf00bc5f04be6b3fcefbee.reference || (__cxx_static_address_d7bf00bc5f04be6b3fcefbee.reference = {
    __cReference: true,
    get value() { return lzwbuf2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let lzwbuf3 = new Int16Array(17408);
function __cxx_static_address_831cd5fa64259e75128b33fd() {
  return __cxx_static_address_831cd5fa64259e75128b33fd.reference || (__cxx_static_address_831cd5fa64259e75128b33fd.reference = {
    __cReference: true,
    get value() { return lzwbuf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/klzw.cpp:24
export function lzwcompress(lzwinbuf, uncompleng, lzwoutbuf) {
  let i;
  let addr;
  let addrcnt;
  let intptr;
  let bytecnt1;
  let bitcnt;
  let numbits;
  let oneupnumbits;
  let shortptr;
  let lzwcodehead = lzwbuf2;
  let lzwcodenext = lzwbuf3;
  for ((i = i32(255)); (i >= 4); (i = i32((Number(i) - Number(4))))) {
    (((cDeref(cPointerOffset(lzwtmpbuf, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((i) & 255)) & 255)), ((cDeref(cPointerOffset(lzwcodenext, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i32((i + 1)) & 255))) << 16) >> 16)) << 16) >> 16)));
    (((cDeref(cPointerOffset(lzwtmpbuf, i32((i - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((i32((i - 1))) & 255)) & 255)), ((cDeref(cPointerOffset(lzwcodenext, i32((i - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i & 255))) << 16) >> 16)) << 16) >> 16)));
    (((cDeref(cPointerOffset(lzwtmpbuf, i32((i - 2)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((i32((i - 2))) & 255)) & 255)), ((cDeref(cPointerOffset(lzwcodenext, i32((i - 2)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i32((i - 1)) & 255))) << 16) >> 16)) << 16) >> 16)));
    (((cDeref(cPointerOffset(lzwtmpbuf, i32((i - 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((i32((i - 3))) & 255)) & 255)), ((cDeref(cPointerOffset(lzwcodenext, i32((i - 3)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i32((i - 2)) & 255))) << 16) >> 16)) << 16) >> 16)));
    ((cDeref(cPointerOffset(lzwcodehead, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((cDeref(cPointerOffset(lzwcodehead, i32((i - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((cDeref(cPointerOffset(lzwcodehead, i32((i - 2)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((cDeref(cPointerOffset(lzwcodehead, i32((i - 3)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16))) << 16) >> 16))) << 16) >> 16))) << 16) >> 16));
  }
  for (; (i >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((cDeref(cPointerOffset(lzwtmpbuf, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((i) & 255)) & 255));
    ((cDeref(cPointerOffset(lzwcodenext, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i32((i + 1)) & 255))) << 16) >> 16)) << 16) >> 16));
    ((cDeref(cPointerOffset(lzwcodehead, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  }
  cByteMemory.memset(lzwoutbuf, 0, u64(i32((i32((4 + uncompleng)) + 1))));
  (addrcnt = i32(256));
  (bytecnt1 = i32(0));
  (bitcnt = i32((4 << 3)));
  (numbits = i32(8));
  (oneupnumbits = i32((1 << 8)));
  do {
    (addr = i32((cDeref(cPointerOffset(lzwinbuf, bytecnt1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
    do {
      let newaddr;
      if ((((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => bytecnt1, __cxx_lvalue_3 => { bytecnt1 = __cxx_lvalue_3; })) == uncompleng)) {
        break;
      }
      if ((i32((cDeref(cPointerOffset(lzwcodehead, addr, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) < 0)) {
        ((cDeref(cPointerOffset(lzwcodehead, addr, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((addrcnt) << 16) >> 16)) << 16) >> 16));
        break;
      }
      (newaddr = i32((cDeref(cPointerOffset(lzwcodehead, addr, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      while ((i32((cDeref(cPointerOffset(lzwtmpbuf, newaddr, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32((cDeref(cPointerOffset(lzwinbuf, bytecnt1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) {
        if ((i32((cDeref(cPointerOffset(lzwcodenext, newaddr, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) < 0)) {
          ((cDeref(cPointerOffset(lzwcodenext, newaddr, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((addrcnt) << 16) >> 16)) << 16) >> 16));
          break;
        }
        (newaddr = i32((cDeref(cPointerOffset(lzwcodenext, newaddr, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      }
      if ((i32((cDeref(cPointerOffset(lzwcodenext, newaddr, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) == addrcnt)) {
        break;
      }
      (addr = i32(newaddr));
    } while ((addr >= 0));
    ((cDeref(cPointerOffset(lzwtmpbuf, addrcnt, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwinbuf, bytecnt1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(lzwcodehead, addrcnt, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
    ((cDeref(cPointerOffset(lzwcodenext, addrcnt, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
    (intptr = cTypedPointer(cPointerOffset(lzwoutbuf, i32((bitcnt >> 3)), Uint8Array.BYTES_PER_ELEMENT), Int32Array));
    ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = i32((__cxx_lvalue_4.value | B_PASS32__header_fa98f093cec1(i32((addr << i32((bitcnt & 7)))))))))(cDeref(cPointerOffset(intptr, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array));
    (bitcnt = i32((Number(bitcnt) + Number(numbits))));
    if ((i32((addr & i32((i32((oneupnumbits >> 1)) - 1)))) > i32((i32((addrcnt - 1)) & i32((i32((oneupnumbits >> 1)) - 1)))))) {
      ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous - 1)); __cxx_lvalue_5.value = next; return previous; })(cRef(() => bitcnt, __cxx_lvalue_6 => { bitcnt = __cxx_lvalue_6; }));
    }
    ((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = i32((previous + 1)); __cxx_lvalue_7.value = next; return previous; })(cRef(() => addrcnt, __cxx_lvalue_8 => { addrcnt = __cxx_lvalue_8; }));
    if ((addrcnt > oneupnumbits)) {
      ((__cxx_lvalue_9) => { const previous = __cxx_lvalue_9.value; const next = i32((previous + 1)); __cxx_lvalue_9.value = next; return previous; })(cRef(() => numbits, __cxx_lvalue_10 => { numbits = __cxx_lvalue_10; }));
      (oneupnumbits = i32((oneupnumbits << 1)));
    }
  } while (((bytecnt1 < uncompleng) && (bitcnt < i32((uncompleng << 3)))));
  (intptr = cTypedPointer(cPointerOffset(lzwoutbuf, i32((bitcnt >> 3)), Uint8Array.BYTES_PER_ELEMENT), Int32Array));
  ((__cxx_lvalue_11) => (__cxx_lvalue_11.value = i32((__cxx_lvalue_11.value | B_PASS32__header_fa98f093cec1(i32((addr << i32((bitcnt & 7)))))))))(cDeref(cPointerOffset(intptr, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array));
  (bitcnt = i32((Number(bitcnt) + Number(numbits))));
  if ((i32((addr & i32((i32((oneupnumbits >> 1)) - 1)))) > i32((i32((addrcnt - 1)) & i32((i32((oneupnumbits >> 1)) - 1)))))) {
    ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous - 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => bitcnt, __cxx_lvalue_13 => { bitcnt = __cxx_lvalue_13; }));
  }
  (shortptr = cTypedPointer(lzwoutbuf, Int16Array));
  ((cDeref(cPointerOffset(shortptr, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((B_PASS16__header_e726848e184c(((((((uncompleng) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
  if ((i32((i32((bitcnt + 7)) >> 3)) < uncompleng)) {
    ((cDeref(cPointerOffset(shortptr, 1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((B_PASS16__header_e726848e184c(((((((addrcnt) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
    return i32((i32((bitcnt + 7)) >> 3));
  }
  ((cDeref(cPointerOffset(shortptr, 1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((0) << 16) >> 16)) << 16) >> 16));
  for ((i = i32(0)); (i < i32((uncompleng - 4))); (i = i32((Number(i) + Number(4))))) {
    ((cDeref(cPointerOffset(lzwoutbuf, i32((i + 4)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwinbuf, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(lzwoutbuf, i32((i + 5)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwinbuf, i32((i + 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(lzwoutbuf, i32((i + 6)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwinbuf, i32((i + 2)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(lzwoutbuf, i32((i + 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwinbuf, i32((i + 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
  }
  for (; (i < uncompleng); ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous + 1)); __cxx_lvalue_14.value = next; return previous; })(cRef(() => i, __cxx_lvalue_15 => { i = __cxx_lvalue_15; }))) {
    ((cDeref(cPointerOffset(lzwoutbuf, i32((i + 4)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwinbuf, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
  }
  return i32((uncompleng + 4));
}

// C/C++ source: source/build/src/klzw.cpp:135
export function lzwuncompress(lzwinbuf, compleng, lzwoutbuf) {
  let currstr;
  let numbits;
  let oneupnumbits;
  let i;
  let bitcnt;
  let outbytecnt;
  let shortptr = cTypedPointer(lzwinbuf, Int16Array);
  let strtot = i32(B_PASS16__header_e726848e184c((cDeref(cPointerOffset(shortptr, 1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
  let uncompleng = i32(B_PASS16__header_e726848e184c((cDeref(cPointerOffset(shortptr, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
  if ((strtot == 0)) {
    if ((cPointerCompare(lzwoutbuf, lzwrawbuf, "==") && cPointerCompare(lzwinbuf, lzwcompbuf, "=="))) {
      (u64(u32((u32(i32((i32((compleng - 4)) + 3))) + 0))) < 17408);
      (u64(u32((u32(i32((i32((compleng - 4)) + 3))) + 0))) < (BigInt(17408) - BigInt(u64(4))));
    }
    cByteMemory.memcpy(lzwoutbuf, cPointerOffset(lzwinbuf, 4, Uint8Array.BYTES_PER_ELEMENT), u64(i32((i32((compleng - 4)) + 3))));
    return i32(uncompleng);
  }
  for ((i = i32(255)); (i >= 4); (i = i32((Number(i) - Number(4))))) {
    ((cDeref(cPointerOffset(lzwbuf2, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((cDeref(cPointerOffset(lzwbuf3, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
    ((cDeref(cPointerOffset(lzwbuf2, i32((i - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((cDeref(cPointerOffset(lzwbuf3, i32((i - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i - 1))) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
    ((cDeref(cPointerOffset(lzwbuf2, i32((i - 2)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((cDeref(cPointerOffset(lzwbuf3, i32((i - 2)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i - 2))) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
    ((cDeref(cPointerOffset(lzwbuf2, i32((i - 3)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((cDeref(cPointerOffset(lzwbuf3, i32((i - 3)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i - 3))) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
  }
  ((cDeref(cPointerOffset(lzwbuf2, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((cDeref(cPointerOffset(lzwbuf3, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
  ((cDeref(cPointerOffset(lzwbuf2, i32((i - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((cDeref(cPointerOffset(lzwbuf3, i32((i - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i - 1))) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
  ((cDeref(cPointerOffset(lzwbuf2, i32((i - 2)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((cDeref(cPointerOffset(lzwbuf3, i32((i - 2)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i - 2))) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
  (currstr = i32(256));
  (bitcnt = i32((4 << 3)));
  (outbytecnt = i32(0));
  (numbits = i32(8));
  (oneupnumbits = i32((1 << 8)));
  do {
    let intptr = cTypedPointer(cPointerOffset(lzwinbuf, i32((bitcnt >> 3)), Uint8Array.BYTES_PER_ELEMENT), Int32Array);
    let dat = i32((i32((B_PASS32__header_fa98f093cec1((cDeref(cPointerOffset(intptr, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) >> i32((bitcnt & 7)))) & i32((oneupnumbits - 1))));
    let leng;
    (bitcnt = i32((Number(bitcnt) + Number(numbits))));
    if ((i32((dat & i32((i32((oneupnumbits >> 1)) - 1)))) > i32((i32((currstr - 1)) & i32((i32((oneupnumbits >> 1)) - 1)))))) {
      (dat = i32((dat & i32((i32((oneupnumbits >> 1)) - 1)))));
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => bitcnt, __cxx_lvalue_1 => { bitcnt = __cxx_lvalue_1; }));
    }
    ((cDeref(cPointerOffset(lzwbuf3, currstr, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((dat) << 16) >> 16)) << 16) >> 16));
    for ((leng = i32(0)); (dat >= 256); (((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => leng, __cxx_lvalue_3 => { leng = __cxx_lvalue_3; })), (dat = i32((cDeref(cPointerOffset(lzwbuf3, dat, Int16Array.BYTES_PER_ELEMENT), Int16Array).value))))) {
      ((cDeref(cPointerOffset(lzwtmpbuf, leng, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((((cDeref(cPointerOffset(lzwbuf2, dat, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) & 255)) & 255));
    }
    ((cDeref(cPointerOffset(lzwoutbuf, ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => outbytecnt, __cxx_lvalue_5 => { outbytecnt = __cxx_lvalue_5; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((dat) & 255)) & 255));
    for ((i = i32((leng - 1))); (i >= 4); ((i = i32((Number(i) - Number(4)))), (outbytecnt = i32((Number(outbytecnt) + Number(4)))))) {
      ((cDeref(cPointerOffset(lzwoutbuf, outbytecnt, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwtmpbuf, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      ((cDeref(cPointerOffset(lzwoutbuf, i32((outbytecnt + 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwtmpbuf, i32((i - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      ((cDeref(cPointerOffset(lzwoutbuf, i32((outbytecnt + 2)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwtmpbuf, i32((i - 2)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      ((cDeref(cPointerOffset(lzwoutbuf, i32((outbytecnt + 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwtmpbuf, i32((i - 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    for (; (i >= 0); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous - 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
      ((cDeref(cPointerOffset(lzwoutbuf, ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => outbytecnt, __cxx_lvalue_9 => { outbytecnt = __cxx_lvalue_9; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(lzwtmpbuf, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    ((cDeref(cPointerOffset(lzwbuf2, i32((currstr - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((dat) << 16) >> 16)) << 16) >> 16));
    ((cDeref(cPointerOffset(lzwbuf2, currstr, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((dat) << 16) >> 16)) << 16) >> 16));
    ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => currstr, __cxx_lvalue_11 => { currstr = __cxx_lvalue_11; }));
    if ((currstr > oneupnumbits)) {
      ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => numbits, __cxx_lvalue_13 => { numbits = __cxx_lvalue_13; }));
      (oneupnumbits = i32((oneupnumbits << 1)));
    }
  } while ((currstr < strtot));
  return i32(uncompleng);
}

// C/C++ source: source/build/src/klzw.cpp:219
export function decompress_part(x) {
  let f = i64(cRecordObject(x).f);
  let readfunc = cRecordObject(x).readfunc;
  let leng;
  if ((u64(readfunc(f, cRef(() => leng, __cxx_lvalue_0 => { leng = __cxx_lvalue_0; }), i32(2))) != 2)) {
    return i32(1);
  }
  (leng = (((B_PASS16__header_e726848e184c(leng)) << 16) >> 16));
  if ((readfunc(f, lzwcompbuf, i32(leng)) != i32(leng))) {
    return i32(1);
  }
  (cRecordObject(x).kgoal = i32(lzwuncompress(lzwcompbuf, i32(leng), lzwrawbuf)));
  return i32(0);
}

// C/C++ source: source/build/src/klzw.cpp:299
export function compress_part(x) {
  let leng = (((((((((lzwcompress(lzwrawbuf, cRecordObject(x).k, lzwcompbuf)) << 16) >> 16)) << 16) >> 16)) << 16) >> 16);
  let swleng = (((B_PASS16__header_e726848e184c(leng)) << 16) >> 16);
  let f = i64(cRecordObject(x).f);
  let writefunc = cRecordObject(x).writefunc;
  (cRecordObject(x).k = i32(0));
  writefunc(f, cRef(() => swleng, __cxx_lvalue_0 => { swleng = __cxx_lvalue_0; }), i32(2));
  writefunc(f, lzwcompbuf, i32(leng));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_cdab5cd527e35c15 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_b55f77c7a38528b553035386() {
  return __cxx_static_address_b55f77c7a38528b553035386.reference || (__cxx_static_address_b55f77c7a38528b553035386.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_cdab5cd527e35c15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function B_PASS32__header_fa98f093cec1(x) {
  return i32(x);
}

export function B_PASS16__header_e726848e184c(x) {
  return (((x) << 16) >> 16);
}
