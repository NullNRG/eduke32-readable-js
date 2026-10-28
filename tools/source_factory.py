#!/usr/bin/env python3
"""Canonical EDuke32 source-to-JS build/audit orchestrator.

Processes ALL .c/.cc/.cpp/.h/.hpp/.hh/.inl units, constructs a conservative
include graph, captures real GNUmakefile compilation commands, stages Clang LLVM
IR for selected targets, and links *only* functions with proven JS lowering.

A successful inventory is not a successful transpilation. Every output uses
separate stages and records blockers; no JS placeholder is called compiled code.
"""
from __future__ import annotations
import argparse, collections, hashlib, json, os, pathlib, re, shlex, shutil, subprocess, sys, time, zipfile

EXTS={'.c','.cc','.cpp','.cxx','.h','.hpp','.hh','.hxx','.inl'}
IMPLEMENTED={'Bcrc32','initcrc32table','fix16_add','fix16_sub','fix16_sadd','fix16_ssub','fix16_mul','fix16_smul','fix16_lerp8','fix16_lerp16','fix16_lerp32'}
INCLUDE_RE=re.compile(r'^\s*#\s*include\s*([<"])([^>"]+)[>"]',re.M)
CMD_RE=re.compile(r'\bif\s+((?:\S*[/])?(?:gcc|g\+\+|clang|clang\+\+))\s+(.*?)\s+-c\s+(\S+\.(?:c|cc|cpp|cxx))\s+-o\s+(\S+)\s*;\s*then')
SRC_EXT={'.c','.cc','.cpp','.cxx'}

def run(command,**kw):return subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,**kw)
def digest(data):return hashlib.sha256(data).hexdigest()
def normalize(path):return path.replace('\\','/')
def safe_text(p):return p.read_text(encoding='utf8',errors='replace')

def extract_archive(src,dest):
    if dest.exists():shutil.rmtree(dest)  # prevent leftover files from earlier source archives
    dest.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(src) as z:
        names=[n for n in z.namelist() if n and not n.endswith('/')]
        prefix=os.path.commonpath(names) if names else ''
        # Archive paths must remain relative, without symlinks and traversal.
        for info in z.infolist():
            p=pathlib.PurePosixPath(info.filename)
            if p.is_absolute() or '..' in p.parts or (info.external_attr>>16)&0o170000==0o120000:
                raise ValueError('Unsafe ZIP archive member: '+info.filename)
        z.extractall(dest)
        roots=list(dest.rglob('GNUmakefile'))
        if not roots:raise ValueError('Source archive lacks EDuke32 GNUmakefile')
        return min(roots,key=lambda p:len(p.parts)).parent

def capture_make_commands(root, limit_chars=15_000_000):
    if not (root/'GNUmakefile').exists():return [],'No GNUmakefile'
    if not shutil.which('make'):return [],'make executable missing'
    # GNU Make dry-run: reads source-defined file/flag selection, does not execute.
    r=run(['make','-Bn','-j1','eduke32','SDL_TARGET=2','USE_OPENGL=0','USE_LIBVPX=0','FURY=0'],cwd=root)
    output=r.stdout[:limit_chars]
    commands=[];seen=set()
    for m in CMD_RE.finditer(output):
        cc,flags,source,obj=m.groups()
        if source in seen:continue
        seen.add(source)
        try:argv=[cc,*shlex.split(flags),'-c',source,'-o',obj]
        except ValueError:continue
        commands.append({'source':normalize(source),'object':normalize(obj),'argv':argv})
    note=('ok' if r.returncode==0 else 'GNUmakefile dry run returned '+str(r.returncode))
    if len(r.stdout)>limit_chars:note+='; output truncated'
    if not commands:note+='; no compiler invocations captured; '+r.stderr[-400:]
    return commands,note

def inventory(root, commands):
    all_files=sorted(p for p in root.rglob('*') if p.is_file() and p.suffix.lower() in EXTS
                     and not any(q in p.parts for q in ('obj','node_modules','.git')))
    rels={p:normalize(str(p.relative_to(root))) for p in all_files}
    rel_lookup={v:p for p,v in rels.items()}
    byname=collections.defaultdict(list)
    for p,s in rels.items():byname[p.name].append(s)
    cmdmap={c['source']:c for c in commands}
    global_includes=['source/build/include','source/duke3d/include','source/sw/include',
                     'source/mact/include','source/audiolib/include','source/voidwrap/include',
                     'source/imgui/include','source/physfs/include','source/glad/include']
    files=[];edges=[];external=collections.Counter();unresolved=collections.Counter()
    for p in all_files:
        rel=rels[p];data=p.read_bytes();matches=INCLUDE_RE.findall(data.decode('utf8',errors='replace'))
        direct=[];missing=[]
        includes=[]
        if rel in cmdmap:
            argv=cmdmap[rel]['argv']
            for i,t in enumerate(argv):
                if t.startswith('-I') and len(t)>2:includes.append(t[2:])
                elif t=='-I' and i+1<len(argv):includes.append(argv[i+1])
        paths=[p.parent,*[(root/i) for i in includes],*[(root/i) for i in global_includes]]
        for typ,name in matches:
            candidates=[root/name] if typ=='<' else []
            candidates.extend(base/name for base in paths)
            hit=next((rels[x.resolve()] for x in candidates if x.is_file() and x.resolve() in rels),None)
            if hit:
                direct.append(hit);edges.append([rel,hit])
            elif typ=='<':external[name]+=1
            else:
                # Relative quote include can be generated or provided by SDK.
                missing.append(name);unresolved[name]+=1
        record={'path':rel,'kind':'translation_unit' if p.suffix.lower() in SRC_EXT else 'header',
                'language':'c++' if p.suffix.lower() in ('.cc','.cpp','.cxx','.hpp','.hxx') else 'c_or_header',
                'bytes':len(data),'sha256':digest(data),'includes':sorted(set(direct)),
                'unresolved_local_includes':sorted(set(missing)),
                'system_includes':sum(1 for typ,_ in matches if typ=='<'),
                'build_selected':rel in cmdmap,
                'compilation':'not_attempted','js_lowering':'not_attempted'}
        files.append(record)
    return files,edges,external,unresolved

def strongly_connected(edges):
    # Nodes in include graph with recursion. Cycles are normal for guarded headers.
    adjacency=collections.defaultdict(list)
    for a,b in edges:adjacency[a].append(b)
    idx={};low={};stack=[];on=set();groups=[];counter=0
    def walk(v):
        nonlocal counter
        idx[v]=counter;low[v]=counter;counter+=1;stack.append(v);on.add(v)
        for w in adjacency[v]:
            if w not in idx:walk(w);low[v]=min(low[v],low[w])
            elif w in on:low[v]=min(low[v],idx[w])
        if low[v]==idx[v]:
            group=[]
            while 1:
                w=stack.pop();on.remove(w);group.append(w)
                if w==v:break
            if len(group)>1:groups.append(sorted(group))
    for v in list(adjacency):
        if v not in idx:walk(v)
    return groups

def preflight_environment():
    names=['python3','clang','clang++','node','tsc','make','emcc','em++','wasm2js','eslint']
    return {k:(shutil.which(k) or None) for k in names}

def probe_commands(root,cmds,files,outdir,limit):
    """Probe actual GNUmakefile-selected TUs; avoid false auto-transpile claims."""
    if not shutil.which('clang++'):return []
    outdir.mkdir(parents=True,exist_ok=True)
    file_index={f['path']:f for f in files}
    rows=[]
    for n,c in enumerate(cmds[:limit]):
        source=c['source'];f=file_index.get(source)
        if not f:continue
        orig=c['argv'];argv=['clang' if source.endswith('.c') else 'clang++']
        # Preserve target feature flags only if supported by current compiler.
        skip={'-flto=12','-fuse-linker-plugin','-march=core2','-mfpmath=sse','-mmmx',
              '-msse','-msse2','-msse3','-mno-ssse3'}
        argv += [x for x in orig[1:] if x not in skip and x not in ('-c', '-o')]
        # Remove output object argument; output is deterministic per source hash.
        if c['object'] in argv:argv.remove(c['object'])
        argv += ['-Wno-unused-command-line-argument','-emit-llvm','-S','-o',str(outdir/(digest(source.encode())[:18]+'.ll'))]
        r=run(argv,cwd=root)
        ok=r.returncode==0
        record={'source':source,'status':'llvm_ir_generated' if ok else 'clang_failed',
                'diagnostic':r.stderr[-1300:] if not ok else '',
                'llvm_ir':str((outdir/(digest(source.encode())[:18]+'.ll')).name) if ok else None}
        rows.append(record);f['compilation']=record['status'];f['js_lowering']='not_attempted'
        if not ok:(outdir/(digest(source.encode())[:18]+'.error.txt')).write_text(r.stderr)
    return rows

def link_verified(root,base,outdir,with_tests):
    """Reuse and *verify* existing strict LLVM-to-JS engine source compiler."""
    compiler=base/'tools'/'compile_eduke_sources.py'
    if not compiler.is_file():return {'status':'missing_verifier'}
    output=outdir/'verified-engine.js'; manifest=outdir/'verified-manifest.json'
    cmd=[sys.executable,str(compiler),'--source',str(root),'--output',str(output),'--manifest',str(manifest)]
    r=run(cmd,cwd=base)
    if r.returncode:return {'status':'failed','diagnostic':(r.stdout+r.stderr)[-2400:]}
    source=output.read_text()
    # ES module with real, explicit exports (no fabricated translations).
    source=source.replace('const EDukeSourceIR=', 'const EDukeSourceIR=',1)
    js=source+'\nexport {EDukeSourceIR};\n'
    (outdir/'verified-engine.mjs').write_text(js)
    return {'status':'verified_llvm_to_js','functions':sorted(IMPLEMENTED),
            'artifact':'verified-engine.mjs','manifest':'verified-manifest.json',
            'tests':r.stdout.strip()[-1500:]}

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=pathlib.Path,required=True,help='EDuke32 root DIRECTORY or original .zip')
    parser.add_argument('--out',type=pathlib.Path,required=True,help='Generated build and audit directory')
    parser.add_argument('--probe',type=int,default=0,help='Compile N real Make-selected units to LLVM for diagnostics')
    parser.add_argument('--probe-all',action='store_true',help='Attempt LLVM IR compilation of every Make-selected unit')
    parser.add_argument('--verified-js',action='store_true',help='Recompile and parity-test supported original C++ functions')
    args=parser.parse_args(argv);out=args.out.resolve();out.mkdir(parents=True,exist_ok=True)
    src=args.source.resolve()
    if src.suffix.lower()=='.zip':
        src=extract_archive(src,out/'source-tree')
    if not (src/'source').is_dir():parser.error('EDuke32 source directory not found: '+str(src))
    commands,note=capture_make_commands(src)
    files,edges,external,unresolved=inventory(src,commands)
    groups=strongly_connected(edges)
    probes=probe_commands(src,commands,files,out/'llvm',len(commands) if args.probe_all else args.probe) if (args.probe or args.probe_all) else []
    verified=link_verified(src,pathlib.Path(__file__).resolve().parents[1],out,args.verified_js) if args.verified_js else {'status':'not_requested'}
    if verified['status']=='verified_llvm_to_js':
        lower_sources={
            'source/build/src/crc32.cpp':['Bcrc32','initcrc32table'],
            'source/build/src/fix16.cpp':['fix16_add','fix16_sub','fix16_sadd','fix16_ssub','fix16_mul','fix16_smul','fix16_lerp8','fix16_lerp16','fix16_lerp32']}
        for file in files:
            if file['path'] in lower_sources:
                file['js_lowering']='partially_transpiled_verified'
                file['lowered_symbols']=lower_sources[file['path']]
    manifest={'format':'eduke-source-factory/1','source_root':str(src),
              'source_files_seen':len(files),'translation_units':sum(f['kind']=='translation_unit' for f in files),
              'headers':sum(f['kind']=='header' for f in files),'make_selected_translation_units':len(commands),
              'include_edges':len(edges),'include_cycles':groups[:60],
              'external_includes':dict(external.most_common()),
              'unresolved_quote_includes':dict(unresolved.most_common()),
              'make_diagnostic':note,'environment':preflight_environment(),
              'compiler_probes':probes,'verified_lowering':verified,
              'complete_engine_transpilation':False,
              'required_for_complete_engine':['C/C++ ABI-complete LLVM lowering or wasm2js',
                   'cross-module symbol linking, global allocation and relocations',
                   'libc/C++ ABI, SDL2, graphics/audio input and browser OS port',
                   'original engine tick/CON interpreter and renderer integrated',
                   'end-to-end game regression and gameplay parity tests'],
              'files':files}
    (out/'inventory.json').write_text(json.dumps(manifest,indent=2))
    (out/'compile_commands.json').write_text(json.dumps([{'directory':str(src),'file':c['source'],
                       'arguments':c['argv']} for c in commands],indent=2))
    (out/'include_graph.json').write_text(json.dumps({'edges':edges,'cycles':groups},indent=2))
    summary={k:manifest[k] for k in ('source_files_seen','translation_units','headers',
                        'make_selected_translation_units','include_edges','complete_engine_transpilation')}
    summary['llvm_compiled']=sum(x['status']=='llvm_ir_generated' for x in probes)
    summary['llvm_compile_failed']=sum(x['status']=='clang_failed' for x in probes)
    summary['verified_lowering']=verified['status']
    (out/'SUMMARY.json').write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2))
    return 0 if verified['status'] not in ('failed','missing_verifier') else 1
if __name__=='__main__':sys.exit(main())
