"""Inspect existing Clang declaration evidence for original global allocators."""
import json,sqlite3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
db=sqlite3.connect((ROOT/'reports/semantic-index.sqlite').as_uri()+'?mode=ro',uri=True)
rows=[]
for (encoded,) in db.execute("SELECT record FROM declarations WHERE definition=1 AND name IN ('operator new','operator new[]','operator delete','operator delete[]')"):
    row=json.loads(encoded)
    if row.get('file','').startswith('source/'):
        rows.append({k:row.get(k) for k in ('usr','file','line','name','type','mangled_name','linkage')})
db.close()
report={'format':'original-global-cpp-allocator-inventory/1','original_definitions':rows,
    'evidence_scope':'historical semantic index; fresh lowering required',
    'standard_heap_substitution_authorized_for_captured_program':False,'gameplay_verified':False}
(ROOT/'reports/oct15-original-cpp-allocators.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
