"""Allow audited service WASM without allowing native game/renderer code."""
import copy,hashlib,json,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from browser_service_contract import offline_runtime_verified
def save(path,value):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value))
def ref(root,path):return {'path':path.relative_to(root).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
with tempfile.TemporaryDirectory() as temporary:
    root=Path(temporary);source=root/'runtime/native_services/sdl_services.c';source.parent.mkdir(parents=True)
    source.write_text('/* Service policy schema fixture, not execution evidence. */')
    wasm=root/'services.wasm';wasm.write_bytes(b'\0asm\x01\0\0\0')
    glue=root/'services.mjs';glue.write_text('export const fixture=true;')
    policy={'format':'readable-engine-native-services/1','engine_language':'readable-javascript',
            'original_game_or_build_engine_in_wasm':False,'native_allowed_roles':['sdl2','timing'],
            'native_allowed_project_sources':['runtime/native_services/sdl_services.c']}
    profile=root/'tools/browser_classic_profile.json';save(profile,{'execution_policy':policy})
    manifest=root/'services.json'
    record={'format':'sourcefactory-native-browser-services/1','backend':'sdl2-wasm32',
        'native_pointer_bits':32,'engine_pointer_bits':64,'shared_engine_memory':False,
        'original_engine_translation_units':[],'roles':['sdl2','timing'],'project_sources':[ref(root,source)],
        'artifacts':{'wasm':ref(root,wasm),'glue':ref(root,glue)}}
    def check(value=record,**overrides):
        save(manifest,value)
        report={'wasm_or_emulation_runtime_detected':True,'emulation_runtime_detected':False,
            'native_engine_code_detected':False,'wasm_modules':[{'artifact':ref(root,wasm),'service_manifest':ref(root,manifest)}],**overrides}
        return offline_runtime_verified(root,report)
    assert check()
    for key,value in (('original_engine_translation_units',['source/build/src/engine.cpp']),
                      ('roles',['game-logic']),('native_pointer_bits',64),('shared_engine_memory',True)):
        changed=copy.deepcopy(record);changed[key]=value;assert not check(changed),key
    assert not check(native_engine_code_detected=True)
    assert not check(emulation_runtime_detected=True)
    assert not check(wasm_modules=[])
    assert not check(wasm_or_emulation_runtime_detected=False)
    assert offline_runtime_verified(root,{'wasm_or_emulation_runtime_detected':False})
    assert not offline_runtime_verified(root,{'wasm_or_emulation_runtime_detected':False,'emulation_runtime_detected':True})
    engine=root/'source/build/src/engine.cpp';engine.parent.mkdir(parents=True);engine.write_text('original renderer fixture')
    widened={**policy,'native_allowed_project_sources':policy['native_allowed_project_sources']+['source/build/src/engine.cpp']}
    save(profile,{'execution_policy':widened});changed=copy.deepcopy(record);changed['project_sources']=[ref(root,engine)]
    assert not check(changed),'Original renderer cannot become a native service by relabeling it'
    save(profile,{'execution_policy':policy});save(manifest,record)
    stale={'wasm_or_emulation_runtime_detected':True,'emulation_runtime_detected':False,'native_engine_code_detected':False,
        'wasm_modules':[{'artifact':ref(root,wasm),'service_manifest':ref(root,manifest)}]}
    wasm.write_bytes(wasm.read_bytes()+b'changed');assert not offline_runtime_verified(root,stale)
print('PASS audited service-only WASM policy: game/renderer/emulator roles, wrong ABI, stale binaries, unknown modules and contradictory reports rejected')
