from pathlib import Path
p=Path('tools/source_ast_to_js.py');s=p.read_text()
def change(a,b):
 global s
 assert s.count(a)==1,(a[:90],s.count(a))
 s=s.replace(a,b)
change('from source_private_record_schema import private_record_schema_compatible','from source_private_record_schema import private_record_schema_compatible\nfrom source_empty_asm import prove_empty_asm')
change("        if k=='GCCAsmStmt':raise Unsupported('inline assembly')", """        if k=='GCCAsmStmt':
            if id(n) in getattr(self,'empty_asm_barriers',{}):
                return pad+'; // Original empty read/write-register compiler barrier.'
            raise Unsupported('inline assembly')""")
change("        if any(node.get('range',{}).get(edge,{}).get('expansionLoc',{}).get('offset')!=offset for edge in ('begin','end')):continue", """        if any(node.get('range',{}).get(edge,{}).get('expansionLoc',{}).get('offset')!=offset for edge in ('begin','end')):
            # A separate macro may supply a function's leading static/inline
            # specifiers. Its complete BODY must still expand at the exact
            # verified name macro, with the declaration ending at that site.
            bodies=[v for v in kids(node) if kind(v)=='CompoundStmt']
            start=node.get('range',{}).get('begin',{}).get('expansionLoc',{}).get('offset')
            end=node.get('range',{}).get('end',{}).get('expansionLoc',{}).get('offset')
            if (kind(node)!='FunctionDecl' or len(bodies)!=1 or not isinstance(start,int)
                    or not 0<=start<=offset or end!=offset or
                    not re.fullmatch(rb'[A-Za-z_\\s][A-Za-z_0-9\\s]*',data[start:offset]) or
                    any(bodies[0].get('range',{}).get(edge,{}).get('expansionLoc',{}).get('offset')!=offset
                        for edge in ('begin','end'))):continue""")
change('    all_declarations={node.get', """    empty_asm_barriers={}
    if source_root:
        for top in ast:
            for node in descendants(top):
                if kind(node)!='GCCAsmStmt':continue
                proof=prove_empty_asm(node,source_root,source_rel,original_header_source_bytes(str(source_root)))
                if proof:empty_asm_barriers[id(node)]=proof
    all_declarations={node.get""")
change('        em.all_declarations=all_declarations', """        em.all_declarations=all_declarations
        em.empty_asm_barriers=empty_asm_barriers
        barriers=[empty_asm_barriers[id(part)] for part in descendants(n) if id(part) in empty_asm_barriers]
        if barriers:row['original_empty_asm_barriers']=barriers""")
change('# Verified C standard-library ABI adapters are not source-owned game implementations.', """# Clang's width-specific rotates mask the count modulo the bit width.
# BigInt avoids JS's signed 32-bit shifts and implements 64-bit rotation exactly.
for _bits in (8,16,32,64):
    for _direction in ('left','right'):
        _builtin='__builtin_rotate'+_direction+str(_bits)
        BUILTIN_HELPERS[_builtin]=('rotate',2)
        _expr='(n << shift) | (n >> (width-shift))' if _direction=='left' else '(n >> shift) | (n << (width-shift))'
        _result='result' if _bits==64 else 'Number(result)'
        BUILTIN_JS[_builtin]=(f'const {_builtin} = (value,count) => {{ const width={_bits}n; '
            f'const n=BigInt.asUintN({_bits},BigInt(value)), shift=BigInt(count)&(width-1n); '
            f'const result=BigInt.asUintN({_bits},{_expr}); return {_result}; }};')

# Verified C standard-library ABI adapters are not source-owned game implementations.""")
compile(s,str(p),'exec');p.write_text(s,encoding='utf-8',newline='\n')
