"""Remove the unreferenced second emission of engine.cpp's original pow2char."""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import recover_browser_component as component
from source_first_global_link import exported_names
from source_fragment_storage import audit

SOURCE = 'source/build/src/engine.cpp'
NAME = 'pow2char__header_global_712730224f5e2862'
CELL = '__cxx_private_cell_3dbbd23dc4df226e70c52d7b'
ADDRESS = '__cxx_static_address_3dbbd23dc4df226e70c52d7b'
RETAIN = 'b109dbbe1c929ae64f9c876b68a78d3aca562b835f672388d7658c3053724fa9'
REMOVE = 'bb4ab6fdc1075f3760a09c89e60ab4d4623b73533166c84e8a40f14eaa75c74d'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def storage_block(text):
    pattern = rf'^export const {NAME} = [^\n]+\nfunction {ADDRESS}\(\) \{{.*?^export function {CELL}\(\) \{{[^\n]+\n'
    matches = list(re.finditer(pattern, text, re.M | re.S))
    if len(matches) != 1:
        raise ValueError('Expected exactly one original array and its address accessors')
    return matches[0]


def main(apply):
    root = component.OUT
    owner = root / (SOURCE + '.mjs')
    manifest = owner.with_suffix('.manifest.json')
    owner_bytes, manifest_bytes = owner.read_bytes(), manifest.read_bytes()
    document = json.loads(manifest_bytes)
    rows = document['module_fragments']
    kept, dropped = ([row for row in rows if row['sha256'] == sha] for sha in (RETAIN, REMOVE))
    if len(kept) != 1 or len(dropped) != 1:
        raise ValueError('Both original content-addressed shards are required')
    kept, dropped = kept[0], dropped[0]
    active, obsolete = (root / row['module'] for row in (kept, dropped))
    kept_bytes, old_bytes = active.read_bytes(), obsolete.read_bytes()
    if (digest(kept_bytes), digest(old_bytes)) != (RETAIN, REMOVE):
        raise ValueError('Original storage shard bytes changed')
    if not {NAME, CELL} <= set(kept['reexports']) or {NAME, CELL} & set(dropped['reexports']):
        raise ValueError('The duplicate array must be hidden from the owner facade')
    first, second = kept_bytes.decode('utf-8'), old_bytes.decode('utf-8')
    if storage_block(first).group().replace('\r\n', '\n') != storage_block(second).group().replace('\r\n', '\n'):
        raise ValueError('Duplicate initializer or accessor differs from original owner')
    start, end = storage_block(second).span()
    body = second[:start] + second[end:]
    if any(re.search(rf'(?<![\w$]){symbol}(?![\w$])', body) for symbol in (NAME, CELL, ADDRESS)):
        raise ValueError('A retained declaration references the duplicate storage')
    for path in root.rglob('*.mjs'):
        if path != owner and obsolete.name.encode() in path.read_bytes():
            raise ValueError('A module directly imports the replacement shard: ' + str(path))
    for path in root.rglob('*.manifest.json'):
        if path != manifest and REMOVE.encode() in path.read_bytes():
            raise ValueError('A consumer requires the exact old implementation bytes: ' + str(path))
    live_metadata = {key: value for key, value in document.items()
                     if key != 'record_array_storage_attestations'}
    if json.dumps(live_metadata).count(REMOVE) != 1 or owner_bytes.count(obsolete.name.encode()) != 1:
        raise ValueError('Unexpected same-owner references to the replaced shard')
    new_bytes = body.encode('utf-8')
    new_hash = digest(new_bytes)
    replacement = obsolete.with_name(obsolete.name.replace(REMOVE[:12], new_hash[:12]))
    if replacement.exists():
        raise FileExistsError(replacement)
    report = {'source': SOURCE, 'original_storage': NAME, 'original_address_cell': CELL,
              'retained_sha256': RETAIN, 'superseded_sha256': REMOVE, 'replacement_sha256': new_hash,
              'historical_array_attestations_retained': len(document.get('record_array_storage_attestations', [])),
              'recovered_definitions': 0, 'gameplay_verified': False, 'applied': apply}
    if not apply:
        print(json.dumps(report, indent=2))
        return
    dropped.update(module=replacement.relative_to(root).as_posix(), sha256=new_hash)
    backup = component.BASE / 'owner-history' / REMOVE
    backup.mkdir(parents=True, exist_ok=True)
    (backup / obsolete.name).write_bytes(old_bytes)
    (backup / 'owner.mjs').write_bytes(owner_bytes)
    (backup / 'owner.manifest.json').write_bytes(manifest_bytes)
    before = exported_names(owner)
    try:
        replacement.write_bytes(new_bytes)
        subprocess.run(['node', '--check', str(replacement)], check=True)
        owner.write_bytes(owner_bytes.replace(obsolete.name.encode(), replacement.name.encode()))
        newline = '\r\n' if b'\r\n' in manifest_bytes else '\n'
        manifest.write_bytes((json.dumps(document, indent=2) + '\n').replace('\n', newline).encode())
        if exported_names(owner) != before:
            raise ValueError('Verified source exports changed')
        if any(row['source'] == SOURCE for row in audit(root)):
            raise ValueError('Original engine storage ownership is still duplicated')
    except BaseException:
        owner.write_bytes(owner_bytes)
        manifest.write_bytes(manifest_bytes)
        replacement.unlink(missing_ok=True)
        raise
    obsolete.unlink()
    component.checkpoint()
    (ROOT / 'reports/nov24-engine-header-storage.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Apply to the exact matching source shards')
    args = parser.parse_args()
    if args.apply:
        with component.component_lock():
            main(True)
    else:
        main(False)
