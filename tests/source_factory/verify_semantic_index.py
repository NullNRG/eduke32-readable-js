#!/usr/bin/env python3
"""Real libclang semantic/ABI extraction and checkpoint regression tests.

The fixtures use no system headers. Only the external Clang executable probe
and expensive sysroot fingerprint are isolated in orchestration tests; cursor
extraction, SQLite storage, source identities, layouts and references are real.
"""
from contextlib import ExitStack, redirect_stdout
import io
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import time
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
try:
    from clang import cindex
except ImportError:
    raise SystemExit('FAIL: libclang dependency unavailable; install dev-requirements.txt')
import source_semantic_index as semantic


SCHEMA = '''
  CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT);
  CREATE TABLE units(source TEXT PRIMARY KEY,status TEXT,diagnostics TEXT,record TEXT);
  CREATE TABLE declarations(id TEXT PRIMARY KEY,usr TEXT,file TEXT,name TEXT,line INTEGER,type TEXT,linkage TEXT,definition INTEGER,record TEXT);
  CREATE TABLE observations(tu TEXT,id TEXT,file TEXT,offset INTEGER,PRIMARY KEY(tu,id,file,offset));
  CREATE TABLE refs(id TEXT PRIMARY KEY,tu TEXT,owner TEXT,target TEXT,record TEXT);
  CREATE TABLE reference_observations(tu TEXT,id TEXT,PRIMARY KEY(tu,id));
'''


def command(source):
    return {'file': source, 'directory': '.',
            'arguments': ['clang++', '-std=c++14', '-O2', '-MMD', '-MF', source+'.d',
                          '-c', source, '-o', source+'.o']}


def records(connection, name=None):
    rows = connection.execute('SELECT record FROM declarations' + (' WHERE name=?' if name else ''),
                              (name,) if name else ())
    return [json.loads(row[0]) for row in rows]


start = time.monotonic()
with tempfile.TemporaryDirectory() as temp, ExitStack() as cleanup:
    root = Path(temp).resolve()
    library_version = semantic.libclang_version(cindex)
    assert 'clang version 18.' in library_version, library_version
    resources = root/'18'
    (resources/'include').mkdir(parents=True)
    (resources/'include/stddef.h').write_text('/* fixture resource header */\n')
    resource_config = semantic.validate_resource_dir(resources, library_version)
    assert resource_config['major_version_matches'] and resource_config['resource_files'] == 1
    mismatch = root/'23'
    (mismatch/'include').mkdir(parents=True)
    (mismatch/'include/stddef.h').write_text('/* mismatched resource header */\n')
    try:
        semantic.validate_resource_dir(mismatch, library_version)
        raise AssertionError('Mismatched resource major accepted')
    except RuntimeError as error:
        assert 'version mismatch' in str(error)
    with patch.dict(semantic.os.environ, {'EDUKE32_LIBCLANG_RESOURCE_DIR':str(mismatch)}):
        try:
            semantic.extraction_resource_config(cindex)
            raise AssertionError('Explicit incompatible resource path silently ignored')
        except RuntimeError as error:
            assert 'version mismatch' in str(error)
    # Real builtin-header parsing exercises the intrinsic failure family which
    # a header-free C++ fixture cannot detect.
    actual_resources = semantic.extraction_resource_config(cindex)
    intrinsic_unit = cindex.Index.create().parse('intrinsics.cpp',
        args=['-x','c++','--target=x86_64-linux-gnu','-ffreestanding',
              '-resource-dir', actual_resources['resource_dir']],
        unsaved_files=[('intrinsics.cpp','#include <immintrin.h>\n__m128i shift(__m128i a) { return _mm_slli_epi32(a, 2); }\n')])
    assert not [d.spelling for d in intrinsic_unit.diagnostics if d.severity >= 3], list(intrinsic_unit.diagnostics)
    (root / 'fixture.h').write_text('''#pragma once
typedef unsigned long word_t;
struct Layout {
  char tag;
  int count;
  unsigned flags : 3;
  unsigned other : 5;
  void *payload;
  long wide;
  int items[3];
};
union Payload { int integer; double real; };
enum Mode { FIRST = 7, SECOND, LAST = 19 };
static int private_state = 3;
static inline int private_step(int private_parameter) {
  int local_slot = private_parameter + private_state;
  return local_slot;
}
inline int shared(int value) { return private_step(value); }
int external_api(int);
using Callback = int (*)(int);
inline int caller(Callback callback) { return external_api(shared(callback(5))); }
struct Box { int value; Box(int input) : value(input) {} };
''', encoding='utf-8')
    (root / 'one.cpp').write_text('''#include "fixture.h"
int external_api(int value) { return value * 2; }
int call_one(Callback callback) { return caller(callback); }
int local_initializer() { int initialized_local = external_api(4); return initialized_local; }
int construct_box() { Box box(6); return box.value; }
''', encoding='utf-8')
    (root / 'two.cpp').write_text('''#include "fixture.h"
int call_two(Callback callback) { return caller(callback); }
''', encoding='utf-8')
    (root / 'bad.cpp').write_text('''#include "fixture.h"
int broken() { return absent_original_symbol; }
''', encoding='utf-8')
    connection = sqlite3.connect(root / 'direct.sqlite')
    cleanup.callback(connection.close)
    connection.executescript(SCHEMA)
    index = cindex.Index.create()
    # Insert the forward declaration first, then its source definition.
    first = semantic.extract(index, connection, command('two.cpp'), root, None)
    api_id_before = records(connection, 'external_api')[0]['id']
    second = semantic.extract(index, connection, command('one.cpp'), root, None)
    assert first[0] == second[0] == 0, (first, second)
    assert dict(connection.execute('SELECT source,status FROM units')) == {
        'one.cpp': 'parsed', 'two.cpp': 'parsed'}
    api = records(connection, 'external_api')
    assert len(api) == 1 and api[0]['usr'].startswith('c:')
    assert api[0]['id'] == api_id_before and api[0]['definition']
    assert api[0]['file'] == 'one.cpp' and api[0]['line'] == 2, api
    assert connection.execute('SELECT file,line FROM declarations WHERE id=?',
                              (api_id_before,)).fetchone() == ('one.cpp', 2)
    shared = records(connection, 'shared')
    assert len(shared) == 1 and shared[0]['file'] == 'fixture.h'
    assert connection.execute('SELECT count(DISTINCT tu) FROM observations WHERE id=?',
                              (shared[0]['id'],)).fetchone()[0] == 2
    for name in ('private_state', 'private_step'):
        private = records(connection, name)
        assert len(private) == 2, private
        assert len({row['usr'] for row in private}) == 1, private
        assert len({row['id'] for row in private}) == 2, private
        assert all(row['linkage'] == 'INTERNAL' for row in private)
    for name in ('private_parameter', 'local_slot'):
        scoped = records(connection, name)
        assert len(scoped) == 2, (name, scoped)
        assert len({row['usr'] for row in scoped}) == 1, (name, scoped)
        assert len({row['id'] for row in scoped}) == 2, (name, scoped)
        assert {row['parent_id'] for row in scoped} == {row['id'] for row in records(connection, 'private_step')}
    layouts = records(connection, 'Layout')
    assert len(layouts) == 1 and layouts[0]['size_bytes'] == 48 and layouts[0]['align_bytes'] == 8, layouts
    offsets = {'tag': 0, 'count': 32, 'flags': 64, 'other': 67,
               'payload': 128, 'wide': 192, 'items': 256}
    for name, offset in offsets.items():
        field = records(connection, name)[0]
        assert field['field_offset_bits'] == offset, (name, field)
        assert field['parent_id'] == layouts[0]['id'], (name, field)
    assert records(connection, 'flags')[0]['bitfield_width'] == 3
    assert records(connection, 'other')[0]['bitfield_width'] == 5
    assert records(connection, 'payload')[0]['size_bytes'] == 8
    assert records(connection, 'wide')[0]['size_bytes'] == 8  # Linux LP64, even on Windows.
    assert records(connection, 'items')[0]['array_count'] == 3
    assert records(connection, 'items')[0]['size_bytes'] == 12
    assert records(connection, 'Payload')[0]['size_bytes'] == 8
    assert records(connection, 'integer')[0]['field_offset_bits'] == 0
    assert records(connection, 'real')[0]['field_offset_bits'] == 0
    assert {name: records(connection, name)[0]['enum_value'] for name in ('FIRST', 'SECOND', 'LAST')} == {
        'FIRST': 7, 'SECOND': 8, 'LAST': 19}
    edges = [json.loads(row[0]) for row in connection.execute('SELECT record FROM refs')]
    calls = [edge for edge in edges if edge['kind'] == 'direct-call']
    assert any(edge['target_name'] == 'external_api' and edge['owner_id'] for edge in calls), calls
    constructor_ids = {row['id'] for row in records(connection, 'Box') if row['kind'] == 'CONSTRUCTOR'}
    assert constructor_ids and any(edge['target_id'] in constructor_ids
                                   and edge['target_kind'] == 'CONSTRUCTOR' for edge in calls), calls
    function_id = records(connection, 'local_initializer')[0]['id']
    local_id = records(connection, 'initialized_local')[0]['id']
    assert any(edge['owner_id'] == function_id and edge['target_id'] == local_id
               and edge['kind'] == 'local-initialization' for edge in edges), edges
    assert any(edge['owner_id'] == local_id and edge['target_id'] == api_id_before
               and edge['kind'] == 'direct-call' for edge in edges), edges
    indirect = [edge for edge in edges if edge['kind'] == 'indirect-call-unresolved']
    assert indirect and all(edge['indirect_target_dataflow_proven'] is False for edge in indirect), edges
    assert all(edge['read_write_access'] == 'not-classified' for edge in edges
               if edge['kind'] != 'local-initialization')
    caller_id = records(connection, 'caller')[0]['id']
    header_calls = [identity for identity, encoded in connection.execute(
        'SELECT id,record FROM refs WHERE owner=? AND target=?', (caller_id, api_id_before))
        if json.loads(encoded)['kind'] == 'direct-call']
    assert len(header_calls) == 1
    assert connection.execute('SELECT count(DISTINCT tu) FROM reference_observations WHERE id=?',
                              (header_calls[0],)).fetchone()[0] == 2
    assert all(not Path(row['file']).is_absolute() for row in records(connection) if row.get('file'))
    assert semantic.relative_name(str(root.parent / 'outside.h'), root) is None
    assert semantic.relative_name('fixture.h', root) == 'fixture.h'
    assert semantic.relative_name.cache_info().hits > 0
    before = tuple(connection.execute('SELECT count(*) FROM '+table).fetchone()[0]
                   for table in ('declarations', 'observations', 'refs', 'reference_observations'))
    identities_before = dict(connection.execute('SELECT usr,id FROM declarations WHERE linkage="EXTERNAL"'))
    semantic.extract(index, connection, command('one.cpp'), root, None)
    after = tuple(connection.execute('SELECT count(*) FROM '+table).fetchone()[0]
                  for table in ('declarations', 'observations', 'refs', 'reference_observations'))
    assert before == after, (before, after)
    assert identities_before == dict(connection.execute('SELECT usr,id FROM declarations WHERE linkage="EXTERNAL"'))
    errors, _, _ = semantic.extract(index, connection, command('bad.cpp'), root, None)
    assert errors > 0
    bad = connection.execute('SELECT status,diagnostics FROM units WHERE source="bad.cpp"').fetchone()
    assert bad[0] == 'parsed-with-errors'
    assert any('absent_original_symbol' in diagnostic.get('spelling', '')
               for diagnostic in json.loads(bad[1]))
    broken = records(connection, 'broken')[0]
    assert broken['mangled_name'] is None
    assert broken['mangling_unavailable_due_to_diagnostics'] is True
    connection.close()

    # Exercise real CLI orchestration with tiny fixtures, avoiding an unrelated
    # host sysroot rehash. No Clang cursor, AST, declaration or SQLite writes are mocked.
    commands = root / 'compile_commands.json'
    commands.write_text(json.dumps([command('one.cpp'), command('two.cpp')]), encoding='utf-8')
    output = root / 'cli.sqlite'
    base_args = ['source_semantic_index.py', '--root', str(root), '--commands', str(commands),
                 '--out', str(output)]

    def invoke(extra):
        with patch.object(sys, 'argv', base_args + extra), \
             patch.object(semantic, 'frontend_config', return_value=('fixture-clang++', ['--target=x86_64-linux-gnu'])), \
             patch.object(semantic, 'fingerprint_toolchain', side_effect=lambda h: h.update(b'fixture-toolchain')), \
             patch.object(semantic, 'extraction_resource_config', side_effect=lambda _:
                          semantic.validate_resource_dir(resources, library_version)), redirect_stdout(io.StringIO()):
            result = semantic.main()
        return result, json.loads(output.with_suffix('.summary.json').read_text(encoding='utf-8'))

    result, partial = invoke(['--max-units', '1'])
    assert result == 2 and partial['selected_units'] == 2 and partial['attempted_units'] == 1, partial
    assert not partial['all_selected_units_parsed_without_errors']
    result, complete = invoke(['--resume'])
    assert result == 0 and complete['attempted_units'] == 2, complete
    assert complete['all_selected_units_parsed_without_errors']
    assert complete['complete_semantic_extraction'] is False
    assert complete['playable_game'] is False
    # Resume preserves the exact index; coverage cannot become true merely by
    # parsing a smaller max-units prefix again.
    result, resumed = invoke(['--resume', '--max-units', '1'])
    assert result == 0 and resumed['fingerprint'] == complete['fingerprint']
    assert resumed['declarations'] == complete['declarations']
    # A changed source invalidates the checkpoint before partial extraction.
    (root/'two.cpp').write_text((root/'two.cpp').read_text()+'\nint fresh_symbol = 9;\n')
    result, changed = invoke(['--resume', '--max-units', '1'])
    assert result == 2 and changed['fingerprint'] != complete['fingerprint']
    assert changed['attempted_units'] == 1 and not changed['all_selected_units_parsed_without_errors']
    # Resource bytes are compiler inputs even when the directory/version stays
    # constant; modifying a header must invalidate a resumed checkpoint.
    (resources/'include/stddef.h').write_text('/* changed fixture resource header */\n')
    result, header_changed = invoke(['--resume', '--max-units', '1'])
    assert result == 2 and header_changed['fingerprint'] != changed['fingerprint']
    assert header_changed['attempted_units'] == 1
    # A real error in the first scheduled TU must not strand later source units.
    commands.write_text(json.dumps([command('bad.cpp'), command('one.cpp'), command('two.cpp')]), encoding='utf-8')
    result, with_errors = invoke(['--resume'])
    assert result == 2 and with_errors['selected_units'] == with_errors['attempted_units'] == 3
    assert with_errors['unit_statuses'] == {'parsed': 2, 'parsed-with-errors': 1}, with_errors
    assert not with_errors['all_selected_units_parsed_without_errors']

print('PASS: real libclang USRs, header deduplication, TU-local identities, LP64 layouts/bitfields/unions/enums, source references, diagnostics, idempotence, coverage and fingerprinted resume '
      f'({time.monotonic()-start:.2f}s)')
