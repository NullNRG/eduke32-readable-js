"""Keep authored switch/goto resumptions as readable, guarded source loops.

This recognizes a forward resume dispatch into subsequent structured loops.
There is no per-statement program counter, instruction stream or dispatcher.
Only the original named resume targets select which source prefixes to skip.
The first version requires automatic locals at function scope before dispatch;
constructors, destructors, computed jumps and loop-local declarations fail closed.
"""
import re

def kids(node):return [n for n in node.get('inner',[]) if n]
def walk(node):
    yield node
    for child in kids(node):yield from walk(child)

def recover(body,selector):
    nodes=list(walk(body));order={id(n):i for i,n in enumerate(nodes)}
    labels={n.get('declId'):n for n in nodes if n.get('kind')=='LabelStmt'}
    parents={id(child):n for n in nodes for child in kids(n)}
    unsafe={'CXXConstructExpr','CXXTemporaryObjectExpr','CXXBindTemporaryExpr',
        'CXXNewExpr','CXXDeleteExpr','CXXThrowExpr','CXXTryStmt','CXXForRangeStmt',
        'LambdaExpr','IndirectGotoStmt','AddrLabelExpr','GCCAsmStmt','AsmStmt'}
    if any(n.get('kind') in unsafe for n in nodes):return None
    choices=[]
    for switch in nodes:
        if switch.get('kind')!='SwitchStmt' or switch.get('hasInit') or switch.get('hasVar'):continue
        parts=kids(switch)
        if len(parts)!=2 or parts[-1].get('kind')!='CompoundStmt':continue
        arms=[];gotos=[]
        def arm(node):
            if node.get('kind') not in ('CaseStmt','DefaultStmt'):return False
            children=kids(node);default=node['kind']=='DefaultStmt'
            if len(children)!=(1 if default else 2):return False
            statement=children[-1]
            if statement.get('kind')!='GotoStmt':return False
            target=labels.get(statement.get('targetLabelDeclId'))
            if not target or not re.fullmatch(r'[A-Za-z_]\w*',target.get('name','')):return False
            if order[id(target)]<=order[id(switch)]:return False
            arms.append({'condition':None if default else children[0],'label':target['name']})
            gotos.append(statement);return True
        if not kids(parts[-1]) or not all(arm(n) for n in kids(parts[-1])):continue
        # Restrict this pass to a single forward dispatch, outside loops.
        ancestors=[];current=parents.get(id(switch))
        while current is not None:ancestors.append(current);current=parents.get(id(current))
        if any(n.get('kind') in ('ForStmt','WhileStmt','DoStmt','SwitchStmt') for n in ancestors):continue
        scope=next((n for n in ancestors if n.get('kind')=='CompoundStmt'),None)
        targets={n['targetLabelDeclId'] for n in gotos}
        if not any(parents.get(id(labels[t])) is not scope for t in targets):continue
        if any(n.get('kind')=='GotoStmt' and n.get('targetLabelDeclId') in targets
               and all(n is not g for g in gotos) for n in nodes):continue
        choices.append((switch,parts[0],arms,targets))
    if len(choices)!=1:return None
    dispatch,condition,arms,targets=choices[0]
    # No source initializer may acquire a smaller JS lexical scope merely
    # because an entry guard skipped it. Hoisting arbitrary C++ lifetimes is
    # outside this pass. The original decoder uses function-scope scalar locals.
    for n in nodes:
        if n.get('kind')!='VarDecl':continue
        declaration=parents.get(id(n));scope=parents.get(id(declaration)) if declaration else None
        if (not declaration or declaration.get('kind')!='DeclStmt' or scope is not body
                or order[id(n)]>order[id(dispatch)] or n.get('storageClass')=='static'):return None
    target_names={t:labels[t]['name'] for t in targets}
    descendants={}
    def inventory(node):
        result={target_names[node['declId']]} if node.get('kind')=='LabelStmt' and node.get('declId') in targets else set()
        for child in kids(node):result.update(inventory(child))
        descendants[id(node)]=sorted(result);return result
    inventory(body)
    def resume_condition(original,names):
        return {'kind':'SourceResumeCondition','inner':[original] if original else [],
            'selector':selector,'labels':names}
    def rewrite(node):
        kind=node.get('kind');names=descendants[id(node)]
        if node is dispatch:
            return {'kind':'SourceResumeDispatchStmt','selector':selector,
                'condition':condition,'arms':arms}
        if kind=='LabelStmt' and node.get('declId') in targets:
            return {'kind':'SourceResumeLabelStmt','selector':selector,'name':node['name'],
                'inner':[rewrite(n) for n in kids(node)]}
        result={**node}
        if 'inner' in node:result['inner']=[rewrite(n) if n else n for n in node['inner']]
        if names and kind=='IfStmt':
            if node.get('hasInit') or node.get('hasVar'):raise ValueError('resume entry crosses condition-variable initialization')
            raw=result['inner'];original=kids(node)
            if len(original) not in (2,3):raise ValueError('resume if shape')
            raw[0]=resume_condition(raw[0],descendants[id(original[1])])
        if names and kind=='WhileStmt':
            raw=result['inner']
            if len(raw)!=2:raise ValueError('resume while shape')
            raw[0]=resume_condition(raw[0],names)
        if names and kind=='ForStmt':
            raw=result['inner']
            if len(raw)!=5 or raw[0] or raw[1]:raise ValueError('resume for requires existing function-scope induction storage')
            raw[2]=resume_condition(raw[2],names)
        if names and kind=='SwitchStmt':raise ValueError('resume target inside another source switch')
        if order[id(node)]>order[id(dispatch)] and kind not in ('CompoundStmt','DeclStmt','VarDecl'):
            result['_source_resume_guard']={'selector':selector,'labels':names}
        return result
    try:rewritten=rewrite(body)
    except ValueError:return None
    return {'body':rewritten,'selector':selector,'labels':sorted(target_names.values()),
            'strategy':'readable-original-resume-guards'}

def allowed_expression(selector,labels):
    import json
    return ' || '.join([f'!{selector}',*(selector+' === '+json.dumps(name) for name in labels)])
