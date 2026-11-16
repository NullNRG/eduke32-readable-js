"""Turn a terminal backward-goto dispatch into structured source-tail retries.

Each retry executes a literal copy of the original target-to-postlude suffix.
There is no instruction pointer, synthesized dispatch state or game-specific
rewrite. Declaration/lifetime and target ancestry restrictions are fail-closed.
"""
import copy,re
from source_cpp_types import has_outer_indirection

def kids(node):return [child for child in node.get('inner',[]) if child]
def walk(node):
    yield node
    for child in kids(node):yield from walk(child)

def recover(body,trivial_destructors=(),canonical_type=lambda value:value):
    sequence=kids(body)
    if body.get('kind')!='CompoundStmt' or len(sequence)<2:return None
    dispatch=sequence[-1]
    if dispatch.get('kind')!='IfStmt':return None
    jumps=[]
    def branch(node):
        if node.get('kind')=='GotoStmt':jumps.append(node);return True
        if node.get('kind')=='CompoundStmt' and len(kids(node))==1:return branch(kids(node)[0])
        if node.get('kind')!='IfStmt' or node.get('hasInit') or node.get('hasVar'):return False
        values=kids(node)
        return len(values) in (2,3) and branch(values[1]) and (len(values)==2 or branch(values[2]))
    if not branch(dispatch) or not jumps:return None
    all_nodes=list(walk(body));parents={id(child):node for node in all_nodes for child in kids(node)}
    labels={node.get('declId'):node for node in all_nodes if node.get('kind')=='LabelStmt'}
    if any(jump.get('targetLabelDeclId') not in labels for jump in jumps):return None
    if {id(node) for node in all_nodes if node.get('kind')=='GotoStmt'}!={id(node) for node in jumps}:return None
    if any(node.get('kind') in ('LambdaExpr','AddrLabelExpr','IndirectGotoStmt','GCCAsmStmt',
           'CXXBindTemporaryExpr','CXXTryStmt','CXXThrowExpr') for node in all_nodes):return None
    # Only original function-scope storage exists across these backedges. A
    # condition variable, nested local or static cannot acquire a new binding
    # or construction guard merely because its source suffix is duplicated.
    declarations=[node for node in all_nodes if node.get('kind')=='VarDecl']
    declaration_statements=set()
    for declaration in declarations:
        statement=parents.get(id(declaration));owner=parents.get(id(statement)) if statement else None
        typ=declaration.get('type',{}).get('desugaredQualType') or declaration.get('type',{}).get('qualType','')
        primitive=canonical_type(re.sub(r'\[\d+\]','',typ).strip())
        trivial=has_outer_indirection(typ,'*&') or primitive in trivial_destructors or bool(re.fullmatch(
            r'(?:(?:signed|unsigned) )?(?:bool|char|short|int|long(?: long)?|float|double)',primitive or ''))
        if (not statement or statement.get('kind')!='DeclStmt' or owner is not body
                or declaration.get('storageClass') in ('static','extern') or not trivial):return None
        declaration_statements.add(id(statement))
    targets={jump['targetLabelDeclId'] for jump in jumps}
    suffixes={};first_root=len(sequence)-1
    for target in targets:
        label=labels[target];scope=parents.get(id(label))
        if not scope or scope.get('kind')!='CompoundStmt' or len(kids(label))!=1:return None
        children=kids(scope);index=next(i for i,node in enumerate(children) if node is label)
        suffix=[kids(label)[0],*children[index+1:]]
        current=scope
        while current is not body:
            parent=parents.get(id(current))
            if not parent:return None
            if parent.get('kind')=='IfStmt':
                if parent.get('hasInit') or parent.get('hasVar'):return None
                # The label must be in an arm, never inside its condition.
                if current not in kids(parent)[1:]:return None
                current=parent;continue
            if parent.get('kind')!='CompoundStmt':return None
            siblings=kids(parent);position=next(i for i,node in enumerate(siblings) if node is current)
            if parent is body:
                first_root=min(first_root,position)
                suffix.extend(siblings[position+1:-1])
            else:suffix.extend(siblings[position+1:])
            current=parent
        # A function-scope label starts directly in the root compound.
        if scope is body:
            first_root=min(first_root,index);suffix=suffix[:-1] if suffix and suffix[-1] is dispatch else suffix
        if any(id(node) in declaration_statements for fragment in suffix for node in walk(fragment)):return None
        suffixes[target]=suffix
    if any(id(node) in declaration_statements for node in sequence[first_root:]):return None
    def strip(node):
        if node.get('kind')=='LabelStmt':return strip(kids(node)[0])
        result=copy.deepcopy({key:value for key,value in node.items() if key!='inner'})
        if 'inner' in node:result['inner']=[strip(child) if child else child for child in node['inner']]
        return result
    def rewrite(node):
        if node.get('kind')=='GotoStmt':
            return {'kind':'CompoundStmt','inner':[*[strip(part) for part in suffixes[node['targetLabelDeclId']]],{'kind':'ContinueStmt'}]}
        result=copy.deepcopy({key:value for key,value in node.items() if key!='inner'})
        if 'inner' in node:result['inner']=[rewrite(child) if child else child for child in node['inner']]
        return result
    loop={'kind':'WhileStmt','inner':[{'kind':'CXXBoolLiteralExpr','type':{'qualType':'bool'},'value':True},
        {'kind':'CompoundStmt','inner':[rewrite(dispatch),{'kind':'BreakStmt'}]}]}
    return {'body':{**body,'inner':[*[strip(node) for node in sequence[:-1]],loop]},
            'strategy':'source-postlude-backward-tail-retries',
            'detected':{'backward_tail_jumps':len(jumps),'original_targets':sorted(labels[target].get('name','') for target in targets)}}
