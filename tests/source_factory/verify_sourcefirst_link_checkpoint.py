#!/usr/bin/env python3
"""Transactional resumption must reject tampered module/provenance/checkpoint."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from source_first_global_link import (link_input_fingerprint,write_link_checkpoint,
                                      resume_verified_units,write_json,stage_modules)
with tempfile.TemporaryDirectory() as t:
    root=Path(t);compiled=root/'compiled';out=root/'linked';compiled.mkdir();out.mkdir()
    # The actual production fingerprint is built from Clang outputs and
    # compiler implementation code. A same-input checkpoint can be resumed.
    (compiled/'recovery-report.json').write_text('{}')
    digest=link_input_fingerprint(compiled)
    before={'definitions':[{'name':'add','status':'blocked','reason':'unlinked identifiers: base'}],
            'imports':[],'emitted':0,'source':'caller.cpp'}
    after={'definitions':[{'name':'add','status':'source-first'}],
           'imports':[{'name':'base','from':'source.cpp'}],
           'emitted':1,'source':'caller.cpp'}
    provider={'definitions':[{'name':'base','status':'source-first'}],
              'imports':[],'emitted':1,'source':'source.cpp'}
    initial={'caller.cpp':{'manifest':before,'module':None},
             'source.cpp':{'manifest':provider,'module':None}}
    units={'caller.cpp':{'manifest':after,'module':out/'caller.cpp.mjs'},
           'source.cpp':{'manifest':provider,'module':None}}
    (out/'caller.cpp.mjs').write_text('export function add(){return 2;}\n')
    write_json(out/'caller.cpp.manifest.json',after)
    write_link_checkpoint(out,units,initial,digest,1)
    saved={'caller.cpp':{'manifest':before,'module':None},
           'source.cpp':{'manifest':provider,'module':None}}
    assert resume_verified_units(compiled,out,saved,digest)==1
    assert saved['caller.cpp']['manifest']==after
    stage_modules(saved,out)
    assert (out/'caller.cpp.mjs').is_file()
    assert 'function add' in (out/'caller.cpp.mjs').read_text()
    saved={'caller.cpp':{'manifest':before,'module':None},
           'source.cpp':{'manifest':provider,'module':None}}
    assert resume_verified_units(compiled,out,saved,'wrong fingerprint')==0
    (out/'caller.cpp.mjs').write_text('export function add(){return undefined;}\n')
    assert resume_verified_units(compiled,out,saved,digest)==0
    assert saved['caller.cpp']['manifest']==before
print('PASS: fingerprinted original-source global-link checkpoint and tamper rejection')
