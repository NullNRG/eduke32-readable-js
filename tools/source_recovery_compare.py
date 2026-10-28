#!/usr/bin/env python3
"""Compare historical blockers by proven Clang declaration identity.

Emission is measured separately from executable recovery. Observation IDs,
names, counts, and absent declarations never constitute recovery evidence.
An optional execution report must bind declaration tests to the exact current
manifest and to hashes of JS, native references, and test logs.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict
import hashlib
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def sha256(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1048576), b''):
            value.update(chunk)
    return value.hexdigest()


def read_json(path):
    path = Path(path)
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding='utf-8'))


def snapshot_json(path):
    """Read each atomic report once so its evidence hash matches parsed bytes."""
    try:
        content = Path(path).read_bytes()
    except FileNotFoundError:
        return None, None
    return json.loads(content.decode('utf-8')), hashlib.sha256(content).hexdigest()


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    staging = path.with_suffix(path.suffix + '.tmp')
    staging.write_text(json.dumps(value, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    os.replace(staging, path)


def declaration_key(node):
    identity = node.get('declaration_identity') or {}
    usr = identity.get('value')
    if identity.get('kind') != 'clang-usr' or not isinstance(usr, str) or not usr.startswith('c:'):
        return None
    scope = identity.get('translation_unit_scope')
    internal = any(item.get('linkage') == 'internal' or
                   item.get('semantic_declaration', {}).get('linkage') == 'INTERNAL'
                   for item in node.get('observations', []))
    if internal and not isinstance(scope, str):
        return None
    if scope is not None and (not isinstance(scope, str) or not scope):
        return None
    return usr, scope.replace('\\', '/') if scope is not None else None


def index_nodes(graph):
    result = defaultdict(list)
    unknown = []
    for node in (graph or {}).get('nodes', []):
        key = declaration_key(node)
        if key is None:
            unknown.append(node)
        else:
            result[key].append(node)
    return result, unknown


def source_emitted(nodes):
    return bool(nodes) and all(node.get('status') == 'source-first' for node in nodes)


def dependency_closed(graph, nodes):
    ids = {node.get('id') for node in nodes}
    if any(node.get('missing_dependencies') or
           any(item.get('missing_dependencies') or item.get('source_reference_error')
               for item in node.get('observations', [])) for node in nodes):
        return False
    return all(edge.get('provider_linkage_verified') is True
               for edge in (graph or {}).get('edges', []) if edge.get('from') in ids)


def execution_identities(report, current, project_root):
    """Validate a declaration-specific report; aggregate fixture totals are insufficient."""
    verified = set()
    rejected = []
    if not report:
        return verified, ['No hash-bound declaration-specific execution report supplied.']
    if (report.get('format') != 'source-first-declaration-execution/1' or
            report.get('implementation_manifest_sha256') != (current or {}).get('manifest_content_sha256') or
            not (current or {}).get('manifest_content_sha256')):
        return verified, ['Execution report does not bind the exact current implementation manifest.']
    for row in report.get('entries', []):
        key = declaration_key({'declaration_identity': row.get('declaration_identity')})
        flags = ('native_parity_verified', 'linked_implementation_verified', 'runtime_dependencies_verified')
        if key is None or not all(row.get(flag) is True for flag in flags):
            rejected.append('Incomplete declaration execution evidence: ' + str(row.get('declaration_identity')))
            continue
        artifacts = row.get('artifacts') or {}
        valid = True
        for name in ('javascript_module', 'native_reference', 'test_log'):
            artifact = artifacts.get(name) or {}
            path = Path(artifact.get('path', ''))
            path = path if path.is_absolute() else Path(project_root)/path
            if not path.is_file() or not artifact.get('sha256') or sha256(path) != artifact['sha256']:
                rejected.append('Missing or hash-mismatched ' + name + ' for ' + key[0])
                valid = False
        if valid:
            verified.add(key)
    return verified, rejected


def compare_graphs(baseline, current, verified_execution=()):
    before, unknown_before = index_nodes(baseline)
    after, unknown_after = index_nodes(current)
    historical = {key: nodes for key, nodes in before.items() if not source_emitted(nodes)}
    unknown_blocked = [node for node in unknown_before if node.get('status') != 'source-first']
    verified_execution = set(verified_execution)
    rows = []
    counts = Counter()
    for key, nodes in sorted(historical.items(), key=lambda item: (item[0][0], item[0][1] or '')):
        candidates = after.get(key, [])
        emitted = source_emitted(candidates)
        closed = emitted and dependency_closed(current, candidates)
        executable = (closed and key in verified_execution and
                      all(node.get('semantic_execution_verified') is True for node in candidates))
        status = ('verified-executable-recovery' if executable else 'syntax-emitted-execution-unverified'
                  if emitted else 'still-blocked' if candidates else 'not-observed-in-current')
        counts[status] += 1
        rows.append({'declaration_identity': {'kind': 'clang-usr', 'value': key[0],
                     'translation_unit_scope': key[1]}, 'status': status,
                     'baseline_records': [node.get('id') for node in nodes],
                     'current_records': [node.get('id') for node in candidates],
                     'syntax_emitted': emitted, 'observed_dependencies_verified': closed,
                     'executable_recovery_verified': executable})
    denominator = len(historical)
    syntax_count = sum(row['syntax_emitted'] for row in rows)
    verified_count = counts['verified-executable-recovery']
    ratio = verified_count/denominator if denominator else None
    current_attested = bool(current and current.get('uniform_compiler_revision_verified') is True
                            and current.get('freshness') == 'attested-compilation')
    limitations = []
    if not baseline or not current:
        limitations.append('One or both declaration reports are unavailable.')
    if unknown_blocked:
        limitations.append('Historical blocked records without proven Clang identities cannot be reconciled.')
    if not denominator:
        limitations.append('No historical blocked Clang declaration identities are available for comparison.')
    if not current_attested:
        limitations.append('Current observations lack a uniform current compilation attestation.')
    verdict = ('unverified' if limitations else 'passed' if ratio >= 0.90 else 'failed')
    return {'format': 'source-first-declaration-recovery-comparison/1',
        'comparison_identity': 'Clang USR plus translation-unit scope for internal linkage',
        'name_or_observation_id_matching_used': False,
        'baseline_blocked_records': sum(node.get('status') != 'source-first'
                                      for node in (baseline or {}).get('nodes', [])),
        'baseline_proven_blocked_identities': denominator,
        'baseline_blocked_records_without_proven_clang_identity': len(unknown_blocked),
        'current_records_without_proven_clang_identity': len(unknown_after),
        'proven_matched_blocked_identities': sum(bool(row['current_records']) for row in rows),
        'syntax_emitted_historical_identities': syntax_count,
        'syntax_emission_fraction_of_proven_baseline': syntax_count/denominator if denominator else None,
        'verified_executable_recovered_identities': verified_count,
        'verified_executable_recovery_fraction_of_proven_baseline': ratio,
        'current_compilation_attested': current_attested,
        'unknown_identity_denominator_is_not_assumed_recovered': True,
        'ninety_percent_executable_recovery': verdict,
        'limitations': limitations, 'transition_counts': dict(sorted(counts.items())),
        'declarations': rows,
        'emission_is_not_recovery': True,
        'whole_game_or_native_gameplay_parity_verified_by_this_report': False}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', type=Path, default=ROOT/'reports/historical-latest/dependency-graph.json')
    parser.add_argument('--current', type=Path, default=ROOT/'reports/dependency-graph.json')
    parser.add_argument('--execution-evidence', type=Path, default=ROOT/'reports/declaration-execution.json')
    parser.add_argument('--project-root', type=Path, default=ROOT)
    parser.add_argument('--out', type=Path, default=ROOT/'reports/recovery-comparison.json')
    parser.add_argument('--strict', action='store_true')
    args = parser.parse_args(argv)
    snapshots = {name: snapshot_json(path) for name,path in (
        ('baseline',args.baseline),('current',args.current),('execution_evidence',args.execution_evidence))}
    baseline, current = snapshots['baseline'][0], snapshots['current'][0]
    execution, execution_errors = execution_identities(snapshots['execution_evidence'][0], current, args.project_root)
    result = compare_graphs(baseline, current, execution)
    result['execution_evidence_rejections'] = execution_errors
    result['inputs'] = {name: {'path': str(path.resolve()), 'present': snapshots[name][0] is not None,
                       'sha256': snapshots[name][1]}
                       for name, path in (('baseline', args.baseline), ('current', args.current),
                                          ('execution_evidence', args.execution_evidence))}
    write_json(args.out, result)
    print(json.dumps({key: result[key] for key in (
        'baseline_proven_blocked_identities', 'baseline_blocked_records_without_proven_clang_identity',
        'syntax_emitted_historical_identities', 'verified_executable_recovered_identities',
        'ninety_percent_executable_recovery')}, indent=2))
    return 2 if args.strict and result['ninety_percent_executable_recovery'] != 'passed' else 0


if __name__ == '__main__':
    raise SystemExit(main())
