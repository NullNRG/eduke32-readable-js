#!/usr/bin/env python3
"""Persistent Clang USR index of selected original translation units and headers.

Uses libclang's original-source cursor API, never LLVM/opcode execution. Stores
declarations, target ABI layouts, ownership, references and all diagnostics in
SQLite. Unsupported indirect dataflow is explicitly recorded as unresolved.
Install libclang==18.1.1 for this optional extraction backend.
"""
import argparse
import gc
import functools
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
import time

from source_first_toolchain import frontend_config, fingerprint_toolchain
from source_first_generated import recover

ROOT = Path(__file__).resolve().parents[1]

def libclang_version(cindex):
    """Query the loaded extraction library, not the separate emission driver."""
    function = cindex.conf.lib.clang_getClangVersion
    function.argtypes = []
    function.restype = cindex._CXString
    function.errcheck = cindex._CXString.from_result
    result = function()
    return result.decode() if isinstance(result, bytes) else result


def validate_resource_dir(path, library_version):
    resource = Path(path).resolve()
    if not (resource / 'include/stddef.h').is_file():
        raise RuntimeError('Clang builtin resource headers unavailable: ' + str(resource))
    manifest_path = resource / 'resource-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.is_file() else {}
    version = manifest.get('resource_version', resource.name)
    library_match = re.search(r'clang version\s+(\d+)', library_version)
    resource_match = re.fullmatch(r'(\d+)(?:\.\d+)*', version)
    if not library_match or not resource_match or library_match[1] != resource_match[1]:
        raise RuntimeError('libclang/resource major version mismatch: ' + library_version +
                           '; resource=' + str(resource) + '; resource_version=' + version)
    digest = hashlib.sha256()
    count = 0
    for header in sorted(resource.rglob('*')):
        if header.is_file():
            digest.update(header.relative_to(resource).as_posix().encode())
            digest.update(header.read_bytes())
            count += 1
    return {'resource_dir':str(resource), 'resource_version':version,
            'resource_major':int(resource_match[1]), 'libclang_version':library_version,
            'resource_sha256':digest.hexdigest(), 'resource_files':count,
            'package_origin':manifest or None, 'major_version_matches':True}


def extraction_resource_config(cindex):
    version = libclang_version(cindex)
    explicit = os.environ.get('EDUKE32_LIBCLANG_RESOURCE_DIR')
    if explicit:
        return validate_resource_dir(explicit, version)
    match = re.search(r'clang version\s+(\d+)', version)
    if not match:
        raise RuntimeError('Unable to determine loaded libclang version: ' + version)
    major = match[1]
    candidates = [ROOT/'work/dependencies/libclang-resources/usr/lib'/('llvm-'+major)/'lib/clang'/major]
    library = Path(cindex.conf.lib._name).resolve()
    candidates.extend([library.parent/'lib/clang'/major, library.parent.parent/'lib/clang'/major])
    frontend, _ = frontend_config(True)
    try:
        candidates.append(Path(subprocess.check_output([frontend, '-print-resource-dir'], text=True).strip()))
    except (OSError, subprocess.SubprocessError):
        pass
    failures = []
    for candidate in candidates:
        try:
            return validate_resource_dir(candidate, version)
        except (OSError, ValueError, RuntimeError) as error:
            failures.append(str(error))
    raise RuntimeError('No compatible builtin headers for ' + version +
                       '. Set EDUKE32_LIBCLANG_RESOURCE_DIR or run tools/bootstrap_libclang_resources.py '
                       '--out work/dependencies/libclang-resources. ' + '; '.join(failures))


def captured_args(command):
    raw = command['arguments'][1:]
    cpp = '++' in Path(command['arguments'][0]).name
    _, target = frontend_config(cpp)
    args = ['-x', 'c++' if cpp else 'c', *target]
    i = 0
    while i < len(raw):
        value = raw[i]
        if value in ('-o', '-MF', '-MT', '-MQ'):
            i += 2
            continue
        if (value in ('-c', '-MMD', '-MP', '-M', '-MM') or value == command['file']
                or value.startswith(('-O', '-flto', '-march', '-mfpmath', '-funswitch', '-fomit', '-fjump'))):
            i += 1
            continue
        args.append(value)
        i += 1
    return args + ['-Iplatform/Windows/include', '-Iplatform/Windows/include/SDL2', '-Wno-unknown-warning-option']

def relative_file(file, root):
    if file is None:
        return None
    return relative_name(file.name, root)

@functools.lru_cache(maxsize=8192)
def relative_name(name, root):
    try:
        path = Path(name)
        if not path.is_absolute():
            path = root / path
        return path.resolve().relative_to(root).as_posix()
    except ValueError:
        return None

def cursor_identity(cursor, tu, root):
    usr = cursor.get_usr()
    linkage = cursor.linkage.name
    scope = tu if linkage == 'INTERNAL' else None
    if linkage in ('NO_LINKAGE', 'INVALID'):
        # Parameters/locals of a header-static function are separate objects
        # in each TU even when their own linkage is "none".
        parent = cursor.semantic_parent
        visited_parents=set()
        while parent and not parent.kind.is_invalid() and parent.kind.name != 'TRANSLATION_UNIT':
            if parent.hash in visited_parents:
                break
            visited_parents.add(parent.hash)
            if parent.linkage.name == 'INTERNAL':
                scope = tu
                break
            parent = parent.semantic_parent
    location = cursor.location
    source = relative_file(location.file, root)
    evidence = [usr or [source, location.offset, cursor.kind.name, cursor.spelling],
                scope]
    identity = hashlib.sha256(json.dumps(evidence, separators=(',', ':')).encode()).hexdigest()
    return identity, usr or None, linkage, source

def safe(call):
    try:
        return call()
    except Exception:
        return None

def extract(index, connection, command, root, resource_dir):
    source = command['file']
    args = captured_args(command)
    # Resource headers are selected against the extraction library's version.
    if resource_dir:
        args += ['-resource-dir', resource_dir]
    start = time.monotonic()
    # Keep target-relative -I arguments valid without rewriting the original TU.
    previous = Path.cwd()
    os.chdir(root)
    try:
        unit = index.parse(source, args=args)
    finally:
        os.chdir(previous)
    diagnostics = [{'severity': d.severity, 'spelling': d.spelling,
                    'file': relative_file(d.location.file, root),
                    'line': d.location.line, 'column': d.location.column}
                   for d in unit.diagnostics]
    has_errors=any(d['severity']>=3 for d in diagnostics)
    stack = [(unit.cursor, None)]
    identities = {}
    def identify(cursor):
        # Reference cursors repeatedly resolve the same declaration. Clang's
        # cursor hash is only a bucket: verify equality to handle collisions.
        bucket = identities.setdefault(cursor.hash, [])
        for previous_cursor, identity in bucket:
            if cursor == previous_cursor:
                return identity
        identity = cursor_identity(cursor, source, root)
        bucket.append((cursor, identity))
        return identity
    declarations = references = 0
    while stack:
        cursor, owner = stack.pop()
        kind = cursor.kind.name
        physical = relative_file(cursor.location.file, root)
        if kind != 'TRANSLATION_UNIT' and physical is None:
            continue
        current_owner = owner
        if cursor.kind.is_declaration():
            identity, usr, linkage, physical = identify(cursor)
            parent = safe(lambda: identify(cursor.semantic_parent)[0])
            type_value = cursor.type
            record = {'id': identity, 'usr': usr, 'kind': kind, 'name': cursor.spelling,
                      'display_name': cursor.displayname, 'file': physical,
                      'line': cursor.location.line, 'column': cursor.location.column,
                      'offset': cursor.location.offset, 'linkage': linkage,
                      'parent_id': parent, 'type': type_value.spelling,
                      'canonical_type': safe(lambda: type_value.get_canonical().spelling),
                      'size_bytes': safe(type_value.get_size), 'align_bytes': safe(type_value.get_align),
                      'array_count': safe(type_value.get_array_size),
                      'field_offset_bits': safe(cursor.get_field_offsetof) if kind == 'FIELD_DECL' else None,
                      'bitfield_width': safe(cursor.get_bitfield_width) if kind == 'FIELD_DECL' and cursor.is_bitfield() else None,
                      'enum_value': safe(lambda: cursor.enum_value) if kind == 'ENUM_CONSTANT_DECL' else None,
                      'storage_class': safe(lambda: cursor.storage_class.name),
                      'definition': cursor.is_definition(),
                      'definition_extent': [cursor.extent.start.offset, cursor.extent.end.offset],
                      # libclang18 may hang in getMangling on error-recovery
                      # cursors. Do not query ABI names from an invalid AST.
                      'mangled_name': safe(lambda: cursor.mangled_name)
                          if not has_errors and kind in ('FUNCTION_DECL','CXX_METHOD',
                              'CONSTRUCTOR','DESTRUCTOR','CONVERSION_FUNCTION','VAR_DECL') else None,
                      'mangling_unavailable_due_to_diagnostics':has_errors}
            # Prefer a definition over a forward declaration for layout evidence.
            connection.execute('INSERT INTO declarations VALUES(?,?,?,?,?,?,?,?,?) '
                'ON CONFLICT(id) DO UPDATE SET definition=max(definition,excluded.definition), '
                'file=CASE WHEN excluded.definition>definition THEN excluded.file ELSE file END, '
                'line=CASE WHEN excluded.definition>definition THEN excluded.line ELSE line END, '
                'record=CASE WHEN excluded.definition>definition THEN excluded.record ELSE record END',
                (identity, usr, physical, cursor.spelling, cursor.location.line,
                 type_value.spelling, linkage, int(cursor.is_definition()), json.dumps(record)))
            connection.execute('INSERT OR IGNORE INTO observations VALUES(?,?,?,?)',
                               (source, identity, physical, cursor.location.offset))
            declarations += 1
            if kind == 'VAR_DECL' and owner and owner != identity:
                initialization = {'translation_unit':source,'owner_id':owner,
                    'target_id':identity,'target_usr':usr,'target_kind':kind,
                    'target_name':cursor.spelling,'kind':'local-initialization',
                    'ast_node':kind,'file':physical,'line':cursor.location.line,
                    'offset':cursor.location.offset}
                edge_key=hashlib.sha256(json.dumps({k:v for k,v in initialization.items()
                    if k!='translation_unit'},sort_keys=True).encode()).hexdigest()
                connection.execute('INSERT OR IGNORE INTO refs VALUES(?,?,?,?,?)',
                    (edge_key,source,owner,identity,json.dumps(initialization)))
                connection.execute('INSERT OR IGNORE INTO reference_observations VALUES(?,?)',
                                   (source,edge_key))
            if kind in ('FUNCTION_DECL', 'CXX_METHOD', 'CONSTRUCTOR', 'DESTRUCTOR',
                        'CONVERSION_FUNCTION', 'FUNCTION_TEMPLATE', 'VAR_DECL'):
                current_owner = identity
        if cursor.kind.is_reference() or kind in ('DECL_REF_EXPR', 'MEMBER_REF_EXPR', 'CALL_EXPR'):
            target = safe(lambda: cursor.referenced)
            target_id = target_usr = target_kind = target_name = None
            if target:
                target_id, target_usr, _, _ = identify(target)
                target_kind, target_name = target.kind.name, target.spelling
            edge_kind = 'direct-call' if kind == 'CALL_EXPR' and target_kind in (
                'FUNCTION_DECL', 'CXX_METHOD', 'CONSTRUCTOR', 'CONVERSION_FUNCTION') else (
                'indirect-call-unresolved' if kind == 'CALL_EXPR' else 'declaration-reference')
            row = {'translation_unit': source, 'owner_id': owner, 'target_id': target_id,
                   'target_usr': target_usr, 'target_kind': target_kind, 'target_name': target_name,
                   'kind': edge_kind, 'ast_node': kind, 'file': physical,
                   'line': cursor.location.line, 'column': cursor.location.column,
                   'offset': cursor.location.offset,
                   'read_write_access': 'not-classified',
                   'indirect_target_dataflow_proven': False if edge_kind.startswith('indirect') else None}
            # A header's external inline body is one canonical definition.
            # TU-private cursor identities already include their TU scope.
            # Do not replicate identical external body references 156 times.
            key = hashlib.sha256(json.dumps({k:v for k,v in row.items()
                if k != 'translation_unit'}, sort_keys=True).encode()).hexdigest()
            connection.execute('INSERT OR IGNORE INTO refs VALUES(?,?,?,?,?)',
                               (key, source, owner, target_id, json.dumps(row)))
            connection.execute('INSERT OR IGNORE INTO reference_observations VALUES(?,?)',
                               (source,key))
            references += 1
        for child in cursor.get_children():
            stack.append((child, current_owner))
    errors = sum(d['severity'] >= 3 for d in diagnostics)
    connection.execute('INSERT OR REPLACE INTO units VALUES(?,?,?,?)',
        (source, 'parsed-with-errors' if errors else 'parsed',
         json.dumps(diagnostics), json.dumps({'arguments': args,
             'elapsed_seconds': round(time.monotonic()-start, 3),
             'declaration_observations': declarations, 'reference_observations': references})))
    connection.commit()
    del unit
    gc.collect()
    return errors, declarations, references

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT/'factory-output/source-tree/eduke32-master')
    parser.add_argument('--commands', type=Path, default=ROOT/'factory-output/compile_commands.json')
    parser.add_argument('--out', type=Path, default=ROOT/'reports/semantic-index.sqlite')
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--max-units', type=int, default=0)
    args = parser.parse_args()
    try:
        from clang import cindex
    except ImportError:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.with_suffix('.summary.json').write_text(json.dumps({
            'format':'source-first-clang-semantic-index/1',
            'complete_semantic_extraction':False, 'attempted_units':0,
            'error':'libclang dependency unavailable; install dev-requirements.txt',
            'playable_game':False},indent=2),encoding='utf-8')
        print('Semantic extraction unavailable: install dev-requirements.txt',file=sys.stderr)
        return 2
    root = args.root.resolve()
    commands = json.loads(args.commands.read_text(encoding='utf-8'))
    recover(root, [c['file'] for c in commands if c['file'].endswith('.glsl.cpp')])
    selected = commands[:args.max_units or len(commands)]
    # Fail before touching a checkpoint if extraction resources are incompatible.
    resources = extraction_resource_config(cindex)
    resource_dir = resources['resource_dir']
    hasher = hashlib.sha256(Path(__file__).read_bytes())
    fingerprint_toolchain(hasher)
    hasher.update(args.commands.read_bytes())
    # cindex/libclang is a distinct extraction frontend from the emission one.
    hasher.update(Path(cindex.__file__).read_bytes())
    library = Path(cindex.conf.lib._name)
    if library.is_file():
        hasher.update(library.read_bytes())
    hasher.update(json.dumps(resources, sort_keys=True).encode())
    for path in sorted(root.rglob('*')):
        if path.is_file() and path.suffix.lower() in ('.c','.cpp','.cc','.cxx','.h','.hpp','.inc','.inl'):
            hasher.update(path.relative_to(root).as_posix().encode())
            hasher.update(path.read_bytes())
    fingerprint = hasher.hexdigest()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(args.out)
    connection.execute('PRAGMA journal_mode=WAL')
    connection.execute('PRAGMA cache_size=-65536')
    connection.execute('PRAGMA temp_store=MEMORY')
    connection.executescript('''
      CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT);
      CREATE TABLE IF NOT EXISTS units(source TEXT PRIMARY KEY,status TEXT,diagnostics TEXT,record TEXT);
      CREATE TABLE IF NOT EXISTS declarations(id TEXT PRIMARY KEY,usr TEXT,file TEXT,name TEXT,line INTEGER,type TEXT,linkage TEXT,definition INTEGER,record TEXT);
      CREATE TABLE IF NOT EXISTS observations(tu TEXT,id TEXT,file TEXT,offset INTEGER,PRIMARY KEY(tu,id,file,offset));
      CREATE TABLE IF NOT EXISTS refs(id TEXT PRIMARY KEY,tu TEXT,owner TEXT,target TEXT,record TEXT);
      CREATE TABLE IF NOT EXISTS reference_observations(tu TEXT,id TEXT,PRIMARY KEY(tu,id));
      CREATE INDEX IF NOT EXISTS decl_location ON declarations(file,name,line);
      CREATE INDEX IF NOT EXISTS refs_owner ON refs(owner);
    ''')
    existing = connection.execute("SELECT value FROM meta WHERE key='fingerprint'").fetchone()
    if not args.resume or not existing or existing[0] != fingerprint:
        for table in ('units','declarations','observations','refs','reference_observations','meta'):
            connection.execute('DELETE FROM '+table)
        connection.execute('INSERT INTO meta VALUES(?,?)', ('fingerprint', fingerprint))
        connection.commit()
    completed = {row[0] for row in connection.execute('SELECT source FROM units')}
    index = cindex.Index.create()
    for number, command in enumerate(selected, 1):
        source = command['file']
        if source in completed:
            continue
        print(f'EXTRACTING [{number}/{len(selected)}] {source}',flush=True)
        try:
            errors, declarations, references = extract(index, connection, command, root, resource_dir)
            print(f'[{number}/{len(selected)}] {source}: {declarations} declarations, {references} references, {errors} errors', flush=True)
        except Exception as error:
            connection.rollback()
            connection.execute('INSERT OR REPLACE INTO units VALUES(?,?,?,?)',
                               (source,'extraction-failed',json.dumps([{'exception':str(error)}]),'{}'))
            connection.commit()
            print(f'[{number}/{len(selected)}] FAILED {source}: {error}', flush=True)
    statuses = dict(connection.execute('SELECT status,count(*) FROM units GROUP BY status'))
    count = lambda table: connection.execute('SELECT count(*) FROM '+table).fetchone()[0]
    summary = {'format':'source-first-clang-semantic-index/1', 'fingerprint':fingerprint,
        'extraction_backend':'libclang cursor API', 'libclang_package':'18.1.1',
        'emission_frontend_is_distinct':True, 'resource_dir':resource_dir,
        'extraction_resources':resources,
        'target':'x86_64-linux-gnu', 'selected_units':len(commands),
        'attempted_units':count('units'), 'unit_statuses':statuses,
        'declarations':count('declarations'), 'declaration_observations':count('observations'),
        'reference_observations':count('reference_observations'),
        'unique_reference_edges':count('refs'),
        'all_selected_units_parsed_without_errors':statuses.get('parsed',0)==len(commands),
        'complete_semantic_extraction':False,
        'limitations':['No complete indirect-call or callback target dataflow',
                       'Global read/write classification not yet implemented',
                       'Implicit template/lifetime details limited to libclang cursor API',
                       'Clang JSON emitter does not yet attach these USRs automatically'],
        'playable_game':False}
    connection.close()
    target = args.out.with_suffix('.summary.json')
    stage = target.with_suffix('.partial')
    stage.write_text(json.dumps(summary,indent=2),encoding='utf-8')
    os.replace(stage,target)
    print(json.dumps(summary,indent=2))
    return 0 if summary['all_selected_units_parsed_without_errors'] else 2

if __name__ == '__main__':
    sys.exit(main())
