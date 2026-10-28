#!/usr/bin/env python3
"""Autonomous compiler-recovery controller for all original Make-selected units.

Plan across *definitions*, not repeated error messages. Input comes from the
verified source-first manifest inventory; never infer compilation success from
an earlier checkpoint or a guessed owner. A run always creates a new cold build
output by default, then fixed-point linking, syntax/import auditing and a boot
audit. Reporting preserves the difference between a 90% GOAL and an observed
validated recovery ratio. No emulator or synthetic gameplay path.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict, deque
import json
import hashlib
import math
import os
from pathlib import Path
import re
import subprocess
import sys
from datetime import datetime, timezone
from source_first_missing_map import sweep as sweep_missing_map
from source_first_file_audit import report as file_inventory_report
from source_first_coverage_gate import audit as coverage_audit

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'factory-output/source-first/current-full-linkage-fix/global-recovery.json'
COLD=ROOT/'factory-output/source-first/autonomous'
FAMILIES=(
 ('linkage','unlinked identifiers:'),
 ('cpp-operators','CXXOperatorCallExpr'),
 ('member-access','nonidentifier member'),
 ('abi-layout','sizeof/alignof record layout:'),
 ('default-args','CXXDefaultArgExpr'),
 ('pointer-alias','pointer arithmetic/comparison requires bounded memory view'),
 ('cpp-overloads','ambiguous/overloaded source definitions'),
 ('control-flow','source control flow:'),
 ('ranges','C++ range iteration'),
 ('aggregate-initialization','global array initializer'),
 ('lifetime','nontrivial C++ temporary cleanup'),
 ('constructor','constructor type '),
 ('record-storage','class pointer/reference field'),
 ('header-macros','builtin __builtin_'),
)
def family(reason):
    for group,prefix in FAMILIES:
        if reason.startswith(prefix):return group
    if reason.startswith('unsupported global array element type '):return 'aggregate-initialization'
    if reason.startswith('string initializer in non-character array'):return 'aggregate-initialization'
    return re.split(r': ',reason,maxsplit=1)[0][:110]

def read_link(path):
    d=json.loads(path.read_text())
    if d.get('format')!='source-first-global-recovery/1':
        raise ValueError(f'unsupported global recovery manifest: {path}')
    return d

def summarize(current,baseline,inventory_total=156, current_emitted=None, fresh_inventory=False):
    unique=len(current.get('remaining',[]))
    previous=len(baseline.get('remaining',[]))
    target=math.ceil(previous*.90)
    completed=current.get('completed_source_units',0)
    # Relative count alone cannot confirm every old definition is the same
    # definition. Additionally demand complete source-unit coverage and a
    # direct per-source name/status comparison when classifying recovery.
    old={(x['source'],x['name']) for x in baseline['remaining']}
    now={(x['source'],x['name']) for x in current['remaining']}
    historically_blocked_now_absent=old-now
    # Only a newly EMITTED original source definition counts as recovered.
    # A name disappearing because of AST filtering/renaming is not recovery.
    original_recovered=old & (current_emitted or set())
    only_count=min(len(original_recovered),max(0,previous-unique))
    fully_audited=completed==inventory_total and current.get('selected_source_units')==inventory_total
    clean=len(current.get('invalid_imports_or_syntax',[]))==0
    measured=only_count if fully_audited and clean and fresh_inventory else None
    by_family=Counter(family(x['reason']) for x in current['remaining'])
    old_families=Counter(family(x['reason']) for x in baseline['remaining'])
    regressions=now-old
    return {
        'goal':'Recover at least 90% of the historical blocked original-source definitions',
        'historical_blocked':previous,'target_additional_recoveries':target,
        'target_maximum_remaining':previous-target,
        'historical_verified_exports':baseline['unique_exports'],
        'current_verified_exports':current['unique_exports'],
        'current_module_emitted_definitions':current.get('module_emitted_definition_entries'),
        'current_private_definitions':current.get('internal_linkage_definitions'),
        'external_exports_are_not_comparable_to_legacy_mixed_linkage_counts':True,
        'current_blocked':unique,'current_completed_units':completed,
        'inventory_units_expected':inventory_total,
        'full_inventory_coverage':fully_audited,'syntax_and_imports_clean':clean,
        'definition_identity_preserved_across_inventory':len(old & now),
        'historically_blocked_definitions_absent_in_current':len(historically_blocked_now_absent),
        'previously_blocked_now_emitted':len(original_recovered),
        'cold_current_inventory_verified':bool(fresh_inventory and fully_audited),
        'newly_blocked_identity_count':len(regressions),
        'net_blocker_reduction':previous-unique if fully_audited and fresh_inventory else None,
        'current_blocked_partial_inventory_only':not fully_audited,
        'verified_net_recovery_lower_bound':measured,
        'verified_target_fraction':round(measured/previous,6) if measured is not None else None,
        'ninety_percent_goal_met':bool(measured is not None and measured>=target),
        'remaining_failure_families':dict(by_family.most_common()),
        'historical_failure_families':dict(old_families.most_common()),
        'ambiguous_cross_unit_exports':len(current.get('ambiguous_export_names',{})),
        'strict_game_boot_not_established_by_compiler_recovery':True,
    }

def boot_dependency_priorities(global_report, entry='app_main', probes=('enginePreInit',), depth_limit=2):
    """Rank *original-source* owners from observed AST references, never guesses.

    Diagnostic records from the historical complete inventory are planning
    hints only. They do not count as fresh executable exports or verified boot.
    Ambiguous owners are skipped rather than silently selecting a provider.
    """
    source_rows = defaultdict(list)
    owner_candidates = defaultdict(set)
    for row in global_report.get('remaining', []):
        owner_candidates[row['name']].add(row['source'])
    base_dir = BASE.parent
    for path in base_dir.rglob('*.manifest.json'):
        document = json.loads(path.read_text())
        source = document.get('source')
        if not source:continue
        for row in document.get('definitions', []):
            for name in {row.get('name'), row.get('source_name')} - {None}:
                owner_candidates[name].add(source)
                source_rows[(source, name)].append(row)
    owners = {name:next(iter(sources)) for name,sources in owner_candidates.items() if len(sources)==1}
    by_source = {}
    visited = set(); queue = deque([(name, 0) for name in dict.fromkeys([entry, *probes])]); missing = set()
    while queue:
        name, depth = queue.popleft()
        if name in visited:continue
        visited.add(name)
        source=owners.get(name)
        if source is None:
            missing.add(name);continue
        by_source[source]=min(depth,by_source.get(source,depth))
        if depth>=depth_limit:continue
        rows=source_rows.get((source,name), [])
        for row in rows:
            references=row.get('source_references', row.get('unresolved_references', []))
            for ref in references:
                if ref!=name and ref not in visited:queue.append((ref,depth+1))
    return by_source, sorted(missing)

def plan(global_report, inventory_total, boot_entry='app_main'):

    """Rank families and affected TUs from proven unresolved output, not mocks."""
    rows=global_report['remaining']; failures=defaultdict(list)
    for row in rows:failures[row['source']].append(row)
    # Score by how many original C/C++ definitions are actually gated, with
    # priority for source/build and source/duke3d boot/gameplay code.
    boot_depths, unowned_boot_refs = boot_dependency_priorities(global_report,boot_entry)
    priorities=[]
    for src,entries in failures.items():
        dist=Counter(family(x['reason']) for x in entries)
        boot_multiplier=3 if src.startswith('source/duke3d/') or src.startswith('source/build/') else 1
        dependencies=sum(group=='linkage' for group in (family(x['reason']) for x in entries))
        depth=boot_depths.get(src)
        # Make the real entry and its *proven* source dependencies lead bounded
        # smoke runs; other units still follow the original weighted inventory.
        if depth is not None:
            priority_score=100_000_000-depth*10_000_000+boot_multiplier*(len(entries)+dependencies)
        else:priority_score=boot_multiplier*(len(entries)+dependencies)
        priorities.append({'source':src,'blocked':len(entries),
            'linkage_blocked':dependencies,'boot_priority':boot_multiplier,
            'score':priority_score,'boot_dependency_depth':depth,
            'families':dict(dist.most_common())})
    priorities.sort(key=lambda x:(-x['score'],x['source']))
    return {'source':'Clang original source-first linked manifests',
            'observed_units':global_report['completed_source_units'],
            'expected_units':inventory_total,
            'boot_entry':boot_entry,'boot_source_depths':boot_depths,
            'boot_unowned_references':unowned_boot_refs,
            'priority_units':priorities,
            'priority_families':dict(Counter(family(x['reason']) for x in rows).most_common()),
            'unverified_owner_or_build_synthetic_count':0,
            'retries_require_real_source_compilation':True}

def invalidate_failed_link(directory, returncode):
    """An earlier published link must not attest a later failed link attempt."""
    directory=Path(directory)
    compile_report=directory/'automatic/recovery-report.json'
    old_manifest=directory/'globally-linked/global-recovery.json'
    failure={'format':'source-first-link-stage-failure/1','status':'failed',
        'linker_stage_exit_code':returncode,'recorded_utc':datetime.now(timezone.utc).isoformat(),
        'source_compile_report_present':compile_report.is_file(),
        'source_compile_report_sha256':hashlib.sha256(compile_report.read_bytes()).hexdigest() if compile_report.is_file() else None,
        'previous_link_manifest_present_but_not_accepted':old_manifest.is_file(),
        'linked_manifest_sha256':None,'original_gameplay_verified':False}
    for name in ('source-build-attestation.json','failed-link-stage.json'):
        target=directory/name;stage=target.with_suffix('.json.partial')
        stage.write_text(json.dumps(failure,indent=2)+'\n',encoding='utf-8')
        os.replace(stage,target)
    return failure


def command(args):
    base=read_link(BASE)
    directory=args.out.resolve()
    # Complete original-source blocker mapping precedes EVERY plan/build.
    # Historical maps are explicitly read-only measurements until a new cold
    # full-inventory compilation proves otherwise.
    historical_map=sweep_missing_map(BASE.parent,BASE)
    directory.mkdir(parents=True,exist_ok=True)
    # Inspect EVERY file in both original source archives before undertaking
    # compilation; source provenance and non-selected build targets may not
    # silently disappear behind the 156-entry Make command database.
    file_audit=file_inventory_report()
    (directory/'all-files-audit.json').write_text(json.dumps(file_audit,indent=2))
    if file_audit['extraction_and_selection_errors']:
        raise SystemExit('ALL-FILES AUDIT FAILED: original source tree does not match captured archives; see all-files-audit.json')
    blocker_root=directory/'missing-map'
    blocker_root.mkdir(parents=True,exist_ok=True)
    (blocker_root/'historical-complete.json').write_text(json.dumps(historical_map,indent=2))
    (blocker_root/'historical-summary.json').write_text(json.dumps({
        k:v for k,v in historical_map.items() if k not in
        ('all_blocked_definitions','cyclic_components','high_fanout_missing_providers','family_workgroups')},indent=2))
    (blocker_root/'shared-provider-roots.json').write_text(json.dumps(historical_map['high_fanout_missing_providers'],indent=2))
    target=(directory/'globally-linked/global-recovery.json' if args.mode=='audit'
            else directory/'global-recovery.json')
    compilation_returncode=linking_returncode=0
    if args.mode in ('run','build'):
        # Extract all Make-selected TUs and their headers before attempting
        # source recovery. Semantic extraction errors are evidence, not a
        # reason to erase independent compiler diagnostics or stop at TU one.
        semantic_index=ROOT/'reports/semantic-index.sqlite'
        semantic_command=[sys.executable,str(ROOT/'tools/source_semantic_index.py'),
                          '--resume','--out',str(semantic_index)]
        print('Extracting canonical Clang declaration index; progress: '+
              str(directory/'semantic-extraction.log'),flush=True)
        with (directory/'semantic-extraction.log').open('w',encoding='utf-8') as semantic_log:
            semantic_result=subprocess.run(semantic_command,cwd=ROOT,stdout=semantic_log,
                                           stderr=subprocess.STDOUT,text=True)
        (directory/'semantic-extraction-result.json').write_text(json.dumps({
            'command':semantic_command,'exit_code':semantic_result.returncode,
            'index':str(semantic_index),'index_present':semantic_index.is_file(),
            'summary_present':semantic_index.with_suffix('.summary.json').is_file(),
            'zero_exit_is_not_complete_semantic_extraction':True},indent=2),encoding='utf-8')
        if semantic_result.returncode:
            print('Semantic extraction incomplete; diagnostics retained in '
                  'semantic-extraction.log; proceeding with source compiler audit',file=sys.stderr)
        # Reconcile the immutable latest baseline with the SAME declaration
        # index used for the fresh compile. Missing/ambiguous USRs remain unknown.
        historical_reports=[sys.executable,str(ROOT/'tools/source_first_reports.py'),
                            '--manifests',str(BASE.parent),'--entry',args.boot_entry,
                            '--out',str(ROOT/'reports/historical-latest')]
        if semantic_index.is_file():
            historical_reports+=['--semantic-index',str(semantic_index)]
        subprocess.run(historical_reports,cwd=ROOT,check=True)
        cold=directory/'automatic';linked=directory/'globally-linked'
        if directory==ROOT/'factory-output/source-first':raise SystemExit('refuse to overwrite historical compiler outputs')
        directory.mkdir(parents=True,exist_ok=True)
        priority_path=directory/'initial-priorities.json'
        priority_path.write_text(json.dumps(plan(base,156,args.boot_entry),indent=2))
        automatic=[sys.executable,str(ROOT/'tools/source_first_automate.py'),
                   '--out',str(cold),'--jobs',str(args.jobs),'--batch-size',str(args.batch_size),
                   '--timeout',str(args.timeout),'--priority-file',str(priority_path),
                   '--no-global-link']
        if args.resume:automatic.append('--resume')
        if args.persistent_ast_cache:automatic.extend(['--persistent-ast-cache','--ast-cache-shards',str(args.ast_cache_shards)])
        if args.max_units:automatic+=['--max-units',str(args.max_units)]
        compiler_result=subprocess.run(automatic,cwd=ROOT)
        compilation_returncode=compiler_result.returncode
        if compilation_returncode:print('Autonomous cold compile exited nonzero; available manifests retained',file=sys.stderr)
        if (cold/'original-build-inventory.json').is_file() and (cold/'recovery-report.json').is_file():
            coverage=coverage_audit(file_audit,
                json.loads((cold/'original-build-inventory.json').read_text()),
                json.loads((cold/'recovery-report.json').read_text()))
            (directory/'all-files-coverage.json').write_text(json.dumps(coverage,indent=2))
            if not coverage['all_make_selected_translation_units_compiled']:
                print('INCOMPLETE: some Make-selected source units were not compiled; see all-files-coverage.json',file=sys.stderr)
        linkcmd=[sys.executable,str(ROOT/'tools/source_first_global_link.py'),
                 '--directory',str(cold),'--out',str(linked),
                 '--timeout',str(args.timeout),'--rounds',str(args.rounds),'--jobs',str(args.jobs),
                 '--retry-budget',str(args.retry_budget)]
        if args.resume:linkcmd.append('--resume')
        linked_result=subprocess.run(linkcmd,cwd=ROOT)
        linking_returncode=linked_result.returncode
        if linking_returncode:
            invalidate_failed_link(directory,linking_returncode)
            print('Cross-unit link audit failed; prior link output is not current. '
                  'Auditing the complete compilation inventory instead.',file=sys.stderr)
            # Retain every successfully attempted unit even if publication of
            # the link failed. Never measure an older partial linked tree as
            # this run's output.
            failed_reports=[sys.executable,str(ROOT/'tools/source_first_reports.py'),
                '--manifests',str(cold),'--compile-report',str(cold/'recovery-report.json'),
                '--entry',args.boot_entry,'--out',str(ROOT/'reports')]
            if semantic_index.is_file():failed_reports+=['--semantic-index',str(semantic_index)]
            subprocess.run(failed_reports,cwd=ROOT,check=True)
            return 2
        target=linked/'global-recovery.json'
        if target.is_file():
            # Current map never silently replaces historical measurements.
            current_map=sweep_missing_map(linked)
            (blocker_root/'current-complete.json').write_text(json.dumps(current_map,indent=2))
            (blocker_root/'current-summary.json').write_text(json.dumps({
                k:v for k,v in current_map.items() if k not in
                ('all_blocked_definitions','cyclic_components','high_fanout_missing_providers','family_workgroups')},indent=2))
        # Diagnostics can be run independently without requiring a playable
        # runtime; nonzero here is the EXPECTED boot result for incomplete code.
        subprocess.run([sys.executable,str(ROOT/'tools/source_first_boot_audit.py'),
                        '--entry',args.boot_entry,'--probe','enginePreInit',
                        '--manifest-root',str(linked),'--fast-current-only',
                        '--out',str(directory/'boot-audit.json')],cwd=ROOT)
    elif args.mode=='plan' and not target.is_file():target=BASE
    if not target.is_file():raise SystemExit('no completed linked-manifest audit: '+str(target))
    latest=read_link(target)
    inventory=156
    attest=directory/'source-build-attestation.json'
    if args.mode in ('run','build'):
        attest.write_text(json.dumps({
            'linked_manifest_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),
            'original_units_compiled':latest.get('completed_source_units'),
            'source_compile_report_present':(directory/'automatic/recovery-report.json').is_file(),
            'run_generated_at_utc':datetime.now(timezone.utc).isoformat()
        },indent=2))
    is_fresh=False
    if target.resolve()!=BASE.resolve() and args.mode in ('audit','run','build') and attest.is_file():
        record=json.loads(attest.read_text())
        is_fresh=(record.get('linked_manifest_sha256')==hashlib.sha256(target.read_bytes()).hexdigest()
                  and record.get('source_compile_report_present') is True
                  and (directory/'automatic/recovery-report.json').is_file()
                  and json.loads((directory/'automatic/recovery-report.json').read_text()).get(
                      'uniform_compiler_revision_verified') is True)
    current_emitted=set()
    if is_fresh:
        modules=target.parent
        for manifest in modules.rglob('*.manifest.json'):
            # Do not accept generated/link scratch files outside the owned
            # source translation-unit manifest tree.
            unit=json.loads(manifest.read_text())
            src=unit.get('source')
            if not src:continue
            for item in unit.get('definitions',[]):
                if item.get('status')=='source-first':
                    current_emitted.add((src,item['name']))
    result=summarize(latest,base,inventory,current_emitted,is_fresh)
    result['all_source_files_audited']=file_audit['metrics']['all_archived_source_files_examined']
    result['all_original_archive_members_checked']=True
    result['unselected_translation_candidates_reported']=file_audit['metrics']['original_translation_candidates_not_selected_by_make']
    result['make_build_selected_translation_units']=file_audit['metrics']['make_selected_units']
    result['nonselected_sources_are_not_compilation_success']=True
    if (directory/'all-files-coverage.json').is_file():
        coverage_result=json.loads((directory/'all-files-coverage.json').read_text())
        result['every_make_selected_unit_compiled_this_run']=coverage_result['all_make_selected_translation_units_compiled']
        result['compile_units_not_yet_attempted']=len(coverage_result['scheduled_but_not_attempted'])+len(coverage_result['selected_but_not_scheduled'])
        result['compile_units_failed']=len(coverage_result['reported_failed'])
    result['measurement_source']=str(target)
    result['cold_run_performed']=args.mode in ('run','build')
    result['historical_baseline_source']=str(BASE)
    result['built_at_utc']=datetime.now(timezone.utc).isoformat()
    result['compiler_stage_exit_code']=compilation_returncode if args.mode in ('run','build') else None
    result['linker_stage_exit_code']=linking_returncode if args.mode in ('run','build') else None
    # Preserve current and historical manifest measurements separately. This
    # inventories every available definition and never upgrades emission into
    # semantic recovery or runtime boot evidence.
    report_command=[sys.executable,str(ROOT/'tools/source_first_reports.py'),
                    '--manifests',str(target.parent),'--entry',args.boot_entry,
                    '--out',str(ROOT/'reports' if target.resolve()!=BASE.resolve()
                                else directory/'reports/historical')]
    compile_report=directory/'automatic/recovery-report.json'
    if target.resolve()!=BASE.resolve() and compile_report.is_file():
        report_command+=['--compile-report',str(compile_report)]
    semantic_index=ROOT/'reports/semantic-index.sqlite'
    if semantic_index.is_file():
        report_command+=['--semantic-index',str(semantic_index)]
    subprocess.run(report_command,cwd=ROOT,check=True)
    # Definition emission, declaration comparison, and actual gameplay are
    # independent measurements. Save the factual incomplete acceptance report
    # even when the final strict game gate must return nonzero.
    comparison_command=[sys.executable,str(ROOT/'tools/source_recovery_compare.py')]
    subprocess.run(comparison_command,cwd=ROOT,check=True)
    declaration_comparison=json.loads((ROOT/'reports/recovery-comparison.json').read_text(encoding='utf-8'))
    result['legacy_name_based_syntax_emission_estimate']=result.get('verified_net_recovery_lower_bound')
    result['verified_net_recovery_lower_bound']=(
        declaration_comparison['verified_executable_recovered_identities']
        if declaration_comparison['current_compilation_attested'] else None)
    result['ninety_percent_goal_met']=(declaration_comparison['ninety_percent_executable_recovery']=='passed')
    result['historical_recovery_identity_limitations']=declaration_comparison['limitations']
    acceptance_command=[sys.executable,str(ROOT/'tools/verify_port_acceptance.py'),
                        '--build-root',str(directory)]
    subprocess.run(acceptance_command,cwd=ROOT,check=True)
    next_steps=plan(latest,inventory,args.boot_entry)
    directory.mkdir(parents=True,exist_ok=True)
    (directory/'autonomous-progress.json').write_text(json.dumps(result,indent=2,sort_keys=True))
    (directory/'autonomous-priorities.json').write_text(json.dumps(next_steps,indent=2,sort_keys=True))
    print(json.dumps({k:v for k,v in result.items() if k not in ('remaining_failure_families','historical_failure_families')},indent=2))
    if args.mode=='build':
        gate=subprocess.run([sys.executable,str(ROOT/'tools/source_first_game_gate.py'),
                             '--build-root',str(directory)],cwd=ROOT)
        if gate.returncode:return gate.returncode
    if args.mode in ('run','build') and (compilation_returncode or linking_returncode):
        return 2
    if args.strict and not result['ninety_percent_goal_met']:return 2
    return 0

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('mode',choices=('plan','audit','run','build'))
    ap.add_argument('--out',type=Path,default=COLD)
    ap.add_argument('--boot-entry',default='app_main',help='original-source entry point to prioritize')
    ap.add_argument('--jobs',type=int,default=2)
    ap.add_argument('--batch-size',type=int,default=1)
    ap.add_argument('--timeout',type=int,default=180)
    ap.add_argument('--rounds',type=int,default=24)
    ap.add_argument('--retry-budget',type=int,default=12,
                    help='max global-link AST retry sources per round (0=unbounded)')
    ap.add_argument('--max-units',type=int,default=0,help='0=ALL selected original units')
    ap.add_argument('--resume',action='store_true')
    ap.add_argument('--persistent-ast-cache',action='store_true',help='retain raw Clang AST across safe emitter-only revisions')
    ap.add_argument('--ast-cache-shards',type=int,default=8,help='parallel independent AST cache locks')
    ap.add_argument('--strict',action='store_true',help='fail unless 90% recovery verified')
    args=ap.parse_args()
    if args.jobs<1 or args.jobs>8 or args.batch_size<1 or args.timeout<1 or args.rounds<1 or args.max_units<0 or args.retry_budget<0 or not 1<=args.ast_cache_shards<=64:
        ap.error('invalid resource budget')
    # Four simultaneous large Clang ASTs can exhaust constrained build
    # containers and produce misleading failed-definition reports. Adapt
    # concurrency to the actual cgroup memory limit before dispatching.
    limit_file=Path('/sys/fs/cgroup/memory.max')
    try:
        limit=int(limit_file.read_text().strip())
    except (OSError,ValueError):
        limit=0
    if limit and limit<8*1024**3 and args.jobs>2:
        print(f'RESOURCE GUARD: {limit/1024**3:.1f} GiB memory limit; '
              f'using 2 parallel Clang workers instead of {args.jobs}',file=sys.stderr)
        args.jobs=2
    if os.name=='nt':
        # Windows has no cgroup memory.max. Base concurrency on available RAM
        # before dispatching large Clang JSON ASTs, including other active apps.
        import ctypes
        class MemoryStatus(ctypes.Structure):
            _fields_=[('length',ctypes.c_ulong),('load',ctypes.c_ulong),
                      ('total',ctypes.c_ulonglong),('available',ctypes.c_ulonglong),
                      ('total_page',ctypes.c_ulonglong),('available_page',ctypes.c_ulonglong),
                      ('total_virtual',ctypes.c_ulonglong),('available_virtual',ctypes.c_ulonglong),
                      ('extended',ctypes.c_ulonglong)]
        status=MemoryStatus();status.length=ctypes.sizeof(status)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            allowed=1 if status.available<3*1024**3 else 2
            if args.jobs>allowed:
                print(f'RESOURCE GUARD: {status.available/1024**3:.1f} GiB RAM available; '
                      f'using {allowed} Clang worker(s)',file=sys.stderr,flush=True)
                args.jobs=allowed
    return command(args)
if __name__=='__main__':sys.exit(main())
