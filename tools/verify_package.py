#!/usr/bin/env python3
"""Verify the initial handoff payload before editing it."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'PACKAGE_MANIFEST.json').read_text(encoding='utf-8'))
failures=[]
for row in manifest['files']:
    path=ROOT/row['path']
    if not path.is_file():failures.append(row['path']+': missing');continue
    with path.open('rb') as stream:actual=hashlib.file_digest(stream,'sha256').hexdigest()
    if actual!=row['sha256']:failures.append(row['path']+': changed')
if failures:raise SystemExit('\n'.join(failures))
print(f"PASS: {len(manifest['files'])} handoff files match their SHA256s")
