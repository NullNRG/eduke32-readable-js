#!/usr/bin/env python3
"""Compare source C computed-goto behavior with generated JS blockaddress/indirectbr."""
import json,pathlib,subprocess,sys,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=ROOT/'tests/whole_program_computed_goto_fixture/main.c'
def run(args):
    proc=subprocess.run([str(a) for a in args],capture_output=True,text=True)
    if proc.returncode:
        raise RuntimeError(str(args)+' failed:\n'+proc.stdout+'\n'+proc.stderr)
    return proc.stdout.strip()
with tempfile.TemporaryDirectory() as temp:
    d=pathlib.Path(temp)
    harness=d/'harness.c'
    harness.write_text('#include <stdio.h>\nint dispatch(int,int);\nint main(void){for(int x=-1;x<6;x++)printf("%d\\n",dispatch(x,6));return 0;}\n')
    run(['clang','-std=gnu11','-O1',SRC,harness,'-o',d/'native'])
    native=list(map(int,run([d/'native']).splitlines()))
    work=d/'work'
    run([sys.executable,ROOT/'tools/whole_program.py','--source',SRC.parent,'--out',work,'--fixture','--require-complete'])
    script='import {boot} from '+json.dumps((work/'linked.mjs').as_uri())+';const ctx=boot();console.log(JSON.stringify(Array.from({length:7},(_,i)=>ctx.call("dispatch",[i-1,6]))));'
    generated=json.loads(run(['node','--input-type=module','-e',script]))
    assert generated==native,(generated,native)
    print('PASS GNU computed-goto native C and JavaScript parity: '+str(len(native))+' cases')
