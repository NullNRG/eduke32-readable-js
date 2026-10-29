"""Decode Clang JSON ASTs without retaining a second, huge JSON string.

Every AST declaration, expression, child order, ID, type, reference, source
``loc`` and lifetime trait is retained. Most ``range`` dictionaries are omitted;
allocation-operator body ranges survive for exact original-header provenance.
The canonical libclang semantic index independently retains all source spans.
No source ownership heuristic filters original or system declarations/bodies.
"""
from decimal import Decimal
from contextlib import contextmanager
from source_explicit_member_operators import explicit_operator
import os
import gzip
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time


_TYPE_KEYS=frozenset(('qualType','desugaredQualType','typeAliasDeclId'))
_STRINGS=frozenset(('kind','qualType','desugaredQualType','name','castKind',
    'valueCategory','file','storageClass','mangledName','opcode','constructionKind',
    'tagUsed','explicitlyDefaulted','tls'))

CACHE_POLICY_REVISION='source-ast-disk-cache/2'
DEFAULT_CACHE_BYTES=512*1024*1024
COMPRESS_ABOVE_BYTES=1024*1024
_MARKER_PREFIX='.ast-lru-'
_PARTIAL_PREFIX='.ast-cache-publish-'


def cache_policy():
    """Operational cache settings; these never select or alter source nodes."""
    budget=int(os.environ.get('EDUKE32_AST_CACHE_MAX_BYTES',DEFAULT_CACHE_BYTES))
    if budget<0:raise ValueError('EDUKE32_AST_CACHE_MAX_BYTES must be nonnegative')
    return {'revision':CACHE_POLICY_REVISION,'max_retained_bytes':budget,
            'eviction':'least-recently-used','oversized_dump':'decode-completely-without-retention',
            'concurrency':'cross-process directory lock covering reads and eviction',
            'transient_dump':'one automatic-delete spool per locked cache directory',
            'large_dump_storage':'lossless streaming gzip; disk budget counts stored bytes',
            'source_node_filtering':False}


@contextmanager
def _cache_lock(directory):
    """OS releases the lock even when a compiler worker is forcibly terminated."""
    directory.mkdir(parents=True,exist_ok=True)
    with (directory/'.ast-cache.lock').open('a+b') as lock:
        lock.seek(0,os.SEEK_END)
        if not lock.tell():lock.write(b'\0');lock.flush()
        lock.seek(0)
        if os.name=='nt':
            import msvcrt
            deadline=time.monotonic()+1800
            while True:
                try:msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1);break
                except OSError:
                    if time.monotonic()>=deadline:raise TimeoutError('Clang AST cache lock timed out')
                    time.sleep(0.05)
        else:
            import fcntl
            fcntl.flock(lock.fileno(),fcntl.LOCK_EX)
        try:yield
        finally:
            lock.seek(0)
            if os.name=='nt':msvcrt.locking(lock.fileno(),msvcrt.LK_UNLCK,1)
            else:fcntl.flock(lock.fileno(),fcntl.LOCK_UN)


def _marker(cache):
    return cache.parent/(_MARKER_PREFIX+cache.name)


def _entries(directory):
    """Only helper-owned AST dumps are eviction candidates; layout JSON is not."""
    entries=[]
    for marker in directory.glob(_MARKER_PREFIX+'*'):
        name=marker.name[len(_MARKER_PREFIX):]
        if not name or Path(name).name!=name:continue
        path=directory/name
        if not path.is_file():marker.unlink(missing_ok=True);continue
        entries.append((marker.stat().st_mtime_ns,name,path.stat().st_size,path,marker))
    return sorted(entries)


def _prepare_cache(directory):
    # No writer can still own these publication files while we hold the lock.
    for path in directory.glob(_PARTIAL_PREFIX+'*.partial'):
        try:path.unlink()
        except PermissionError:pass
    # Migrate only the compiler's exact legacy AST-key naming convention.
    # Never sweep unrelated JSON, source manifests or layout metadata.
    for path in directory.glob('*.json'):
        if re.fullmatch(r'[0-9a-f]{64}\.json',path.name) and not _marker(path).exists():
            marker=_marker(path);marker.touch()
            os.utime(marker,ns=(path.stat().st_mtime_ns,path.stat().st_mtime_ns))


def _touch(cache):
    marker=_marker(cache);marker.touch()
    # A wall-clock correction must not make the most recently used entry old.
    stamps=[entry[0] for entry in _entries(cache.parent)]
    stamp=max([time.time_ns(),*(value+1 for value in stamps)])
    os.utime(marker,ns=(stamp,stamp))


def _evict(directory,budget):
    entries=_entries(directory);used=sum(item[2] for item in entries)
    count=removed=0
    for _,_,size,path,marker in entries:
        if used<=budget:break
        try:path.unlink()
        except PermissionError:continue
        marker.unlink(missing_ok=True);used-=size;count+=1;removed+=size
    return used,count,removed


def _decode_command(command,cwd,timeout,directory=None):
    """Return an open auto-deleted spool, eliminating abandoned huge .partials."""
    output=tempfile.TemporaryFile(mode='w+b',dir=directory)
    try:
        result=subprocess.run(command,cwd=cwd,stdout=output,stderr=subprocess.PIPE,timeout=timeout)
        if result.returncode:
            raise RuntimeError('Clang AST generation failed:\n'+
                               result.stderr.decode('utf-8',errors='replace')[-12000:])
        size=output.tell();output.seek(0)
        ast,stats=parse_ast_file(output)
        return output,ast,stats,size
    except BaseException:
        output.close();raise


def _publish(output,cache):
    """Publish a complete JSON dump atomically; caller reserves its disk budget."""
    path=None
    try:
        with tempfile.NamedTemporaryFile(mode='w+b',dir=cache.parent,prefix=_PARTIAL_PREFIX,
                                         suffix='.partial',delete=False) as target:
            path=Path(target.name);output.seek(0)
            shutil.copyfileobj(output,target,length=1024*1024)
        _marker(cache).touch()  # crash-safe accounting before the atomic rename
        os.replace(path,cache)
        _touch(cache)
    finally:
        if path is not None:path.unlink(missing_ok=True)


def parse_ast_file(stream, *, retain_ranges=False):
    """Incrementally build the exact lowering tree; support concatenated roots.

    A missing streaming parser is a build error, never a fallback to the former
    memory-heavy path. All JSON fields except documented source ranges survive.
    """
    try:
        import ijson
        parser = ijson.basic_parse(stream,multiple_values=True,use_float=False)
        backend = ijson.backend
    except ImportError:
        # Keep AST decoding available on offline systems without the wheel.
        # The native fallback streams events; it never loads an entire dump.
        from source_ast_events import basic_parse
        parser = basic_parse(stream)
        backend = 'stdlib-incremental'
    roots=[];stack=[];skip=0;types={};files={}
    stats={'format':'source-ast-stream/1','backend':backend,
           'retained_source_ranges':retain_ranges,'roots':0,'objects':0,
           'ranges_omitted':0,'allocator_body_ranges_retained':0,'macro_declaration_ranges_retained':0,
           'semantic_barrier_ranges_retained':0,
           'type_metadata_reuses':0,'include_metadata_reuses':0}

    def attach(value):
        if not stack:
            if not isinstance(value,dict): raise ValueError('Clang AST root must be a JSON object')
            roots.append(value);return roots,len(roots)-1
        frame=stack[-1];container=frame[0]
        if isinstance(container,list):
            container.append(value);return container,len(container)-1
        key=frame[1]
        if key is None: raise ValueError('Clang AST object value has no field name')
        container[key]=value;frame[1]=None;return container,key

    for event,value in parser:
        if skip:
            if event in ('start_map','start_array'):skip+=1
            elif event in ('end_map','end_array'):skip-=1
            continue
        if event=='map_key':
            if not stack or not isinstance(stack[-1][0],dict):
                raise ValueError('Clang AST field outside an object')
            stack[-1][1]=sys.intern(value)
            continue
        if (stack and isinstance(stack[-1][0],dict) and stack[-1][1]=='range'
                and not retain_ranges):
            allocator_body=(stack[-1][0].get('kind')=='CompoundStmt' and any(
                isinstance(frame[0],dict) and frame[0].get('kind')=='FunctionDecl'
                and frame[0].get('name') in ('operator new','operator new[]','operator delete','operator delete[]')
                for frame in stack[:-1]))
            macro_declaration=(stack[-1][0].get('kind') in ('FunctionDecl','VarDecl')
                and bool(stack[-1][0].get('loc',{}).get('expansionLoc')))
            # MemberExpr precedes its selected declaration signature in a
            # filtered AST. Preserve the callsite range so a complete same-TU
            # query can prove exact explicit operator selection, including
            # overloads. JSON places `name` after `range`, so retain this node
            # kind rather than guessing from a field not decoded yet.
            semantic_barrier=(stack[-1][0].get('kind') in ('GCCAsmStmt','MemberExpr') or
                stack[-1][0].get('kind')=='CompoundStmt' and any(
                    isinstance(frame[0],dict) and frame[0].get('kind')=='FunctionDecl'
                    and frame[0].get('loc',{}).get('expansionLoc') for frame in stack[:-1]))
            if allocator_body:stats['allocator_body_ranges_retained']+=1
            elif macro_declaration:stats['macro_declaration_ranges_retained']+=1
            elif semantic_barrier:stats['semantic_barrier_ranges_retained']+=1
            else:
                stack[-1][1]=None;stats['ranges_omitted']+=1
                if event in ('start_map','start_array'):skip=1
                continue
        if event in ('start_map','start_array'):
            node={} if event=='start_map' else []
            parent,slot=attach(node)
            stack.append([node,None,parent,slot])
            if event=='start_map':stats['objects']+=1
        elif event in ('end_map','end_array'):
            if not stack:raise ValueError('Clang AST closes an unopened container')
            node,_,parent,slot=stack.pop()
            if event=='end_map' and node:
                # A MemberExpr's name follows its range in Clang JSON. Once
                # decoded, discard ordinary field/method spans as before;
                # only explicit operators need a same-callsite selection proof.
                if (not retain_ranges and node.get('kind')=='MemberExpr' and
                        'range' in node and not explicit_operator(node)):
                    node.pop('range')
                    stats['semantic_barrier_ranges_retained']-=1
                    stats['ranges_omitted']+=1
                keys=node.keys()
                if keys<=_TYPE_KEYS and all(isinstance(item,str) for item in node.values()):
                    identity=tuple(node.items());canonical=types.setdefault(identity,node)
                    if canonical is not node:stats['type_metadata_reuses']+=1
                    parent[slot]=canonical
                elif len(node)==1 and 'file' in node and isinstance(node['file'],str):
                    canonical=files.setdefault(node['file'],node)
                    if canonical is not node:stats['include_metadata_reuses']+=1
                    parent[slot]=canonical
        elif event in ('string','number','boolean','null'):
            if event=='string' and stack and stack[-1][1] in _STRINGS:
                value=sys.intern(value)
            elif isinstance(value,Decimal):value=float(value)
            attach(value)
        else:
            raise ValueError('Unsupported JSON event '+event)
    if stack or skip:raise ValueError('Clang AST JSON ended inside a container')
    stats['roots']=len(roots)
    return roots,stats


def run_clang_ast(command, *, cwd, cache_path=None, timeout=None):
    """Decode complete ASTs using a bounded, cross-process-safe disk LRU."""
    policy=cache_policy();budget=policy['max_retained_bytes']
    cache=Path(cache_path) if cache_path is not None else None
    def finish(ast,stats,size,hit,retained,used=0,evicted=0,evicted_bytes=0,reason=None):
        stats.update({'cache_hit':hit,'json_bytes':size,'cache_policy_revision':policy['revision'],
                      'cache_budget_bytes':budget,'cache_retained':retained,
                      'cache_retained_bytes':used,'cache_evicted_entries':evicted,
                      'cache_evicted_bytes':evicted_bytes,'cache_retention_reason':reason})
        return ast,stats
    if cache is None:
        output,ast,stats,size=_decode_command(command,cwd,timeout)
        output.close();return finish(ast,stats,size,False,False,reason='no-cache-directory')
    with _cache_lock(cache.parent):
        _prepare_cache(cache.parent)
        compressed_cache=cache.with_suffix(cache.suffix+'.gz')
        existing=cache if cache.is_file() else compressed_cache if compressed_cache.is_file() else None
        if existing is not None:
            _marker(existing).touch(exist_ok=True)
            with existing.open('rb') as raw:
                stored_size=os.fstat(raw.fileno()).st_size
                if existing==compressed_cache:
                    with gzip.GzipFile(fileobj=raw,mode='rb') as stream:
                        ast,stats=parse_ast_file(stream);size=stream.tell()
                else:
                    size=stored_size;ast,stats=parse_ast_file(raw)
            stats.update(cache_storage='gzip' if existing==compressed_cache else 'json',cache_entry_bytes=stored_size)
            _touch(existing)
            used,count,removed=_evict(cache.parent,budget)
            return finish(ast,stats,size,True,existing.is_file(),used,count,removed,
                          'oversized' if stored_size>budget else 'cache-hit')
        used,count,removed=_evict(cache.parent,budget)
        output,ast,stats,size=_decode_command(command,cwd,timeout,cache.parent)
        reason='oversized' if size>budget else 'disabled' if not budget else 'retained'
        compressed=None;stored_size=size;target=cache
        try:
            try:
                payload=output
                if budget and size>=COMPRESS_ABOVE_BYTES:
                    compressed=tempfile.TemporaryFile(mode='w+b',dir=cache.parent)
                    output.seek(0)
                    with gzip.GzipFile(fileobj=compressed,mode='wb',compresslevel=1,mtime=0,filename='') as stream:
                        shutil.copyfileobj(output,stream,length=1024*1024)
                    stored_size=compressed.tell();payload=compressed;target=compressed_cache
                    reason='compressed-retained' if stored_size<=budget else 'oversized'
                stats.update(cache_storage='gzip' if target==compressed_cache else 'json',cache_entry_bytes=stored_size)
                if stored_size<=budget and budget:
                    used,more,more_bytes=_evict(cache.parent,budget-stored_size)
                    count+=more;removed+=more_bytes
                    if used<=budget-stored_size:
                        _publish(payload,target);used+=stored_size
                    else:reason='busy-cache-entries'
            except OSError as error:
                # Optional cache admission must never lose a fully decoded
                # original AST, including when the compression spool is full.
                reason='cache-write-error';stats['cache_write_error']=str(error)
        finally:
            if compressed is not None:compressed.close()
            output.close()
        return finish(ast,stats,size,False,target.is_file(),used,count,removed,reason)
