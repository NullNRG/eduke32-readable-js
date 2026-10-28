#!/usr/bin/env python3
"""Read-only cross-batch source-first symbol index and dependency recovery audit.

Do not silently count a symbol available in another batch as already linked:
the original definition must be relowered and its ES import validated first.
"""
from __future__ import annotations
import argparse
from collections import defaultdict, Counter
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]

def audit(directory:Path):
    report=json.loads((directory/'recovery-report.json').read_text())
    rows=[x for x in report['batch_results'] if x['status']=='ok']
    owners=defaultdict(set); source_modules={}; blocked=[]
    for row in rows:
        manifest=directory/row['manifest']
        doc=json.loads(manifest.read_text())
        for unit in doc.get('units',[]):
            src=unit['source']
            module=manifest.parent/(src+'.mjs')
            # A unit with no emitted definitions must not become a phantom module.
            if unit['emitted']:
                if not module.is_file():raise ValueError(f'missing readable module: {module}')
                source_modules[src]=str(module.relative_to(directory))
            for problem in unit.get('blocked_reasons',[]):
                blocked.append({'source':src,'definition':problem['name'],'reason':problem['reason']})
            mf=module.with_suffix('.manifest.json')
            if not mf.exists():continue
            unit_manifest=json.loads(mf.read_text())
            for definition in unit_manifest.get('definitions',[]):
                if definition['status']=='source-first':
                    owners[definition['name']].add(src)
    duplicates={name:sorted(paths) for name,paths in owners.items() if len(paths)>1}
    recoverable=[]; ambiguous=[]; unknown=[]
    for item in blocked:
        if not item['reason'].startswith('unlinked identifiers:'):continue
        missing=[v.strip() for v in item['reason'].split(':',1)[1].split(',') if v.strip()]
        for symbol in missing:
            candidates=sorted(x for x in owners.get(symbol,set()) if x!=item['source'])
            row={'source':item['source'],'definition':item['definition'], 'symbol':symbol}
            if len(candidates)==1:
                recoverable.append({**row,'owner':candidates[0]})
            elif len(candidates)>1:
                ambiguous.append({**row,'owners':candidates})
            else:
                unknown.append(row)
    # Source discovery can be partial: cross-batch candidates are not proven
    # imports until source-body recompilation, namespace qualification and tests.
    return {
        'format':'source-first-global-audit/1',
        'make_selected_units':report['original_selected_units'],
        'attempted_units':report['attempted_units'],
        'verified_batch_units':report['verified_batch_units'],
        'module_count':len(source_modules),
        'unique_exported_symbols':len(owners),
        'ambiguous_exported_names':duplicates,
        'blocked_definitions':len(blocked),
        'cross_batch_import_candidates':recoverable,
        'ambiguous_cross_batch_dependencies':ambiguous,
        'unknown_dependency_references':unknown,
        'source_modules':dict(sorted(source_modules.items())),
        'source_first':True,
        'legacy_llvm_fallback':False,
        'whole_game_linked':False,
        'gameplay_verified':False,
        'note':'Read-only audited candidates, not finished imports; C++ internal linkage and ABI must be resolved before full linking.'
    }

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--directory',type=Path,default=ROOT/'factory-output/source-first/automatic')
    args=ap.parse_args()
    dest=args.directory.resolve()
    result=audit(dest)
    output=dest/'global-link-audit.json'
    output.write_text(json.dumps(result,indent=2))
    print(json.dumps({k:(len(v) if isinstance(v,(dict,list)) else v) for k,v in result.items() if k!='source_modules'},indent=2))
if __name__=='__main__':main()
