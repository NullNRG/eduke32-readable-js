"""Compile the original cache class and all its source-defined methods together."""
import subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as c
stage=c.BASE/'cache-method-recovery'
command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',c.SOURCE,'--source','source/build/src/cache1d.cpp','--compile-commands',c.COMMANDS,'--out-dir',stage,'--filter','cache1d,g_cache','--dependency-closure','--header-dependency-closure','--enum-closure','--require-record-layouts','--project-symbols',c.OUT/'browser-combined-symbol-owners.json','--import-root',c.OUT,'--ast-cache-dir',c.CACHE]
raise SystemExit(subprocess.run(list(map(str,command)),cwd=ROOT).returncode)
