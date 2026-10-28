#!/usr/bin/env python3
"""Recover original GRP inputs losslessly from the standalone index.html."""
import argparse,base64,hashlib,json,re,zlib
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('html',type=Path)
p.add_argument('--outdir',type=Path,default=Path('inputs'))
p.add_argument('--verify-only',action='store_true')
a=p.parse_args();src=a.html.read_text(encoding='utf8')
contents=re.findall(r'<script type="text/plain" id="grp-(\d+)">([A-Za-z0-9+/=]+)</script>',src)
if not contents:raise SystemExit('No embedded archives found')
# IDs follow GAME_BUNDLES order, Duke followed by Shadow Warrior.
for idx,b64 in contents:
    data=zlib.decompress(base64.b64decode(b64))
    if data[:12]!=b'KenSilverman':raise SystemExit('Invalid recovered GRP')
    filename=['DUKE3D.GRP','SW.GRP'][int(idx)] if int(idx)<2 else 'GAME-'+idx+'.GRP'
    checksum=hashlib.sha256(data).hexdigest()
    print(filename,len(data),'SHA256',checksum)
    if not a.verify_only:
        a.outdir.mkdir(parents=True,exist_ok=True)
        (a.outdir/filename).write_bytes(data)
