"""Prove standard global new/delete ownership across a selected source program.

This enables the existing C++ language heap only when every selected unit was
parsed under matching source/command/toolchain inputs, and no original global
replacement has the selected standard signature. Class-specific and placement
operators remain source-owned; the emitter still checks Clang's exact operator.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3

from source_first_toolchain import fingerprint_toolchain, target_attestation
from source_cpp_references import function_type_parts

FORMAT = 'source-first-standard-heap-contract/2'
OPERATORS = ('operator new', 'operator new[]', 'operator delete', 'operator delete[]')


def contract_path(commands):
    return Path(commands).with_suffix('.standard-heap.json')


def source_digest(root):
    """Match the semantic extractor's complete original source/header inventory."""
    digest = hashlib.sha256()
    count = 0
    for path in sorted(Path(root).rglob('*')):
        if path.is_file() and path.suffix.lower() in ('.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.inc', '.inl'):
            digest.update(path.relative_to(root).as_posix().encode())
            digest.update(path.read_bytes())
            count += 1
    return {'sha256': digest.hexdigest(), 'files': count}


def semantic_fingerprint(root, commands):
    # Keep this byte-for-byte compatible with the persistent extractor. This
    # expensive library/sysroot proof runs once when producing the contract.
    from clang import cindex
    import source_semantic_index as extractor
    digest = hashlib.sha256(Path(extractor.__file__).read_bytes())
    fingerprint_toolchain(digest)
    digest.update(Path(commands).read_bytes())
    digest.update(Path(cindex.__file__).read_bytes())
    library = Path(cindex.conf.lib._name)
    if library.is_file():
        digest.update(library.read_bytes())
    resources = extractor.extraction_resource_config(cindex)
    digest.update(json.dumps(resources, sort_keys=True).encode())
    for path in sorted(Path(root).rglob('*')):
        if path.is_file() and path.suffix.lower() in ('.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.inc', '.inl'):
            digest.update(path.relative_to(root).as_posix().encode())
            digest.update(path.read_bytes())
    return digest.hexdigest()


def inspect_index(database, commands, fingerprint):
    selected = [entry['file'] for entry in json.loads(Path(commands).read_text())]
    if not selected or len(set(selected)) != len(selected):
        raise ValueError('standard heap requires a nonempty unique selected-unit inventory')
    connection = sqlite3.connect(Path(database).resolve().as_uri() + '?mode=ro', uri=True)
    try:
        saved = connection.execute("SELECT value FROM meta WHERE key='fingerprint'").fetchone()
        if not saved or saved[0] != fingerprint:
            raise ValueError('standard heap semantic index fingerprint mismatch')
        units = dict(connection.execute('SELECT source,status FROM units'))
        if set(units) != set(selected) or any(status != 'parsed' for status in units.values()):
            raise ValueError('standard heap requires every selected unit parsed without errors')
        original, nonstandard, members = [], [], []
        for (record,) in connection.execute(
                "SELECT record FROM declarations WHERE name IN (?,?,?,?)", OPERATORS):
            row = json.loads(record)
            if row.get('kind') == 'CXX_METHOD':
                members.append(row)
                continue
            if row.get('kind') != 'FUNCTION_DECL':
                raise ValueError('unclassified original allocation operator declaration')
            typ = row.get('canonical_type')
            if not isinstance(typ, str) or not typ:
                raise ValueError('original allocation operator lacks canonical signature')
            parts = function_type_parts(typ)
            if parts is None:
                raise ValueError('unclassified canonical allocation operator signature')
            result,params=parts
            # Exception specifications and attributes cannot hide ownership.
            # Clang canonicalizes aliases; require exact source ABI types.
            replaced=(result.replace(' ','')=='void*' and params==['unsigned long']
                      if row['name'].startswith('operator new') else
                      result=='void' and params in (['void *'],['void *','unsigned long']))
            (original if replaced else nonstandard).append(row)
        if original:
            names = ', '.join(f"{row['name']} at {row['file']}:{row['line']}" for row in original)
            raise ValueError('original global allocation operators require source providers: ' + names)
        compact = lambda rows: sorted([
            {key: row.get(key) for key in ('id', 'name', 'file', 'line', 'canonical_type', 'kind')}
            for row in rows], key=lambda row: (row['file'], row['line'], row['name']))
        c_allocators=[]
        for (record,) in connection.execute("SELECT record FROM declarations WHERE name IN ('malloc','calloc','realloc','free') AND definition=1"):
            row=json.loads(record)
            if row.get('kind')=='FUNCTION_DECL' and row.get('mangled_name')==row.get('name'):
                c_allocators.append(row)
        return {'selected_units': len(selected), 'global_standard_replacements': [],
                'source_c_allocator_definitions':compact(c_allocators),
                'nonstandard_source_operators': compact(nonstandard),
                'class_specific_source_operators': compact(members)}
    finally:
        connection.close()


def create(root, commands, database, output=None):
    root, commands, database = (Path(path).resolve() for path in (root, commands, database))
    output = Path(output or contract_path(commands)).resolve()
    fingerprint = semantic_fingerprint(root, commands)
    evidence = inspect_index(database, commands, fingerprint)
    data = {'format': FORMAT, 'source_root': str(root),
            'commands_sha256': hashlib.sha256(commands.read_bytes()).hexdigest(),
            'source_inventory': source_digest(root),
            'semantic_database': os.path.relpath(database, output.parent),
            'semantic_fingerprint': fingerprint,
            'extractor_sha256': hashlib.sha256(Path(__file__).with_name('source_semantic_index.py').read_bytes()).hexdigest(),
            'toolchain': [target_attestation(False), target_attestation(True)],
            'evidence': evidence, 'gameplay_verified': False}
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + '.tmp')
    temporary.write_text(json.dumps(data, indent=2) + '\n')
    os.replace(temporary, output)
    return data


def validate(root, commands):
    """Return verified opt-in evidence; absence preserves conservative blocking."""
    root, commands = Path(root).resolve(), Path(commands).resolve()
    path = contract_path(commands)
    if not path.is_file():
        return None
    data = json.loads(path.read_text())
    if data.get('format') != FORMAT or data.get('source_root') != str(root):
        raise ValueError('standard heap contract source/profile mismatch')
    if data.get('commands_sha256') != hashlib.sha256(commands.read_bytes()).hexdigest():
        raise ValueError('standard heap contract commands changed')
    if data.get('source_inventory') != source_digest(root):
        raise ValueError('standard heap contract original source/header inputs changed')
    extractor = Path(__file__).with_name('source_semantic_index.py')
    if data.get('extractor_sha256') != hashlib.sha256(extractor.read_bytes()).hexdigest():
        raise ValueError('standard heap contract extractor changed')
    if data.get('toolchain') != [target_attestation(False), target_attestation(True)]:
        raise ValueError('standard heap contract toolchain/ABI changed')
    fingerprint = data.get('semantic_fingerprint', '')
    if not re.fullmatch('[0-9a-f]{64}', fingerprint):
        raise ValueError('standard heap contract lacks semantic fingerprint')
    evidence = inspect_index(path.parent / data['semantic_database'], commands, fingerprint)
    if data.get('evidence') != evidence:
        raise ValueError('standard heap contract allocation ownership evidence changed')
    return {'contract_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'semantic_fingerprint': fingerprint, 'selected_units': evidence['selected_units'],
            'original_global_replacements_absent': True,
            'original_c_allocators_absent':not evidence['source_c_allocator_definitions']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--commands', type=Path, required=True)
    parser.add_argument('--database', type=Path, required=True)
    parser.add_argument('--out', type=Path)
    args = parser.parse_args()
    result = create(args.root, args.commands, args.database, args.out)
    print(json.dumps({'format': FORMAT, **result['evidence'], 'gameplay_verified': False}, indent=2))


if __name__ == '__main__':
    main()
