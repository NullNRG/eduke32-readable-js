"""Execute original controller defaults after original engine pre-initialization.

No input events or complete native CONFIG comparison are claimed.
"""
import ast,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'work/verify_original_default_keys.py';tree=ast.parse(path.read_text());matches=0
for node in ast.walk(tree):
 if not isinstance(node,ast.Constant) or not isinstance(node.value,str):continue
 marker='      const keySetupProof={'
 if marker not in node.value:continue
 assert node.value.count(marker)==1
 node.value=node.value.replace(marker,r'''
      const snapshotController=()=>({
        buttons:Array.from(gameGlobals.ud.config.JoystickFunctions,row=>Array.from(row)),
        axes:Array.from(gameGlobals.ud.config.JoystickAnalogueAxes),
        digital:Array.from(gameGlobals.ud.config.JoystickDigitalFunctions,row=>Array.from(row)),
        sensitivity:Array.from(gameGlobals.ud.config.JoystickAnalogueSensitivity)
      });
      await enter('original CONFIG_SetGameControllerDefaults first call',()=>cfg.CONFIG_SetGameControllerDefaults());
      const controllerBefore=snapshotController();
      if(controllerBefore.buttons.filter(row=>row[0]>=0).length<10||controllerBefore.axes.filter(v=>v>=0).length!==4)
        throw Error('Original controller defaults did not populate original configuration');
      gameGlobals.ud.config.JoystickFunctions[0][0]=-12345;
      await enter('original CONFIG_SetGameControllerDefaults second call',()=>cfg.CONFIG_SetGameControllerDefaults());
      const controllerAfter=snapshotController();
      if(JSON.stringify(controllerBefore)!==JSON.stringify(controllerAfter))throw Error('Original repeated controller configuration did not restore mappings');
      const originalControllerProof={original_CONFIG_SetGameControllerDefaults_executed:true,calls:2,
        source_static_method_tables_executed:true,original_mapping_restored:true,configuration:controllerAfter,
        native_complete_configuration_compared:false,gamepad_events_verified:false,gameplay_verified:false};
'''+marker)
 node.value=node.value.replace('original_cleanup_released_allocations:true,','original_cleanup_released_allocations:true,controller_defaults:originalControllerProof,')
 matches+=1
assert matches==1
sys.argv=['controller-defaults','--report','reports/nov16-original-controller-defaults.json']
exec(compile(ast.fix_missing_locations(tree),str(path),'exec'),{'__file__':str(path),'__name__':'__main__'})
