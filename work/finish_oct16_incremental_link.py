"""Continue attested incremental compilation through fixed-point linking and gates."""
import json,subprocess,sys,time
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_first_automate import fingerprint
expected_fingerprint=fingerprint(ROOT/'factory-output/compile_commands.json',ROOT/'factory-output/source-tree/eduke32-master',[])
report=ROOT/'reports/oct16-incremental-link-job.json';steps=[]
def save(phase):
 data={'format':'oct16-incremental-link-job/1','phase':phase,'updated_utc':datetime.now(timezone.utc).isoformat(),'steps':steps,'gameplay_verified':False}
 temp=report.with_suffix('.partial');temp.write_text(json.dumps(data,indent=2)+'\n');temp.replace(report)
def run(label,args,expected=(0,)):
 save(label);log=ROOT/'reports'/('oct16-'+label+'.log')
 with log.open('w',encoding='utf-8') as stream:p=subprocess.run([sys.executable,*args],cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT)
 steps.append({'step':label,'command':args,'exit_code':p.returncode,'log':str(log.relative_to(ROOT))});save(label+'-finished')
 if p.returncode not in expected:raise RuntimeError(label+' failed, see '+str(log))
save('waiting-for-12-current-units')
deadline=time.monotonic()+3600
while time.monotonic()<deadline:
 p=ROOT/'factory-output/source-first/oct16-array-members-recovery/recovery-report.json'
 try:
  d=json.loads(p.read_text())
  if d.get('verified_batch_units')==12 and d.get('failed_batch_units')==0 and d.get('compiler_revision_attestation',{}).get('verified') and d['compiler_revision_attestation'].get('end_fingerprint')==expected_fingerprint:break
 except (FileNotFoundError,json.JSONDecodeError):pass
 time.sleep(5)
else:save('timed-out-waiting-for-source-build');sys.exit(2)
run('compose-source-input',['work/compose_oct16_link_input.py'])
run('global-incremental-link',['tools/source_first_global_link.py','--directory','factory-output/source-first/oct16-incremental-link-input','--out','factory-output/source-first/oct16-array-members-linked','--rounds','4','--retry-budget','4','--jobs','2','--timeout','180','--persistent-ast-cache','--resume'])
run('linked-blocker-catalog',['tools/source_first_missing_map.py','--manifests','factory-output/source-first/oct16-array-members-linked','--baseline','factory-output/source-first/oct15-heap-pointer-linked/global-recovery.json','--out','reports/oct16-blockers'])
run('original-boot-audit',['tools/source_first_boot_audit.py','--manifest-root','factory-output/source-first/oct16-array-members-linked','--fast-current-only','--out','reports/oct16-original-boot-audit.json'],expected=(2,))
run('original-game-gate',['tests/source_factory/verify_playable_browser.py'],expected=(0,2))
save('audits-finished')
