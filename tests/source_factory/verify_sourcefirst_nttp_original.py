#!/usr/bin/env python3
"""Original EDuke32 headers: non-type templates and mimalloc assumed alignment."""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
TOOL_DIR=Path(os.environ.get('EDUKE_TEST_COMPILER_DIR') or ROOT/'tools')
source_root=ROOT/'factory-output/source-tree/eduke32-master'
assert source_root.is_dir(),'EDuke32 extracted original sources required'
checks=[
    ('source/build/src/hash.cpp',{'ARRAY_SIZE':1}),
    ('source/duke3d/src/grpscan.cpp',{'ARRAY_SIZE':3}),
    ('source/mimalloc/src/alloc-aligned.c',{'_mi_memzero_aligned':1,'_mi_memcpy_aligned':1}),
]
with tempfile.TemporaryDirectory(prefix='eduke_native_nttp_') as temp:
    for source,expected in checks:
        args=[sys.executable,str(TOOL_DIR/'source_ast_to_js.py'),
              '--root',str(source_root),'--source',source,'--header-dependency-closure',
              '--compile-commands',str(ROOT/'factory-output/compile_commands.json'),
              '--out-dir',str(temp)]
        p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=360)
        assert p.returncode==0,(source,p.stderr[-1200:],p.stdout[-1200:])
        js=Path(temp)/(source+'.mjs')
        manifest=js.with_suffix('.manifest.json')
        rows=json.loads(manifest.read_text())['definitions']
        for named,required in expected.items():
            verified=[r for r in rows if r.get('source_name')==named and r.get('status')=='source-first']
            assert len(verified)>=required,(source,named,required,verified)
        if js.is_file():
            check=subprocess.run(['node','--check',str(js)],capture_output=True,text=True,timeout=20)
            assert check.returncode==0,(source,check.stderr[-1000:])
print('PASS original EDuke32: ARRAY_SIZE 4 specializations; mimalloc 2 aligned-memory helpers')
