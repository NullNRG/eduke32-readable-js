"""Resume current affected-source integration after its serial regression run."""
import hashlib,json,subprocess,sys,time
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
STATE=ROOT/'reports/oct20-source-closure-job.json'
REGRESSION=ROOT/'reports/oct20-source-closure-regression.json'
BUILD='oct20-source-closure-recovery'
LINKED='factory-output/source-first/oct20-source-closure-linked'
INPUT='factory-output/source-first/oct20-source-closure-link-input'
steps=[]
def save(phase):
 data={'format':'source-closure-integration/1','phase':phase,
  'updated_utc':datetime.now(timezone.utc).isoformat(),'steps':steps,'gameplay_verified':False}
 stage=STATE.with_suffix('.partial');stage.write_text(json.dumps(data,indent=2)+'\n');stage.replace(STATE)
def run(label,args,expected=(0,)):
 save(label);log=ROOT/'reports'/('oct20-'+label+'.log')
 with log.open('w',encoding='utf-8') as stream:
  result=subprocess.run([sys.executable,*args],cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT)
 steps.append({'step':label,'command':args,'exit_code':result.returncode,'log':log.relative_to(ROOT).as_posix()})
 save(label+'-finished')
 if result.returncode not in expected:
  save(label+'-failed');raise RuntimeError('See '+str(log))
save('waiting-for-serial-regression')
deadline=time.monotonic()+7200
while time.monotonic()<deadline:
 try:
  proof=json.loads(REGRESSION.read_text())
  if proof.get('complete'):
   if not proof['all_passed'] or not proof['regression_inputs_unchanged']:
    save('regression-failed');raise SystemExit(2)
   for name,digest in proof['regression_inputs'].items():
    if hashlib.sha256((ROOT/name).read_bytes()).hexdigest()!=digest:
     save('regression-input-changed');raise SystemExit(name)
   break
 except (FileNotFoundError,json.JSONDecodeError):pass
 time.sleep(5)
else:save('regression-wait-expired');raise SystemExit(2)
run('affected-source-closure',['tools/source_first_automate.py','--out','factory-output/source-first/'+BUILD,
 '--max-units','12','--jobs','1','--batch-size','1','--timeout','300',
 '--priority-file','work/source-closure-priorities.json','--persistent-ast-cache','--ast-cache-shards','2',
 '--no-global-link','--resume'])
run('compose-source-closure',['work/compose_cpp_reference_link_input.py','--current-build',BUILD,'--out',INPUT])
run('link-source-closure',['tools/source_first_global_link.py','--directory',INPUT,'--out',LINKED,
 '--rounds','2','--retry-budget','6','--jobs','1','--timeout','180','--persistent-ast-cache','--resume'],(0,2))
run('source-closure-catalog',['tools/source_first_missing_map.py','--manifests',LINKED,
 '--baseline','factory-output/source-first/oct19-reference-host-linked/global-recovery.json','--out','reports/oct20-blockers'])
run('source-closure-boot-audit',['tools/source_first_boot_audit.py','--manifest-root',LINKED,
 '--fast-current-only','--out','reports/oct20-original-boot-audit.json'],(0,2))
run('source-closure-declaration-blockers',['work/write_oct16_blocker_reports.py','--linked',LINKED,
 '--catalog','reports/oct20-blockers/complete-blocker-catalog.json','--boot-audit','reports/oct20-original-boot-audit.json'])
run('source-closure-game-test',['tests/source_factory/verify_playable_browser.py'],(0,2))
save('audits-finished')
