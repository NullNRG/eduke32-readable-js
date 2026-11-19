"""Preserve Clang-selected free-template instances across filtered AST queries.

Independent Clang parses cannot share declaration IDs. Join only an unchanged
owning source body and reference position to the complete same-TU selection;
the mangled instance must still match an actually emitted original definition.
"""
import hashlib
import json
from source_explicit_member_operators import walk, _semantic, _position

ABI = 'same-tu-template-function-selection/1'


def _instances(roots):
    return {node['id']: node for top in roots for node in walk(top)
            if node.get('kind') == 'FunctionDecl' and node.get('id')
            and node.get('mangledName') and any(
                child.get('kind') == 'TemplateArgument'
                for child in node.get('inner', []))}


def contexts(complete):
    instances = _instances(complete)
    owners = [node for top in complete for node in walk(top)
              if node.get('kind') in ('FunctionDecl', 'CXXMethodDecl') and any(
                  ref.get('kind') == 'DeclRefExpr'
                  and ref.get('referencedDecl', {}).get('id') in instances
                  for ref in walk(node))]
    return [*instances.values(), *owners]


def _sites(roots, anchors=None, names=None):
    for top in roots:
        for owner in walk(top):
            if owner.get('kind') not in ('FunctionDecl', 'CXXMethodDecl'):
                continue
            offset = owner.get('loc', {}).get('offset')
            bodies = [child for child in owner.get('inner', [])
                      if child.get('kind') == 'CompoundStmt']
            if not owner.get('mangledName') or not isinstance(offset, int) or len(bodies) != 1:
                continue
            anchor=(owner['kind'],owner['mangledName'],owner.get('type',{}).get('qualType'),offset)
            if anchors is not None and anchor not in anchors:continue
            references = [ref for ref in walk(bodies[0]) if ref.get('kind') == 'DeclRefExpr'
                          and ref.get('referencedDecl', {}).get('kind') == 'FunctionDecl']
            if not references or names is not None and not any(ref['referencedDecl'].get('name') in names for ref in references):continue
            digest = hashlib.sha256(json.dumps(
                _semantic(bodies[0]), sort_keys=True, separators=(',', ':')).encode()).hexdigest()
            prefix = (owner['kind'], owner['mangledName'],
                      owner.get('type', {}).get('qualType'), offset, digest)
            for ordinal, ref in enumerate(references):
                position = _position(ref)
                # Macro sites need a physical expansion proof, which this join
                # deliberately does not infer from a matching spelling.
                if position is not None:
                    yield (*prefix, ordinal, position), ref


def rebind(filtered, complete):
    instances = _instances(complete)
    if not instances:return 0
    anchors={(node['kind'],node.get('mangledName'),node.get('type',{}).get('qualType'),node.get('loc',{}).get('offset'))
             for top in filtered for node in walk(top) if node.get('kind') in ('FunctionDecl','CXXMethodDecl')}
    names={node.get('name') for node in instances.values()}
    selections = {}
    for key, ref in _sites(complete,anchors,names):
        declaration = instances.get(ref.get('referencedDecl', {}).get('id'))
        if declaration:
            identity = (declaration['name'], declaration['mangledName'],
                        declaration.get('type', {}).get('qualType'))
            selections.setdefault(key, {})[identity] = declaration
    count = 0
    for key, ref in _sites(filtered,anchors,names):
        choices = selections.get(key, {})
        if len(choices) != 1:
            continue
        declaration = next(iter(choices.values()))
        selected = ref['referencedDecl']
        if (selected.get('name') != declaration.get('name')
                or selected.get('type', {}).get('qualType') != declaration.get('type', {}).get('qualType')):
            continue
        # Keep the filtered query's ID: its references share that ID locally.
        # It is not an ID into the independently parsed complete translation unit.
        selected['mangledName'] = declaration['mangledName']
        selected['_source_template_selection'] = {
            'abi': ABI, 'owner_mangled_name': key[1],
            'owner_body_sha256': key[4], 'reference_ordinal': key[5],
            'source_range': list(key[6]), 'mangled_name': declaration['mangledName']}
        count += 1
    return count
