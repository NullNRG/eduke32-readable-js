"""Regenerate the exact console dependency fragment after shared helper fixes."""
import hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
modules=ROOT/profile['boot_module_root'];source='source/build/src/osd.cpp'
owner=json.loads((modules/(source+'.manifest.json')).read_text())
choices=[row for row in owner.get('module_fragments',[]) if any(name.startswith('__source_byte_method_push_') for name in row['exports'])]
assert len(choices)==1,choices
previous=choices[0];exports=previous['exports']
assert hashlib.sha256((modules/previous['module']).read_bytes()).hexdigest()==previous['sha256']
stage=ROOT/'work/nov02-original-atomic-fragment';stage.mkdir(exist_ok=True)
index=json.loads((modules/'browser-combined-symbol-owners.json').read_text())
index={name:provider for name,provider in index.items() if name not in exports}
symbols=stage/'owners.json';symbols.write_text(json.dumps(index,indent=2)+'\n')
command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',ROOT/profile['prepared_source_root'],
    '--source',source,'--compile-commands',ROOT/profile['derived_commands'],'--out-dir',stage/'out',
    '--project-symbols',symbols,'--import-root',modules,'--dependency-closure','--header-dependency-closure',
    '--header-inlines','--enum-closure','--require-record-layouts','--ast-cache-dir',
    ROOT/'work/ast/f3f73c89e7558265637b0512990774fe2bdcc6ec733701b88b4869ed0334ea68/shard-00',
    '--filter','OSD_Init,OSD_RegisterCvar,OSD_RegisterFunction,OSD_Puts','--exact-filter']
subprocess.run(list(map(str,command)),cwd=ROOT,check=True)
manifest=stage/'out'/(source+'.manifest.json');doc=json.loads(manifest.read_text())
actual={row['name'] for row in doc['definitions'] if row['status']=='source-first'}
assert set(exports)<=actual,{'required':exports,'missing':sorted(set(exports)-actual)}
subprocess.run(list(map(str,[sys.executable,ROOT/'tools/install_verified_fragment.py',
    '--manifest',manifest,'--target',modules,'--exports',*exports,
    '--replace-fragment-sha256',previous['sha256'],'--report',ROOT/'reports/nov02-original-atomic-fragment-refresh.json'])),cwd=ROOT,check=True)
