"""Lossless compressed semantic-index continuation, restorable without Clang."""
import argparse,ast,gzip,hashlib,io,json,os,sqlite3,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FORMAT='source-semantic-all-tables/1'
def schema():
    tree=ast.parse((ROOT/'tools/source_semantic_index.py').read_text())
    scripts=[n.args[0].value for n in ast.walk(tree) if isinstance(n,ast.Call)
        and isinstance(n.func,ast.Attribute) and n.func.attr=='executescript' and n.args
        and isinstance(n.args[0],ast.Constant) and isinstance(n.args[0].value,str)
        and 'CREATE TABLE IF NOT EXISTS observations' in n.args[0].value]
    if len(scripts)!=1:raise ValueError('Canonical semantic-index schema is ambiguous')
    return scripts[0]
def tables(connection):
    names=[r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
    return {name:[list(r) for r in connection.execute('PRAGMA table_info("'+name+'")')] for name in names}
def rows(connection,name,columns):
    keys=[c[1] for c in sorted(columns,key=lambda c:c[5]) if c[5]]
    if not keys:raise ValueError('Semantic table has no stable primary key')
    return connection.execute('SELECT * FROM "'+name+'" ORDER BY '+','.join('"'+k+'"' for k in keys))
def line(value):return (json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n').encode()
def digest(path):
    with Path(path).open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
def export(database,output):
    connection=sqlite3.connect(Path(database).resolve().as_uri()+'?mode=ro',uri=True)
    expected=sqlite3.connect(':memory:');ddl=schema();expected.executescript(ddl)
    layout=tables(connection)
    if layout!=tables(expected):raise ValueError('Saved index differs from canonical table layout')
    expected.close();output=Path(output).resolve();output.parent.mkdir(parents=True,exist_ok=True)
    counts={};hashes={};stage=output.with_suffix(output.suffix+'.partial')
    meta=dict(connection.execute('SELECT key,value FROM meta'))
    header={'format':FORMAT,'schema_sha256':hashlib.sha256(ddl.encode()).hexdigest(),
            'tables':layout,'semantic_fingerprint':meta.get('fingerprint')}
    try:
        with stage.open('wb') as raw,gzip.GzipFile(filename='',fileobj=raw,mode='wb',compresslevel=3,mtime=0) as stream:
            stream.write(line(header))
            for name,columns in layout.items():
                h=hashlib.sha256();count=0
                for row in rows(connection,name,columns):
                    h.update(line(row));stream.write(line([name,row]));count+=1
                counts[name]=count;hashes[name]=h.hexdigest();print(name,count,flush=True)
        os.replace(stage,output)
    finally:connection.close();stage.unlink(missing_ok=True)
    report={**header,'table_rows':counts,'logical_table_sha256':hashes,
            'payload_sha256':digest(output),'compressed_bytes':output.stat().st_size,
            'source_database':str(Path(database).resolve()),'gameplay_verified':False}
    output.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
    return report
def restore(payload,output):
    payload=Path(payload).resolve();output=Path(output).resolve()
    if output.exists():raise ValueError('Refusing to overwrite an existing semantic database')
    report=json.loads(payload.with_suffix('.json').read_text())
    if digest(payload)!=report['payload_sha256']:raise ValueError('Compressed semantic checkpoint hash changed')
    output.parent.mkdir(parents=True,exist_ok=True)
    handle=tempfile.NamedTemporaryFile(prefix='semantic-restore-',suffix='.sqlite',dir=output.parent,delete=False)
    stage=Path(handle.name);handle.close();connection=sqlite3.connect(stage)
    try:
        ddl=schema()
        if report['schema_sha256']!=hashlib.sha256(ddl.encode()).hexdigest():raise ValueError('Canonical schema changed')
        connection.execute('PRAGMA journal_mode=OFF');connection.execute('PRAGMA synchronous=OFF');connection.executescript(ddl)
        layout=tables(connection)
        with gzip.open(payload,'rt',encoding='utf-8') as stream:
            header=json.loads(next(stream))
            if header['format']!=FORMAT or header['tables']!=layout:raise ValueError('Semantic checkpoint table mismatch')
            batch=[];current=None
            def flush():
                if batch:connection.executemany('INSERT INTO "'+current+'" VALUES('+','.join('?' for _ in layout[current])+')',batch);batch.clear()
            for text in stream:
                name,values=json.loads(text)
                if name not in layout or len(values)!=len(layout[name]):raise ValueError('Unknown semantic checkpoint row')
                if name!=current:flush();current=name
                batch.append(values)
                if len(batch)>=4096:flush()
            flush()
        connection.commit()
        for name,columns in layout.items():
            h=hashlib.sha256();count=0
            for row in rows(connection,name,columns):h.update(line(row));count+=1
            if count!=report['table_rows'][name] or h.hexdigest()!=report['logical_table_sha256'][name]:
                raise ValueError('Restored semantic table differs: '+name)
        if connection.execute('PRAGMA quick_check').fetchone()!=('ok',):raise ValueError('Restored SQLite check failed')
        connection.close();connection=None;os.replace(stage,output)
    finally:
        if connection:connection.close()
        stage.unlink(missing_ok=True)
    return {'restored':str(output),'logical_tables_verified':True,'gameplay_verified':False}
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('action',choices=['export','restore'])
    p.add_argument('--input',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
    a=p.parse_args();print(json.dumps((export if a.action=='export' else restore)(a.input,a.output),indent=2))
