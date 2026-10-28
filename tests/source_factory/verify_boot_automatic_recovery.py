#!/usr/bin/env python3
"""Safety/integration regression for the Clang original-source boot recovery."""
from pathlib import Path
import hashlib,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[2]
TOOL=ROOT/'tools/promote_boot_probe.cjs'
BASE=ROOT/'factory-output/source-first'

def call(name,owner):
    cmd=['node',str(TOOL),'--symbol',name,'--owner',owner,'--probe',
         str(BASE/'automated-boot-closure'/name)]
    return subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,timeout=30)

def main():
    for name,owner in [('S_ClearSoundLocks','source/duke3d/src/sounds.cpp'),('kclose','source/build/src/vfs.cpp')]:
        target=BASE/'browser-target'/f'{owner}.mjs'
        prior=hashlib.sha256(target.read_bytes()).hexdigest()
        result=call(name,owner)
        assert result.returncode==0,(name,result.stderr)
        assert json.loads(result.stdout)['status']=='verified'
        assert hashlib.sha256(target.read_bytes()).hexdigest()==prior,'Dry run modified canonical source'
    conflict=call('G_UpdateAppTitle','source/duke3d/src/game.cpp')
    assert conflict.returncode!=0,'Conflicting source body was silently accepted'
    assert 'Overlapping original state/ABI disagrees' in conflict.stderr
    manifest=json.loads((BASE/'browser-target/source/duke3d/src/sounds.cpp.manifest.json').read_text())
    assert sum(1 for x in manifest['definitions'] if x.get('name')=='S_ClearSoundLocks' and x.get('status')=='source-first')==1
    print(json.dumps({'status':'PASS','checks':5,'canonicalDryRunUnchanged':True,
                      'conflictingOriginalBodyRejected':True,'sourceFunctionsChecked':2,
                      'originalGameBootVerified':False},indent=2))
if __name__=='__main__':main()
