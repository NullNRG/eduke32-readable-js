import json
import os
from pathlib import Path
import sys
import time

project = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project/'tools'))
from clang import cindex
import source_semantic_index as semantic

resource = semantic.extraction_resource_config(cindex)
commands = json.loads((project/'factory-output/compile_commands.json').read_text())
root = project/'factory-output/source-tree/eduke32-master'
os.chdir(root)
index = cindex.Index.create()
rows = []
for command in commands:
    if command['file'] not in {'source/imgui/src/imgui.cpp', 'source/imgui/src/imgui_draw.cpp',
                               'source/imgui/src/imgui_tables.cpp', 'source/imgui/src/imgui_widgets.cpp'}:
        continue
    start = time.monotonic()
    unit = index.parse(command['file'],args=semantic.captured_args(command)+['-resource-dir', resource['resource_dir']])
    errors = [{'severity':d.severity,'spelling':d.spelling} for d in unit.diagnostics if d.severity>=3]
    rows.append({'source':command['file'],'errors':errors,'elapsed_seconds':time.monotonic()-start})
    print(command['file'], len(errors), 'errors', flush=True)
report = {'resources':resource,'translation_units':rows,
          'all_four_original_units_parse_without_errors':len(rows)==4 and all(not row['errors'] for row in rows),
          'does_not_establish_semantic_extraction_or_gameplay':True}
(project/'reports/semantic-original-imgui-resource-probe.json').write_text(json.dumps(report,indent=2))
assert report['all_four_original_units_parse_without_errors'],report
