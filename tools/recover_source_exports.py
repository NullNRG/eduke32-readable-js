#!/usr/bin/env python3
"""Preserve original generated source exports when promoting a partial TU.

Only source modules with NO mutable overlapping bindings may be stitched by
live ES named re-exports. Overlapping C++ global storage requires an integrated
recompile and is explicitly blocked. A legacy shard is internal implementation
of ONE canonical browser module, never an alternate user-facing build.
"""
import argparse, json, re, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'factory-output/source-first/force-recovered/source'
TARGET=ROOT/'factory-output/source-first/browser-target/source'
DECL=re.compile(r'^export\s+(?:async\s+)?(function|let|const|class|var)\s+([\w$]+)',re.M)
MARK='// SOURCEFACTORY_VERIFIED_REEXPORT_BEGIN'

def declared(text):return {name:kind for kind,name in DECL.findall(text)}

def stitch(src, base=BASE, target=TARGET):
    rel=src.relative_to(target);origin=base/rel
    if not origin.is_file():return {'module':rel.as_posix(),'result':'no-baseline'}
    oldtext=origin.read_text();newtext=src.read_text()
    if MARK in newtext:newtext=newtext.split(MARK)[0].rstrip()+'\n'
    old=declared(oldtext);new=declared(newtext)
    lost=sorted(old.keys()-new.keys())
    common=old.keys()&new.keys()
    unsafe=sorted(name for name in common if old[name] in ('let','var') or new[name] in ('let','var'))
    if not lost:return {'module':rel.as_posix(),'result':'no-loss','preserved':0}
    if unsafe:return {'module':rel.as_posix(),'result':'blocked-shared-mutable-storage',
                      'missing':len(lost),'overlappingMutable':unsafe[:16]}
    preserved=src.with_name('_source_legacy_'+src.name)
    if preserved.name==src.name:raise ValueError('Invalid implementation shard name')
    # Original file retains original relative imports, original statement
    # execution and live exported bindings. Never create JS constant snapshots.
    shutil.copyfile(origin,preserved)
    prefix='\n'+MARK+'\n'
    for start in range(0,len(lost),50):
        names=lost[start:start+50]
        prefix+='export { '+', '.join(names)+' } from "./'+preserved.name+'";\n'
    src.write_text(newtext+prefix)
    for file in (src,preserved):
        subprocess.run(['node','--check',str(file)],check=True,capture_output=True,text=True)
    return {'module':rel.as_posix(),'result':'live-reexports-added',
            'preserved':len(lost),'implementationShard':preserved.name,'overlappingMutable':[]}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--target',type=Path,default=TARGET)
    args=ap.parse_args()
    report=[stitch(f,base=BASE,target=args.target) for f in sorted(args.target.rglob('*.mjs'))
            if not f.name.startswith('_source_legacy_')]
    restored=sum(x.get('preserved',0) for x in report)
    destination=ROOT/'reports/browser-target/export-preservation.json';destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(json.dumps({'format':'sourcefirst-export-preservation/1','modules':report,
                    'restoredSourceExports':restored,'unresolvedModules':[x for x in report if x['result']=='blocked-shared-mutable-storage'],
                    'originalGameplayVerified':False},indent=2)+'\n')
    print(json.dumps({'restoredSourceExports':restored,
                      'blockedModules':[x['module'] for x in report if x['result']=='blocked-shared-mutable-storage']}))
if __name__=='__main__':main()
