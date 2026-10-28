#!/usr/bin/env python3
"""Coverage and 90% goal cannot be attested from mixed compiler revisions."""
import os,sys
from pathlib import Path
sys.path.insert(0,os.environ.get('EDUKE_TEST_COMPILER_DIR') or str(Path(__file__).resolve().parents[2]/'tools'))
from source_first_automate import summarize_batches

def row(source,revision='sha256:A',status='ok'):
    return {'sources':[source],'status':status,'compiler_fingerprint':revision,
            'revision_guard_verified':True,'input_guard_before':'guard','input_guard_after':'guard',
            'readable_definitions':1,'blocked_definitions':0,'invalid_imports':0}
base=[row('a.cpp'),row('b.cpp')]
attestation={'verified':True,'start_fingerprint':'sha256:A','end_fingerprint':'sha256:A'}
a=summarize_batches(base,[],2,revision_attestation=attestation)
assert a['uniform_compiler_revision_verified'],a
for invalid in ([row('a.cpp'),row('b.cpp','sha256:B')],
                [row('a.cpp'),row('b.cpp',None)],
                [row('a.cpp'),row('b.cpp',status='failed')]):
    assert not summarize_batches(invalid,[],2,revision_attestation=attestation)['uniform_compiler_revision_verified']
assert not summarize_batches(base,[],156,revision_attestation=attestation)['uniform_compiler_revision_verified']
assert not summarize_batches(base,[],2)['uniform_compiler_revision_verified']
legacy=[{key:value for key,value in item.items() if not key.startswith('input_guard') and key!='revision_guard_verified'} for item in base]
assert not summarize_batches(legacy,[],2,revision_attestation=attestation)['uniform_compiler_revision_verified']
changed=[dict(base[0]),dict(base[1],input_guard_after='changed')]
assert not summarize_batches(changed,[],2,revision_attestation=attestation)['uniform_compiler_revision_verified']
assert not summarize_batches(base,[],2,revision_attestation={**attestation,'end_fingerprint':'sha256:B'})['uniform_compiler_revision_verified']
print('PASS: current full-inventory attestation requires guarded batches and matching start/end revision')
