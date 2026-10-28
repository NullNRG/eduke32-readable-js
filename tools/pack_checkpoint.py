#!/usr/bin/env python3
"""Package the one canonical SourceFactory project, with optional original user game data."""
from pathlib import Path
import argparse,hashlib,json,zipfile
ROOT=Path(__file__).resolve().parents[1]
TREES=('tools','runtime','tests','input-source','licenses','web','factory-output','reports')

def pack(path, include_data=False):
    files=[]
    for p in ROOT.iterdir():
        if p.is_file() and p.suffix in ('.md','.json','.mjs','.txt','.ps1'):
            files.append(p)
    for folder in TREES+(('input-data',) if include_data else ()):
        if (ROOT/folder).is_dir():files.extend(p for p in (ROOT/folder).rglob('*') if p.is_file())
    files=[p for p in files if not any(x in ('__pycache__','.git','node_modules') for x in p.parts) and p.suffix!='.pyc']
    files=[p for p in files if not p.name.endswith(('.tmp','.partial','-wal','-shm'))
           and not p.name.startswith('semantic-probe')]
    files=[p for p in files if p.name!='semantic-index-original-mixed-resource.sqlite']
    for p in files:
        if p.suffix=='.sqlite':
            wal=p.with_name(p.name+'-wal')
            if wal.is_file() and wal.stat().st_size:
                raise RuntimeError('Refuse to package a live SQLite index before its WAL is checkpointed: '+str(p))
    dest=Path(path);dest.parent.mkdir(parents=True,exist_ok=True)
    stage=dest.with_suffix(dest.suffix+'.partial')
    with zipfile.ZipFile(stage,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=5,allowZip64=True) as z:
        for p in sorted(files):z.write(p,'EDuke32_SourceFactory/'+p.relative_to(ROOT).as_posix())
        z.comment=b'Canonical engineering checkpoint. Original Duke Nukem 3D gameplay is INCOMPLETE; see reports/port-acceptance.json.'
    stage.replace(dest)
    h=hashlib.sha256()
    with dest.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return {'path':str(dest),'files':len(files),'bytes':dest.stat().st_size,'sha256':h.hexdigest(),'contains_user_supplied_game_data':include_data}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',required=True)
    parser.add_argument('--include-data',action='store_true')
    args=parser.parse_args()
    print(json.dumps(pack(args.out,args.include_data),indent=2))
if __name__=='__main__':main()
