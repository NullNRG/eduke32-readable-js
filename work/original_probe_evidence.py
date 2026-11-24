"""Bind native/browser component comparisons to the actual loaded JS inputs."""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from source_runtime_helpers import runtime_fingerprints


def current_inputs():
    profile = json.loads((ROOT / 'tools/browser_classic_profile.json').read_text())
    modules = ROOT / profile['boot_module_root']
    return {
        'artifacts': {path.relative_to(ROOT).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
                      for path in sorted(modules.rglob('*.mjs'))},
        'runtime_artifacts': runtime_fingerprints(ROOT),
    }


def unchanged_inputs(before):
    if current_inputs() != before:
        raise RuntimeError('Original browser component changed during native/browser verification')
    return before
