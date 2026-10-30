"""Original out-of-line static C++ members become ordinary source functions.

Clang's owning class, previous declaration and ABI mangling prove the join.
No runtime class object or invented class provider is needed for a static call.
Inline header methods keep their existing class lowering.
"""
import hashlib,json
from pathlib import Path
import re
from source_explicit_member_operators import _position, _semantic


def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)


def method_symbol(method):
    name=method.get('name','');mangled=method.get('mangledName','')
    if not re.fullmatch(r'[A-Za-z_]\w*',name) or not re.fullmatch(r'_Z[A-Za-z0-9_]+',mangled):return None
    return name+'__cxx_static_'+hashlib.sha256(mangled.encode()).hexdigest()[:16]

def rebind_static_references(filtered,complete):
    """Join exact original callsites, never IDs from independent Clang parses.

    The full same-TU AST proves both static membership and a redeclaration path
    to the owning class. Type roots from that very AST are retained by the
    caller; their declaration IDs can then replace incomplete filtered refs.
    Header bytes/mangling are still checked by recover(), not inferred here.
    """
    declarations={node.get('id'):node for tree in complete for node in walk(tree)
                  if node.get('kind')=='CXXMethodDecl' and node.get('id')}
    canonical={member['id']:member for tree in complete for record in walk(tree)
        if record.get('kind') in ('CXXRecordDecl','ClassTemplateSpecializationDecl') and record.get('completeDefinition')
        for member in record.get('inner',[]) if member.get('kind')=='CXXMethodDecl'
        and member.get('storageClass')=='static' and member.get('id') and method_symbol(member)}
    for _ in range(len(declarations)+1):
        additions={identity:canonical[node['previousDecl']] for identity,node in declarations.items()
            if identity not in canonical and node.get('previousDecl') in canonical
            and node.get('mangledName')==canonical[node['previousDecl']].get('mangledName')}
        if not additions:break
        canonical.update(additions)
    def sites(ast):
        for tree in ast:
            for owner in walk(tree):
                if owner.get('kind') not in ('FunctionDecl','CXXMethodDecl','VarDecl'):continue
                offset=owner.get('loc',{}).get('offset');mangled=owner.get('mangledName')
                if not isinstance(offset,int) or not mangled or not owner.get('name'):continue
                prefix=(owner['kind'],owner['name'],mangled,owner.get('type',{}).get('qualType'),offset)
                for child in owner.get('inner',[]):
                    if owner['kind']!='VarDecl' and child.get('kind')!='CompoundStmt':continue
                    for reference in walk(child):
                        if reference.get('kind')!='DeclRefExpr' or reference.get('referencedDecl',{}).get('kind')!='CXXMethodDecl':continue
                        position=_position(reference)
                        if position is None:continue
                        stable=json.dumps(_semantic(reference),sort_keys=True,separators=(',',':'))
                        yield (*prefix,position,hashlib.sha256(stable.encode()).hexdigest()),reference
    originals={}
    for key,reference in sites(complete):
        selected=reference.get('referencedDecl',{});declaration=canonical.get(selected.get('id'))
        if declaration and declaration.get('name')==selected.get('name'):
            originals.setdefault(key,[]).append(declaration)
    count=0
    for key,reference in sites(filtered):
        choices=originals.get(key,[])
        if len(choices)!=1:continue
        declaration=choices[0]
        reference['_source_static_selection']={'abi':'same-tu-static-member-selection/1',
            'mangled_name':declaration['mangledName'],'callsite_sha256':key[-1]}
        reference['referencedDecl']={k:declaration[k] for k in ('id','kind','name','type','mangledName') if k in declaration}
        count+=1
    return count


def constant_members(ast,source_root,prove_header,resolve_type,integer_type):
    """Prove integral static-member constant values, never their addresses.

    Only Clang's non-ODR constant uses may substitute these values. A runtime
    address use still needs the original storage owner. No class execution or
    textual evaluation of C++ expressions is involved.
    """
    def value(node):
        if node.get('kind') in ('ConstantExpr','IntegerLiteral','CharacterLiteral') and node.get('value') is not None:
            try:return int(str(node['value']),0)
            except ValueError:return None
        children=[c for c in node.get('inner',[]) if c]
        if node.get('kind') in ('ImplicitCastExpr','ParenExpr') and len(children)==1:return value(children[0])
        return None
    result={}
    for tree in ast:
        for record in walk(tree):
            if record.get('kind')!='CXXRecordDecl' or not record.get('completeDefinition'):continue
            members=[]
            for child in record.get('inner',[]):
                original_type=child.get('type',{}).get('qualType','')
                typ=resolve_type(original_type)
                if (child.get('kind')!='VarDecl' or child.get('storageClass')!='static'
                        or not child.get('id') or not re.search(r'\bconst\b',original_type)
                        or re.search(r'\bvolatile\b',original_type) or not integer_type(typ)):continue
                initial=[c for c in child.get('inner',[]) if c]
                number=value(initial[0]) if len(initial)==1 else None
                if number is not None:members.append((child,typ,number))
            if not members:continue
            proof=prove_header(record,source_root)
            if not proof:continue
            for child,typ,number in members:
                result[child['id']]={'value':number,'type':typ,'name':child['name'],
                    'source_header':proof['source_header'],'class_offset':proof['source_offset'],
                    'member_offset':child.get('loc',{}).get('offset')}
    return result


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
