from pathlib import Path
p=Path('tools/source_byte_records.py')
s=p.read_text()
s=s.replace("elif not dims and '*' in base and '&' not in base:","elif dims and len(dims)<=8 and '*' in base and '&' not in base:\n                count=1\n                for dimension in dims:count*=dimension\n                size=count*8\n                if any(d<1 for d in dims) or size>1048576 or offset['offset']%8:\n                    valid=False;break\n                item={'pointerArray':True,'dims':dims,'size':size}\n                result['arrayAlign']=max(result['arrayAlign'],8)\n            elif not dims and '*' in base and '&' not in base:")
s=s.replace("elif base in native and len(dims) <= 1:","elif base in native and len(dims) <= 8:")
s=s.replace("length = dims[0] if dims else 1", "length = 1\n                for dimension in dims:length*=dimension")
s=s.replace("if length < 1 or size > 1048576 or (dims and offset['offset'] % width):", "if length < 1 or any(d<1 for d in dims) or size > 1048576 or (dims and offset['offset'] % width):")
s=s.replace("item['length'] = length", "if len(dims)==1:item['length'] = length\n                    else:item['nativeArray']=ctor;item['dims']=dims")
s=s.replace("elif not dims and (field.get('id') in field_records or base in unique):", "elif len(dims)<=8 and (field.get('id') in field_records or base in unique):")
s=s.replace("item = {'byteRecord': child_schema}\n                size = child_schema['size']", "item = {'recordArray':child_schema,'dims':dims} if dims else {'byteRecord':child_schema}\n                size=child_schema['size']\n                for dimension in dims:size*=dimension\n                if any(d<1 for d in dims) or size>1048576:\n                    valid=False;break")
Path('work/member-array-source-byte-records.py').write_text(s)
p=Path('tools/source_aggregate_runtime.mjs');s=p.read_text()
s=s.replace('const cPointerArray = (count, values=[]) => {','const cPointerArray = (count, values=[], storage=null) => {')
s=s.replace('const bytes=new Uint8Array(count*8),view=new DataView(bytes.buffer),slots=new Array(count).fill(null);', '''const bytes=storage||new Uint8Array(count*8);
  if(!(bytes instanceof Uint8Array)||bytes.length!==count*8||bytes.byteOffset%8)
    throw new TypeError('Pointer array backing store differs from original LP64 extent');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.length),slots=new Array(count).fill(null);
  const allocationView=new DataView(bytes.buffer);''')
s=s.replace('allocations.set(bytes.buffer,{lower:0,upper:bytes.length,\n    read:offset=>cByteRecordPointers.decode(view.getBigUint64(offset,true)),\n    write:(offset,value)=>view.setBigUint64(offset,cByteRecordPointers.encode(value),true)});', '''allocations.set(bytes.buffer,{lower:0,upper:bytes.buffer.byteLength,
    read:offset=>cByteRecordPointers.decode(allocationView.getBigUint64(offset,true)),
    write:(offset,value)=>allocationView.setBigUint64(offset,cByteRecordPointers.encode(value),true)});''')
marker='const cInitByteRecord = (schema, values={}, storage=null, prototypes={}) => {'
helper='''// Array subobjects are views over their enclosing original allocation.
const cByteArrayMember = (field,bytes,prototypes,values=[]) => {
  const dims=field.dims;
  if(!Array.isArray(dims)||!dims.length||dims.length>8||dims.some(d=>!Number.isSafeInteger(d)||d<1)||
      !Array.isArray(values)||values.length>dims[0])throw new TypeError('Invalid Clang member-array dimensions');
  const count=dims.reduce((a,b)=>a*b,1);
  if(field.recordArray){
    if(field.recordArray.size*count!==bytes.length)throw new TypeError('Record member-array extent mismatch');
    return cByteRecordNDArray(field.recordArray,dims,prototypes,values,bytes);
  }
  const C=field.nativeArray&&cByteRecordNative[field.nativeArray]?.[0],width=field.pointerArray?8:C?.BYTES_PER_ELEMENT;
  if(!width||width*count!==bytes.length)throw new TypeError('Member-array extent mismatch');
  if(dims.length===1){
    if(field.pointerArray)return cPointerArray(dims[0],values,bytes);
    const array=new C(bytes.buffer,bytes.byteOffset,dims[0]);array.set(values);return array;
  }
  const stride=bytes.length/dims[0];
  const rows=Array.from({length:dims[0]},(_,i)=>cByteArrayMember({...field,dims:dims.slice(1)},
    bytes.subarray(i*stride,(i+1)*stride),prototypes,values[i]||[]));
  Object.defineProperty(rows,Symbol.for('source-first.clang-byte-record-array/1'),{value:bytes});
  return rows;
};
'''
assert marker in s;s=s.replace(marker,helper+marker)
s=s.replace('} else if (field.byteRecord) {', '''} else if (field.recordArray||field.pointerArray||field.nativeArray) {
      if(!Number.isSafeInteger(field.size)||field.offset+field.size>bytes.length)
        throw new TypeError('Member array exceeds original record');
      const array=cByteArrayMember(field,bytes.subarray(field.offset,field.offset+field.size),prototypes);
      Object.defineProperty(result,name,{value:array,enumerable:true});
    } else if (field.byteRecord) {''',1)
s=s.replace('if (field.byteRecord) {\n      const source=cByteRecordStorage.get(value)', '''if(field.recordArray||field.pointerArray||field.nativeArray){
      const dest=result[name][Symbol.for('source-first.clang-byte-record-array/1')];
      if(field.recordArray){
        const source=value?.[Symbol.for('source-first.clang-byte-record-array/1')];
        if(!source||source.length!==field.size||value[Symbol.for('source-first.byte-record-array-layout/1')]!==
            JSON.stringify({schema:field.recordArray,dims:field.dims}))throw new TypeError('Member record-array initializer differs from Clang schema');
        dest.set(source);
      }else cByteArrayMember(field,bytes.subarray(field.offset,field.offset+field.size),prototypes,value);
    } else if (field.byteRecord) {
      const source=cByteRecordStorage.get(value)''',1)
s=s.replace("if(!field.byteRecord&&!field.bitfield&&!Object.hasOwn(field,'length'))", "if(!field.byteRecord&&!field.recordArray&&!field.pointerArray&&!field.nativeArray&&!field.bitfield&&!Object.hasOwn(field,'length'))")
Path('work/member-array-source-aggregate-runtime.mjs').write_text(s)
p=Path('tools/source_ast_to_js.py');s=p.read_text()
marker="            if 'byteRecord' in field:\n                result=self.byte_record_initializer({'byteRecord':field['byteRecord']},value)"
replacement="""            if field.get('recordArray'):
                result=self.byte_record_array_initializer({'recordArray':field['recordArray'],'dims':field['dims']},value)
            elif field.get('pointerArray') or field.get('nativeArray'):
                def array_values(current,dims):
                    if kind(current)=='ImplicitValueInitExpr' and not kids(current):return '[]'
                    if kind(current)!='InitListExpr':raise Unsupported('member array requires Clang list initializer')
                    items=kids(current);filler=current.get('array_filler')
                    if filler:
                        if items or kind(filler[0])!='ImplicitValueInitExpr':raise Unsupported('ambiguous member array filler')
                        items=filler[1:]
                    if len(items)>dims[0]:raise Unsupported('member array initializer exceeds extent')
                    if len(dims)>1:return '['+', '.join(array_values(item,dims[1:]) for item in items)+']'
                    values=[]
                    for item in items:
                        expression=self.expr(item)
                        if field.get('pointerArray') and not self.current_function:
                            expression='null' if expression in ('0','0n','null') else self.static_pointer_initializer(item)
                        values.append(expression)
                    return '['+', '.join(values)+']'
                result=array_values(value,field['dims'])
            elif 'byteRecord' in field:
                result=self.byte_record_initializer({'byteRecord':field['byteRecord']},value)"""
assert marker in s;s=s.replace(marker,replacement)
Path('work/member-array-source-ast-to-js.py').write_text(s)
print('Prepared three production changes; canonical compiler is unchanged until active rebuild finishes.')
