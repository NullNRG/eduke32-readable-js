#!/usr/bin/env python3
"""Acceptance audits must reject ambiguous identities and unsupported success claims."""
from pathlib import Path
import json
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools'))
from source_recovery_compare import compare_graphs, declaration_key, execution_identities, sha256
from verify_port_acceptance import evaluate


def node(usr, status='blocked', scope=None, **values):
    return {'id': usr + ':' + str(scope), 'status': status,
            'declaration_identity': {'kind':'clang-usr','value':usr,'translation_unit_scope':scope},
            'observations': [], **values}


def graph(nodes, **values):
    return {'nodes':nodes, 'edges':[], 'uniform_compiler_revision_verified':True,
            'freshness':'attested-compilation', **values}


class RecoveryComparison(unittest.TestCase):
    def test_export_counts_and_identical_observation_ids_are_not_comparison_evidence(self):
        baseline = graph([{'id':'observation:abc','status':'blocked'}])
        current = graph([{'id':'observation:abc','status':'source-first'}])
        result = compare_graphs(baseline,current)
        self.assertEqual(result['baseline_proven_blocked_identities'],0)
        self.assertEqual(result['baseline_blocked_records_without_proven_clang_identity'],1)
        self.assertEqual(result['ninety_percent_executable_recovery'],'unverified')

    def test_internal_linkage_is_translation_unit_scoped(self):
        baseline = graph([node('c:internal',scope='source/a.cpp')])
        current = graph([node('c:internal','source-first',scope='source/b.cpp')])
        result = compare_graphs(baseline,current)
        self.assertEqual(result['proven_matched_blocked_identities'],0)
        self.assertEqual(result['transition_counts']['not-observed-in-current'],1)
        malformed = node('c:internal',observations=[{'linkage':'internal'}])
        self.assertIsNone(declaration_key(malformed))

    def test_emission_is_not_semantic_recovery(self):
        baseline = graph([node('c:@F@original')])
        current = graph([node('c:@F@original','source-first')])
        result = compare_graphs(baseline,current)
        self.assertEqual(result['syntax_emitted_historical_identities'],1)
        self.assertEqual(result['verified_executable_recovered_identities'],0)
        self.assertEqual(result['ninety_percent_executable_recovery'],'failed')

    def test_provider_candidates_are_not_verified_dependency_links(self):
        before = graph([node('c:@F@original')])
        row = node('c:@F@original','source-first',semantic_execution_verified=True)
        after = graph([row],edges=[{'from':row['id'],'provider_candidates':['emitted-provider'],
                                  'provider_linkage_verified':False}])
        result = compare_graphs(before,after,{('c:@F@original',None)})
        self.assertEqual(result['verified_executable_recovered_identities'],0)

    def test_unknown_historical_records_cannot_shrink_ninety_percent_denominator(self):
        before = graph([node('c:@F@original'),{'id':'unknown','status':'blocked'}])
        after = graph([node('c:@F@original','source-first',semantic_execution_verified=True)])
        result = compare_graphs(before,after,{('c:@F@original',None)})
        self.assertEqual(result['verified_executable_recovered_identities'],1)
        self.assertEqual(result['ninety_percent_executable_recovery'],'unverified')

    def test_absent_current_declarations_are_not_recovered(self):
        before = graph([node('c:@F@'+str(i)) for i in range(10)])
        after = graph([node('c:@F@0','source-first',semantic_execution_verified=True)])
        result = compare_graphs(before,after,{('c:@F@0',None)})
        self.assertEqual(result['baseline_proven_blocked_identities'],10)
        self.assertEqual(result['verified_executable_recovery_fraction_of_proven_baseline'],0.1)
        self.assertEqual(result['ninety_percent_executable_recovery'],'failed')

    def test_positive_threshold_requires_all_identity_and_execution_evidence(self):
        before = graph([node('c:@F@'+str(i)) for i in range(10)])
        after = graph([node('c:@F@'+str(i),'source-first' if i<9 else 'blocked',
                           semantic_execution_verified=i<9) for i in range(10)])
        proof = {('c:@F@'+str(i),None) for i in range(9)}
        result = compare_graphs(before,after,proof)
        self.assertEqual(result['ninety_percent_executable_recovery'],'passed')
        self.assertFalse(result['whole_game_or_native_gameplay_parity_verified_by_this_report'])

    def test_execution_artifacts_bind_current_manifest_and_reject_tampering(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            artifacts = {}
            for name in ('javascript_module','native_reference','test_log'):
                path = root/name
                path.write_text('verified fixture '+name)
                artifacts[name] = {'path':name,'sha256':sha256(path)}
            report = {'format':'source-first-declaration-execution/1','implementation_manifest_sha256':'manifest',
                      'entries':[{'declaration_identity':node('c:@F@original')['declaration_identity'],
                      'native_parity_verified':True,'linked_implementation_verified':True,
                      'runtime_dependencies_verified':True,'artifacts':artifacts}]}
            verified, errors = execution_identities(report,{'manifest_content_sha256':'manifest'},root)
            self.assertEqual(verified,{('c:@F@original',None)})
            self.assertFalse(errors)
            (root/'javascript_module').write_text('changed generated implementation')
            verified, errors = execution_identities(report,{'manifest_content_sha256':'manifest'},root)
            self.assertFalse(verified)
            self.assertTrue(errors)


class PortAcceptance(unittest.TestCase):
    def test_empty_project_and_partial_state_produce_factual_failure_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = evaluate(tmp)
            self.assertFalse(result['completion_claim_allowed'])
            self.assertFalse(result['original_game_playable_verified'])
            self.assertIn('self_contained_offline_game',result['failed_checks'])
            self.assertIn('native_engine_comparison',result['unverified_checks'])
            self.assertFalse((Path(tmp)/'dist/index.html').exists())

    def test_html_and_browser_booleans_without_original_trace_are_not_gameplay(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root/'dist').mkdir()
            (root/'reports').mkdir()
            html = root/'dist/index.html'
            html.write_text('<html><canvas></canvas></html>')
            (root/'reports/browser-gameplay.json').write_text(json.dumps({
                'original_source_gameplay_verified':True,'entry_function':'app_main',
                'entry_html_sha256':sha256(html),'gameplay_seconds':600,'console_exceptions':[],
                'checks':{name:True for name in ('menu','frames_advance','keyboard')}}))
            result = evaluate(root)
            self.assertFalse(result['original_game_playable_verified'])
            self.assertIn('original_browser_gameplay',result['failed_checks'])
            self.assertIn('self_contained_offline_game',result['unsatisfied_checks'])

    def test_passing_native_fixture_suite_is_not_original_engine_parity(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root/'reports').mkdir()
            (root/'reports/recovery-regression.json').write_text(json.dumps({
                'complete':True,'all_passed':True,'selected_tests':1,'completed_tests':1,
                'counts':{'passed':1},'tests':[{'test':'native-fixture','status':'passed'}]}))
            result = evaluate(root)
            rows = {row['id']:row for row in result['checks']}
            self.assertEqual(rows['compiler_runtime_regressions']['status'],'passed')
            self.assertEqual(rows['native_engine_comparison']['status'],'unverified')
            self.assertFalse(result['completion_claim_allowed'])

    def test_strict_cli_saves_report_and_exits_incomplete_without_creating_html(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)/'acceptance.json'
            proc = subprocess.run([sys.executable,str(ROOT/'tools/verify_port_acceptance.py'),
                                   '--root',tmp,'--out',str(path),'--strict'],capture_output=True,text=True)
            self.assertEqual(proc.returncode,2,proc.stderr)
            self.assertTrue(path.is_file())
            self.assertFalse(json.loads(path.read_text())['all_acceptance_criteria_passed'])
            self.assertFalse((Path(tmp)/'dist/index.html').exists())

    def test_real_default_game_gate_remains_incomplete(self):
        proc = subprocess.run([sys.executable,str(ROOT/'tools/source_first_game_gate.py')],
                              capture_output=True,text=True)
        self.assertEqual(proc.returncode,2,proc.stderr)
        report = json.loads(proc.stdout)
        self.assertFalse(report['all_strict_acceptance_criteria_passed'])
        self.assertFalse(report['original_browser_boot_frames_input_and_play_verified'])

    def test_game_gate_rejects_synthetic_browser_success_flags(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root/'reports').mkdir()
            (root/'dist').mkdir()
            html = root/'dist/index.html'
            html.write_text('<html><canvas></canvas></html>')
            (root/'reports/browser-gameplay.json').write_text(json.dumps({
                'entry_html_sha256':sha256(html),'original_source_gameplay_verified':True,
                'entry_function':'app_main','gameplay_seconds':999,'console_exceptions':[]}))
            proc = subprocess.run([sys.executable,str(ROOT/'tools/source_first_game_gate.py'),
                '--root',tmp,'--build-root',str(root/'empty-build')],capture_output=True,text=True)
            self.assertEqual(proc.returncode,2,proc.stderr)
            report = json.loads(proc.stdout)
            self.assertFalse(report['all_strict_acceptance_criteria_passed'])
            self.assertFalse(report['original_browser_boot_frames_input_and_play_verified'])


if __name__ == '__main__':
    unittest.main()
