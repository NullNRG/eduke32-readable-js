"""Retain small original compiler-test baselines without restoring old builds."""
import hashlib,json,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=Path('C:/Users/andre/Downloads/EDuke32_JS_Accelerated_Full156_LLM_Handoff_2026-10-14 (1).zip')
OUTPUT=ROOT/'reports/history/original-source-manifests-20261014.zip'
PREFIX='EDuke32_SourceFactory/factory-output/source-first/'
ROOTS=('globally-linked/','current-full-linkage-fix/','current-full-check/automatic/')
def sha(data):return hashlib.sha256(data).hexdigest()
def main():
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    rows=[]
    with zipfile.ZipFile(ARCHIVE) as source,zipfile.ZipFile(OUTPUT,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as destination:
        for entry in source.infolist():
            if not entry.filename.startswith(PREFIX):continue
            name=entry.filename[len(PREFIX):]
            if not name.endswith('.json') or not any(name.startswith(root) for root in ROOTS):continue
            path=PurePosixPath(name)
            if path.is_absolute() or '..' in path.parts or '\\' in name or ':' in name:raise ValueError('Unsafe historical metadata path')
            data=source.read(entry);json.loads(data)
            destination.writestr(name,data);rows.append({'path':name,'bytes':len(data),'sha256':sha(data)})
        index={'format':'sourcefactory-historical-test-metadata/1','source_archive':ARCHIVE.name,
            'source_archive_sha256':sha(ARCHIVE.read_bytes()),'entries':rows,
            'scope':'Exact historical JSON only, required by original-source regression tests. No old executable modules, assets or build caches.',
            'current_compilation_or_gameplay_verified':False}
        destination.writestr('index.json',json.dumps(index,indent=2)+'\n')
    proof={'archive':OUTPUT.relative_to(ROOT).as_posix(),'sha256':sha(OUTPUT.read_bytes()),'bytes':OUTPUT.stat().st_size,
        'json_files':len(rows),'uncompressed_bytes':sum(row['bytes'] for row in rows),'gameplay_verified':False}
    (ROOT/'reports/oct29-historical-test-metadata.json').write_text(json.dumps(proof,indent=2)+'\n')
    print(json.dumps(proof,indent=2))
if __name__=='__main__':main()
