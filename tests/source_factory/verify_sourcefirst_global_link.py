#!/usr/bin/env python3
"""Native C++/JS parity after fixed-point, cross-batch ES-module recovery."""
import json, subprocess, tempfile, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'tests/source_factory'
def run(args):
 p=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=65)
 assert p.returncode==0,(args,p.stderr[-1600:],p.stdout[-500:])
 return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke_global_link_test_') as d:
 temp=Path(d);batches=[]
 for i,name in enumerate(('source_first_global_callee.cpp','source_first_global_caller.cpp')):
  batch=temp/'batches'/str(i)
  plan=temp/f'plan{i}.json'
  plan.write_text(json.dumps({'root':str(SRC),'units':[{'source':name}]}))
  run([sys.executable,str(ROOT/'tools/source_first_project.py'),'--plan',str(plan),'--out-dir',str(batch)])
  data=json.loads((batch/'project-build.json').read_text())
  if i==0:assert data['source_definitions_emitted']==1,data
  else:assert data['source_definitions_emitted']==0 and data['source_definitions_blocked']==1,data
  batches.append({'status':'ok','manifest':str((batch/'project-build.json').relative_to(temp/'batches')),'sources':[name]})
 report={'original_selected_units':2,'batch_results':batches}
 (temp/'batches'/'recovery-report.json').write_text(json.dumps(report))
 dest=temp/'linked'
 run([sys.executable,str(ROOT/'tools/source_first_global_link.py'),'--directory',str(temp/'batches'),
      '--out',str(dest),'--source-root',str(SRC)])
 result=json.loads((dest/'global-recovery.json').read_text())
 assert result['recovered_definitions']==1,result
 assert not result['invalid_imports_or_syntax'],result
 name=dest/'source_first_global_caller.cpp.mjs'
 text=name.read_text()
 assert 'import { kernelStep }' in text and 'export function kernelRun' in text,text
 (temp/'entry.mjs').write_text('import {kernelRun} from '+json.dumps(name.as_uri())+';for(let n=-256;n<256;n++)console.log(kernelRun(n));')
 js=run(['node',str(temp/'entry.mjs')]).splitlines()
 (temp/'main.cpp').write_text('''#include <cstdio>\nextern "C" int kernelRun(int);int main(){for(int n=-256;n<256;n++)printf("%d\\n",kernelRun(n));}''')
 run(['clang++',str(SRC/'source_first_global_callee.cpp'),str(SRC/'source_first_global_caller.cpp'),str(temp/'main.cpp'),'-o',str(temp/'original')])
 native=run([str(temp/'original')]).splitlines()
 assert js==native,(js[:5],native[:5])
 print('PASS: 512 native C++ vs JS cross-unit calls, automatic imported-symbol recovery, strict module validation')
