"""Execute original default-key setup after original browser engine pre-init.

Native reference covers original key-name lookup over the original default
tables. It is not a native comparison of the complete CONFIG/OSD subsystem.
"""
import ast,hashlib,json,sys,tempfile
from pathlib import Path
from verify_original_vfs import ROOT,SOURCE,run
sys.path.insert(0,str(ROOT/'tools'))
from browser_engine_probe import fresh_engine_probe

control_startup='--control-startup' in sys.argv
if control_startup:sys.argv.remove('--control-startup')
input_init='--input-init' in sys.argv or control_startup
if '--input-init' in sys.argv:sys.argv.remove('--input-init')

with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='native-default-keys-') as folder:
    folder=Path(folder);driver=folder/'keys.cpp';exe=folder/'keys.exe'
    driver.write_text('''#include <cstdio>
#include "duke3d.h"
#include "keyboard.h"
#define __SETUP__
#include "_functio.h"
int main(){for(int i=0;i<NUMGAMEFUNCTIONS;i++)
printf("%u %u\\n",(unsigned)KB_StringToScanCode(keydefaults[i*2]),(unsigned)KB_StringToScanCode(keydefaults[i*2+1]));}
''')
    flags=['-std=gnu++14','-funsigned-char','-O2','-DNOASM','-DNDEBUG','-DNETCODE_DISABLE','-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DEDUKE32_BROWSER=1']
    flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/duke3d/src','source/mact/include',
        'source/audiolib/include','source/enet/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
    run(['clang++',*flags,driver,SOURCE/'source/mact/src/keyboard.cpp','-o',exe])
    expected=[list(map(int,line.split())) for line in run([exe]).splitlines()]

path=ROOT/'tools/verify_browser_engine_component.py';tree=ast.parse(path.read_text())
scripts=[n for n in ast.walk(tree) if isinstance(n,ast.Constant) and isinstance(n.value,str)
         and n.value.startswith('async ({base,consoleOnly})=>')]
assert len(scripts)==1
script=fresh_engine_probe(ROOT)
anchor="if(startupResult!==0)throw Error('Original enginePreInit failed: '+startupResult);"
assert script.count(anchor)==1
setup=r'''
      const expectedKeys=EXPECTED;
      const cfg=await enter('import original configuration',()=>import(base+'/source/duke3d/src/config.cpp.mjs'));
      const gameGlobals=await import(base+'/source/duke3d/src/global.cpp.mjs');
      const control=await import(base+'/source/mact/src/control.cpp.mjs');
      const allocationsBefore=runtime.heap.allocations.size;
      await enter('CONFIG_SetDefaultKeys',()=>cfg.CONFIG_SetDefaultKeys(cfg.keydefaults,false));
      const actualKeys=Array.from(gameGlobals.ud.config.KeyboardKeys,row=>Array.from(row));
      if(JSON.stringify(actualKeys)!==JSON.stringify(expectedKeys))throw Error('Original key setup differs from native original lookup: '+JSON.stringify({actualKeys,expectedKeys}));
      let bindings=0;
      const {sourceCString}=await import('/runtime/source_bytes.mjs');
      for(const entry of control.CONTROL_KeyBinds){
        if(!entry.cmdstr)continue;
        if(entry.repeat!==1||!sourceCString(entry.cmdstr,runtime.heap).startsWith('gamefunc_')||!sourceCString(entry.key,runtime.heap))throw Error('Original key binding has invalid data');
        bindings++;
      }
      if(bindings<1)throw Error('Original default setup created no bindings');
      await enter('CONTROL_ClearAllBinds',()=>control.CONTROL_ClearAllBinds());
      if(Array.from(control.CONTROL_KeyBinds).some(entry=>entry.cmdstr)||runtime.heap.allocations.size!==allocationsBefore)throw Error('Original key binding cleanup leaked storage');
      const keySetupProof={native_lookup_pairs:expectedKeys.length,original_bindings_created:bindings,original_cleanup_released_allocations:true,native_complete_configuration_comparison:false};
'''.replace('EXPECTED',json.dumps(expected))
if input_init:
    setup=r'''
      const originalInput=await enter('import original input',()=>import(base+'/source/build/src/sdlayer.cpp.mjs'));
      await enter('original SDL key table',()=>originalInput.buildkeytranslationtable());
      const inputResult=await enter('initinput',()=>originalInput.initinput(null));
      const inputBase=await import(base+'/source/build/src/baselayer.cpp.mjs');
      if(inputResult!==0||inputBase.inputdevices!==3)throw Error('Original input initialization failed');
      const {sourceCString:readKeyName}=await import('/runtime/source_bytes.mjs');
      const expectedNames={205:'Right',203:'Left',208:'Down',200:'Up'};
      for(const [code,name] of Object.entries(expectedNames))if(readKeyName(inputBase.g_keyNameTable[code],runtime.heap)!==name)throw Error('Original key-name table differs: '+code);
      const originalInputProof={original_initinput_executed:true,original_key_table_builder_executed:true,inputdevices:inputBase.inputdevices,
        original_arrow_key_names_verified:4,original_event_loop_executed:false,all_key_names_verified:false};
''' +setup
if control_startup:
    setup=setup.replace("const inputResult=await enter('initinput',()=>originalInput.initinput(null));",
        "const originalControl=await import(base+'/source/mact/src/control.cpp.mjs');const inputResult=await enter('CONTROL_Startup',()=>originalControl.CONTROL_Startup(1,null,120));if(!originalControl.CONTROL_Started)throw Error('Original controls did not start');")
    setup=setup.replace('inputResult!==0||','inputResult!==false||')
    setup=setup.replace('original_initinput_executed:true,','original_initinput_executed:true,original_CONTROL_Startup_executed:true,time_callback: \"Original controlGetTime fallback; not game-clock verification\",original_game_clock_verified:false,')
scripts[0].value=script.replace(anchor,anchor+setup).replace('fresh_startup_without_precalled_helpers:true',
    'fresh_startup_without_precalled_helpers:true,original_default_key_setup_executed:true,default_key_setup:keySetupProof')
if input_init:scripts[0].value=scripts[0].value.replace('default_key_setup:keySetupProof','default_key_setup:keySetupProof,original_input_initialization:originalInputProof')
if '--report' not in sys.argv:sys.argv+=['--report','reports/nov04-original-control-startup.json' if control_startup else 'reports/nov04-original-input-init.json' if input_init else 'reports/nov04-original-default-keys.json']
report=Path(sys.argv[sys.argv.index('--report')+1])
try:
    exec(compile(ast.fix_missing_locations(tree),str(path),'exec'),{'__file__':str(path),'__name__':'__main__'})
except SystemExit:
    if report.is_file():
        data=json.loads(report.read_text());data['native_key_reference']={
            'original_unit':'source/mact/src/keyboard.cpp','original_defaults':'source/duke3d/src/_functio.h',
            'default_pairs':len(expected),'lookup_pairs_sha256':hashlib.sha256(json.dumps(expected).encode()).hexdigest(),
            'native_complete_CONFIG_SetDefaultKeys_compared':False,'game_state_prepopulated':False,
            'probe_script':Path(__file__).relative_to(ROOT).as_posix(),'probe_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
        report.write_bytes((json.dumps(data,indent=2)+'\n').encode())
    raise
