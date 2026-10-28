#!/usr/bin/env python3
"""Link the original Build initdivtables function via a proven libdivide ABI.

This is an original-source declaration compile and verified four-function
arithmetic library mapping, not a substitute game bootstrap.
"""
import json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'factory-output/source-first/browser-target'
COMPILER=ROOT/'tools/source_ast_to_js.py'

def run(*args):
    p=subprocess.run([*map(str,args)],cwd=ROOT,capture_output=True,text=True,timeout=180)
    if p.returncode:raise RuntimeError(f'{args}: {p.stdout[-1000:]} {p.stderr[-1500:]}')
    return p.stdout

def build():
    # Generate a provider index using concrete runtime exports and unique
    # source definitions. The target translation unit may not self-import.
    run(sys.executable,ROOT/'tools/browser_target_closure.py')
    p=DEST/'browser-combined-symbol-owners.json'
    index={k:v for k,v in json.loads(p.read_text()).items()
           if v!='source/build/src/pragmas.cpp'}
    expected=('libdivide_s32_gen','libdivide_s64_gen',
              'libdivide_s32_branchfree_gen','libdivide_s64_branchfree_gen')
    for name in expected:
        if index.get(name)!='browser-abi/libdivide_provider':
            raise RuntimeError('No verified libdivide provider for '+name)
    symbol_file=DEST/'symbols-original-pragmas.json'
    symbol_file.write_text(json.dumps(index,indent=2)+'\n')
    run(sys.executable,COMPILER,'--root',ROOT/'factory-output/source-tree/eduke32-master',
        '--source','source/build/src/pragmas.cpp',
        '--filter','divtable64,divtable32,bfdivtable64,bfdivtable32,initdivtables',
        '--project-symbols',symbol_file,'--enum-closure','--out-dir',DEST)
    target=DEST/'source/build/src/pragmas.cpp.mjs'
    report=json.loads(target.with_suffix('.manifest.json').read_text())
    definitions=report['definitions']
    if len(definitions)!=5 or any(row['status']!='source-first' for row in definitions):
        raise RuntimeError('Source-derived division tables/initializer remain blocked')
    imports={row['name']:row['from'] for row in report.get('imports',[])}
    for name in expected:
        if imports.get(name)!='browser-abi/libdivide_provider':
            raise RuntimeError('Unverified generator import '+name)
    run('node','--check',target)
    run(sys.executable,ROOT/'tools/browser_target_closure.py')
    final=json.loads(p.read_text())
    if final.get('initdivtables')!='source/build/src/pragmas.cpp':
        raise RuntimeError('Original division initializer has no linker provider')
    status={'source':'source/build/src/pragmas.cpp','entry':'initdivtables',
            'status':'SOURCE_EMITTED','definitions':len(definitions),
            'generator_symbols':list(expected),'browser_linker_registered':True,
            'original_game_boot_verified':False}
    dst=ROOT/'reports/original-startup/initdivtables-build.json'
    dst.parent.mkdir(parents=True,exist_ok=True)
    dst.write_text(json.dumps(status,indent=2)+'\n')
    print(json.dumps(status))
    return status
if __name__=='__main__':build()
