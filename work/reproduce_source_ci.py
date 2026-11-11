import re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
workflow=(ROOT/'.github/workflows/checks.yml').read_text()
tests=re.findall(r'(?m)^\s+-?\s*(?:run:\s*)?python tests/source_factory/(verify_sourcefirst\w+\.py)\s*$',workflow)
assert tests,tests
command=[sys.executable,str(ROOT/'tools/verify_recovery_suite.py'),'--jobs','1','--timeout','1200','--report','reports/nov11-ci-reproduction-regression.json']
for name in tests:command+=['--match',name]
print('Reproducing',len(tests),'Python CI checks',flush=True)
raise SystemExit(subprocess.run(command,cwd=ROOT).returncode)
