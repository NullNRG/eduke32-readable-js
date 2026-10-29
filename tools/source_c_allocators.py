"""Recover exact C allocator linkage declarations omitted by filtered ASTs.

No implementation is manufactured. A same-TU Clang query must find exactly
one canonical C ABI/mangling for the referenced signature, including all
namespaces. Only missing declaration metadata is attached to the SAME source
reference identity. Definitions remain owned by the normal source linker.
"""
from copy import deepcopy

NAMES={'malloc','calloc','realloc','free'}

def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)

def complete(ast,query,adapter,cache,evidence):
    declarations={n.get('id'):n for tree in ast for n in walk(tree) if n.get('kind')=='FunctionDecl'}
    needed={}
    for tree in ast:
        for node in walk(tree):
            ref=node.get('referencedDecl',{}) if node.get('kind')=='DeclRefExpr' else {}
            name=ref.get('name')
            if (name in NAMES and ref.get('kind')=='FunctionDecl' and ref.get('id')
                    and ref['id'] not in declarations and adapter(ref)=='cCHeap.'+name):
                needed.setdefault(name,[]).append(ref)
    for name,refs in sorted(needed.items()):
        if name not in cache:
            evidence['queried'].append(name)
            try:
                roots=query(name)
                options=[n for tree in roots for n in walk(tree) if n.get('kind')=='FunctionDecl'
                    and n.get('name')==name and adapter(n)=='cCHeap.'+name]
                manglings={n.get('mangledName') for n in options}
                if manglings!={name}:raise ValueError('ambiguous or non-C original allocator linkage')
                cache[name]=options[0]
            except Exception as error:
                cache[name]=None;evidence['rejected'][name]=str(error)
        proof=cache[name]
        if proof is None:continue
        for ref in refs:
            if ref['id'] in declarations:continue
            declaration={**deepcopy(ref),'mangledName':name,'loc':deepcopy(proof.get('loc',{})),
                '_source_c_linkage_query':{'name':name,'mangled_name':name,'original_location':proof.get('loc',{})}}
            ast.append(declaration);declarations[ref['id']]=declaration
        if name not in evidence['proven']:evidence['proven'].append(name)
