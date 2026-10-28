#!/usr/bin/env python3
"""Parity test: source-first EDuke32 CRC32 vs Python zlib CRC32, including unaligned tails.

This exercises generated source AST JavaScript. The legacy LLVM backend is not used.
"""
import json, pathlib, random, subprocess, sys, zlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
source='source/build/src/crc32.cpp'
out=ROOT/'factory-output/source-first/selected'/ (source+'.mjs')
if not out.exists():
    cmd=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT/'factory-output/source-tree/eduke32-master'), '--source',source,'--out-dir',str(ROOT/'factory-output/source-first/selected')]
    subprocess.run(cmd,cwd=ROOT,check=True,capture_output=True,text=True)
rng=random.Random(0xD00C32)
tests=[]
for size in [0,1,2,3,4,7,8,9,15,16,17,31,32,33,63,64,65,127,128,129,255,256,257,4095,4096]:
 for seed in [0,1,0x12345678,0xffffffff]:
  data=bytes(rng.randrange(256) for _ in range(size))
  tests.append({'bytes':list(data),'seed':seed,'expected':zlib.crc32(data,seed)})
for _ in range(110):
 size=rng.randrange(0,250)
 data=bytes(rng.randrange(256) for _ in range(size))
 seed=rng.randrange(2**32)
 tests.append({'bytes':list(data),'seed':seed,'expected':zlib.crc32(data,seed)})
program='''import {Bcrc32,initcrc32table} from '''+json.dumps(out.as_uri())+''';
import fs from 'node:fs';
const tests=JSON.parse(fs.readFileSync(0,'utf8'));
initcrc32table();
const checks=tests.map(t=> {
  const source=Uint8Array.from([17,31,...t.bytes,99]);
  const view=source.subarray(2,2+t.bytes.length);
  return Bcrc32(view,t.bytes.length,t.seed)>>>0;
});
process.stdout.write(JSON.stringify(checks));
'''
p=subprocess.run(['node','--input-type=module','-e',program],input=json.dumps(tests),capture_output=True,text=True,timeout=45)
if p.returncode:raise SystemExit(p.stderr)
results=json.loads(p.stdout)
for idx,(actual,test) in enumerate(zip(results,tests)):
 if actual!=test['expected']:
  raise SystemExit(f'CRC mismatch case {idx}: expected {test["expected"]}, got {actual}')
print(f'PASS: {len(tests)} EDuke32 source-first CRC32 parity cases, including non-word-aligned buffers and arbitrary seeds')
