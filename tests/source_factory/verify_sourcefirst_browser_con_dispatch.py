"""Verify selection of the original portable CON dispatcher in browser builds."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from prepare_browser_classic import adapted_bytes, browser_con_dispatch
from source_semantic_index import captured_args
from source_first_toolchain import frontend_config

relative = 'source/duke3d/src/gameexec.cpp'
profile = json.loads((ROOT / 'tools/browser_classic_profile.json').read_text())
source = ROOT / profile['prepared_source_root']
original = (ROOT / 'factory-output/source-tree/eduke32-master' / relative).read_bytes()
adapted = adapted_bytes(original, browser_con_dispatch)
assert (source / relative).read_bytes() == adapted
assert adapted.replace(b'(defined __GNUC__ || defined __clang__) && !defined(EDUKE32_BROWSER)',
                       b'defined __GNUC__ || defined __clang__', 1) == original

commands = json.loads((ROOT / profile['derived_commands']).read_text())
command = next(row for row in commands if row['file'] == relative)
frontend, _ = frontend_config(True)
for browser in (True, False):
    flags = [] if browser else ['-UEDUKE32_BROWSER']
    run = subprocess.run([frontend, *captured_args(command), *flags, '-E', '-P', relative],
                         cwd=source, capture_output=True, text=True, timeout=90)
    assert run.returncode == 0, run.stderr[-2400:]
    code = run.stdout
    assert ('static void *const jumpTable[]' in code) is (not browser)
    assert ('switch(decoded)' in code and 'case CON_LEFTBRACE:' in code and
            'while (vm_execution_depth && (vm.flags & (VM_RETURN|VM_TERMINATE|VM_KILL)) == 0)' in code) is browser

print('PASS browser selects the original CON switch dispatcher and desktop retains computed goto')
