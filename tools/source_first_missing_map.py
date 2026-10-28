#!/usr/bin/env python3
"""Map *every* audited source-first blocker and its C/C++ dependency roots.

Works from original Clang-derived per-translation-unit manifests. Never
turns an unowned name into a JS stub or claims a previously audited artifact
was freshly compiled. Maps all definitions, shared missing symbols, SCCs and
recovery workgroups in a single deterministic sweep.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict, deque
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'factory-output/source-first/globally-linked'
SEMANTICS=[
 ('cpp-operators',r'^CXXOperatorCallExpr$'),
 ('cpp-overloads',r'^(?:ambiguous/overloaded source definitions|ambiguous C\+\+ overload)'),
 ('member-access',r'^nonidentifier member$'),
 ('record-layout',r'^(?:sizeof/alignof record layout|aggregate copy needs exact Clang layout)'),
 ('pointer-alias',r'^(?:pointer arithmetic/comparison|address-of requires a stable lvalue|class pointer/reference field)'),
 ('default-arguments',r'^CXXDefaultArgExpr$'),
 ('control-flow',r'^source control flow:'),
 ('range-iteration',r'^(?:C\+\+ range iteration|mutable C\+\+ range reference)'),
 ('aggregate-array',r'^(?:global array initializer|unsupported global array element type|string initializer in non-character array|unsupported nested aggregate)'),
 ('object-lifetime',r'^(?:nontrivial C\+\+ temporary cleanup|nontrivial C\+\+ destructor|constructor type |CXXTemporaryObjectExpr|CXXConstructExpr|CXXNewExpr)'),
 ('builtins-and-abi',r'^(?:builtin __builtin_|OffsetOfExpr)'),
 ('unhandled-ast',r'^(?:DeclStmt|statement |ImplicitValueInitExpr|while shape)'),
 ('static-initialization',r'^nonconstant function-static initializer'),
]


def family(reason: str)->str:
    if reason.startswith('unlinked identifiers:'):return 'dependency/linkage'
    for key,pat in SEMANTICS:
        if re.match(pat,reason):return key
    return 'other/'+reason.split(':',1)[0][:80]


def load_units(root:Path, compile_report=None):
    # Batch directories from older attempts are deliberately retained for
    # checkpoints. Only the current report owns the active batch manifests.
    # A flat linked tree still rejects duplicate source ownership outright.
    owned_report=root/'recovery-report.json'
    if compile_report is not None and owned_report.is_file() and Path(compile_report).resolve()==owned_report.resolve():
        from source_first_global_link import gather_batches
        _,batches=gather_batches(root)
        return {source:item['manifest'] for source,item in batches.items()}
    units={}
    for path in sorted(root.rglob('*.manifest.json')):
        data=json.loads(path.read_text())
        source=data.get('source')
        if not source:continue
        if source in units:raise ValueError('duplicate source ownership manifests: '+source)
        units[source]=data
    return units


def dependency_names(row):
    # The reasons are truncated for display; the Clang-derived unlinked
    # references list, when present, is complete and source-owned.
    if row.get('unresolved_references'):
        return sorted(set(row['unresolved_references']))
    if row.get('reason','').startswith('unlinked identifiers:'):
        return sorted(set(x.strip() for x in row['reason'].split(':',1)[1].split(',') if x.strip()))
    return []


def components(graph):
    # Iterative Kosaraju: no stack overflow on large source dependency trees.
    seen=set();finish=[]
    for entry in sorted(graph):
        if entry in seen:continue
        seen.add(entry); stack=[(entry,iter(sorted(graph[entry])))]
        while stack:
            n,it=stack[-1]
            child=next(it,None)
            if child is None:
                finish.append(n);stack.pop();continue
            if child not in seen:
                seen.add(child);stack.append((child,iter(sorted(graph.get(child,())))))
    reverse=defaultdict(set)
    for n,children in graph.items():
        for child in children:reverse[child].add(n)
    seen.clear();out=[]
    for entry in reversed(finish):
        if entry in seen:continue
        group=[];queue=[entry];seen.add(entry)
        while queue:
            n=queue.pop();group.append(n)
            for child in sorted(reverse[n]):
                if child not in seen:
                    seen.add(child);queue.append(child)
        if len(group)>1 or (group and group[0] in graph.get(group[0],())):
            out.append(sorted(group))
    return sorted(out,key=lambda xs:(-len(xs),xs))


def sweep(source:Path,baseline:Path|None=None):
    return sweep_units(load_units(source),baseline)


def sweep_units(units,baseline:Path|None=None):
    names=defaultdict(list);rows={};emitted=set();blocked=set()
    for src,unit in sorted(units.items()):
        for ordinal,item in enumerate(unit['definitions']):
            name=item['name'];key=(src,name)
            if key in rows:
                # Overload/namespace clones are retained as independent AST
                # entries by their index. They cannot be silently merged.
                key=(src,name,ordinal)
            rows[key]=item
            names[name].append(key)
            (emitted if item['status']=='source-first' else blocked).add(key)
    graph={k:set() for k in blocked};missing=defaultdict(set);other=Counter();families=Counter();all_rows=[]
    every_ref=Counter();classifications=Counter();unique_missing=defaultdict(set)
    for key in sorted(blocked):
        row=rows[key];reason=row.get('reason','unknown');fam=family(reason)
        deps=[]
        for token in dependency_names(row):
            every_ref[token]+=1
            candidates=names.get(token,[])
            status=('unowned-source-provider' if not candidates else
                    'ambiguous-provider' if len(candidates)>1 else
                    'emitted-provider' if candidates[0] in emitted else 'blocked-provider')
            classifications[status]+=1;unique_missing[status].add(token)
            if status=='blocked-provider':graph[key].add(candidates[0])
            deps.append({'name':token,'resolution':status,
                         'providers':[{'source':p[0],'name':p[1],
                                      'status':rows[p]['status']} for p in candidates]})
            if status!='emitted-provider':missing[token].add(key)
        families[fam]+=1
        all_rows.append({'source':key[0],'name':key[1],'reason':reason,'family':fam,
                         'source_references':row.get('source_references',[]),
                         'unresolved':deps,'original_type':row.get('original_type'),
                         'line':row.get('line')})
    sccs=components(graph)
    # Cost/benefit ranking is exact for direct links. It is not a prediction
    # that this many definitions will become semantically compilable.
    groups=[]
    for fam,count in families.most_common():
        affected=sorted(set(r['source'] for r in all_rows if r['family']==fam))
        groups.append({'family':fam,'blocked_definitions':count,
                       'source_units':len(affected),'sources':affected})
    hot=[]
    for name,dependents in sorted(missing.items(),key=lambda kv:(-len(kv[1]),kv[0])):
        candidates=names.get(name,[])
        hot.append({'name':name,'blocked_callers':len(dependents),
                    'provider_resolution':('none-in-audited-definitions' if not candidates else
                      'multiple' if len(candidates)>1 else rows[candidates[0]]['status']),
                    'provider_sources':sorted({x[0] for x in candidates}),
                    'caller_sources':sorted({x[0] for x in dependents})})
    report={
        'format':'source-first-complete-missing-map/1',
        'measurement':'manifest inventory only, not fresh source compilation',
        'audited_source_units':len(units),
        'audited_definitions':len(rows),
        'emitted_definition_entries':len(emitted),
        'blocked_definition_entries':len(blocked),
        'failure_families':dict(families.most_common()),
        'dependency_reference_occurrences':sum(every_ref.values()),
        'distinct_referenced_symbols':len(every_ref),
        'reference_resolution_occurrences':dict(classifications),
        'unique_referenced_symbols_by_resolution':{k:len(v) for k,v in unique_missing.items()},
        'cyclic_blocked_dependency_components':len(sccs),
        'cyclic_blocked_definitions':sum(map(len,sccs)),
        'cyclic_components':[{'members':[{'source':k[0],'name':k[1]} for k in group]} for group in sccs],
        'family_workgroups':groups,
        'high_fanout_missing_providers':hot,
        'all_blocked_definitions':all_rows,
        'no_fabricated_implementations':True,'game_boot_verified':False,
    }
    if baseline and baseline.exists():
        base=json.loads(baseline.read_text())
        report['historical_report_blocked_definitions']=base.get('total_blocked_definitions')
        report['historical_counts_match']=(base.get('total_blocked_definitions')==len(blocked))
        report['baseline_source_units']=base.get('completed_source_units')
    return report


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--manifests',type=Path,default=BASE)
    ap.add_argument('--baseline',type=Path,default=BASE/'global-recovery.json')
    ap.add_argument('--out',type=Path,default=ROOT/'factory-output/source-first/missing-map')
    args=ap.parse_args();report=sweep(args.manifests,args.baseline)
    args.out.mkdir(parents=True,exist_ok=True)
    (args.out/'complete-blocker-catalog.json').write_text(json.dumps(report,indent=2,sort_keys=True))
    slim={k:v for k,v in report.items() if k not in ('all_blocked_definitions','cyclic_components','high_fanout_missing_providers','family_workgroups')}
    (args.out/'summary.json').write_text(json.dumps(slim,indent=2,sort_keys=True))
    (args.out/'shared-provider-roots.json').write_text(json.dumps(report['high_fanout_missing_providers'],indent=2))
    (args.out/'semantic-workgroups.json').write_text(json.dumps(report['family_workgroups'],indent=2))
    (args.out/'cyclic-dependencies.json').write_text(json.dumps(report['cyclic_components'],indent=2))
    print(json.dumps(slim,indent=2))
    return 0

if __name__=='__main__':sys.exit(main())
