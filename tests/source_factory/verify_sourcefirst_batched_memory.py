#!/usr/bin/env python3
"""Scheduling-only guarantees: no omitted source units, oversized AST alone."""
import importlib.util,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(root/'tools'))
spec=importlib.util.spec_from_file_location('autobatching',root/'tools/source_first_automate.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
un=[{'source':str(i),'bytes':n} for i,n in enumerate([12,23,240000,30000,40000,41000,970000,1200,50000,15000])]
batches=mod.bounded_batches(un,3,250000)
assert [u for batch in batches for u in batch]==un
assert all(len(batch)<=3 for batch in batches)
assert all(sum(u['bytes'] for u in batch)<=250000 or len(batch)==1 for batch in batches)
assert any(len(batch)==1 and batch[0]['bytes']>250000 for batch in batches)
assert all(batch for batch in batches)
print(f'PASS: {len(un)} original TUs partitioned into {len(batches)} resource-bounded batches without loss')
