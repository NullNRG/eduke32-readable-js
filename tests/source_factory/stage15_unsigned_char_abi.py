#!/usr/bin/env python3
"""Verify that Clang sees the native Makefile's char signedness ABI flag."""
import json, pathlib, re, subprocess, sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from whole_program import clean_args
row={'source':'fixture.cpp','argv':['g++','-funsigned-char','-fno-rtti','-std=gnu++14','-c','fixture.cpp','-o','fixture.o']}
args=clean_args(row,'clang++')
assert '-funsigned-char' in args, args
sample='char sample[1]; int readchar(void) {return sample[0];}'
command=['clang','-O1','-S','-emit-llvm','-funsigned-char','-x','c','-','-o','-']
proc=subprocess.run(command,input=sample,text=True,capture_output=True,check=True)
assert re.search(r'zext i8 %\w+ to i32',proc.stdout),proc.stdout
manifest=json.loads((ROOT/'factory-output/whole-program/compiler-diagnostics.json').read_text())
row=next(x for x in manifest if x['source'].endswith('/colmatch.cpp'))
ir=(ROOT/'factory-output/whole-program/llvm'/row['llvm']).read_text()
assert re.search(r'load i8, ptr %\d+.*?\n\s*%\d+ = zext i8',ir), 'unsigned source must use zext for table indices'
print('PASS native GNUmakefile -funsigned-char ABI, Clang IR zext, original colmatch source IR')
