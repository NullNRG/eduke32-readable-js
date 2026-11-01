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
assert JOBS['handoff'][1]==['work/package_current_continuation.py']
print('PASS: missing/unverified/changed candidates cannot launch as a game; matching verified bytes can; handoff uses compact continuation')
