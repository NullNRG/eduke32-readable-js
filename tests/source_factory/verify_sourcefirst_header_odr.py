"""Source-first ODR: coalesce only byte-proven identical inline friend bodies."""
import json
import sys
import tempfile
from pathlib import Path
from copy import deepcopy

HERE=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(HERE/'tools'))
from source_ast_to_js import resolve_friend_origin,source_header_inventory
from source_first_global_link import canonical_header_inline_owner,ownership,declared_ownership

with tempfile.TemporaryDirectory() as directory:
    root=Path(directory)
    (root/'src').mkdir()
    header=root/'src/classes.hpp'
    body=b'class Base { friend inline int operator+(Base a, Base b) { return 4; } };'
    header.write_bytes(body)
    rec=body.index(b'Base');off=body.index(b'operator+')
    assert resolve_friend_origin(str(root),'Base',rec,'operator+',off)=='src/classes.hpp'
    assert resolve_friend_origin(str(root),'Base',rec,'operator-',off) is None
    (root/'other.hpp').write_bytes(body)
    source_header_inventory.cache_clear();resolve_friend_origin.cache_clear()
    # Identical physical declarations in two different files are ambiguous.
    assert resolve_friend_origin(str(root),'Base',rec,'operator+',off) is None

proof={'source_header':'src/classes.hpp','source_offset':off,
       'enclosing_record':'Base','type':'int (Base, Base)',
       'semantic_sha256':'a'*64}
def unit(status='source-first',odr=None):
    row={'name':'__cxx_operator_abc','status':status}
    if status=='blocked':row['reason']='unlinked identifiers: missing_provider'
    if odr is not None:row['odr_inline']=dict(odr)
    return {'manifest':{'definitions':[row]},'module':None}
units={'a.cpp':unit(odr=proof),'b.cpp':unit(odr=proof)}
assert canonical_header_inline_owner(units,'__cxx_operator_abc',list(units))=='a.cpp'
assert ownership(units)==({'__cxx_operator_abc':'a.cpp'}, {})
assert declared_ownership(units)==({'__cxx_operator_abc':'a.cpp'}, {})
for mutate in ('source_header','source_offset','enclosing_record','type','semantic_sha256'):
    corrupt=deepcopy(units)
    corrupt['b.cpp']['manifest']['definitions'][0]['odr_inline'][mutate]='conflicting'
    owners,ambiguous=ownership(corrupt)
    assert not owners and '__cxx_operator_abc' in ambiguous,mutate
# No inline evidence -> ordinary same-name definitions stay ambiguous.
plain={'a.cpp':unit(),'b.cpp':unit()}
assert not ownership(plain)[0] and ownership(plain)[1]
# Source definition that failed semantic lowering cannot count as export.
blocked={'a.cpp':unit(odr=proof),'b.cpp':unit('blocked',odr=proof)}
assert ownership(blocked)[0]['__cxx_operator_abc']=='a.cpp'
print('PASS: exact header bytes, unique owner, inline semantic digest, all unsafe conflicts rejected')
