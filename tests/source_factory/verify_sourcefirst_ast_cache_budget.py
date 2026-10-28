"""Bound AST disk retention without dropping any decoded source semantics."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_stream import cache_policy,run_clang_ast
import source_ast_stream

TREE={'kind':'TranslationUnitDecl','inner':[
    {'id':'0x10','kind':'FunctionDecl','name':'original_function',
     'loc':{'file':'original.cpp','offset':14},'type':{'qualType':'int ()'},
     'inner':[{'kind':'CompoundStmt','inner':[{'kind':'ReturnStmt','inner':[
         {'kind':'DeclRefExpr','referencedDecl':{'id':'0x20','kind':'VarDecl',
          'name':'original_global','type':{'qualType':'int'}}}]}]}]},
    {'id':'0x20','kind':'VarDecl','name':'original_global','type':{'qualType':'int'},
     'inner':[{'kind':'IntegerLiteral','value':'37','type':{'qualType':'int'}}]}]}
PAYLOAD=json.dumps(TREE).encode('utf-8')
COMMAND=[sys.executable,'-c','import sys; sys.stdout.buffer.write('+repr(PAYLOAD)+')']
SIZE=len(PAYLOAD)


def invoke(directory,name,command=COMMAND):
    ast,stats=run_clang_ast(command,cwd=ROOT,cache_path=directory/name)
    assert ast==[TREE],'cache policy altered original declarations, bodies or references'
    assert stats['cache_retained_bytes']<=stats['cache_budget_bytes'],stats
    return stats


def worker(directory,index):
    for number in range(8):invoke(directory,f'worker-{index}-{number%3}.json')
    print('PASS worker',index)


if len(sys.argv)>1 and sys.argv[1]=='--worker':
    worker(Path(sys.argv[2]),int(sys.argv[3]));sys.exit(0)
if len(sys.argv)>1 and sys.argv[1]=='--reader-hold':
    directory=Path(sys.argv[2]);ready=Path(sys.argv[3])
    original=source_ast_stream.parse_ast_file
    def hold(stream,**kwargs):
        ready.touch();time.sleep(1)
        assert (directory/'a.json').is_file(),'another process evicted an open AST read'
        return original(stream,**kwargs)
    source_ast_stream.parse_ast_file=hold
    invoke(directory,'a.json',['__must_not_execute_on_cache_hit__']);sys.exit(0)


with tempfile.TemporaryDirectory(prefix='source ast budget ') as temp:
    root=Path(temp)
    with patch.dict(os.environ,{'EDUKE32_AST_CACHE_MAX_BYTES':str(SIZE*2)}):
        cache=root/'lru'
        assert not invoke(cache,'a.json')['cache_hit']
        assert not invoke(cache,'b.json')['cache_hit']
        hit=invoke(cache,'a.json',['__must_not_execute_on_cache_hit__'])
        assert hit['cache_hit']
        added=invoke(cache,'c.json')
        assert added['cache_evicted_entries']==1 and added['cache_evicted_bytes']==SIZE,added
        assert (cache/'a.json').is_file() and (cache/'c.json').is_file()
        assert not (cache/'b.json').exists(),'LRU evicted the recently read entry'
        assert sum(path.stat().st_size for path in cache.glob('*.json'))==SIZE*2
        # Unrelated metadata cannot become an eviction candidate.
        unrelated=cache/'important-source-manifest.json';unrelated.write_text('{"source":"original.cpp"}')
        invoke(cache,'d.json')
        assert unrelated.is_file()
    with patch.dict(os.environ,{'EDUKE32_AST_CACHE_MAX_BYTES':str(SIZE-1)}):
        cache=root/'oversized'
        result=invoke(cache,'original.json')
        assert not result['cache_retained'] and result['cache_retention_reason']=='oversized',result
        assert not (cache/'original.json').exists()
        assert not list(cache.glob('*.partial')),'oversized dump left retained scratch data'
    with patch.dict(os.environ,{'EDUKE32_AST_CACHE_MAX_BYTES':'0'}):
        assert cache_policy()['max_retained_bytes']==0
        assert not invoke(root/'disabled','original.json')['cache_retained']
    with patch.dict(os.environ,{'EDUKE32_AST_CACHE_MAX_BYTES':str(SIZE*2)}):
        cache=root/'legacy';cache.mkdir()
        legacy=cache/('a'*64+'.json');legacy.write_bytes(PAYLOAD)
        stale=cache/'.ast-cache-publish-abandoned.partial';stale.write_bytes(b'left by killed worker')
        invoke(cache,'new.json')
        assert not stale.exists(),'abandoned atomic-publication scratch was not reclaimed'
        result=invoke(cache,'third.json')
        assert not legacy.exists() and result['cache_evicted_entries']==1,result
        cache=root/'disk-error'
        with patch('source_ast_stream.shutil.copyfileobj',side_effect=OSError(28,'No space left on device')):
            result=invoke(cache,'original.json')
        assert not result['cache_retained'] and result['cache_retention_reason']=='cache-write-error',result
        assert not list(cache.glob('*.partial'))
        # An eviction request must wait until another process closes its read.
        with patch.dict(os.environ,{'EDUKE32_AST_CACHE_MAX_BYTES':str(SIZE)}):
            cache=root/'open-reader';invoke(cache,'a.json');ready=root/'reader-ready'
            child=subprocess.Popen([sys.executable,str(Path(__file__).resolve()),'--reader-hold',str(cache),str(ready)],
                    stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
            deadline=time.monotonic()+20
            while not ready.exists() and child.poll() is None and time.monotonic()<deadline:time.sleep(0.01)
            assert ready.exists(),'reader did not start'
            invoke(cache,'b.json')
            out,err=child.communicate(timeout=20)
            assert child.returncode==0,(out,err)
            assert not (cache/'a.json').exists() and (cache/'b.json').is_file()
        # Independent compiler processes share the same OS lock and budget.
        cache=root/'parallel'
        children=[subprocess.Popen([sys.executable,str(Path(__file__).resolve()),'--worker',str(cache),str(i)],
                    stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True) for i in range(3)]
        for child in children:
            out,err=child.communicate(timeout=60)
            assert child.returncode==0,(out,err)
        assert sum(path.stat().st_size for path in cache.glob('*.json'))<=SIZE*2
        assert not list(cache.glob('*.partial'))
print('PASS: tiny-budget LRU, oversized complete decode, zero retention, legacy migration, disk-error resilience and concurrent cache safety')
