import json,sys,hashlib
from pathlib import Path
sys.path.insert(0,'tools');from verify_recovery_suite import regression_inputs
root=Path('.');current=regression_inputs();basepath='reports/oct28-publication-fixed-regression.json';base=json.loads(Path(basepath).read_text())
reruns={'verify_sourcefirst_friend_ctor.py':'reports/oct28-friend-rerun.json','verify_sourcefirst_header_constants.py':'reports/oct28-header-rerun.json','verify_sourcefirst_static_array_zero.py':'reports/oct28-array-rerun.json','verify_sourcefirst_nttp_original.py':'reports/oct28-nttp-rerun.json'}
allowed={'tests/source_factory/'+n for n in reruns}
def common_unchanged(inputs):return all(inputs.get(k)==current.get(k) for k in set(inputs)|set(current) if k not in allowed)
assert base['complete'] and base['regression_inputs_unchanged'] and common_unchanged(base['regression_inputs'])
assert {r['test'] for r in base['tests'] if r['status']!='passed'}==set(reruns)
for name,path in reruns.items():
 data=json.loads(Path(path).read_text());assert data['all_passed'] and data['regression_inputs_unchanged'] and common_unchanged(data['regression_inputs']),path
 key='tests/source_factory/'+name;assert data['regression_inputs'][key]==current[key],path
report={'format':'sourcefactory-regression-followup/1','full_frozen_run':basepath,'full_frozen_counts':base['counts'],'targeted_passed_reruns':reruns,'current_checks_verified':base['selected_tests'],'compiler_and_runtime_unchanged_since_full_run':True,'only_changed_test_files':sorted(allowed),'latest_test_revision_executed_in_one_full_run':False,'compiler_sha256':current['tools/source_ast_to_js.py'],'gameplay_verified':False}
Path('reports/oct28-regression-followup.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
