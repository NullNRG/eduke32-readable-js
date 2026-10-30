"""Preserve the historical index losslessly while freeing space for build tools."""
import gzip,hashlib,json,os,sqlite3,time
from contextlib import closing
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=(ROOT/'reports/semantic-index.sqlite').resolve()
OUTPUT=SOURCE.with_suffix('.sqlite.gz')
def digest(path,compressed=False):
    result=hashlib.sha256();size=0
    with (gzip.open(path,'rb') if compressed else path.open('rb')) as stream:
        for block in iter(lambda:stream.read(4*1024*1024),b''):result.update(block);size+=len(block)
    return result.hexdigest(),size
def main():
    if SOURCE!=ROOT/'reports/semantic-index.sqlite' or not SOURCE.is_relative_to(ROOT/'reports'):
        raise ValueError('Unexpected historical source path')
    if not SOURCE.is_file():raise ValueError('Historical source database absent')
    if OUTPUT.exists():raise ValueError('Refuse overwrite of a historical checkpoint')
    with closing(sqlite3.connect(SOURCE.as_uri()+'?mode=ro',uri=True)) as connection:
        assert connection.execute('PRAGMA quick_check').fetchone()==('ok',)
        units=connection.execute('SELECT count(*) FROM units').fetchone()[0]
    wal=SOURCE.with_name(SOURCE.name+'-wal')
    if wal.exists() and wal.stat().st_size:raise ValueError('Historical index has a nonempty WAL; do not compress an active database')
    before=SOURCE.stat();stage=OUTPUT.with_suffix('.gz.partial');start=time.monotonic()
    source_hash=hashlib.sha256()
    with SOURCE.open('rb') as incoming,stage.open('wb') as file:
        with gzip.GzipFile(fileobj=file,mode='wb',mtime=0,compresslevel=6) as output:
            for block in iter(lambda:incoming.read(4*1024*1024),b''):
                source_hash.update(block);output.write(block)
    assert SOURCE.stat().st_size==before.st_size and SOURCE.stat().st_mtime_ns==before.st_mtime_ns
    assert not wal.exists() or wal.stat().st_size==0
    restored_hash,restored_size=digest(stage,True)
    assert restored_hash==source_hash.hexdigest() and restored_size==before.st_size
    os.replace(stage,OUTPUT)
    proof={'format':'historical-semantic-index-lossless-compression/1','source':str(SOURCE.relative_to(ROOT)),
        'compressed':str(OUTPUT.relative_to(ROOT)),'original_bytes':before.st_size,
        'original_sha256':restored_hash,'compressed_sha256':digest(OUTPUT)[0],
        'compressed_bytes':OUTPUT.stat().st_size,'selected_units':units,
        'full_decompression_hash_verified':True,'elapsed_seconds':round(time.monotonic()-start,3),
        'restore_command':'python -c "import gzip,shutil; a=gzip.open(\'reports/semantic-index.sqlite.gz\',\'rb\'); b=open(\'reports/semantic-index.sqlite\',\'xb\'); shutil.copyfileobj(a,b); b.close(); a.close()"',
        'gameplay_verified':False}
    (ROOT/'reports/oct29-historical-semantic-compression.json').write_text(json.dumps(proof,indent=2)+'\n')
    # Exact original bytes have a verified, durable replacement at this point.
    SOURCE.unlink()
    print(json.dumps(proof,indent=2))
if __name__=='__main__':main()
