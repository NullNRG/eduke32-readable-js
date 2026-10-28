#!/usr/bin/env python3
"""Compare an actual Clang native atomic C program to the generated JS program."""
from pathlib import Path
import tempfile, subprocess, sys, json
root=Path(__file__).resolve().parents[2]
fixture=root/'tests'/'whole_program_atomic_fixture'
with tempfile.TemporaryDirectory() as tmp:
    tmp=Path(tmp)
    h=tmp/'harness.c'
    h.write_text('#include <stdio.h>\nextern int atomic_main(void);\nint main(void){printf("%d\\n",atomic_main());return 0;}\n')
    cmd=['clang','-std=c11','-O1',str(fixture/'engine.c'),str(fixture/'main.c'),str(h),'-o',str(tmp/'native')]
    subprocess.run(cmd,check=True)
    native=subprocess.check_output([str(tmp/'native')],text=True).strip()
    subprocess.run([sys.executable,str(root/'tools'/'whole_program.py'),'--fixture','--source',str(fixture),'--out',str(tmp/'compiled'),'--require-complete'],check=True,capture_output=True)
    js=f'import {{boot}} from {json.dumps((tmp/"compiled/linked.mjs").as_uri())};console.log(boot().call("atomic_main",[]));'
    converted=subprocess.check_output(['node','--input-type=module','-e',js],text=True).strip()
    assert native==converted=='123', f'Native/JS mismatch: {native} vs {converted}'
    print('PASS original compiled C atomics == generated JavaScript:',native)
