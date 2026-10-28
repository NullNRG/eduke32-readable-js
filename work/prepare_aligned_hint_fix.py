"""Apply the reviewed alignment/hint change after the frozen suite finishes."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
report=json.loads((ROOT/'reports/oct27-final-recovery-regression.json').read_text())
assert report['complete'] and report['all_passed'] and report['regression_inputs_unchanged']
p=ROOT/'tools/source_ast_to_js.py';text=p.read_text(encoding='utf-8')
def replace(old,new):
    global text
    assert text.count(old)==1,(old[:150],text.count(old))
    text=text.replace(old,new)
replace('def semantic_kids(n):','''def is_unevaluated_assume(n):
    if kind(n)!='CallExpr' or len(kids(n))!=2:return False
    callee=kids(n)[0]
    while kind(callee) in WRAPPERS and len(kids(callee))==1:callee=kids(callee)[0]
    return (kind(callee)=='DeclRefExpr' and
            callee.get('referencedDecl',{}).get('name')=='__builtin_assume')

def semantic_kids(n):''')
replace('    result=kids(n)\n    filler=', '''    # Clang's assume operand is unevaluated, including side effects and calls.
    # Do not invent dependencies, allocations or lifetimes for that operand.
    if is_unevaluated_assume(n):return []
    result=kids(n)
    filler=''')
replace('class Emit:', '''def declared_array_alignment(node,type_aliases=None):
    attrs=[v for v in kids(node) if kind(v)=='AlignedAttr']
    if not attrs:return None
    typ=qual(node)
    shape=re.fullmatch(r'(.+?)\\s*\\[\\s*([1-9]\\d*)\\s*\\]',typ)
    if not shape or not typed_pointer(resolve_scalar_storage_alias(shape[1],type_aliases or {})+' *'):
        raise Unsupported('explicit alignment requires one contiguous scalar array: '+typ)
    values=[]
    for attr in attrs:
        parts=kids(attr)
        if len(parts)!=1 or kind(parts[0])!='ConstantExpr' or 'value' not in parts[0]:
            raise Unsupported('explicit alignment requires Clang integer constant')
        try:value=int(str(parts[0]['value']),0)
        except ValueError:raise Unsupported('explicit alignment is not an integer')
        if value<0 or value>1048576 or value and value&(value-1):
            raise Unsupported('explicit alignment exceeds supported power-of-two allocation')
        values.append(value)
    return max([1,*values])

def aligned_storage_expression(node,value,type_aliases=None):
    alignment=declared_array_alignment(node,type_aliases)
    return 'cAlignedStorage('+value+', '+str(alignment)+')' if alignment else value

class Emit:''')
replace("            if target in ('__builtin_expect','__builtin_expect_with_probability'):", '''            if target=='__builtin_assume':
                if not is_unevaluated_assume(n) or qual(n)!='void':
                    raise Unsupported('assume requires original Clang void builtin signature')
                # Optimization hint only. Evaluating the argument would change C++.
                return 'void 0'
            if target in ('__builtin_expect','__builtin_expect_with_probability'):''')
replace("        if k=='VarDecl':\n            source_name=", """        if k=='VarDecl':
            declared_array_alignment(n,self.type_aliases)
            a=[v for v in a if kind(v)!='AlignedAttr']
            source_name=""")
replace("                value=js_cast(self.expr(a[-1]),t)\n                text=pad+", "                value=aligned_storage_expression(n,js_cast(self.expr(a[-1]),t),self.type_aliases)\n                text=pad+")
replace("                    value=self.zero_aggregate(schema)\n                return pad+", "                    value=self.zero_aggregate(schema)\n                value=aligned_storage_expression(n,value,self.type_aliases)\n                return pad+")
replace("    t=qual(n); dims=[int(x) for x in re.findall(r'\\[(\\d+)\\]',t)]", """    alignment=declared_array_alignment(n,type_aliases)
    if alignment:
        clean={**n,'inner':[v for v in kids(n) if kind(v)!='AlignedAttr']}
        value=global_initializer(clean,enum_values,record_layouts,aggregate_records,type_aliases,enum_types,emitter)
        return 'cAlignedStorage('+value+', '+str(alignment)+')'
    t=qual(n); dims=[int(x) for x in re.findall(r'\\[(\\d+)\\]',t)]""")
replace("            layout=target_type_layout(arg_t,self.record_layouts,self.type_aliases)\n            if layout is None:", """            layout=target_type_layout(arg_t,self.record_layouts,self.type_aliases)
            if n.get('name') in ('alignof','__alignof') and a:
                operand=a[0]
                while kind(operand) in WRAPPERS and len(kids(operand))==1:operand=kids(operand)[0]
                if kind(operand)=='DeclRefExpr':
                    declaration=getattr(self,'all_declarations',{}).get(operand.get('referencedDecl',{}).get('id'),{})
                    explicit=declared_array_alignment(declaration,self.type_aliases)
                    if explicit and layout:return str(max(explicit,layout[1]))
            if layout is None:""")
replace("'cRecordPointer(', 'cScalarStorage(')) else ''", "'cRecordPointer(', 'cScalarStorage(', 'cAlignedStorage(')) else ''")
# Avoid partially applying a failed textual edit.
compile(text,str(p),'exec');p.write_text(text,encoding='utf-8',newline='\n')
runtime=ROOT/'tools/source_pointer_runtime.mjs'
with runtime.open('a',encoding='utf-8',newline='\n') as stream:stream.write('''
// Standalone source-array allocations have an abstract aligned base. Aliases
// retain the same buffer and offset; no copying or fabricated integer address.
// Only zero-offset, complete, typed allocations may establish this guarantee.
const cAlignedStorage = (storage, alignment) => {
  if (!Number.isSafeInteger(alignment) || alignment<1 || alignment>1048576 ||
      (alignment & (alignment-1)) || !ArrayBuffer.isView(storage) ||
      storage instanceof DataView || storage.byteOffset!==0 ||
      storage.byteLength!==storage.buffer.byteLength)
    throw new TypeError('Explicit source alignment needs a complete typed allocation');
  const key=Symbol.for('source-first.allocation-alignment/1');
  const registry=globalThis[key] ||= new WeakMap();
  registry.set(storage.buffer,Math.max(alignment,storage.BYTES_PER_ELEMENT,registry.get(storage.buffer)||1));
  return storage;
};
''')
print('Applied aligned scalar allocation and unevaluated builtin semantics.')
