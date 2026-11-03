"""Exact Clang declaration evidence for implicit trivial POD assignment.

Custom/defaulted user declarations, deleted operators, inheritance and custom
lifetimes are excluded. The emitter must separately prove every field's storage
schema before applying one of these declaration IDs.
"""


def annotate_typedef_assignment_names(ast):
    """Attach global anonymous-tag aliases within ONE Clang invocation only.

    Call before independent filtered ASTs are concatenated. A raw Clang ID
    proves a typedef's tag only inside that invocation. Keep this conservative:
    local/namespace spellings and collisions remain outside this fallback.
    Actual byte layout and matching operand types are still checked by Emit.
    """
    records = {}; declarations = []; names = {}

    def visit(node, global_context=True):
        kind = node.get('kind'); name = node.get('name')
        if kind in ('CXXRecordDecl', 'ClassTemplateSpecializationDecl') and node.get('completeDefinition'):
            records[node.get('id')] = node
        if kind in ('TypedefDecl', 'TypeAliasDecl', 'CXXRecordDecl', 'ClassTemplateSpecializationDecl') and name:
            owner = None
            for child in node.get('inner', []):
                if not child: continue
                owned = child.get('ownedTagDecl', {})
                if not owned and child.get('kind') == 'RecordType' and child.get('isTagOwned') is True:
                    owned = child.get('decl', {})
                if owned.get('kind') == 'CXXRecordDecl' and owned.get('id'):
                    owner = owned['id']
            # Count even unrecognized aliases and declarations in other
            # scopes. They must not inherit this global type's copy proof.
            identity = owner or node.get('id')
            names.setdefault(name, set()).add(identity)
            if kind == 'TypedefDecl' and owner and global_context:
                declarations.append((name, owner))
        child_global = global_context and kind in ('TranslationUnitDecl', 'LinkageSpecDecl')
        for child in node.get('inner', []):
            if child: visit(child, child_global)

    for root in ast: visit(root)
    count = 0
    for name, identity in declarations:
        record = records.get(identity)
        if not record or record.get('name') or names.get(name) != {identity}: continue
        traits = record.get('definitionData', {})
        if (record.get('bases') or traits.get('isStandardLayout') is not True
                or traits.get('isTriviallyCopyable') is not True
                or traits.get('isAggregate') is not True
                or traits.get('copyAssign', {}).get('trivial') is not True
                or traits.get('moveAssign', {}).get('trivial') is not True
                or traits.get('dtor', {}).get('trivial') is not True): continue
        if any(child.get('kind') == 'CXXMethodDecl' and child.get('name') == 'operator='
               and not child.get('isImplicit') for child in record.get('inner', []) if child): continue
        aliases = record.setdefault('_source_trivial_assignment_typedefs', [])
        if name not in aliases: aliases.append(name); count += 1
    return count


def recover_trivial_assignment_methods(ast):
    found, ambiguous = {}, set()

    def walk(node):
        yield node
        for child in node.get('inner', []):
            if child:
                yield from walk(child)

    for root in ast:
        for record in walk(root):
            if record.get('kind') not in ('CXXRecordDecl', 'ClassTemplateSpecializationDecl'):
                continue
            traits = record.get('definitionData', {})
            if (not record.get('completeDefinition') or record.get('bases') or
                    traits.get('isStandardLayout') is not True or
                    traits.get('isTriviallyCopyable') is not True or
                    traits.get('isAggregate') is not True or
                    traits.get('dtor', {}).get('trivial') is not True):
                continue
            for method in record.get('inner', []):
                if (method.get('kind') != 'CXXMethodDecl' or method.get('name') != 'operator=' or
                        method.get('isImplicit') is not True or
                        method.get('explicitlyDefaulted') != 'default' or
                        method.get('explicitlyDeleted') or not method.get('id')):
                    continue
                params = [child for child in method.get('inner', []) if child.get('kind') == 'ParmVarDecl']
                if len(params) != 1:
                    continue
                typ = params[0].get('type', {}).get('qualType', '').strip()
                if not typ.endswith('&') or 'volatile' in typ:
                    continue
                mode = 'moveAssign' if typ.endswith('&&') else 'copyAssign'
                if traits.get(mode, {}).get('trivial') is not True:
                    continue
                identity = method['id']
                evidence = {'record_id': record.get('id'), 'mode': mode,
                            'record_name':record.get('name'),
                            'signature': method.get('type', {}).get('qualType')}
                if identity in found and found[identity] != evidence:
                    ambiguous.add(identity)
                else:
                    found[identity] = evidence
    return {identity: evidence for identity, evidence in found.items() if identity not in ambiguous}
