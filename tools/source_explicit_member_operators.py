"""Reconnect explicit operator calls only through the same source callsite.

Clang's filtered MemberExpr stores a declaration ID without its signature.
IDs from an independent query cannot be compared. The complete same-TU AST
supplies the selected declaration; an exact, unique owning function and
unchanged source expression must agree before its signature is retained.
"""
import hashlib
import json
import re


def walk(node):
    yield node
    for child in node.get('inner', []):
        if child:
            yield from walk(child)


def explicit_operator(node):
    return node.get('kind') == 'MemberExpr' and bool(re.fullmatch(
        r'operator(?:\[\]|\(\)|[+*/%\-=&|^!<>~]+)', node.get('name', '')))


def has_unresolved_explicit_operators(ast):
    declarations = {n.get('id') for top in ast for n in walk(top)
                    if n.get('kind') == 'CXXMethodDecl' and n.get('type')}
    return any(explicit_operator(n) and not n.get('_source_member_declaration')
               and n.get('referencedMemberDecl') not in declarations
               for top in ast for n in walk(top))


def _position(node):
    value = node.get('range', {})
    begin, end = value.get('begin', {}), value.get('end', {})
    # Macro expansions require a separate physical-source proof.
    if not all(isinstance(p.get('offset'), int) and isinstance(p.get('tokLen'), int)
               for p in (begin, end)):
        return None
    return begin['offset'], begin['tokLen'], end['offset'], end['tokLen']


def _semantic(node):
    keys = ('kind', 'name', 'opcode', 'castKind', 'value', 'valueCategory', 'isArrow')
    result = {key: node[key] for key in keys if key in node}
    if node.get('type'):
        result['type'] = {key: node['type'][key] for key in ('qualType', 'desugaredQualType')
                          if key in node['type']}
    if node.get('referencedDecl'):
        decl = node['referencedDecl']
        result['referencedDecl'] = {key: decl[key] for key in ('kind', 'name') if key in decl}
        if decl.get('type'):
            result['referencedDecl']['type'] = {key: decl['type'][key]
                for key in ('qualType', 'desugaredQualType') if key in decl['type']}
    result['inner'] = [_semantic(c) for c in node.get('inner', []) if c]
    return result


def _sites(ast):
    for top in ast:
        for owner in walk(top):
            if owner.get('kind') not in ('FunctionDecl', 'CXXMethodDecl'):
                continue
            mangled = owner.get('mangledName')
            offset = owner.get('loc', {}).get('offset')
            if not isinstance(offset, int) or not mangled or not owner.get('name'):
                continue
            key = (owner['kind'], owner['name'], mangled,
                   owner.get('type', {}).get('qualType'), offset)
            for body in owner.get('inner', []):
                if body.get('kind') != 'CompoundStmt':
                    continue
                for member in walk(body):
                    if not explicit_operator(member) or _position(member) is None:
                        continue
                    stable = json.dumps(_semantic(member), sort_keys=True, separators=(',', ':'))
                    yield (*key, _position(member), hashlib.sha256(stable.encode()).hexdigest()), member


def rebind_explicit_operators(filtered, complete):
    """Attach the original Clang-selected method signature, or leave blocked."""
    declarations = {n.get('id'): n for top in complete for n in walk(top)
                    if n.get('kind') == 'CXXMethodDecl' and n.get('type')}
    sites = {}
    for key, member in _sites(complete):
        decl = declarations.get(member.get('referencedMemberDecl'))
        if decl and decl.get('name') == member.get('name'):
            sites.setdefault(key, []).append(decl)
    proven = 0
    for key, member in _sites(filtered):
        choices = sites.get(key, [])
        if len(choices) != 1:
            continue
        decl = choices[0]
        member['_source_member_declaration'] = {
            'kind': decl['kind'], 'name': decl['name'], 'type': decl['type'],
            'id': decl['id'], 'abi': 'same-tu-explicit-member-selection/1'}
        proven += 1
    return proven
