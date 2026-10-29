"""Check actual original-source Clang cache retention and fresh JS equivalence."""
import hashlib,json,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_first_automate import ast_semantic_epoch
from source_ast_cache_paths import persistent_ast_cache_directory
source=ROOT/'factory-output/browser-classic/source-tree/eduke32-master'
commands=ROOT/'factory-output/browser-classic/compile_commands.json'
automatic=ROOT/'factory-output/source-first/browser-classic/automatic'
cache=persistent_ast_cache_directory(automatic,ast_semantic_epoch(commands,source))/'shard-00'
out=ROOT/'factory-output/source-first/oct29-original-cache-proof'
report=ROOT/'reports/oct29-original-cache-proof.json'
args=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(source),'--source','source/build/src/osd.cpp',
 '--compile-commands',str(commands),'--out-dir',str(out),'--ast-cache-dir',str(cache),'--require-record-layouts']
rows=[]
for number in (1,2):
 started=time.monotonic();log=ROOT/f'reports/oct29-original-cache-proof-{number}.log'
 with log.open('w') as stream:code=subprocess.run(args,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,timeout=360).returncode
 if code:raise SystemExit('Original compiler failed; inspect '+str(log))
 manifest=json.loads((out/'source/build/src/osd.cpp.manifest.json').read_text())
 module=out/'source/build/src/osd.cpp.mjs'
 assert module.is_file() and manifest['emitted']>0
 row={'pass':number,'seconds':round(time.monotonic()-started,3),'emitted':manifest['emitted'],'blocked':manifest['blocked'],
      'module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),'ast_decode':manifest['ast_decode']}
 rows.append(row)
 report.write_text(json.dumps({'format':'original-source-ast-cache-proof/1','original_source':'source/build/src/osd.cpp',
  'cache_directory':str(cache),'source_commands_sha256':hashlib.sha256(commands.read_bytes()).hexdigest(),
  'compiler_frontend_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
  'passes':rows,'gameplay_verified':False},indent=2)+'\n')
 print('Pass',number,round(row['seconds'],2),'seconds',[(a['cache_hit'],a.get('cache_storage'),a.get('cache_entry_bytes')) for a in row['ast_decode']],flush=True)
assert rows[0]['module_sha256']==rows[1]['module_sha256'],'cached AST changed original-source JS emission'
assert all(a['cache_hit'] for a in rows[1]['ast_decode']),rows[1]
assert any(a.get('cache_storage')=='gzip' for a in rows[1]['ast_decode'])
result=json.loads(report.read_text());result.update(passed=True,readable_js_bytes_unchanged=True)
report.write_text(json.dumps(result,indent=2)+'\n')
print('PASS original osd.cpp: retained compressed Clang AST, real cache hit and identical fresh readable JavaScript; original console/game boot not established',flush=True)
