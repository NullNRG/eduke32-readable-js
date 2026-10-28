from pathlib import Path
import shutil
root=Path('.')
for name in ('source_ast_to_js.py','source_byte_records.py','source_aggregate_runtime.mjs','source_pointer_runtime.mjs','source_first_global_link.py'):
 target=Path('work/record-storage-before')/name;target.parent.mkdir(parents=True,exist_ok=True)
 if not target.exists():shutil.copyfile(Path('tools')/name,target)
