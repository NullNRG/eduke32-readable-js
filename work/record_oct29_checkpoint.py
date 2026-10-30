"""Compatibility entry point for the current services-aware checkpoint."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('record_services_checkpoint.py')),run_name='__main__')
