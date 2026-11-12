"""Diagnostic only: compile the original LZ4 portable decode build option.

This does not modify the canonical commands, install code, or claim recovery
under the current profile. Native parity/configuration work is required first.
"""
import json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as c
stage=c.BASE/'lz4-portable-diagnostic';stage.mkdir(exist_ok=True)
providers=json.loads((c.OUT/'browser-combined-symbol-owners.json').read_text())
providers={name:source for name,source in providers.items() if source!='source/build/src/lz4.c'}
index=stage/'providers.json';index.write_text(json.dumps(providers,indent=2)+'\n')
command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',c.SOURCE,'--source','source/build/src/lz4.c','--compile-commands',c.COMMANDS,'--out-dir',stage,'--dependency-closure','--header-dependency-closure','--enum-closure','--require-record-layouts','--project-symbols',index,'--import-root',c.OUT,'--ast-cache-dir',c.CACHE,'--extra=-DLZ4_FAST_DEC_LOOP=0']
raise SystemExit(subprocess.run(list(map(str,command)),cwd=ROOT).returncode)
