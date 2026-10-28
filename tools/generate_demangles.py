#!/usr/bin/env python3
"""Produce immutable C++ demanglings from the actual selected IR symbol table.

Uses host c++filt only at BUILD time; there is no native runtime dependency.
Unknown ABI symbols remain unsupported instead of guessed.
"""
from pathlib import Path
import argparse,json,subprocess
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--report',default='factory-output/whole-program/symbol-link-report.json');p.add_argument('--out',default='runtime/generated_demangles.mjs')
a=p.parse_args();report=json.loads((ROOT/a.report).read_text())
syms=sorted(s for s in report['symbols_defined'] if s.startswith('_Z'))
output=subprocess.run(['c++filt','--format=gnu-v3'],input='\n'.join(syms)+'\n',text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout.splitlines()
if len(output)!=len(syms):raise RuntimeError('c++filt symbol count mismatch')
rows={name:value for name,value in zip(syms,output) if name!=value}
(ROOT/a.out).write_text('// Generated from the selected original C++ source symbol table; never hand edit.\nexport const demangledSymbols = Object.freeze('+json.dumps(rows,ensure_ascii=True,separators=(',',':'))+');\n')
print(json.dumps({'mangled_candidates':len(syms),'demangled':len(rows),'destination':a.out}))
