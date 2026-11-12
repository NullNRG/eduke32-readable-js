"""Inline a source sibling-branch tail that then returns from a void function.

This is static source duplication, never a program-counter/state interpreter.
Only declarations with trivial destruction may cross the original jump.
"""
import copy,re

def kids(n):return [v for v in n.get('inner',[]) if v]
def walk(n):
    yield n
    for child in kids(n):yield from walk(child)

def recover(body,trivial_destructors=(),canonical_type=lambda value:value):
    paths={};parents={};labels={}
    def index(node,path=()):
        paths[id(node)]=path
        if node.get('kind')=='LambdaExpr':return
        if node.get('kind')=='LabelStmt':labels[node.get('declId')]=node
        for child in kids(node):parents[id(child)]=node;index(child,(*path,node))
    index(body)
    def trivial(variable):
        typ=variable.get('type',{}).get('desugaredQualType') or variable.get('type',{}).get('qualType','')
        if '*' in typ or typ.rstrip().endswith('&'):return True
        typ=re.sub(r'\[\d+\]|\b(?:const|volatile|struct|class|union)\b','',typ).strip()
        return bool(re.fullmatch(r'(?:(?:signed|unsigned) )?(?:bool|char|short|int|long(?: long)?|float|double)',typ)
                    or canonical_type(typ) in trivial_destructors)
    def safe_fragment(fragment):
        for node in walk(fragment):
            kind=node.get('kind')
            if kind in ('GotoStmt','LabelStmt','LambdaExpr','CXXBindTemporaryExpr','CXXThrowExpr','CXXTryStmt'):return False
            if kind=='VarDecl' and (node.get('storageClass')=='static' or not trivial(node)):return False
            if kind in ('BreakStmt','ContinueStmt'):
                def owns(parent):
                    if node is parent:return True
                    return any(owns(child) for child in kids(parent))
                owners={'ForStmt','WhileStmt','DoStmt','CXXForRangeStmt'}|({'SwitchStmt'} if kind=='BreakStmt' else set())
                if not any(parent.get('kind') in owners and owns(parent) for parent in walk(fragment)):return False
        return True
    replacements={};targets=set()
    for jump in walk(body):
        if jump.get('kind')!='GotoStmt':continue
        label=labels.get(jump.get('targetLabelDeclId'));source_path=paths.get(id(jump),())
        if not label:continue
        target_path=paths[id(label)];scope=parents.get(id(label))
        if not scope or scope.get('kind')!='CompoundStmt' or any(scope is node for node in source_path):continue
        # Only a branch chain at function scope can fall through to this
        # function's return. Never skip a loop condition, increment or switch.
        if any(node is not body and node is not scope and node.get('kind')!='IfStmt' for node in target_path):continue
        sequence=kids(scope);position=next(i for i,n in enumerate(sequence) if n is label)
        suffix={'kind':'CompoundStmt','inner':[*kids(label),*sequence[position+1:]]}
        uses={n.get('referencedDecl',{}).get('id') for n in walk(suffix) if n.get('kind')=='DeclRefExpr'}
        prefix=[];valid=True
        for statement in sequence[:position]:
            for decl in kids(statement) if statement.get('kind')=='DeclStmt' else []:
                if decl.get('id') not in uses:continue
                if decl.get('kind')!='VarDecl' or kids(decl) or decl.get('storageClass')=='static' or not trivial(decl):valid=False;break
                prefix.append({'kind':'DeclStmt','inner':[decl]})
        if not valid:continue
        suffix['inner']=prefix+suffix['inner']
        root_branch=target_path[1] if len(target_path)>1 else None
        if root_branch is None or root_branch.get('kind')!='IfStmt':continue
        root_sequence=kids(body);root_index=next((i for i,n in enumerate(root_sequence) if n is root_branch),None)
        if root_index is None:continue
        continuation={'kind':'CompoundStmt','inner':root_sequence[root_index+1:]}
        if not safe_fragment(suffix) or not safe_fragment(continuation):continue
        common={id(n) for n in target_path}
        leaving={n.get('id'):n for scope_node in source_path if id(scope_node) not in common
                 for n in walk(scope_node) if n.get('kind')=='VarDecl'}
        if any(not trivial(n) for n in leaving.values()):continue
        local={n.get('id') for n in walk(suffix) if n.get('kind') in ('VarDecl','ParmVarDecl')}
        refs=[n['referencedDecl'] for fragment in (suffix,continuation) for n in walk(fragment)
              if n.get('kind')=='DeclRefExpr' and n.get('referencedDecl',{}).get('id') not in local]
        if any(n.get('name')==ref.get('name') and n.get('id')!=ref.get('id') for n in leaving.values() for ref in refs):continue
        replacements[id(jump)]={'kind':'CompoundStmt','inner':[suffix,*kids(continuation),{'kind':'ReturnStmt'}]}
        targets.add(label['declId'])
    if not replacements:return None
    def rewrite(node):
        if id(node) in replacements:return copy.deepcopy(replacements[id(node)])
        if node.get('kind')=='LabelStmt' and node.get('declId') in targets:return rewrite(kids(node)[0])
        result={**node}
        if 'inner' in node:result['inner']=[rewrite(child) if child else child for child in node['inner']]
        return result
    return {'body':rewrite(body),'strategy':'source-sibling-tail-and-original-postlude-return',
            'detected':{'inlined_source_sibling_tail_jumps':len(replacements)}}
