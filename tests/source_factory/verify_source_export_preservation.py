#!/usr/bin/env python3
"""Prove live ESM retention and fail-closed mutable storage integration."""
import json,subprocess,tempfile
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from recover_source_exports import stitch
with tempfile.TemporaryDirectory() as name:
    root=Path(name);base=root/'baseline';target=root/'target'
    (base/'build').mkdir(parents=True);(target/'build').mkdir(parents=True)
    old=base/'build/tool.cpp.mjs';new=target/'build/tool.cpp.mjs'
    old.write_text('export let oldValue = 7;\nexport function oldFn(){return oldValue;}\n')
    new.write_text('export function modernFn(){return 42;}\n')
    result=stitch(new,base,target)
    assert result['result']=='live-reexports-added' and result['preserved']==2,result
    assert stitch(new,base,target)['preserved']==2 # idempotent
    subprocess.run(['node','--check',str(new)],check=True)
    script=f"import * as m from {json.dumps(new.as_uri())}; if(m.oldFn()!==7||m.oldValue!==7||m.modernFn()!==42) throw Error('bindings lost')"
    subprocess.run(['node','--input-type=module','-e',script],check=True)
    old.write_text('export let shared = 1;\nexport function oldFn(){return shared;}\n')
    new.write_text('export let shared = 2;\nexport function newFn(){return shared;}\n')
    saved=new.read_text()
    unsafe=stitch(new,base,target)
    assert unsafe['result']=='blocked-shared-mutable-storage',unsafe
    assert new.read_text()==saved
print('PASS live original exports, original state identities, idempotence and mutable collision rejection')
