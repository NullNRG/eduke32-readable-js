#!/usr/bin/env python3
"""Deterministic, evidence-preserving whole-inventory blocker reports.

This audits manifests; it does not execute the compiler or certify gameplay.
Clang JSON AST pointer IDs are deliberately never declaration identities. A
missing USR remains missing, and uncertain providers remain ambiguous.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict, deque
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sqlite3
import sys

from source_first_missing_map import components, dependency_names, family, load_units

ROOT = Path(__file__).resolve().parents[1]


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def stable_identity(source, row):
    """Only explicit Clang USRs or existing proven ODR evidence deduplicate TUs."""
    usr = row.get('clang_usr') or row.get('usr')
    if isinstance(usr, str) and usr.startswith('c:'):
        scope = source if row.get('linkage') == 'internal' else None
        return 'usr:' + digest([scope, usr]), {'kind': 'clang-usr', 'value': usr,
                                               'translation_unit_scope': scope}
    odr = row.get('odr_inline')
    required = ('source_header', 'source_offset', 'enclosing_record', 'type', 'semantic_sha256')
    if (row.get('linkage') != 'internal' and isinstance(odr, dict)
            and all(odr.get(k) for k in required if k != 'source_offset')
            and isinstance(odr.get('source_offset'), int) and odr['source_offset'] >= 0
            and re.fullmatch(r'[a-fA-F0-9]{64}', str(odr.get('semantic_sha256', '')))):
        evidence = {k: odr[k] for k in required}
        return 'odr:' + digest(evidence), {'kind': 'proven-header-odr', 'value': evidence}
    return None, None


def observed_references(row):
    if isinstance(row.get('source_references'), list):
        return sorted(set(row['source_references'])), 'clang-source-references'
    refs = set(dependency_names(row)) | set(row.get('external_imports') or [])
    return sorted(refs), 'partial-manifest-references'


class SemanticEvidence:
    """Match definitions by exact source evidence, without name-only guesses."""
    def __init__(self, path, units):
        self.by_location = defaultdict(list)
        self.by_offset = defaultdict(list)
        self.metadata = {'requested': path is not None, 'available': False,
                         'matched_observations': 0, 'unmatched_observations': 0}
        if path is None:
            return
        self.metadata['path'] = str(path.resolve())
        if not path.is_file():
            self.metadata['error'] = 'semantic index does not exist'
            return
        wanted_names = {row.get('source_name', row.get('name'))
                        for unit in units.values() for row in unit.get('definitions', [])}
        try:
            connection = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True)
            try:
                fingerprint = connection.execute("SELECT value FROM meta WHERE key='fingerprint'").fetchone()
                statuses = dict(connection.execute('SELECT source,status FROM units'))
                self.metadata.update({'available': True, 'fingerprint': fingerprint[0] if fingerprint else None,
                    'unit_status_counts': dict(sorted(Counter(statuses.values()).items())),
                    'complete_semantic_extraction': False})
                for tu, name, usr, encoded in connection.execute(
                    'SELECT o.tu,d.name,d.usr,d.record FROM observations o '
                    'JOIN declarations d ON d.id=o.id WHERE d.definition=1 AND d.usr IS NOT NULL'):
                    if tu not in units or name not in wanted_names:
                        continue
                    record = json.loads(encoded)
                    if not record.get('definition') or not usr.startswith('c:'):
                        continue
                    record = {**record, 'extraction_unit_status': statuses.get(tu)}
                    # SQL location columns can still describe an earlier forward
                    # declaration. The stored definition record is authoritative.
                    file = record.get('file')
                    signature = record.get('type')
                    self.by_location[(tu, file, name, record.get('line'), signature)].append(record)
                    self.by_offset[(tu, file, name, record.get('offset'), signature)].append(record)
            finally:
                connection.close()
        except (OSError, sqlite3.Error, ValueError, KeyError) as error:
            self.metadata.update(available=False, error=str(error))
            self.by_location.clear()
            self.by_offset.clear()

    def enrich(self, source, row):
        file = row.get('physical_source', source)
        name = row.get('source_name', row.get('name'))
        signature = row.get('original_type')
        odr = row.get('odr_inline') or {}
        file = odr.get('source_header', file)
        candidates = []
        if isinstance(row.get('line'), int) and signature:
            candidates = self.by_location.get((source, file, name, row['line'], signature), [])
        if not candidates and isinstance(odr.get('source_offset'), int) and signature:
            candidates = self.by_offset.get((source, file, name, odr['source_offset'], signature), [])
        candidates = {candidate['id']: candidate for candidate in candidates}
        if len(candidates) != 1:
            self.metadata['unmatched_observations'] += 1
            return row, None
        candidate = next(iter(candidates.values()))
        linkage = candidate.get('linkage')
        normalized_linkage = 'internal' if linkage == 'INTERNAL' else 'external' if linkage in (
            'EXTERNAL', 'UNIQUE_EXTERNAL') else None
        if row.get('linkage') and normalized_linkage and row['linkage'] != normalized_linkage:
            self.metadata['unmatched_observations'] += 1
            return row, None
        self.metadata['matched_observations'] += 1
        enriched = {**row, 'clang_usr': candidate['usr']}
        if normalized_linkage:
            enriched['linkage'] = normalized_linkage
        evidence = {key: candidate.get(key) for key in ('id', 'usr', 'kind', 'file', 'line',
            'offset', 'type', 'linkage', 'size_bytes', 'align_bytes', 'field_offset_bits',
            'bitfield_width', 'extraction_unit_status')}
        evidence['match_method'] = 'exact-tu-file-name-type-and-line-or-header-offset'
        evidence['index_fingerprint'] = self.metadata.get('fingerprint')
        evidence['native_parity_verified'] = False
        return enriched, evidence


def closure(start, graph):
    seen = set(start)
    queue = deque(sorted(seen))
    while queue:
        for child in sorted(graph.get(queue.popleft(), ())):
            if child not in seen:
                seen.add(child)
                queue.append(child)
    return seen


def collect(manifests, compile_report=None, entry='app_main', selected_sources=None, semantic_index=None):
    units = load_units(manifests, compile_report)
    semantics = SemanticEvidence(semantic_index, units)
    nodes = {}
    names = defaultdict(set)
    raw_count = 0
    for source, unit in sorted(units.items()):
        for ordinal, row in enumerate(unit.get('definitions', [])):
            raw_count += 1
            row, semantic_evidence = semantics.enrich(source, row)
            key, identity = stable_identity(source, row)
            # Inventory keys locate observations, not stable declarations. Keep
            # overloads and same-line anonymous declarations independently.
            key = key or 'observation:' + digest([source, ordinal, row.get('name'),
                row.get('kind'), row.get('line'), row.get('original_type')])
            refs, coverage = observed_references(row)
            observation = {'translation_unit': source, 'file': row.get('physical_source', source),
                'line': row.get('line'), 'ast_node': row.get('kind'),
                'name': row.get('name'), 'original_name': row.get('source_name', row.get('name')),
                'original_type': row.get('original_type'), 'linkage': row.get('linkage'),
                'status': row.get('status'), 'reason': row.get('reason'),
                'source_references': refs, 'reference_coverage': coverage,
                'missing_dependencies': dependency_names(row),
                'source_reference_error': row.get('source_reference_error')}
            if semantic_evidence:
                observation['semantic_declaration'] = semantic_evidence
            if key not in nodes:
                nodes[key] = {'id': key, 'declaration_identity': identity, 'observations': []}
            nodes[key]['observations'].append(observation)
            for name in {row.get('name'), row.get('source_name')} - {None}:
                names[name].add(key)
    for node in nodes.values():
        node['status'] = ('source-first' if all(r['status'] == 'source-first'
                          for r in node['observations']) else 'blocked')
        node['semantic_execution_verified'] = False
    graph = {key: set() for key in nodes}
    reverse = {key: set() for key in nodes}
    edges = []
    edges_by_node = defaultdict(list)
    unresolved = []
    for key, node in sorted(nodes.items()):
        for observation in node['observations']:
            src = observation['translation_unit']
            for name in observation['source_references']:
                candidates = sorted(names.get(name, ()))
                # TU-local definitions must never become providers in other TUs.
                candidates = [candidate for candidate in candidates if any(
                    o['linkage'] != 'internal' or o['translation_unit'] == src
                    for o in nodes[candidate]['observations'])]
                private = [candidate for candidate in candidates if any(
                    o['linkage'] == 'internal' and o['translation_unit'] == src
                    for o in nodes[candidate]['observations'])]
                if private:
                    candidates = private
                resolution = ('unowned' if not candidates else 'ambiguous' if len(candidates) > 1
                    else 'emitted-provider' if nodes[candidates[0]]['status'] == 'source-first'
                    else 'blocked-provider')
                edge = {'from': key, 'symbol': name, 'translation_unit': src,
                    'provider_candidates': candidates, 'resolution': resolution,
                    'provider_linkage_verified': bool(candidates) and all(
                        o['linkage'] in ('internal', 'external')
                        for candidate in candidates for o in nodes[candidate]['observations']),
                    'coverage': observation['reference_coverage'],
                    'is_missing_dependency': name in observation['missing_dependencies']}
                edges.append(edge)
                edges_by_node[key].append(edge)
                if len(candidates) == 1:
                    graph[key].add(candidates[0])
                    reverse[candidates[0]].add(key)
                if resolution in ('unowned', 'ambiguous'):
                    unresolved.append(edge)
    graph_complete = all(o['reference_coverage'] == 'clang-source-references'
        and not o['source_reference_error'] for n in nodes.values() for o in n['observations'])
    entry_candidates = sorted(names.get(entry, ()))
    reachable = closure(entry_candidates, graph) if len(entry_candidates) == 1 else set()
    blockers = []
    for key, node in sorted(nodes.items()):
        if node['status'] == 'source-first':
            continue
        observations = node['observations']
        reasons = sorted({o['reason'] or 'unknown' for o in observations if o['status'] != 'source-first'})
        row = {**node, 'file': observations[0]['file'], 'line': observations[0]['line'],
            'definition': observations[0]['original_name'], 'ast_node': observations[0]['ast_node'],
            'failure_families': sorted({family(reason) for reason in reasons}), 'reasons': reasons,
            'missing_dependencies': sorted({d for o in observations for d in o['missing_dependencies']}),
            'dependencies': edges_by_node[key],
            'affected_callers': sorted(reverse[key]),
            'reachable_from_boot_entry': key in reachable}
        blockers.append(row)
    groups = defaultdict(set)
    for row in blockers:
        for category in row['failure_families']:
            groups[category].add(row['id'])
    roots = []
    for category, members in groups.items():
        affected = closure(members, reverse)
        roots.append({'family': category, 'blocked_definitions': len(members),
            'members': sorted(members), 'affected_referencing_definitions': len(affected),
            'affected_boot_definitions': len(affected & reachable),
            'ranking_is_observed_dependency_impact_not_guaranteed_recovery': True})
    roots.sort(key=lambda row: (-row['affected_boot_definitions'],
        -row['affected_referencing_definitions'], -row['blocked_definitions'], row['family']))
    provider_groups = defaultdict(set)
    for edge in edges:
        if edge['is_missing_dependency'] and edge['resolution'] != 'emitted-provider':
            provider_groups[(edge['symbol'], tuple(edge['provider_candidates']), edge['resolution'])].add(edge['from'])
    provider_roots = [{'symbol': symbol, 'provider_candidates': list(providers),
        'resolution': resolution, 'direct_affected_definition_count': len(members),
        'direct_affected_definitions': sorted(members),
        'direct_affected_boot_definition_count': len(members & reachable)}
        for (symbol, providers, resolution), members in provider_groups.items()]
    provider_roots.sort(key=lambda row: (-row['direct_affected_boot_definition_count'],
        -row['direct_affected_definition_count'], row['symbol'], row['provider_candidates']))
    selected = sorted(set(selected_sources or units))
    successful_sources = set()
    revisions = Counter()
    compile_data = json.loads(compile_report.read_text(encoding='utf-8')) if compile_report and compile_report.is_file() else {}
    for batch in compile_data.get('batch_results', []):
        if batch.get('status') == 'ok':
            successful_sources.update(batch.get('sources', []))
            revisions[batch.get('compiler_fingerprint') or 'unattested'] += len(batch.get('sources', []))
    uniform = (bool(units) and successful_sources == set(units) and len(revisions) == 1
        and 'unattested' not in revisions and compile_data.get('uniform_compiler_revision_verified') is True)
    meta = {'format': 'source-first-comprehensive-reports/1',
        'measurement': 'manifest audit; execution and semantic parity are not established',
        'manifest_root': str(manifests.resolve()),
        'semantic_index_evidence': semantics.metadata,
        'freshness': 'attested-compilation' if uniform else 'historical-or-unattested-manifests',
        'uniform_compiler_revision_verified': uniform,
        'compiler_revision_source_counts': dict(sorted(revisions.items())),
        'manifest_content_sha256': digest(units),
        'compile_report_sha256': hashlib.sha256(compile_report.read_bytes()).hexdigest() if compile_data else None,
        'compile_revision_attestation_is_not_manifest_byte_provenance': True,
        'selected_source_inventory_supplied': selected_sources is not None,
        'selected_source_units': len(selected), 'audited_source_units': len(units),
        'selected_not_audited': sorted(set(selected) - set(units)),
        'audited_not_selected': sorted(set(units) - set(selected)),
        'all_selected_units_audited': bool(units) and selected_sources is not None and set(selected) == set(units),
        'raw_definition_observations': raw_count, 'deduplicated_definition_records': len(nodes),
        'raw_blocked_definition_observations': sum(o['status'] != 'source-first'
            for n in nodes.values() for o in n['observations']),
        'raw_emitted_definition_observations': sum(o['status'] == 'source-first'
            for n in nodes.values() for o in n['observations']),
        'stable_declaration_identity_records': sum(n['declaration_identity'] is not None for n in nodes.values()),
        'identity_evidence_record_counts': dict(sorted(Counter(
            n['declaration_identity']['kind'] if n['declaration_identity'] else 'unavailable'
            for n in nodes.values()).items())),
        'observations_without_linkage_evidence': sum(o['linkage'] not in ('internal', 'external')
            for n in nodes.values() for o in n['observations']),
        'blocked_definition_records': len(blockers),
        'emitted_is_not_semantic_recovery': True,
        'source_reference_graph_complete_in_manifests': graph_complete,
        'indirect_call_graph_complete': False,
        'whole_program_dependency_graph_complete': False,
        'provider_resolution_is_candidate_analysis_not_executable_link_validation': True,
        'edge_semantics': 'observed source references; includes globals, types and possible function calls',
        'affected_callers_semantics': 'direct referencing definitions, not proof of direct call expressions',
        'identity_limitation': 'No cross-revision declaration comparison is claimed for observation IDs; Clang pointer IDs are ignored.',
        'game_boot_verified': False}
    boot_unresolved = [edge for edge in unresolved if edge['from'] in reachable]
    boot_unverified_linkage = [edge for edge in edges if edge['from'] in reachable
                              and not edge['provider_linkage_verified']]
    boot = {**meta, 'entry': entry, 'entry_candidates': entry_candidates,
        'entry_resolution': 'unique' if len(entry_candidates) == 1 else 'missing' if not entry_candidates else 'ambiguous',
        'reachable_definitions': sorted(reachable),
        'blocked_definitions': [row for row in blockers if row['id'] in reachable],
        'unresolved_references': boot_unresolved,
        'references_without_verified_provider_linkage': boot_unverified_linkage,
        'closure_is_partial': not graph_complete or bool(boot_unresolved)
                              or bool(boot_unverified_linkage) or len(entry_candidates) != 1,
        'complete_original_startup_dependency_graph': False,
        'strict_boot_gate': 'INCOMPLETE',
        'runtime_execution_trace': None}
    return {
        'all-blockers.json': {**meta, 'blockers': blockers},
        'root-causes.json': {**meta, 'root_causes': roots, 'missing_provider_workgroups': provider_roots},
        'dependency-graph.json': {**meta, 'nodes': [nodes[key] for key in sorted(nodes)],
            'edges': edges, 'unresolved_references': unresolved,
            'cyclic_components': components(graph),
            'source_units': [{'source': source, 'manifest_present': source in units,
                             'selected_by_make': source in selected,
                             'definition_observations': len(units.get(source, {}).get('definitions', []))}
                             for source in sorted(set(selected) | set(units))],
            'compilation_failure_batches': [batch for batch in compile_data.get('batch_results', [])
                                            if batch.get('status') != 'ok']},
        'boot-blockers.json': boot,
    }


def write_reports(out, reports):
    out.mkdir(parents=True, exist_ok=True)
    for name, document in reports.items():
        target = out / name
        stage = target.with_suffix(target.suffix + '.partial')
        stage.write_text(json.dumps(document, indent=2, sort_keys=True) + '\n', encoding='utf-8')
        os.replace(stage, target)
    buffer = io.StringIO(newline='')
    fields = ['id', 'declaration_identity', 'file', 'line', 'definition', 'ast_node',
        'failure_families', 'reasons', 'missing_dependencies', 'provider_candidates',
        'affected_callers', 'reachable_from_boot_entry']
    writer = csv.DictWriter(buffer, fieldnames=fields)
    writer.writeheader()
    for row in reports['all-blockers.json']['blockers']:
        record = {field: row.get(field) for field in fields}
        record['provider_candidates'] = sorted({candidate for edge in row['dependencies']
                                               for candidate in edge['provider_candidates']})
        writer.writerow({key: json.dumps(value, sort_keys=True) if isinstance(value, (list, dict))
                         else value for key, value in record.items()})
    target = out / 'all-blockers.csv'
    stage = target.with_suffix('.csv.partial')
    stage.write_text(buffer.getvalue(), encoding='utf-8')
    os.replace(stage, target)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifests', type=Path, default=ROOT/'factory-output/source-first/globally-linked')
    parser.add_argument('--compile-report', type=Path)
    parser.add_argument('--compile-commands', type=Path, default=ROOT/'factory-output/compile_commands.json')
    parser.add_argument('--entry', default='app_main')
    parser.add_argument('--semantic-index', type=Path)
    parser.add_argument('--out', type=Path, default=ROOT/'reports')
    args = parser.parse_args()
    selected = None
    if args.compile_commands.is_file():
        selected = [row['file'] for row in json.loads(args.compile_commands.read_text(encoding='utf-8'))]
    reports = collect(args.manifests, args.compile_report, args.entry, selected, args.semantic_index)
    write_reports(args.out, reports)
    metadata = reports['all-blockers.json']
    print(json.dumps({key: metadata[key] for key in ('freshness', 'audited_source_units',
        'raw_definition_observations', 'deduplicated_definition_records', 'blocked_definition_records',
        'stable_declaration_identity_records', 'uniform_compiler_revision_verified')}, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
