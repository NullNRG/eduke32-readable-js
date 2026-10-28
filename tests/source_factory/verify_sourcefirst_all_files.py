"""Full archive audit and critical source-coverage regression checks."""
from pathlib import Path
from tempfile import TemporaryDirectory
import importlib.util
import json
import sys
import zipfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_file_audit import report, scan, resolve_local_includes

doc=report()
m=doc['metrics']
assert m['all_archived_source_files_examined']==len(doc['all_eduke_source_entries'])+len(doc['all_second_source_entries'])
assert m['all_archived_source_files_examined']>=1400
assert m['original_translation_candidates_not_selected_by_make']>0, 'must report excluded compilation candidates'
assert m['make_selected_original_units_found']+m['generated_make_units_with_source_rule']==m['make_selected_units']
assert m['archive_extraction_errors']==0, doc['extraction_and_selection_errors'][:3]
assert len(doc['local_include_graph']['source_include_edges'])>1000
assert len({r['path'] for r in doc['all_eduke_source_entries']})==len(doc['all_eduke_source_entries'])
assert len({r['path'] for r in doc['all_second_source_entries']})==len(doc['all_second_source_entries'])

with TemporaryDirectory() as tmp:
    r=Path(tmp);(r/'src').mkdir()
    with zipfile.ZipFile(r/'mini.zip','w') as z:z.writestr('mini/feature.cpp','#include "feature.h"\nint f(){return 1;}\n');z.writestr('mini/feature.h','int f();\n')
    (r/'src/feature.cpp').write_text('#include "feature.h"\nint f(){return 1;}\n',newline='\n')
    (r/'src/feature.h').write_text('int f();\n',newline='\n')
    rows,inc,errors,_=scan(r/'mini.zip',{'feature.cpp'},r/'src')
    assert not errors and len(rows)==2
    assert resolve_local_includes(rows,inc,[])['resolved_local']==1
    (r/'src/feature.cpp').write_text('int f(){return 2;}\n',newline='\n')
    _,_,errors,_=scan(r/'mini.zip',{'feature.cpp'},r/'src')
    assert len(errors)==1 and 'differs' in errors[0]['error']
print('ALL-FILES AUDIT PASS:',json.dumps(m,sort_keys=True))
