"""Run affected source recovery after serial regressions release the compiler."""
import json,subprocess,sys,time
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];report=ROOT/'reports/oct19-recovery-job.json';steps=[]
def save(phase):
 data={'format':'oct19-recovery-job/1','phase':phase,'updated_utc':datetime.now(timezone.utc).isoformat(),'steps':steps,'gameplay_verified':False}
 temp=report.with_suffix('.partial');temp.write_text(json.dumps(data,indent=2)+'\n');temp.replace(report)
def run(label,args,expected=(0,)):
 save(label);log=ROOT/'reports'/('oct19-'+label+'.log')
 with log.open('w',encoding='utf-8') as stream:process=subprocess.run([sys.executable,*args],cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT)
 steps.append({'step':label,'command':args,'exit_code':process.returncode,'log':log.relative_to(ROOT).as_posix()});save(label+'-finished')
 if process.returncode not in expected:raise RuntimeError(label+' failed: '+str(log))
save('waiting-for-serial-regression')
deadline=time.monotonic()+3600
while time.monotonic()<deadline:
 path=ROOT/'reports/oct19-cpp-references-regression.json'
 try:
  proof=json.loads(path.read_text())
  if proof.get('complete'):
   assert proof['all_passed'] and proof['regression_inputs_unchanged'],'Fix actual regression failures before source recovery'
   break
 except (FileNotFoundError,json.JSONDecodeError):pass
 time.sleep(5)
else:save('regression-wait-expired');raise SystemExit(2)
run('affected-source-recovery',['tools/source_first_automate.py','--out','factory-output/source-first/oct19-reference-host-recovery','--max-units','7','--jobs','1','--batch-size','1','--timeout','300','--priority-file','work/cpp-reference-boot-priorities.json','--persistent-ast-cache','--ast-cache-shards','2','--no-global-link','--resume'])
run('compose-verified-input',['work/compose_cpp_reference_link_input.py','--current-build','oct19-reference-host-recovery','--out','factory-output/source-first/oct19-reference-host-link-input'])
run('bounded-global-recovery',['tools/source_first_global_link.py','--directory','factory-output/source-first/oct19-reference-host-link-input','--out','factory-output/source-first/oct19-reference-host-linked','--rounds','1','--retry-budget','4','--jobs','1','--timeout','180','--persistent-ast-cache','--resume'],(0,2))
run('latest-blocker-catalog',['tools/source_first_missing_map.py','--manifests','factory-output/source-first/oct19-reference-host-linked','--baseline','factory-output/source-first/oct15-heap-pointer-linked/global-recovery.json','--out','reports/oct19-blockers'])
run('latest-boot-audit',['tools/source_first_boot_audit.py','--manifest-root','factory-output/source-first/oct19-reference-host-linked','--fast-current-only','--out','reports/oct19-original-boot-audit.json'],(0,2))
run('latest-declaration-blockers',['work/write_oct16_blocker_reports.py','--linked','factory-output/source-first/oct19-reference-host-linked','--catalog','reports/oct19-blockers/complete-blocker-catalog.json','--boot-audit','reports/oct19-original-boot-audit.json'])
run('strict-original-game-test',['tests/source_factory/verify_playable_browser.py'],(0,2))
run('current-status',['work/update_cpp_reference_status.py'])
save('audits-finished')
