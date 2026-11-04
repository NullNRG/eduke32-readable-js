"""Global C++ record-pointer identities from the same complete Clang AST.

Only globally scoped, uniquely header-proven record declarations qualify.
Detached filtered roots, C tag/typedef namespaces, aliases without a matching
record, anonymous scopes and unsupported layouts retain strict textual checks.
"""
import hashlib,json,re
from source_header_records import header_proof

def identities(ast,views,source_root):
    records={};variables=set()
    def visit(node,global_scope=False):
        kind=node.get('kind')
        if kind=='TranslationUnitDecl':global_scope=True
        elif kind=='NamespaceDecl':global_scope=False
        if global_scope and kind=='VarDecl' and node.get('id'):variables.add(node['id'])
        if global_scope and kind=='CXXRecordDecl' and node.get('completeDefinition') and node.get('name'):
            name=node['name'];schema=views.get(name,{}).get('byte_schema')
            proof=header_proof(node,source_root)
            if schema and proof:
                records.setdefault(name,{})[json.dumps(proof,sort_keys=True)]={
                    'declaration':proof,'layout_sha256':hashlib.sha256(json.dumps(schema,sort_keys=True).encode()).hexdigest()}
        if kind in ('TranslationUnitDecl','NamespaceDecl','LinkageSpecDecl'):
            for child in node.get('inner',[]):
                if child:visit(child,global_scope)
    for tree in ast:visit(tree)
    return variables,{name:next(iter(options.values())) for name,options in records.items() if len(options)==1}

def pointer_identity(node,variables,records):
    if node.get('id') not in variables:return None
    typ=node.get('type',{}).get('desugaredQualType') or node.get('type',{}).get('qualType','')
    match=re.fullmatch(r'((?:(?:const|volatile)\s+)*)(?:(?:struct|class|union)\s+)?([A-Za-z_]\w*)\s*\*\s*((?:(?:const|volatile)\s*)*)',typ)
    if not match or match[2] not in records:return None
    return {'abi':'source-global-record-pointer-type/1','record_name':match[2],
        'pointee_cv':sorted(match[1].split()),'pointer_cv':sorted(match[3].split()),**records[match[2]]}
