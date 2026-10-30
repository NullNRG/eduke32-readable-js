"""Verify every exported semantic row without creating a second multi-GB DB."""
import gzip,hashlib,json
from pathlib import Path
from portable_semantic_checkpoint import digest,line,schema
ROOT=Path(__file__).resolve().parents[1]
payload=ROOT/'reports/semantic-browser-checkpoint/index.jsonl.gz'
metadata=json.loads(payload.with_suffix('.json').read_text())
assert digest(payload)==metadata['payload_sha256']
assert hashlib.sha256(schema().encode()).hexdigest()==metadata['schema_sha256']
counts={name:0 for name in metadata['tables']};hashes={name:hashlib.sha256() for name in counts}
with gzip.open(payload,'rt',encoding='utf-8') as stream:
    header=json.loads(next(stream))
    assert header['tables']==metadata['tables'] and header['semantic_fingerprint']==metadata['semantic_fingerprint']
    for text in stream:
        name,row=json.loads(text)
        assert name in counts and len(row)==len(metadata['tables'][name])
        counts[name]+=1;hashes[name].update(line(row))
actual={name:value.hexdigest() for name,value in hashes.items()}
assert counts==metadata['table_rows'] and actual==metadata['logical_table_sha256']
summary=json.loads((ROOT/'factory-output/source-first/browser-classic/reports/semantic-index.summary.json').read_text())
assert metadata['semantic_fingerprint']==summary['fingerprint']
report={'format':'semantic-continuation-payload-verification/1','passed':True,
 'payload':payload.relative_to(ROOT).as_posix(),'payload_sha256':metadata['payload_sha256'],
 'semantic_fingerprint':metadata['semantic_fingerprint'],'selected_units':summary['selected_units'],
 'table_rows':counts,'logical_table_sha256':actual,'all_rows_verified':True,
 'new_sqlite_restoration_tested':False,'gameplay_verified':False}
(ROOT/'reports/oct29-current-semantic-payload-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({key:report[key] for key in ('passed','selected_units','all_rows_verified','new_sqlite_restoration_tested')},indent=2))
