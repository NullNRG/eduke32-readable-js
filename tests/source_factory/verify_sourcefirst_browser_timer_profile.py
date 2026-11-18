"""Use the original SDL timer path under the selected browser configuration."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from prepare_browser_classic import adapted_bytes, browser_timer
from source_semantic_index import captured_args
from source_first_toolchain import frontend_config

relative = 'source/build/src/timer.cpp'
profile = json.loads((ROOT / 'tools/browser_classic_profile.json').read_text())
source = ROOT / profile['prepared_source_root']
original = (ROOT / 'factory-output/source-tree/eduke32-master' / relative).read_bytes()
adapted = adapted_bytes(original, browser_timer)
assert (source / relative).read_bytes() == adapted
guard = b'\n#ifdef EDUKE32_BROWSER\n# undef HAVE_TIMER_RDTSC\n#endif\n'
if b'\r\n' in original:
    guard = guard.replace(b'\n', b'\r\n')
assert adapted.replace(guard, b'', 1) == original

commands = json.loads((ROOT / profile['derived_commands']).read_text())
command = next(row for row in commands if row['file'] == relative)
frontend, _ = frontend_config(True)
for browser in (True, False):
    flags = [] if browser else ['-UEDUKE32_BROWSER']
    run = subprocess.run([frontend, *captured_args(command), *flags, '-E', '-P', relative],
                         cwd=source, capture_output=True, text=True, timeout=90)
    assert run.returncode == 0, run.stderr[-2400:]
    code = run.stdout
    assert ('timerSampleRDTSC(void)' in code) is (not browser)
    assert 'return SDL_GetPerformanceCounter();' in code
    assert 'clockTicksPerSecond = tickspersecond;' in code
    assert 'OSD_RegisterCvar(&sys_timer_cvar, osdcmd_sys_timer);' in code

print('PASS original browser timer uses SDL without CPU cycle counters and retains original initialization')
