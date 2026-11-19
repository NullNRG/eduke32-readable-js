"""Audit every original-source fragment import before publishing its module."""
import json


def audit_fragment_imports(names, owners, storage, references, root, pointer_abi, binding_for_name):
    from browser_target_closure import active_exports
    from source_first_global_link import storage_import_error

    failures = []
    for name in names:
        source = owners[name]
        module = root / (source + '.mjs')
        binding = storage.get(name, {}).get('binding', binding_for_name(name))
        dependency = {**storage.get(name, {}), **references.get(name, {}),
                      'name': name, 'from': source, 'native_pointer_abi': pointer_abi}
        reason = None
        category = 'implementation'
        if not module.is_file() or binding not in active_exports(module):
            reason = 'Fragment import has no actual implementation: ' + name
        else:
            proof = module.with_suffix('.manifest.json')
            document = json.loads(proof.read_text(encoding='utf-8')) if proof.is_file() else None
            if document is None or document.get('native_pointer_abi') != pointer_abi:
                category = 'native-pointer-abi'
                reason = 'Fragment provider native-pointer ABI differs: ' + name
            elif name in storage or name in references:
                error = storage_import_error(dependency, {source: {'manifest': document, 'module': module}})
                if error:
                    category = 'storage-or-reference-abi'
                    reason = 'Fragment storage ABI rejected: ' + name + ': ' + error
        if reason:
            failures.append({'name': name, 'provider': source, 'category': category,
                             'reason': reason, 'dependency': dependency})
    return failures


def rejected_import_report(source, revision, definitions, failures):
    """Keep source lowering and failed linking separate, including local callers."""
    invalid = {failure['name'] for failure in failures}
    affected = set()
    while True:
        discovered = {row['name'] for row in definitions
                      if set(row.get('source_references', [])) & (invalid | affected)}
        if discovered <= affected:
            break
        affected.update(discovered)
    return {'format': 'source-fragment-rejected-imports/1', 'source': source,
            'compiler_runtime_input_sha256': revision, 'module_written': False,
            'link_verified': False, 'rejected_imports': failures,
            'affected_definitions': sorted(affected),
            'candidate_definitions': definitions}
