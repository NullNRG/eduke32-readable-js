from pathlib import Path
import hashlib,json,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[1]
names=['byte_records','bulk_aggregates','global_records','aggregate_slots','aggregate_methods',
 'trivial_aggregate','static_array_zero','original_nested_storage','nested_storage_crossunit',
 'constructor_provider_guard','friend_ctor','header_globals','header_record_project',
 'header_odr','original_menu_headers']
def fingerprint():
 return {str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest()
  for p in sorted((ROOT/'tools').glob('source_*.py'))+sorted((ROOT/'tools').glob('source_*.mjs'))}
rows=[]
for name in names:
 start=time.monotonic();before=fingerprint()
 result=subprocess.run([sys.executable,str(ROOT/f'tests/source_factory/verify_sourcefirst_{name}.py')],
  cwd=ROOT,capture_output=True,text=True,timeout=210)
 after=fingerprint()
 row={'name':name,'returncode':result.returncode,'stdout':result.stdout,'stderr':result.stderr,
  'elapsed_seconds':round(time.monotonic()-start,2),'source_inputs_before':before,
  'source_inputs_after':after,'unchanged_source_inputs':before==after}
 rows.append(row)
 print(name,'PASS' if result.returncode==0 else 'FAIL',result.stdout[-500:],result.stderr[-1300:],flush=True)
 (ROOT/'reports/nested-storage-targeted-regressions.json').write_text(json.dumps({
  'tests':rows,'intended_tests':len(names),'all_passed':all(r['returncode']==0 for r in rows),
  'scope':'native original-type fixtures and targeted source/runtime regressions; not gameplay'},indent=2)+'\n')
sys.exit(0 if all(r['returncode']==0 for r in rows) else 1)
