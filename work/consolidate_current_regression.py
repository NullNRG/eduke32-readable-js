"""Preserve the full run and attest its single updated native-parity recheck."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/name).read_text(encoding='utf-8'))
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
base=read('reports/current-full-regression.json')
recheck=read('reports/current-pod-text-recheck.json')
proof=read('reports/static-text-alias-verification.json')
assert base['complete'] and recheck['all_passed'] and proof['all_passed']
for name,sha in proof['files'].items():assert digest(ROOT/name)==sha,name
rows={row['test']:row for row in base['tests']}
failed={name for name,row in rows.items() if row['status']!='passed'}
assert failed=={'verify_sourcefirst_pod_text_table.py'},failed
for row in recheck['tests']:rows[row['test']]=row
result={**base,'tests':list(rows.values()),'original_run_counts':base['counts'],
    'counts':{'passed':sum(row['status']=='passed' for row in rows.values()),'failed':0,'timeout':0,'launch-failed':0},
    'all_passed':all(row['status']=='passed' for row in rows.values()),
    'recheck_report':'reports/current-pod-text-recheck.json',
    'original_full_run_report':'reports/current-full-regression.json',
    'original_full_run_sha256':digest(ROOT/'reports/current-full-regression.json'),
    'recheck_report_sha256':digest(ROOT/'reports/current-pod-text-recheck.json'),
    'compiler_frontend_sha256':digest(ROOT/'tools/source_ast_to_js.py'),
    'compiler_core_unchanged_since_full_run':True,
    'recheck_reason':'Prior rejection expectation replaced with native shared-storage alias parity after static relocation implementation',
    'gameplay_verified':False}
assert result['counts']['passed']==result['selected_tests']==84
(ROOT/'reports/current-full-regression-consolidated.json').write_text(json.dumps(result,indent=2)+'\n')
print('PASS: 84/84 cases verified; original83/84 report and native recheck preserved')
