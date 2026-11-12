"""Native parity for array storage across different optional JS prototypes."""
import copy
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from source_first_global_link import storage_import_error
from source_record_array_upgrade import upgrade


def run(args, ok=True):
    result = subprocess.run(list(map(str, args)), cwd=ROOT, capture_output=True,
                            text=True, timeout=180)
    assert (result.returncode == 0) == ok, (args, result.stdout[-2000:], result.stderr[-3000:])
    return result.stdout if ok else result.stderr


with tempfile.TemporaryDirectory(prefix='source-array-data-') as directory:
    root = Path(directory)
    original = root / 'original'
    original.mkdir()
    output = root / 'owner'
    (original / 'types.hpp').write_text('''#pragma once
template<typename T> struct Vec { T x,y; int sum() const { return x+y; } };
extern Vec<int> shared[4];
struct Wrap { Vec<int> child; int flag; }; extern Wrap wrapped[4];
''')
    (original / 'one.cpp').write_text('''#include "types.hpp"
Vec<int> shared[4]; Wrap wrapped[4];
extern "C" int owner_read() { Vec<int> local{1,2}; return local.sum()+shared[0].x+shared[1].y+wrapped[1].child.sum()+wrapped[0].flag; }
''')
    (original / 'two.cpp').write_text('''#include "types.hpp"
extern "C" int step(int input) {
    wrapped[0].child.x+=input;wrapped[0].child.y-=input*2;wrapped[0].flag+=3;
    wrapped[1]=wrapped[0];wrapped[1].child.x+=7;
    shared[0].x+=input; shared[0].y-=input*3;
    Vec<int> *alias=&shared[1];
    shared[1]=shared[0]; alias->x+=2;
    return shared[0].x+shared[1].x*31+shared[1].y+(alias==&shared[1]);
}
''')
    (original / 'main.cpp').write_text('''#include <cstdio>
extern "C" int owner_read(); extern "C" int step(int);
int main(){for(int n=-128;n<128;n++){int value=step(n);printf("%d %d\\n",value,owner_read());}}
''')
    run(['clang++', original / 'one.cpp', original / 'two.cpp', original / 'main.cpp', '-o', root / 'native'])
    expected = run([root / 'native']).splitlines()
    compiler = [sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', original,
                '--require-record-layouts', '--header-dependency-closure', '--ast-cache-dir', root / 'cache']
    run([*compiler, '--source', 'one.cpp', '--out-dir', output])
    module = output / 'one.cpp.mjs'
    manifest = module.with_suffix('.manifest.json')
    owner = json.loads(manifest.read_text())
    for row in owner['definitions']:
        if row['name'] not in ('shared','wrapped'):continue
        storage=row['object_storage']
        for key in ('native_element_layout','record_array_data_view','native_nested_layout','record_array_nested_data_view'):
            storage.pop(key,None)
    manifest.write_text(json.dumps(owner, indent=2))
    before = module.read_bytes()
    index = root / 'providers.json'
    index.write_text(json.dumps({'shared': 'one.cpp', 'wrapped': 'one.cpp', 'owner_read': 'one.cpp'}))
    consumer_args = [*compiler, '--source', 'two.cpp', '--out-dir', root / 'consumer',
                     '--project-symbols', index, '--import-root', output]
    failure = run(consumer_args, ok=False)
    assert 'identical contiguous Clang storage' in failure, failure
    try:
        upgrade(module, '0' * 64, root / 'history')
    except ValueError:
        pass
    else:
        raise AssertionError('Changed original owner accepted')
    proof = upgrade(module, hashlib.sha256(before).hexdigest(), root / 'history')
    assert proof['changed'] and not proof['source_code_changed'] and proof['source_definitions_recovered'] == 0
    assert module.read_bytes() == before
    owner = json.loads(manifest.read_text())
    run(consumer_args)
    consumer = json.loads((root / 'consumer/two.cpp.manifest.json').read_text())
    assert consumer['blocked'] == 0, consumer
    dependency = next(row for row in consumer['imports'] if row['name'] == 'shared')
    storage = next(row['object_storage'] for row in owner['definitions'] if row['name'] == 'shared')
    assert dependency['schema_sha256'] != storage['schema_sha256'], 'Fixture must require the data-only native layout join'
    units = {'one.cpp': {'manifest': owner, 'module': module}}
    assert storage_import_error(dependency, units) is None
    nested=next(row for row in consumer['imports'] if row['name']=='wrapped')
    nested_owner=next(row['object_storage'] for row in owner['definitions'] if row['name']=='wrapped')
    assert nested['native_element_layout']!=nested_owner['native_element_layout'], 'Nested JS prototype must distinguish the legacy layout'
    assert nested['native_nested_layout']==nested_owner['native_nested_layout']
    assert nested.get('record_array_nested_data_view') and not nested_owner.get('record_array_nested_data_view')
    assert storage_import_error(nested, units) is None
    wrong=copy.deepcopy(nested);wrong['native_nested_layout']['sha256']='0'*64
    assert storage_import_error(wrong, units)
    required=copy.deepcopy(nested);required.pop('record_array_nested_data_view')
    assert storage_import_error(required, units), 'Nested method requirements cannot use a data-only view'
    for key, value in [('record_array_nested_data_view', 'invalid'), ('stride', 16),
                       ('original_type', 'Other<int>[4]'), ('dimensions', [5]),
                       ('native_nested_layout', {'abi': 'source-native-record-array-layout/2', 'sha256': '0' * 64})]:
        wrong = copy.deepcopy(dependency)
        wrong[key] = value
        assert storage_import_error(wrong, units), (key, wrong)
    runner = root / 'run.mjs'
    runner.write_text('import {step} from ' + json.dumps((root / 'consumer/two.cpp.mjs').as_uri())
                      + ';import {owner_read,shared,wrapped} from ' + json.dumps(module.as_uri())
                      + ';const alias=shared[1],prototype=Object.getPrototypeOf(alias),child=wrapped[1].child,childPrototype=Object.getPrototypeOf(child);'
                      + 'for(let n=-128;n<128;n++){const value=step(n);'
                      + 'if(shared[1]!==alias||Object.getPrototypeOf(alias)!==prototype)throw Error("Original array identity/prototype changed");'
                      + 'if(wrapped[1].child!==child||Object.getPrototypeOf(child)!==childPrototype)throw Error("Nested native alias/prototype changed");'
                      + 'console.log([value,owner_read()].join(" "));}')
    assert run(['node', runner]).splitlines() == expected
print('PASS: 512 native/JS array results, original alias/prototype preserved, byte-identical provider upgrade, incompatible layouts/types/extents/prototype requirements rejected')
