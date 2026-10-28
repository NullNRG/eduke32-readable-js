"""Compiler timeouts terminate grandchildren and retain subprocess contracts."""
import ctypes
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from source_first_automate import run_compiler_process

result=run_compiler_process([sys.executable,'-c',
    'import sys; print("captured stdout"); print("captured stderr",file=sys.stderr); sys.exit(7)'],10)
assert isinstance(result,subprocess.CompletedProcess)
assert result.returncode==7 and 'captured stdout' in result.stdout and 'captured stderr' in result.stderr

with tempfile.TemporaryDirectory(prefix='eduke compiler timeout ') as temp:
    path=Path(temp)/'child-pid.json'
    code=('import json,subprocess,sys,time; from pathlib import Path; '
          'child=subprocess.Popen([sys.executable,"-c","import time; time.sleep(30)"]); '
          f'Path({str(path)!r}).write_text(json.dumps(child.pid)); '
          'print("child started",flush=True); time.sleep(30)')
    try:run_compiler_process([sys.executable,'-c',code],3)
    except subprocess.TimeoutExpired as error:
        assert 'child started' in error.output,error.output
    else:raise AssertionError('process timeout was silently ignored')
    pid=json.loads(path.read_text())
    if os.name=='nt':
        kernel=ctypes.WinDLL('kernel32',use_last_error=True)
        kernel.OpenProcess.restype=ctypes.c_void_p
        handle=kernel.OpenProcess(0x00100000,False,pid)
        if handle:
            try:assert kernel.WaitForSingleObject(ctypes.c_void_p(handle),0)==0,'grandchild still running'
            finally:kernel.CloseHandle(ctypes.c_void_p(handle))
    else:
        try:os.kill(pid,0)
        except ProcessLookupError:pass
        else:
            # A terminated child may briefly remain a zombie until init reaps it.
            stat=Path('/proc')/str(pid)/'stat'
            assert stat.exists() and stat.read_text().split(') ',1)[1].startswith('Z '),'grandchild still running'
print('PASS: compiler process-tree timeout, captured stdout/stderr, nonzero CompletedProcess contract')
