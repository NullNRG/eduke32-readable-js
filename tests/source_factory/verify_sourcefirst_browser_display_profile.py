"""Actual original base-layer preprocessing excludes only desktop monitor UI."""
import json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from prepare_browser_classic import adapted_bytes,browser_display_controls
from source_semantic_index import captured_args
from source_first_toolchain import frontend_config

original=ROOT/'factory-output/source-tree/eduke32-master/source/build/src/baselayer.cpp'
profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
source=ROOT/profile['prepared_source_root'];relative='source/build/src/baselayer.cpp'
before=original.read_bytes();after=adapted_bytes(before,browser_display_controls)
assert (source/relative).read_bytes()==after,'Prepared source must match attested transformation'
# Both inserted browser guards are removed to recover every original byte.
guard=b'#if !defined(EDUKE32_BROWSER)';newline=b'\r\n' if b'\r\n' in before else b'\n'
restored=after.replace(guard+newline,b'').replace(b'#endif'+newline+newline+b'static int osdcmd_cvar_set_baselayer(',b'static int osdcmd_cvar_set_baselayer(',1)
registration=b'    OSD_RegisterCvar(&displayindex, osdcmd_displayindex);'
restored=restored.replace(registration+newline+b'#endif',registration,1)
assert restored==before,'Desktop branch must preserve all original bytes'
commands=json.loads((ROOT/profile['derived_commands']).read_text())
command=next(row for row in commands if row['file']==relative)
frontend,_=frontend_config(True);arguments=captured_args(command)
for browser in (True,False):
    run=subprocess.run([frontend,*arguments,*([] if browser else ['-UEDUKE32_BROWSER']),'-E','-P',relative],
        cwd=source,capture_output=True,text=True,timeout=90)
    assert run.returncode==0,run.stderr[-2500:]
    code=run.stdout
    assert ('static int osdcmd_displayindex(' in code) is (not browser)
    assert ('OSD_RegisterCvar(&displayindex, osdcmd_displayindex)' in code) is (not browser)
    assert 'static int osdcmd_cvar_set_baselayer(' in code
    assert 'videoSetPalette(0,0,0)' in code or 'videoSetPalette(' in code
    assert 'OSD_RegisterCvar(&i,' in code
    assert 'int32_t baselayer_init(void)' in code
print('PASS actual original base-layer browser/desktop preprocessing: desktop monitor control excluded, native branch byte-identical, original cvars/palette/startup retained')
