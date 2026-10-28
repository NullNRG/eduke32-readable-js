"""Reviewable changes relative to the previously delivered continuation."""
from pathlib import Path
import difflib,hashlib,json,zipfile
ROOT=Path(__file__).resolve().parents[1]
prior=Path(r'C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\outputs\EDuke32_SourceFactory_Continuation_2026-10-15_EntryAttempt.zip')
assert hashlib.sha256(prior.read_bytes()).hexdigest()=='8ba88b7b6be0e8a2fd609efda62fc8604825ea8f93c9335c8f4d362f0172754a'
rows=[];patch=[]
with zipfile.ZipFile(prior) as archive:
 names=set(archive.namelist())
 for folder in ('tools','runtime','tests'):
  for path in sorted((ROOT/folder).rglob('*')):
   if not path.is_file() or '__pycache__' in path.parts or path.suffix not in ('.py','.mjs','.cjs','.cpp','.h','.json','.ps1'):continue
   relative=path.relative_to(ROOT).as_posix();member='EDuke32_SourceFactory/'+relative
   old=archive.read(member) if member in names else b'';new=path.read_bytes()
   if old==new:continue
   row={'path':relative,'change':'modified' if member in names else 'added','before_sha256':hashlib.sha256(old).hexdigest() if old else None,'after_sha256':hashlib.sha256(new).hexdigest(),'bytes':len(new)};rows.append(row)
   patch.extend(difflib.unified_diff(old.decode('utf-8-sig').splitlines(True),new.decode('utf-8-sig').splitlines(True),fromfile='a/'+relative if old else '/dev/null',tofile='b/'+relative))
report={'format':'canonical-code-change-review/1','baseline_zip':prior.name,'baseline_sha256':hashlib.sha256(prior.read_bytes()).hexdigest(),'changed_files':rows,'gameplay_verified':False}
(ROOT/'reports/oct15-current-code-changes.json').write_text(json.dumps(report,indent=2)+'\n')
(ROOT/'reports/oct15-current-code-changes.patch').write_text(''.join(patch))
print('Saved',len(rows),'source/compiler/runtime/test file changes; patch bytes',sum(len(s.encode())for s in patch))
print('\n'.join(r['path']for r in rows))
