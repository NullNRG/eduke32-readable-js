#!/usr/bin/env python3
"""Prove persistent raw Clang AST reuse never hides source/header changes.

The game build still re-emits JavaScript and checks every import; this verifies
that a raw AST hit is semantically keyed rather than trusted as runnable output.
"""
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_automate import ast_semantic_epoch

with tempfile.TemporaryDirectory(prefix='eduke-attested-ast-') as temp:
    base=Path(temp)
    src=base/'source';src.mkdir()
    header=src/'functions.h';header.write_text('#define SCALE 3\n')
    cpp=src/'fixture.cpp';cpp.write_text('#include "functions.h"\nextern "C" int original(int x){return x*SCALE+4;}\n')
    cmds=base/'commands.json';cmds.write_text('[]')
    epoch=ast_semantic_epoch(cmds,src)
    plan=base/'plan.json';plan.write_text(json.dumps({'root':str(src),'units':[{'source':'fixture.cpp'}]}))
    cache=base/'cache'/epoch
    output=base/'output'
    run=[sys.executable,str(ROOT/'tools/source_first_project.py'),
        '--plan',str(plan),'--out-dir',str(output),'--ast-cache-dir',str(cache),'--ast-cache-shards','4']
    def compile_and_check(hit):
        r=subprocess.run(run,capture_output=True,text=True,timeout=90,cwd=ROOT)
        assert r.returncode==0,(r.stderr[-1500:],r.stdout[-1500:])
        manifest=json.loads((output/'fixture.cpp.manifest.json').read_text())
        assert manifest['emitted']==1 and manifest['blocked']==0,manifest
        assert bool(manifest['ast_decode'][0]['cache_hit']) is hit,manifest['ast_decode']
        mod=output/'fixture.cpp.mjs'
        js=subprocess.run(['node','--input-type=module','--eval',
           'import {original} from '+json.dumps(mod.as_uri())+'; console.log(original(11));'],
           capture_output=True,text=True,timeout=20)
        assert js.returncode==0,(js.stderr,js.stdout)
        return int(js.stdout.strip()),hashlib.sha256(mod.read_bytes()).hexdigest()
    first,digest=compile_and_check(False)
    second,digest2=compile_and_check(True)
    assert first==second==37 and digest==digest2,(first,second)
    # Changing only an included header must select an entirely different AST
    # epoch even if a build runner preserved an earlier compiler-generated dump.
    header.write_text('#define SCALE 5\n')
    changed=ast_semantic_epoch(cmds,src)
    assert changed!=epoch,'included-header change reused Clang epoch'
    cache=base/'cache'/changed
    run[run.index('--ast-cache-dir')+1]=str(cache)
    third,digest3=compile_and_check(False)
    assert third==59 and digest3!=digest,(third,digest3)
    # Changes to any original compilation unit invalidate the epoch; the
    # translator is not permitted to conceal conditional source includes.
    cpp.write_text(cpp.read_text()+'// source changed\n')
    assert ast_semantic_epoch(cmds,src)!=changed
print('PASS: full C++ AST cache miss -> hit, original native semantics, header invalidation, source invalidation')
