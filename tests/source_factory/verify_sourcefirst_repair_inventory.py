#!/usr/bin/env python3
"""Targeted repair never erases the complete original Make source selection."""
import os,sys
from pathlib import Path
sys.path.insert(0,os.environ.get('EDUKE_TEST_COMPILER_DIR') or str(Path(__file__).resolve().parents[2]/'tools'))
from source_first_automate import make_build_inventory
sources=[{'source':f'unit{i}.cpp','bytes':8} for i in range(156)]
repair=[sources[12]]
doc=make_build_inventory(sources,repair,156,[],[],True)
assert doc['selected_sources']==sources
assert doc['repair_attempted_subset']==repair
assert len(doc['all_sources'])==156
sample=make_build_inventory(sources,sources[:2],156,[],[],False)
assert sample['selected_sources']==sources[:2]
assert sample['repair_attempted_subset']==[]
print('PASS repair inventory: full original selection preserved, retry subset kept separate')
