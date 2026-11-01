"""Rebind fields omitted by a filtered AST through unchanged same-TU bodies."""
import hashlib,json
from source_explicit_member_operators import walk,_semantic

def sites(ast):
    for root in ast:
        for owner in walk(root):
            if owner.get('kind') not in ('FunctionDecl','CXXMethodDecl'):continue
            mangled=owner.get('mangledName');offset=owner.get('loc',{}).get('offset')
            bodies=[node for node in owner.get('inner',[]) if node.get('kind')=='CompoundStmt']
            if not mangled or not isinstance(offset,int) or len(bodies)!=1:continue
            members=[node for node in walk(bodies[0]) if node.get('kind')=='MemberExpr']
            if not members:continue
            digest=hashlib.sha256(json.dumps(_semantic(bodies[0]),sort_keys=True,separators=(',',':')).encode()).hexdigest()
            key=(owner['kind'],mangled,owner.get('type',{}).get('qualType'),offset,digest)
            for ordinal,node in enumerate(members):yield (*key,ordinal),node

def index(complete,types):
    # Restrict targets to the actual retained type declarations. Do not retain
    # full function ASTs or manufacture a field from receiver/name spelling.
    declarations={node['id']:{key:node[key] for key in ('id','kind','name','type','loc') if key in node}
        for root in types for node in walk(root) if node.get('kind') in ('FieldDecl','CXXMethodDecl') and node.get('id')}
    result={}
    for key,member in sites(complete):
        target=declarations.get(member.get('referencedMemberDecl'))
        if target and target.get('name')==member.get('name'):
            result.setdefault(key,{})[target['id']]=target
    return result

def rebind(filtered,proofs):
    known={node.get('id') for root in filtered for node in walk(root) if node.get('kind') in ('FieldDecl','CXXMethodDecl')}
    count=0
    for key,member in sites(filtered):
        if member.get('referencedMemberDecl') in known:continue
        choices=proofs.get(key,{})
        if len(choices)!=1:continue
        target=next(iter(choices.values()))
        if target.get('name')!=member.get('name'):continue
        member['referencedMemberDecl']=target['id']
        member['_source_field_declaration' if target['kind']=='FieldDecl' else '_source_member_declaration']=target
        count+=1
    return count
