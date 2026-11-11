"""Delay pure derived const-pointer values until their first actual use.

Original native code commonly initializes an unused end-minus-padding limit
before checking for short input. No data is read by that initializer. Only
literal arithmetic over an unchanged const local pointer qualifies; calls,
volatile reads, mutable bases and address escapes remain eager and checked.
"""
import re


def children(node):
    return [child for child in node.get('inner', []) if child]


def walk(node):
    yield node
    for child in children(node):
        yield from walk(child)


def plan(function, resolve_type):
    nodes = list(walk(function))
    declarations = {node['id']: node for node in nodes
                    if node.get('kind') == 'VarDecl' and node.get('id')}
    address_taken = {ref.get('referencedDecl', {}).get('id')
                     for node in nodes if node.get('kind') == 'UnaryOperator' and node.get('opcode') == '&'
                     for ref in walk(node) if ref.get('kind') == 'DeclRefExpr'}
    result = {}

    def const_pointer(node):
        typ = node.get('type', {})
        spelling = typ.get('desugaredQualType') or typ.get('qualType', '')
        return bool(re.search(r'\*\s*const\s*$', spelling) and 'volatile' not in spelling
                    and '*' in resolve_type(spelling))

    for identity, declaration in declarations.items():
        if identity in address_taken or declaration.get('storageClass') == 'static' or not const_pointer(declaration):
            continue
        initializers = children(declaration)
        if len(initializers) != 1:
            continue
        bases = set()

        def pure(node):
            kind = node.get('kind')
            parts = children(node)
            if kind in ('ImplicitCastExpr', 'ParenExpr', 'ConstantExpr'):
                return len(parts) == 1 and pure(parts[0])
            if kind in ('IntegerLiteral', 'CharacterLiteral'):
                return True
            if kind == 'UnaryOperator' and node.get('opcode') in ('+', '-'):
                return len(parts) == 1 and pure(parts[0])
            if kind == 'BinaryOperator' and node.get('opcode') in ('+', '-'):
                return len(parts) == 2 and all(pure(part) for part in parts)
            if kind == 'DeclRefExpr':
                selected = node.get('referencedDecl', {})
                base = declarations.get(selected.get('id'))
                if (not base or base['id'] == identity or base['id'] in address_taken
                        or not const_pointer(base) or not children(base)):
                    return False
                before, after = base.get('loc', {}).get('offset'), declaration.get('loc', {}).get('offset')
                if not isinstance(before, int) or not isinstance(after, int) or before >= after:
                    return False
                bases.add(base['id'])
                return True
            return False

        if pure(initializers[0]) and len(bases) == 1 and any(
                node.get('kind') == 'BinaryOperator' for node in walk(initializers[0])):
            result[identity] = {'abi': 'source-pure-const-pointer-initializer/1',
                                'declaration': declaration['name'], 'base_declaration_ids': sorted(bases),
                                'original_memory_checks_retained': True}
    return result
