"""Compare compiler changes with the last delivered canonical continuation."""
import difflib,hashlib,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD=Path(r'C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\outputs\EDuke32_SourceFactory_Continuation_2026-10-16_ArrayStorage.zip')
prefix='EDuke32_SourceFactory/'
paths=['tools/source_ast_to_js.py','tools/source_cpp_references.py','tools/source_cpp_lifetime.py',
 'tools/source_header_records.py','tools/source_first_global_link.py','tools/source_first_automate.py',
 'tools/package_checkpoint.py','tests/source_factory/verify_sourcefirst_cpp_references.py',
 'runtime/abi.mjs','tests/source_factory/verify_sourcefirst_host_heap_alias.py']
rows=[];patch=[]
with zipfile.ZipFile(OLD) as old:
 for name in paths:
  previous=old.read(prefix+name) if prefix+name in old.namelist() else b''
  current=(ROOT/name).read_bytes()
  if previous==current:continue
  rows.append({'path':name,'before_sha256':hashlib.sha256(previous).hexdigest() if previous else None,
               'after_sha256':hashlib.sha256(current).hexdigest(),'after_bytes':len(current)})
  patch.extend(difflib.unified_diff(previous.decode().splitlines(True),current.decode().splitlines(True),fromfile='a/'+name,tofile='b/'+name))
 originals=[]
 for name in ('input-source/eduke32-master.zip','input-source/dukenukem3d-master.zip','input-data/DUKE3D.GRP'):
  observed=(ROOT/name).read_bytes();assert observed==old.read(prefix+name),name
  originals.append({'path':name,'sha256':hashlib.sha256(observed).hexdigest(),'unchanged':True})
 original_sources=[name for name in old.namelist() if name.startswith(prefix+'factory-output/source-tree/') and not name.endswith('/')]
 for name in original_sources:
  assert (ROOT/name[len(prefix):]).read_bytes()==old.read(name),name
(ROOT/'reports/oct19-reference-host-code-changes.patch').write_text(''.join(patch))
(ROOT/'reports/oct19-reference-host-code-changes.json').write_text(json.dumps({'format':'canonical-compiler-change-review/1',
 'baseline_zip':str(OLD),'files':rows,'original_inputs':originals,'original_source_files_checked':len(original_sources),
 'original_source_unchanged':True,'gameplay_verified':False},indent=2)+'\n')
print(json.dumps({'changed_compiler_test_files':len(rows),'original_source_files_unchanged':len(original_sources)}))
