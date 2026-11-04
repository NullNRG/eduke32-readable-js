"""Run the SDL controller-database memory/ownership boundary regression."""
import subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2]
subprocess.run(['node','--test',str(root/'tests/source_factory/source_sdl_controller_database.test.mjs')],cwd=root,check=True)
