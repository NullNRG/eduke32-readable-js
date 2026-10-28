#!/usr/bin/env python3
"""Account for every Make-selected translation unit, no missing or double-counted files.

Distinguishes source-archive *inspection* from actual C++ transpilation, and
per-unit compiler success from whole-program linking and original gameplay.
"""
from __future__ import annotations
from collections import Counter
import argparse, json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]

def audit(audit_manifest:dict,compile_inventory:dict,compile_report:dict):
    selected={entry['source'] for entry in compile_inventory['all_sources']}
    selected.update(compile_inventory.get('missing_generated_sources',[]))
    selected.update(x['source'] for x in compile_inventory.get('recovered_make_sources',[]))
    declared=set(compile_inventory.get('selected_sources') and (x['source'] for x in compile_inventory['selected_sources']) or selected)
    rows=compile_report.get('batch_results',[])
    status={};duplicate=[]
    for row in rows:
        for source in row.get('sources',[]):
            if source in status:duplicate.append(source)
            else:status[source]=row.get('status','unknown')
    expected={r['source'] for r in compile_inventory['all_sources']}
    expected.update(compile_inventory.get('missing_generated_sources',[]))
    scanned=set(r['path'] for r in audit_manifest['all_eduke_source_entries'])
    scanned.update(audit_manifest.get('generated_source_with_verified_make_rule',[]))
    if len(expected)!=audit_manifest['metrics']['make_selected_units']:
        raise ValueError('Make selected inventory inconsistent with all-files audit')
    unscheduled=sorted(expected-declared)
    pending=sorted(declared-status.keys())
    failed=sorted(s for s,state in status.items() if state!='ok')
    reported_unknown=sorted(status.keys()-expected)
    missing_from_archive=sorted(expected-scanned)
    clean=not (unscheduled or pending or failed or duplicate or reported_unknown or missing_from_archive)
    return {'format':'source-first-coverage-gate/1',
      'original_source_archives_fully_inspected':audit_manifest['metrics']['archive_extraction_errors']==0,
      'source_archive_files_examined':audit_manifest['metrics']['all_archived_source_files_examined'],
      'original_cplusplus_candidates_not_in_current_Make':audit_manifest['metrics']['original_translation_candidates_not_selected_by_make'],
      'captured_make_selected_total':len(expected),'build_units_scheduled':len(declared),
      'build_units_reported':len(status),'build_units_completed':sum(v=='ok' for v in status.values()),
      'selected_but_not_scheduled':unscheduled,
      'scheduled_but_not_attempted':pending,
      'reported_failed':failed,'duplicate_unit_reports':sorted(set(duplicate)),
      'unknown_compiler_source_reports':reported_unknown,'selected_without_archived_or_Make_generated_source':missing_from_archive,
      'all_make_selected_translation_units_compiled':clean,
      'all_units_compiled_under_one_attested_compiler_revision':(clean and
        compile_report.get('uniform_compiler_revision_verified') is True),
      'readable_definitions':compile_report.get('readable_definitions'),
      'blocked_definitions':compile_report.get('blocked_definitions'),
      'invalid_imports':compile_report.get('invalid_imports'),
      'full_game_linked':bool(compile_report.get('fully_linked_project')),
      'real_game_boot_verified':bool(compile_report.get('gameplay_verified'))}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--all-files',type=Path,default=ROOT/'factory-output/source-first/all-files-audit.json')
    p.add_argument('--build-root',type=Path,default=ROOT/'factory-output/source-first/automatic')
    p.add_argument('--out',type=Path)
    p.add_argument('--strict',action='store_true')
    args=p.parse_args()
    doc=audit(json.loads(args.all_files.read_text()),
              json.loads((args.build_root/'original-build-inventory.json').read_text()),
              json.loads((args.build_root/'recovery-report.json').read_text()))
    out=args.out or args.build_root/'all-files-coverage.json'
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(doc,indent=2))
    print(json.dumps({k:v if not isinstance(v,list) or len(v)<=12 else {'count':len(v),'sample':v[:8]} for k,v in doc.items()},indent=2))
    return 2 if args.strict and not doc['all_make_selected_translation_units_compiled'] else 0
if __name__=='__main__':sys.exit(main())
