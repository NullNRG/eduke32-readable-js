// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/driver_sdl.cpp
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
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_b4b45616277c041d = i32(3754936);
function __cxx_static_address_b6b2a6d732343ad767db21ed() {
  return __cxx_static_address_b6b2a6d732343ad767db21ed.reference || (__cxx_static_address_b6b2a6d732343ad767db21ed.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_b4b45616277c041d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_3cc64a7ff0f35ab9 = i32(1144);
function __cxx_static_address_03a2aa1cf5716c08ddf24c17() {
  return __cxx_static_address_03a2aa1cf5716c08ddf24c17.reference || (__cxx_static_address_03a2aa1cf5716c08ddf24c17.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_3cc64a7ff0f35ab9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:48
export let ErrorCode = i32(0);
function __cxx_static_address_4e10fca139a660d96c03b03e() {
  return __cxx_static_address_4e10fca139a660d96c03b03e.reference || (__cxx_static_address_4e10fca139a660d96c03b03e.reference = {
    __cReference: true,
    get value() { return ErrorCode; },
    set value(__cxx_lvalue_0) { ErrorCode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:49
export let Initialised = 0;
function __cxx_static_address_d26576fa8524c6c79cbeaa7d() {
  return __cxx_static_address_d26576fa8524c6c79cbeaa7d.reference || (__cxx_static_address_d26576fa8524c6c79cbeaa7d.reference = {
    __cReference: true,
    get value() { return Initialised; },
    set value(__cxx_lvalue_0) { Initialised = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:50
export let Playing = 0;
function __cxx_static_address_de23822b54574a502b424c11() {
  return __cxx_static_address_de23822b54574a502b424c11.reference || (__cxx_static_address_de23822b54574a502b424c11.reference = {
    __cReference: true,
    get value() { return Playing; },
    set value(__cxx_lvalue_0) { Playing = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:51
export let StartedSDL = 0;
function __cxx_static_address_0d5ac10431696644e4bd1941() {
  return __cxx_static_address_0d5ac10431696644e4bd1941.reference || (__cxx_static_address_0d5ac10431696644e4bd1941.reference = {
    __cReference: true,
    get value() { return StartedSDL; },
    set value(__cxx_lvalue_0) { StartedSDL = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:53
export let MixBuffer = null;
function __cxx_static_address_28a0ba3ac2020d6ea74924a5() {
  return __cxx_static_address_28a0ba3ac2020d6ea74924a5.reference || (__cxx_static_address_28a0ba3ac2020d6ea74924a5.reference = {
    __cReference: true,
    get value() { return MixBuffer; },
    set value(__cxx_lvalue_0) { MixBuffer = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:54
export let MixBufferSize = 0;
function __cxx_static_address_eceb4e6b3446ba0b749a85b7() {
  return __cxx_static_address_eceb4e6b3446ba0b749a85b7.reference || (__cxx_static_address_eceb4e6b3446ba0b749a85b7.reference = {
    __cReference: true,
    get value() { return MixBufferSize; },
    set value(__cxx_lvalue_0) { MixBufferSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:55
export let MixBufferCount = 0;
function __cxx_static_address_6ee334f7021972e8a19eb1da() {
  return __cxx_static_address_6ee334f7021972e8a19eb1da.reference || (__cxx_static_address_6ee334f7021972e8a19eb1da.reference = {
    __cReference: true,
    get value() { return MixBufferCount; },
    set value(__cxx_lvalue_0) { MixBufferCount = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:56
export let MixBufferCurrent = 0;
function __cxx_static_address_f7f2215c6ed91d9c8aeb134b() {
  return __cxx_static_address_f7f2215c6ed91d9c8aeb134b.reference || (__cxx_static_address_f7f2215c6ed91d9c8aeb134b.reference = {
    __cReference: true,
    get value() { return MixBufferCurrent; },
    set value(__cxx_lvalue_0) { MixBufferCurrent = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:57
export let MixBufferUsed = 0;
function __cxx_static_address_b9c8be93bbdfade02f486763() {
  return __cxx_static_address_b9c8be93bbdfade02f486763.reference || (__cxx_static_address_b9c8be93bbdfade02f486763.reference = {
    __cReference: true,
    get value() { return MixBufferUsed; },
    set value(__cxx_lvalue_0) { MixBufferUsed = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_496143ad499d05cf = i32(2147483647);
function __cxx_static_address_93f8a14d47522fcf91b4d0b0() {
  return __cxx_static_address_93f8a14d47522fcf91b4d0b0.reference || (__cxx_static_address_93f8a14d47522fcf91b4d0b0.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_496143ad499d05cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_dd257cb4c45d7bce = i32(2147483648);
function __cxx_static_address_ebca5d709da9e71ab92ca9e3() {
  return __cxx_static_address_ebca5d709da9e71ab92ca9e3.reference || (__cxx_static_address_ebca5d709da9e71ab92ca9e3.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_dd257cb4c45d7bce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_a85a250159e65285 = i32(2147483648);
function __cxx_static_address_0da8e85059940e8826edcd22() {
  return __cxx_static_address_0da8e85059940e8826edcd22.reference || (__cxx_static_address_0da8e85059940e8826edcd22.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_a85a250159e65285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_3b61fd9c8c7217e0 = i32(65536);
function __cxx_static_address_bc4629ce9f3edc78f4f14764() {
  return __cxx_static_address_bc4629ce9f3edc78f4f14764.reference || (__cxx_static_address_bc4629ce9f3edc78f4f14764.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_3b61fd9c8c7217e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_388b330a85db7e7c = i32(32768);
function __cxx_static_address_43a646e1413aef0a1196c200() {
  return __cxx_static_address_43a646e1413aef0a1196c200.reference || (__cxx_static_address_43a646e1413aef0a1196c200.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_388b330a85db7e7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_9ec4a2e713b61f81 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_7e681093a86459cbb572dfb8() {
  return __cxx_static_address_7e681093a86459cbb572dfb8.reference || (__cxx_static_address_7e681093a86459cbb572dfb8.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_9ec4a2e713b61f81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:58
export let MixCallBack = null;
function __cxx_static_address_d6eb2a046864ef2337cb59d0() {
  return __cxx_static_address_d6eb2a046864ef2337cb59d0.reference || (__cxx_static_address_d6eb2a046864ef2337cb59d0.reference = {
    __cReference: true,
    get value() { return MixCallBack; },
    set value(__cxx_lvalue_0) { MixCallBack = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:61
export let audio_dev = 0;
function __cxx_static_address_f5689a80fcb78b9a6eb90878() {
  return __cxx_static_address_f5689a80fcb78b9a6eb90878.reference || (__cxx_static_address_f5689a80fcb78b9a6eb90878.reference = {
    __cReference: true,
    get value() { return audio_dev; },
    set value(__cxx_lvalue_0) { audio_dev = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:65
export let SDLAudioDriverName = new Uint8Array(16);
function __cxx_static_address_55050d12cbb23e291e0ca250() {
  return __cxx_static_address_55050d12cbb23e291e0ca250.reference || (__cxx_static_address_55050d12cbb23e291e0ca250.reference = {
    __cReference: true,
    get value() { return SDLAudioDriverName; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:66
export let SDLAudioDriverNameEnv = null;
export function __cxx_global_cell_a670d3b256a086046689daea() {
  return __cxx_global_cell_a670d3b256a086046689daea.reference || (__cxx_global_cell_a670d3b256a086046689daea.reference = {
    __cReference: true,
    get value() { return SDLAudioDriverNameEnv; },
    set value(__cxx_lvalue_0) { SDLAudioDriverNameEnv = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:69
export function fillData(userdata, ptr, remaining) {
  (userdata = userdata);
  if (((!MixBuffer) || (!MixCallBack))) {
    return;
  }
  while ((remaining > 0)) {
    if ((MixBufferUsed == MixBufferSize)) {
      MixCallBack();
      (MixBufferUsed = i32(0));
      if ((((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(__cxx_static_address_f7f2215c6ed91d9c8aeb134b()) >= MixBufferCount)) {
        (MixBufferCurrent = i32((Number(MixBufferCurrent) - Number(MixBufferCount))));
      }
    }
    while (((remaining > 0) && (MixBufferUsed < MixBufferSize))) {
      let sptr = cPointerOffset(cPointerOffset(MixBuffer, i32(Math.imul(MixBufferCurrent, MixBufferSize)), Uint8Array.BYTES_PER_ELEMENT), MixBufferUsed, Uint8Array.BYTES_PER_ELEMENT);
      let len = i32((MixBufferSize - MixBufferUsed));
      if ((remaining < len)) {
        (len = i32(remaining));
      }
      cByteMemory.memcpy(ptr, sptr, u64(len));
      (ptr = cPointerOffset(ptr, len, Uint8Array.BYTES_PER_ELEMENT));
      (MixBufferUsed = i32((Number(MixBufferUsed) + Number(len))));
      (remaining = i32((Number(remaining) - Number(len))));
    }
  }
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:104
export function SDLDrv_GetError() {
  return i32(ErrorCode);
}

// C/C++ source: source/audiolib/src/driver_sdl.cpp:106
const __cxx_literal_1c61ac225232b8cd9dc0 = Uint8Array.from([83, 68, 76, 32, 65, 117, 100, 105, 111, 32, 111, 107, 46, 0]);
const __cxx_literal_2449b0566ada58e0b24c = Uint8Array.from([83, 68, 76, 32, 65, 117, 100, 105, 111, 32, 117, 110, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 100, 46, 0]);
const __cxx_literal_82bb389de2d7fc171280 = Uint8Array.from([83, 68, 76, 32, 65, 117, 100, 105, 111, 58, 32, 101, 114, 114, 111, 114, 32, 105, 110, 32, 73, 110, 105, 116, 32, 111, 114, 32, 73, 110, 105, 116, 83, 117, 98, 83, 121, 115, 116, 101, 109, 46, 0]);
const __cxx_literal_2881b25bb644d4b9fd51 = Uint8Array.from([83, 68, 76, 32, 65, 117, 100, 105, 111, 58, 32, 101, 114, 114, 111, 114, 32, 105, 110, 32, 79, 112, 101, 110, 65, 117, 100, 105, 111, 46, 0]);
const __cxx_literal_bb308be6555ffc07c93e = Uint8Array.from([85, 110, 107, 110, 111, 119, 110, 32, 83, 68, 76, 32, 65, 117, 100, 105, 111, 32, 101, 114, 114, 111, 114, 32, 99, 111, 100, 101, 46, 0]);
export function SDLDrv_ErrorString(ErrorNumber) {
  switch (ErrorNumber) {
    case i32(-1): {
      return SDLDrv_ErrorString(ErrorCode);
    }
    case i32(0): {
      return __cxx_literal_1c61ac225232b8cd9dc0;
    }
    case i32(1): {
      return __cxx_literal_2449b0566ada58e0b24c;
    }
    case i32(2): {
      return __cxx_literal_82bb389de2d7fc171280;
    }
    case i32(3): {
      return __cxx_literal_2881b25bb644d4b9fd51;
    }
    default: {
      return __cxx_literal_bb308be6555ffc07c93e;
    }
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_1d970ce13390ada2 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_9ccf54f3813cd4413ecfc0ad() {
  return __cxx_static_address_9ccf54f3813cd4413ecfc0ad.reference || (__cxx_static_address_9ccf54f3813cd4413ecfc0ad.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_1d970ce13390ada2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return (allocator).value.Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return (allocator).value.Alloc(bytesCount, alignment);
}
