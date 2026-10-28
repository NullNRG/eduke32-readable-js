#!/usr/bin/env python3
"""Package canonical source factory, preserving original licenses and bytes."""
import argparse,json,pathlib,shutil,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE=pathlib.Path('/mnt/data')

def package(output,full):
    output.parent.mkdir(parents=True,exist_ok=True)
    filelist=[]
    for d in ('runtime','tools','tests','web','licenses'):
        for f in (ROOT/d).rglob('*'):
            if not f.is_file() or '__pycache__' in f.parts or f.suffix in ('.pyc','.psd'):continue
            filelist.append((f, f.relative_to(ROOT).as_posix()))
    for f in (ROOT/'factory-output').rglob('*'):
        if not f.is_file() or '__pycache__' in f.parts or 'source-tree' in f.parts:continue
        if f.suffix in ('.png','.ll') or f.name.endswith('.error.txt'):continue
        filelist.append((f, f.relative_to(ROOT).as_posix()))
    for name in ('README.md','README_SOURCE_FACTORY.md','package.json','eslint.config.mjs','CONTINUATION_STAGE17.md','STAGE17_RESULTS.json','STAGE17_BLOCKERS.md'):
        filelist.append((ROOT/name,name))
    for f in (ROOT/'input-source').glob('*.zip'):
        filelist.append((f, f.relative_to(ROOT).as_posix()))
    if full:
        for name in ('DUKE3D.GRP','SW.GRP'):
            filelist.append((BASE/name,'input-data/'+name))
        filelist.append((BASE/'EDuke32_Stage17_index.html','dist/index.html'))
        screenshot=BASE/'browser-check.png'
        if screenshot.is_file():filelist.append((screenshot,'dist/verified_chromium.png'))
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=2,allowZip64=True) as z:
        for src,dest in sorted(set(filelist),key=lambda x:x[1]):
            # Already compressed source ZIPs and GRPs are stored to accelerate archiving.
            compression=zipfile.ZIP_STORED if src.suffix.lower() in ('.zip','.grp') else zipfile.ZIP_DEFLATED
            z.write(src,'EDuke32_SourceFactory/'+dest,compress_type=compression)
        z.comment=b'EDuke32 Source Factory: original game is NOT yet playable. See README_SOURCE_FACTORY.md.'
    return {'file':str(output),'bytes':output.stat().st_size,'entries':len(filelist),'contains_original_grps':full,'contains_original_source_zip':True,'contains_standalone_html':full}

if __name__=='__main__':
    a=argparse.ArgumentParser(description=__doc__);a.add_argument('--full',action='store_true');a.add_argument('--out',type=pathlib.Path,required=True);args=a.parse_args()
    print(json.dumps(package(args.out,args.full),indent=2))
