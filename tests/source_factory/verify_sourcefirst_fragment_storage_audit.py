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
print('PASS: actual hidden original state is audited independently of selected re-exports')
