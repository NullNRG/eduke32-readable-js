from pathlib import Path
p=Path('tools/source_cpp_heap.py')
s=p.read_text();draft=Path('work/allocator_header_recovery.py').read_text();draft=draft[draft.index('import hashlib,re'):]
s+='\n\n'+draft
p.write_text(s)
p=Path('tools/source_ast_to_js.py');s=p.read_text().replace('from source_cpp_heap import standard_allocation_operators','from source_cpp_heap import standard_allocation_operators, allocation_symbol, original_allocator_definitions')
s=s.replace('def reference_names(node, resolver=None, class_dependencies=None, trivial_assignments=None, type_aliases=None):','def reference_names(node, resolver=None, class_dependencies=None, trivial_assignments=None, type_aliases=None, allocation_dependencies=False):')
s=s.replace('    def walk(n):\n        if kind(n)==\'MemberExpr\'', '''    def walk(n):
        if allocation_dependencies and kind(n) in ('CXXNewExpr','CXXDeleteExpr'):
            for key in ('operatorNewDecl','operatorDeleteDecl'):
                declaration=n.get(key)
                if declaration and declaration.get('kind')=='FunctionDecl':
                    result.add(resolver(declaration) if resolver else js_ident(declaration['name']))
        if kind(n)=='MemberExpr' ''',1)
# Remove trailing space before existing `and` only cosmetic.
s=s.replace("if kind(n)=='MemberExpr'  and", "if kind(n)=='MemberExpr' and")
s=s.replace('    for node in ast:scan(node)\n    header_globals', '''    for node in ast:scan(node)
    allocator_definitions=original_allocator_definitions(ast,source_root,source_rel)
    allocator_proofs={id(node):proof for node,proof in allocator_definitions}
    known_candidates={id(node) for node in candidates}
    candidates.extend(node for node,proof in allocator_definitions if id(node) not in known_candidates
        and (not filters or any(value in node.get('name','') for value in filters.split(','))))
    header_globals''',1)
s=s.replace("        if id(n) in header_global_internal:\n", "        if kind(n)=='FunctionDecl' and allocation_symbol(n):\n            symbol=allocation_symbol(n)\n        elif id(n) in header_global_internal:\n",1)
s=s.replace('    # Match this browser logging service only', '''    # Operator selection references in CXXNewExpr/CXXDeleteExpr carry Clang IDs,
    # often without mangling. Recover identities from the exact global declarations.
    for root in ast:
        for declaration in descendants(root):
            symbol=allocation_symbol(declaration)
            if symbol:
                if declaration.get('id'):by_id[declaration['id']]=symbol
                by_signature[(declaration['name'],qual(declaration))]=symbol
    # Match this browser logging service only''',1)
s=s.replace("        source_path=n.get('loc',{}).get('file')\n", "        source_path=n.get('loc',{}).get('file')\n        if id(n) in allocator_proofs:\n            proof=allocator_proofs[id(n)]\n            row['original_allocator_definition']=proof\n            row['line']=proof['source_line'];source_path=proof['source_header']\n",1)
s=s.replace('reference_names(n,resolve,class_dependencies,trivial_assignments,aliases)', 'reference_names(n,resolve,class_dependencies,trivial_assignments,aliases,allocation_dependencies=not standard_heap_runtime)')
p.write_text(s)
