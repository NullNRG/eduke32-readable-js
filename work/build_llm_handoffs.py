import hashlib,json,re,zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(r'C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\outputs')
OUT.mkdir(parents=True,exist_ok=True)

def digest(path):
    with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
def encoded(value):return (json.dumps(value,indent=2,sort_keys=True)+'\n').encode()
def read(name):return json.loads((ROOT/name).read_text(encoding='utf-8-sig'))

inputs=[{'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':digest(p)}
        for folder in ('input-source','input-data') for p in sorted((ROOT/folder).iterdir()) if p.is_file()]
commands=read('factory-output/compile_commands.json')
for command in commands:command['directory']='PREPARE_SOURCES_WILL_SET_THIS'
audit=read('reports/source-files-current.json')
selection={'selected_units':len(commands),'selected_files':[r['file'] for r in commands],
    'generated_units':audit['generated_source_with_verified_make_rule'],
    'excluded_translation_candidates':audit['unselected_translation_candidates'],
    'archive_metrics':audit['metrics'],'excluded_files_are_not_compiled_successes':True}
abi={'target':'x86_64-linux-gnu','byte_order':'little','pointer_bytes':8,'long_bytes':8,
     'int_bytes':4,'short_bytes':2,'char_bytes':1,'plain_char_signed':False,
     'float_bytes':4,'double_bytes':8,'cxx_standard':'gnu++14',
     'exceptions':False,'rtti':False,'source_of_settings':'captured Make compilation database',
     'windows_native_oracle_abi_is_different':'Windows x64 LLP64; do not compare unadjusted ABI layouts'}

goal='''Build the actual EDuke32/Duke Nukem 3D game from the supplied original C/C++ as readable JavaScript ES modules. Run original app_main, original engine/game/CON behavior and original GRP assets in an offline browser index.html. Implement real rendering, input, audio, enemies, weapons, collision, interactions and save/load. No WebAssembly, emulation, LLVM/opcode execution, imitation engine or fake boot/gameplay. Browser/platform adapters must provide real documented behavior. Fix shared compiler/runtime causes in bulk and link dependencies to a fixed point. Verify against original native behavior and at least 60 seconds of real browser gameplay. Do not claim completion from export counts or passing isolated compiler tests.'''

def common():
    result={r['path']:ROOT/r['path'] for r in inputs}
    for p in (ROOT/'licenses').rglob('*'):
        if p.is_file():result[p.relative_to(ROOT).as_posix()]=p
    result['tools/prepare_sources.py']=ROOT/'tools/prepare_sources.py'
    result['tools/verify_package.py']=ROOT/'tools/verify_package.py'
    return result

def state(mode):
    return {'format':'eduke32-llm-handoff/1','mode':mode,'original_inputs':inputs,
        'source_tree_directory':'factory-output/source-tree' if mode=='continuation' else 'source-tree',
        'compile_commands_path':'factory-output/compile_commands.json' if mode=='continuation' else 'build-context/compile_commands.json',
        'original_game_source_archive':'input-source/eduke32-master.zip',
        'secondary_original_reference_archive':'input-source/dukenukem3d-master.zip',
        'primary_game_assets':'input-data/DUKE3D.GRP','additional_supplied_assets':'input-data/SW.GRP',
        'javaScript_game_playable_verified':False,'playable_offline_html_present':False,
        'goal':goal}

def build(mode):
    files=common();status=state(mode)
    if mode=='continuation':
        # Include the current source-first compiler, runtime and tests; omit
        # superseded LLVM pipelines, imitation web demos and packaging history.
        exact={'bundle_modules.py','verify_js.py','source_control_flow.py','source_ast_to_js.py',
            'source_byte_records.py','source_ast_stream.py','source_header_records.py','source_semantic_index.py','source_trivial_assignment.py','source_recovery_compare.py','verify_port_acceptance.py',
            'verify_recovery_suite.py','run_python.mjs','run_logged_job.py','resume_windows.ps1',
            'sysroot-lock.json','libclang-resource-lock.json'}
        for p in (ROOT/'tools').rglob('*'):
            if not p.is_file() or '__pycache__' in p.parts:continue
            rel=p.relative_to(ROOT).as_posix()
            if (p.name in exact or p.name.startswith(('source_first_','source-first-','bootstrap_'))
                or re.fullmatch(r'source_.*_runtime\.mjs',p.name) or '/native-oracle/' in rel):files[rel]=p
        for folder in ('runtime','tests/source_factory'):
            for p in (ROOT/folder).rglob('*'):
                if not p.is_file() or '__pycache__' in p.parts or p.suffix=='.pyc':continue
                if folder=='runtime' and p.name=='llvm_context.mjs':continue
                if folder=='tests/source_factory' and not (p.name.startswith(('verify_sourcefirst','source_first_','original_menu_header_'))
                        or p.name in ('verify_semantic_index.py','runtime.test.mjs','portability.test.mjs')):continue
                if p.name=='verify_sourcefirst_trivial_assignment.py' and not (ROOT/'tools/source_trivial_assignment.py').exists():continue
                files[p.relative_to(ROOT).as_posix()]=p
        for p in (ROOT/'tests/source_first_link_fixture').rglob('*'):
            if p.is_file():files[p.relative_to(ROOT).as_posix()]=p
        pending=[]
        if not (ROOT/'tools/source_trivial_assignment.py').exists():
            for source,name in [('work/trivial-assignment-integration.patch','integration.patch'),
                    ('work/staged-trivial-assignment/tools/source_trivial_assignment.py','source_trivial_assignment.py'),
                    ('work/staged-trivial-assignment/tools/source_aggregate_assignment_runtime.mjs','source_aggregate_assignment_runtime.mjs'),
                    ('tests/source_factory/verify_sourcefirst_trivial_assignment.py','verify_sourcefirst_trivial_assignment.py')]:
                if (ROOT/source).exists():files['pending/trivial-assignment/'+name]=ROOT/source
            pending.append('pending/trivial-assignment: staged, not integrated or verified in the current compiler')
        staged=ROOT/'work/staged-header-globals'
        if staged.is_dir():
            for name in ('README.md','source_ast_to_js.py','header_globals.py.txt','header-globals-PENDING.patch','integrate_stage.py'):
                p=staged/name
                if p.is_file():files['pending/header-globals/'+name]=p
            pending.append('pending/header-globals: missing original EXTERN header definitions investigated; staged patch NOT integrated or native-tested; rebase on current menu/header compiler')
        for folder in ('globally-linked','current-full-linkage-fix','current-full-check/automatic','autonomous/linked-baseline'):
            for p in (ROOT/'factory-output/source-first'/folder).rglob('*'):
                if p.is_file() and p.suffix in ('.json','.mjs'):
                    files[p.relative_to(ROOT).as_posix()]=p
        files['factory-output/compile_commands.json']=encoded(commands)
        for name in ('dev-requirements.txt','eslint.config.mjs'):
            if (ROOT/name).exists():files[name]=ROOT/name
        package=read('package.json');kept={}
        for key,value in package['scripts'].items():
            if key=='bundle':continue # old bridge entry belongs to the omitted legacy pipeline
            referenced=re.findall(r'(?:tools|tests)/[^\s;&]+',value)
            if all(path in files for path in referenced):kept[key]=value
        # Remove aliases whose npm dependencies were intentionally omitted.
        changed=True
        while changed:
            changed=False
            for key,value in list(kept.items()):
                if any(k not in kept for k in re.findall(r'npm run ([\w:-]+)',value)):
                    del kept[key];changed=True
        kept['prepare:sources']='node tools/run_python.mjs tools/prepare_sources.py'
        kept['verify:package']='node tools/run_python.mjs tools/verify_package.py'
        kept['audit:reports']='node tools/run_python.mjs tools/source_first_reports.py'
        package['scripts']=kept
        package['description']='Current readable-source EDuke32 compiler; original JavaScript browser game incomplete'
        files['package.json']=encoded(package)
        report_names=['semantic-index.summary.json','semantic-original-imgui-resource-probe.json',
            'mutable-global-repair.json','mutable-global-verification.json','mutable-global-focused-regression.json',
            'post-storage-scope-regression-repair.json','handoff-checkpoint.json','trivial-assignment-verification.json','trivial-assignment-targeted-regressions.json',
            'aggregate-methods-targeted-regressions.json','static-relocation-verification.json','ast-stream-memory-probe.json',
            'static-text-alias-verification.json','ast-cache-policy.json','probe-reuse-verification.json',
            'static-array-targeted-regressions.json','menu-header-recovery.json','header-global-recovery.json','latest-integrated-regression.json',
            'all-blockers.json','all-blockers.csv','root-causes.json','dependency-graph.json','boot-blockers.json',
            'native-state-samples.json','native-oracle-evidence-freeze.json','native-frame-capture.json','native-engine-link.map','current-full-regression.json','current-full-regression-consolidated.json','current-pod-text-recheck.json',
            'recovery-regression.json','handoff-current-regression.json','build-portability-verification.json',
            'native-oracle-summary.json','native-oracle-handoff.md','native-flac-build.json','native-engine-build.json','native-engine-smoke.json',
            'native-engine-startup.json','native-engine-help.stderr.log','native-engine-game.stderr.log',
            'native-oracle-source-verification.json','input-provenance.json']
        for name in report_names:
            if (ROOT/'reports'/name).exists():files['reports/'+name]=ROOT/'reports'/name
        for p in (ROOT/'reports/historical-latest').glob('*'):
            if p.is_file() and p.suffix in ('.json','.csv'):files[p.relative_to(ROOT).as_posix()]=p
        if (ROOT/'artifacts/native-oracle/eduke32.exe').exists():
            files['artifacts/native-oracle/eduke32.exe']=ROOT/'artifacts/native-oracle/eduke32.exe'
        for directory in ('artifacts/native-oracle/frames','artifacts/native-oracle/state-samples'):
            for p in (ROOT/directory).rglob('*'):
                if p.is_file():files[p.relative_to(ROOT).as_posix()]=p
        native=read('reports/native-oracle-summary.json')
        sem=read('reports/semantic-index.summary.json')
        current_path='reports/latest-integrated-regression.json' if (ROOT/'reports/latest-integrated-regression.json').exists() else 'reports/current-full-regression-consolidated.json' if (ROOT/'reports/current-full-regression-consolidated.json').exists() else 'reports/handoff-current-regression.json'
        current=read(current_path) if (ROOT/current_path).exists() else None
        current_frontend_sha=digest(ROOT/'tools/source_ast_to_js.py')
        regression_frontend_sha=current.get('compiler_frontend_sha256') if current else None
        if not regression_frontend_sha and current and current.get('started_utc')=='2026-10-13T22:33:04.209902+00:00':regression_frontend_sha='d27c0cec0004fee1d2dd295ef3fe794f336f07a6d932a82660e7a03c2ef47261'
        status.update({'pending_unverified_work':pending,'implemented':['Source-first Clang AST readable-JS compiler and recursive header closure',
            'Internal/external linkage, ODR ownership and cyclic transactional linking',
            'Target-verified numeric POD/anonymous-union byte layouts and copies',
            'Mutable cross-unit global storage, stable addresses, typed narrowing and evaluate-once lvalues',
            'Content-guarded batch revision checks, retries and checkpoint invalidation',
            'Trivial aggregate assignment, original record prototypes and static pointer relocation',
            'Streaming Clang AST decoding, bounded disk cache and verified probe reuse',
            'Original header aggregate methods, concrete vector templates and canonical prototype providers',
            'Fixed-width enum and zero-initialized static arrays with native parity',
            'Browser platform/runtime foundations; incomplete original-engine integration'],
            'latest_mutable_global_native_state_comparisons':88,
            'latest_focused_regression_suites_passed':10,
            'previous_full_regression_suites_passed':77,
            'previous_full_regression_is_before_final_global_storage_changes':True,
            'handoff_current_regression':current,
            'current_frontend_sha256':current_frontend_sha,
            'saved_full_regression_frontend_sha256':regression_frontend_sha,
            'saved_full_regression_matches_current_frontend':current_frontend_sha==regression_frontend_sha,
            'semantic_index_summary':sem,
            'native_oracle':native,
            'last_complete_saved_compiler_inventory':{'units':156,'emitted_definition_entries':2969,
                'blocked_definition_entries':6257,'uniform_current_compiler_revision':False,'historical_only':True},
            'fresh_full_156_unit_build_under_final_compiler_revision_verified':False,
            'original_app_main_linked_or_executed_in_JavaScript':False,
            'ninety_percent_executable_recovery_verified':False,
            'remaining':['Fresh full 156-unit compile/link under final compiler revision',
                'Remaining C++ lifetime/ABI/allocator/pointer/aggregate semantics and source providers',
                'Complete original startup-to-gameplay dependency closure',
                'Original engine browser integration and actual offline game bundling',
                'Native/JS game-state parity and 60-second real browser gameplay verification'],
            'omitted_recomputable_data':['Multi-GB semantic SQLite caches, old build attempts, duplicate reports',
                'Extracted source duplicates, downloaded toolchain binaries and temporary scratch files'],
            'historical_manifests_are_planning_and_regression_fixtures_not_current_verified_output':True})
        for name in ('reports/full-game-build-process.json','reports/full-link-baseline-process.json'):
            if (ROOT/name).exists():
                job=read(name);files[name]=encoded(job);status['active_build_checkpoint']=job
        if (ROOT/'reports/full-game-build.log').exists():files['reports/full-game-build.tail.log']=(ROOT/'reports/full-game-build.log').read_bytes()[-20000:]
        if (ROOT/'factory-output/source-first/autonomous/semantic-extraction.log').exists():files['reports/semantic-extraction.tail.log']=(ROOT/'factory-output/source-first/autonomous/semantic-extraction.log').read_bytes()[-12000:]
        measured=ROOT/'factory-output/source-first/autonomous/automatic/recovery-report.json'
        if measured.exists():
            measured_bytes=measured.read_bytes();measured_report=json.loads(measured_bytes)
            files['reports/full-source-compilation-checkpoint.json']=measured_bytes
            status['latest_full_compilation_checkpoint']={k:measured_report.get(k) for k in
                ('attempted_units','verified_batch_units','failed_batch_units','uniform_compiler_revision_verified',
                 'compiler_revision_source_counts','readable_definitions','blocked_definitions','invalid_imports')}
            status['latest_full_compilation_checkpoint']['sha256']=hashlib.sha256(measured_bytes).hexdigest()
            status['latest_full_compilation_checkpoint']['predates_current_shared_semantic_repairs']=True
        baseline=ROOT/'factory-output/source-first/autonomous/linked-baseline/global-recovery.json'
        if baseline.exists():
            b=json.loads(baseline.read_bytes())
            status['all_unit_assembly_checkpoint']={k:b.get(k) for k in
                ('completed_source_units','selected_source_units','module_emitted_definition_entries',
                 'total_blocked_definitions','invalid_imports_or_syntax','recovery_round_limit',
                 'ast_dependency_recovery_attempted','full_game_linked','original_gameplay_verified')}
        text=f'''# Continue the existing EDuke32 JavaScript port

The original browser game is **not playable yet**. This ZIP preserves the current compiler/runtime/test work. Continue it; do not replace it with a new prototype.

{goal}

## Start

Extract to a short path, such as `C:\\Codex\\EDuke32`. From the extracted project directory:

```text
python tools/verify_package.py
python tools/prepare_sources.py
powershell -ExecutionPolicy Bypass -File tools/resume_windows.ps1
```

The Windows script installs pinned development dependencies and runs `npm run compile:game`. Python and Node/npm must already be installed. On Linux, install Clang, Python, Node and `dev-requirements.txt`, then use the same prepare/build commands with the documented Linux LP64 target. `tools/source_first_toolchain.py` defines the target contract.

## Current state

- Original sources and both supplied GRPs are intact. `DUKE3D.GRP` is the Duke game data; `SW.GRP` is additional supplied data.
- Latest global-storage/lvalue repair passes 88 native state comparisons and 10 focused regressions. Earlier 77-suite results predate that final repair. See `HANDOFF_STATE.json` for the latest full-suite result.
- The saved full-suite report predates the latest shared semantic repairs. Current native-focused evidence is in `reports/menu-header-recovery.json` and `reports/static-array-targeted-regressions.json`. `HANDOFF_STATE.json` records whether the saved full-suite compiler hash matches the shipped frontend. An active build checkpoint and log tails describe unfinished whole-program work.
- Original menu-header methods/prototypes now pass native comparisons, including borrowed pointer aliases and two-unit ownership. The latest header-global omission repair is staged under `pending/header-globals/`; it needs rebasing, native verification and integration.
- Corrected semantic extraction attempted all 156 selected units with matching libclang/resource versions. Full indirect-call, read/write and lifetime analysis remain incomplete.
- The original native executable builds and reaches E1L1 with the supplied GRP. Read-only state samples and framebuffer/palette captures are native reference evidence, **not the JavaScript deliverable or native/JS parity**. See `reports/native-oracle-summary.json`.
- A consistently versioned full compile attempted and verified all 156 units before the latest shared semantic repairs: 3,263 emitted entries and 6,018 blocked entries. A separately saved 156-unit assembly has no invalid imports/syntax, but used zero AST recovery rounds. These are incomplete compiler checkpoints, not executable recovery. The latest repairs require another complete build. Original JavaScript `app_main`, browser boot and gameplay remain unverified.

## Resume without repeating completed engineering

Reuse `tools/source_ast_to_js.py`, `source_first_project.py`, `source_first_global_link.py`, the runtimes and native tests. Run a fresh full inventory, then fix the common causes blocking original boot. Preserve storage/linkage/ABI protections. The historical manifests retained under `factory-output/source-first/` are required planning/regression fixtures; they are **not current verified modules**. Reports under `reports/historical-latest/` are explicitly historical.

The build must produce `dist/index.html` only after the genuine original game works. The strict game gate currently returns 2 while incomplete. Never count supplementary ABI helpers, unresolved imports or syntactic emission as recovered executable game behavior.

Recomputable caches, downloaded toolchains, extracted-source duplicates, old demonstrations and verbose history were omitted. All original source bytes are in `input-source/`; preparation restores them. `PACKAGE_MANIFEST.json` hashes the shipped payload.
'''
        prefix='EDuke32_SourceFactory';filename='EDuke32_Continue_Current_Work.zip'
    else:
        files['build-context/compile_commands.json']=encoded(commands)
        status.update({'existing_transpiler_or_generated_JavaScript_included':False,
            'existing_port_runtime_or_progress_included':False,
            'selected_translation_units':len(commands),
            'fresh_start':True})
        flac=read('reports/native-flac-build.json')
        files['build-context/native-flac-source.json']=encoded({k:flac[k] for k in ('version','sourceUrl','archiveSha256','reason')})
        files['build-context/development-requirements.json']=encoded({'python':'3.11+','node':'20+',
            'compiler':'Clang with C/C++ AST tooling; match libclang and builtin resource major versions',
            'native_build':'GNU Make and platform SDL/audio dependencies; Windows vendored archives are in the source ZIP',
            'browser_test':'Playwright or equivalent','runtime_constraint':'No WASM/emulator/LLVM execution in shipped game'})
        text=f'''# Fresh EDuke32 source-to-JavaScript starting bundle

This is the clean starting version: original C/C++ source archives, supplied GRPs, build selection/ABI context and minimal preparation/checksum tools. It contains **no previous transpiler, generated JavaScript, port runtime, prototype or historical progress reports**.

{goal}

## Prepare

```text
python tools/verify_package.py
python tools/prepare_sources.py
```

Original EDuke32 source is restored to `source-tree/eduke32-master/`; the secondary Duke3D source is a reference. `input-data/DUKE3D.GRP` supplies the Duke game; `SW.GRP` is additional supplied data. Full original source licenses remain in the source archives and `licenses/`.

`build-context/compile_commands.json` captures 156 Make-selected translation units, including 2 GLSL-generated units. Preparation relocates its directory paths. `source-selection.json` catalogs the selected and excluded original candidates. `target-abi.json` records the captured Linux x86_64 LP64 little-endian ABI, GNU++14, unsigned plain char, and disabled exceptions/RTTI. Do not silently use Windows LLP64 layouts for that target.

Build a source-wide semantic/dependency index, a readable source-first C/C++ compiler and real browser adapters. Recover whole boot/gameplay chains and shared root causes. Verify exact source identities, layouts, imports, original initialization and native parity. The acceptance criterion is an actual offline playable Duke game, including 60 seconds of automated gameplay with input, combat/interactions, audio and save/load; an export count or animated splash is insufficient.

Use the original GNUmakefile for a native correctness oracle. The vendored Windows FLAC 1.3.0 library uses MSVCRT; when using a UCRT toolchain, rebuild that same upstream version as documented in `build-context/native-flac-source.json`, without changing the game source.
'''
        prefix='EDuke32_Fresh_Start';filename='EDuke32_Clean_Fresh_Start.zip'
    if mode=='continuation':
        # Fail packaging if a retained Python module imports an omitted local
        # implementation. A lean ZIP must still be an executable project.
        import ast
        for name,item in list(files.items()):
            if not name.startswith('tools/') or not name.endswith('.py'):continue
            payload=item.decode() if isinstance(item,bytes) else item.read_text(encoding='utf-8-sig')
            for node in ast.walk(ast.parse(payload,filename=name)):
                modules=([node.module] if isinstance(node,ast.ImportFrom) and node.module else
                         [v.name for v in node.names] if isinstance(node,ast.Import) else [])
                for module in modules:
                    local='tools/'+module.split('.')[0]+'.py'
                    if (ROOT/local).is_file() and local not in files:
                        raise RuntimeError('Missing local dependency: '+name+' -> '+local)
    files['build-context/source-selection.json']=encoded(selection)
    files['build-context/target-abi.json']=encoded(abi)
    files['HANDOFF_STATE.json']=encoded(status)
    files['START_HERE.md']=text.encode()
    records=[]
    for name,item in sorted(files.items()):
        records.append({'path':name,'bytes':len(item) if isinstance(item,bytes) else item.stat().st_size,
                        'sha256':hashlib.sha256(item).hexdigest() if isinstance(item,bytes) else digest(item)})
    files['PACKAGE_MANIFEST.json']=encoded({'format':'eduke32-handoff-payload/1','mode':mode,'files':records})
    destination=OUT/filename;stage=destination.with_suffix('.zip.partial')
    with zipfile.ZipFile(stage,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=5,allowZip64=True) as archive:
        for name,item in sorted(files.items()):
            target=prefix+'/'+name
            if isinstance(item,bytes):archive.writestr(target,item)
            else:archive.write(item,target)
        archive.comment=('LLM '+mode+' handoff; original browser JavaScript game remains incomplete.').encode()
    with zipfile.ZipFile(stage) as archive:
        for row in records:
            with archive.open(prefix+'/'+row['path']) as stream:actual=hashlib.file_digest(stream,'sha256').hexdigest()
            if actual!=row['sha256']:raise RuntimeError('ZIP verification failed: '+row['path'])
    stage.replace(destination)
    result={'file':filename,'mode':mode,'files':len(files),'bytes':destination.stat().st_size,
            'sha256':digest(destination),'all_payload_hashes_verified':True}
    print(json.dumps(result),flush=True)
    return result

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--mode',choices=['continuation','fresh_start','both'],default='both');args=parser.parse_args()
    results=[build(mode) for mode in (['fresh_start','continuation'] if args.mode=='both' else [args.mode])]
    (OUT/'LLM_Handoff_Packages.json').write_bytes(encoded({'packages':results}))
