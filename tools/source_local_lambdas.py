"""Prove nonescaping, reference-only local C++ closures from one Clang AST.

No closure object layout is invented: only direct calls may observe these
objects. Captured lvalues remain lexical aliases, with ordinary source bodies.
"""
ABI = 'source-local-reference-lambda/1'
WRAPPERS = {'ImplicitCastExpr', 'ExprWithCleanups', 'MaterializeTemporaryExpr',
            'FullExpr', 'ParenExpr'}

def children(node):
    return node.get('inner', [])

def walk(node):
    yield node
    for child in children(node):
        yield from walk(child)

def strip(node):
    while node.get('kind') in WRAPPERS and len(children(node)) == 1:
        node = children(node)[0]
    return node

def plan(function):
    nodes = list(walk(function))
    parents = {id(child): node for node in nodes for child in children(node)}
    result = {}
    local_ids = {n.get('id') for n in nodes if n.get('kind') in ('VarDecl', 'ParmVarDecl')}
    for declaration in nodes:
        if declaration.get('kind') != 'VarDecl' or len(children(declaration)) != 1:
            continue
        initial = strip(children(declaration)[0]); constructors = []
        if initial.get('kind') == 'CXXConstructExpr':
            if not initial.get('elidable') or len(children(initial)) != 1:
                continue
            constructors.append(initial.get('id')); initial = strip(children(initial)[0])
        if initial.get('kind') != 'LambdaExpr':
            continue
        parts = children(initial)
        records = [n for n in parts if n.get('kind') == 'CXXRecordDecl']
        bodies = [n for n in parts if n.get('kind') == 'CompoundStmt']
        if len(records) != 1 or len(bodies) != 1 or declaration.get('storageClass') == 'static':
            continue
        record = records[0]; data = record.get('definitionData', {})
        if not data.get('isLambda') or not data.get('dtor', {}).get('trivial'):
            continue
        methods = [n for n in children(record) if n.get('kind') == 'CXXMethodDecl' and n.get('name') == 'operator()']
        fields = [n for n in children(record) if n.get('kind') == 'FieldDecl']
        captures = [n for n in parts if n.get('kind') not in ('CXXRecordDecl', 'CompoundStmt')]
        if len(methods) != 1 or len(fields) != len(captures):
            continue
        method = methods[0]
        if method.get('variadic') or any(n.get('kind') in ('LambdaExpr', 'CXXThisExpr') for n in walk(bodies[0])):
            continue
        if any(not f.get('type', {}).get('qualType', '').endswith('&') or
               f.get('type', {}).get('qualType', '').endswith('&&') for f in fields):
            continue
        if any(c.get('kind') != 'DeclRefExpr' or c.get('referencedDecl', {}).get('id') not in local_ids for c in captures):
            continue
        if any(n.get('kind') in ('CXXBindTemporaryExpr', 'CXXNewExpr') for n in walk(initial)):
            continue
        identity = declaration.get('id'); calls = {}; valid = bool(identity and method.get('id'))
        for reference in nodes:
            if reference.get('kind') != 'DeclRefExpr' or reference.get('referencedDecl', {}).get('id') != identity:
                continue
            receiver = reference; parent = parents.get(id(receiver))
            while parent and parent.get('kind') in WRAPPERS and len(children(parent)) == 1:
                receiver = parent; parent = parents.get(id(receiver))
            if not parent or parent.get('kind') != 'CXXOperatorCallExpr' or len(children(parent)) < 2 or children(parent)[1] is not receiver:
                valid = False; break
            selected = strip(children(parent)[0]).get('referencedDecl', {})
            if selected.get('id') != method['id'] or selected.get('type') != method.get('type'):
                valid = False; break
            calls[parent['id']] = identity
        if not valid:
            continue
        result[initial['id']] = {'abi': ABI, 'lambda_id': initial['id'],
            'variable_id': identity, 'variable_name': declaration['name'],
            'operator_id': method['id'], 'operator_type': method['type'],
            'method': method, 'body': bodies[0], 'calls': calls,
            'constructor_ids': constructors,
            'captures': [c['referencedDecl'] for c in captures]}
    return result
