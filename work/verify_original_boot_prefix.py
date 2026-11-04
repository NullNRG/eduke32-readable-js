"""Execute original path initialization before fresh original engine startup.

This tests linked boot-prefix functions with real argv and browser services.
It does not execute app_main or bypass its remaining initialization sequence.
"""
import ast,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from browser_engine_probe import fresh_engine_probe
path=ROOT/'tools/verify_browser_engine_component.py';tree=ast.parse(path.read_text())
scripts=[n for n in ast.walk(tree) if isinstance(n,ast.Constant) and isinstance(n.value,str)
         and n.value.startswith('async ({base,consoleOnly})=>')]
assert len(scripts)==1
script=fresh_engine_probe(ROOT)
allocator="await enter('engineSetupAllocator',()=>baseLayer.engineSetupAllocator());"
assert script.count(allocator)==1
prefix=r'''
      const common=await enter('import original game path initialization',()=>import(base+'/source/duke3d/src/common.cpp.mjs'));
      const addresses=globalThis[Symbol.for('source-lp64-addresses/2')];
      const argv=new Uint8Array(24),argvBytes=new DataView(argv.buffer);
      for(const [i,arg] of ['eduke32','-usecwd'].entries()){
        const bytes=Uint8Array.from([...new TextEncoder().encode(arg),0]);
        argvBytes.setBigUint64(i*8,addresses.encode(bytes),true);
      }
      await enter('G_ExtPreInit',()=>common.G_ExtPreInit(2,argv));
      if(common.g_useCwd!==1)throw Error('Original command-line path initialization did not execute');
      await enter('G_ExtInit',()=>common.G_ExtInit());
'''
scripts[0].value=script.replace(allocator,allocator+prefix).replace(
    'fresh_startup_without_precalled_helpers:true',
    'fresh_startup_without_precalled_helpers:true,original_browser_boot_prefix_executed:true,app_main_executed:false')
if '--report' not in sys.argv:sys.argv+=['--report','reports/nov03-original-browser-boot-prefix.json']
report=Path(sys.argv[sys.argv.index('--report')+1])
try:
    exec(compile(ast.fix_missing_locations(tree),str(path),'exec'),{'__file__':str(path),'__name__':'__main__'})
except SystemExit:
    if report.is_file():
        data=json.loads(report.read_text());data['boot_prefix_probe']={
            'script':Path(__file__).relative_to(ROOT).as_posix(),
            'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'argv':['eduke32','-usecwd'],'game_state_prepopulated':False,
            'full_app_main_executed':False}
        report.write_bytes((json.dumps(data,indent=2)+'\n').encode())
    raise
