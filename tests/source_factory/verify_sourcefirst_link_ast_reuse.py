#!/usr/bin/env python3
"""Real Clang source retries reuse bounded ASTs without reusing generated JS."""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,os.environ.get('EDUKE_TEST_COMPILER_DIR') or str(ROOT/'tools'))
import source_first_global_link as link
from source_first_automate import batch_artifact_hashes

with tempfile.TemporaryDirectory(prefix='link_ast_reuse_') as temporary:
    root=Path(temporary);source=root/'original';source.mkdir();directory=root/'saved';directory.mkdir()
    (source/'provider.cpp').write_text('int original_provider(int value){return value+7;}')
    (source/'caller.cpp').write_text('extern int original_provider(int); int original_caller(int value){return original_provider(value)*3;}')
    commands=root/'browser-commands.json'
    commands.write_text(json.dumps([{'file':n,'arguments':['clang++','-std=c++14','-DBROWSER_PROFILE=1',n]} for n in ('provider.cpp','caller.cpp')]))
    original_caller=(source/'caller.cpp').read_text()
    (source/'caller.cpp').write_text('#ifndef BROWSER_PROFILE\n#error Browser profile lost during recovery\n#endif\n'+original_caller)
    rows=[]
    for number,name in enumerate(('provider.cpp','caller.cpp')):
        batch=directory/str(number)
        run=subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(source),
            '--source',name,'--out-dir',str(batch),'--compile-commands',str(commands)],cwd=ROOT,capture_output=True,text=True,timeout=90)
        assert run.returncode==0,(run.stdout,run.stderr)
        manifest=json.loads((batch/(name+'.manifest.json')).read_text())
        build=batch/'project-build.json'
        build.write_text(json.dumps({'format':'source-first-project/1','units':[{'source':name,'emitted':manifest['emitted']}]}))
        rows.append({'sources':[name],'status':'ok','manifest':f'{number}/project-build.json',
                     'artifact_hashes':batch_artifact_hashes(batch,build)})
    (directory/'recovery-report.json').write_text(json.dumps({'original_selected_units':2,
        'compiler_revision_source_counts':{'published-fixture-revision':2},
        'uniform_compiler_revision_verified':True,'batch_results':rows}))
    out=root/'linked'
    first=link.relink(directory,out,source,round_limit=2,jobs=1,persistent_ast_cache=True,compile_commands=commands)
    assert not first['invalid_imports_or_syntax'] and first['recovered_definitions']>=1,first
    assert first['published_input_revision_counts']=={'published-fixture-revision':2}
    assert first['linker_input_attestation_verified'] and not first['all_units_recompiled_under_linker_revision']
    caches={path:path.stat().st_mtime_ns for path in (directory/'clang-ast-cache').rglob('*.json')
            if len(path.stem)==64}
    assert caches,'real Clang AST was not cached'
    generated=(out/'caller.cpp.mjs').read_bytes()
    second=link.relink(directory,out,source,round_limit=2,jobs=1,persistent_ast_cache=True,compile_commands=commands)
    assert second['recovered_definitions']>=1 and not second['previously_resumed_units']
    assert all(path.stat().st_mtime_ns==mtime for path,mtime in caches.items()),'raw AST was recompiled'
    assert (out/'caller.cpp.mjs').read_bytes()==generated,'cache changed readable source emission'
    runner=root/'runner.mjs';runner.write_text('import {original_caller} from '+json.dumps((out/'caller.cpp.mjs').as_uri())+';console.log(original_caller(5));')
    assert subprocess.check_output(['node',str(runner)],text=True).strip()=='36'
    # A new non-header original input invalidates the entire semantic epoch.
    (source/'included.def').write_text('captured original input')
    third=link.relink(directory,out,source,round_limit=2,jobs=1,persistent_ast_cache=True,compile_commands=commands)
    assert third['linker_input_fingerprint']!=first['linker_input_fingerprint']
    assert len(list((directory/'clang-ast-cache').iterdir()))==2
print('PASS real source linker: persistent raw-AST hit, fresh JS emission, readable output equality, original input invalidation and historical revision provenance')
