"""Record a bounded, verified controller/compiler checkpoint without claiming boot."""
import datetime,hashlib,json,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from source_ast_to_js import compiler_runtime_revision

def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8'))
def write(p,d):(ROOT/p).write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8')
def main():
 ci=read('reports/nov16-static-method-ci.json')
 assert ci['complete'] and ci['all_passed'] and ci['regression_inputs_unchanged']
 assert all(hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==v for p,v in ci['regression_inputs'].items())
 controller=read('reports/nov16-original-controller-defaults.json')
 assert controller['component_passed'] and controller['default_key_setup']['controller_defaults']['original_mapping_restored']
 frame=read('reports/nov16-original-text-startup-frame.json')
 modules={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in component.OUT.rglob('*.mjs')}
 assert frame['component_passed'] and frame['artifacts']==modules
 assert controller['artifacts']==modules,'Rerun controller probe after installing new original definitions'
 shutil.copyfile(ROOT/'reports/nov16-original-text-startup-frame.json',ROOT/'reports/browser-classic-original-engine-video.json')
 with component.component_lock():component.checkpoint()
 checkpoint=read('factory-output/source-first/browser-classic/component-manifest.json')
 assert checkpoint['execution_evidence_matches_modules'] and not checkpoint['invalid_imports']
 catalogs=[]
 for source in ('config.cpp','gamedef.cpp','game.cpp'):
  entry=read('factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_'+source+'.json')
  manifest=read(entry['manifest'])
  catalogs.append({'source':manifest['source'],'compiler_runtime_input_sha256':manifest.get('compiler_runtime_input_sha256'),
   'requested':entry['requested'],'requested_resolved':entry['requested_resolved'],
   'blocked':[row for row in manifest['definitions'] if row['status']=='blocked']})
 write('reports/nov16-static-method-startup-frontier.json',{'format':'source-startup-scoped-catalog/1',
  'scope':'Three current selected startup unit emissions; not a source-wide blocker/recovery inventory',
  'compiler_runtime_input_sha256':compiler_runtime_revision(),'units':catalogs,'original_app_main_executed':False,'gameplay_verified':False})
 p=ROOT/'CURRENT_PORT_STATUS.md';s=p.read_text(encoding='utf-8').replace('reports/nov16-font-startup-ci.json','reports/nov16-static-method-ci.json')
 anchor='Earlier scoped native/component checks remain:'
 paragraph='''Additional verified controller/compiler checkpoint:

- Clang-proven trivial static aggregates retain original method prototypes and stable native storage. Range-loop method receivers alias the original subobjects; authored constructors and nontrivial destruction remain blocked. The packed-table regression matches 2,048 native/full/filtered rows in Node and Chromium, including mutation and repeated calls.
- Original CONFIG_SetGameControllerDefaults executes twice after original engine pre-initialization in Chromium, populating original mappings and restoring a changed binding. This does not verify gamepad events, full CONFIG_ReadSetup or native whole-configuration parity. The original g_myAimMode global is now linked.
- Original CON compiler recovery installed available source definitions, but C_Compile/C_ParseCommand remain blocked by original goto flow, script-storage pointer/integer handling and unresolved game-state dependencies. CONFIG_SetDefaults still requires VM_ExecuteEvent through its original event callback. Locale services also remain needed by setup read/write. No callback is stubbed out.
- The updated modules passed the real resource/font/parser/E1L1 engine probe again. See reports/nov16-original-controller-defaults.json and reports/nov16-static-method-startup-frontier.json.

'''
 assert anchor in s;s=s.replace(anchor,paragraph+anchor,1);p.write_text(s,encoding='utf-8',newline='\n')
 (ROOT/'reports/nov16-static-method-checkpoint.md').write_text(s,encoding='utf-8',newline='\n')
 p=ROOT/'CONTINUE_HERE.md';s=p.read_text(encoding='utf-8').replace('reports/nov16-font-startup-ci.json','reports/nov16-static-method-ci.json')
 s=s.replace('Original G_InitText and text parsing now execute;','Read reports/nov16-static-method-startup-frontier.json and reports/nov16-original-controller-defaults.json. Original controller defaults, G_InitText and text parsing now execute;')
 s=s.replace('python tests/source_factory/verify_sourcefirst_unordered_maps.py','python tests/source_factory/verify_sourcefirst_static_pod_constructor.py\npython work/verify_original_controller_defaults.py\npython tests/source_factory/verify_sourcefirst_unordered_maps.py',1)
 p.write_text(s,encoding='utf-8',newline='\n')
 snap=read('HANDOFF_SNAPSHOT.json');snap.update(updated_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
  compiler_runtime_input_sha256=compiler_runtime_revision(),component_snapshot_sha256=hashlib.sha256((ROOT/'factory-output/source-first/browser-classic/component-manifest.json').read_bytes()).hexdigest(),
  latest_frozen_targeted_regression='reports/nov16-static-method-ci.json',latest_frozen_targeted_passed=65,latest_frozen_targeted_total=65,
  original_controller_defaults_executed=True,original_controller_input_events_verified=False,
  original_controller_defaults_report='reports/nov16-original-controller-defaults.json',
  current_scoped_startup_frontier='reports/nov16-static-method-startup-frontier.json',
  current_component_execution_evidence_matches_modules=True,
  current_work='Original CON compiler control flow, script pointer/integer storage, VM events, locale setup and packed ClockTicks rendering closure; game not booted')
 write('HANDOFF_SNAPSHOT.json',snap)
 print('PASS: 65 current regressions, original controller setup and original resource/font/parser/frame evidence; original app_main/gameplay still false')
if __name__=='__main__':main()
