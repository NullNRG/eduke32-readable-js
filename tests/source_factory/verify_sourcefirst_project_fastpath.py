#!/usr/bin/env python3
"""Avoid second AST lowering when verified external owners cannot help a unit."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory(prefix='eduke-project-fastpath-') as tmp:
 root=Path(tmp);src=root/'original';src.mkdir()
 (src/'provider.cpp').write_text('extern "C" int provider(int x){return x*3;}\n')
 (src/'caller.cpp').write_text('extern "C" int provider(int); extern "C" int caller(int x){return provider(x)+7;}\n')
 (src/'independent.cpp').write_text('extern "C" int independent(int x){return x+1;}\n')
 plan=root/'plan.json';plan.write_text(json.dumps({'root':str(src),'units':[
  {'source':name} for name in ('provider.cpp','caller.cpp','independent.cpp')]}))
 output=root/'generated'
 cmd=[sys.executable,str(ROOT/'tools/source_first_project.py'),'--plan',str(plan),'--out-dir',str(output)]
 result=subprocess.run(cmd,text=True,capture_output=True,timeout=90,cwd=ROOT)
 assert result.returncode==0,(result.stderr,result.stdout[-2000:])
 report=json.loads((output/'project-build.json').read_text())
 assert report['relowered_with_external_index']==['caller.cpp'],report['relowered_with_external_index']
 assert set(report['reused_unaffected_external_index_probes'])=={'provider.cpp','independent.cpp'},report
 assert report['compiler_passes']==4,report['compiler_passes']
 assert report['invalid_imports']==[],report['invalid_imports']
 index=root/'run.mjs'
 index.write_text('import {caller} from '+json.dumps((output/'caller.cpp.mjs').as_uri())+';\n'
   +'import {independent} from '+json.dumps((output/'independent.cpp.mjs').as_uri())+';\n'
   +'if(caller(11)!==40 || independent(11)!==12) throw new Error("bad source-derived JS"); console.log("ok");\n')
 check=subprocess.run(['node',str(index)],capture_output=True,text=True,timeout=30)
 assert check.returncode==0,(check.stdout,check.stderr)
print('PASS: only AST-proven dependent TU re-lowered; unrelated original C++ executes without second Clang pass')
