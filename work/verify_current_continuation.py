"""Extract and execute the actual saved runtime component without installed SDKs."""
import argparse,hashlib,json,os,subprocess,sys,tempfile,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('archive',type=Path)
args=parser.parse_args();archive=args.archive.resolve()
report={'archive':str(archive),'gameplay_verified':False,'original_engine_startup_verified':False}
with zipfile.ZipFile(archive) as saved, tempfile.TemporaryDirectory(prefix='eduke-continuation-check-') as temporary:
    root=Path(temporary).resolve()/'EDuke32_SourceFactory'
    manifest=json.loads(saved.read('EDuke32_SourceFactory/CONTINUATION_MANIFEST.json'))
    rows={row['path']:row for row in manifest['files']}
    required=('input-data/DUKE3D.GRP','input-source/eduke32-master.zip',
        'reports/history/original-source-manifests-20261014.zip',
        'reports/semantic-browser-checkpoint/index.jsonl.gz',
        'factory-output/browser-classic/compile_commands.header-definitions.json',
        'factory-output/browser-classic/compile_commands.header-definitions.witness.json',
        'reports/oct25-original-libdivide-parity.json','reports/oct27-original-xxhash-parity.json',
        'reports/oct31-original-xxh32-parity.json','HANDOFF_SNAPSHOT.json')
    assert all(name in rows for name in required),[name for name in required if name not in rows]
    profile=json.loads(saved.read('EDuke32_SourceFactory/tools/browser_classic_profile.json'))
    module_root=profile['boot_module_root']
    state=json.loads(saved.read('EDuke32_SourceFactory/HANDOFF_SNAPSHOT.json'))
    artifact_roots={module_root,*state.get('continuation_artifact_roots',[])}
    extracted=[]
    for name,row in rows.items():
        relative=PurePosixPath(name)
        assert not relative.is_absolute() and '..' not in relative.parts,name
        assert not any(part in ('toolchains','node_modules','__pycache__') for part in relative.parts),name
        if (relative.parts[0] in ('tools','runtime','tests') or any(name.startswith(prefix+'/') for prefix in artifact_roots)
            or name in ('input-data/DUKE3D.GRP','work/probe_original_vfs.mjs','work/run_original_vfs.mjs')
            or name in ('package.json','HANDOFF_SNAPSHOT.json','CONTINUE_HERE.md',
                        'factory-output/source-first/browser-classic/component-manifest.json')):
            data=saved.read('EDuke32_SourceFactory/'+name)
            assert hashlib.sha256(data).hexdigest()==row['sha256'],name
            target=root/Path(name)
            assert target.resolve().is_relative_to(root),name
            target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);extracted.append(name)
    def run(arguments):
        result=subprocess.run(arguments,cwd=root,capture_output=True,text=True,timeout=150,
            env={**os.environ,'PYTHONUTF8':'1'})
        return result
    node=run(['node','--test',*[str(root/'tests/source_factory'/name) for name in (
        'source_heap_addresses.test.mjs','source_ctype_functions.test.mjs','source_sdl_spinlock.test.mjs',
        'browser_loguru_provider.test.mjs','stage12_sdl_display.test.mjs')]])
    assert node.returncode==0,node.stdout[-2000:]+node.stderr[-2000:]
    resources=run(['node','work/run_original_vfs.mjs'])
    assert resources.returncode==0,resources.stderr[-2500:]
    vfs=json.loads(resources.stdout)
    assert vfs['passed'] and vfs['original_grp_index_executed'] and vfs['directory_entries']==456,vfs
    output=root/'reports/extracted-browser-component.json'
    browser=run([sys.executable,str(root/'tools/verify_browser_engine_component.py'),'--report',str(output)])
    assert output.is_file(),browser.stdout[-2000:]+browser.stderr[-2000:]
    proof=json.loads(output.read_text())
    assert proof['component_passed'] and not proof['page_errors'],proof
    assert browser.returncode==(0 if proof['original_engine_startup_verified'] else 1),browser.returncode
    # Preserve the saved checkpoint's actual acceptance state; a component
    # pass cannot upgrade it, and a future verified startup must not be refused.
    expected_startup=bool(state.get('original_engine_preinit_executed',False))
    assert proof['original_engine_startup_verified'] is expected_startup
    report.update(extracted_files=len(extracted),required_inputs_present=True,
        extracted_payload_hashes_verified=True,node_service_tests_passed=True,
        extracted_original_grp_io_passed=True,
        extracted_original_grp_directory_entries=vfs['directory_entries'],
        extracted_original_grp_directory_bytes_verified=vfs['original_directory_bytes_verified'],
        extracted_original_resource_sample_bytes_verified=vfs['native_parity_sample_bytes'],
        extracted_browser_component_passed=True,browser_version=proof['browser_version'],
        trace=proof['trace'],original_engine_startup_verified=expected_startup,
        startup_verifier_expected_failure_preserved=not expected_startup,
        archive_sha256=hashlib.file_digest(archive.open('rb'),'sha256').hexdigest())
(ROOT/'reports/nov01-continuation-extraction-proof.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
