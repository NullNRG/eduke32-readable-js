#!/usr/bin/env python3
"""Automatic, resumable source-first conversion over the ORIGINAL build inventory.

All 156 Make-selected compile commands are discovered without a manually curated
source list. Translation units are emitted in bounded batches, with recursive
isolation of failing batches and persistent, content-fingerprinted checkpoints.

A batch is not a whole-game linker: cross-batch references remain unresolved
unless an optional final global-link build succeeds. Never publish a playable
result from batch conversion statistics alone.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import signal
from pathlib import Path, PurePosixPath, PureWindowsPath
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from collections import Counter
from source_first_generated import recover
from source_first_toolchain import fingerprint_toolchain

ROOT = Path(__file__).resolve().parents[1]
COMPILER = ROOT/'tools/source_first_project.py'
FRONTEND = ROOT/'tools/source_ast_to_js.py'
FLOW = ROOT/'tools/source_control_flow.py'
CHECKPOINT_LOCK=Lock()


def run_compiler_process(command, timeout):
    """Bound the entire compiler process tree, including Clang grandchildren."""
    proc=subprocess.Popen(command,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                          text=True,encoding='utf-8',errors='replace',
                          start_new_session=os.name!='nt',
                          creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name=='nt' else 0)
    try:
        stdout,stderr=proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        if os.name=='nt':
            subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],
                           stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,
                           creationflags=subprocess.CREATE_NO_WINDOW)
        else:
            try:os.killpg(proc.pid,signal.SIGKILL)
            except ProcessLookupError:pass
        # Preserve subprocess.run's CompletedProcess / TimeoutExpired contract.
        stdout,stderr=proc.communicate()
        raise subprocess.TimeoutExpired(command,timeout,output=stdout,stderr=stderr)
    return subprocess.CompletedProcess(command,proc.returncode,stdout,stderr)

def sha(path: Path, hasher):
    hasher.update(str(path).encode()); hasher.update(b'\0')
    with path.open('rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):
            hasher.update(chunk)


def portable_relative(value):
    """Read a saved relative artifact path identically on Windows and POSIX.

    Absolute, rooted, drive-relative and parent paths are rejected on either
    host. Separator normalization does not alter the saved artifact bytes.
    """
    if not isinstance(value,str) or not value or '\0' in value:
        raise ValueError('invalid relative artifact path')
    posix=PurePosixPath(value.replace('\\','/'))
    windows=PureWindowsPath(value)
    if posix.is_absolute() or windows.drive or windows.root or '..' in posix.parts or not posix.parts:
        raise ValueError('artifact path escapes build directory: '+value)
    return Path(*posix.parts)


def portable_artifact_hashes(values):
    if not isinstance(values,dict):return None
    normalized={}
    try:
        for key,value in values.items():
            name=portable_relative(key).as_posix()
            if name in normalized:return None
            normalized[name]=value
    except ValueError:return None
    return normalized

def inventory(commands_path, source_root):
    commands=json.loads(commands_path.read_text())
    sources=[]; seen=set(); duplicate=[]; missing=[]
    for item in commands:
        src=item['file']
        if src in seen:duplicate.append(src);continue
        seen.add(src)
        relative=Path(src)
        if relative.is_absolute() or '..' in relative.parts or not (source_root/relative).is_file():
            missing.append(src);continue
        sources.append({'source':src,'bytes':(source_root/relative).stat().st_size})
    if duplicate:
        raise ValueError(f'duplicate original compilation unit: {duplicate}')
    # The saved Make compile database can refer to generated C++ files which
    # were not retained in the source archive. Report them; never fabricate
    # their contents or pretend the 154 available units are all 156.
    inventory.missing_generated=missing
    inventory.total_selected=len(seen)
    # Process small, cheap units first to increase verified AST coverage rapidly.
    return sorted(sources,key=lambda x:(x['bytes'],x['source']))

def pipeline_inputs(commands_path, source_root):
    paths=[ROOT/'tools/source_first_toolchain.py',ROOT/'tools/source_byte_records.py',ROOT/'tools/source_trivial_assignment.py',ROOT/'tools/source_cpp_lifetime.py',ROOT/'tools/source_cpp_lifetime_runtime.mjs',ROOT/'tools/source_cpp_heap.py',ROOT/'tools/source_cpp_heap_runtime.mjs',ROOT/'tools/source_header_records.py',
        ROOT/'tools/source_scalar_types.py',ROOT/'tools/source_cpp_references.py',
        ROOT/'tools/source_ast_stream.py', ROOT/'tools/source_ast_events.py',
        ROOT/'tools/source_coroutine_cfg.py', ROOT/'tools/source_process_runtime.mjs',
        ROOT/'tools/source_aggregate_assignment_runtime.mjs',
        COMPILER, FRONTEND, FLOW, ROOT/'tools/source_first_generated.py',
        ROOT/'tools/source_pointer_runtime.mjs', ROOT/'tools/source_pointer_span_runtime.mjs',
        ROOT/'tools/source_address_runtime.mjs',ROOT/'tools/source_c_heap_runtime.mjs',
        ROOT/'tools/source_aggregate_runtime.mjs', ROOT/'tools/source_byte_memory_runtime.mjs',
        ROOT/'tools/source_variadic_runtime.mjs',
        ROOT/'tools/source_first_global_link.py', ROOT/'tools/source_first_automate.py']
    paths.extend(sorted((ROOT/'runtime').rglob('*.mjs')))
    paths.extend([ROOT/'tools/source_anonymous_records.py', ROOT/'tools/source_explicit_member_operators.py',
                  ROOT/'tools/source_cpp_types.py', ROOT/'tools/source_standard_heap_contract.py',
                  ROOT/'tools/source_ast_cache_paths.py'])
    paths.append(ROOT/'tools/source_template_destructors.py')
    paths.append(ROOT/'tools/source_static_members.py')
    paths.append(ROOT/'tools/source_c_allocators.py')
    # New lowering passes must participate without a hand-maintained import
    # list silently allowing stale emitted modules after a helper-only fix.
    paths.extend(path for path in sorted((ROOT/'tools').glob('source_*'))
        if path.suffix in ('.py','.mjs') and path not in paths)
    if commands_path is not None:
        paths.append(commands_path)
        from source_standard_heap_contract import contract_path
        proof=contract_path(commands_path)
        if proof.is_file():paths.append(proof)
    # Header content is part of the source-language semantics. A source-only
    # fingerprint would incorrectly reuse output after header modifications.
    for p in sorted(source_root.rglob('*')):
        if p.is_file() and p.suffix.lower() in ('.h','.hpp','.hh','.hxx','.inc'):
            paths.append(p)
    return paths

def ast_semantic_epoch(commands_path,source_root):
    """Key raw Clang AST retention only to the inputs that can change Clang's output.

    Hash the entire captured original source tree, not a guessed header include
    subset: .inc/.def/generated files and conditional includes can affect AST.
    source_ast_to_js separately keys each Clang invocation by exact compiler
    command, target ABI and translation-unit digest. JavaScript emitter edits
    do not invalidate raw ASTs. Cache artifacts never count toward build
    attestation; they must be parsed and freshly emitted/verified as usual.
    """
    h=hashlib.sha256(b'EDUKE32-original-clang-AST-epoch/1\0')
    fingerprint_toolchain(h)
    if commands_path is not None:sha(commands_path,h)
    for path in sorted(source_root.rglob('*')):
        if path.is_file():sha(path,h)
    return h.hexdigest()


def content_guard(commands_path, source_root, items):
    """Cheap content attestation; full Clang/sysroot hashing stays at epoch edges."""
    h=hashlib.sha256()
    for p in pipeline_inputs(commands_path,source_root):sha(p,h)
    for key in ('EDUKE32_CLANG','EDUKE32_CLANGXX','EDUKE32_CLANG_TARGET','EDUKE32_SYSROOT'):
        h.update((key+'='+os.environ.get(key,'')).encode());h.update(b'\0')
    for entry in items:sha(source_root/entry['source'],h)
    return h.hexdigest()

def fingerprint(commands_path, source_root, items):
    h=hashlib.sha256()
    fingerprint_toolchain(h)
    h.update(content_guard(commands_path,source_root,items).encode())
    return h.hexdigest()

class RevisionChanged(RuntimeError):
    """An in-flight batch cannot be attributed to one immutable input revision."""

class BatchRevisionGuard:
    def __init__(self, commands_path, source_root, items, compiler_fingerprint):
        self.commands_path=commands_path
        self.source_root=source_root
        self.items=items
        self.compiler_fingerprint=compiler_fingerprint
        self.pipeline=content_guard(commands_path,source_root,[])
        self.source_hashes={item['source']:self.source_hash(item) for item in items}

    def source_hash(self,item):
        h=hashlib.sha256();sha(self.source_root/item['source'],h);return h.hexdigest()

    def expected(self,items):
        h=hashlib.sha256(self.pipeline.encode())
        for item in items:h.update(self.source_hashes[item['source']].encode())
        return h.hexdigest()

    def attest(self,items):
        try:
            if content_guard(self.commands_path,self.source_root,[])!=self.pipeline:
                raise RevisionChanged('compiler, runtime, command, environment or header content changed')
            for item in items:
                if self.source_hash(item)!=self.source_hashes[item['source']]:
                    raise RevisionChanged('original source content changed: '+item['source'])
        except OSError as exc:
            raise RevisionChanged('compiler input disappeared: '+str(exc)) from exc
        return self.expected(items)

    def finish(self):
        self.attest(self.items)
        end=fingerprint(self.commands_path,self.source_root,[])
        if end!=self.compiler_fingerprint:
            raise RevisionChanged('full compiler/toolchain/sysroot fingerprint changed')
        return {'verified':True,'start_fingerprint':self.compiler_fingerprint,
                'end_fingerprint':end,'input_content_guard':self.expected(self.items)}

def put_json(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix('.tmp')
    temp.write_text(json.dumps(obj,indent=2,sort_keys=True),encoding='utf-8')
    os.replace(temp,path)

def summarize_batches(batch_rows, selected, count, output_root=None, revision_attestation=None):
    success=[r for r in batch_rows if r['status']=='ok']
    failed=[r for r in batch_rows if r['status']!='ok']
    blockers=[]
    for row in success:
        m=row.get('manifest')
        if not m:continue
        path=Path(row.get('_output_root') or output_root)/portable_relative(m) if (row.get('_output_root') or output_root) else None
        if not path or not path.exists():continue
        doc=json.loads(path.read_text())
        for unit in doc.get('units',[]):
            for issue in unit.get('blocked_reasons',[]):
                reason=issue.get('reason','unknown')
                category=('external dependencies' if reason.startswith('unlinked identifiers:')
                          else reason.split(':',1)[0])
                blockers.append({'source':unit['source'],'definition':issue['name'],
                                 'category':category,'reason':reason})
    categories=dict(sorted(Counter(r['category'] for r in blockers).items(),key=lambda x:(-x[1],x[0])))
    compiler_revisions=Counter(str(r.get('compiler_fingerprint') or 'unattested')
                               for r in success for _ in r['sources'])
    attestation=revision_attestation or {}
    current=attestation.get('end_fingerprint')
    revisions_uniform=(attestation.get('verified') is True and current is not None and
        current==attestation.get('start_fingerprint') and bool(success) and not failed and
        sum(len(r['sources']) for r in success)==count and
        len(compiler_revisions)==1 and current in compiler_revisions and
        all(r.get('revision_guard_verified') is True and
            r.get('input_guard_before') and r.get('input_guard_before')==r.get('input_guard_after')
            for r in success))
    results={
        'format':'source-first-automate/1',
        'original_selected_units':count,
        'scheduled_units':len(selected),
        'attempted_units':sum(len(r['sources']) for r in batch_rows),
        'verified_batch_units':sum(len(r['sources']) for r in success),
        'failed_batch_units':sum(len(r['sources']) for r in failed),
        'readable_definitions':sum(r.get('readable_definitions',0) for r in success),
        'blocked_definitions':sum(r.get('blocked_definitions',0) for r in success),
        'invalid_imports':sum(r.get('invalid_imports',0) for r in success),
        'fully_linked_project':False,
        'gameplay_verified':False,
        'llvm_fallback':False,
        'compiler_revision_source_counts':dict(compiler_revisions),
        'uniform_compiler_revision_verified':revisions_uniform,
        'compiler_revision_attestation':attestation,
        'blocker_categories':categories,
        'blocker_catalog':blockers,
        'batch_results':[{k:v for k,v in r.items() if k!='_output_root'} for r in batch_rows],
    }
    return results

def batch_artifact_hashes(target, manifest):
    """Content attest original-source JS and every manifest before reuse.

    Compiler/source/header fingerprints alone do not prove that a previous
    generated module still exists or hasn't been edited after compilation.
    Return None for incomplete, corrupt or invalid artifacts; never reuse them.
    """
    try:
        build=json.loads(manifest.read_text(encoding='utf-8'))
        if build.get('format')!='source-first-project/1':return None
        paths=[manifest]
        for unit in build['units']:
            source=unit['source'];rel=portable_relative(source)
            module=target/Path(str(rel)+'.mjs')
            unit_manifest=module.with_suffix('.manifest.json')
            if not unit_manifest.is_file():return None
            parsed=json.loads(unit_manifest.read_text(encoding='utf-8'))
            if (unit.get('emitted',0)>0 and not module.is_file()):return None
            if len([d for d in parsed.get('definitions',[]) if d.get('status')=='source-first'])!=unit.get('emitted'):
                return None
            paths.append(unit_manifest)
            if module.is_file():paths.append(module)
        artifacts={}
        for item in paths:
            relative=item.relative_to(target).as_posix()
            digest=hashlib.sha256()
            with item.open('rb') as f:
                for chunk in iter(lambda:f.read(1024*1024),b''):digest.update(chunk)
            artifacts[relative]=digest.hexdigest()
        return dict(sorted(artifacts.items()))
    except (OSError,KeyError,TypeError,ValueError,AttributeError,json.JSONDecodeError):
        return None


def batch_artifacts_match(target,manifest,expected):
    normalized=portable_artifact_hashes(expected)
    if normalized is None:return False
    actual=batch_artifact_hashes(target,manifest)
    return actual is not None and actual==normalized

def run_batch(items, out, source_root, timeout, state, fingerprint_value, batch_counter, revision_guard=None, ast_cache=None, ast_cache_shards=8):
    sources=[x['source'] for x in items]
    base_fingerprint=fingerprint_value
    # Direct utility callers without an epoch guard retain their old artifact
    # reuse contract, but their rows are explicitly untrusted for uniformity.
    input_before=revision_guard.attest(items) if revision_guard else None
    # Content-address only the sources in THIS batch. A changed .cpp outside
    # this batch must never invalidate unrelated AST work. The base fingerprint
    # already covers all headers, flags, and compiler pipeline implementations.
    batch_hash=hashlib.sha256(fingerprint_value.encode())
    for unit in items:sha(source_root/unit['source'],batch_hash)
    fingerprint_value=batch_hash.hexdigest()
    name='batch-'+hashlib.sha256('\n'.join(sources).encode()).hexdigest()[:16]
    target=out/name
    manifest=target/'project-build.json'
    key='\n'.join(sources)
    with CHECKPOINT_LOCK:
        existing=state.get(key)
    if (existing and existing.get('fingerprint')==fingerprint_value and
        existing.get('status')=='ok' and manifest.is_file() and
        existing.get('artifact_hashes') is not None and
        existing.get('compiler_fingerprint')==base_fingerprint and
        (revision_guard is None or (existing.get('revision_guard_verified') is True and
            existing.get('input_guard_before')==input_before and
            existing.get('input_guard_after')==input_before)) and
        batch_artifacts_match(target,manifest,existing['artifact_hashes'])):
        if revision_guard:revision_guard.attest(items)
        return {**existing,'_output_root':str(out),
                'revision_guard_verified':revision_guard is not None}, batch_counter
    target.mkdir(parents=True,exist_ok=True)
    plan=out/'plans'/f'{name}.json'
    put_json(plan,{'root':str(source_root),'compile_commands':str(revision_guard.commands_path) if revision_guard else None,'units':[{'source':s,'header_dependency_closure':True} for s in sources]})
    cmd=[sys.executable,str(COMPILER),'--plan',str(plan),'--out-dir',str(target)]
    if ast_cache is not None:cmd+=['--ast-cache-dir',str(ast_cache),'--ast-cache-shards',str(ast_cache_shards)]
    start=time.monotonic()
    print(f'COMPILING {name}: {", ".join(sources)}',flush=True)
    try:
        proc=run_compiler_process(cmd,timeout)
        input_after=revision_guard.attest(items) if revision_guard else None
        elapsed=round(time.monotonic()-start,2)
        if proc.returncode==0 and manifest.exists():
            report=json.loads(manifest.read_text())
            row={'sources':sources,'status':'ok','seconds':elapsed,
                 'readable_definitions':report['source_definitions_emitted'],
                 'blocked_definitions':report['source_definitions_blocked'],
                 'invalid_imports':len(report['invalid_imports']),
                 'manifest':str(manifest.relative_to(out)),'fingerprint':fingerprint_value}
            hashes=batch_artifact_hashes(target,manifest)
            if hashes is None:raise RuntimeError('compiler returned unverified or missing generated artifacts')
            if revision_guard:revision_guard.attest(items)
            row['artifact_hashes']=hashes
            row['compiler_fingerprint']=base_fingerprint
            row['revision_guard_verified']=revision_guard is not None
            row['input_guard_before']=input_before
            row['input_guard_after']=input_after
            row['_output_root']=str(out)
            with CHECKPOINT_LOCK:
                state[key]={k:v for k,v in row.items() if k!='_output_root'}
                put_json(out/'checkpoint.json',{'fingerprint':fingerprint_value,'batch_cache':state})
            return row,batch_counter+1
        error=(proc.stderr+'\n'+proc.stdout)[-4500:]
    except RevisionChanged:
        # Never persist a successful manifest or bisect a compiler revision race.
        # The caller retries the entire epoch with freshly fingerprinted inputs.
        with CHECKPOINT_LOCK:
            state.pop(key,None)
            put_json(out/'checkpoint.json',{'fingerprint':base_fingerprint,'batch_cache':state})
        raise
    except (subprocess.TimeoutExpired,OSError,RuntimeError,ValueError,KeyError) as exc:
        if revision_guard:revision_guard.attest(items)
        error=f'{type(exc).__name__}: {exc}'[:4500]
        elapsed=round(time.monotonic()-start,2)
    if len(items)>1:
        print(f'ISOLATING failed batch of {len(items)} units',flush=True)
        middle=len(items)//2
        left,batch_counter=run_batch(items[:middle],out,source_root,timeout,state,base_fingerprint,batch_counter,revision_guard,ast_cache,ast_cache_shards)
        right,batch_counter=run_batch(items[middle:],out,source_root,timeout,state,base_fingerprint,batch_counter,revision_guard,ast_cache,ast_cache_shards)
        # Keep leaf records only; retry the original group on another invocation
        # when a new compiler implementation is available.
        return [left,right],batch_counter
    row={'sources':sources,'status':'failed','seconds':elapsed,'error':error,'fingerprint':fingerprint_value}
    with CHECKPOINT_LOCK:
        state[key]=row
        put_json(out/'checkpoint.json',{'fingerprint':fingerprint_value,'batch_cache':state})
    print(f'BLOCKED {sources[0]}: {error[-400:]}',flush=True)
    return row,batch_counter+1

def flatten(value):
    if isinstance(value,list):
        return [item for x in value for item in flatten(x)]
    return [value]

def bounded_batches(units, maximum_units, maximum_source_bytes=250_000):
    """Group independent original TUs without combining memory-heavy Clang ASTs.

    The source-size heuristic affects scheduling ONLY, never AST semantics,
    definition ownership, recovery metrics or compiler flags. A TU exceeding
    the byte budget runs alone instead of being skipped. Source content and
    compiler implementation remain content-fingerprinted by run_batch().
    """
    if maximum_units<1 or maximum_source_bytes<1:
        raise ValueError('invalid original-source batch limits')
    batches=[];current=[];bytes_used=0
    for unit in units:
        size=unit['bytes']
        if current and (len(current)>=maximum_units or bytes_used+size>maximum_source_bytes):
            batches.append(current);current=[];bytes_used=0
        current.append(unit);bytes_used+=size
    if current:batches.append(current)
    assert [unit for group in batches for unit in group]==units
    return batches

def make_build_inventory(units, retry_subset, total_make_selected, missing_generated, recovered_make_sources, repair_failed=False):
    """Keep the full original source selection intact across targeted repair runs.

    Only `repair_attempted_subset` is narrowed; the coverage gate must see
    the original compilation scope even when one failed TU is retried.
    """
    return {
        'total_make_selected': total_make_selected,
        'missing_generated_sources': missing_generated,
        'recovered_make_sources': recovered_make_sources,
        'processing_order': 'source-size then original path',
        'all_sources': units,
        'selected_sources': units if repair_failed else retry_subset,
        'repair_attempted_subset': retry_subset if repair_failed else [],
    }

def current_preserved_rows(rows, units, out, guard):
    """Legacy repair reports are historical evidence, never current attestation."""
    by_source={item['source']:item for item in units}
    trusted=[];retry=set()
    for row in rows:
        items=[by_source[source] for source in row['sources'] if source in by_source]
        target=out/portable_relative(row.get('manifest','missing')).parent
        if (len(items)==len(row['sources']) and row.get('revision_guard_verified') is True and
            row.get('compiler_fingerprint')==guard.compiler_fingerprint and
            row.get('input_guard_before')==guard.expected(items) and
            row.get('input_guard_after')==guard.expected(items) and
            row.get('artifact_hashes') is not None and
            batch_artifacts_match(target,target/'project-build.json',row['artifact_hashes'])):
            trusted.append(row)
        else:retry.update(row['sources'])
    return trusted,retry


def select_refresh_units(prior,units,requested):
    """Retain whole attested batches; refresh requested/failed/missing units.

    A successful multi-source batch is indivisible for artifact provenance.
    Recompile its siblings too when one source was explicitly selected.
    current_preserved_rows subsequently invalidates incompatible revisions.
    """
    known={item['source'] for item in units}
    requested={portable_relative(source).as_posix() for source in requested}
    if requested-known:raise ValueError('refresh source absent from selected inventory: '+str(sorted(requested-known)))
    retry=set(requested);seen=set();preserved=[]
    for row in prior['batch_results']:
        names=set(row['sources']);seen.update(names)
        if row['status']!='ok' or names&requested:retry.update(names)
        else:preserved.append(row)
    retry.update(known-seen)
    return [item for item in units if item['source'] in retry],preserved

def run_epoch(batches, out, source_root, timeout, state, guard, jobs, preserved, selected, count, ast_cache=None, ast_cache_shards=8):
    ordered=[None]*len(batches)
    def record(i,result):
        ordered[i]=flatten(result)
        put_json(out/'recovery-report.json',summarize_batches(
            preserved+[row for group in ordered if group for row in group],selected,count,out))
    if jobs==1:
        for i,batch in enumerate(batches):
            result,_=run_batch(batch,out,source_root,timeout,state,guard.compiler_fingerprint,0,guard,ast_cache,ast_cache_shards)
            record(i,result)
    else:
        with ThreadPoolExecutor(max_workers=jobs) as pool:
            futures={pool.submit(run_batch,batch,out,source_root,timeout,state,
                guard.compiler_fingerprint,0,guard,ast_cache,ast_cache_shards):i for i,batch in enumerate(batches)}
            try:
                for future in as_completed(futures):
                    result,_=future.result()
                    record(futures[future],result)
            except RevisionChanged:
                for future in futures:future.cancel()
                # Running children finish before a replacement epoch starts.
                raise
    return preserved+[row for group in ordered for row in group]

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source-root',type=Path,default=ROOT/'factory-output/source-tree/eduke32-master')
    ap.add_argument('--compile-commands',type=Path,default=ROOT/'factory-output/compile_commands.json')
    ap.add_argument('--out',type=Path,default=ROOT/'factory-output/source-first/automatic')
    ap.add_argument('--max-units',type=int,default=0,help='0 = all original units; positive value limits verification runs')
    ap.add_argument('--batch-size',type=int,default=4)
    ap.add_argument('--max-batch-source-bytes',type=int,default=250_000,help='split oversized Clang AST batches by source size; large units still compile singly')
    ap.add_argument('--jobs',type=int,default=1,help='independent concurrent Clang AST batches; use modest values to limit memory')
    ap.add_argument('--timeout',type=int,default=180,help='per compilation batch in seconds')
    ap.add_argument('--inventory-only',action='store_true')
    ap.add_argument('--resume',action='store_true')
    ap.add_argument('--no-global-link',action='store_true',help='skip project-wide fixed-point ES dependency recovery')
    ap.add_argument('--persistent-ast-cache',action='store_true',help='cache raw Clang AST across JS emitter revisions; header/source/toolchain attested')
    ap.add_argument('--ast-cache-shards',type=int,default=8,help='independent lock/LRU shards for parallel AST decoding')
    ap.add_argument('--priority-file',type=Path,help='optional original-source priority scores from proven blocker inventory')
    ap.add_argument('--repair-failed',action='store_true',help='retry only previously failed units; merge untouched successful batch records')
    ap.add_argument('--refresh-source',action='append',default=[],help='refresh an original source and preserve only compatible hash-verified batches; repeatable')
    ap.add_argument('--revision-retries',type=int,default=2,help='retry complete batches after detected compiler/runtime/source changes')
    args=ap.parse_args()
    targeted_refresh=args.repair_failed or bool(args.refresh_source)
    if targeted_refresh and args.max_units:ap.error('targeted refresh requires the complete selected source inventory; omit --max-units')
    if args.batch_size<1 or args.max_batch_source_bytes<1 or args.jobs<1 or args.jobs>8 or args.timeout<1 or args.max_units<0 or args.revision_retries<0 or args.ast_cache_shards<1 or args.ast_cache_shards>64:ap.error('invalid batch/jobs/timeout/retries or negative max-units')
    src_root=args.source_root.resolve()
    out=args.out.resolve()
    units=inventory(args.compile_commands,src_root)
    missing_initial=list(inventory.missing_generated)
    generated_units=[x['file'] for x in json.loads(args.compile_commands.read_text()) if x['file'].endswith('.glsl.cpp')]
    generated=recover(src_root,sorted(set(missing_initial+generated_units)))
    if generated:
        units=inventory(args.compile_commands,src_root)
    if args.priority_file:
        priorities=json.loads(args.priority_file.read_text())
        rows=priorities.get('priority_units',[])
        if len({r['source'] for r in rows})!=len(rows):
            ap.error('duplicate source in priority file')
        priority={r['source']:int(r['score']) for r in rows}
        # Priorities affect *order*, never AST truth, selected inventory or
        # source ownership; unranked units are still automatically compiled.
        units.sort(key=lambda r:(-priority.get(r['source'],0),r['bytes'],r['source']))
    chosen=units[:args.max_units or len(units)]
    preserved=[]
    if targeted_refresh:
        prior_path=out/'recovery-report.json'
        if not prior_path.is_file():ap.error('targeted refresh requires an existing recovery-report.json')
        prior=json.loads(prior_path.read_text())
        try:chosen,preserved=select_refresh_units(prior,units,args.refresh_source)
        except ValueError as exc:ap.error(str(exc))
        if not chosen:print('No previously failed original units to recover')
    out.mkdir(parents=True,exist_ok=True)
    # Raw AST cache is not a precompiled JS module. It is independently keyed
    # to all original source bytes, Clang options and the original LP64 ABI.
    # Keep the expensive epoch fingerprint out of every batch/worker.
    from source_ast_cache_paths import persistent_ast_cache_directory
    ast_cache=(persistent_ast_cache_directory(out,ast_semantic_epoch(args.compile_commands,src_root))
               if args.persistent_ast_cache else None)
    put_json(out/'original-build-inventory.json',make_build_inventory(
        units, chosen, inventory.total_selected, inventory.missing_generated,
        generated, targeted_refresh))
    if args.inventory_only:
        print(json.dumps({'make_selected':inventory.total_selected,'missing_generated_sources':inventory.missing_generated,'scheduled':len(chosen),'next':chosen[:12]},indent=2));return 0
    path=out/'checkpoint.json'
    old=json.loads(path.read_text()) if args.resume and path.exists() else {}
    state=old.get('batch_cache',{})  # each row has its own content fingerprint
    prior_success=preserved
    initial_chosen=chosen
    revision_events=[]
    attestation={'verified':False}
    for attempt in range(args.revision_retries+1):
        # Full binary/sysroot fingerprinting happens only at epoch boundaries.
        # Every batch separately hashes compiler/runtime/header/source content.
        fp=fingerprint(args.compile_commands,src_root,[])
        guard=BatchRevisionGuard(args.compile_commands,src_root,units,fp)
        preserved,revalidate=current_preserved_rows(prior_success,units,out,guard)
        selected_names={item['source'] for item in initial_chosen}|revalidate
        chosen=[item for item in units if item['source'] in selected_names]
        put_json(out/'original-build-inventory.json',make_build_inventory(
            units,chosen,inventory.total_selected,inventory.missing_generated,generated,targeted_refresh))
        batches=bounded_batches(chosen,args.batch_size,args.max_batch_source_bytes)
        try:
            rows=run_epoch(batches,out,src_root,args.timeout,state,guard,args.jobs,
                preserved,units if targeted_refresh else chosen,inventory.total_selected,ast_cache,args.ast_cache_shards)
            attestation=guard.finish()
            break
        except RevisionChanged as exc:
            revision_events.append({'attempt':attempt+1,'reason':str(exc),'compiler_fingerprint':fp})
            print('REVISION CHANGED: '+str(exc)+'; invalidating affected batches',flush=True)
            # Do not leave an intermediate report claiming successful current
            # compilation after this epoch's attestation has failed.
            rows=[{'sources':[item['source']],'status':'revision_changed','error':str(exc)} for item in units]
            put_json(out/'recovery-report.json',summarize_batches(
                rows,chosen,inventory.total_selected,out,{'verified':False,'revision_events':revision_events}))
    report=summarize_batches(rows,units if targeted_refresh else chosen,inventory.total_selected,out,attestation)
    report['compiler_revision_retry_events']=revision_events
    if targeted_refresh:
        report['untouched_verified_batch_rows']=len(preserved)
        report['recompiled_units']=len(chosen)
        if args.repair_failed:report['recompiled_failed_units']=len(chosen)
        report['refresh_requested_sources']=args.refresh_source
        report['untouched_units_require_revalidation_if_compiler_semantics_changed']=True
    report['missing_generated_sources']=inventory.missing_generated
    report['recovered_make_sources']=generated
    put_json(out/'recovery-report.json',report)
    if not args.no_global_link and attestation.get('verified') is True:
        from source_first_global_link import relink
        link=relink(out,out.parent/'globally-linked',src_root,timeout=args.timeout,compile_commands=args.compile_commands)
        report['global_recovery']={
            'recovered_definitions':link['recovered_definitions'],
            'unique_exports':link['unique_exports'],
            'blocked_definitions':link['total_blocked_definitions'],
            'invalid_imports':len(link['invalid_imports_or_syntax']),
            'manifest':str(out.parent/'globally-linked/global-recovery.json')}
        try:report['compiler_revision_attestation']=guard.finish()
        except RevisionChanged as exc:
            report['compiler_revision_attestation']={'verified':False,'reason':str(exc)}
            report['uniform_compiler_revision_verified']=False
            report['global_recovery']['compiler_revision_verified']=False
        put_json(out/'recovery-report.json',report)
    print(json.dumps({k:v for k,v in report.items() if k not in ('batch_results','blocker_catalog')},indent=2),flush=True)
    return 0 if (report['compiler_revision_attestation'].get('verified') is True and
        report['failed_batch_units']==0 and (args.no_global_link or not link['invalid_imports_or_syntax'])) else 2

if __name__=='__main__':sys.exit(main())
