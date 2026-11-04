"""Upgrade exact compiler infrastructure in one hash-locked mutable owner.

Original C/C++ bodies, initialization, storage and exports are unchanged. This
is not a recompilation or a definition-recovery count. Never mutate immutable
legacy shards; retain the old owner and provenance before atomic publication.
"""
import argparse,hashlib,json,os,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_scalar_helpers import hoist_legacy

def upgrade(module,expected_sha256,history):
    module=Path(module);manifest=module.with_suffix('.manifest.json')
    if module.name.startswith('_source_legacy_'):raise ValueError('Immutable source fragments require re-addressed publication')
    old=module.read_bytes();meta=manifest.read_bytes()
    digest=hashlib.sha256(old).hexdigest()
    if digest!=expected_sha256:raise ValueError('Original owner changed')
    code,changed=hoist_legacy(old.decode('utf-8'))
    if not changed:return {'changed':False,'module_sha256':digest}
    new=code.encode('utf-8');doc=json.loads(meta)
    record={'kind':'hoisted-pure-source-helpers/2','helpers':changed,'original_module_sha256':digest,
        'updated_module_sha256':hashlib.sha256(new).hexdigest(),'original_source_bodies_changed':False,
        'source_definitions_recovered':0,'scalar_spec_sha256':hashlib.sha256((ROOT/'tools/source_scalar_helpers.py').read_bytes()).hexdigest()}
    doc.setdefault('verified_compiler_helper_upgrades',[]).append(record)
    stage=module.with_suffix('.scalar-upgrade.mjs');stage_meta=manifest.with_suffix('.scalar-upgrade.json')
    try:
        stage.write_bytes(new)
        subprocess.run(['node','--check',str(stage)],check=True,capture_output=True,text=True)
        assert module.read_bytes()==old and manifest.read_bytes()==meta,'Owner changed during helper upgrade'
        saved=Path(history)/digest;saved.mkdir(parents=True,exist_ok=True)
        (saved/'original.mjs').write_bytes(old);(saved/'original.manifest.json').write_bytes(meta)
        stage_meta.write_bytes((json.dumps(doc,indent=2)+'\n').encode())
        try:os.replace(stage,module);os.replace(stage_meta,manifest)
        except BaseException:module.write_bytes(old);manifest.write_bytes(meta);raise
    finally:stage.unlink(missing_ok=True);stage_meta.unlink(missing_ok=True)
    return {'changed':True,**record}

if __name__=='__main__':
    import recover_browser_component as component
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('source');parser.add_argument('--expected-sha256',required=True)
    args=parser.parse_args()
    assert args.source in {r['file'] for r in json.loads(component.COMMANDS.read_text())}
    with component.component_lock():
        result=upgrade(component.OUT/(args.source+'.mjs'),args.expected_sha256,component.BASE/'owner-history')
        print(json.dumps(result,indent=2));component.checkpoint()
