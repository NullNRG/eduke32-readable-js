"""Reuse the component harness, calling original enginePreInit before helpers."""
import ast,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
path=ROOT/'tools/verify_browser_engine_component.py';tree=ast.parse(path.read_text())
from browser_engine_probe import fresh_engine_probe
scripts=[node for node in ast.walk(tree) if isinstance(node,ast.Constant) and isinstance(node.value,str)
         and node.value.startswith('async ({base,consoleOnly})=>')]
assert len(scripts)==1,'Component harness JavaScript must be unique'
node=scripts[0];node.value=fresh_engine_probe(ROOT)
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
            'shared_probe_sha256':hashlib.sha256((ROOT/'tools/browser_engine_probe.py').read_bytes()).hexdigest(),
            'manual_division_system_mode_initializers_called':False}
        report.write_text(json.dumps(result,indent=2)+'\n')
    raise
