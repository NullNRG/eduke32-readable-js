"""Large complete source ASTs fit bounded cache storage without node loss."""
import gzip
import json
import os
from pathlib import Path
import sys
import tempfile
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_stream import run_clang_ast

with tempfile.TemporaryDirectory(prefix='compressed-ast-') as temporary:
    root=Path(temporary)
    # Keep declaration/body/reference identity plus a compressible original
    # source string larger than the disk budget. No nodes may be omitted.
    tree={'kind':'TranslationUnitDecl','inner':[
      {'id':'0x123','kind':'VarDecl','name':'original','type':{'qualType':'const char[2097153]'},
       'inner':[{'kind':'StringLiteral','value':'x'*(2*1024*1024)}]},
      {'kind':'DeclRefExpr','referencedDecl':{'id':'0x123','kind':'VarDecl','name':'original'}}]}
    original=json.dumps(tree).encode()
    source=root/'tree.json';source.write_bytes(original)
    producer=root/'emit.py';producer.write_text('import sys;sys.stdout.buffer.write(open(sys.argv[1],"rb").read())')
    command=[sys.executable,str(producer),str(source)]
    cache=root/('a'*64+'.json')
    budget=32768
    with patch.dict(os.environ,{'EDUKE32_AST_CACHE_MAX_BYTES':str(budget)}):
        decoded,first=run_clang_ast(command,cwd=root,cache_path=cache)
        compressed=cache.with_suffix('.json.gz')
        assert decoded==[tree] and first['cache_retained'],first
        assert first['cache_storage']=='gzip' and first['json_bytes']==len(original),first
        assert compressed.stat().st_size<budget<len(original)
        assert gzip.decompress(compressed.read_bytes())==original
        mtime=compressed.stat().st_mtime_ns
        reused,second=run_clang_ast(['__must_not_execute__'],cwd=root,cache_path=cache)
        assert reused==decoded and second['cache_hit'],second
        assert second['json_bytes']==len(original) and second['cache_entry_bytes']==compressed.stat().st_size
        assert compressed.stat().st_mtime_ns==mtime
        assert second['cache_retained_bytes']<=budget
    # Budget applies to compressed bytes too; the complete tree still decodes.
    with patch.dict(os.environ,{'EDUKE32_AST_CACHE_MAX_BYTES':'1'}):
        decoded,tiny=run_clang_ast(command,cwd=root,cache_path=root/'tiny.json')
        assert decoded==[tree] and not tiny['cache_retained'],tiny
        assert tiny['cache_retention_reason']=='oversized'
        assert not list(root.glob('*.partial'))
    with patch.dict(os.environ,{'EDUKE32_AST_CACHE_MAX_BYTES':str(budget)}),patch(
            'source_ast_stream.gzip.GzipFile',side_effect=OSError(28,'fixture disk full')):
        decoded,full=run_clang_ast(command,cwd=root,cache_path=root/'full.json')
        assert decoded==[tree] and not full['cache_retained']
        assert full['cache_retention_reason']=='cache-write-error'
print('PASS: lossless compressed AST, raw-byte identity, cache hit without frontend, stored-byte budget, full decode on overflow/disk failure')

with tempfile.TemporaryDirectory(prefix='stream-capture-') as temporary:
    root=Path(temporary)
    producer=root/'emit.py';producer.write_text('import json;print(json.dumps({"kind":"StringLiteral","value":"x"*2097152}))')
    with patch.dict(os.environ,{'EDUKE32_AST_CAPTURE_GZIP':'1','EDUKE32_AST_CACHE_MAX_BYTES':'32768'}):
        cache=root/('b'*64+'.json')
        decoded,stats=run_clang_ast([sys.executable,str(producer)],cwd=root,cache_path=cache)
        assert decoded==[{'kind':'StringLiteral','value':'x'*2097152}],stats
        assert stats['capture_storage']=='streamed-gzip' and stats['capture_stored_bytes']<32768
        assert stats['json_bytes']>2097152 and stats['cache_retained'],stats
        cached,hit=run_clang_ast(['__must_not_execute__'],cwd=root,cache_path=cache)
        assert cached==decoded and hit['cache_hit']
        try:run_clang_ast([sys.executable,'-c','print("{}");raise SystemExit(3)'],cwd=root)
        except RuntimeError:pass
        else:raise AssertionError('Nonzero Clang status accepted')
        import subprocess
        try:run_clang_ast([sys.executable,'-c','import time;time.sleep(10)'],cwd=root,timeout=.2)
        except subprocess.TimeoutExpired:pass
        else:raise AssertionError('Compressed compiler capture ignored timeout')
print('PASS: cache miss streams through bounded gzip, full JSON retained, native failures and timeout rejected')
