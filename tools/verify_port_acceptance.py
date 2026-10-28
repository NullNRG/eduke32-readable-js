#!/usr/bin/env python3
"""Evidence-based acceptance audit for the original readable-JavaScript port.

This never opens historical diagnostic runtimes, creates HTML, or infers
gameplay from export counts. Missing evidence leaves a criterion unsatisfied.
Function-fixture native parity and complete original-engine verification are
reported independently. Reports bind runtime evidence to the actual HTML hash.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
from source_recovery_compare import read_json, snapshot_json, sha256, write_json

ROOT = Path(__file__).resolve().parents[1]
STAGES = ('app_main', 'engine-initialization', 'game-data-loading', 'menus',
          'start-game', 'level-loop', 'render', 'input', 'gameplay')
GAME_CHECKS = ('original_grp_loaded', 'menu', 'new_game', 'level_geometry',
               'frames_advance', 'keyboard', 'mouse', 'pointer_lock', 'gamepad',
               'audio', 'collision', 'enemies', 'weapons', 'interactions', 'save', 'load')


def artifact_verified(artifact, root):
    if not isinstance(artifact, dict) or not artifact.get('path') or not artifact.get('sha256'):
        return False
    path = Path(artifact['path'])
    path = path if path.is_absolute() else Path(root)/path
    return path.is_file() and sha256(path) == artifact['sha256']


def evaluate(root, reports_root=None, build_root=None):
    root = Path(root).resolve()
    reports = Path(reports_root).resolve() if reports_root else root/'reports'
    build = Path(build_root).resolve() if build_root else root/'factory-output/source-first/autonomous'
    paths = {'source_inventory': reports/'source-files-current.json',
             'semantic_index': reports/'semantic-index.summary.json',
             'compile_report': build/'automatic/recovery-report.json',
             'link_report': build/'globally-linked/global-recovery.json',
             'build_attestation': build/'source-build-attestation.json',
             'dependency_graph': reports/'dependency-graph.json',
             'all_blockers': reports/'all-blockers.json', 'boot_blockers': reports/'boot-blockers.json',
             'recovery_comparison': reports/'recovery-comparison.json',
             'native_gameplay': reports/'native-gameplay-parity.json',
             'browser_gameplay': reports/'browser-gameplay.json',
             'offline_audit': reports/'offline-bundle-audit.json',
             'reproducibility': reports/'reproducible-build.json',
             'regression_suite': reports/('recovery-regression-final.json'
                                  if (reports/'recovery-regression-final.json').is_file()
                                  else 'recovery-regression.json')}
    snapshots = {key: snapshot_json(path) for key,path in paths.items()}
    data = {key: value[0] or {} for key,value in snapshots.items()}
    from browser_classic_profile import selected_commands
    commands_path = selected_commands(root,build)
    commands = read_json(commands_path) or []
    selected = {entry['file'].replace('\\','/') for entry in commands}
    expected = len(selected)
    recover, graph, boot, link = (data[key] for key in
                                  ('compile_report','dependency_graph','boot_blockers','link_report'))
    checks = []

    def add(identity, criterion, passed, evidence, failure, missing=False, details=None):
        checks.append({'id': identity, 'criterion': criterion,
                       'status': 'passed' if passed else 'unverified' if missing else 'failed',
                       'required': True, 'evidence': evidence,
                       'finding': criterion if passed else failure,
                       'details': details or {}})

    batches = recover.get('batch_results') or []
    attempted = {source.replace('\\','/') for row in batches for source in row.get('sources', [])}
    revisions = {row.get('compiler_fingerprint') for row in batches}
    uniform = bool(batches) and None not in revisions and len(revisions) == 1
    all_attempted = bool(selected) and attempted == selected and uniform
    add('uniform_selected_unit_attempts', 'All selected translation units attempted under one compiler revision',
        all_attempted, ['compile_report'], 'The selected source set or uniform compiler revision is incomplete.',
        missing=not recover, details={'selected_units': expected, 'attempted_units': len(attempted),
        'selected_not_attempted': sorted(selected-attempted), 'unexpected_attempted': sorted(attempted-selected),
        'compiler_revisions': sorted(str(value) for value in revisions)})

    inventory = data['source_inventory']
    excluded = [row for row in inventory.get('all_eduke_source_entries', [])
                if row.get('kind') == 'translation-candidate' and row.get('build_status') != 'make-selected']
    metrics = inventory.get('metrics') or {}
    archived = inventory.get('all_eduke_source_entries', []) + inventory.get('all_second_source_entries', [])
    catalogued = (bool(inventory) and len(excluded) == metrics.get('original_translation_candidates_not_selected_by_make')
                  and all(row.get('exclusion') and row.get('path') for row in excluded)
                  and len(archived) == metrics.get('all_archived_source_files_examined')
                  and all(row.get('path') and row.get('kind') and row.get('build_status') and row.get('sha256') for row in archived)
                  and not inventory.get('extraction_and_selection_errors')
                  and not inventory.get('unknown_selected_sources'))
    add('excluded_sources_catalogued', 'Every archived original file is catalogued and excluded translation candidates have explicit reasons',
        catalogued, ['source_inventory'], 'The exhaustive excluded-source catalogue is unavailable or incomplete.',
        missing=not inventory, details={'catalogued_original_archive_entries':len(archived),
        'catalogued_excluded_translation_candidates': len(excluded),
        'archived_source_files_examined': metrics.get('all_archived_source_files_examined'),
        'headers_are_indirectly_selected_and_not_claimed_as_excluded_translation_units': True})

    semantic = data['semantic_index']
    add('complete_source_semantics', 'Canonical source-wide semantic extraction includes complete calls and initialization dependencies',
        semantic.get('complete_semantic_extraction') is True and
        semantic.get('selected_units') == expected and semantic.get('all_selected_units_parsed_without_errors') is True,
        ['semantic_index'], 'Source semantic extraction is incomplete; parsed declarations do not prove complete dataflow.',
        missing=not semantic, details={'attempted_units': semantic.get('attempted_units'),
        'unit_statuses': semantic.get('unit_statuses'), 'limitations': semantic.get('limitations', [])})

    startup = (boot.get('entry') == 'app_main' and boot.get('entry_resolution') == 'unique'
               and boot.get('complete_original_startup_dependency_graph') is True
               and boot.get('closure_is_partial') is False and not boot.get('blocked_definitions')
               and not boot.get('unresolved_references')
               and not boot.get('references_without_verified_provider_linkage'))
    add('startup_dependency_closure', 'Original app_main startup-to-gameplay dependency graph has no unresolved implementation',
        startup, ['boot_blockers'], 'Original startup dependency closure remains blocked or unproven.',
        missing=not boot, details={'entry_resolution': boot.get('entry_resolution'),
        'reachable_definitions': len(boot.get('reachable_definitions', [])),
        'blocked_definitions': len(boot.get('blocked_definitions', [])),
        'unresolved_references': len(boot.get('unresolved_references', [])),
        'unverified_provider_links': len(boot.get('references_without_verified_provider_linkage', []))})

    attestation = data['build_attestation']
    bound_link = (snapshots['link_report'][1] is not None and attestation.get('linked_manifest_sha256') == snapshots['link_report'][1]
                  and recover.get('uniform_compiler_revision_verified') is True)
    imports_clean = (bound_link and link.get('selected_source_units') == expected
                     and link.get('completed_source_units') == expected
                     and not link.get('invalid_imports_or_syntax') and not link.get('ambiguous_export_names')
                     and link.get('full_game_linked') is True)
    add('linked_javascript_integrity', 'Linked game JavaScript has zero invalid imports, ambiguous symbols, missing functions or syntax errors',
        imports_clean, ['link_report','build_attestation','compile_report'],
        'A complete current original-game link with verified imports and symbols is not available.',
        missing=not link, details={'manifest_hash_bound': bound_link,
        'invalid_imports_or_syntax': len(link.get('invalid_imports_or_syntax', [])),
        'ambiguous_export_names': len(link.get('ambiguous_export_names', {})),
        'full_game_linked': link.get('full_game_linked') is True,
        'absence_of_reported_import_errors_alone_is_not_a_complete_game_link': True})

    comparison = data['recovery_comparison']
    comparison_bound = (snapshots['dependency_graph'][1] is not None and
        comparison.get('inputs', {}).get('current', {}).get('sha256') == snapshots['dependency_graph'][1])
    add('historical_recovery_ninety_percent', 'At least 90 percent of comparable historical blocked declarations have verified executable recovery',
        comparison_bound and comparison.get('ninety_percent_executable_recovery') == 'passed',
        ['recovery_comparison','dependency_graph'],
        'Ninety-percent semantic recovery is not verified by a current declaration-by-declaration comparison.',
        missing=not comparison or comparison.get('ninety_percent_executable_recovery') == 'unverified',
        details={'current_comparison_hash_bound': comparison_bound,
        'proven_baseline_identities': comparison.get('baseline_proven_blocked_identities'),
        'historical_records_without_proven_identity': comparison.get('baseline_blocked_records_without_proven_clang_identity'),
        'syntax_emitted': comparison.get('syntax_emitted_historical_identities'),
        'verified_executable_recovered': comparison.get('verified_executable_recovered_identities'),
        'verified_recovery_fraction': comparison.get('verified_executable_recovery_fraction_of_proven_baseline')})

    reachable = set(boot.get('reachable_definitions', []))
    reachable_nodes = [node for node in graph.get('nodes', []) if node.get('id') in reachable]
    reachable_verified = (startup and bool(reachable) and len(reachable_nodes) == len(reachable)
                          and graph.get('whole_program_dependency_graph_complete') is True
                          and graph.get('indirect_call_graph_complete') is True
                          and all(node.get('semantic_execution_verified') is True for node in reachable_nodes))
    add('reachable_gameplay_recovery', 'The full reachable original gameplay implementation is recovered and semantically verified',
        reachable_verified, ['dependency_graph','boot_blockers'],
        'Reachable original gameplay code or indirect/callback dependencies remain unverified.',
        missing=not graph, details={'reachable_nodes': len(reachable_nodes),
        'semantically_verified_reachable_nodes': sum(node.get('semantic_execution_verified') is True for node in reachable_nodes)})

    html = root/'dist/index.html'
    html_hash = sha256(html) if html.is_file() else None
    browser = data['browser_gameplay']
    browser_bound = bool(html_hash and browser.get('entry_html_sha256') == html_hash)
    artifacts = browser.get('artifacts') or {}
    runtime_evidence = (all(artifact_verified(artifacts.get(name), root) for name in
                            ('execution_trace','runtime_log','menu_screenshot','level_screenshot')))
    stages = browser.get('observed_execution_stages') or []
    trace_complete = all(stage in stages for stage in STAGES) and [stages.index(stage) for stage in STAGES] == sorted(stages.index(stage) for stage in STAGES)
    browser_checks = browser.get('checks') or {}
    verified_browser = (browser_bound and runtime_evidence and trace_complete
                        and browser.get('entry_function') == 'app_main'
                        and browser.get('original_source_gameplay_verified') is True
                        and browser.get('gameplay_seconds', 0) >= 60
                        and browser.get('console_exceptions') == []
                        and all(browser_checks.get(name) is True for name in GAME_CHECKS))
    add('original_browser_gameplay', 'The actual original game boots, enters a real level and passes at least 60 seconds of controlled interactive gameplay',
        verified_browser, ['browser_gameplay'],
        'Original browser gameplay, real level rendering, sustained frames or required interactions are not verified.',
        missing=not browser, details={'dist_index_present': html.is_file(), 'html_hash_bound': browser_bound,
        'gameplay_seconds': browser.get('gameplay_seconds'), 'trace_and_screenshot_artifacts_hash_verified': runtime_evidence,
        'ordered_original_execution_stages_verified': trace_complete,
        'unverified_subsystems': [name for name in GAME_CHECKS if browser_checks.get(name) is not True]})

    native = data['native_gameplay']
    native_verified = (native.get('scope') == 'original-engine-gameplay' and native.get('all_passed') is True
                       and native.get('gameplay_state_snapshots_compared', 0) >= 2
                       and native.get('javascript_html_sha256') == html_hash and bool(html_hash)
                       and all(artifact_verified((native.get('artifacts') or {}).get(name), root)
                               for name in ('native_executable','native_trace','javascript_trace','comparison_log')))
    add('native_engine_comparison', 'Automated original-engine native and JavaScript gameplay-state comparison passes',
        native_verified, ['native_gameplay'],
        'Function-fixture parity exists separately; complete original-engine gameplay comparison is not verified.',
        missing=not native, details={'scope': native.get('scope'),
        'gameplay_state_snapshots_compared': native.get('gameplay_state_snapshots_compared')})

    offline = data['offline_audit']
    offline_verified = (bool(html_hash) and offline.get('entry_html_sha256') == html_hash
                        and offline.get('runtime_kind') == 'readable-original-source-javascript'
                        and offline.get('wasm_or_emulation_runtime_detected') is False
                        and offline.get('remote_runtime_dependencies') == []
                        and offline.get('local_file_offline_execution_verified') is True
                        and offline.get('all_resources_embedded') is True
                        and artifact_verified((offline.get('artifacts') or {}).get('browser_network_log'), root))
    add('self_contained_offline_game', 'dist/index.html runs the original game offline with no WebAssembly, emulation or remote dependencies',
        offline_verified and verified_browser, ['offline_audit','browser_gameplay'],
        'A verified self-contained offline original-game HTML artifact is not available.',
        missing=html.is_file() and not offline, details={'dist_index_present': html.is_file(),
        'html_sha256': html_hash, 'offline_artifact_audit_passed': offline_verified})

    reproducibility = data['reproducibility']
    reproducible = (reproducibility.get('command') == 'npm run compile:game'
                    and reproducibility.get('independent_successful_builds', 0) >= 2
                    and reproducibility.get('matching_deliverable_hashes') is True
                    and reproducibility.get('entry_html_sha256') == html_hash and bool(html_hash)
                    and all(artifact_verified((reproducibility.get('artifacts') or {}).get(name),root)
                            for name in ('first_build_log','second_build_log')))
    add('reproducible_one_command_build', 'npm run compile:game reproducibly builds the accepted playable deliverable',
        reproducible and offline_verified and verified_browser, ['reproducibility'],
        'Two successful matching builds of the accepted playable deliverable are not verified.',
        missing=not reproducibility)

    regression = data['regression_suite']
    failures = [row['test'] for row in regression.get('tests', []) if row.get('status') != 'passed']
    selected_tests = regression.get('selected_tests',0)
    add('compiler_runtime_regressions', 'The complete compiler/runtime regression selection passes',
        regression.get('complete') is True and regression.get('all_passed') is True
        and selected_tests > 0 and selected_tests == regression.get('completed_tests')
        and len(regression.get('tests',[])) == selected_tests
        and (regression.get('counts') or {}).get('passed') == selected_tests and not failures,
        ['regression_suite'], 'Compiler/runtime regression tests are incomplete or failing.',
        missing=not regression, details={'complete': regression.get('complete'),
        'selected_tests': regression.get('selected_tests'), 'completed_tests': regression.get('completed_tests'),
        'counts': regression.get('counts'), 'failed_or_incomplete_tests': failures,
        'passing_function_fixtures_do_not_verify_original_engine_gameplay': True})

    unsatisfied = [row['id'] for row in checks if row['status'] != 'passed']
    return {'format': 'source-first-original-port-acceptance/1',
        'generated_utc': datetime.now(timezone.utc).isoformat(), 'project_root': str(root),
        'all_acceptance_criteria_passed': not unsatisfied,
        'original_game_playable_verified': verified_browser and startup and imports_clean and native_verified and offline_verified,
        'completion_claim_allowed': not unsatisfied,
        'checks': checks, 'failed_checks': [row['id'] for row in checks if row['status'] == 'failed'],
        'unverified_checks': [row['id'] for row in checks if row['status'] == 'unverified'],
        'unsatisfied_checks': unsatisfied,
        'inputs': {key: {'path': str(path), 'present': snapshots[key][0] is not None,
                         'sha256': snapshots[key][1]} for key, path in paths.items()},
        'deliverables': {'offline_html': {'path': str(html), 'present': html.is_file(), 'sha256': html_hash,
                         'playable_verified': verified_browser and offline_verified},
                         'linked_readable_modules': {'path': str(build/'globally-linked'),
                          'present': (build/'globally-linked').is_dir(),
                          'full_reachable_gameplay_verified': reachable_verified}},
        'resume_commands': ['npm run compile:game',
            'node tools/run_python.mjs tools/source_recovery_compare.py',
            'node tools/run_python.mjs tools/verify_port_acceptance.py --strict'],
        'resume_prerequisite': 'Use the explicit LP64 toolchain/sysroot environment documented in BUILD_PORTABILITY.md.',
        'resume_commands_do_not_claim_missing_engine_semantics_are_automatically_implemented': True}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--reports', type=Path)
    parser.add_argument('--build-root', type=Path)
    parser.add_argument('--out', type=Path)
    parser.add_argument('--strict', action='store_true')
    args = parser.parse_args(argv)
    result = evaluate(args.root, args.reports, args.build_root)
    output = args.out or ((args.reports or args.root/'reports')/'port-acceptance.json')
    write_json(output, result)
    print(json.dumps({key: result[key] for key in ('all_acceptance_criteria_passed',
          'original_game_playable_verified','failed_checks','unverified_checks','resume_commands')}, indent=2))
    return 2 if args.strict and not result['all_acceptance_criteria_passed'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
