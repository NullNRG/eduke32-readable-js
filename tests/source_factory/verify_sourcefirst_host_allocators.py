"""Exercise the host boundary used by original LP64 source allocation calls."""
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
result=subprocess.run(['node','--test','tests/source_factory/source_heap_addresses.test.mjs'],cwd=ROOT,
    capture_output=True,text=True,timeout=60)
assert result.returncode==0,result.stdout+'\n'+result.stderr
print(result.stdout)
