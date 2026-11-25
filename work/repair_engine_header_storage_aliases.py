"""Merge duplicate immutable header storage in the exact active engine shards."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import recover_browser_component as component
from browser_target_closure import active_exports, build
from source_fragment_storage import audit, header_storage_identity

SOURCE = 'source/build/src/engine.cpp'
ALIASES = {
    'pow2char': ('pow2char__header_global_712730224f5e2862', '9db8937f37d9', 'b109dbbe1c92'),
    'fix16_one': ('fix16_one__header_global_1ff90da45b33318d', 'f313c6453b01', '8b5d59287bf2'),
    'fix16_half': ('fix16_half__header_global_32abdaf38138b574', '188401a550aa', '8b5d59287bf2'),
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def storage_block(text, row):
    name = row['name']
    cell = row.get('private_storage', {}).get('binding')
    pattern = rf'^export const {name} = [^\n]+\nfunction (?P<address>__cxx_static_address_\w+)\(\) \{{\n.*?^\}}\n'
    if cell:
        pattern += rf'^export function {cell}\(\) \{{ return (?P=address)\(\); \}}\n'
    match, = re.finditer(pattern, text, re.M | re.S)
    names = {name: 'original_name', match['address']: 'original_address'}
    if cell:
        names[cell] = 'original_cell'
    normalized = re.sub(r'\b\w+\b', lambda token: names.get(token[0], token[0]), match[0])
    return match, normalized


def repair():
    owner = component.OUT / (SOURCE + '.mjs')
    manifest = owner.with_suffix('.manifest.json')
    before = owner.read_bytes()
    previous = manifest.read_bytes()
    doc = json.loads(previous)
    exports = active_exports(owner)
    definitions = {row['name']: row for row in doc['definitions'] if row['status'] == 'source-first'}
    staged = []
    for name, (canonical, old_prefix, kept_prefix) in ALIASES.items():
        legacy, kept = [
            next(row for row in doc['module_fragments'] if row['sha256'].startswith(prefix))
            for prefix in (old_prefix, kept_prefix)]
        old_path, kept_path = [component.OUT / row['module'] for row in (legacy, kept)]
        old, original = old_path.read_bytes(), kept_path.read_bytes()
        assert sha(old) == legacy['sha256'] and sha(original) == kept['sha256']
        first, second = definitions[name], definitions[canonical]
        identity = header_storage_identity(first, SOURCE)
        assert identity and identity == header_storage_identity(second, SOURCE)
        assert first['original_type'] == second['original_type'] and first['linkage'] == second['linkage'] == 'internal'
        assert first['original_type'].startswith('const ')
        match, normalized = storage_block(old.decode('utf-8'), first)
        _, expected = storage_block(original.decode('utf-8'), second)
        assert normalized == expected
        body = old.decode('utf-8')
        body = body[:match.start()] + body[match.end():]
        assert not re.search(r'\b' + match['address'] + r'\b', body)
        pairs = [canonical + ' as ' + name]
        if first.get('private_storage'):
            pairs.append(second['private_storage']['binding'] + ' as ' + first['private_storage']['binding'])
        # The original function bodies may read the constant. Both the local
        # reads and the facade exports bind to the surviving declaration.
        clause = '{ ' + ', '.join(pairs) + ' } from ' + json.dumps('./' + kept_path.name) + ';\n'
        updated = ('import ' + clause + 'export ' + clause + body).encode('utf-8')
        replacement = old_path.with_name(old_path.name.replace(old_prefix, sha(updated)[:12]))
        assert not replacement.exists() and before.count(old_path.name.encode()) == 1
        assert not any(old_path.name.encode() in p.read_bytes()
                       for p in component.OUT.rglob('*.mjs') if p not in (owner, old_path))
        assert not any(legacy['sha256'].encode() in p.read_bytes()
                       for p in component.OUT.rglob('*.manifest.json') if p != manifest)
        assert not any(dep.get('implementation_sha256') == legacy['sha256']
                       for fragment in doc['module_fragments'] for dep in fragment.get('imports', []))
        first['original_storage_alias'] = {'binding': canonical, 'native_header': identity[1], 'byte_offset': identity[2]}
        staged.append((legacy, old_path, old, replacement, updated))

    rendered = before
    try:
        for row, old_path, _, replacement, updated in staged:
            replacement.write_bytes(updated)
            subprocess.run(['node', '--check', str(replacement)], check=True)
            rendered = rendered.replace(old_path.name.encode(), replacement.name.encode())
            row.update(module=replacement.relative_to(component.OUT).as_posix(), sha256=sha(updated))
        owner.write_bytes(rendered)
        manifest.write_text(json.dumps(doc, indent=2) + '\n', encoding='utf-8')
        assert active_exports(owner) == exports
        assert not audit(component.OUT)
    except Exception:
        owner.write_bytes(before)
        manifest.write_bytes(previous)
        for _, _, _, replacement, _ in staged:
            replacement.unlink(missing_ok=True)
        raise

    for _, old_path, old, _, _ in staged:
        history = component.BASE / 'owner-history' / sha(old)
        history.mkdir(parents=True, exist_ok=True)
        old_path.replace(history / old_path.name)
    report = {'source': SOURCE, 'aliases': {name: spec[0] for name, spec in ALIASES.items()},
              'fragments': [{'old_sha256': sha(old), 'new_sha256': sha(new)}
                            for _, _, old, _, new in staged],
              'duplicate_original_header_storage': 0, 'gameplay_verified': False}
    (ROOT / 'reports/nov25-engine-header-storage-aliases.json').write_text(
        json.dumps(report, indent=2) + '\n', encoding='utf-8')
    build(component.OUT, component.OUT, component.BASE / 'reports/browser-closure.json', SOURCE, 'enginePreInit')
    component.checkpoint()


if __name__ == '__main__':
    with component.component_lock():
        repair()
