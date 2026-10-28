#!/usr/bin/env python3
"""Restore exact original source archives and relocate captured build commands."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-only',action='store_true')
    args=parser.parse_args()
    settings=json.loads((ROOT/'HANDOFF_STATE.json').read_text(encoding='utf-8'))
    for entry in settings['original_inputs']:
        path=ROOT/entry['path']
        with path.open('rb') as stream:digest=hashlib.file_digest(stream,'sha256').hexdigest()
        if digest!=entry['sha256']:raise ValueError('Original input checksum mismatch: '+entry['path'])
    if args.verify_only:
        print('PASS: original source archives and GRP checksums match');return
    output=ROOT/settings['source_tree_directory']
    output.mkdir(parents=True,exist_ok=True)
    for source in sorted((ROOT/'input-source').glob('*.zip')):
        with zipfile.ZipFile(source) as archive:
            for info in archive.infolist():
                relative=PurePosixPath(info.filename)
                if relative.is_absolute() or '..' in relative.parts or '\\' in info.filename:
                    raise ValueError('Unsafe source archive member: '+info.filename)
                path=output.joinpath(*relative.parts)
                if info.is_dir():path.mkdir(parents=True,exist_ok=True);continue
                path.parent.mkdir(parents=True,exist_ok=True)
                data=archive.read(info)
                if path.exists() and path.read_bytes()!=data:
                    raise ValueError('Existing source differs; refusing to overwrite edits: '+str(path))
                if not path.exists():path.write_bytes(data)
    command_path=ROOT/settings['compile_commands_path']
    commands=json.loads(command_path.read_text(encoding='utf-8'))
    for entry in commands:entry['directory']=str((output/'eduke32-master').resolve())
    command_path.write_text(json.dumps(commands,indent=2),encoding='utf-8')
    if settings['mode']=='continuation':
        from source_first_generated import recover
        recover(output/'eduke32-master',[row['file'] for row in commands if row['file'].endswith('.glsl.cpp')])
    print('Original source prepared:',output)
    print('Captured Make-selected translation units:',len(commands))

if __name__=='__main__':main()
