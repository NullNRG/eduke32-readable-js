#!/usr/bin/env python3
"""Reproduce the source-to-JS compiler checkpoint's tests without claiming a complete game."""
import json, pathlib, subprocess, sys, concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parents[1]
WORK=ROOT/'factory-output'/'whole-program'

def run(cmd):
    p=subprocess.run([str(s) for s in cmd],cwd=ROOT,capture_output=True,text=True)
    if p.returncode:raise RuntimeError(f'{cmd!r} returned {p.returncode}:\n{(p.stdout+p.stderr)[-2500:]}')
    return p.stdout.strip()

def check_syntax(path):
    p=subprocess.run(['node','--check',str(path)],capture_output=True,text=True)
    if p.returncode:raise RuntimeError('JS syntax check failed: '+str(path)+'\n'+p.stderr[-2000:])
    return str(path)

def main():
    summary=json.loads((WORK/'SUMMARY.json').read_text())
    if summary['actual_complete_build'] or summary['functional_js_game_port']:
        raise RuntimeError('Checkpoint must not claim a complete game without gameplay verification')
    print(run([sys.executable,ROOT/'tests'/'whole_program_smoke.py']))
    print(run([sys.executable,ROOT/'tests'/'vector_ir_native_js.py']))
    print(run([sys.executable,ROOT/'tests'/'computed_goto_native_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'varargs_native_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'dedup_native_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'source_factory'/'poison_global_native_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'source_factory'/'reverse_copy_native_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'source_factory'/'stage5_native_abi_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'source_factory'/'stage5_libc_native_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'source_factory'/'stage5_strtol_native_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'source_factory'/'stage6_stdio_native_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'source_factory'/'stage7_native_ctype_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'source_factory'/'stage9_native_div_parity.py']))
    print(run(['node',ROOT/'tests'/'dedup_runtime.mjs']))
    print(run([sys.executable,ROOT/'tests'/'source_factory'/'native_atomic_parity.py']))
    print(run([sys.executable,ROOT/'tests'/'source_factory'/'native_fma_parity.py']))
    print(run(['node','--test',*sorted((ROOT/'tests'/'source_factory').glob('*.test.mjs'))])[-800:])
    paths=sorted((WORK/'modules').glob('*.mjs'))+[WORK/'linked.mjs', *sorted((ROOT/'runtime').glob('*.mjs'))]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(check_syntax,paths))
    print('PASS',len(paths),'JavaScript syntax checks')
    print('INCOMPLETE:',summary['lowering_blocked_functions'],'blocked functions,',summary['cross_file_unresolved_symbols'],'unresolved symbols')

if __name__=='__main__':main()
