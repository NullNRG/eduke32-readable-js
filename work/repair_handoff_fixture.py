"""Add omitted linked-source regression fixtures without changing the compiler snapshot."""
import hashlib,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(r'C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\outputs')
path=OUT/'EDuke32_Continue_Current_Work.zip'
stage=path.with_suffix('.zip.partial')
prefix='EDuke32_SourceFactory/'
def encoded(value):return (json.dumps(value,indent=2,sort_keys=True)+'\n').encode()
with zipfile.ZipFile(path) as old:
    manifest=json.loads(old.read(prefix+'PACKAGE_MANIFEST.json'))
    additions={p.relative_to(ROOT).as_posix():p.read_bytes() for p in (ROOT/'tests/source_first_link_fixture').rglob('*') if p.is_file()}
    additions['tests/source_factory/verify_sourcefirst_revision_race.py']=(ROOT/'tests/source_factory/verify_sourcefirst_revision_race.py').read_bytes()
    additions['tests/source_factory/verify_sourcefirst_span_cache.py']=(ROOT/'tests/source_factory/verify_sourcefirst_span_cache.py').read_bytes()
    names=set(additions)
    manifest['files']=[r for r in manifest['files'] if r['path'] not in names]
    manifest['files'] += [{'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()} for name,data in sorted(additions.items())]
    with zipfile.ZipFile(stage,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=5) as new:
        for info in old.infolist():
            if info.filename==prefix+'PACKAGE_MANIFEST.json' or info.filename in {prefix+name for name in additions}:continue
            new.writestr(info,old.read(info.filename))
        for name,data in additions.items():new.writestr(prefix+name,data)
        new.writestr(prefix+'PACKAGE_MANIFEST.json',encoded(manifest))
        new.comment=old.comment
with zipfile.ZipFile(stage) as archive:
    for row in manifest['files']:
        with archive.open(prefix+row['path']) as stream:digest=hashlib.file_digest(stream,'sha256').hexdigest()
        if digest!=row['sha256']:raise ValueError(row['path'])
stage.replace(path)
with path.open('rb') as stream:digest=hashlib.file_digest(stream,'sha256').hexdigest()
result={'file':path.name,'mode':'continuation','files':len(manifest['files'])+1,'bytes':path.stat().st_size,'sha256':digest,'all_payload_hashes_verified':True}
(OUT/'LLM_Handoff_Packages.json').write_bytes(encoded({'packages':[result]}))
print(json.dumps(result))
