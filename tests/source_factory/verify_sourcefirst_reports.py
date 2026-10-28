#!/usr/bin/env python3
"""Check evidence, identity, linkage, graph closure and deterministic reporting."""
import csv
import json
import sqlite3
from pathlib import Path
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'tools'))
from source_first_reports import collect, write_reports


def unit(root, source, rows):
    path = root / (source + '.manifest.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({'source': source, 'definitions': rows}), encoding='utf-8')


def definition(name, status='blocked', refs=(), **kwargs):
    return {'name': name, 'kind': 'FunctionDecl', 'line': 12, 'status': status,
            'reason': 'unlinked identifiers: ' + ', '.join(refs),
            'source_references': list(refs), 'unresolved_references': list(refs), **kwargs}


with tempfile.TemporaryDirectory() as temp:
    root = Path(temp)
    manifests = root / 'manifests'
    odr = {'source_header': 'include/shared.h', 'source_offset': 0,
           'enclosing_record': '(free inline function)', 'type': 'int ()',
           'semantic_sha256': '1234' * 16}
    unit(manifests, 'a.cpp', [definition('app_main', refs=('middle', 'local', 'over', 'shared')),
        definition('local', 'source-first', linkage='internal'),
        definition('over', original_type='int (int)'),
        definition('over', original_type='int (float)'),
        definition('shared', 'source-first', odr_inline=odr),
        definition('sameusr', 'source-first', usr='c:@F@sameusr#'),
        definition('legacy1', ast_id='0x1234')])
    unit(manifests, 'b.cpp', [definition('middle', refs=('last',)),
        definition('local', 'source-first', linkage='internal'),
        definition('shared', 'source-first', odr_inline=odr),
        definition('sameusr', 'source-first', usr='c:@F@sameusr#'),
        definition('legacy2', ast_id='0x1234')])
    unit(manifests, 'c.cpp', [definition('last', refs=('middle', 'unknown'))])
    selected = ['a.cpp', 'b.cpp', 'c.cpp', 'not-attempted.cpp']
    reports = collect(manifests, selected_sources=selected)
    inventory = reports['all-blockers.json']
    graph = reports['dependency-graph.json']
    boot = reports['boot-blockers.json']
    assert inventory['raw_definition_observations'] == 13
    assert inventory['deduplicated_definition_records'] == 11
    assert inventory['stable_declaration_identity_records'] == 2
    assert inventory['freshness'] == 'historical-or-unattested-manifests'
    assert inventory['selected_not_audited'] == ['not-attempted.cpp']
    assert not inventory['all_selected_units_audited']
    assert len(graph['cyclic_components']) == 1
    by_name = {n['observations'][0]['name']: n for n in graph['nodes']}
    main = by_name['app_main']['id']
    local = next(e for e in graph['edges'] if e['from'] == main and e['symbol'] == 'local')
    assert len(local['provider_candidates']) == 1
    provider = next(n for n in graph['nodes'] if n['id'] == local['provider_candidates'][0])
    assert provider['observations'][0]['translation_unit'] == 'a.cpp'
    overloaded = next(e for e in graph['edges'] if e['from'] == main and e['symbol'] == 'over')
    assert overloaded['resolution'] == 'ambiguous'
    assert len(overloaded['provider_candidates']) == 2
    assert by_name['last']['id'] in boot['reachable_definitions']  # No depth-2 truncation.
    assert any(e['symbol'] == 'unknown' for e in boot['unresolved_references'])
    assert boot['closure_is_partial'] and boot['strict_boot_gate'] == 'INCOMPLETE'
    assert by_name['legacy1']['declaration_identity'] is None
    assert by_name['legacy2']['declaration_identity'] is None
    assert len(by_name['shared']['observations']) == 2
    assert len(by_name['sameusr']['observations']) == 2
    out = root / 'reports'
    write_reports(out, reports)
    first = {p.name: p.read_bytes() for p in out.iterdir()}
    write_reports(out, collect(manifests, selected_sources=selected))
    assert first == {p.name: p.read_bytes() for p in out.iterdir()}
    with (out / 'all-blockers.csv').open(newline='', encoding='utf-8') as stream:
        rows = list(csv.DictReader(stream))
    assert len(rows) == inventory['blocked_definition_records']
    assert json.loads(next(r for r in rows if r['definition'] == 'app_main')['missing_dependencies']) == ['local', 'middle', 'over', 'shared']

    # A revision assertion without per-batch fingerprints is not fresh proof.
    attest = root / 'compile.json'
    attest.write_text(json.dumps({'uniform_compiler_revision_verified': True,
        'batch_results': [{'status': 'ok', 'sources': ['a.cpp', 'b.cpp', 'c.cpp']}]}))
    assert not collect(manifests, attest)['all-blockers.json']['uniform_compiler_revision_verified']
    attest.write_text(json.dumps({'uniform_compiler_revision_verified': True,
        'batch_results': [{'status': 'ok', 'compiler_fingerprint': 'revision1',
                          'sources': ['a.cpp', 'b.cpp', 'c.cpp']}]}))
    measured = collect(manifests, attest)['all-blockers.json']
    assert measured['uniform_compiler_revision_verified']
    assert measured['compile_revision_attestation_is_not_manifest_byte_provenance']

    # Historical rows without complete references must leave closure unknown.
    unit(manifests, 'legacy.cpp', [{'name': 'legacy', 'status': 'source-first', 'kind': 'FunctionDecl'}])
    measured = collect(manifests, attest)
    assert not measured['all-blockers.json']['uniform_compiler_revision_verified']
    assert not measured['dependency-graph.json']['source_reference_graph_complete_in_manifests']
    assert measured['boot-blockers.json']['closure_is_partial']
    missing = collect(manifests, entry='absent')['boot-blockers.json']
    assert missing['entry_resolution'] == 'missing' and missing['strict_boot_gate'] == 'INCOMPLETE'

    semantic_manifests = root / 'semantic-manifests'
    unit(semantic_manifests, 'one.cpp', [definition('exact', original_type='int ()'),
        definition('wrong_signature', original_type='int ()'),
        definition('ambiguous', original_type='int ()'),
        definition('private', original_type='int ()', linkage='internal')])
    unit(semantic_manifests, 'two.cpp', [definition('private', original_type='int ()', linkage='internal')])
    database = root / 'semantic.sqlite'
    connection = sqlite3.connect(database)
    connection.executescript('''
        CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT);
        CREATE TABLE units(source TEXT PRIMARY KEY,status TEXT,diagnostics TEXT,record TEXT);
        CREATE TABLE declarations(id TEXT PRIMARY KEY,usr TEXT,file TEXT,name TEXT,line INTEGER,type TEXT,linkage TEXT,definition INTEGER,record TEXT);
        CREATE TABLE observations(tu TEXT,id TEXT,file TEXT,offset INTEGER);
    ''')
    connection.execute('INSERT INTO meta VALUES(?,?)', ('fingerprint', 'semantic-revision'))
    for source in ('one.cpp', 'two.cpp'):
        connection.execute('INSERT INTO units VALUES(?,?,?,?)', (source, 'parsed', '[]', '{}'))
    for identity, source, name, signature, linkage, usr in (
        ('exact-id', 'one.cpp', 'exact', 'int ()', 'EXTERNAL', 'c:@F@exact#'),
        ('wrong-id', 'one.cpp', 'wrong_signature', 'float ()', 'EXTERNAL', 'c:@F@wrong#'),
        ('ambiguous-id1', 'one.cpp', 'ambiguous', 'int ()', 'EXTERNAL', 'c:@F@amb1#'),
        ('ambiguous-id2', 'one.cpp', 'ambiguous', 'int ()', 'EXTERNAL', 'c:@F@amb2#'),
        ('private-one', 'one.cpp', 'private', 'int ()', 'INTERNAL', 'c:header@F@private#'),
        ('private-two', 'two.cpp', 'private', 'int ()', 'INTERNAL', 'c:header@F@private#')):
        record = {'id': identity, 'usr': usr, 'name': name, 'file': source, 'line': 12,
                  'offset': 100, 'type': signature, 'kind': 'FUNCTION_DECL',
                  'linkage': linkage, 'definition': True, 'size_bytes': 1, 'align_bytes': 1}
        # Deliberately stale SQL line/file columns exercise definition-record matching.
        connection.execute('INSERT INTO declarations VALUES(?,?,?,?,?,?,?,?,?)',
            (identity, usr, 'forward.h', name, 1, signature, linkage, 1, json.dumps(record)))
        connection.execute('INSERT INTO observations VALUES(?,?,?,?)', (source, identity, source, 100))
    connection.commit()
    connection.close()
    semantic_report = collect(semantic_manifests, semantic_index=database)['all-blockers.json']
    assert semantic_report['semantic_index_evidence']['matched_observations'] == 3
    assert semantic_report['identity_evidence_record_counts']['clang-usr'] == 3
    semantic_rows = semantic_report['blockers']
    exact = next(row for row in semantic_rows if row['definition'] == 'exact')
    assert exact['declaration_identity']['value'] == 'c:@F@exact#'
    assert exact['observations'][0]['semantic_declaration']['index_fingerprint'] == 'semantic-revision'
    assert len([row for row in semantic_rows if row['definition'] == 'private']) == 2
    assert all(row['declaration_identity'] is None for row in semantic_rows
               if row['definition'] in ('wrong_signature', 'ambiguous'))
    missing_db = collect(semantic_manifests, semantic_index=root/'missing.sqlite')['all-blockers.json']
    assert missing_db['semantic_index_evidence']['available'] is False
    corrupt = root / 'corrupt.sqlite'
    corrupt.write_text('not sqlite', encoding='utf-8')
    assert not collect(semantic_manifests, semantic_index=corrupt)['all-blockers.json']['semantic_index_evidence']['available']

print('PASS: comprehensive reports preserve identity gaps, ODR deduplication, private linkage, ambiguity, SCCs, observed boot closure, revision evidence, deterministic JSON/CSV and exact SQLite semantic matching')
