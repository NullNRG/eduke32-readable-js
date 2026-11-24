"""Record the verified incremental provider checkpoint; never assert gameplay."""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from source_ast_to_js import compiler_runtime_revision


def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def write(path, value):
    target = ROOT / path
    newline = '\r\n' if target.is_file() and b'\r\n' in target.read_bytes() else '\n'
    target.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8', newline=newline)


def main():
    revision = compiler_runtime_revision()
    stamp = datetime.now(timezone.utc).isoformat()
    base = 'factory-output/source-first/browser-classic/'
    frontier = read(base + 'reports/frontier-source_duke3d_src_gameexec.cpp-VM_Execute.json')
    assert frontier['compiler_runtime_input_sha256'] == revision
    rejected = read(frontier['rejected_import_catalog'])
    vm = next(row for row in rejected['candidate_definitions'] if row['name'] == 'VM_Execute')
    references = vm['unresolved_references']
    calls = [row for row in vm['external_reference_imports']
             if row.get('cpp_function_identity', {}).get('abi') == 'source-clang-tu-function-identity/1']
    constants = vm.get('non_odr_header_constants', [])
    owner = read(base + 'browser-modules/source/duke3d/src/gameexec.cpp.manifest.json')
    candidates = [dict(name=row['name'], source_name=row.get('source_name'),
                       kind=row['kind'], original_type=row.get('original_type'),
                       identity_abi=row.get('cpp_function_identity', {}).get('abi'))
                  for row in owner['definitions'] if row.get('status') == 'source-first'
                  and (row['name'] in references or row.get('source_name') in references)]
    assert len(references) == 93 and len(calls) == 29 and len(constants) == 13
    assert len(rejected['rejected_imports']) == 2 and not rejected['link_verified']
    frontier_path = 'reports/nov23-vm-provider-frontier.json'
    rejected_path = 'reports/nov23-vm-provider-rejected-imports.json'
    frontier['rejected_import_catalog'] = rejected_path
    write(frontier_path, frontier)
    write(rejected_path, rejected)
    summary = {
        'format': 'original-vm-provider-closure/1', 'updated_utc': stamp,
        'compiler_runtime_input_sha256': revision, 'dependency_query_limit': 32,
        'baseline': 'reports/nov23-vm-tu-callable-frontier.json',
        'baseline_unresolved_names': 126, 'current_unresolved_names': len(references),
        'current': frontier_path, 'rejected_imports': rejected_path,
        'original_call_contracts': calls, 'non_odr_header_constants': constants,
        'remaining_same_tu_provider_candidates': candidates,
        'candidate_note': 'Matching original names/types are an inventory only, not selected-callsite proof or authorization to add aliases',
        'affected_definitions': rejected['affected_definitions'],
        'not_linked': ['A_Dodge', 'VM_Execute'],
        'measurement_note': 'Bounded diagnostic, not whole-program coverage; lowered ABI-rejected definitions are not recovered',
        'original_vm_executed': False, 'gameplay_verified': False,
    }
    write('reports/nov23-vm-provider-closure.json', summary)
    component = read(base + 'component-manifest.json')
    assert component['execution_evidence_matches_modules'] and component['original_engine_startup_verified']
    regression = read('reports/nov23-header-value-regressions.json')
    assert regression['all_passed'] and regression['completed_tests'] == 13
    doc = read('reports/nov23-continuation-frontier.json')
    doc.update(updated_utc=stamp, compiler_runtime_input_sha256=revision,
               engine_evidence_matches_current_modules=True, original_engine_startup_verified=True)
    doc['verified_reports'].update(shared_regressions='reports/nov23-header-value-regressions.json',
        bulk_helpers='reports/nov23-original-bulk-vm-helpers.json',
        typed_readers='reports/nov23-original-vm-array-access.json',
        current_provider_closure='reports/nov23-vm-provider-closure.json')
    doc['current_vm_probe'] = dict(frontier=frontier_path, rejected_imports=rejected_path,
        dependency_queries_limit=32, unresolved_reference_count=len(references),
        rejected_import_count=2, affected_definitions=rejected['affected_definitions'],
        complete_whole_program_measurement=False, original_call_contracts=calls,
        non_odr_header_constants=constants)
    for issue in doc['issues']:
        if issue['id'] == 'same-tu-private-function-linking':
            issue.update(failure='29 original callable contracts now bind; 13 non-ODR tile constant uses lower from native declaration facts. Remaining original dependency closure is unresolved.',
                         current_probe=frontier_path, evidence='reports/nov23-vm-provider-closure.json',
                         status='implemented-with-remaining-dependency-closure')
            issue.pop('installed_same_tu_candidate_names', None)
        if issue['id'] == 'vector-prototype-abi':
            issue.update(failure='vec3 factory and actor nested prototype contracts rejected; five candidate definitions affected. Actor provider already has contiguous native storage.',
                         evidence=rejected_path)
    write('reports/nov23-continuation-frontier.json', doc)
    snapshot = read('HANDOFF_SNAPSHOT.json')
    snapshot.update(updated_utc=stamp, compiler_runtime_input_sha256=revision,
        component_snapshot_sha256=hashlib.sha256((ROOT / base / Path('component-manifest.json')).read_bytes()).hexdigest(),
        latest_frozen_targeted_regression='reports/nov23-header-value-regressions.json',
        latest_frozen_targeted_passed=13, latest_frozen_targeted_total=13,
        current_vm_probe_scope='32 dependency queries; 93 unresolved names, two ABI rejections affecting five candidates; 29 exact call contracts and 13 non-ODR tile constants; not whole-program coverage',
        current_vm_import_audit=frontier_path, current_vm_rejected_import_catalog=rejected_path,
        current_provider_closure_report='reports/nov23-vm-provider-closure.json',
        tu_private_callable_contracts_installed=29, original_vm_unresolved_references_scoped=93,
        original_bulk_helper_report='reports/nov23-original-bulk-vm-helpers.json',
        original_bulk_helper_native_chromium_values=5120,
        original_typed_reader_report='reports/nov23-original-vm-array-access.json',
        original_typed_reader_native_chromium_values=588,
        current_component_execution_evidence_matches_modules=True)
    write('HANDOFF_SNAPSHOT.json', snapshot)
    print('Recorded current compiler, 29 call contracts, 13 constants, 93 unresolved names and two ABI rejections; gameplay false')


if __name__ == '__main__':
    main()
