#!/usr/bin/env python3
"""Strict original-source playable browser gate, not a runtime fixture.

Never manufacture an entry HTML: fail if the source-built original app_main
is missing and require independently recorded browser gameplay evidence.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
report=ROOT/'reports/browser-gameplay-attempt.json'
html=ROOT/'dist/index.html'
result={'format':'eduke32-original-browser-attempt/1',
        'timestamp_utc':datetime.now(timezone.utc).isoformat(),
        'original_source_gameplay_verified':False,
        'entry_html_present':html.is_file(),
        'runtime_fixture_is_not_gameplay':True}
try:
    from importlib.util import spec_from_file_location, module_from_spec
    sys.path.insert(0,str(ROOT/'tools'))
    from verify_port_acceptance import evaluate
    audit=evaluate(ROOT)
    result['failed_acceptance_checks']=audit.get('failed_checks',[])
    result['unverified_acceptance_checks']=audit.get('unverified_checks',[])
    result['acceptance_passed']=bool(audit.get('all_acceptance_criteria_passed'))
except Exception as exc:
    result['acceptance_error']=str(exc)
if not html.is_file():
    result['status']='FAILED_MISSING_ORIGINAL_GAME_HTML'
    result['reason']='No complete source-linked original app_main browser bundle exists; cannot perform fake gameplay'
else:
    result['status']='UNVERIFIED_BROWSER_GAMEPLAY'
    result['reason']='Generated file exists but independent browser gameplay evidence is not verified'
    if result.get('acceptance_passed'):
        result['status']='PASSED';result['original_source_gameplay_verified']=True
report.parent.mkdir(exist_ok=True)
report.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
print(json.dumps(result,indent=2))
sys.exit(0 if result['status']=='PASSED' else 2)
