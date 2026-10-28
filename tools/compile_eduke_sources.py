#!/usr/bin/env python3
"""Compile a verified EDuke32 C++ *subset* directly into JS via Clang LLVM IR.

This program reads the user's original source files, compiles them without editing,
selects documented functions (all other IR rejected), and performs parity tests.
It is the first real source-to-JavaScript pass; it does NOT compile the EDuke32 game.
"""
import argparse,subprocess,shutil,sys,pathlib,json,hashlib,os
from llvm_ir_to_js import translate
ROOT=pathlib.Path(__file__).resolve().parents[1]
FUNCTIONS=['Bcrc32','initcrc32table','fix16_add','fix16_sub','fix16_sadd','fix16_ssub','fix16_mul','fix16_smul','fix16_lerp8','fix16_lerp16','fix16_lerp32']
SOURCES=['source/build/src/crc32.cpp','source/build/src/fix16.cpp']
def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--source',type=pathlib.Path,required=True,help='Unpacked original EDuke32 root')
 p.add_argument('--output',type=pathlib.Path,default=ROOT/'web'/'compiled_engine_crc32.js')
 p.add_argument('--manifest',type=pathlib.Path,default=ROOT/'dist'/'llvm-transpiler-manifest.json')
 args=p.parse_args()
 clang=shutil.which('clang++')
 if not clang:sys.exit('clang++ is required; no output generated')
 irs=[];digests={}
 for rel in SOURCES:
  src=args.source/rel
  if not src.is_file():sys.exit('Missing original source '+str(src))
  digests[rel]=hashlib.sha256(src.read_bytes()).hexdigest()
  command=[clang,'-std=c++17','-Wno-c++11-narrowing','-O1','-S','-emit-llvm',str(src),'-I',str(args.source/'source/build/include'),'-o','-']
  result=subprocess.run(command,text=True,capture_output=True)
  if result.returncode:sys.exit('Clang failed on '+rel+'\n'+result.stderr[-3000:])
  irs.append(result.stdout)
 js=translate('\n'.join(irs),set(FUNCTIONS))
 args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(js)
 result=subprocess.run(['node','--check',str(args.output)],capture_output=True,text=True)
 if result.returncode:sys.exit('Node JS syntax check failed:\n'+result.stderr)
 checks=[]
 for name in ['smoke_llvm_crc32.cjs','smoke_llvm_fix16.cjs','smoke_llvm_fix16_extended.py']:
  env={**os.environ,'EDUKE_SOURCE_ROOT':str(args.source.resolve()),'EDUKE_COMPILED_JS':str(args.output.resolve())}
  proc=subprocess.run([('python' if name.endswith('.py') else 'node'),str(ROOT/'tests'/name)],capture_output=True,text=True,env=env)
  if proc.returncode:sys.exit('Source parity test failed: '+name+'\n'+proc.stdout+proc.stderr)
  checks.append(proc.stdout.strip());print(checks[-1])
 manifest={'source':'uploaded EDuke32 source archive','compiler':subprocess.run([clang,'--version'],capture_output=True,text=True).stdout.splitlines()[0], 'source_sha256':digests,'transpiled_functions':FUNCTIONS,'compilation':'clang++ -std=c++17 -O1 -S -emit-llvm, then strict-subset LLVM-to-JS backend', 'test_results':checks,'full_engine_transpiled':False,'con_interpreter_transpiled':False,'limitations':['Only explicitly selected functions; unsupported LLVM IR is fatal','Requires a full browser platform port plus full LLVM backend for all engine subsystems']}
 args.manifest.parent.mkdir(parents=True,exist_ok=True);args.manifest.write_text(json.dumps(manifest,indent=2));print('Compiled',len(FUNCTIONS),'real EDuke32 C++ functions into',args.output)
if __name__=='__main__':main()
