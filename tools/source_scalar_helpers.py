"""Pure narrowing and primitive lvalue helpers for cyclic C++ construction."""
OPERATIONS={
    'i32':'typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0',
    'u32':'typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0',
    'i64':'BigInt.asIntN(64, BigInt(value))',
    'u64':'BigInt.asUintN(64, BigInt(value))',
    'i128':'BigInt.asIntN(128, BigInt(value))',
    'u128':'BigInt.asUintN(128, BigInt(value))',
}
def declaration(name):return 'function '+name+'(value) { return '+OPERATIONS[name]+'; }'
def legacy_declaration(name):return 'const '+name+' = value => '+OPERATIONS[name]+';'
def emit(body):return ''.join(declaration(name)+'\n' for name in OPERATIONS if name+'(' in body)
REFERENCES={
    'cObjectFieldRef':('owner, field','{ const storage=owner?.[Symbol.for("source-first.original-byte-record-storage/1")]; if(storage)return globalThis[Symbol.for("source-first.record-pointer-views/1")].fieldReference(owner,field); const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); }',False),
    'cRef':('read, write','({ __cReference:true, get value() { return read(); }, set value(v) { write(v); } })',True),
    'cArrayRef':('array, index','cRef(() => array[index], v => { array[index] = v; })',True),
}
def reference_declaration(name):
    args,body,expression=REFERENCES[name]
    return 'function '+name+'('+args+') '+('{ return '+body+'; }' if expression else body)
def legacy_reference_declaration(name):
    args,body,_=REFERENCES[name]
    return 'const '+name+' = ('+args+') => '+body+';'
def emit_references():return ''.join(reference_declaration(name)+'\n' for name in REFERENCES)
def hoist_legacy(text):
    """Only exact, top-level compiler helpers qualify; preserve every other byte."""
    changed=[]
    for name in [*OPERATIONS,*REFERENCES]:
        old=legacy_declaration(name) if name in OPERATIONS else legacy_reference_declaration(name)
        replacement=declaration(name) if name in OPERATIONS else reference_declaration(name)
        lines=text.splitlines(keepends=True)
        matches=[i for i,line in enumerate(lines) if line.rstrip('\r\n')==old]
        if len(matches)>1:raise ValueError('Duplicate compiler scalar helper: '+name)
        if matches:
            i=matches[0];lines[i]=replacement+lines[i][len(old):]
            text=''.join(lines);changed.append(name)
    return text,changed
