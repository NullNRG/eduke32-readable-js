"""The developer Play action requires evidence for the exact candidate bytes."""
import hashlib,json,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from project_launcher import Project,JOBS
with tempfile.TemporaryDirectory(prefix='eduke-launcher-gate-') as temporary:
    root=Path(temporary);project=Project(root)
    assert project.status()['game_url'] is None
    target=root/'dist/index.html';target.parent.mkdir();target.write_text('<title>Acceptance gate fixture</title>')
    state=project.status()
    assert state['game_present'] and not state['gameplay_verified'] and state['game_url'] is None
    report=root/'reports/port-acceptance.json';report.parent.mkdir()
    proof={'original_game_playable_verified':True,'deliverables':{'offline_html':{'sha256':'wrong'}}}
    report.write_text(json.dumps(proof));assert project.status()['game_url'] is None
    proof['deliverables']['offline_html']['sha256']=hashlib.sha256(target.read_bytes()).hexdigest()
    report.write_text(json.dumps(proof));assert project.status()['game_url']=='/dist/index.html'
    target.write_text(target.read_text()+'<!-- different build -->')
    assert project.status()['game_url'] is None
    module=root/'factory-output/modules/engine.mjs';module.parent.mkdir(parents=True);module.write_text('export const original=1;')
    runtime=root/'runtime/abi.mjs';runtime.parent.mkdir();runtime.write_text('export const abi=1;')
    def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
    modules={'factory-output/modules/engine.mjs':digest(module)}
    runtimes={'runtime/abi.mjs':digest(runtime)}
    component=root/'factory-output/source-first/browser-classic/component-manifest.json';component.parent.mkdir(parents=True)
    component.write_text(json.dumps({'artifacts':modules,'runtime_artifacts':runtimes,'entry_exports':{'app_main':False}}))
    probe=root/'reports/oct30-original-browser-component.json'
    evidence={'original_engine_startup_verified':True,'fresh_startup_without_precalled_helpers':True,
              'artifacts':modules,'runtime_artifacts':runtimes,'page_errors':[]}
    probe.write_text(json.dumps(evidence));assert project.status()['engine']['verified']
    runtime.write_text('export const abi=2;');assert not project.status()['engine']['verified']
    runtime.write_text('export const abi=1;');assert project.status()['engine']['verified']
    evidence['page_errors']=['real browser error'];probe.write_text(json.dumps(evidence))
    assert not project.status()['engine']['verified']
    evidence['page_errors']=[];evidence['fresh_startup_without_precalled_helpers']=False
    probe.write_text(json.dumps(evidence));assert not project.status()['engine']['verified']
    evidence['fresh_startup_without_precalled_helpers']=True;evidence['runtime_artifacts']={}
    probe.write_text(json.dumps(evidence));assert not project.status()['engine']['verified']
assert JOBS['handoff'][1]==['work/package_current_continuation.py']
assert JOBS['engine-startup'][1]==['work/verify_fresh_engine_startup.py']
assert JOBS['resume-app-main'][1]==['work/recover_boot_reachable.py','source/duke3d/src/game.cpp','app_main']
print('PASS: missing/unverified/changed candidates cannot launch as a game; matching verified bytes can; handoff uses compact continuation')
