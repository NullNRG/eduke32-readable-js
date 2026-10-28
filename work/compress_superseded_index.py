import hashlib,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
source=root/'reports/semantic-index-original-mixed-resource.sqlite'
destination=root/'work/semantic-index-original-mixed-resource.zip'
stage=destination.with_suffix('.zip.partial')
sha=hashlib.sha256()
with zipfile.ZipFile(stage,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=3,allowZip64=True) as archive:
    with source.open('rb') as stream,archive.open(source.name,'w',force_zip64=True) as output:
        for chunk in iter(lambda:stream.read(1024*1024),b''):
            sha.update(chunk);output.write(chunk)
verified=hashlib.sha256()
with zipfile.ZipFile(stage) as archive,archive.open(source.name) as stream:
    for chunk in iter(lambda:stream.read(1024*1024),b''):verified.update(chunk)
if sha.digest()!=verified.digest():raise RuntimeError('Superseded index archive does not match source')
stage.replace(destination)
report={'source':str(source),'source_bytes':source.stat().st_size,'sha256':sha.hexdigest(),
        'archive':str(destination),'archive_bytes':destination.stat().st_size,'verified_roundtrip':True}
(root/'reports/superseded-index-archive.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2),flush=True)
