#!/usr/bin/env python3
"""Root-cause collector and scheduling regressions (no invented source stubs)."""
import json
from pathlib import Path
import sys
import tempfile
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from source_first_missing_map import sweep, family
from source_first_global_link import rank_retry_units


def unit(folder,src,entries):
    target=folder/(src+'.mjs.manifest.json');target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps({'source':src,'definitions':entries}))

def defn(name,status,reason='',deps=()):
    row={'name':name,'status':status}
    if reason:row['reason']=reason
    if deps:row['unresolved_references']=list(deps)
    return row

with tempfile.TemporaryDirectory() as temp:
    p=Path(temp)
    unit(p,'a.cpp',[defn('a','blocked','unlinked identifiers: b, c',('b','c')),
                    defn('operator_plus','blocked','CXXOperatorCallExpr')])
    unit(p,'b.cpp',[defn('b','blocked','unlinked identifiers: a',('a',))])
    unit(p,'c.cpp',[defn('c','source-first')])
    unit(p,'d.cpp',[defn('d','blocked','unlinked identifiers: b, outside',('b','outside'))])
    r=sweep(p)
    assert r['audited_source_units']==4,r
    assert r['blocked_definition_entries']==4,r
    assert r['emitted_definition_entries']==1,r
    assert r['failure_families']['dependency/linkage']==3,r
    assert r['failure_families']['cpp-operators']==1,r
    assert r['cyclic_blocked_dependency_components']==1,r
    assert r['cyclic_blocked_definitions']==2,r
    references={x['name']:x for x in r['high_fanout_missing_providers']}
    assert references['b']['blocked_callers']==2,references
    assert references['outside']['provider_resolution']=='none-in-audited-definitions'
    units={src:{'manifest':json.loads((p/(src+'.mjs.manifest.json')).read_text())}
           for src in ('a.cpp','b.cpp','c.cpp','d.cpp')}
    order=rank_retry_units(units,['d.cpp','a.cpp','b.cpp'],{'a':'a.cpp','b':'b.cpp'},set())
    assert order[0]=='b.cpp',order
root=Path(__file__).resolve().parents[2]
real=root/'factory-output/source-first/globally-linked'
if real.exists():
    r=sweep(real,real/'global-recovery.json')
    assert r['historical_counts_match'],r
    assert r['audited_source_units']==156,r
    assert r['blocked_definition_entries']==5065,r
    assert len(r['all_blocked_definitions'])==5065,r
    print('PASS: complete historical source blocker audit: 156 units / 5065 blockers')
print('PASS: grouped failure families, provider fanout, SCCs and retry order')
