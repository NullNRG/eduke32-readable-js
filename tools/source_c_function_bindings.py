"""Join canonical C function declarations through exact same-TU source bodies.

Independent Clang queries have unrelated declaration IDs. Bare spelling/type
cannot choose between C and namespaced C++ overloads. The complete same-TU
AST proves the ABI name at each unchanged source callsite instead.
"""
import hashlib,json
from source_explicit_member_operators import walk,_semantic

SCALAR_NAMES={'abs','labs','llabs','fabs','fabsf'}

def contexts(complete):
    declarations={node.get('id'):node for top in complete for node in walk(top)
                  if node.get('kind')=='FunctionDecl' and node.get('mangledName')==node.get('name')
                  and node.get('name') in SCALAR_NAMES}
    owners=[node for top in complete for node in walk(top)
            if node.get('kind') in ('FunctionDecl','CXXMethodDecl') and any(
                ref.get('kind')=='DeclRefExpr' and ref.get('referencedDecl',{}).get('id') in declarations
                for ref in walk(node))]
    return [*declarations.values(),*owners]

def rebind(filtered,complete):
    declarations={node.get('id'):node for top in complete for node in walk(top)
        if node.get('kind')=='FunctionDecl' and node.get('name') in SCALAR_NAMES
        and node.get('mangledName')==node.get('name')
        and not any(child.get('kind')=='CompoundStmt' for child in node.get('inner',[]))}
    if not declarations:return 0
    anchors={(node['kind'],node.get('mangledName'),node.get('type',{}).get('qualType'),node.get('loc',{}).get('offset'))
             for top in filtered for node in walk(top) if node.get('kind') in ('FunctionDecl','CXXMethodDecl')}
    def sites(roots):
        for top in roots:
            for owner in walk(top):
                if owner.get('kind') not in ('FunctionDecl','CXXMethodDecl'):continue
                offset=owner.get('loc',{}).get('offset');mangled=owner.get('mangledName')
                bodies=[child for child in owner.get('inner',[]) if child.get('kind')=='CompoundStmt']
                if not mangled or not isinstance(offset,int) or len(bodies)!=1:continue
                if (owner['kind'],mangled,owner.get('type',{}).get('qualType'),offset) not in anchors:continue
                refs=[node for node in walk(bodies[0]) if node.get('kind')=='DeclRefExpr'
                      and node.get('referencedDecl',{}).get('kind')=='FunctionDecl']
                if not any(ref['referencedDecl'].get('name') in SCALAR_NAMES for ref in refs):continue
                digest=hashlib.sha256(json.dumps(_semantic(bodies[0]),sort_keys=True,separators=(',',':')).encode()).hexdigest()
                prefix=(owner['kind'],mangled,owner.get('type',{}).get('qualType'),offset,digest)
                for ordinal,ref in enumerate(refs):yield (*prefix,ordinal),ref
    proven={}
    for key,ref in sites(complete):
        declaration=declarations.get(ref.get('referencedDecl',{}).get('id'))
        if declaration:
            identity=(declaration.get('mangledName'),declaration.get('type',{}).get('qualType'),
                      declaration.get('loc',{}).get('offset'))
            proven.setdefault(key,{})[identity]=declaration
    count=0
    for key,ref in sites(filtered):
        choices=proven.get(key,{})
        if len(choices)!=1:continue
        original=next(iter(choices.values()));selected=ref['referencedDecl']
        if (original.get('name')!=selected.get('name') or
                original.get('type',{}).get('qualType')!=selected.get('type',{}).get('qualType')):continue
        copied={name:original[name] for name in ('id','kind','name','type','mangledName') if name in original}
        copied['_source_c_abi_selection']={'abi':'same-tu-c-function-selection/1','owner':key[1],
                                         'owner_body_sha256':key[4],'reference_ordinal':key[5]}
        ref['referencedDecl']=copied;count+=1
    return count
