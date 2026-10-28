#!/usr/bin/env python3
"""Native C++ / original JavaScript parity for bounded parallel Clang closure.

Queries for source-defined siblings are independent but their emitted ordering
must be deterministic. This test deliberately starts with only the entry AST.
"""
from __future__ import annotations
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMPILER = ROOT / 'tools/source_ast_to_js.py'

with tempfile.TemporaryDirectory(prefix='sourcefirst-closure-') as folder:
    root = Path(folder)
    (root/'sample.cpp').write_text('''
int helper_z(int x) { return ((x * 7) ^ 33) | 0; }
int helper_b(int x) { return (x * 3) - 5; }
int helper_a(int x) { return (x + 29) * 2; }
int entry(int x) { return helper_z(x) + helper_a(x) - helper_b(x); }
''', encoding='utf-8')
    (root/'native.cpp').write_text('''
#include <cstdio>
int entry(int);
int main() { for (int i=-150; i<150; ++i) std::printf("%d\\n", entry(i)); }
''', encoding='utf-8')
    expected = None
    for count in range(2):
        out = root/f'generated{count}'
        run = subprocess.run([sys.executable,str(COMPILER),'--root',str(root),
            '--source','sample.cpp','--filter','entry','--dependency-closure',
            '--out-dir',str(out)],cwd=ROOT,text=True,capture_output=True,timeout=35)
        assert run.returncode == 0, (run.stdout,run.stderr)
        module = out/'sample.cpp.mjs'
        manifest = json.loads((out/'sample.cpp.manifest.json').read_text())
        exports = {row['name']:row for row in manifest['definitions']}
        assert {'entry','helper_z','helper_a','helper_b'} <= exports.keys(),exports
        assert all(exports[name]['status']=='source-first' for name in ('entry','helper_z','helper_a','helper_b')),exports
        filters=manifest['dependency_closure']['additional_ast_filters']
        assert filters == sorted(filters) and len(filters)>=3,filters
        assert not manifest['imports'],manifest['imports']
        produced = module.read_bytes()
        if expected is not None: assert expected == produced,'Concurrency changed generated JS ordering'
        expected=produced
        check=subprocess.run(['node','--check',str(module)],cwd=ROOT,text=True,capture_output=True)
        assert check.returncode == 0,check.stderr
    native_compile=subprocess.run(['clang++','-std=gnu++14','sample.cpp','native.cpp','-o','reference'],
        cwd=root,capture_output=True,text=True,timeout=20)
    assert native_compile.returncode == 0,native_compile.stderr
    native=subprocess.run([str(root/'reference')],cwd=root,capture_output=True,text=True,timeout=10,check=True)
    (root/'compare.mjs').write_text('''import {entry} from './generated0/sample.cpp.mjs';
for(let i=-150;i<150;i++)console.log(entry(i));
''',encoding='utf-8')
    js=subprocess.run(['node',str(root/'compare.mjs')],cwd=root,capture_output=True,text=True,timeout=15)
    assert js.returncode == 0,js.stderr
    assert native.stdout==js.stdout,(native.stdout[:100],js.stdout[:100])
    print('PASS: 300 native C++ / generated JS cases; all source dependencies linked')
    print('PASS: two parallel Clang closure builds were byte-for-byte deterministic')
