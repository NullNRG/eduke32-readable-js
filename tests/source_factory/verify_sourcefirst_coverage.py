"""The all-units compilation gate never confuses inventory or source selection with a completed compile."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from source_first_coverage_gate import audit
files={'metrics':{'archive_extraction_errors':0,'all_archived_source_files_examined':3,'original_translation_candidates_not_selected_by_make':1,'make_selected_units':2},'all_eduke_source_entries':[{'path':'a.cpp'},{'path':'b.cpp'},{'path':'opt.cpp'}],'generated_source_with_verified_make_rule':[]}
inv={'all_sources':[{'source':'a.cpp'},{'source':'b.cpp'}],'selected_sources':[{'source':'a.cpp'},{'source':'b.cpp'}],'missing_generated_sources':[],'recovered_make_sources':[]}
partial={'batch_results':[{'sources':['a.cpp'],'status':'ok'}]}
assert not audit(files,inv,partial)['all_make_selected_translation_units_compiled']
assert audit(files,inv,partial)['scheduled_but_not_attempted']==['b.cpp']
full={'batch_results':[{'sources':['a.cpp'],'status':'ok'},{'sources':['b.cpp'],'status':'ok'}]}
assert audit(files,inv,full)['all_make_selected_translation_units_compiled']
full['batch_results'].append({'sources':['a.cpp'],'status':'ok'})
assert not audit(files,inv,full)['all_make_selected_translation_units_compiled']
full['batch_results'].pop();full['batch_results'].append({'sources':['evil.cpp'],'status':'ok'})
assert not audit(files,inv,full)['all_make_selected_translation_units_compiled']
print('PASS all-files coverage gate: pending, successful, duplicate, unknown source')
