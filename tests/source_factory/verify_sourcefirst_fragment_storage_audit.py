"""Find unselected private-state copies in actual legacy source fragments."""
import json,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_fragment_storage import audit
with tempfile.TemporaryDirectory(prefix='fragment-storage-audit-') as temporary:
    root=Path(temporary)
    (root/'unit.cpp.mjs').write_text('export let original_state=7;\nexport {step} from "./fragment.mjs";\n')
    (root/'fragment.mjs').write_text('export let original_state=7;\nexport function step(){return ++original_state;}\n')
    (root/'unit.cpp.manifest.json').write_text(json.dumps({'source':'unit.cpp','module_fragments':[
        {'module':'fragment.mjs','exports':['step']}]}))
    result=audit(root)
    assert result==[{'source':'unit.cpp','duplicate_storage':{'original_state':['unit.cpp.mjs','fragment.mjs']}}],result
    (root/'fragment.mjs').write_text('export function step(){return 9;}\n')
    assert audit(root)==[]

    proof={'translation_unit':'unit.cpp','source_header':'state.h','source_offset':12}
    row={'source_name':'original_state','status':'source-first','kind':'VarDecl',
         'header_global_definition':proof}
    (root/'fragment.mjs').write_text('export let legacy_original_state=7;\n')
    (root/'unit.cpp.manifest.json').write_text(json.dumps({'source':'unit.cpp','module_fragments':[
        {'module':'fragment.mjs','exports':['legacy_original_state']}],
        'definitions':[dict(row,name='original_state'),dict(row,name='legacy_original_state')]}))
    result=audit(root)
    assert result==[{'source':'unit.cpp','duplicate_storage':{},'duplicate_header_storage':[
        {'header':'state.h','offset':12,'bindings':['legacy_original_state','original_state']}]}],result
print('PASS: hidden storage and distinct JavaScript names for the same native declaration are rejected')
