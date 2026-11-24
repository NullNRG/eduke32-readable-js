"""Apply the newly compiled native array extent to the hash-pinned save shard."""
import hashlib
import argparse
import json
import shlex
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import recover_browser_component as component
from source_first_global_link import exported_names
from source_first_toolchain import frontend_config
from source_ast_stream import run_clang_ast
from source_offset_constants import OffsetConstants, nodes

SOURCE = 'source/duke3d/src/savegame.cpp'
OLD = 'ceb4cf605a670d0e5c9873204f28eac5941bbca261b1b94837dba0bbb5464a44'
HELPER = 'ARRAY_SIZE__header_0e1d3f51f54b'
VALUE = 'svgm_anmisc'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def prove_extent():
    row = next(record for record in json.loads(component.COMMANDS.read_bytes()) if record['file'] == SOURCE)
    arguments = iter((row.get('arguments') or shlex.split(row['command']))[1:])
    flags = []
    for option in arguments:
        if option in ('-o', '-MF', '-MT', '-MQ'):
            next(arguments)
        elif option not in ('-c', '-MMD', '-MP', '-M', '-MM', SOURCE) and not option.startswith(
                ('-O', '-flto', '-march', '-mfpmath', '-funswitch', '-fomit', '-fjump')):
            flags.append(option)
    frontend, target = frontend_config()
    flags += ['-Iplatform/Windows/include', '-Iplatform/Windows/include/SDL2',
              '-Wno-unknown-warning-option', *target]
    ast, _ = run_clang_ast([frontend, '-x', 'c++', '-Xclang', '-ast-dump=json', '-Xclang',
                            '-ast-dump-filter=' + VALUE, '-fsyntax-only', *flags, SOURCE],
                           cwd=component.SOURCE)
    evaluator = OffsetConstants(component.SOURCE, SOURCE, ['-x', 'c++', *flags])
    evaluator.bind(ast)
    decl = next(n for n in ast if n.get('name') == VALUE)
    calls = [n for n in nodes(decl) if '_source_constant_array_extent' in n]
    if len(calls) != 1:
        raise ValueError('Expected one Clang-proven original save extent')
    call = calls[0]
    callee = call['inner'][0]['inner'][0]
    argument = call['inner'][1]['inner'][0]['referencedDecl']
    return {'verified': True, 'source': SOURCE, 'source_sha256': sha((component.SOURCE / SOURCE).read_bytes()),
            'array_extent': call['_source_constant_array_extent'], 'argument': argument['name'],
            'callee': callee['referencedDecl']['name'], 'definition': decl['name'],
            'call_offset': callee['range']['begin']['offset'], 'native_type': call['type']['desugaredQualType'],
            'evaluation': evaluator.report}


def main():
    proof = prove_extent()
    source = component.SOURCE / SOURCE
    original = source.read_bytes()
    offset = proof['call_offset']
    if (not proof.get('verified') or proof['source'] != SOURCE or proof['definition'] != VALUE
            or proof['native_type'] != 'unsigned long' or proof['callee'] != 'ARRAY_SIZE'
            or proof['argument'] != 'g_origins' or proof['source_sha256'] != sha(original)
            or not original[offset:].startswith(b'ARRAY_SIZE(g_origins)')
            or proof['evaluation']['by_kind'] != {'array_extents': 1}):
        raise ValueError('Missing exact original Clang array-extent proof')

    root = component.OUT
    owner = root / (SOURCE + '.mjs')
    manifest = owner.with_suffix('.manifest.json')
    facade_before, manifest_before = owner.read_bytes(), manifest.read_bytes()
    doc = json.loads(manifest_before)
    shard = next(row for row in doc['module_fragments'] if row['sha256'] == OLD)
    old_path = root / shard['module']
    old = old_path.read_bytes()
    if sha(old) != OLD or VALUE not in shard['exports']:
        raise ValueError('Unexpected source shard')
    if any(old_path.name.encode() in module.read_bytes()
           for module in root.rglob('*.mjs') if module != owner and module != old_path):
        raise ValueError('A consumer directly imports the old shard')
    if any(OLD.encode() in other.read_bytes()
           for other in root.rglob('*.manifest.json') if other != manifest):
        raise ValueError('A consumer pins the old implementation bytes')
    if manifest_before.count(OLD.encode()) != 1 or facade_before.count(old_path.name.encode()) != 1:
        raise ValueError('Unexpected source owner references to the old shard')

    existing = f'"cnt": i64({HELPER}(g_origins))'.encode()
    entries = [line for line in old.splitlines(keepends=True) if line.startswith(f'export const {VALUE} = '.encode())]
    if len(entries) != 1 or entries[0].count(existing) != 1 or old.count(existing) != 1:
        raise ValueError('Expected one exact original array-size expression')
    if b'cStaticPointer(() => cPointerOffset(g_origins, 0, 8))' not in entries[0]:
        raise ValueError('The original deferred pointer expression is required')
    extent = int(proof['array_extent'])
    replacement = f'"cnt": i64(u64({extent}n))'.encode()
    updated = old.replace(existing, replacement)
    new_sha = sha(updated)
    new_path = old_path.with_name(old_path.name.replace(OLD[:12], new_sha[:12]))
    if new_path.exists():
        raise FileExistsError(new_path)
    shard.update(module=new_path.relative_to(root).as_posix(), sha256=new_sha)
    declaration = next(row for row in doc['definitions'] if row['name'] == VALUE)
    declaration['source_references'].remove(HELPER)
    declaration['native_array_extent_refresh'] = {'array': 'g_origins', 'extent': extent,
                                                   'source_offset': offset, 'previous_shard_sha256': OLD}
    backup = component.BASE / 'owner-history' / OLD
    backup.mkdir(parents=True, exist_ok=True)
    (backup / old_path.name).write_bytes(old)
    (backup / 'owner.mjs').write_bytes(facade_before)
    (backup / 'owner.manifest.json').write_bytes(manifest_before)
    exports = exported_names(owner)
    try:
        new_path.write_bytes(updated)
        subprocess.run(['node', '--check', str(new_path)], check=True)
        owner.write_bytes(facade_before.replace(old_path.name.encode(), new_path.name.encode()))
        newline = '\r\n' if b'\r\n' in manifest_before else '\n'
        manifest.write_bytes((json.dumps(doc, indent=2) + '\n').replace('\n', newline).encode())
        if exported_names(owner) != exports:
            raise ValueError('Savegame source exports changed')
    except BaseException:
        owner.write_bytes(facade_before)
        manifest.write_bytes(manifest_before)
        new_path.unlink(missing_ok=True)
        raise
    old_path.unlink()
    component.checkpoint()
    print(json.dumps({'source': SOURCE, 'array': VALUE, 'extent': extent,
                      'superseded_sha256': OLD, 'replacement_sha256': new_sha}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prove-only', action='store_true', help='Report the original native extent without changing modules')
    if parser.parse_args().prove_only:
        print(json.dumps(prove_extent(), indent=2))
    else:
        with component.component_lock():
            main()
