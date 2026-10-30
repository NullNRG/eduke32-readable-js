"""Accept audited service-only WASM; never relax readable game/engine criteria."""
import hashlib,json
from pathlib import Path
def artifact(root,row):
    if not isinstance(row,dict) or not isinstance(row.get('path'),str) or not row.get('sha256'):return None
    root=Path(root).resolve();path=(root/row['path']).resolve()
    if not path.is_relative_to(root) or not path.is_file():return None
    return path if hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256'] else None
def verify(root,wasm,manifest):
    root=Path(root).resolve();profile=root/'tools/browser_classic_profile.json'
    if not profile.is_file():return False
    policy=json.loads(profile.read_text()).get('execution_policy',{})
    if (policy.get('format')!='readable-engine-native-services/1'
        or policy.get('engine_language')!='readable-javascript'
        or policy.get('original_game_or_build_engine_in_wasm') is not False):return False
    path=artifact(root,manifest);binary=artifact(root,wasm)
    if not path or not binary or binary.read_bytes()[:8]!=b'\0asm\x01\0\0\0':return False
    record=json.loads(path.read_text())
    if (record.get('format')!='sourcefactory-native-browser-services/1' or record.get('backend')!='sdl2-wasm32'
        or record.get('native_pointer_bits')!=32 or record.get('engine_pointer_bits')!=64
        or record.get('shared_engine_memory') is not False or record.get('original_engine_translation_units')!=[]):return False
    if not record.get('roles') or not set(record['roles'])<=set(policy.get('native_allowed_roles',[])):return False
    allowed=set(policy.get('native_allowed_project_sources',[]));sources=record.get('project_sources',[])
    if not sources:return False
    for row in sources:
        name=row.get('path','').replace('\\','/')
        if name not in allowed or any('/'+segment+'/' in '/'+name.lower() for segment in ('source/duke3d','source/build','source/kenbuild')):
            return False
        if not artifact(root,row):return False
    artifacts=record.get('artifacts',{})
    return artifact(root,artifacts.get('wasm'))==binary and artifact(root,artifacts.get('glue')) is not None
def offline_runtime_verified(root,offline):
    if offline.get('emulation_runtime_detected') is True or offline.get('native_engine_code_detected') is True:return False
    if offline.get('wasm_or_emulation_runtime_detected') is False:return not offline.get('wasm_modules')
    if offline.get('emulation_runtime_detected') is not False or offline.get('native_engine_code_detected') is not False:return False
    modules=offline.get('wasm_modules')
    return bool(isinstance(modules,list) and modules and all(
        verify(root,row.get('artifact'),row.get('service_manifest')) for row in modules if isinstance(row,dict))
        and all(isinstance(row,dict) for row in modules))
