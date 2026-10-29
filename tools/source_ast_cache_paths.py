"""Persistent full-fingerprint AST cache roots that fit Windows path limits."""
import os
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]


def persistent_ast_cache_directory(output, epoch, *, workspace=ROOT, windows=None):
    if not re.fullmatch('[0-9a-f]{64}',epoch):
        raise ValueError('AST semantic epoch must retain its complete SHA-256 identity')
    preferred=Path(output)/'clang-ast-cache'/epoch
    if windows is None:windows=os.name=='nt'
    # Reserve the longest source compiler key plus its retention marker.
    # Some supported Windows installations still reject names beyond MAX_PATH.
    # Keeping the full epoch/key is essential; shorten directories, not hashes.
    def fits(directory):
        marker=directory/'shard-00'/('.ast-lru-full-types-'+'f'*64+'.json.gz')
        return len(str(marker.resolve()))<=250
    if not windows or fits(preferred):return preferred
    compact=Path(workspace)/'work/ast'/epoch
    if fits(compact):return compact
    local=os.environ.get('LOCALAPPDATA')
    if local:
        compact=Path(local)/'EDuke32SourceFactory/ast'/epoch
        if fits(compact):return compact
    raise ValueError('No persistent AST cache root fits Windows file paths; use a shorter workspace path')
