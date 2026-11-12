"""Local pointer end values compared before guarded copies retain address math.

Only native local pointer IDs participating directly in ordered comparisons
qualify. Address-taken cells and calls/side effects in the arithmetic are not
included. Original dereference, allocation lifetime and bounds checks remain.
"""

def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)

def strip(node):
    while node.get('kind') in ('ParenExpr','ImplicitCastExpr','ExprWithCleanups','ConstantExpr') and len(node.get('inner',[]))==1:
        node=node['inner'][0]
    return node

def plan(function,resolve_type):
    nodes=list(walk(function))
    locals={node['id']:node for node in nodes if node.get('kind')=='VarDecl' and node.get('id')
            and node.get('storageClass')!='static' and '*' in resolve_type(node.get('type',{}).get('qualType',''))}
    escaped={ref.get('referencedDecl',{}).get('id') for node in nodes
             if node.get('kind')=='UnaryOperator' and node.get('opcode')=='&'
             for ref in walk(node) if ref.get('kind')=='DeclRefExpr'}
    result={}
    for node in nodes:
        if node.get('kind')!='BinaryOperator' or node.get('opcode') not in ('<','>','<=','>='):continue
        for operand in node.get('inner',[]):
            ref=strip(operand)
            key=ref.get('referencedDecl',{}).get('id')
            if ref.get('kind')=='DeclRefExpr' and key in locals and key not in escaped:
                result[key]=locals[key].get('name')
    return result

def arithmetic(node):
    node=strip(node)
    if node.get('kind')!='BinaryOperator' or node.get('opcode') not in ('+','-') or '*' not in node.get('type',{}).get('qualType',''):return False
    for child in walk(node):
        if child.get('kind') in ('CallExpr','CXXMemberCallExpr','CXXOperatorCallExpr','CXXConstructExpr','CXXNewExpr','CXXDeleteExpr','LambdaExpr'):return False
        if child.get('kind')=='UnaryOperator' and child.get('opcode') in ('++','--'):return False
        if child.get('kind')=='CompoundAssignOperator' or child.get('kind')=='BinaryOperator' and child.get('opcode')=='=':return False
    return True

def selected_lvalue(node,selected):
    node=strip(node)
    key=node.get('referencedDecl',{}).get('id')
    return key if node.get('kind')=='DeclRefExpr' and key in selected else None
