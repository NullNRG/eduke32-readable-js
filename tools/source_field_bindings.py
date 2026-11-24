"""Rebind fields omitted by a filtered AST through unchanged same-TU bodies."""
import hashlib,json
from source_explicit_member_operators import walk,_semantic

def body_semantic(body):
    result=_semantic(body);pending=[(body,result)]
    while pending:
        node,shape=pending.pop()
        # The selected union field is semantic, even when it is anonymous.
        # Retain its type/name, never an invocation-local Clang pointer ID.
        if node.get('kind')=='InitListExpr' and node.get('field'):
            shape['selected_union_field']=_semantic(node['field'])
            shape['selected_union_field']['name']=node['field'].get('name') or ''
        pending.extend(zip((child for child in node.get('inner',[]) if child),shape['inner']))
    return result

def sites(ast):
    for root in ast:
        for owner in walk(root):
            if owner.get('kind') not in ('FunctionDecl','CXXMethodDecl'):continue
            mangled=owner.get('mangledName');offset=owner.get('loc',{}).get('offset')
            bodies=[node for node in owner.get('inner',[]) if node.get('kind')=='CompoundStmt']
            if not mangled or not isinstance(offset,int) or len(bodies)!=1:continue
            members=[node for node in walk(bodies[0]) if node.get('kind')=='MemberExpr'
                     or node.get('kind')=='InitListExpr' and node.get('field')]
            if not members:continue
            digest=hashlib.sha256(json.dumps(body_semantic(bodies[0]),sort_keys=True,separators=(',',':')).encode()).hexdigest()
            key=(owner['kind'],mangled,owner.get('type',{}).get('qualType'),offset,digest)
            for ordinal,node in enumerate(members):yield (*key,ordinal),node

def index(complete,types):
    # Restrict targets to the actual retained type declarations. Do not retain
    # full function ASTs or manufacture a field from receiver/name spelling.
    declarations={node['id']:{key:node[key] for key in ('id','kind','name','type','loc') if key in node}
        for root in types for node in walk(root)
        if node.get('kind') in ('FieldDecl','CXXMethodDecl','CXXConversionDecl') and node.get('id')}
    result={}
    for key,member in sites(complete):
        reference=member.get('field',{}) if member['kind']=='InitListExpr' else member
        identity=reference.get('id') if member['kind']=='InitListExpr' else member.get('referencedMemberDecl')
        target=declarations.get(identity)
        if target and (target.get('name') or '')==(reference.get('name') or ''):
            result.setdefault(key,{})[target['id']]=target
    return result

def rebind(filtered,proofs):
    count=0
    for key,member in sites(filtered):
        # Independent Clang processes can reuse pointer-shaped IDs. An ID
        # appearing elsewhere in the merged AST does not prove this call's
        # selection; the unchanged same-TU callsite must still agree.
        choices=proofs.get(key,{})
        if len(choices)!=1:continue
        target=next(iter(choices.values()))
        if member['kind']=='InitListExpr':
            selected=member['field']
            if (target['kind']!='FieldDecl' or selected.get('kind')!='FieldDecl'
                    or (target.get('name') or '')!=(selected.get('name') or '') or target.get('type')!=selected.get('type')):continue
            if member['field']==target:continue
            member['field']=target;count+=1;continue
        if target.get('name')!=member.get('name'):continue
        if member.get('referencedMemberDecl')==target['id'] and member.get(
            '_source_field_declaration' if target['kind']=='FieldDecl' else '_source_member_declaration')==target:continue
        member['referencedMemberDecl']=target['id']
        member['_source_field_declaration' if target['kind']=='FieldDecl' else '_source_member_declaration']=target
        count+=1
    return count
