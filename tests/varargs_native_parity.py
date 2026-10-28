#!/usr/bin/env python3
"""Compile the original C ABI fixture natively and to linked JS; compare outputs."""
import json, pathlib, subprocess, tempfile, sys
root=pathlib.Path(__file__).resolve().parents[1]
names=['call_sum','call_wide','call_double','call_mix','call_copy','format_direct','call_forward','format_truncate']
harness='''#include <stdio.h>
int call_sum(void);long long call_wide(void);double call_double(void);long long call_mix(void);int call_copy(void);
int format_direct(void);int call_forward(void);int format_truncate(void);
int main(void){printf("%d %lld %.17g %lld %d %d %d %d\\n",call_sum(),call_wide(),call_double(),call_mix(),call_copy(),format_direct(),call_forward(),format_truncate());return 0;}
'''
def run(argv):
 p=subprocess.run(list(map(str,argv)),capture_output=True,text=True,cwd=root)
 if p.returncode:raise RuntimeError(f'{argv}: {p.returncode}\n{p.stdout[-1000:]}\n{p.stderr[-2000:]}')
 return p.stdout.strip()
with tempfile.TemporaryDirectory() as temp:
 t=pathlib.Path(temp)
 (t/'native_harness.c').write_text(harness)
 run(['clang','-O1',root/'tests/whole_program_varargs_fixture/main.c',t/'native_harness.c','-o',t/'native'])
 actual_native=run([t/'native']).split(' ')
 work=t/'work'
 run([sys.executable,root/'tools/whole_program.py','--source',root/'tests/whole_program_varargs_fixture','--out',work,'--fixture','--require-complete'])
 node_js='''import {boot} from '''+json.dumps((work/'linked.mjs').as_uri())+''';
 const c=boot();console.log(JSON.stringify('''+json.dumps(names)+'''.map(n=>String(c.call(n,[])))));'''
 actual_js=json.loads(run(['node','--input-type=module','-e',node_js]))
 assert actual_native==actual_js, f'C/JS mismatch\n{actual_native}\n{actual_js}'
 print('PASS native Clang vs linked JavaScript: '+str(len(names))+' variadic/formatting exported functions')
