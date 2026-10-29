"""Original out-of-line static C++ members become ordinary source functions.

Clang's owning class, previous declaration and ABI mangling prove the join.
No runtime class object or invented class provider is needed for a static call.
Inline header methods keep their existing class lowering.
"""
import hashlib
from pathlib import Path
import re


def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)


def method_symbol(method):
    name=method.get('name','');mangled=method.get('mangledName','')
    if not re.fullmatch(r'[A-Za-z_]\w*',name) or not re.fullmatch(r'_Z[A-Za-z0-9_]+',mangled):return None
    return name+'__cxx_static_'+hashlib.sha256(mangled.encode()).hexdigest()[:16]


def recover(ast,source_root,source_rel,prove_header):
    if not source_root:return [],{}
    root=Path(source_root).resolve();path=(root/source_rel).resolve()
    if not path.is_file() or not path.is_relative_to(root):return [],{}
    data=path.read_bytes();definitions={};declarations={};scopes={}
    def scan(node,scope=(),anonymous=False):
        kind=node.get('kind');name=node.get('name')
        if kind=='NamespaceDecl':
            anonymous=anonymous or not name
            if name:scope=(*scope,name)
        if kind=='CXXRecordDecl' and node.get('completeDefinition') and name:
            scopes[node.get('id')]=('::'.join((*scope,name)),anonymous)
            for member in node.get('inner',[]):
                if member.get('kind')=='CXXMethodDecl' and member.get('storageClass')=='static':
                    declarations[member.get('id')]=(node,member)
            scope=(*scope,name)
        if (kind=='CXXMethodDecl' and node.get('parentDeclContextId')
                and any(child.get('kind')=='CompoundStmt' for child in node.get('inner',[]))):
            loc=node.get('loc',{});offset=loc.get('offset');physical=loc.get('file')
            physical=(Path(physical) if Path(physical).is_absolute() else root/physical).resolve() if physical else None
            if ((physical==path or physical is None and not loc.get('includedFrom'))
                    and isinstance(offset,int) and name
                    and data[offset:offset+len(name)]==name.encode()):
                definitions[node.get('id')]=node
        for child in node.get('inner',[]):
            if child:scan(child,scope,anonymous)
    for tree in ast:scan(tree)
    outputs=[];owners={};proofs={}
    for identifier,(record,declaration) in declarations.items():
        parent=record.get('id');qualified,anonymous=scopes[parent]
        if anonymous:continue
        symbol=method_symbol(declaration)
        if parent not in proofs:proofs[parent]=prove_header(record,root)
        proof=proofs[parent]
        if not symbol or not proof:continue
        matches=[body for body in definitions.values()
            if body.get('parentDeclContextId')==parent and body.get('previousDecl')==identifier
            and body.get('name')==declaration.get('name')
            and body.get('mangledName')==declaration.get('mangledName')]
        # The redeclaration edge is Clang's exact typed semantic identity.
        # Relative typedef spelling may differ between declaration/definition.
        if not matches and any(child.get('kind')=='CompoundStmt' for child in declaration.get('inner',[])):continue
        if len(matches)>1:continue
        owners[identifier]=(symbol,None)
        if matches:
            body=matches[0];owners[body['id']]=(symbol,None)
            converted={**body,'kind':'FunctionDecl','name':symbol,
                'loc':{**body['loc'],'file':source_rel,
                    'line':body['loc'].get('line',data[:body['loc']['offset']].count(b'\n')+1)},
                '_source_static_member':{'name':declaration['name'],'owner_spelling':qualified,
                    'mangled_name':declaration['mangledName'],'class_header':proof['source_header'],
                    'class_offset':proof['source_offset'],'source_offset':body['loc']['offset'],
                    'declaration_type':declaration.get('type'),
                    'definition_type':body.get('type'),
                    'source_file_sha256':hashlib.sha256(data).hexdigest(),
                    'abi':'source-static-member-function/1'}}
            # C++ static-member storageClass is not translation-unit linkage.
            converted.pop('storageClass',None)
            outputs.append(converted)
    return outputs,owners
