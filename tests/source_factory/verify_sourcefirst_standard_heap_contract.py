"""Configured multi-unit C++ heap requires fresh whole-program ownership proof."""
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from source_standard_heap_contract import create, validate, inspect_index


def run(args, cwd):
    result = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=150)
    assert result.returncode == 0, (args, result.stdout[-3000:], result.stderr[-3000:])
    return result.stdout.strip()


with tempfile.TemporaryDirectory(prefix='eduke-program-heap-') as temporary:
    root = Path(temporary)
    (root / 'unit.cpp').write_text('''
struct Custom {static void *operator new(__SIZE_TYPE__); int value;};
Custom *custom_owner(){return new Custom;}
struct Placement {};
void *operator new(__SIZE_TYPE__,Placement,void *p){return p;}
int *make_value(int x){return new int(x+7);}
int array_value(int n){int *p=new int[n]{};int sum=0;
 for(int i=0;i<n;i++){sum+=p[i];p[i]=i+11;}
 for(int i=0;i<n;i++)sum+=p[i];delete []p;return sum;}
''')
    (root / 'drop.cpp').write_text('void drop_value(int *p){delete p;}\n')
    commands = root / 'commands.json'
    entries = [{'file': name, 'directory': str(root),
                'arguments': ['g++', '-std=gnu++14', '-c', name]}
               for name in ('unit.cpp', 'drop.cpp')]
    commands.write_text(json.dumps(entries))
    out = root / 'out'

    def emit(name):
        run([sys.executable, str(ROOT / 'tools/source_ast_to_js.py'), '--root', str(root),
             '--source', name, '--compile-commands', str(commands), '--out-dir', str(out)], ROOT)
        return json.loads((out / (name + '.manifest.json')).read_text())

    first = emit('unit.cpp')
    row = next(row for row in first['definitions'] if row['name'] == 'make_value')
    assert row['status'] == 'blocked' and 'original provider' in row['reason'], row
    database = root / 'index.sqlite'
    run([sys.executable, str(ROOT / 'tools/source_semantic_index.py'), '--root', str(root),
         '--commands', str(commands), '--out', str(database)], ROOT)
    contract = create(root, commands, database)
    assert contract['evidence']['selected_units'] == 2
    assert len(contract['evidence']['class_specific_source_operators']) == 1
    assert len(contract['evidence']['nonstandard_source_operators']) == 1
    assert validate(root, commands)['original_global_replacements_absent']
    for name in ('unit.cpp', 'drop.cpp'):
        manifest = emit(name)
        assert manifest['standard_heap_contract']['selected_units'] == 2
        rows = {row['name']: row for row in manifest['definitions']}
        for key in (('make_value', 'array_value') if name == 'unit.cpp' else ('drop_value',)):
            assert rows[key]['status'] == 'source-first', rows[key]
        if name == 'unit.cpp':
            assert rows['custom_owner']['status'] == 'blocked', rows['custom_owner']

    (root / 'driver.cpp').write_text('''#include <cstdio>
int *make_value(int),array_value(int);void drop_value(int*);
int main(){for(int x=0;x<512;x++){int *p=make_value(x);
 printf("%d,%d\\n",*p,array_value(x%31));drop_value(p);}}
''')
    # Avoid linking the intentionally undefined custom allocator fixture.
    native_unit = root / 'native-unit.cpp'
    native_unit.write_text((root / 'unit.cpp').read_text().replace(
        'Custom *custom_owner(){return new Custom;}', ''))
    executable = root / ('native.exe' if os.name == 'nt' else 'native')
    run(['clang++', '-std=c++14', str(native_unit), str(root / 'drop.cpp'),
         str(root / 'driver.cpp'), '-o', str(executable)], root)
    expected = run([str(executable)], root).splitlines()
    runner = root / 'run.mjs'
    runner.write_text('import * as m from ' + json.dumps((out / 'unit.cpp.mjs').as_uri()) + ';\n'
        + 'import {drop_value} from ' + json.dumps((out / 'drop.cpp.mjs').as_uri()) + ';\n'
        + 'for(let x=0;x<512;x++){const p=m.make_value(x);console.log(`${p[0]},${m.array_value(x%31)}`);drop_value(p);}\n')
    assert run(['node', str(runner)], root).splitlines() == expected

    def reject(callback, expected):
        try:
            callback()
        except ValueError as error:
            assert expected in str(error), str(error)
        else:
            raise AssertionError('stale/unsafe heap proof accepted: ' + expected)

    # Any added original source/header invalidates the published proof.
    reject(lambda: validate(root, commands), 'source/header inputs changed')
    native_unit.unlink()
    (root / 'driver.cpp').unlink()
    assert validate(root, commands)
    commands.write_text(json.dumps(entries) + '\n')
    reject(lambda: validate(root, commands), 'commands changed')
    commands.write_text(json.dumps(entries))
    # Index incompleteness and original replacement ownership fail closed.
    connection = sqlite3.connect(database)
    connection.execute("UPDATE units SET status='parsed-with-errors' WHERE source='drop.cpp'")
    connection.commit()
    reject(lambda: validate(root, commands), 'every selected unit')
    connection.execute("UPDATE units SET status='parsed' WHERE source='drop.cpp'")
    original = {'kind': 'FUNCTION_DECL', 'name': 'operator new', 'file': 'unit.cpp',
                'line': 1, 'canonical_type': 'void *(unsigned long)'}
    connection.execute('INSERT INTO declarations VALUES(?,?,?,?,?,?,?,?,?)',
        ('test-original', '', 'unit.cpp', 'operator new', 1, original['canonical_type'],
         'EXTERNAL', 0, json.dumps(original)))
    connection.commit()
    reject(lambda: inspect_index(database, commands, contract['semantic_fingerprint']),
           'original global allocation operators require source providers')
    connection.close()
    print('PASS 1024 native/JavaScript values: configured cross-unit new/delete, source ownership, stale-input and incomplete-index rejection')
