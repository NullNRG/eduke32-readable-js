"""Read exact, compact historical Clang metadata for compiler regressions.

These data are not current implementation providers and contain no executable
modules. Retain original baseline comparisons without obsolete build folders.
"""
from contextlib import contextmanager
import hashlib,json,tempfile,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/'reports/history/original-source-manifests-20261014.zip'
EXPECTED_SHA256='3b967031296399505e5ab81355a851b00a39137747cc4d1ca63096914dcd7b82'
def contents():
    if hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()!=EXPECTED_SHA256:
        raise ValueError('Historical compiler metadata archive changed')
    with zipfile.ZipFile(ARCHIVE) as archive:
        names=archive.namelist()
        if len(names)!=len(set(names)):raise ValueError('Duplicate historical metadata entries')
        index=json.loads(archive.read('index.json'))
        if index.get('format')!='sourcefactory-historical-test-metadata/1':raise ValueError('Unknown historical metadata format')
        rows=index['entries']
        if set(names)!={'index.json',*(r['path'] for r in rows)}:raise ValueError('Unindexed historical metadata')
        result={}
        for row in rows:
            name=row['path'];path=PurePosixPath(name)
            if path.is_absolute() or '..' in path.parts or '\\' in name or ':' in name or not name.endswith('.json'):
                raise ValueError('Unsafe historical metadata path')
            data=archive.read(name)
            if len(data)!=row['bytes'] or hashlib.sha256(data).hexdigest()!=row['sha256']:
                raise ValueError('Historical metadata entry changed: '+name)
            json.loads(data);result[name]=data
        return result
def report(name):return json.loads(contents()[name])
@contextmanager
def materialize():
    with tempfile.TemporaryDirectory(prefix='eduke-historical-metadata-') as temporary:
        root=Path(temporary).resolve()
        for name,data in contents().items():
            target=(root/name).resolve()
            if not target.is_relative_to(root):raise ValueError('Historical metadata escapes temporary root')
            target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
        yield root
def recorded_units():
    """Only manifests owned by successful original batch checkpoints."""
    data=contents();prefix='current-full-check/automatic/'
    compilation=json.loads(data[prefix+'recovery-report.json']);units={}
    for batch in compilation['batch_results']:
        if batch['status']!='ok':continue
        batch_name=prefix+batch['manifest'];metadata=json.loads(data[batch_name]);parent=PurePosixPath(batch_name).parent
        for entry in metadata['units']:
            source=entry['source']
            if source in units:raise ValueError('Duplicate historical source ownership')
            units[source]={'module':None,'manifest':json.loads(data[str(parent/(source+'.manifest.json'))])}
    return units
