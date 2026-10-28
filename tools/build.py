#!/usr/bin/env python3
"""Build an offline single-HTML native JavaScript BUILD-data runner.
This is NOT a full C/C++ transpiler or an EDuke32 executable.
It translates level/tile/symbol data and uses a standalone JS renderer.
"""
import argparse, base64, hashlib, json, re, struct, zlib, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def parse_grp(path):
    blob=path.read_bytes()
    if blob[:12]!=b'KenSilverman': raise ValueError(f'{path}: invalid GRP magic')
    n=struct.unpack_from('<I',blob,12)[0]
    if n<1 or n>20000: raise ValueError('unreasonable GRP count')
    off=16+n*16; files={}
    for i in range(n):
        nam,sz=struct.unpack_from('<12sI',blob,16+i*16)
        nam=nam.split(b'\0')[0].decode('ascii','replace').upper()
        if off+sz>len(blob): raise ValueError(f'{nam}: beyond end of GRP')
        files[nam]=(off,sz);off+=sz
    if off!=len(blob): raise ValueError(f'GRP size mismatch: consumed {off} vs {len(blob)}')
    return blob,files

def validate_map(b):
    if len(b)<28: raise ValueError('short map')
    version=struct.unpack_from('<I',b,0)[0]
    if version not in (6,7,8,9): raise ValueError(f'map version {version}')
    sect=struct.unpack_from('<H',b,20)[0]
    if sect>4096: raise ValueError('sector count')
    wallp=22+sect*40
    if wallp+2>len(b): raise ValueError('sectors exceed map')
    walls=struct.unpack_from('<H',b,wallp)[0]
    sprp=wallp+2+walls*32
    if sprp+2>len(b): raise ValueError('walls exceed map')
    sprs=struct.unpack_from('<H',b,sprp)[0]
    if sprp+2+sprs*44>len(b): raise ValueError('sprites exceed map')
    return {'version':version,'sectors':sect,'walls':walls,'sprites':sprs}

def transpile_constants(header):
    defs={}
    for line in header.read_text(errors='replace').splitlines():
        m=re.match(r'^\s*#define\s+([A-Z][A-Z0-9_]*)\s+(-?\d+)\s*(?:/[/\*].*)?$',line)
        if m:defs[m[1]]=int(m[2])
    return defs

def con_declarations(data):
    src=data.decode('latin1').replace('\r','\n'); defs={};decl=[]
    for lineno,line in enumerate(src.split('\n'),1):
        s=line.split('//',1)[0].strip()
        if not s:continue
        tokens=s.split();cmd=tokens[0].lower()
        if cmd=='define' and len(tokens)>=3 and re.fullmatch(r'-?\d+',tokens[2]): defs[tokens[1]]=int(tokens[2])
        if cmd in {'actor','useractor','state','action','move','ai','eventloadactor','onevent'}:
            decl.append({'line':lineno,'kind':cmd,'args':tokens[1:8]})
    return {'defines':defs,'declarations':decl,'executable':False}

def build(args):
    entries=[];meta={};stats={}
    for game,p in [('Duke Nukem 3D',args.duke),('Shadow Warrior',args.shadow)]:
        if not p:continue
        data,idx=parse_grp(p)
        maps={}
        for nam,(off,sz) in idx.items():
            if nam.endswith('.MAP'):
                try: maps[nam]=validate_map(data[off:off+sz])
                except Exception as ex: maps[nam]={'error':str(ex)}
        arts={k:v[1] for k,v in idx.items() if k.endswith('.ART')}
        cons={k:con_declarations(data[off:off+sz]) for k,(off,sz) in idx.items() if k.endswith('.CON')}
        digest=hashlib.sha256(data).hexdigest()
        meta[game]={'bytes':len(data),'sha256':digest,'entries':len(idx),'maps':maps,'arts':len(arts),'con_summary':{k:{'defines':len(v['defines']),'declarations':len(v['declarations']),'executable':False} for k,v in cons.items()}}
        packed=base64.b64encode(zlib.compress(data,6)).decode('ascii')
        entries.append({'name':game,'packed':packed,'rawBytes':len(data),'compressedBytes':len(packed)*3//4})
        stats[game]=cons
    if not entries:raise RuntimeError('no GRP input given')
    hdr=ROOT/'source-tree'/'source'/'duke3d'/'src'/'names.h'
    if not hdr.exists():hdr=Path(args.source)/'source/duke3d/src/names.h'
    symbols=transpile_constants(hdr) if hdr.exists() else {}
    script="\n".join((ROOT/'web'/n).read_text() for n in ('compiled_engine_crc32.js','software_renderer.js','runner.js'))
    # Guard against accidental reliance on network imports.
    if re.search(r'\b(import\s+\S+\s+from|fetch\s*\(|https?://)',script):
        raise RuntimeError('runner references network/import')
    html=(ROOT/'web'/'template.html').read_text()
    scripts='\n'.join(f'<script type="text/plain" id="grp-{i}">{d["packed"]}</script>' for i,d in enumerate(entries))
    configs=[{k:v for k,v in e.items() if k!='packed'} for e in entries]
    html=html.replace('/*__BUNDLE__PLACEHOLDER__*/',f'const GAME_BUNDLES={json.dumps(configs,separators=(",",":"))};\nconst SYMBOLS={json.dumps(symbols,separators=(",",":"))};')
    html=html.replace('/*__PLAYER__PLACEHOLDER__*/',script)
    html=html.replace('<!--__GAME_ASSETS__-->',scripts)
    out=Path(args.out);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(html,encoding='utf-8')
    report={'status':'partial-native-js-reconstruction','eduke32_cpp_transpiled':False,'llvm_ir_to_js_functions':['Bcrc32','initcrc32table','fix16_add','fix16_sub','fix16_sadd','fix16_ssub','fix16_mul','fix16_smul','fix16_lerp8','fix16_lerp16','fix16_lerp32'],'sources_used':'EDuke32 source-defined tile symbols, original Build archives, and 11 original C++ math/CRC32 utility functions compiled from LLVM IR','content':meta,'symbols_extracted':len(symbols),'c_and_cpp_gameplay_functions_transpiled':0,'c_and_cpp_utility_functions_transpiled':11,'con_commands_executed':0,'renderer':'native WebGL2 textured mesh renderer, Canvas2D software fallback' ,'limitations':['Not EDuke32 source-to-source conversion','CON game logic is not executed','Dynamic geometry, CON actor scripts, slopes and mirror rendering incomplete','Effects, menu scripting, co-op and full audio not implemented'],'generated_html':str(out),'total_html_bytes':out.stat().st_size}
    rp=out.parent/'reconstruction-report.json';rp.write_text(json.dumps(report,indent=2))
    if args.dump_con:(out.parent/'con-index.json').write_text(json.dumps(stats,indent=2))
    print(json.dumps({'html':str(out),'bytes':out.stat().st_size,'maps':{k:len(v['maps']) for k,v in meta.items()},'symbols':len(symbols),'status':report['status']},indent=2))

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--duke',type=Path,help='DUKE3D.GRP')
    ap.add_argument('--shadow',type=Path,help='SW.GRP')
    ap.add_argument('--source',type=Path,default=ROOT/'source-tree')
    ap.add_argument('--out',default=str(ROOT/'dist'/'index.html'))
    ap.add_argument('--dump-con',action='store_true')
    build(ap.parse_args())
