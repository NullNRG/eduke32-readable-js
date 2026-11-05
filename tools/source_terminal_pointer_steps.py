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
