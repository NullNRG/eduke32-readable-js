"""Exercise original crosshair palette/tile services in the real engine frame."""
import ast,base64,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'work/verify_original_masked_frame.py';tree=ast.parse(path.read_text())
arguments=sys.argv[:]
try:
 sys.argv=['original-crosshair-frame']
 for _ in range(4):
  stop=next(i for i,node in enumerate(tree.body) if isinstance(node,ast.Try))
  scope={'__file__':str(path),'__name__':'crosshair_frame_extraction'}
  exec(compile(ast.fix_missing_locations(ast.Module(body=tree.body[:stop],type_ignores=[])),str(path),'exec'),scope)
  tree=scope['tree'];path=scope.get('source') or scope.get('probe') or scope.get('path')
finally:sys.argv=arguments
matches=0
for node in ast.walk(tree):
 if not isinstance(node,ast.Constant) or not isinstance(node.value,str):continue
 if node.value.startswith('async ({base,consoleOnly})=>'):
  marker="      const canvas=document.querySelector('canvas'),rgba="
  assert node.value.count(marker)==1
  node.value=node.value.replace(marker,r'''
      const screen=await enter('import original screen services',()=>import(base+'/source/duke3d/src/screens.cpp.mjs'));
      await enter('original G_GetCrosshairColor',()=>screen.G_GetCrosshairColor());
      if(screen.DefaultCrosshairColors.f!==1)throw Error('Original crosshair color detection did not complete');
      const detected=['r','g','b'].map(k=>screen.CrosshairColors[k]);
      const requested=[64,128,192];
      await enter('original G_SetCrosshairColor',()=>screen.G_SetCrosshairColor(...requested));
      const actual=['r','g','b'].map(k=>screen.CrosshairColors[k]);
      if(actual.some((value,index)=>value!==requested[index])||screen.g_crosshairSum!==64+(128<<8)+(192<<16))
        throw Error('Original crosshair color assignment differs from requested state');
      engineInitialization.original_crosshair_services={executed:true,detected,requested,actual,
        cached_sum:screen.g_crosshairSum,original_hud_drawn:false,gameplay_verified:false};
''' +marker)
  matches+=1
 elif node.value=='reports/nov12-original-masked-frame.json':node.value='reports/nov13-original-crosshair-frame.json'
 elif node.value=='reports/evidence/nov12-original-js-engine-masks.png':node.value='reports/evidence/nov13-original-crosshair-services.png'
assert matches==1
def finalize(report):
 doc=json.loads(report.read_text());initialization=doc.get('engine_initialization') or {}
 assert doc.get('component_passed') and initialization.get('original_crosshair_services',{}).get('executed')
 encoded=initialization.pop('rooms_only_capture_png',None)
 if encoded:
  pixels=base64.b64decode(encoded.split(',',1)[1]);screenshot=ROOT/'reports/evidence/nov13-original-crosshair-services.png';screenshot.write_bytes(pixels)
  doc['original_rooms_capture']={'path':str(screenshot),'sha256':hashlib.sha256(pixels).hexdigest(),
   'caption':'Original raw MAP engine frame and crosshair palette services; no HUD, app_main, CON or gameplay verification'}
 doc['crosshair_component_scope']={'original_app_main_executed':False,'original_CON_executed':False,'original_hud_drawn':False,'gameplay_verified':False}
 report.write_text(json.dumps(doc,indent=2)+'\n')
report=ROOT/'reports/nov13-original-crosshair-frame.json'
if __name__=='__main__':
 if '--recover-capture' in sys.argv:
  raw=ROOT/'reports/oct30-original-browser-component.json';doc=json.loads(raw.read_text())
  assert doc.get('engine_initialization',{}).get('original_crosshair_services',{}).get('executed')
  doc['recovered_probe_report']={'path':str(raw),'sha256':hashlib.sha256(raw.read_bytes()).hexdigest()}
  report.write_text(json.dumps(doc,indent=2)+'\n');finalize(report)
 else:
  sys.argv=['verify-original-crosshair-frame','--report',str(report)]
  try:exec(compile(ast.fix_missing_locations(tree),str(path),'exec'),{'__file__':str(path),'__name__':'__main__'})
  finally:
   if report.is_file():finalize(report)
