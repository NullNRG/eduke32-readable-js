"""Attest unchanged TU-local browser fragments against current Clang identities."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re

import recover_browser_component as component
from source_ast_to_js import compiler_runtime_revision
from source_first_global_link import exported_names
from source_tu_function_bindings import ABI, implementation


def sha(data):
    return hashlib.sha256(data).hexdigest()


def private_definition(document, name):
    rows = [row for row in document['definitions'] if row['name'] == name
            and row['status'] == 'source-first']
    if len(rows) != 1 or rows[0]['kind'] != 'FunctionDecl' or rows[0]['linkage'] != 'internal':
        raise ValueError('No unique emitted TU-local function: ' + name)
    return rows[0]


def archived_bytes(producer_file, destination, root):
    # Reproduce the existing fragment installer's sole code transformation.
    def relocate(match):
        target = (producer_file.parent / match[2]).resolve()
        if not target.is_relative_to(root) or not target.is_file():
            raise ValueError('Archived fragment imports outside its verified provider root')
        relative = os.path.relpath(target, destination.parent).replace('\\', '/')
        return 'from ' + json.dumps(relative if relative.startswith('.') else './' + relative)

    return re.sub(r"""from (['"])(\.{1,2}/[^'"]+)\1""", relocate,
                  producer_file.read_text(encoding='utf-8')).encode('utf-8')


def check_source_location(witness, source, proof):
    origin = proof.get('original_definition', {})
    physical = (component.SOURCE / witness['physical_source']).resolve()
    root = component.SOURCE.resolve()
    if not physical.is_relative_to(root):
        raise ValueError('Clang callable source escapes the prepared tree')
    data = physical.read_bytes()
    position = proof['source_offset']
    name = witness['source_name'].encode('utf-8')
    if (not isinstance(position, int) or position < 0
            or data[position:position + len(name)] != name
            or data.count(b'\n', 0, position) + 1 != witness['line']):
        raise ValueError('Clang callable position differs from the current prepared source')
    if (witness['physical_source'] != source
            and (origin.get('source_header') != witness['physical_source']
                 or origin.get('source_offset') != position
                 or origin.get('header_sha256') != sha(data))):
        raise ValueError('Clang callable lacks the exact original header witness')


def attest(fresh_path, names, report_path):
    fresh_bytes = fresh_path.read_bytes()
    fresh = json.loads(fresh_bytes)
    source = fresh['source']
    root = component.OUT.resolve()
    facade = (root / (source + '.mjs')).resolve()
    if not facade.is_relative_to(root):
        raise ValueError('Source facade escapes the canonical module root')
    if (fresh.get('compiler_runtime_input_sha256') != compiler_runtime_revision()
            or Path(fresh.get('module_fragment', {}).get('import_root', '')).resolve() != root):
        raise ValueError('Fresh Clang evidence belongs to a different compiler or graph')
    owner_path = facade.with_suffix('.manifest.json')
    owner = json.loads(owner_path.read_bytes())
    inputs = fresh['ast_cache_inputs']
    if (owner.get('source') != source or owner.get('ast_cache_inputs') != inputs
            or not inputs.get('preprocessor_verified') or not inputs.get('content_hashes_not_mtimes')
            or owner.get('native_pointer_abi') != 'source-lp64-addresses/2'
            or owner.get('native_pointer_abi') != fresh.get('native_pointer_abi')):
        raise ValueError('Fresh Clang evidence differs from original owner inputs')

    probe_dir = component.BASE / 'boot-probes' / source.replace('/', '_')
    producers = {}
    for path in probe_dir.rglob(owner_path.name):
        raw = path.read_bytes()
        producers.setdefault(sha(raw), (path, raw))

    changes = []
    verified_producers = {}
    keys = ('name', 'source_name', 'original_type', 'line', 'linkage')
    for name in names:
        current = private_definition(owner, name)
        witness = private_definition(fresh, name)
        proof = witness.get('cpp_function_identity', {})
        if (proof.get('abi') != ABI or proof.get('translation_unit') != source
                or proof.get('preprocessor_sha256') != inputs['sha256']
                or proof.get('source_name') != witness.get('source_name')
                or proof.get('original_type') != witness.get('original_type')
                or current.get('cpp_function_identity', proof) != proof):
            raise ValueError('Fresh declaration lacks the exact TU-local contract: ' + name)
        check_source_location(witness, source, proof)

        fragments = [item for item in owner.get('module_fragments', [])
                     if name in item.get('reexports', item['exports'])]
        if len(fragments) != 1:
            raise ValueError('No unique active source fragment for: ' + name)
        fragment = fragments[0]
        digest = fragment['sha256']
        if implementation(facade, owner, name, exported_names) != digest:
            raise ValueError('Active callable implementation is missing or changed: ' + name)
        origin_digest = fragment['source_manifest_sha256']
        archive_identity = (digest, origin_digest)
        if archive_identity not in verified_producers:
            if origin_digest not in producers:
                raise ValueError('Missing archived producer manifest: ' + origin_digest)
            producer_path, producer_bytes = producers[origin_digest]
            producer = json.loads(producer_bytes)
            original = producer_path.resolve().with_name(facade.name)
            if (producer.get('source') != source or producer.get('ast_cache_inputs') != inputs
                    or producer.get('native_pointer_abi') != owner['native_pointer_abi']
                    or sha(archived_bytes(original, facade, root)) != digest):
                raise ValueError('Active fragment differs from archived installed bytes: ' + name)
            verified_producers[archive_identity] = producer
        previous = private_definition(verified_producers[archive_identity], name)
        if (any(current.get(key) != witness.get(key) or current.get(key) != previous.get(key)
                for key in keys)
                or any(row.get('physical_source', witness.get('physical_source')) != witness.get('physical_source')
                       for row in (current, previous))):
            raise ValueError('Original declaration differs from the archived provider: ' + name)
        current['cpp_function_identity'] = proof
        changes.append({'export': name, 'original_clang_identity': proof, 'module_sha256': digest,
                        'archived_producer_manifest_sha256': origin_digest})

    report = {'format': 'sourcefactory-tu-callable-attestation/1', 'source': source,
              'witness_manifest_sha256': sha(fresh_bytes), 'attested': changes,
              'implementation_bytes_changed': False, 'gameplay_verified': False}
    temporary = owner_path.with_suffix('.attestation.tmp')
    temporary.write_text(json.dumps(owner, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, owner_path)
    report_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('fresh_manifest', type=Path)
    parser.add_argument('names', nargs='+')
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    with component.component_lock():
        report = attest(args.fresh_manifest, list(dict.fromkeys(args.names)), args.report)
    print('Attested original TU-local callables: ' + ', '.join(row['export'] for row in report['attested']))


if __name__ == '__main__':
    main()
