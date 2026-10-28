#!/usr/bin/env python3
"""Compare a real compiled C stdio caller against the JS-lowered same source."""
import json,pathlib,subprocess,tempfile,sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
SRC=ROOT/'tests'/'whole_program_stdio_fixture'/'main.c'

def run(args,**kwargs):
 p=subprocess.run([str(x) for x in args],capture_output=True,**kwargs)
 if p.returncode:raise RuntimeError(f'{args}: {p.stderr.decode(errors="replace")[-2000:]}')
 return p
with tempfile.TemporaryDirectory() as temp:
 work=pathlib.Path(temp)
 main=work/'driver.c';main.write_text('extern int fmt_roundtrip(void);int main(void){return fmt_roundtrip()!=44;}\n')
 bin=work/'native';run(['clang','-std=c11',SRC,main,'-o',bin]);original=run([bin]);
 jswork=work/'translated'
 run([sys.executable,ROOT/'tools'/'whole_program.py','--source',SRC.parent,'--out',jswork,'--fixture','--require-complete'])
 js='''import {boot} from '''+json.dumps((jswork/'linked.mjs').as_uri())+''';
const out=[],err=[];
const c=boot({stdio:{stdout:b=>out.push(...b),stderr:b=>err.push(...b)}});
const ret=c.call('fmt_roundtrip',[]);
console.log(JSON.stringify({ret,stdout:out,stderr:err}));'''
 observed=json.loads(run(['node','--input-type=module','-e',js]).stdout)
 assert observed['ret']==44,observed['ret']
 assert bytes(observed['stdout'])==original.stdout,(bytes(observed['stdout']),original.stdout)
 assert bytes(observed['stderr'])==original.stderr,(bytes(observed['stderr']),original.stderr)
 print('PASS native C vs JavaScript stdout/stderr byte parity:',len(original.stdout)+len(original.stderr),'bytes, embedded NUL preserved')
