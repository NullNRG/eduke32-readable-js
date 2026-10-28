"""Exact Clang declaration evidence for implicit trivial POD assignment.

Custom/defaulted user declarations, deleted operators, inheritance and custom
lifetimes are excluded. The emitter must separately prove every field's storage
schema before applying one of these declaration IDs.
"""


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
