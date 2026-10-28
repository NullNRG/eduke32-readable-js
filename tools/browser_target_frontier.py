#!/usr/bin/env python3
"""Audit historical source manifests for browser-host-substitutable SDL dependencies.

Figures are candidate dependency edges, NOT recovered or playable functions.
Only source-backed SDL names implemented in the actual runtime are counted.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from browser_target_abi import ROOT, source_symbols

def audit(manifest_root: Path) -> dict:
    sdl=set(source_symbols(ROOT/'runtime/sdl_browser.mjs'))
    exact=[];partial=[];other=[]; total=0
    for path in sorted(manifest_root.rglob('*.manifest.json')):
        info=json.loads(path.read_text());total+=1
        for row in info.get('definitions',[]):
            if row.get('status')!='blocked':continue
            refs=set(row.get('unresolved_references') or [])
            hits=refs & sdl
            if not hits:continue
            record={'source':info.get('source'),'function':row.get('name'),
                    'browser_providers':sorted(hits),'non_browser_references':sorted(refs-hits),
                    'still_blocked':True}
            (exact if refs==hits else partial).append(record)
    entry_path=manifest_root/'source/duke3d/src/game.cpp.manifest.json'
    entry_doc=json.loads(entry_path.read_text())
    entries=[r for r in entry_doc['definitions'] if r.get('name')=='app_main']
    if len(entries)!=1:raise RuntimeError('Need exactly one original-source app_main declaration')
    entry=entries[0];direct=set(entry.get('unresolved_references') or [])
    return {'format':'eduke32-browser-target-frontier/1','snapshot':str(manifest_root),
            'manifest_count':total,'implemented_sdl_browser_symbols':len(sdl),
            'blocked_functions_with_only_sdl_missing':len(exact),
            'blocked_functions_with_mixed_sdl_missing':len(partial),
            'blocked_functions_potentially_affected':len(exact)+len(partial),
            'app_main_status':entry['status'], 'app_main_unresolved_direct':len(direct),
            'app_main_direct_browser_sdl_references':len(direct & sdl),
            'original_gameplay_verified':False,
            'warning':'Historical manifest dependency counts only; recompile and validate each function to mark recovered.',
            'sdl_only_functions':exact,'sdl_plus_other_functions':partial}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',type=Path,default=ROOT/'factory-output/source-first/force-recovered')
    p.add_argument('--out',type=Path,default=ROOT/'reports/browser-target/substitution-frontier.json')
    a=p.parse_args();result=audit(a.root)
    a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ['manifest_count','implemented_sdl_browser_symbols','blocked_functions_with_only_sdl_missing','blocked_functions_with_mixed_sdl_missing','app_main_status','app_main_unresolved_direct','app_main_direct_browser_sdl_references']},indent=2))

if __name__=='__main__':main()
