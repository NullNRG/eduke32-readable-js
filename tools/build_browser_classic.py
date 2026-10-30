"""Canonical classic-browser compile/link pipeline; strict game gate stays closed."""
import argparse,hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(path):return json.loads(path.read_text())
def write(path,data):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,indent=2)+'\n')
def run(*args):return subprocess.run([sys.executable,*map(str,args)],cwd=ROOT).returncode
def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--max-units',type=int,default=0,help='Diagnostic partial run; zero selects every browser unit')
    p.add_argument('--stop-after',choices=('prepare','semantic'),
        help='Diagnostic checkpoint only; does not build or verify a playable game')
    p.add_argument('--timeout',type=int,default=240);a=p.parse_args()
    if a.max_units<0:p.error('--max-units must be nonnegative')
    code=run('tools/prepare_browser_classic.py')
    if code:return code
    profile=read(ROOT/'tools/browser_classic_profile.json')
    prepared=read(ROOT/'reports/browser-classic-preparation.json')
    build=ROOT/profile['build_root'];commands=ROOT/prepared['command_database'];source=Path(prepared['source_root'])
    write(build/'build-profile.json',{'format':'sourcefactory-browser-build/1','profile':profile['name'],
        'command_database':prepared['command_database'],'commands_sha256':prepared['commands_sha256'],
        'selected_units':prepared['selected_units'],'source_adaptations':prepared['source_adaptations'],
        'allocator_backend':prepared['allocator_backend'],'diagnostic_stop_after':a.stop_after,
        'execution_policy':profile.get('execution_policy'),
        'source_root':source.relative_to(ROOT).as_posix(),'gameplay_verified':False})
    from source_first_file_audit import report as inventory_report
    audit=inventory_report(commands_path=commands)
    write(build/'all-files-audit.json',audit)
    write(build/'reports/source-files-current.json',audit)
    if audit['extraction_and_selection_errors']:
        raise SystemExit('Original archive coverage audit failed; see all-files-audit.json')
    if a.stop_after=='prepare':
        print('DIAGNOSTIC: browser source preparation only; no engine/gameplay verification.')
        return 0
    semantic_code=run('tools/source_semantic_index.py','--root',source,'--commands',commands,
        '--resume','--max-units',a.max_units,'--out',build/'reports/semantic-index.sqlite')
    write(build/'semantic-extraction-result.json',{'returncode':semantic_code,
        'partial_diagnostic_requested':bool(a.max_units or a.stop_after),'gameplay_verified':False})
    # A configured multi-unit program may override standard new/delete in any
    # unit. Enable the language heap only with a fresh whole-program proof.
    from source_standard_heap_contract import contract_path, create as create_heap_contract
    contract_path(commands).unlink(missing_ok=True)
    if not semantic_code and not a.max_units:
        create_heap_contract(source,commands,build/'reports/semantic-index.sqlite')
    if a.stop_after=='semantic':
        print('DIAGNOSTIC: source ownership checkpoint only; no engine/gameplay verification.')
        return semantic_code
    if profile.get('execution_policy',{}).get('native_service_backend')=='sdl2-wasm32':
        service_code=run('tools/build_browser_services.py')
        write(build/'native-service-build-result.json',{'returncode':service_code,
            'manifest':'factory-output/browser-services/build-manifest.json','original_gameplay_verified':False})
        if service_code:return service_code
    priorities=['source/duke3d/src/game.cpp','source/build/src/engine.cpp','source/build/src/baselayer.cpp',
        'source/build/src/sdlayer.cpp','source/build/src/osd.cpp','source/build/src/compat.cpp',
        'source/build/src/smmalloc_generic.cpp','source/build/src/smmalloc.cpp','source/build/src/palette.cpp']
    write(build/'priorities.json',{'priority_units':[{'source':n,'score':1000-i} for i,n in enumerate(priorities)]})
    compile_code=run('tools/source_first_automate.py','--source-root',source,'--compile-commands',commands,
        '--out',build/'automatic','--jobs',1,'--batch-size',1,'--timeout',a.timeout,'--resume',
        '--persistent-ast-cache','--ast-cache-shards',1,'--priority-file',build/'priorities.json','--max-units',a.max_units,'--no-global-link')
    if not (build/'automatic/recovery-report.json').is_file():return compile_code or 2
    link_code=run('tools/source_first_global_link.py','--directory',build/'automatic','--out',build/'globally-linked',
        '--source-root',source,'--compile-commands',commands,'--jobs',1,'--timeout',a.timeout,
        '--resume','--persistent-ast-cache','--rounds',24,'--retry-budget',12)
    linked=build/'globally-linked/global-recovery.json'
    if not linked.is_file():return link_code or 2
    write(build/'source-build-attestation.json',{'linked_manifest_sha256':hashlib.sha256(linked.read_bytes()).hexdigest(),
        'source_compile_report_present':True,'original_units_compiled':read(linked)['completed_source_units']})
    run('tools/source_first_reports.py','--manifests',linked.parent,
        '--compile-report',build/'automatic/recovery-report.json','--compile-commands',commands,
        '--semantic-index',build/'reports/semantic-index.sqlite','--out',build/'reports')
    run('tools/source_first_boot_audit.py','--entry','app_main','--probe','enginePreInit','--source-root',source,
        '--compile-commands',commands,'--manifest-root',linked.parent,'--fast-current-only','--out',build/'boot-audit.json')
    # Incomplete source/runtime closure must never publish a placeholder HTML.
    # Candidate packaging and gameplay evidence remain separately required by
    # this gate; success cannot follow merely from the compiler's export count.
    gate=run('tools/source_first_game_gate.py','--build-root',build,'--reports-root',build/'reports')
    return gate or compile_code or link_code
if __name__=='__main__':sys.exit(main())
