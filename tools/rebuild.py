#!/usr/bin/env python3
"""One-command, reproducible EDuke32 C++ *subset* -> JS + browser data preview.

The resulting file runs the native JS reconstruction plus 11 transpiled original
C++ utility functions. It is NOT a complete EDuke32 translation and intentionally
fails if requested source symbols or compilation dependencies are missing.
"""
import argparse, pathlib, subprocess, sys, tempfile, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]

def call(*args):
    print('+',*map(str,args),flush=True)
    subprocess.run([str(x) for x in args],check=True)

def unpack(root, zip_path):
    with zipfile.ZipFile(zip_path) as z:
        for entry in z.infolist():
            # Avoid ZIP path traversal / absolute path overwrite.
            dest=(root/entry.filename).resolve()
            if not dest.is_relative_to(root.resolve()):raise ValueError('ZIP entry outside extraction folder: '+entry.filename)
        z.extractall(root)
    candidates=[p.parent for p in root.rglob('GNUmakefile') if (p.parent/'source/build/src/fix16.cpp').exists()]
    if len(candidates)!=1:raise RuntimeError(f'Expected one EDuke32 root; found {len(candidates)}')
    return candidates[0]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-zip',type=pathlib.Path,required=True)
    parser.add_argument('--duke',type=pathlib.Path)
    parser.add_argument('--shadow',type=pathlib.Path)
    parser.add_argument('--out',type=pathlib.Path,required=True)
    args=parser.parse_args()
    if not args.duke and not args.shadow:parser.error('At least one original GRP file is needed')
    for file in [args.source_zip,args.duke,args.shadow]:
        if file and not file.is_file():parser.error('Missing: '+str(file))
    with tempfile.TemporaryDirectory(prefix='eduke_original_source_') as tmp:
        source=unpack(pathlib.Path(tmp),args.source_zip)
        call(sys.executable,ROOT/'tools/compile_eduke_sources.py','--source',source)
        cmd=[sys.executable,ROOT/'tools/build.py','--source',source,'--out',args.out]
        if args.duke:cmd.extend(['--duke',args.duke])
        if args.shadow:cmd.extend(['--shadow',args.shadow])
        call(*cmd)
    call(sys.executable,ROOT/'tools/extract_embedded_grp.py',args.out,'--verify-only')
    print('Done:',args.out, 'size',args.out.stat().st_size,'bytes')
    print('WARNING: this is a native JS reconstruction preview with 11 genuine source-transpiled C++ functions, NOT the full EDuke32 engine.')
if __name__=='__main__':main()
