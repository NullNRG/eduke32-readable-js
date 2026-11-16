"""Record exactly what the original CON lowering and browser probe established."""
import datetime
import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import recover_browser_component as component
from source_ast_to_js import compiler_runtime_revision


def read(relative):
    return json.loads((ROOT / relative).read_text(encoding='utf-8'))


def write(relative, data):
    (ROOT / relative).write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    revision = compiler_runtime_revision()
    frame_path = 'reports/nov16-original-text-startup-frame.json'
    frame = read(frame_path)
    modules = {p.relative_to(ROOT).as_posix(): digest(p) for p in component.OUT.rglob('*.mjs')}
    assert frame['component_passed'] and not frame['page_errors'] and frame['artifacts'] == modules
    relocation = read('reports/nov16-original-script-relocation-parity.json')
    assert relocation['native_node_chromium_cases'] == 256
    control = read('reports/oct19-nested-goto-parity.json')
    assert control['passed'] and control['flow_sha256'] == digest(ROOT / 'tools/source_control_flow.py')
    assert control['compiler_sha256'] == digest(ROOT / 'tools/source_ast_to_js.py')
    frontier = read('factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_gamedef.cpp.json')
    emission = read(frontier['manifest'])
    assert emission['compiler_runtime_input_sha256'] == revision
    definitions = {row['name']: row for row in emission['definitions']}
    roots = []
    for name in ('C_Compile', 'C_ParseCommand'):
        row = definitions[name]
        assert row['status'] == 'blocked' and row['unresolved_references'] and row['control_flow']['detected']['reducible']
        roots.append({'name': name, 'reason': row['reason'],
                      'unresolved_references': row['unresolved_references'],
                      'structured_flow': row['control_flow']})
    provider_frontiers = {}
    for source in ('savegame', 'gamestructures'):
        path = f'factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_{source}.cpp.json'
        provider_frontiers[source] = read(path)['requested_resolved']
    assert provider_frontiers['savegame']['G_Util_PtrToIdx2']
    shutil.copyfile(ROOT / frame_path, ROOT / 'reports/browser-classic-original-engine-video.json')
    with component.component_lock():
        component.checkpoint()
    component_path = 'factory-output/source-first/browser-classic/component-manifest.json'
    checkpoint = read(component_path)
    assert checkpoint['execution_evidence_matches_modules'] and not checkpoint['invalid_imports']
    ci_path = 'reports/nov16-con-shadowing-regression.json'
    ci = read(ci_path)
    assert ci['complete'] and ci['all_passed'] and ci['regression_inputs_unchanged']
    assert all(digest(ROOT / p) == value for p, value in ci['regression_inputs'].items())
    report_path = 'reports/nov16-con-lowering-frontier.json'
    write(report_path, {'format': 'original-con-lowering-checkpoint/1',
                        'compiler_runtime_input_sha256': revision, 'roots': roots,
                        'other_blocked_definitions_in_unit': [row for row in frontier['blocked']
                            if row['name'] not in ('C_Compile', 'C_ParseCommand')],
                        'provider_frontiers': provider_frontiers, 'native_relocation_parity': relocation,
                        'compiler_ci_report': ci_path, 'browser_engine_component_report': frame_path,
                        'con_compilation_verified': False, 'original_app_main_executed': False,
                        'gameplay_verified': False, 'standalone_player_verified': False})
    snapshot = read('HANDOFF_SNAPSHOT.json')
    snapshot.update(updated_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    compiler_runtime_input_sha256=revision,
                    component_snapshot_sha256=digest(ROOT / component_path),
                    current_component_execution_evidence_matches_modules=True,
                    current_scoped_startup_frontier=report_path,
                    original_con_compilation_verified=False,
                    current_work='Link original CON/game-variable and VM providers, then configuration, menus and gameplay')
    snapshot.update(latest_frozen_targeted_regression=ci_path,
                    latest_frozen_targeted_passed=ci['completed_tests'],
                    latest_frozen_targeted_total=ci['selected_tests'])
    write('HANDOFF_SNAPSHOT.json', snapshot)
    print('Verified original engine component and exact CON lowering frontier. Playable game remains unverified.')


if __name__ == '__main__':
    main()
