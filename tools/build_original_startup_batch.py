#!/usr/bin/env python3
"""Strictly source-derived, multi-translation-unit browser startup recovery.

Compiles original C++ declarations in batches with their same-TU globals and
header helpers. No missing function is stubbed. Only promotes complete source
exports after compiler, manifest, syntax, and pre-existing-export checks.
"""
import argparse, json, re, shutil, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'factory-output/source-first/browser-target'
STAGE = ROOT / 'factory-output/source-first/browser-startup-stage'
SRC = ROOT / 'factory-output/source-tree/eduke32-master'
COMPILER = ROOT / 'tools/source_ast_to_js.py'
PLAN = ROOT / 'tools/browser-startup-recovery-plan.json'
EXPORTED = re.compile(r'^export\s+(?:async\s+)?(?:function|let|const|class|var)\s+([\w$]+)',re.M)

def run(args, timeout=90):
    p=subprocess.run([str(x) for x in args],cwd=ROOT,capture_output=True,text=True,timeout=timeout)
    if p.returncode:raise RuntimeError(f'{args[0]} failed ({p.returncode}): {p.stdout[-900:]} {p.stderr[-1200:]}')
    return p

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--plan',type=Path,default=PLAN)
    ap.add_argument('--no-promote',action='store_true');options=ap.parse_args()
    plan=json.loads(options.plan.read_text());
    run([sys.executable,ROOT/'tools/browser_target_closure.py'])
    owners=json.loads((TARGET/'browser-combined-symbol-owners.json').read_text())
    results=[];promotions=[]
    # All preparation succeeds before one original generated source file changes.
    for unit in plan['units']:
        owner=unit['source'];wanted=set(unit['required_exports']); filters=unit['filters']
        if not all(re.fullmatch(r'[A-Za-z_$][\w$]*',n) for n in filters):raise ValueError('Unsafe AST filter')
        out=STAGE/owner.replace('/','_');out.mkdir(parents=True,exist_ok=True)
        symbols=out/'verified-owners.json';symbols.write_text(json.dumps({k:v for k,v in owners.items() if v!=owner},sort_keys=True)+'\n')
        run([sys.executable,COMPILER,'--root',SRC,'--source',owner,
             '--filter',','.join(filters),'--out-dir',out,'--project-symbols',symbols,
             '--enum-closure','--header-dependency-closure'])
        path=out/(owner+'.mjs');manifest=out/(owner+'.manifest.json')
        if not path.exists() or not manifest.exists():raise RuntimeError('No source output: '+owner)
        data=json.loads(manifest.read_text());rows={r['name']:r for r in data['definitions']}
        source=path.read_text();exports=set(EXPORTED.findall(source))
        prior=TARGET/(owner+'.mjs');old=set(EXPORTED.findall(prior.read_text())) if prior.exists() else set()
        # The previous source module may contain compiler-created internal
        # declarations with hashed names. Keep only its public definitions,
        # except any specific original exported globals already used by tests.
        required_existing=set(unit.get('preserve_exports',[]))
        if not required_existing.issubset(old) and prior.exists():
            raise RuntimeError('Configured original exports absent from previous build: '+str(required_existing-old))
        # A source-module refresh must never silently delete older exported
        # functions or mutable globals.  That turns a local compile pass into
        # a cross-module runtime regression even if the requested function
        # passes.  Require an explicit source-backed merge/recovery first.
        lost=old-exports
        if lost:
            raise RuntimeError(f'{owner}: regenerated module drops original exports: '
                               +', '.join(sorted(lost)))
        for name in wanted | required_existing:
            if name not in exports or (name in rows and rows[name].get('status')!='source-first'):
                raise RuntimeError(f'{owner}:{name} not safely emitted: {rows.get(name)}')
        for entry in data['imports']:
            imported,provider=entry['name'],entry['from']
            if owners.get(imported)!=provider:
                raise RuntimeError(f'Unverified import {imported} => {provider} in {owner}')
        run(['node','--check',path])
        promotions.append((path,manifest,TARGET/(owner+'.mjs'),TARGET/(owner+'.manifest.json')))
        results.append({'source':owner,'requested':sorted(wanted),'preserved':sorted(required_existing),
                        'emitted':sorted(exports),'imports':len(data['imports']),
                        'previous_export_count':len(old),'new_export_count':len(exports)})
    if not options.no_promote:
        for module,manifest,output,target_manifest in promotions:
            output.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(module,output);shutil.copy2(manifest,target_manifest)
        run([sys.executable,ROOT/'tools/browser_target_closure.py'])
        fresh=json.loads((TARGET/'browser-combined-symbol-owners.json').read_text())
        for row in results:
            for name in row['requested']:
                # C++ static/inline definitions have translation-unit linkage.
                # They must be emitted and usable by same-TU callers, but must
                # NOT appear as cross-module providers in the owner index.
                owner=row['source']
                manifest=json.loads((TARGET/(owner+'.manifest.json')).read_text())
                definition=next((x for x in manifest['definitions'] if x['name']==name),None)
                if definition and definition.get('linkage')=='internal':
                    if fresh.get(name)==owner:
                        raise RuntimeError(f'Internal original C++ function leaked into global linker: {name}')
                    continue
                if fresh.get(name)!=owner:
                    raise RuntimeError(f'Browser linker did not register real source: {name}')
    out={'format':'sourcefirst-browser-startup-batch/1','promoted':not options.no_promote,
         'units':results,'requested_export_total':sum(len(x['requested']) for x in results),
         'original_app_main_executed':False,'original_gameplay_verified':False}
    report=ROOT/'reports/browser-target/startup-source-batch.json'
    report.parent.mkdir(parents=True,exist_ok=True);report.write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps(out,indent=2))
if __name__=='__main__':main()
