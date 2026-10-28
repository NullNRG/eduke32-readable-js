// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/mixer.c
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
export const fix16_rad_to_deg_mult__header_global_c504274eb4c267d2 = i32(3754936);
function __cxx_static_address_341aeebaad08629500b3f488() {
  return __cxx_static_address_341aeebaad08629500b3f488.reference || (__cxx_static_address_341aeebaad08629500b3f488.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_c504274eb4c267d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_8d46bc4c46e7c69c = i32(1144);
function __cxx_static_address_6f12374e1e6719830c397dc8() {
  return __cxx_static_address_6f12374e1e6719830c397dc8.reference || (__cxx_static_address_6f12374e1e6719830c397dc8.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_8d46bc4c46e7c69c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_623b7811ac9f9847 = i32(2147483647);
function __cxx_static_address_67f6e5aee67a16a81f2fe8a2() {
  return __cxx_static_address_67f6e5aee67a16a81f2fe8a2.reference || (__cxx_static_address_67f6e5aee67a16a81f2fe8a2.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_623b7811ac9f9847; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_0fd3212f9e218497 = i32(2147483648);
function __cxx_static_address_25f42a99b5776c341f78d624() {
  return __cxx_static_address_25f42a99b5776c341f78d624.reference || (__cxx_static_address_25f42a99b5776c341f78d624.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_0fd3212f9e218497; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_4ee86ad0cb905be8 = i32(2147483648);
function __cxx_static_address_0b95dddc5a46debc0b0f00c8() {
  return __cxx_static_address_0b95dddc5a46debc0b0f00c8.reference || (__cxx_static_address_0b95dddc5a46debc0b0f00c8.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_4ee86ad0cb905be8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_6b167156a87bb9e4 = i32(65536);
function __cxx_static_address_0ecbf4100abb6255ba163cde() {
  return __cxx_static_address_0ecbf4100abb6255ba163cde.reference || (__cxx_static_address_0ecbf4100abb6255ba163cde.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_6b167156a87bb9e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_f68a621c7aa772d0 = i32(32768);
function __cxx_static_address_ed799c841c056f378faa2e5b() {
  return __cxx_static_address_ed799c841c056f378faa2e5b.reference || (__cxx_static_address_ed799c841c056f378faa2e5b.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_f68a621c7aa772d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_ee2c505a68abf4bb = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_b3aaf48b3a6868db0ea7245f() {
  return __cxx_static_address_b3aaf48b3a6868db0ea7245f.reference || (__cxx_static_address_b3aaf48b3a6868db0ea7245f.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_ee2c505a68abf4bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/libxmp-lite/src/mixer.c:175
export function downmix_int_8bit(dest, src, num, amp, offs) {
  let smp;
  let shift = i32((i32((12 + 8)) - amp));
  for (; Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => num, __cxx_lvalue_1 => { num = __cxx_lvalue_1; }))); (((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Int32Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => src, __cxx_lvalue_3 => { src = __cxx_lvalue_3; })), ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => dest, __cxx_lvalue_5 => { dest = __cxx_lvalue_5; })))) {
    (smp = i32(((cDeref(src, Int32Array).value) >> shift)));
    if ((smp > 127)) {
      ((cDeref(dest, Uint8Array).value) = ((((127) & 255)) & 255));
    } else {
      if ((smp < (-128))) {
        ((cDeref(dest, Uint8Array).value) = (((((-128)) & 255)) & 255));
      } else {
        ((cDeref(dest, Uint8Array).value) = ((((smp) & 255)) & 255));
      }
    }
    if (Boolean(offs)) {
      ((__cxx_lvalue_6) => (__cxx_lvalue_6.value = (((__cxx_lvalue_6.value + offs)) & 255)))(cDeref(dest, Uint8Array));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/mixer.c:196
export function downmix_int_16bit(dest, src, num, amp, offs) {
  let smp;
  let shift = i32((12 - amp));
  for (; Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => num, __cxx_lvalue_1 => { num = __cxx_lvalue_1; }))); (((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Int32Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => src, __cxx_lvalue_3 => { src = __cxx_lvalue_3; })), ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Int16Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => dest, __cxx_lvalue_5 => { dest = __cxx_lvalue_5; })))) {
    (smp = i32(((cDeref(src, Int32Array).value) >> shift)));
    if ((smp > 32767)) {
      ((cDeref(dest, Int16Array).value) = ((((((32767) << 16) >> 16)) << 16) >> 16));
    } else {
      if ((smp < (-32768))) {
        ((cDeref(dest, Int16Array).value) = (((((((-32768)) << 16) >> 16)) << 16) >> 16));
      } else {
        ((cDeref(dest, Int16Array).value) = ((((((smp) << 16) >> 16)) << 16) >> 16));
      }
    }
    if (Boolean(offs)) {
      ((__cxx_lvalue_6) => (__cxx_lvalue_6.value = ((((__cxx_lvalue_6.value + offs)) << 16) >> 16)))(cDeref(dest, Int16Array));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/mixer.c:215
export function anticlick(vi) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32((1 << 1))))))(cObjectFieldRef(cRecordObject(vi), "flags"));
  (cRecordObject(vi).old_vl = i32(0));
  (cRecordObject(vi).old_vr = i32(0));
}

// C/C++ source: source/libxmp-lite/src/mixer.c:223
export function do_anticlick(ctx, voc, buf, count) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let s = cObjectFieldRef(cRecordObject(ctx), "s");
  let vi = cArrayRef(cRecordObject(p).virt.voice_array, voc);
  let smp_l;
  let smp_r;
  let discharge = i32((cRecordObject(s).ticksize >> 3));
  let stepmul;
  let stepval;
  let stepmul_sq;
  (smp_r = i32(cRecordObject(vi).sright));
  (smp_l = i32(cRecordObject(vi).sleft));
  (cRecordObject(vi).sright = i32((cRecordObject(vi).sleft = i32(0))));
  if (((smp_l == 0) && (smp_r == 0))) {
    return;
  }
  if (cPointerCompare(buf, null, "==")) {
    (buf = cRecordObject(s).buf32);
    (count = i32(discharge));
  } else {
    if ((count > discharge)) {
      (count = i32(discharge));
    }
  }
  if ((count <= 0)) {
    return;
  }
  (stepval = i32(Math.trunc(i32((1 << 24)) / count)));
  (stepmul = i32(Math.imul(stepval, count)));
  if (Boolean(i32(((~cRecordObject(s).format) & i32((1 << 2)))))) {
    while (((stepmul = i32((Number(stepmul) - Number(stepval)))) > 0)) {
      (stepmul_sq = u32(i32((stepmul >> i32((24 - 16))))));
      (stepmul_sq = u32(Math.imul(stepmul_sq, stepmul_sq)));
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((Number(__cxx_lvalue_2.value) + Number((BigInt((BigInt(i64(stepmul_sq)) * BigInt(i64(smp_r)))) >> BigInt(32)))))))(cDeref(((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = cPointerOffset(previous, 1, Int32Array.BYTES_PER_ELEMENT); __cxx_lvalue_3.value = next; return previous; })(cRef(() => buf, __cxx_lvalue_4 => { buf = __cxx_lvalue_4; })), Int32Array));
      ((__cxx_lvalue_7) => (__cxx_lvalue_7.value = i32((Number(__cxx_lvalue_7.value) + Number((BigInt((BigInt(i64(stepmul_sq)) * BigInt(i64(smp_l)))) >> BigInt(32)))))))(cDeref(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = cPointerOffset(previous, 1, Int32Array.BYTES_PER_ELEMENT); __cxx_lvalue_8.value = next; return previous; })(cRef(() => buf, __cxx_lvalue_9 => { buf = __cxx_lvalue_9; })), Int32Array));
    }
  } else {
    while (((stepmul = i32((Number(stepmul) - Number(stepval)))) > 0)) {
      (stepmul_sq = u32(i32((stepmul >> i32((24 - 16))))));
      (stepmul_sq = u32(Math.imul(stepmul_sq, stepmul_sq)));
      ((__cxx_lvalue_12) => (__cxx_lvalue_12.value = i32((Number(__cxx_lvalue_12.value) + Number((BigInt((BigInt(i64(stepmul_sq)) * BigInt(i64(smp_l)))) >> BigInt(32)))))))(cDeref(((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = cPointerOffset(previous, 1, Int32Array.BYTES_PER_ELEMENT); __cxx_lvalue_13.value = next; return previous; })(cRef(() => buf, __cxx_lvalue_14 => { buf = __cxx_lvalue_14; })), Int32Array));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/mixer.c:297
export function init_sample_wraparound(s, ld, vi, xxs) {
  let bidir;
  let i;
  if ((((!cRecordObject(vi).sptr) || (cRecordObject(s).interp == 0)) || Boolean(i32(((~cRecordObject(xxs).flg) & i32((1 << 1))))))) {
    (cRecordObject(ld).active = i32(0));
    return;
  }
  (cRecordObject(ld).sptr = cRecordObject(vi).sptr);
  (cRecordObject(ld).start = i32(cRecordObject(vi).start));
  (cRecordObject(ld).end = i32(cRecordObject(vi).end));
  (cRecordObject(ld).first_loop = i32((!Boolean(i32((cRecordObject(vi).flags & i32((1 << 2))))))));
  (cRecordObject(ld)._16bit = i32((cRecordObject(xxs).flg & i32((1 << 0)))));
  (cRecordObject(ld).active = i32(1));
  (bidir = i32((cRecordObject(vi).flags & i32((1 << 4)))));
  if (Boolean(cRecordObject(ld)._16bit)) {
    let start = cPointerOffset(cTypedPointer(cRecordObject(vi).sptr, Uint16Array), cRecordObject(vi).start, Uint16Array.BYTES_PER_ELEMENT);
    let end = cPointerOffset(cTypedPointer(cRecordObject(vi).sptr, Uint16Array), cRecordObject(vi).end, Uint16Array.BYTES_PER_ELEMENT);
    if ((!Boolean(cRecordObject(ld).first_loop))) {
      for ((i = i32(0)); (i < 1); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
        let j = i32((i - 1));
        ((cDeref(cPointerOffset(cRecordObject(ld).prologue, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32((cDeref(cPointerOffset(start, j, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)));
        ((cDeref(cPointerOffset(start, j, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = (((Boolean(bidir) ? (cDeref(cPointerOffset(start, i32(((-1) - j)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) : (cDeref(cPointerOffset(end, j, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value))) & 65535));
      }
    }
    for ((i = i32(0)); (i < 2); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      ((cDeref(cPointerOffset(cRecordObject(ld).epilogue, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32((cDeref(cPointerOffset(end, i, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)));
      ((cDeref(cPointerOffset(end, i, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = (((Boolean(bidir) ? (cDeref(cPointerOffset(end, i32(((-1) - i)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) : (cDeref(cPointerOffset(start, i, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value))) & 65535));
    }
  } else {
    let start = cPointerOffset(cTypedPointer(cRecordObject(vi).sptr, Uint8Array), cRecordObject(vi).start, Uint8Array.BYTES_PER_ELEMENT);
    let end = cPointerOffset(cTypedPointer(cRecordObject(vi).sptr, Uint8Array), cRecordObject(vi).end, Uint8Array.BYTES_PER_ELEMENT);
    if ((!Boolean(cRecordObject(ld).first_loop))) {
      for ((i = i32(0)); (i < 1); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
        let j = i32((i - 1));
        ((cDeref(cPointerOffset(cRecordObject(ld).prologue, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32((cDeref(cPointerOffset(start, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
        ((cDeref(cPointerOffset(start, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((Boolean(bidir) ? (cDeref(cPointerOffset(start, i32(((-1) - j)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) : (cDeref(cPointerOffset(end, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) & 255));
      }
    }
    for ((i = i32(0)); (i < 2); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
      ((cDeref(cPointerOffset(cRecordObject(ld).epilogue, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32((cDeref(cPointerOffset(end, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
      ((cDeref(cPointerOffset(end, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((Boolean(bidir) ? (cDeref(cPointerOffset(end, i32(((-1) - i)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) : (cDeref(cPointerOffset(start, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) & 255));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/mixer.c:351
export function reset_sample_wraparound(ld) {
  let i;
  if ((!Boolean(cRecordObject(ld).active))) {
    return;
  }
  if (Boolean(cRecordObject(ld)._16bit)) {
    let start = cPointerOffset(cTypedPointer(cRecordObject(ld).sptr, Uint16Array), cRecordObject(ld).start, Uint16Array.BYTES_PER_ELEMENT);
    let end = cPointerOffset(cTypedPointer(cRecordObject(ld).sptr, Uint16Array), cRecordObject(ld).end, Uint16Array.BYTES_PER_ELEMENT);
    if ((!Boolean(cRecordObject(ld).first_loop))) {
      for ((i = i32(0)); (i < 1); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
        ((cDeref(cPointerOffset(start, i32((i - 1)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = (((((cDeref(cPointerOffset(cRecordObject(ld).prologue, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)) & 65535)) & 65535));
      }
    }
    for ((i = i32(0)); (i < 2); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      ((cDeref(cPointerOffset(end, i, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = (((((cDeref(cPointerOffset(cRecordObject(ld).epilogue, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)) & 65535)) & 65535));
    }
  } else {
    let start = cPointerOffset(cTypedPointer(cRecordObject(ld).sptr, Uint8Array), cRecordObject(ld).start, Uint8Array.BYTES_PER_ELEMENT);
    let end = cPointerOffset(cTypedPointer(cRecordObject(ld).sptr, Uint8Array), cRecordObject(ld).end, Uint8Array.BYTES_PER_ELEMENT);
    if ((!Boolean(cRecordObject(ld).first_loop))) {
      for ((i = i32(0)); (i < 1); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
        ((cDeref(cPointerOffset(start, i32((i - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((((cDeref(cPointerOffset(cRecordObject(ld).prologue, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)) & 255)) & 255));
      }
    }
    for ((i = i32(0)); (i < 2); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
      ((cDeref(cPointerOffset(end, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((((cDeref(cPointerOffset(cRecordObject(ld).epilogue, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)) & 255)) & 255));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/mixer.c:381
export function has_active_sustain_loop(ctx, vi, xxs) {
  let m = cObjectFieldRef(cRecordObject(ctx), "m");
  return i32((((cRecordObject(vi).smp < cRecordObject(m).mod.smp) && Boolean(i32((cRecordObject(xxs).flg & i32((1 << 5)))))) && Boolean(i32(((~cRecordObject(vi).flags) & i32((1 << 0)))))));
  return i32(0);
}

// C/C++ source: source/libxmp-lite/src/mixer.c:391
export function has_active_loop(ctx, vi, xxs) {
  return i32((Boolean(i32((cRecordObject(xxs).flg & i32((1 << 1))))) || Boolean(has_active_sustain_loop(ctx, vi, xxs))));
}

// C/C++ source: source/libxmp-lite/src/mixer.c:398
export function adjust_voice_end(ctx, vi, xxs, xtra) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value & (~i32((1 << 4)))))))(cObjectFieldRef(cRecordObject(vi), "flags"));
  if ((xtra && Boolean(has_active_sustain_loop(ctx, vi, xxs)))) {
    (cRecordObject(vi).start = i32(cRecordObject(xtra).sus));
    (cRecordObject(vi).end = i32(cRecordObject(xtra).sue));
    if (Boolean(i32((cRecordObject(xxs).flg & i32((1 << 6)))))) {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((__cxx_lvalue_1.value | i32((1 << 4))))))(cObjectFieldRef(cRecordObject(vi), "flags"));
    }
  } else {
    if (Boolean(i32((cRecordObject(xxs).flg & i32((1 << 1)))))) {
      (cRecordObject(vi).start = i32(cRecordObject(xxs).lps));
      if ((Boolean(i32((cRecordObject(xxs).flg & i32((1 << 4))))) && Boolean(i32(((~cRecordObject(vi).flags) & i32((1 << 2))))))) {
        (cRecordObject(vi).end = i32(cRecordObject(xxs).len));
      } else {
        (cRecordObject(vi).end = i32(cRecordObject(xxs).lpe));
        if (Boolean(i32((cRecordObject(xxs).flg & i32((1 << 2)))))) {
          ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((__cxx_lvalue_2.value | i32((1 << 4))))))(cObjectFieldRef(cRecordObject(vi), "flags"));
        }
      }
    } else {
      (cRecordObject(vi).start = i32(0));
      (cRecordObject(vi).end = i32(cRecordObject(xxs).len));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/mixer.c:422
export function loop_reposition(ctx, vi, xxs, xtra) {
  let loop_changed = i32((!Boolean(i32((cRecordObject(vi).flags & i32((1 << 2)))))));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32((1 << 2))))))(cObjectFieldRef(cRecordObject(vi), "flags"));
  if (Boolean(loop_changed)) {
    adjust_voice_end(ctx, vi, xxs, xtra);
  }
  if (Boolean(i32(((~cRecordObject(vi).flags) & i32((1 << 4)))))) {
    if (Boolean(i32(((~cRecordObject(vi).flags) & i32((1 << 3)))))) {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = (__cxx_lvalue_1.value - i32((cRecordObject(vi).end - cRecordObject(vi).start)))))(cObjectFieldRef(cRecordObject(vi), "pos"));
    } else {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = (__cxx_lvalue_2.value + i32((cRecordObject(vi).end - cRecordObject(vi).start)))))(cObjectFieldRef(cRecordObject(vi), "pos"));
    }
  } else {
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((__cxx_lvalue_3.value ^ i32((1 << 3))))))(cObjectFieldRef(cRecordObject(vi), "flags"));
    if (Boolean(i32((cRecordObject(vi).flags & i32((1 << 3)))))) {
      (cRecordObject(vi).pos = (i32((i32(Math.imul(cRecordObject(vi).end, 2)) - cRecordObject(ctx).s.bidir_adjust)) - cRecordObject(vi).pos));
    } else {
      (cRecordObject(vi).pos = (i32(Math.imul(cRecordObject(vi).start, 2)) - cRecordObject(vi).pos));
    }
  }
  return i32(loop_changed);
}

// C/C++ source: source/libxmp-lite/src/mixer.c:457
export function libxmp_mixer_prepare(ctx) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let m = cObjectFieldRef(cRecordObject(ctx), "m");
  let s = cObjectFieldRef(cRecordObject(ctx), "s");
  let bytelen;
  (cRecordObject(s).ticksize = i32(((((cRecordObject(s).freq * cRecordObject(m).time_factor) * cRecordObject(m).rrate) / cRecordObject(p).bpm) / 1000)));
  if ((cRecordObject(s).ticksize < i32((1 << 3)))) {
    (cRecordObject(s).ticksize = i32((1 << 3)));
  }
  (bytelen = i32((BigInt(u64(cRecordObject(s).ticksize)) * BigInt(4))));
  if (Boolean(i32(((~cRecordObject(s).format) & i32((1 << 2)))))) {
    (bytelen = i32(Math.imul(bytelen, 2)));
  }
  cByteMemory.memset(cRecordObject(s).buf32, 0, u64(bytelen));
}

// C/C++ source: source/libxmp-lite/src/mixer.c:765
export function libxmp_mixer_voicepos(ctx, voc, pos, ac) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let m = cObjectFieldRef(cRecordObject(ctx), "m");
  let vi = cArrayRef(cRecordObject(p).virt.voice_array, voc);
  let xxs;
  let xtra;
  if ((cRecordObject(vi).smp < cRecordObject(m).mod.smp)) {
    (xxs = cArrayRef(cRecordObject(m).mod.xxs, cRecordObject(vi).smp));
    (xtra = cArrayRef(cRecordObject(m).xtra, cRecordObject(vi).smp));
  } else {
    (xxs = cArrayRef(cRecordObject(ctx).smix.xxs, i32((cRecordObject(vi).smp - cRecordObject(m).mod.smp))));
    (xtra = null);
  }
  if (Boolean(i32((cRecordObject(xxs).flg & i32((1 << 15)))))) {
    return;
  }
  (cRecordObject(vi).pos = pos);
  adjust_voice_end(ctx, vi, xxs, xtra);
  if ((cRecordObject(vi).pos >= cRecordObject(vi).end)) {
    (cRecordObject(vi).pos = cRecordObject(vi).end);
    if ((Boolean(i32(((~cRecordObject(vi).flags) & i32((1 << 3))))) && Boolean(has_active_loop(ctx, vi, xxs)))) {
      loop_reposition(ctx, vi, xxs, xtra);
    }
  } else {
    if ((Boolean(i32((cRecordObject(vi).flags & i32((1 << 3))))) && (cRecordObject(vi).pos <= 0.10000000000000001))) {
      (cRecordObject(vi).pos = cRecordObject(vi).end);
    }
  }
  if (Boolean(ac)) {
    anticlick(vi);
  }
}

// C/C++ source: source/libxmp-lite/src/mixer.c:880
export function libxmp_mixer_setperiod(ctx, voc, period) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let vi = cArrayRef(cRecordObject(p).virt.voice_array, voc);
  (cRecordObject(vi).period = period);
}

// C/C++ source: source/libxmp-lite/src/mixer.c:888
export function libxmp_mixer_setvol(ctx, voc, vol) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let vi = cArrayRef(cRecordObject(p).virt.voice_array, voc);
  if ((vol == 0)) {
    anticlick(vi);
  }
  (cRecordObject(vi).vol = i32(vol));
}

// C/C++ source: source/libxmp-lite/src/mixer.c:925
export function libxmp_mixer_reverse(ctx, voc, rev) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let vi = cArrayRef(cRecordObject(p).virt.voice_array, voc);
  if (Boolean(i32(((~cRecordObject(vi).fidx) & 16)))) {
    return;
  }
  if (Boolean(rev)) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32((1 << 3))))))(cObjectFieldRef(cRecordObject(vi), "flags"));
  } else {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((__cxx_lvalue_1.value & (~i32((1 << 3)))))))(cObjectFieldRef(cRecordObject(vi), "flags"));
  }
}

// C/C++ source: source/libxmp-lite/src/mixer.c:942
export function libxmp_mixer_seteffect(ctx, voc, type, val) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let vi = cArrayRef(cRecordObject(p).virt.voice_array, voc);
  switch (type) {
    case 2: {
      (cRecordObject(vi).filter.cutoff = i32(val));
    }
    break;
    case 3: {
      (cRecordObject(vi).filter.resonance = i32(val));
    }
    break;
    case 176: {
      (cRecordObject(vi).filter.a0 = i32(val));
    }
    break;
    case 177: {
      (cRecordObject(vi).filter.b0 = i32(val));
    }
    break;
    case 178: {
      (cRecordObject(vi).filter.b1 = i32(val));
    }
    break;
  }
}

// C/C++ source: source/libxmp-lite/src/mixer.c:968
export function libxmp_mixer_setpan(ctx, voc, pan) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let vi = cArrayRef(cRecordObject(p).virt.voice_array, voc);
  (cRecordObject(vi).pan = i32(pan));
}

// C/C++ source: source/libxmp-lite/src/mixer.c:976
export function libxmp_mixer_numvoices(ctx, num) {
  let s = cObjectFieldRef(cRecordObject(ctx), "s");
  if (((num > cRecordObject(s).numvoc) || (num < 0))) {
    return i32(cRecordObject(s).numvoc);
  } else {
    return i32(num);
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_34c789c2bf1abd3f = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_dd1fde28c58cc9249fe1f6aa() {
  return __cxx_static_address_dd1fde28c58cc9249fe1f6aa.reference || (__cxx_static_address_dd1fde28c58cc9249fe1f6aa.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_34c789c2bf1abd3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return (allocator).value.Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return (allocator).value.Free(p);
}
