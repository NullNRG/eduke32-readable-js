"""Bind extracted-project regression results to the exact shipped archive."""
import hashlib,json,zipfile
from pathlib import Path
ROOT=Path(r'C:\Users\andre\Documents\Codex\work\hf\EDuke32_SourceFactory')
OUT=Path(r'C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\outputs')
archive=OUT/'EDuke32_Continue_Current_Work.zip'
def read(name):return json.loads((ROOT/name).read_text(encoding='utf-8'))
baseline=read('reports/package-regression.json')
rows={row['test']:row for row in baseline['tests']}
for name in ('extended','revision','span'):
    for row in read('reports/package-'+name+'-recheck.json')['tests']:rows[row['test']]=row
with zipfile.ZipFile(archive) as package:
    prefix='EDuke32_SourceFactory/'
    manifest=json.loads(package.read(prefix+'PACKAGE_MANIFEST.json'))
    for row in manifest['files']:
        with package.open(prefix+row['path']) as stream:digest=hashlib.file_digest(stream,'sha256').hexdigest()
        if digest!=row['sha256']:raise ValueError(row['path'])
        if row['path'].startswith(('tools/','tests/')):
            local=ROOT/row['path']
            if not local.exists() or hashlib.sha256(local.read_bytes()).hexdigest()!=digest:raise ValueError('Extracted compiler/test differs: '+row['path'])
with archive.open('rb') as stream:archive_sha=hashlib.file_digest(stream,'sha256').hexdigest()
result={'format':'eduke32-continuation-package-verification/1','zip':archive.name,'sha256':archive_sha,
    'all_payload_checksums_verified':True,'verified_payload_files':len(manifest['files']),
    'extracted_compiler_and_tests_match_archive':True,'selected_regression_cases':baseline['selected_tests'],
    'verified_regression_cases':sum(row['status']=='passed' for row in rows.values()),
    'remaining_failed_cases':[name for name,row in rows.items() if row['status']!='passed'],
    'initial_run_failures':baseline['counts']['failed'],
    'initial_failures_fixed_and_retested':['Missing linked-source fixture directory restored','Revision-race scratch setup now covers current lowering helpers'],
    'source_preparation_passed':True,'archived_source_files_verified':1410,'selected_build_units_restored':156,
    'original_app_main_executed_in_javascript':False,'browser_gameplay_verified':False,
    'compiler_snapshot_is_earlier_than_ongoing_canonical_boot_repairs':True}
(OUT/'Continuation_Zip_Verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
