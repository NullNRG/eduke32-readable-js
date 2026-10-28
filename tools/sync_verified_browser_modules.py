#!/usr/bin/env python3
"""Assemble one canonical browser-target module tree from source-first output.

Never overwrite promoted source modules; copy only verified original-source
modules absent from the target. This makes existing cross-TU imports physically
available without synthesizing a symbol, or changing original source behavior.
"""
import json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'factory-output/source-first/force-recovered/source'
TARGET=ROOT/'factory-output/source-first/browser-target/source'

def run():
    copied=[];preserved=[];missing=[]
    for original in sorted(BASE.rglob('*.mjs')):
        rel=original.relative_to(BASE);manifest=original.with_suffix('.manifest.json')
        if not manifest.is_file():missing.append(str(rel));continue
        report=json.loads(manifest.read_text())
        if report.get('source') != 'source/'+rel.as_posix().removesuffix('.mjs'):
            missing.append(str(rel));continue
        target=TARGET/rel
        if target.is_file():preserved.append(str(rel));continue
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(original,target)
        shutil.copyfile(manifest,target.with_suffix('.manifest.json'))
        copied.append(str(rel))
    result={'format':'sourcefirst-canonical-browser-module-sync/1',
            'verifiedTargetModuleCount':len(list(TARGET.rglob('*.manifest.json'))),
            'copiedVerifiedSourceModules':len(copied),
            'preservedPromotedModules':len(preserved),'missingManifestOrSourceProof':missing,
            'modulesCopied':copied,'originalGameplayVerified':False}
    report=ROOT/'reports/browser-target/verified-module-sync.json'
    report.parent.mkdir(parents=True,exist_ok=True)
    report.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ('copiedVerifiedSourceModules','preservedPromotedModules','missingManifestOrSourceProof')}))
    return result
if __name__=='__main__':run()
