#!/usr/bin/env python3
"""Consolidate proven source-first batches and recover cross-batch dependencies.

This is an ordinary ES-module linker and incremental AST recovery pass, NOT an
LLVM fallback, symbol-stub generator, or an assertion of game completeness.
Only declarations whose source-level semantic lowering succeeded may be used
as import providers. Relink affected units until the export set reaches a
fixed point; every emitted import and JS module is checked before acceptance.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
from collections import Counter, defaultdict
from functools import lru_cache
import hashlib
from source_ast_to_js import js_ident, GLOBAL_STORAGE_ABI, global_storage_binding, PRIVATE_STORAGE_ABI, private_storage_binding
from source_first_toolchain import fingerprint_toolchain
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
FRONT=ROOT/'tools/source_ast_to_js.py'
IDENT=re.compile(r'^[A-Za-z_$][\w$]*$')
EXPORT=re.compile(r'^export\s+(?:(?:async)\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)\b',re.MULTILINE)

def exported_names(file, _chain=frozenset()):
    file=file.resolve()
    if not file.is_file() or file in _chain:return set()
    content=file.read_text(encoding='utf-8');result=set(EXPORT.findall(content))
    # Source fragments preserve globals in immutable neighboring shards.
    # Follow explicit exports only when every binding exists in that shard;
    # a manifest's claim or a missing/out-of-directory module is insufficient.
    for group,relative in re.findall(r'^export\s*\{([^}]*)\}\s*from\s*["\'](\./_source_(?:legacy|storage)_[^"\']+)["\'];?$',content,re.M):
        target=(file.parent/relative).resolve()
        if target.parent!=file.parent:continue
        names={part.strip() for part in group.split(',')}
        if names and all(IDENT.fullmatch(name) for name in names) and names<=exported_names(target,_chain|{file}):
            result.update(names)
    return result

def missing_exports(names, file):
    defined=exported_names(file)
    return {name for name in names if js_ident(name) not in defined}

def storage_import_error(dependency,units):
    actual_provider=units.get(dependency['from'])
    if actual_provider:
        actual_rows=[row for row in actual_provider['manifest']['definitions']
                     if row['name']==dependency['name'] and row['status']=='source-first']
        if len(actual_rows)==1:
            actual=actual_rows[0]
            if actual.get('cpp_reference_contract') and not dependency.get('reference_contract'):
                return 'C++ reference-call consumer lacks source calling contract'
            if actual.get('cpp_reference_required') and not dependency.get('reference_class_abi'):
                return 'C++ reference-class consumer lacks source alias ABI'
    reference_class=dependency.get('reference_class_abi')
    if reference_class is not None:
        provider=units.get(dependency['from'])
        if not provider:return 'C++ reference-class provider missing'
        rows=[row for row in provider['manifest']['definitions']
              if row['name']==dependency['name'] and row['status']=='source-first']
        if len(rows)!=1 or rows[0].get('cpp_reference_abi')!=reference_class:
            return 'C++ reference-class provider lacks source alias ABI'
        if not provider.get('module') or dependency['name'] not in exported_names(provider['module']):
            return 'C++ reference-class absent from actual provider JavaScript'
    contract=dependency.get('reference_contract')
    if contract is not None:
        provider=units.get(dependency['from'])
        if not provider:return 'C++ reference-call provider missing'
        rows=[row for row in provider['manifest']['definitions']
              if row['name']==dependency['name'] and row['status']=='source-first']
        if len(rows)!=1 or rows[0].get('cpp_reference_contract')!=contract:
            return 'C++ reference-call provider lacks identical source calling contract'
        if not provider.get('module') or dependency['name'] not in exported_names(provider['module']):
            return 'C++ reference-call absent from actual provider JavaScript'
    """Prove supplementary lvalue ABI exports without counting them as C code."""
    if dependency.get('abi')==PRIVATE_STORAGE_ABI:
        name=dependency['name'];source=dependency['from'];provider=units.get(source)
        if dependency.get('owner_source')!=source or dependency.get('consumer_source')!=source:
            return 'private storage cannot cross original translation-unit ownership'
        if dependency.get('binding')!=private_storage_binding(source,name):
            return 'private storage address identity differs from original owner'
        if not provider or provider['manifest'].get('source')!=source:return 'private storage owner missing'
        rows=[r for r in provider['manifest'].get('definitions',[]) if r.get('name')==name and r.get('status')=='source-first']
        if len(rows)!=1 or rows[0].get('linkage')!='internal':return 'private storage original internal definition unproven'
        metadata={key:dependency.get(key) for key in ('abi','binding','owner_source','original_type')}
        if 'scalar_array' in dependency:metadata['scalar_array']=dependency['scalar_array']
        if 'byte_record' in dependency:metadata['byte_record']=dependency['byte_record']
        if rows[0].get('private_storage')!=metadata:return 'private storage provider contract differs'
        if {'name':name,**metadata} not in provider['manifest'].get('private_storage_exports',[]):
            return 'private storage export absent from provider manifest'
        if not provider.get('module') or dependency['binding'] not in exported_names(provider['module']):
            return 'private storage address absent from actual provider JavaScript'
        return None
    if dependency.get('abi')=='source-byte-record-array/1':
        name=dependency['name'];provider=units.get(dependency['from'])
        if not provider:return 'record array storage provider missing'
        rows=[row for row in provider['manifest']['definitions'] if row['name']==name and row['status']=='source-first']
        if len(rows)!=1:return 'record array original definition unproven'
        metadata=rows[0].get('object_storage',{})
        if metadata.get('abi')!='source-byte-record-array/1' or any(dependency.get(key)!=metadata.get(key) for key in ('stride','schema_sha256')):
            return 'record array provider lacks identical contiguous Clang storage'
        dimensions=dependency.get('dimensions',[]);actual=metadata.get('dimensions',[])
        if len(dimensions)!=len(actual) or any(a is not None and a!=b for a,b in zip(dimensions,actual)):
            return 'record array dimensions differ across translation units'
        if not provider.get('module') or js_ident(name) not in exported_names(provider['module']):
            return 'record array absent from actual provider JavaScript'
        return None
    if dependency.get('abi')=='source-pointer-array/1':
        name=dependency['name'];provider=units.get(dependency['from'])
        if not provider:return 'pointer array storage provider missing'
        rows=[row for row in provider['manifest']['definitions']
            if row['name']==name and row['status']=='source-first']
        if len(rows)!=1:return 'pointer array original definition unproven'
        metadata=rows[0].get('object_storage',{})
        if metadata.get('abi')!='source-pointer-array/1' or metadata.get('stride')!=8:
            return 'pointer array provider lacks contiguous LP64 pointer storage'
        if dependency.get('element_declaration')!=metadata.get('element_declaration'):
            return 'pointer array element type differs across translation units'
        if dependency.get('extent') is not None and dependency['extent']!=metadata.get('extent'):
            return 'pointer array extent differs across translation units'
        if not provider.get('module') or js_ident(name) not in exported_names(provider['module']):
            return 'pointer array absent from actual provider JavaScript'
        return None
    binding=dependency.get('binding')
    if binding is None:return None
    name=dependency['name'];provider=units.get(dependency['from'])
    if dependency.get('abi')!=GLOBAL_STORAGE_ABI or binding!=global_storage_binding(name):
        return 'unrecognized global storage binding ABI'
    if not provider:return 'global storage provider missing'
    manifest=provider['manifest']
    definitions=[d for d in manifest['definitions'] if d['name']==name and d['status']=='source-first']
    if len(definitions)!=1:return 'global storage original definition unproven'
    metadata=definitions[0].get('global_storage',{})
    if metadata.get('binding')!=binding or metadata.get('abi')!=GLOBAL_STORAGE_ABI:
        return 'global storage provider metadata missing or mismatched'
    if dependency.get('original_type')!=metadata.get('original_type'):
        return 'global storage declaration type differs across translation units'
    if dependency.get('record_layout_sha256')!=metadata.get('record_layout_sha256'):
        return 'global record address target layout differs across translation units'
    if dependency.get('byte_record_schema_sha256')!=metadata.get('byte_record_schema_sha256'):
        return 'global record provider lacks identical Clang byte representation'
    if not any(d.get('name')==name and d.get('binding')==binding and d.get('abi')==GLOBAL_STORAGE_ABI
               for d in manifest.get('storage_exports',[])):
        return 'global storage export absent from provider manifest'
    if not provider.get('module') or binding not in exported_names(provider['module']):
        return 'global storage binding absent from actual provider JavaScript'
    return None

def write_json(path, obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    stage=path.with_suffix(path.suffix+'.partial')
    stage.write_text(json.dumps(obj,sort_keys=True,indent=2),encoding='utf-8')
    os.replace(stage,path)

def gather_batches(directory):
    from source_first_automate import portable_relative,batch_artifacts_match
    report=json.loads((directory/'recovery-report.json').read_text())
    found={}
    duplicates=[]
    for row in report['batch_results']:
        if row['status']!='ok':continue
        relative=portable_relative(row['manifest'])
        batch_manifest=directory/relative
        if not batch_manifest.is_file():raise ValueError('missing verified batch manifest: '+str(batch_manifest))
        if row.get('artifact_hashes') is not None:
            if not batch_artifacts_match(batch_manifest.parent,batch_manifest,row['artifact_hashes']):
                raise ValueError('verified batch artifacts changed: '+str(relative))
        batch=json.loads(batch_manifest.read_text())
        for item in batch['units']:
            source=item['source']
            mod=batch_manifest.parent/Path(str(portable_relative(source))+'.mjs')
            manifest=mod.with_suffix('.manifest.json')
            if not manifest.is_file():raise ValueError('missing source manifest: '+str(manifest))
            if source in found:
                duplicates.append(source);continue
            found[source]={'manifest':json.loads(manifest.read_text()),'module':mod if mod.is_file() else None}
    if duplicates:raise ValueError('duplicate source units across verified batches: '+str(duplicates))
    return report,found

def canonical_header_inline_owner(units,name,sources):
    """Resolve Clang-proven *identical* C++ ODR inline definitions.

    Repeated header friend bodies may legally appear in distinct TUs. Require
    the same original header path, physical offset, class, signature and
    normalized Clang AST digest in ALL candidates. If any evidence disagrees,
    preserve the ambiguity instead of pretending one definition is valid.
    """
    evidence=[]
    for source in sources:
        rows=[d for d in units[source]['manifest']['definitions']
              if d['name']==name and (d['status']=='source-first' or
                  d.get('reason','').startswith('unlinked identifiers:'))]
        if len(rows)!=1:return None
        record=rows[0].get('odr_inline')
        if not record or not all(record.get(key) for key in (
                'source_header','source_offset','enclosing_record','type','semantic_sha256')):
            return None
        evidence.append(json.dumps(record,sort_keys=True))
    return sorted(sources)[0] if len(set(evidence))==1 else None

@lru_cache(maxsize=512)
def original_source_lines(path,mtime_ns,size):
    # Legacy evidence is reused within the same linker process, never across
    # source-file mutations or compile revisions.
    return Path(path).read_text(encoding='utf-8',errors='replace').splitlines()


def internal_definition(unit, definition, source_root=None, source=None):
    """Return true ONLY with proven C/C++ translation-unit-local linkage.

    Fresh Clang manifests include `linkage`.  Old full-inventory manifests
    predate that field; their original source declaration can prove `static`
    without attributing one TU's state or functions to another TU.  The
    conservative legacy fallback accepts only a *same-line* static definition
    with an exact token match, never a guessed neighboring declaration.
    """
    linkage=definition.get('linkage')
    if linkage in ('internal','external'):
        return linkage=='internal'
    if not source_root or not source or definition.get('kind') not in ('VarDecl','FunctionDecl'):
        return False
    line=definition.get('line');name=definition.get('source_name')
    if not isinstance(line,int) or line<1 or not isinstance(name,str) or not name:
        return False
    path=(Path(source_root)/source).resolve()
    try:
        path.relative_to(Path(source_root).resolve())
        stat=path.stat()
        lines=original_source_lines(str(path),stat.st_mtime_ns,stat.st_size)
        fragment=lines[line-1].split('//',1)[0]
    except (OSError,IndexError,ValueError):return False
    return bool(re.search(r'\bstatic\b[^;{}]*\b'+re.escape(name)+r'\b',fragment))


def public_definitions(units,source_root=None):
    for source,unit in units.items():
        for d in unit['manifest']['definitions']:
            if not internal_definition(unit,d,source_root,source):
                yield source,d

def ownership(units,source_root=None):
    owners=defaultdict(set)
    for source,definition in public_definitions(units,source_root):
        if definition['status']=='source-first':
            owners[definition['name']].add(source)
    unique={name:next(iter(srcs)) for name,srcs in owners.items() if len(srcs)==1 and IDENT.fullmatch(name)}
    ambiguous={}
    for name,srcs in owners.items():
        if len(srcs)<2:continue
        owner=canonical_header_inline_owner(units,name,srcs)
        if owner and IDENT.fullmatch(name):unique[name]=owner
        else:ambiguous[name]=sorted(srcs)
    return unique,ambiguous

def unresolved(units):
    for source,unit in sorted(units.items()):
        for definition in unit['manifest']['definitions']:
            if definition['status']=='blocked':
                yield {'source':source,'name':definition['name'],'reason':definition.get('reason','unknown')}

def stage_modules(units,out):
    for source,unit in units.items():
        file=out/(source+'.mjs')
        mf=file.with_suffix('.manifest.json')
        mf.parent.mkdir(parents=True,exist_ok=True)
        if unit['module'] is not None:
            if unit['module'].resolve()!=file.resolve():shutil.copyfile(unit['module'],file)
        elif file.exists():file.unlink()
        write_json(mf,unit['manifest'])

def declared_ownership(units,source_root=None):
    """Tentative names must be present as actual original source definitions.

    A blocked declaration is eligible for speculative linking ONLY when its
    semantic lowering already succeeded and its remaining failure was solely
    missing imports. No speculative JS code, placeholders or unknown owners.
    """
    found=defaultdict(set)
    for source,d in public_definitions(units,source_root):
        if d['status']=='source-first' or (d['status']=='blocked' and
                d.get('reason','').startswith('unlinked identifiers:')):
            if IDENT.fullmatch(d['name']):found[d['name']].add(source)
    unique={name:next(iter(srcs)) for name,srcs in found.items() if len(srcs)==1}
    ambiguous={}
    for name,srcs in found.items():
        if len(srcs)<2:continue
        owner=canonical_header_inline_owner(units,name,srcs)
        if owner:unique[name]=owner
        else:ambiguous[name]=sorted(srcs)
    return unique,ambiguous


def settle_proposals(units, proposals,source_root=None):
    """Validate a complete cyclic set of original-source modules atomically.

    Candidate imports may refer to other candidates, but ALL imports must
    resolve to truly emitted definitions when the transaction commits. Iterate
    invalidation to a fixed point; one rejected provider rejects its callers.
    """
    pending=dict(proposals)
    rejected={}
    while pending:
        merged={**units,**pending}
        owners,ambiguous=ownership(merged,source_root)
        bad={}
        for source,unit in pending.items():
            invalid=[dep for dep in unit['manifest'].get('imports',[])
                     if dep['name'] in ambiguous or owners.get(dep['name'])!=dep['from']
                     or storage_import_error(dep,merged)]
            if invalid:bad[source]='unresolved or ambiguous original import: '+str(invalid[:4])
        if not bad:break
        for source,reason in bad.items():
            rejected[source]=reason
            pending.pop(source)
    return pending,rejected


def original_unlinked_dependencies(definition):
    """Use COMPLETE Clang-derived identifiers rather than its 12-name display.

    The legacy textual reason is intentionally truncated at 12 names. Using
    that string as the authoritative dependency list can rerun a huge source
    before another required provider exists, then reject its speculative JS.
    Never assume names past that truncation have been resolved.
    """
    if definition.get('status')!='blocked' or not definition.get('reason','').startswith('unlinked identifiers:'):
        return []
    exact=definition.get('unresolved_references')
    if isinstance(exact,list):
        if not all(isinstance(x,str) and x for x in exact):
            raise ValueError('Malformed complete original AST dependency list')
        return sorted(set(exact))
    # Older manifests predate the full list; the first 12 can be an incomplete
    # view. Fail closed for a full dozen until the Clang AST has been re-read.
    names=[x.strip() for x in definition['reason'].partition(':')[2].split(',') if x.strip()]
    return [] if len(names)>=12 else sorted(set(names))


def eligible_link_retries(units, declared, ambiguous):
    """Return only source units with a complete, uniquely owned dependency frontier."""
    ready=[]
    for source,unit in sorted(units.items()):
        for definition in unit['manifest']['definitions']:
            deps=original_unlinked_dependencies(definition)
            if deps and all(name in declared and name not in ambiguous for name in deps):
                ready.append(source)
                break
    return ready


def rank_retry_units(units, ready, declared, ambiguous):
    """Prioritize shared proven providers, not source-file name ordering.

    Rank original-source units by the fanout of their currently blocked,
    uniquely owned declarations and by current unresolved callers. This is
    scheduling only: acceptance still requires AST compilation, import proof,
    syntax checks and transactional linking.
    """
    from collections import Counter
    demand=Counter()
    for unit in units.values():
        for definition in unit['manifest']['definitions']:
            if definition['status']!='blocked':continue
            for name in original_unlinked_dependencies(definition):demand[name]+=1
    counts=Counter()
    for name, owner in declared.items():
        if name not in ambiguous:
            counts[owner]+=demand[name]
    return sorted(set(ready),key=lambda src:(-counts[src],src))


def link_input_fingerprint(directory,source_root=None,include_toolchain=True,compile_commands=None):
    """Revalidate the exact recovered compilation and compiler implementation."""
    digest=hashlib.sha256()
    if include_toolchain:fingerprint_toolchain(digest)
    sources=[directory/'recovery-report.json',Path(__file__),FRONT,
             ROOT/'tools/source_first_project.py',
             ROOT/'tools/source_first_automate.py',
             ROOT/'tools/source_first_toolchain.py',
             ROOT/'tools/source_first_missing_map.py',
             ROOT/'tools/source_ast_stream.py',
             ROOT/'tools/source_byte_records.py',
             ROOT/'tools/source_trivial_assignment.py',ROOT/'tools/source_cpp_lifetime.py',ROOT/'tools/source_cpp_lifetime_runtime.mjs',ROOT/'tools/source_header_records.py',ROOT/'tools/source_cpp_references.py',
             ROOT/'tools/source_cpp_heap.py',ROOT/'tools/source_cpp_heap_runtime.mjs',
             ROOT/'tools/source_anonymous_records.py',ROOT/'tools/source_explicit_member_operators.py',
             ROOT/'tools/source_standard_heap_contract.py',
             ROOT/'tools/source_cpp_types.py',
             ROOT/'tools/source_ast_cache_paths.py',
             ROOT/'tools/source_template_destructors.py',
             ROOT/'tools/source_static_members.py',
             ROOT/'tools/source_scalar_types.py',
             ROOT/'tools/source_ast_events.py',ROOT/'tools/source_coroutine_cfg.py',
             ROOT/'tools/source_process_runtime.mjs',
             ROOT/'tools/source_aggregate_assignment_runtime.mjs',
             ROOT/'tools/source_control_flow.py',
             ROOT/'tools/source_pointer_runtime.mjs',
             ROOT/'tools/source_pointer_span_runtime.mjs',
             ROOT/'tools/source_aggregate_runtime.mjs',
             ROOT/'tools/source_byte_memory_runtime.mjs',
             ROOT/'tools/source_variadic_runtime.mjs']
    sources.extend(sorted((ROOT/'runtime').rglob('*.mjs')))
    for path in sources:
        if not path.is_file():raise FileNotFoundError(path)
        digest.update(str(path.name).encode()+b'\0')
        digest.update(hashlib.sha256(path.read_bytes()).digest())
    # The report's expected hashes are provenance, not proof that the files
    # remain intact while linking. Recheck every published artifact at guards.
    from source_first_automate import portable_relative,portable_artifact_hashes,batch_artifact_hashes
    saved=json.loads((directory/'recovery-report.json').read_text())
    for row in saved.get('batch_results',[]):
        if row.get('status')!='ok' or row.get('artifact_hashes') is None:continue
        manifest=directory/portable_relative(row['manifest'])
        actual=batch_artifact_hashes(manifest.parent,manifest)
        if actual is None or actual!=portable_artifact_hashes(row['artifact_hashes']):
            raise ValueError('published batch artifacts changed during link: '+str(manifest))
        digest.update(json.dumps(actual,sort_keys=True).encode())
    if source_root is not None:
        # Non-header includes, generated input and captured source bytes all
        # participate. A checkpoint cannot survive changes outside retried TUs.
        for path in sorted(source_root.rglob('*')):
            if not path.is_file():continue
            digest.update(path.relative_to(source_root).as_posix().encode()+b'\0')
            with path.open('rb') as stream:
                for chunk in iter(lambda:stream.read(1024*1024),b''):digest.update(chunk)
        commands=Path(compile_commands) if compile_commands is not None else ROOT/'factory-output/compile_commands.json'
        if commands.is_file():
            digest.update(commands.read_bytes())
            from source_standard_heap_contract import contract_path
            proof=contract_path(commands)
            if proof.is_file():digest.update(proof.read_bytes())
    return digest.hexdigest()


def resume_verified_units(directory,out,units,fingerprint,source_root=None):
    state_file=out/'link-checkpoint.json'
    if not state_file.is_file():return 0
    state=json.loads(state_file.read_text())
    if state.get('fingerprint')!=fingerprint:return 0
    staged={};count=0
    for src,item in state.get('verified',{}).items():
        if src not in units:return 0
        source_module=out/(src+'.mjs')
        mf=source_module.with_suffix('.manifest.json')
        if not source_module.is_file() or not mf.is_file():return 0
        if hashlib.sha256(source_module.read_bytes()).hexdigest()!=item.get('module_sha256'):return 0
        if hashlib.sha256(mf.read_bytes()).hexdigest()!=item.get('manifest_sha256'):return 0
        new=json.loads(mf.read_text())
        old={d['name'] for d in units[src]['manifest']['definitions'] if d['status']=='source-first'}
        got={d['name'] for d in new['definitions'] if d['status']=='source-first'}
        if not old.issubset(got) or missing_exports(got,source_module):return 0
        staged[src]={'manifest':new,'module':source_module};count+=1
    combined={**units,**staged}
    owners,ambiguous=ownership(combined,source_root)
    for item in staged.values():
        for dep in item['manifest'].get('imports',[]):
            if dep['name'] in ambiguous or owners.get(dep['name'])!=dep['from'] or storage_import_error(dep,combined):
                return 0
    units.update(staged)
    return count


def write_link_checkpoint(out,units,initial_units,fingerprint,round_number):
    verified={}
    for src,unit in units.items():
        if unit['manifest']==initial_units[src]['manifest']:continue
        mod=out/(src+'.mjs');mf=mod.with_suffix('.manifest.json')
        if not mod.is_file() or not mf.is_file():continue
        verified[src]={'module_sha256':hashlib.sha256(mod.read_bytes()).hexdigest(),
                       'manifest_sha256':hashlib.sha256(mf.read_bytes()).hexdigest()}
    write_json(out/'link-checkpoint.json',{'fingerprint':fingerprint,
                                            'last_completed_round':round_number,
                                            'verified':verified})


def relink(directory,out,source_root,round_limit=8,timeout=65,jobs=2,retry_budget=0,resume=False,persistent_ast_cache=False,compile_commands=None):
    report,units=gather_batches(directory)
    out.mkdir(parents=True,exist_ok=True)
    initial_units={src:{'manifest':unit['manifest'],'module':unit['module']}
                   for src,unit in units.items()}
    fingerprint=link_input_fingerprint(directory,source_root,compile_commands=compile_commands)
    content_guard=link_input_fingerprint(directory,source_root,include_toolchain=False,compile_commands=compile_commands)
    def attest_content():
        if content_guard!=link_input_fingerprint(directory,source_root,include_toolchain=False,compile_commands=compile_commands):
            raise RuntimeError('link input source, compiler or published artifacts changed during recovery')
    previously_recovered=(resume_verified_units(directory,out,units,fingerprint,source_root) if resume else 0)
    stage_modules(units,out)
    outcomes=[]
    # Raw AST reuse is distinct from verified JS reuse. The bounded cache is
    # keyed to all original source/header bytes, captured flags and toolchain;
    # frontend emission and symbol ownership are always re-executed.
    ast_cache_owner=None
    if persistent_ast_cache:
        from source_first_automate import ast_semantic_epoch
        from source_ast_cache_paths import persistent_ast_cache_directory
        commands=Path(compile_commands) if compile_commands is not None else ROOT/'factory-output/compile_commands.json'
        epoch=ast_semantic_epoch(commands if commands.is_file() else None,source_root)
        ast_cache=persistent_ast_cache_directory(directory,epoch)/'shard-00'
    else:
        ast_cache_owner=tempfile.TemporaryDirectory(prefix='eduke_original_ast_')
        ast_cache=Path(ast_cache_owner.name)
    attempted_without_gain=set()
    for round_number in range(1,round_limit+1):
        attest_content()
        emitted,emitted_ambiguous=ownership(units,source_root)
        declared,ambiguous=declared_ownership(units,source_root)
        # All references (including those omitted by the short human-readable
        # error string) must have original, unambiguous owners. Cyclic import
        # components may still be proposed and transactionally validated.
        ready=eligible_link_retries(units,declared,ambiguous)
        if not ready:break
        ready=[src for src in rank_retry_units(units, ready, declared, ambiguous)
               if src not in attempted_without_gain]
        if not ready:break
        if retry_budget:
            # A finite retry budget protects the rest of a large recovery
            # inventory from one high-cost AST unit. No skipped result is
            # counted as an emitted definition or a compilation failure.
            skipped=ready[retry_budget:]
            ready=ready[:retry_budget]
            if skipped:
                outcomes.append({'round':round_number,'phase':'resource-budget',
                                 'scheduled':len(ready),'deferred':len(skipped),
                                 'deferred_sources':skipped})
        with tempfile.TemporaryDirectory(prefix='eduke_original_link_') as scratch_dir:
            scratch_root=Path(scratch_dir)
            eliminated=set()
            # Source AST lowering is re-run with less speculative ownership if
            # a tentative provider fails to emit. The independent recoverable
            # exports of that TU can then survive as a valid partial module.
            for prune_round in range(1, 6):
                candidates={}
                # The same exact tentative owner index is supplied to all sources.
                # Recompilation is against Clang original-source AST, not cached JS.
                def compile_candidate(pair):
                    number,source=pair
                    before={d['name'] for d in units[source]['manifest']['definitions']
                            if d['status']=='source-first'}
                    index={name:owner for name,owner in declared.items()
                           if owner!=source and name not in ambiguous and name not in eliminated}
                    temporary=scratch_root/f'{prune_round}_{number}'
                    temporary.mkdir()
                    symbols=temporary/'symbols.json'
                    symbols.write_text(json.dumps(index))
                    output=temporary/'output'
                    command=[sys.executable,str(FRONT),'--root',str(source_root),'--source',source,
                             '--out-dir',str(output),'--project-symbols',str(symbols),
                                 '--ast-cache-dir',str(ast_cache),'--header-dependency-closure']
                    if compile_commands is not None:command.extend(['--compile-commands',str(compile_commands)])
                    try:
                        from source_first_automate import run_compiler_process
                        result=run_compiler_process(command,timeout)
                        if result.returncode:raise RuntimeError((result.stderr+'\n'+result.stdout)[-1500:])
                        staged=output/(source+'.mjs')
                        manifest=staged.with_suffix('.manifest.json')
                        new=json.loads(manifest.read_text())
                        newly={d['name'] for d in new['definitions'] if d['status']=='source-first'}
                        if not before.issubset(newly):raise RuntimeError('previously emitted original exports lost')
                        if staged.is_file():
                            check=subprocess.run(['node','--check',str(staged)],capture_output=True,text=True,timeout=20)
                            if check.returncode:raise RuntimeError('invalid JS: '+check.stderr[-600:])
                        # All name/provider pairs must be Clang-discovered, even
                        # before proof that providers were emitted.
                        for dep in new.get('imports',[]):
                            if declared.get(dep['name'])!=dep['from'] or dep['name'] in ambiguous:
                                raise RuntimeError('invented/ambiguous external import: '+str(dep))
                        if not staged.is_file() and new['emitted']:
                            raise RuntimeError('emitted declarations lack a module')
                        missing=missing_exports(newly,staged)
                        if missing:raise RuntimeError('manifest exports absent in JS: '+str(sorted(missing)[:8]))
                        return source, {'manifest':new,'module':staged if staged.is_file() else None}, None
                    except (RuntimeError,subprocess.TimeoutExpired,OSError,ValueError,KeyError) as exc:
                        return source, None, str(exc)[:1200]
                # All candidates observe the same immutable ownership proposal.
                # Commit only AFTER every worker finishes and transaction
                # validation finds no missing/ambiguous original owner.
                with ThreadPoolExecutor(max_workers=jobs) as pool:
                    for source,candidate,error in pool.map(compile_candidate,enumerate(ready)):
                        if error is not None:
                            outcomes.append({'round':round_number,'source':source,
                                             'status':'rejected','error':error})
                        elif candidate is not None:
                            candidates[source]=candidate
                # Transactional validation is per *emitted declaration*, not
                # a reason to abandon an entire source TU. Retire precisely
                # those speculative cross-TU providers which were NOT emitted
                # in the complete candidate set. Preserve proven providers.
                merged={**units,**candidates}
                owners_now, ambiguous_now=ownership(merged,source_root)
                stable_owners,_=ownership(units,source_root)
                prune=set()
                for candidate in candidates.values():
                    for dep in candidate['manifest'].get('imports',[]):
                        name=dep['name']
                        if (name in declared and name not in stable_owners
                                and (name in ambiguous_now or owners_now.get(name)!=dep['from'])
                                and name not in eliminated):
                            prune.add(name)
                if not prune:break
                eliminated.update(prune)
                outcomes.append({'round':round_number,'phase':'dependency-pruning',
                                 'iteration':prune_round,
                                 'unproven_tentative_declarations':sorted(prune)})
            accepted,rejected=settle_proposals(units,candidates,source_root)
            for source,reason in rejected.items():
                outcomes.append({'round':round_number,'source':source,
                                 'status':'rejected','error':reason[:1200]})
            changed=False
            attest_content()
            for source,unit in sorted(accepted.items()):
                before={d['name'] for d in units[source]['manifest']['definitions']
                        if d['status']=='source-first'}
                newly={d['name'] for d in unit['manifest']['definitions']
                       if d['status']=='source-first'}
                file=out/(source+'.mjs')
                file.parent.mkdir(parents=True,exist_ok=True)
                if unit['module'] is not None:
                    if unit['module'].resolve()!=file.resolve():shutil.copyfile(unit['module'],file)
                else:file.unlink(missing_ok=True)
                write_json(file.with_suffix('.manifest.json'),unit['manifest'])
                units[source]={'manifest':unit['manifest'],'module':file if file.is_file() else None}
                added=sorted(newly-before)
                outcomes.append({'round':round_number,'source':source,'added':added,
                                 'status':'verified' if added else 'unchanged'})
                if added:changed=True
        write_link_checkpoint(out,units,initial_units,fingerprint,round_number)
        if changed:
            attempted_without_gain.clear()
        else:
            attempted_without_gain.update(ready)
            if not retry_budget:break
    attest_content()
    if fingerprint!=link_input_fingerprint(directory,source_root,compile_commands=compile_commands):
        raise RuntimeError('link toolchain changed during recovery')
    owners,ambiguous=ownership(units,source_root)
    invalid=[]
    for source,unit in sorted(units.items()):
        mf=unit['manifest'];mod=out/(source+'.mjs')
        if mf['emitted'] and not mod.is_file():invalid.append({'source':source,'reason':'missing module'});continue
        for dep in mf.get('imports',[]):
            if dep['name'] in ambiguous or owners.get(dep['name'])!=dep['from']:
                invalid.append({'source':source,'reason':'unverified external import','dependency':dep})
            error=storage_import_error(dep,units)
            if error:invalid.append({'source':source,'reason':error,'dependency':dep})
        if mod.is_file():
            expected_exports={d['name'] for d in mf['definitions'] if d['status']=='source-first'}
            missing=missing_exports(expected_exports,mod)
            if missing:
                invalid.append({'source':source,'reason':'manifest exports not defined in original-source JS',
                                'missing':sorted(missing)[:12]})
            p=subprocess.run(['node','--check',str(mod)],capture_output=True,text=True,timeout=20)
            if p.returncode:invalid.append({'source':source,'reason':'invalid JS syntax','message':p.stderr[-800:]})
    issues=list(unresolved(units))
    summary={
        'format':'source-first-global-recovery/1','selected_source_units':report['original_selected_units'],
        'completed_source_units':len(units),'source_named_modules':sum(bool(x['module']) for x in units.values()),
        'unique_exports':len(owners),'ambiguous_export_names':ambiguous,
        'module_emitted_definition_entries':sum(1 for u in units.values() for d in u['manifest']['definitions'] if d['status']=='source-first'),
        'linkage_accounting':'unique_exports counts external global ownership; internal declarations remain within their originating ES modules',
        'internal_linkage_definitions':sum(1 for src,u in units.items() for d in u['manifest']['definitions'] if d['status']=='source-first' and internal_definition(u,d,source_root,src)),
        'public_external_definitions':sum(1 for src,d in public_definitions(units,source_root) if d['status']=='source-first'),
        'recovered_definitions':sum(len(x['added']) for x in outcomes if x.get('status')=='verified'),
        'previously_resumed_units':previously_recovered,
        'published_input_revision_counts':report.get('compiler_revision_source_counts',{}),
        'published_input_uniform_revision_verified':report.get('uniform_compiler_revision_verified',False),
        'linker_input_fingerprint':fingerprint,
        'linker_input_attestation_verified':True,
        'all_units_recompiled_under_linker_revision':False,
        'persistent_ast_cache_enabled':persistent_ast_cache,
        'linker_retry_budget':retry_budget,
        'recovery_round_limit':round_limit,
        'ast_dependency_recovery_attempted':round_limit>0,
        'total_blocked_definitions':len(issues),
        'remaining_by_reason':dict(Counter(x['reason'].split(':',1)[0] for x in issues)),
        'invalid_imports_or_syntax':invalid,'recovery_attempts':outcomes,'remaining':issues,
        'full_game_linked':False,'original_gameplay_verified':False,'llvm_fallback':False,
        'transactional_cyclic_original_source_linking':True,
    }
    # Reuse the canonical complete dependency/SCC catalog directly in the
    # linker output. This is diagnostics, not additional fabricated providers.
    from source_first_missing_map import sweep_units
    catalog=sweep_units({src:unit['manifest'] for src,unit in units.items()})
    write_json(out/'dependency-frontier.json',catalog)
    summary['dependency_frontier']={
        'failure_families':catalog['failure_families'],
        'unique_referenced_symbols_by_resolution':catalog['unique_referenced_symbols_by_resolution'],
        'cyclic_blocked_dependency_components':catalog['cyclic_blocked_dependency_components'],
        'high_fanout_provider_roots':catalog['high_fanout_missing_providers'][:25],
        'full_catalog':'dependency-frontier.json',
        'verified_gameplay':False,
    }
    write_json(out/'global-recovery.json',summary)
    if ast_cache_owner is not None:ast_cache_owner.cleanup()
    return summary

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory',type=Path,default=ROOT/'factory-output/source-first/automatic')
    parser.add_argument('--out',type=Path,default=ROOT/'factory-output/source-first/globally-linked')
    parser.add_argument('--source-root',type=Path,default=ROOT/'factory-output/source-tree/eduke32-master')
    parser.add_argument('--compile-commands',type=Path,help='Use the selected profile for every recovery compile and cache key')
    parser.add_argument('--timeout',type=int,default=65)
    parser.add_argument('--rounds',type=int,default=8)
    parser.add_argument('--resume',action='store_true',help='reuse only fingerprint-matching, revalidated link checkpoints')
    parser.add_argument('--persistent-ast-cache',action='store_true',help='reuse bounded raw AST cache with complete source/header/toolchain keys')
    parser.add_argument('--retry-budget',type=int,default=0,
                        help='max AST source retry jobs per link round; 0=all candidates')
    parser.add_argument('--jobs',type=int,choices=(1,2),default=2,
                        help='memory-bounded concurrent Clang AST retry workers')
    args=parser.parse_args()
    if args.retry_budget<0:parser.error('--retry-budget must be nonnegative')
    summary=relink(args.directory.resolve(),args.out.resolve(),args.source_root.resolve(),args.rounds,args.timeout,args.jobs,args.retry_budget,args.resume,args.persistent_ast_cache,args.compile_commands)
    print(json.dumps({k:v for k,v in summary.items() if k not in ('remaining','recovery_attempts')},indent=2))
    return 2 if summary['invalid_imports_or_syntax'] else 0

if __name__=='__main__':sys.exit(main())
