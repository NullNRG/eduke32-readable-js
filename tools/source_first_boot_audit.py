#!/usr/bin/env python3
"""Strict, evidence-based bootstrap dependency audit for original Clang sources.

Reads the completed historical project manifests and fresh, narrowly filtered
source-AST manifests. It never invents platform implementations, substitutes a
synthetic boot sequence, or treats dependency enumeration as executable code.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict, deque
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]

def read(path):
    return json.loads(path.read_text()) if path.is_file() else None

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--entry',default='app_main',help='original source entry symbol')
    parser.add_argument('--probe',action='append',default=[],help='also cold-recheck this source symbol')
    parser.add_argument('--source-root',type=Path,default=ROOT/'factory-output/source-tree/eduke32-master')
    parser.add_argument('--manifest-root',type=Path,default=ROOT/'factory-output/source-first/globally-linked')
    parser.add_argument('--historical-manifest-root',type=Path,
        help='Explicit diagnostic ownership index only; never imported as current executable code')
    parser.add_argument('--compile-commands',type=Path,default=ROOT/'factory-output/compile_commands.json',
                        help='Selected build profile used for inventory and every cold probe')
    parser.add_argument('--out',type=Path,default=ROOT/'factory-output/source-first/boot-audit.json')
    parser.add_argument('--depth',type=int,default=2)
    parser.add_argument('--fast-current-only',action='store_true',help='boot gate: use freshly compiled manifests without expensive filtered Clang reprobes')
    args=parser.parse_args()
    if not 0<=args.depth<=5:parser.error('depth must be 0..5')
    root=args.source_root.resolve();manifest_root=args.manifest_root.resolve()
    commands=args.compile_commands.resolve()
    source_units={row['file'] for row in (read(commands) or [])}
    old={}
    for path in sorted(manifest_root.rglob('*.manifest.json')):
        doc=read(path)
        if not doc or doc.get('source') not in source_units:continue
        old[doc['source']]=doc
    owners=defaultdict(list)
    def index(modules):
        index=defaultdict(list)
        for source,doc in modules.items():
            for definition in doc.get('definitions',[]):
                if definition.get('kind') in ('FunctionDecl','VarDecl','CXXRecordDecl'):
                    for name in {definition.get('name'),definition.get('source_name')} - {None}:
                        index[name].append((source,definition))
        return index
    current_linked_manifest_count=len(old)
    owners=index(old)
    # The *current* partial build may not contain the boot entry yet. Locate
    # its original source via the older complete inventory, but do NOT import
    # old manifests into current build coverage or mark them linked/emitted.
    complete_manifests=(args.historical_manifest_root or manifest_root).resolve()
    previous={}
    if manifest_root!=complete_manifests.resolve():
        for path in sorted(complete_manifests.rglob('*.manifest.json')):
            doc=read(path)
            if doc and doc.get('source') in source_units:previous[doc['source']]=doc
    previous_owners=index(previous)
    entry_linked=any(definition['status']=='source-first'
                     for _,definition in owners.get(args.entry,[]))
    requested=list(dict.fromkeys([args.entry,*args.probe]))
    refreshed={};probe_errors=[];not_cold_probed=[]
    with tempfile.TemporaryDirectory(prefix='sourcefirst_boot_') as directory:
        directory=Path(directory)
        for symbol in requested:
            matches=owners.get(symbol,[])
            if args.fast_current_only:
                # A current emitted OR blocked manifest already came from this
                # compiler run. Re-running filtered Clang AST loses headers,
                # misreports the current blocker and makes every build slow.
                if not matches:
                    not_cold_probed.append({'symbol':symbol,'historical_owners':sorted(
                        {owner for owner,_ in previous_owners.get(symbol,[])})})
                continue
            discovered_from='current compiled manifest'
            if not matches:
                matches=previous_owners.get(symbol,[])
                discovered_from='historical owner index (location only)'
            original_sources=sorted({source for source,_ in matches})
            if len(original_sources)!=1 or len(matches)!=1:
                probe_errors.append({'symbol':symbol,'issue':'ambiguous or unknown source ownership','owners':original_sources})
                continue
            source=original_sources[0]
            command=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),
                     '--root',str(root),'--source',source,'--compile-commands',str(commands),
                     '--filter',symbol,'--out-dir',str(directory)]
            try:
                result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,timeout=120)
                if result.returncode:
                    raise RuntimeError((result.stderr+'\n'+result.stdout)[-1100:])
                manifest=read((directory/(source+'.mjs')).with_suffix('.manifest.json'))
                if not manifest:raise RuntimeError('Clang did not produce a manifest')
                found=[d for d in manifest['definitions'] if d.get('source_name',d['name'])==symbol]
                if not found:raise RuntimeError('Clang produced no exact original declaration for '+symbol)
                # Every cold filtered probe is diagnostic-only even when the
                # source also exists in the current linked inventory. Never
                # upgrade a freshly probed definition into a linked export.
                for entry in found:
                    entry['probe_only_not_linked']=True
                    entry['source_discovery']=discovered_from
                refreshed[(source,symbol)]=found
            except (OSError,subprocess.TimeoutExpired,RuntimeError) as error:
                probe_errors.append({'symbol':symbol,'source':source,'issue':str(error)})
    # Historical diagnostics remain explicitly identified as historical. New
    # source probes override only their exact function, not its entire TU.
    for (source,symbol),rows in refreshed.items():
        existing=old.get(source,{}).get('definitions',[])
        old[source]={**old.get(source,{}),'definitions':[
            row for row in existing if row.get('source_name',row.get('name'))!=symbol]+rows}
    owners=index(old)
    reached={};queue=deque([(args.entry,0)])
    source_unknown=set();ambiguous={}
    while queue:
        name,depth=queue.popleft()
        if name in reached:continue
        matching=owners.get(name,[])
        if len(matching)!=1:
            if matching:ambiguous[name]=sorted({source for source,_ in matching})
            else:source_unknown.add(name)
            continue
        source,definition=matching[0]
        refs=definition.get('source_references')
        if refs is None:
            refs=definition.get('unresolved_references') or definition.get('external_imports') or []
        refs=sorted(set(refs)-{name})
        reached[name]={'depth':depth,'source':source,'status':definition['status'],
                       'probe_only_not_linked':bool(definition.get('probe_only_not_linked')), 
                       'reason':definition.get('reason'),'referenced_symbols':refs,
                       'reference_coverage':'fresh Clang AST' if (source,name) in refreshed
                       else ('partial historical manifest' if 'source_references' not in definition else 'Clang AST')}
        if depth<args.depth:
            queue.extend((ref,depth+1) for ref in refs if ref not in reached)
    blocked=[{'symbol':name,**value} for name,value in reached.items() if value['status']!='source-first']
    blockers=Counter((r['reason'] or 'unknown').split(':',1)[0] for r in blocked)
    grp=[]
    for path in sorted((ROOT/'input-data').glob('*.GRP')):
        with path.open('rb') as f:header=f.read(16)
        grp.append({'name':path.name,'bytes':path.stat().st_size,
                    'ken_silverman_grp_header':header[:12]==b'KenSilverman',
                    'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    entry_record=reached.get(args.entry)
    summary={'entry':args.entry,'depth_limit':args.depth,
             'compile_commands_sha256':hashlib.sha256(commands.read_bytes()).hexdigest(),
             'original_source_units':len(source_units),'current_linked_manifests':current_linked_manifest_count,
             'historical_owner_manifests_for_diagnostics':len(previous),
             'fresh_probed':sorted(set(s for _,s in refreshed)),
             'graph_nodes_with_known_owners':len(reached),
             'graph_blocked':len(blocked),
             'graph_emitted':sum(v['status']=='source-first' and not v.get('probe_only_not_linked') for v in reached.values()),
             'graph_diagnostic_probe_only':sum(v.get('probe_only_not_linked',False) for v in reached.values()),
             'no_proven_owner':len(source_unknown),'ambiguous_ownership':len(ambiguous),
             'boot_entry_has_emitted_js':entry_linked,
             'boot_entry_probe_is_not_linked':bool(entry_record and entry_record.get('probe_only_not_linked')), 
             'original_browser_boot_verified':False,
             'warning':'Graph is partial: historical manifests often lack complete references for blocked definitions.'}
    report={'format':'source-first-boot-audit/1','summary':summary,'entry_definition':entry_record,
            'top_blocker_categories':blockers.most_common(25),
            'blocked_definitions':blocked,'unknown_owner_symbols':sorted(source_unknown),
            'ambiguous_symbols':ambiguous,'fresh_probe_failures':probe_errors,'skipped_diagnostic_probes':not_cold_probed,'fast_current_only':args.fast_current_only,
            'game_data_archives':grp,'reachable':reached,
            'strict_boot_gate':'INCOMPLETE'}
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(report,indent=2,sort_keys=True))
    print(json.dumps({'summary':summary,'top_blocker_categories':blockers.most_common(12),
                      'fresh_probe_failures':probe_errors,'skipped_diagnostic_probes':not_cold_probed,'fast_current_only':args.fast_current_only,'report':str(args.out)},indent=2))
    # Missing gameplay evidence is ALWAYS a failing boot gate even if a later
    # compiler pass emits an entry function; this utility is an audit only.
    return 2

if __name__=='__main__':sys.exit(main())
