#!/usr/bin/env python3
"""An autonomous --resume must invalidate batches after JS runtime changes."""
from pathlib import Path
import sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
import source_first_automate as auto
with tempfile.TemporaryDirectory(prefix='span_cache_') as directory:
    root=Path(directory); (root/'tools').mkdir();(root/'src').mkdir()
    (root/'commands.json').write_text('[]')
    assets={path.name for path in auto.pipeline_inputs(None,root/'src')
            if path.parent==auto.ROOT/'tools'}
    for name in assets:(root/'tools'/name).write_text('baseline')
    (root/'tools/compiler.py').write_text('compiler')
    (root/'tools/frontend.py').write_text('frontend')
    (root/'tools/flow.py').write_text('flow')
    originals=auto.ROOT,auto.COMPILER,auto.FRONTEND,auto.FLOW
    try:
        auto.ROOT=root
        auto.COMPILER=root/'tools/compiler.py'
        auto.FRONTEND=root/'tools/frontend.py'
        auto.FLOW=root/'tools/flow.py'
        first=auto.fingerprint(root/'commands.json',root/'src',[])
        for name in ('source_pointer_span_runtime.mjs','source_aggregate_runtime.mjs',
                     'source_byte_records.py','source_first_toolchain.py'):
            path=root/'tools'/name
            path.write_text('modified')
            changed=auto.fingerprint(root/'commands.json',root/'src',[])
            assert changed!=first,(name,'cached compilation was not invalidated')
            path.write_text('baseline')
            assert auto.fingerprint(root/'commands.json',root/'src',[])==first
    finally:auto.ROOT,auto.COMPILER,auto.FRONTEND,auto.FLOW=originals
print('PASS: source-runtime changes invalidate autonomous compiler resume cache')
