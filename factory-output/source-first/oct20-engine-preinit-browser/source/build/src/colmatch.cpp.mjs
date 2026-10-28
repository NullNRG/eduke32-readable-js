// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/colmatch.cpp
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
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_7a783a0809b0f9da = i32(3754936);
function __cxx_static_address_819f0e7a878ee2dd8983e959() {
  return __cxx_static_address_819f0e7a878ee2dd8983e959.reference || (__cxx_static_address_819f0e7a878ee2dd8983e959.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_7a783a0809b0f9da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_a0e046b65c1e77fc = i32(1144);
function __cxx_static_address_1dade1594972f67a5806a038() {
  return __cxx_static_address_1dade1594972f67a5806a038.reference || (__cxx_static_address_1dade1594972f67a5806a038.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_a0e046b65c1e77fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:7
export let rdist = new Int32Array(513);
function __cxx_static_address_071855e9da18d155bfcdc5c5() {
  return __cxx_static_address_071855e9da18d155bfcdc5c5.reference || (__cxx_static_address_071855e9da18d155bfcdc5c5.reference = {
    __cReference: true,
    get value() { return rdist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let gdist = new Int32Array(513);
function __cxx_static_address_c510b9028cc8f8761a0f34e2() {
  return __cxx_static_address_c510b9028cc8f8761a0f34e2.reference || (__cxx_static_address_c510b9028cc8f8761a0f34e2.reference = {
    __cReference: true,
    get value() { return gdist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_62b3785c46a64c6c = i32(2147483647);
function __cxx_static_address_b90ab707a4143df4fe08ceec() {
  return __cxx_static_address_b90ab707a4143df4fe08ceec.reference || (__cxx_static_address_b90ab707a4143df4fe08ceec.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_62b3785c46a64c6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_cd74aa03a0162e21 = i32(2147483648);
function __cxx_static_address_d7b8d6d5ab9efe35a3a5fa44() {
  return __cxx_static_address_d7b8d6d5ab9efe35a3a5fa44.reference || (__cxx_static_address_d7b8d6d5ab9efe35a3a5fa44.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_cd74aa03a0162e21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_0eb973bf865d665e = i32(2147483648);
function __cxx_static_address_d2b43af69000937e010e14e6() {
  return __cxx_static_address_d2b43af69000937e010e14e6.reference || (__cxx_static_address_d2b43af69000937e010e14e6.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_0eb973bf865d665e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_26ed24b3f5257fe4 = i32(65536);
function __cxx_static_address_b1300ac51e22a80486d43e43() {
  return __cxx_static_address_b1300ac51e22a80486d43e43.reference || (__cxx_static_address_b1300ac51e22a80486d43e43.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_26ed24b3f5257fe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_97c9065c0ff946da = i32(32768);
function __cxx_static_address_38f25fd0dd14922ac7407ad3() {
  return __cxx_static_address_38f25fd0dd14922ac7407ad3.reference || (__cxx_static_address_38f25fd0dd14922ac7407ad3.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_97c9065c0ff946da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_9ed27f0e0b262dd1 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_9b38e5b4bcc0db3bf4fbfee3() {
  return __cxx_static_address_9b38e5b4bcc0db3bf4fbfee3.reference || (__cxx_static_address_9b38e5b4bcc0db3bf4fbfee3.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_9ed27f0e0b262dd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let bdist = new Int32Array(513);
function __cxx_static_address_f732f569a746ca06b9b98314() {
  return __cxx_static_address_f732f569a746ca06b9b98314.reference || (__cxx_static_address_f732f569a746ca06b9b98314.reference = {
    __cReference: true,
    get value() { return bdist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:9
export let colhere = new Uint8Array(4913);
function __cxx_static_address_07ea1e9cc7e5611c87196265() {
  return __cxx_static_address_07ea1e9cc7e5611c87196265.reference || (__cxx_static_address_07ea1e9cc7e5611c87196265.reference = {
    __cReference: true,
    get value() { return colhere; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:10
export let colhead = new Uint8Array(39304);
function __cxx_static_address_710a1f86069bf7283de24abd() {
  return __cxx_static_address_710a1f86069bf7283de24abd.reference || (__cxx_static_address_710a1f86069bf7283de24abd.reference = {
    __cReference: true,
    get value() { return colhead; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:11
export let colnext = new Int32Array(256);
function __cxx_static_address_143607e791aad71204fb7622() {
  return __cxx_static_address_143607e791aad71204fb7622.reference || (__cxx_static_address_143607e791aad71204fb7622.reference = {
    __cReference: true,
    get value() { return colnext; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:14
export let coldist = new Uint8Array(8);
function __cxx_static_address_bd7fb1aa7eab05e95153a6b7() {
  return __cxx_static_address_bd7fb1aa7eab05e95153a6b7.reference || (__cxx_static_address_bd7fb1aa7eab05e95153a6b7.reference = {
    __cReference: true,
    get value() { return coldist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:15
export let colscan = new Int32Array(27);
function __cxx_static_address_1f4db5a8ef87758b3811f64f() {
  return __cxx_static_address_1f4db5a8ef87758b3811f64f.reference || (__cxx_static_address_1f4db5a8ef87758b3811f64f.reference = {
    __cReference: true,
    get value() { return colscan; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:17
export let colmatch_palette = new Uint8Array(768);
function __cxx_static_address_8b1c077f982aa767fcb2b792() {
  return __cxx_static_address_8b1c077f982aa767fcb2b792.reference || (__cxx_static_address_8b1c077f982aa767fcb2b792.reference = {
    __cReference: true,
    get value() { return colmatch_palette; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:22
export function paletteInitClosestColorScale(rscale, gscale, bscale) {
  let j = i32(0);
  for (let i = i64(256); (i >= i64(0)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((cDeref(cPointerOffset(rdist, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(rdist, (BigInt(i64(i32(Math.imul(256, 2)))) - BigInt(i)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, rscale)))));
    ((cDeref(cPointerOffset(gdist, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(gdist, (BigInt(i64(i32(Math.imul(256, 2)))) - BigInt(i)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, gscale)))));
    ((cDeref(cPointerOffset(bdist, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(bdist, (BigInt(i64(i32(Math.imul(256, 2)))) - BigInt(i)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, bscale)))));
    (j = i32((Number(j) + Number((BigInt(i64(i32((i32(Math.imul(256, 2)) + 1)))) - BigInt((BigInt(i) << BigInt(1))))))));
  }
}

// C/C++ source: source/build/src/colmatch.cpp:34
export function paletteInitClosestColorMap(pal) {
  cByteMemory.memset(colhere, 0, 4913);
  cByteMemory.memset(colhead, 0, 39304);
  cByteMemory.memcpy(colmatch_palette, pal, 768);
  let pal1 = cTypedPointer(cPointerOffset(pal, i32((768 - 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array);
  for (let i = i64(255); (i >= i64(0)); (((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; })), (pal1 = cPointerOffset(pal1, -(3), Uint8Array.BYTES_PER_ELEMENT)))) {
    let j = i32((i32((i32((i32((i32((i32(Math.imul(i32(Math.imul(i32((i32((cDeref(cPointerOffset(pal1, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 3)), i32((256 >> 3)))), i32((256 >> 3)))) + i32(Math.imul(i32((i32((cDeref(cPointerOffset(pal1, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 3)), i32((256 >> 3)))))) + i32((i32((cDeref(cPointerOffset(pal1, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 3)))) + i32(Math.imul(i32((256 >> 3)), i32((256 >> 3)))))) + i32((256 >> 3)))) + 1));
    if (bitmap_test__header_f46fe3db9374(colhere, j)) {
      ((cDeref(cPointerOffset(colnext, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(colhead, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
    } else {
      ((cDeref(cPointerOffset(colnext, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((-1)));
    }
    ((cDeref(cPointerOffset(colhead, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((i) & 255)) & 255));
    bitmap_set__header_7dc47d48e048(colhere, j);
  }
  paletteFlushClosestColor();
}

// C/C++ source: source/build/src/colmatch.cpp:54
export function paletteInitClosestColorGrid() {
  let i = i32(0);
  let x;
  let y;
  let z;
  for ((x = i32(Math.imul((-i32((256 >> 3))), i32((256 >> 3))))); (x <= i32(Math.imul(i32((256 >> 3)), i32((256 >> 3))))); (x = i32((Number(x) + Number(i32(Math.imul(i32((256 >> 3)), i32((256 >> 3))))))))) {
    for ((y = i32((-i32((256 >> 3))))); (y <= i32((256 >> 3))); (y = i32((Number(y) + Number(i32((256 >> 3))))))) {
      for ((z = i32((-1))); (z <= 1); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => z, __cxx_lvalue_1 => { z = __cxx_lvalue_1; }))) {
        ((cDeref(cPointerOffset(colscan, ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((x + y)) + z)));
      }
    }
  }
  (i = i32((cDeref(cPointerOffset(colscan, 13, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  ((cDeref(cPointerOffset(colscan, 13, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(colscan, 26, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  ((cDeref(cPointerOffset(colscan, 26, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
  for ((i = i32(0)); (i < Math.trunc(i32((1 << 3)) / 2)); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    ((cDeref(cPointerOffset(coldist, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((i) & 255)) & 255));
  }
  for (; (i < i32((1 << 3))); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    ((cDeref(cPointerOffset(coldist, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((i32((i32((1 << 3)) - i))) & 255)) & 255));
  }
}

// C/C++ source: source/build/src/colmatch.cpp:72
export let colmatchresults = new Uint32Array(4096);
function __cxx_static_address_2128ce1542872e13161a837b() {
  return __cxx_static_address_2128ce1542872e13161a837b.reference || (__cxx_static_address_2128ce1542872e13161a837b.reference = {
    __cReference: true,
    get value() { return colmatchresults; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:73
export let numcolmatchresults = 0;
function __cxx_static_address_1ccdc8ce92aa56ebbfd64dcc() {
  return __cxx_static_address_1ccdc8ce92aa56ebbfd64dcc.reference || (__cxx_static_address_1ccdc8ce92aa56ebbfd64dcc.reference = {
    __cReference: true,
    get value() { return numcolmatchresults; },
    set value(__cxx_lvalue_0) { numcolmatchresults = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:74
export let cache_lastokcol = i32(255);
function __cxx_static_address_63c93688ebb847d0c2320856() {
  return __cxx_static_address_63c93688ebb847d0c2320856.reference || (__cxx_static_address_63c93688ebb847d0c2320856.reference = {
    __cReference: true,
    get value() { return cache_lastokcol; },
    set value(__cxx_lvalue_0) { cache_lastokcol = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:75
export let cache_blacklist = new Uint32Array(8);
function __cxx_static_address_3f08c479f482d923cb3ece46() {
  return __cxx_static_address_3f08c479f482d923cb3ece46.reference || (__cxx_static_address_3f08c479f482d923cb3ece46.reference = {
    __cReference: true,
    get value() { return cache_blacklist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:77
export function paletteFlushClosestColor() {
  cByteMemory.memset(colmatchresults, 0, (BigInt(u64(4096)) * BigInt(4)));
  (numcolmatchresults = i32(0));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_2f656115ffd7122a = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_d84aa0889349dfa958702cfd() {
  return __cxx_static_address_d84aa0889349dfa958702cfd.reference || (__cxx_static_address_d84aa0889349dfa958702cfd.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_2f656115ffd7122a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function bitmap_test__header_f46fe3db9374(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_2f656115ffd7122a, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_2f656115ffd7122a, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function bitmap_set__header_7dc47d48e048(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_2f656115ffd7122a, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function ARRAY_SIZE__header_75a4ce266c6f(arg0) {
  return u64(8n);
}

export function bitmap_test__header_6cbf0ce866bf(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_2f656115ffd7122a, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_2f656115ffd7122a, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}
