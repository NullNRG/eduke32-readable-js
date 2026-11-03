"""Reuse the component harness, calling original enginePreInit before helpers."""
import ast,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
path=ROOT/'tools/verify_browser_engine_component.py';tree=ast.parse(path.read_text())
scripts=[node for node in ast.walk(tree) if isinstance(node,ast.Constant) and isinstance(node.value,str)
         and node.value.startswith('async ({base,consoleOnly})=>')]
assert len(scripts)==1,'Component harness JavaScript must be unique'
node=scripts[0];code=node.value
def replace(before,after):
    global code
    assert code.count(before)==1,'Component probe changed: '+before
    code=code.replace(before,after,1)
entry="if(typeof engine.enginePreInit==='function')await enter('enginePreInit',()=>engine.enginePreInit());\n      else trace.push({name:'enginePreInit',transition:'blocked',reason:'original function has not linked'});"
replace(entry,'')
allocator="await enter('engineSetupAllocator',()=>baseLayer.engineSetupAllocator());"
replace(allocator,allocator+"\n      if(consoleOnly)throw Error('Use the canonical console probe for console diagnostics');\n      if(typeof engine.enginePreInit!=='function')throw Error('Original enginePreInit has not linked');\n      const startupResult=await enter('enginePreInit',()=>engine.enginePreInit());\n      if(startupResult!==0)throw Error('Original enginePreInit failed: '+startupResult);")
replace("await enter('initdivtables',()=>pragmas.initdivtables());",'// Verify tables initialized by the original entry; do not initialize them here.')
replace("if(typeof platform.initsystem==='function')await enter('initsystem',()=>platform.initsystem());\n      else trace.push({name:'initsystem',transition:'blocked',reason:'original function has not linked'});",'')
replace("await enter('videoGetModes',()=>platform.videoGetModes(0));",'// Read mode state produced by the original entry; do not enumerate it here.')
replace('original_engine_startup_verified:startup,trace,gameplay_verified:false',
        'original_engine_startup_verified:startup,fresh_startup_without_precalled_helpers:true,trace,gameplay_verified:false')
node.value=code
# Keep the established HTTP/runtime bindings and divider-byte verification.
# The sole behavioral change in this diagnostic is original call order.
report=Path(sys.argv[sys.argv.index('--report')+1]) if '--report' in sys.argv else ROOT/'reports/oct30-original-browser-component.json'
try:
    exec(compile(ast.fix_missing_locations(tree),str(path),'exec'),{'__file__':str(path),'__name__':'__main__'})
except SystemExit as exit_status:
    if report.is_file():
        result=json.loads(report.read_text())
        result['fresh_startup_probe']={'script':'work/verify_fresh_engine_startup.py',
            'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'reused_component_harness_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'manual_division_system_mode_initializers_called':False}
        report.write_text(json.dumps(result,indent=2)+'\n')
    raise
