"""Long Windows build paths retain raw ASTs and actual cross-run cache hits."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_cache_paths import persistent_ast_cache_directory
from source_ast_stream import run_clang_ast

with tempfile.TemporaryDirectory(prefix='astpath-') as temporary:
    root=Path(temporary)
    epoch=hashlib.sha256(str(root).encode()).hexdigest()
    output=root/('long-build-output-'*6)
    chosen=persistent_ast_cache_directory(output,epoch,workspace=root,windows=True)
    assert chosen==root/'work/ast'/epoch,(chosen,root)
    assert chosen.name==epoch and len(chosen.name)==64
    key=hashlib.sha256(b'original Clang invocation').hexdigest()
    cache=chosen/'shard-00'/('full-types-'+key+'.json')
    marker=cache.with_name('.ast-lru-'+cache.name)
    assert len(str(marker))<=250
    producer=root/'emit.py'
    original={'kind':'TranslationUnitDecl','inner':[{'kind':'IntegerLiteral','value':'17'}]}
    producer.write_text('print('+repr(json.dumps(original))+')\n')
    first,report=run_clang_ast([sys.executable,str(producer)],cwd=root,cache_path=cache)
    assert report['cache_retained'] and not report['cache_hit'],report
    assert cache.is_file() and marker.is_file()
    mtime=cache.stat().st_mtime_ns
    second,reused=run_clang_ast(['__must_not_launch_on_cache_hit__'],cwd=root,cache_path=cache)
    assert reused['cache_hit'] and first==second==[original],reused
    assert cache.stat().st_mtime_ns==mtime
    # Source/configuration epoch changes cannot alias the retained artifact.
    changed=hashlib.sha256(b'changed original header').hexdigest()
    assert persistent_ast_cache_directory(output,changed,workspace=root,windows=True)!=chosen
    try:persistent_ast_cache_directory(output,epoch[:16],workspace=root,windows=True)
    except ValueError:pass
    else:raise AssertionError('truncated semantic fingerprint accepted')
print('PASS: bounded Windows paths, complete epoch/key hashes, retained AST and real cache hit without compiler invocation')
