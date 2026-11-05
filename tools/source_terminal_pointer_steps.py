"""Elide an unobserved terminal pointer step; keep all memory checks intact.

Original reverse-walk loops may decrement a private pointer before the array
only after their final read. Evaluate the pure integer loop guard after its
original counter update, and omit that dead pointer update on loop exit.
"""
from source_cpp_types import has_outer_indirection
from source_scalar_types import is_integer

def children(n):return [c for c in n.get('inner',[]) if c]
def walk(n):
    yield n
    for c in children(n):yield from walk(c)
def unwrap(n):
    while n.get('kind') in ('ImplicitCastExpr','ParenExpr','ConstantExpr') and len(children(n))==1:n=children(n)[0]
    return n
def declref(n):
    n=unwrap(n)
    return n.get('referencedDecl',{}) if n.get('kind')=='DeclRefExpr' else {}
def plan(function,resolve_type):
    nodes=list(walk(function))
    if any(n.get('kind')=='GotoStmt' for n in nodes):return {}
    locals={n['id']:n for n in nodes if n.get('kind')=='VarDecl' and n.get('id')}
    def typ(n):return n.get('type',{}).get('desugaredQualType') or n.get('type',{}).get('qualType','')
    def updated(n):
        args=children(n)
        if n.get('kind')=='UnaryOperator' and n.get('opcode') in ('++','--') and len(args)==1:return declref(args[0])
        if n.get('kind')=='CompoundAssignOperator' and n.get('opcode') in ('+=','-=') and len(args)==2 and literal(args[1]):return declref(args[0])
        return {}
    def literal(n):
        n=unwrap(n)
        return n.get('kind') in ('IntegerLiteral','CharacterLiteral') or (n.get('kind')=='UnaryOperator' and n.get('opcode') in ('+','-') and len(children(n))==1 and literal(children(n)[0]))
    def guard(n,control):
        n=unwrap(n);args=children(n)
        if n.get('kind')!='BinaryOperator' or n.get('opcode') not in ('<','<=','>','>=','!=','==') or len(args)!=2:return False
        return ((declref(args[0]).get('id')==control and literal(args[1])) or (literal(args[0]) and declref(args[1]).get('id')==control))
    result={}
    for loop in nodes:
        raw=loop.get('inner',[])
        if loop.get('kind')!='ForStmt' or len(raw)!=5 or raw[1]:continue
        cond,inc=raw[2:4];steps=children(inc)
        if inc.get('kind')!='BinaryOperator' or inc.get('opcode')!=',' or len(steps)!=2:continue
        counter,pointer=updated(steps[0]),updated(steps[1]);ci,pi=counter.get('id'),pointer.get('id')
        if ci not in locals or pi not in locals or ci==pi:continue
        if not is_integer(resolve_type(typ(locals[ci]))) or not guard(cond,ci):continue
        pt=typ(locals[pi])
        if not has_outer_indirection(pt,'*') or has_outer_indirection(pt,'&[') or any('volatile' in typ(locals[i]) for i in (ci,pi)):continue
        inside={id(n) for n in walk(loop)}
        references=[n for n in nodes if n.get('kind')=='DeclRefExpr' and n.get('referencedDecl',{}).get('id')==pi]
        if any(id(n) not in inside for n in references):continue
        def uses(n):return any(v.get('kind')=='DeclRefExpr' and v.get('referencedDecl',{}).get('id')==pi for v in walk(n))
        if any(uses(n) and (n.get('kind') in ('CallExpr','CXXMemberCallExpr','CXXOperatorCallExpr','CXXConstructExpr','LambdaExpr') or n.get('kind')=='UnaryOperator' and n.get('opcode')=='&' or n.get('kind')=='VarDecl' and has_outer_indirection(typ(n),'&')) for n in nodes):continue
        result[id(loop)]={'counter_step':steps[0],'pointer_step':steps[1],'condition':cond,'pointer_declaration':pi,'counter_declaration':ci,'pointer_name':pointer.get('name')}
    return result

def plan_body_tail(function,resolve_type):
    """A private scanline pointer is reset before every use outside its loop.
    Only signed int countdowns to zero and a final pure pointer -= step qualify.
    Native memory accesses and the original integer exit state stay unchanged.
    """
    import copy
    nodes=list(walk(function))
    if any(n.get('kind') in ('GotoStmt','LambdaExpr') for n in nodes):return {}
    parents={id(c):n for n in nodes for c in children(n)}
    locals={n['id']:n for n in nodes if n.get('kind')=='VarDecl' and n.get('id')}
    def typ(n):return n.get('type',{}).get('desugaredQualType') or n.get('type',{}).get('qualType','')
    def uses(n,identity):return any(v.get('kind')=='DeclRefExpr' and v.get('referencedDecl',{}).get('id')==identity for v in walk(n))
    def pure(n):return not any(v.get('kind') in ('CallExpr','CXXMemberCallExpr','CXXOperatorCallExpr','CXXConstructExpr','UnaryOperator','CompoundAssignOperator','StmtExpr') or v.get('kind')=='BinaryOperator' and v.get('opcode') in ('=',',') or 'volatile' in typ(v) for v in walk(n))
    result={}
    for loop in nodes:
        raw=loop.get('inner',[])
        if loop.get('kind')!='ForStmt' or len(raw)!=5 or raw[1]:continue
        cond,inc,body=raw[2:];condition=unwrap(cond);args=children(condition)
        if condition.get('kind')!='BinaryOperator' or condition.get('opcode')!='>=' or len(args)!=2 or unwrap(args[1]).get('kind')!='IntegerLiteral' or unwrap(args[1]).get('value')!='0':continue
        ci=declref(args[0]).get('id')
        if ci not in locals or resolve_type(typ(locals[ci])) not in ('int','signed int'):continue
        if inc.get('kind')!='UnaryOperator' or inc.get('opcode')!='--' or len(children(inc))!=1 or declref(children(inc)[0]).get('id')!=ci:continue
        statements=children(body)
        if body.get('kind')!='CompoundStmt' or not statements:continue
        step=statements[-1];parts=children(step)
        if step.get('kind')!='CompoundAssignOperator' or step.get('opcode')!='-=' or len(parts)!=2 or not pure(parts[1]):continue
        pi=declref(parts[0]).get('id')
        if pi not in locals or not has_outer_indirection(typ(locals[pi]),'*') or any('volatile' in typ(locals[i]) for i in (pi,ci)):continue
        inside={id(n) for n in walk(loop)}
        references=[n for n in nodes if n.get('kind')=='DeclRefExpr' and n.get('referencedDecl',{}).get('id')==pi]
        outside=[n for n in references if id(n) not in inside]
        if any(parents.get(id(n),{}).get('kind')!='BinaryOperator' or parents[id(n)].get('opcode')!='=' or children(parents[id(n)])[0] is not n for n in outside):continue
        if any(uses(n,pi) and (n.get('kind') in ('CallExpr','CXXMemberCallExpr','CXXOperatorCallExpr','CXXConstructExpr') or n.get('kind')=='UnaryOperator' and n.get('opcode')=='&' or n.get('kind')=='VarDecl' and n.get('id')!=pi) for n in nodes):continue
        if any(uses(n,ci) and (n.get('kind')=='UnaryOperator' and n.get('opcode') in ('++','--','&') and n is not inc or n.get('kind') in ('BinaryOperator','CompoundAssignOperator') and n.get('opcode') in ('=','+=','-=','*=','/=') and children(n) and declref(children(n)[0]).get('id')==ci or n.get('kind')=='VarDecl' and has_outer_indirection(typ(n),'&')) for n in walk(body)):continue
        if any(uses(n,ci) and (n.get('kind') in ('CallExpr','CXXMemberCallExpr','CXXOperatorCallExpr','CXXConstructExpr') or n.get('kind')=='UnaryOperator' and n.get('opcode')=='&' or n.get('kind')=='VarDecl' and has_outer_indirection(typ(n),'&')) for n in nodes):continue
        # Substitute a pure next-counter value, without executing the original
        # increment early. The loop still performs that increment exactly once.
        next_condition=copy.deepcopy(cond)
        def substitute(n):
            for i,c in enumerate(n.get('inner',[])):
                if c.get('kind')=='DeclRefExpr' and c.get('referencedDecl',{}).get('id')==ci:
                    n['inner'][i]={'kind':'BinaryOperator','opcode':'-','type':c['type'],'valueCategory':'prvalue','inner':[copy.deepcopy(c),{'kind':'IntegerLiteral','type':{'qualType':'int'},'value':'1','valueCategory':'prvalue'}]}
                else:substitute(c)
        substitute(next_condition)
        result[id(step)]={'condition':next_condition,'pointer_name':locals[pi].get('name'),'pointer_declaration':pi,'counter_declaration':ci,'outside_uses':'unobserved-or-reset-only','source_location':step.get('range')}
    return result
