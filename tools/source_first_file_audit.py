#!/usr/bin/env python3
"""Exhaustive, provenance-preserving audit of EVERY file in the supplied source trees.

This is a source coverage and build-selection audit, NOT a claim that excluded
programs or missing C++ semantics have been compiled. Input bytes are read and
hashed for every archive member. C/C++ sources also receive a lexical include
scan, with unresolved dependencies and non-selected units reported explicitly.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import posixpath
import sys
import zipfile

ROOT=Path(__file__).resolve().parents[1]
MAIN='eduke32-master.zip'
SECONDARY='dukenukem3d-master.zip'
CODE={'.c','.cc','.cpp','.cxx','.m','.mm','.s','.asm'}
HEADERS={'.h','.hpp','.hh','.hxx','.inc'}
ASSETS={'.grp','.png','.bmp','.ico','.icns','.psd','.xcf','.svg','.glsl','.con','.def','.map','.dat','.vox','.mid','.wav','.ogg','.flac','.mp3','.a','.lib','.dll','.exe','.obj','.m32'}
INCLUDE = re.compile(rb'^[ \t]*\#[ \t]*(?:include|include_next)[ \t]*([<\"])([^>\"\r\n]+)[>\"]', re.M)
LANGUAGE_HINTS={'source/sw/':'different game target (Shadow Warrior)',
                'source/kenbuild/':'separate game/editor target (KenBuild)',
                'source/tools/':'auxiliary tool target',
                'platform/Windows/':'Windows-only source',
                'source/duke3d/rsrc/':'resource/icon source (unselected)',
                'source/build/src/':'Build engine alternate or editor module (not selected)',
                'source/audiolib/src/':'optional audio backend (not selected)',
                'source/mimalloc/src/':'optional allocator implementation (not selected)'}

def safe_relative(name: str, root_prefix: str) -> str:
    if not name.startswith(root_prefix):
        raise ValueError(f'archive member outside expected root: {name}')
    relative=name[len(root_prefix):]
    p=PurePosixPath(relative)
    if not relative or p.is_absolute() or '..' in p.parts or '\\' in relative:
        raise ValueError(f'unsafe source file path: {name}')
    return relative

def categorize(rel: str) -> str:
    ext=PurePosixPath(rel).suffix.lower()
    if ext in CODE:return 'translation-candidate'
    if ext in HEADERS:return 'header-or-include'
    if ext in ASSETS:return 'asset-or-precompiled-binary'
    return 'build-config-doc-or-other'

def scan(archive: Path, selected: set[str], source_root: Path | None=None, do_content:bool=True):
    root_prefix=archive.stem+'/'
    files=[]; found=set(); lexical={}; errors=[]
    with zipfile.ZipFile(archive) as z:
        for info in z.infolist():
            if info.is_dir():continue
            rel=safe_relative(info.filename,root_prefix)
            if rel in found:raise ValueError(f'duplicate archive path: {rel}')
            found.add(rel)
            data=z.read(info)
            digest=hashlib.sha256(data).hexdigest()
            kind=categorize(rel)
            status=('make-selected' if rel in selected else 'not-selected-by-captured-make' if kind=='translation-candidate' else 'header-indirect' if kind=='header-or-include' else 'data-or-metadata')
            row={'path':rel,'kind':kind,'build_status':status,'size':len(data),'sha256':digest}
            if status=='not-selected-by-captured-make':
                row['exclusion']='not in captured compile_commands.json'
                row['possible_target']=next((v for k,v in LANGUAGE_HINTS.items() if rel.startswith(k)),'unknown target/conditional compilation; inspect Make rules')
            if do_content and kind in ('translation-candidate','header-or-include'):
                inc=[]
                for m in INCLUDE.finditer(data):
                    try:
                        target=m.group(2).decode('utf-8')
                    except UnicodeDecodeError:target=m.group(2).decode('latin-1')
                    inc.append({'name':target,'quoted':m.group(1)==b'"'})
                lexical[rel]=inc
                row['lexical_lines']=data.count(b'\n')+(1 if data and not data.endswith(b'\n') else 0)
                row['preprocessor_includes']=len(inc)
            if source_root is not None:
                extracted=source_root/rel
                if extracted.is_file():
                    if extracted.stat().st_size!=len(data):
                        errors.append({'path':rel,'error':'extracted size differs from original archive'})
                    elif hashlib.sha256(extracted.read_bytes()).hexdigest()!=digest:
                        errors.append({'path':rel,'error':'extracted content differs from original archive'})
                    row['extracted_verified']=not any(x['path']==rel for x in errors)
                else:
                    row['extracted_verified']=False
                    errors.append({'path':rel,'error':'original source file is missing from extracted source tree'})
            files.append(row)
    return files,lexical,errors,found

def resolve_local_includes(files,lexical,compile_commands):
    """Lexical includes are evidence, not a compiler preprocessor or proof of ABI."""
    paths={r['path'] for r in files}
    include_paths=set()
    for cmd in compile_commands:
        args=cmd.get('arguments',[])
        for i,arg in enumerate(args):
            if arg.startswith('-I') and len(arg)>2:include_paths.add(arg[2:])
            elif arg=='-I' and i+1<len(args):include_paths.add(args[i+1])
    resolved=0;system=0;unresolved=[];edges=[]
    for file,refs in lexical.items():
        for ref in refs:
            name=ref['name']
            options=[posixpath.normpath(str(PurePosixPath(file).parent /name))]
            options.extend(posixpath.normpath(str(PurePosixPath(prefix)/name)) for prefix in sorted(include_paths))
            # Preserve explicitly root-qualified imports (if any).
            options.append(name)
            match=next((p for p in options if p in paths),None)
            if match:
                edges.append({'from':file,'to':match});resolved+=1
            elif not ref['quoted']:
                system+=1
            else:
                unresolved.append({'source':file,'include':name,'classification':'quoted header not resolved by original captured include paths'})
    return {'source_include_edges':edges,
            'resolved_local':resolved,'system_or_external_angle_includes':system,
            'unresolved_quoted_includes':unresolved,
            'include_paths':sorted(include_paths)}

def report(root=ROOT, source_archive=None, second_archive=None, commands_path=None, verify_extracted=True):
    root=Path(root).resolve()
    primary=source_archive or root/'input-source'/MAIN
    secondary=second_archive or root/'input-source'/SECONDARY
    commands_path=commands_path or root/'factory-output/compile_commands.json'
    commands=json.loads(Path(commands_path).read_text())
    if any(not isinstance(r,dict) or 'file' not in r for r in commands):
        raise ValueError('malformed original compile_commands.json')
    selected=[r['file'] for r in commands]
    if len(set(selected))!=len(selected):raise ValueError('duplicate Make-selected translation units')
    source_root=root/'factory-output/source-tree/eduke32-master' if verify_extracted else None
    eduke,lex,errors,original=scan(Path(primary),set(selected),source_root)
    duke,duke_lex,duke_err,duke_names=scan(Path(secondary),set(),None)
    original_selected=set(selected)&original
    generated=set(selected)-original
    # Never silently treat a generated unit as a source archive member.
    makefile=(source_root/'GNUmakefile') if source_root else None
    known_rule=(makefile and makefile.is_file() and 'shader' in makefile.read_text(errors='replace'))
    allowed_generated={name for name in generated if name.startswith('obj/build/') and name.endswith('.glsl.cpp') and known_rule}
    unknown=generated-allowed_generated
    for name in sorted(unknown):errors.append({'path':name,'error':'selected source absent from archive and lacks verified original Make generation rule'})
    for name in sorted(allowed_generated):
        p=source_root/name if source_root else None
        if p is None or not p.is_file():errors.append({'path':name,'error':'Make-generated source unavailable in extracted build tree'})
    selected_rows=[r for r in eduke if r['build_status']=='make-selected']
    exclusions=[r for r in eduke if r['build_status']=='not-selected-by-captured-make']
    graph=resolve_local_includes(eduke,lex,commands)
    metrics={'primary_archive_files_examined':len(eduke),'secondary_archive_files_examined':len(duke),
        'all_archived_source_files_examined':len(eduke)+len(duke),
        'primary_translation_candidates':sum(r['kind']=='translation-candidate' for r in eduke),
        'primary_headers':sum(r['kind']=='header-or-include' for r in eduke),
        'primary_other_files':sum(r['kind'] not in ('translation-candidate','header-or-include') for r in eduke),
        'make_selected_units':len(selected),'make_selected_original_units_found':len(original_selected),
        'generated_make_units_with_source_rule':len(allowed_generated),
        'original_translation_candidates_not_selected_by_make':len(exclusions),
        'lexically_inspected_primary_source_and_headers':len(lex),
        'lexically_inspected_secondary_source_and_headers':len(duke_lex),
        'local_include_edges':graph['resolved_local'],
        'quoted_includes_needing_investigation':len(graph['unresolved_quoted_includes']),
        'archive_extraction_errors':len(errors)}
    return {'format':'source-first-all-files-audit/1',
        'scope':'Exhaustive original archive byte verification, lexical dependency inspection, and captured Make build selection. NOT a full compilation or proof of runtime correctness.',
        'original_make_build_configuration':'saved source-first compile_commands.json, one particular EDuke32 platform/target profile',
        'metrics':metrics,
        'all_eduke_source_entries':eduke,
        'all_second_source_entries':duke,
        'unselected_translation_candidates':[{'source':r['path'],'possible_target':r['possible_target'],'reason':r['exclusion']} for r in exclusions],
        'missing_selected_sources':sorted(generated),
        'generated_source_with_verified_make_rule':sorted(allowed_generated),
        'unknown_selected_sources':sorted(unknown),
        'local_include_graph':graph,
        'extraction_and_selection_errors':errors,
        'full_game_transpilation_complete':False,
        'browser_boot_verified':False}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,default=ROOT/'factory-output/source-first/all-files-audit.json')
    parser.add_argument('--no-extracted-check',action='store_true')
    parser.add_argument('--project-archive',type=Path,help='optional ORIGINAL supplied project ZIP: hash and inventory every outer member')
    parser.add_argument('--strict',action='store_true',help='fail for missing/mismatched source files or unknown selected Make units')
    args=parser.parse_args()
    doc=report(verify_extracted=not args.no_extracted_check)
    if args.project_archive:
        entries=[]
        with zipfile.ZipFile(args.project_archive) as project_zip:
            for info in project_zip.infolist():
                if info.is_dir():continue
                h=hashlib.sha256()
                with project_zip.open(info) as stream:
                    for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
                entries.append({'path':info.filename,'size':info.file_size,'sha256':h.hexdigest()})
        doc['input_project_archive']={'name':args.project_archive.name,'files_examined':len(entries),'members':entries}
        doc['metrics']['outer_project_archive_files_examined']=len(entries)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(doc,indent=2))
    print(json.dumps({'metrics':doc['metrics'],'first_extraction_errors':doc['extraction_and_selection_errors'][:10],
                      'unselected_sample':doc['unselected_translation_candidates'][:5]},indent=2))
    return 2 if args.strict and doc['extraction_and_selection_errors'] else 0
if __name__=='__main__':sys.exit(main())
