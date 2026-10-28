#!/usr/bin/env python3
"""One canonical audit of source-first output vs real Make-selected source units."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
commands=json.loads((ROOT/'factory-output/compile_commands.json').read_text())
main=ROOT/'factory-output/source-first/selected'
files=[]
for c in commands:
    src=c['file'];module=main/(src+'.mjs');manifest=module.with_suffix('.manifest.json')
    entry={'source':src,'make_selected':True,'source_first_status':'not_attempted'}
    if manifest.is_file():
        x=json.loads(manifest.read_text());entry.update(source_first_status=('partial' if x['blocked'] else 'emitted'),
            emitted_definitions=x['emitted'],blocked_definitions=x['blocked'],module=str(module.relative_to(ROOT)),manifest=str(manifest.relative_to(ROOT)))
    files.append(entry)
summary={'format':'eduke-source-first-audit/1','selected_translation_units':len(files),'selected_unique':len({x['source'] for x in files}),
         'attempted_translation_units':sum(x['source_first_status']!='not_attempted' for x in files),
         'not_attempted_translation_units':sum(x['source_first_status']=='not_attempted' for x in files),
         'source_first_emitted_definitions':sum(x.get('emitted_definitions',0) for x in files),
         'source_first_blocked_definitions_in_attempted_filters':sum(x.get('blocked_definitions',0) for x in files),
         'note':'Definitions in filtered units are only those selected by AST filters. Additional units use full-file AST discovery; no game boot is verified.',
         'legacy_llvm_output_is_not_readable_source':True,'sources':files}
path=main/'selected-source-audit.json';path.write_text(json.dumps(summary,indent=2));print(json.dumps({k:v for k,v in summary.items() if k!='sources'},indent=2))
