#!/usr/bin/env python3
"""Fail-closed original-source complete dependency scheduling and manifest-only sweep."""
import sys
from pathlib import Path
TOOLS=Path(__file__).resolve().parents[2]/'tools'
sys.path.insert(0,str(TOOLS))
from source_first_global_link import original_unlinked_dependencies,eligible_link_retries,rank_retry_units
from source_first_missing_map import sweep_units

def row(deps,short=True):
    return {'name':'caller','source_name':'caller','kind':'FunctionDecl','status':'blocked',
        'reason':'unlinked identifiers: '+', '.join(deps[:12]),
        'unresolved_references':deps}

names=[f'external_{i}' for i in range(13)]
unit={'file.cpp':{'manifest':{'source':'file.cpp','definitions':[row(names)],'imports':[]}}}
owners={name:'owner.cpp' for name in names[:-1]}
assert original_unlinked_dependencies(row(names))==sorted(names)
assert eligible_link_retries(unit,owners,{})==[], '13th reference must not be ignored'
owners[names[-1]]='owner.cpp'
assert eligible_link_retries(unit,owners,{})==['file.cpp']
assert eligible_link_retries(unit,owners,{names[-1]:['owner.cpp','other.cpp']})==[]
assert rank_retry_units(unit,['file.cpp'],owners,{})==['file.cpp']
legacy=row(names);legacy.pop('unresolved_references')
assert original_unlinked_dependencies(legacy)==[], 'truncated old manifest cannot prove readiness'
legacy['reason']='unlinked identifiers: external_0, external_1'
assert original_unlinked_dependencies(legacy)==['external_0','external_1']
report=sweep_units({'file.cpp':unit['file.cpp']['manifest']})
assert report['blocked_definition_entries']==1
assert report['distinct_referenced_symbols']==13
assert report['reference_resolution_occurrences']['unowned-source-provider']==13
print('PASS: exact 13-reference AST dependencies, ambiguity gates, historical truncation refusal, manifest-only dependency frontier')
