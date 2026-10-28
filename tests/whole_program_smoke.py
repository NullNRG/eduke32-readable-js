#!/usr/bin/env python3
"""Reproducible whole-source compilation, cross-TU and linker semantic tests."""
import pathlib, subprocess, sys, json, tempfile
root=pathlib.Path(__file__).resolve().parents[1]
def call(args,cwd=root):
    p=subprocess.run([str(x) for x in args],cwd=cwd,capture_output=True,text=True)
    if p.returncode:raise RuntimeError('FAILED '+str(args)+'\n'+p.stdout[-1000:]+'\n'+p.stderr[-2000:])
    return p.stdout
with tempfile.TemporaryDirectory() as temp:
    out=pathlib.Path(temp)
    for name,expr in [('whole_program_fixture','c.call("game_tick",[7])===41'),
                      ('whole_program_cpp_fixture','c.call("run_ship",[10,4,3])===22&&c.call("run_ship",[0,5,8])===40'),
                      ('whole_program_scope_fixture','c.call("both",[])===12&&((c.call("set_one",[12]),c.call("set_two",[9]),c.call("both",[])===21))'),
                      ('whole_program_ctor_fixture','c.call("state_value",[])===7'),
                      ('whole_program_data_fixture','c.call("entry",[0])===12&&c.call("entry",[3])===25'),
                      ('whole_program_callback_fixture','c.call("run_callback",[0,6])===12&&c.call("run_callback",[1,6])===18'),
                      ('whole_program_control_flow_fixture','c.call("dispatch",[-9,5])===15&&c.call("dispatch",[3,5])===25&&c.call("dispatch",[987,5])===65&&c.call("dispatch",[0,5])===-72&&c.call("call_with_global_offset",[0])===65'),
                      ('whole_program_atomic_fixture','c.call("atomic_main",[])===123'),
                      ('whole_program_struct_fixture','c.call("entry_value",[0])===110&&c.call("entry_value",[1])===126&&c.call("row_value",[0])===98&&c.call("row_value",[1])===88'),
                      ('whole_program_vector_fixture','c.call("vector_round",[2.5])===2&&c.call("vector_round",[-1.5])===-2&&c.call("vector_round",[3.5])===4&&c.call("vector_round",[-0.5])===0&&c.call("vector_total",[2.5])===19'),
                      ('whole_program_startup_fixture','c.call("startup_choice",[1])===67&&c.call("startup_choice",[0])===70&&c.call("startup_total",[1])===84&&c.call("float_as_bit",[1])===1065353216'),
                      ('whole_program_vector_memory_fixture','c.call("vector_pair_run",[2.25])===5.75&&c.call("vector_pair_run",[-1.5])===2'),
                      ('whole_program_dedupe_fixture','c.call("calculate",[100n,7n])===1402n&&c.call("wide_arithmetic",[2n,5n])===123456787n&&c.call("vector_sum",[2.25])===5.75'),
                      ('whole_program_varargs_fixture','c.call("call_sum",[])===45&&c.call("call_wide",[])===360000000000n&&c.call("call_double",[])===55&&c.call("call_mix",[])===10000000083n&&c.call("call_copy",[])===18&&c.call("format_direct",[])+13===c.call("call_forward",[])&&c.call("format_truncate",[])>0'),
                      ('whole_program_cxx_dtor_fixture','c.call("get_lifetime_state",[])===10&&(c.runDestructors(),c.call("get_lifetime_state",[])===110)'),
                      ('whole_program_stdio_fixture','c.call("fmt_roundtrip",[])===44'),
                      ('whole_program_posix_fixture','c.call("sort_and_checksum",[])===168&&c.call("mutex_roundtrip",[])===1&&c.call("clock_roundtrip",[])===1'),
                      ('whole_program_computed_goto_fixture','c.call("dispatch",[0,6])===9&&c.call("dispatch",[1,6])===24&&c.call("dispatch",[2,6])===1&&c.call("dispatch",[3,6])===12&&c.call("dispatch",[4,6])===-99')]:
        work=out/name
        call([sys.executable,root/'tools'/'whole_program.py','--source',root/'tests'/name,'--out',work,'--fixture','--require-complete'])
        js='import {boot} from '+json.dumps((work/'linked.mjs').as_uri())+';const c=boot();if(!('+expr+'))throw Error("cross-TU parity failure");console.log("PASS");'
        call(['node','--input-type=module','-e',js])
        for file in (work/'modules').glob('*.mjs'):call(['node','--check',file])
        print('PASS:',name)
print('All whole-program fixture tests passed.')
