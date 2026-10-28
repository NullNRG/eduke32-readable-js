"""Header factory proof must preserve exact-byte origin and collision rejection."""
from pathlib import Path
import tempfile
import sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_header_records import header_proof, _source_header_index

with tempfile.TemporaryDirectory(prefix='header-origin-proof-') as temporary:
    tree=Path(temporary)
    a=tree/'records.h'
    a.write_bytes(b'// Declaration\ntypedef struct Widget { int value; } Widget;\n')
    original=a.read_bytes(); offset=original.index(b'Widget')
    node={'kind':'CXXRecordDecl','name':'Widget','completeDefinition':True,
          'loc':{'offset':offset,'includedFrom':{'file':'main.cpp'}},'inner':[]}
    first=header_proof(node,tree)
    assert first and first['source_header']=='records.h'
    assert first['source_offset']==offset
    # A second exact candidate at the same offset is ambiguous; neither is
    # allowed to become an invented shared ODR provider.
    b=tree/'second.h';b.write_bytes(original)
    _source_header_index.cache_clear()
    assert header_proof(node,tree) is None
    # Explicit physical origin remains valid even when names/offsets collide.
    node['loc']={'offset':offset,'file':'records.h'}
    proof=header_proof(node,tree)
    assert proof and proof['source_header']=='records.h'
    # Removing the second candidate restores unique included-from ownership.
    b.unlink();_source_header_index.cache_clear()
    node['loc']={'offset':offset,'includedFrom':{'file':'main.cpp'}}
    assert header_proof(node,tree)==first
    # A shifted offset and a wrong token must both fail closed.
    node['loc']['offset']+=1
    assert header_proof(node,tree) is None
    node['loc']['offset']=offset
    node['name']='Missing'
    assert header_proof(node,tree) is None
print('PASS: byte-accurate indexed header origin, collision rejection, physical provenance and invalid-offset checks')
