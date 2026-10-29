"""Run source-first regressions without stopping after the first failed test.

Each test executes independently and retains stdout/stderr. The report is
updated atomically after every completion, so interrupted runs remain useful.
These compiler tests do not attest native engine or browser gameplay success.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import argparse
import hashlib
import json
import os
import signal
from pathlib import Path
import subprocess
import sys
import time
import tempfile

ROOT=Path(__file__).resolve().parents[1]

def atomic_json(path,data):
    """Retry temporary Windows reader locks without exposing partial JSON."""
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',dir=path.parent,
                                     prefix=path.name+'.',suffix='.tmp',delete=False) as stream:
        json.dump(data,stream,indent=2);stream.write('\n');stage=Path(stream.name)
    try:
        for attempt in range(101):
            try:os.replace(stage,path);return
            except PermissionError:
                if attempt==100:raise
                time.sleep(0.05)
    finally:stage.unlink(missing_ok=True)


def regression_inputs():
    """Bind regression evidence to the compiler, runtimes and test sources."""
    rows={}
    for directory in ('tools','runtime','tests/source_factory','tests/source_first_link_fixture'):
        for path in sorted((ROOT/directory).rglob('*')):
            if path.is_file() and '__pycache__' not in path.parts and path.suffix in ('.py','.mjs','.json','.cpp','.c','.h','.hpp','.ps1'):
                rows[path.relative_to(ROOT).as_posix()]=hashlib.sha256(path.read_bytes()).hexdigest()
    return rows


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--jobs',type=int,default=1,
                        help='Serial by default: several legacy tests share fixture output paths')
    parser.add_argument('--timeout',type=int,default=180)
    parser.add_argument('--report',type=Path,default=ROOT/'reports/recovery-regression.json')
    parser.add_argument('--match',action='append',default=[],
                        help='Run test filenames containing any supplied text; repeat for affected feature families')
    args=parser.parse_args()
    if args.jobs<1 or args.timeout<1: parser.error('jobs and timeout must be positive')
    tests=[([sys.executable,str(path)],path.name) for path in
           sorted((ROOT/'tests/source_factory').glob('verify_sourcefirst*.py'))]
    semantic=ROOT/'tests/source_factory/verify_semantic_index.py'
    tests.append(([sys.executable,str(semantic)],semantic.name))
    tests += [(['node','--test',str(ROOT/'tests/source_factory'/name)],name)
              for name in ('runtime.test.mjs','portability.test.mjs')]
    if args.match: tests=[item for item in tests if any(text in item[1] for text in args.match)]
    if not tests: parser.error('no matching tests')
    initial_inputs=regression_inputs()
    input_digest=hashlib.sha256(json.dumps(initial_inputs,sort_keys=True).encode()).hexdigest()
    report=args.report.resolve();report.parent.mkdir(parents=True,exist_ok=True)
    logs=report.parent/(report.stem+'-logs');logs.mkdir(exist_ok=True)
    started=datetime.now(timezone.utc).isoformat();results=[]
    def execute(item):
        command,name=item;begin=time.monotonic()
        try:
            proc=subprocess.Popen(command,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                                  text=True,encoding='utf-8',errors='replace',
                                  env={**os.environ,'PYTHONUTF8':'1'},
                                  start_new_session=os.name!='nt',
                                  creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name=='nt' else 0)
            try: stdout,stderr=proc.communicate(timeout=args.timeout)
            except subprocess.TimeoutExpired:
                if os.name=='nt':
                    subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],
                                   stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,
                                   creationflags=subprocess.CREATE_NO_WINDOW)
                else:
                    os.killpg(proc.pid,signal.SIGKILL)
                stdout,stderr=proc.communicate()
                raise subprocess.TimeoutExpired(command,args.timeout,output=stdout,stderr=stderr)
            status='passed' if proc.returncode==0 else 'failed'
            output=stdout+'\n--- stderr ---\n'+stderr;code=proc.returncode
        except subprocess.TimeoutExpired as error:
            status='timeout';code=None
            def decode(value): return value.decode('utf-8',errors='replace') if isinstance(value,bytes) else (value or '')
            output=decode(error.stdout)+'\n--- stderr ---\n'+decode(error.stderr)
        except OSError as error:
            status='launch-failed';code=None;output=str(error)
        path=logs/(name+'.log');path.write_text(output,encoding='utf-8')
        result={'test':name,'command':command,'status':status,'returncode':code,
                'elapsed_seconds':round(time.monotonic()-begin,3),'log':str(path),
                'output_tail':output[-2400:] if status!='passed' else output[-500:]}
        atomic_json(logs/(name+'.result.json'),result)
        return result
    def save(complete=False):
        counts={kind:sum(item['status']==kind for item in results)
                for kind in ('passed','failed','timeout','launch-failed')}
        final_inputs=regression_inputs() if complete else None
        unchanged=final_inputs==initial_inputs if complete else None
        data={'format':'source-first-recovery-regression/1','started_utc':started,
              'updated_utc':datetime.now(timezone.utc).isoformat(),'complete':complete,
              'selected_tests':len(tests),'completed_tests':len(results),'counts':counts,
              'all_passed':complete and counts['passed']==len(tests) and unchanged,'python':sys.executable,
              'compiler_frontend_sha256':initial_inputs.get('tools/source_ast_to_js.py'),
              'regression_input_sha256':input_digest,'regression_inputs':initial_inputs,
              'regression_inputs_unchanged':unchanged,
              'changed_regression_inputs':sorted(k for k in initial_inputs.keys()|final_inputs.keys()
                  if initial_inputs.get(k)!=final_inputs.get(k)) if complete else [],
              'host':sys.platform,'jobs':args.jobs,'per_test_timeout_seconds':args.timeout,
              'source_target':os.environ.get('EDUKE32_CLANG_TARGET','x86_64-linux-gnu'),
              'sysroot':os.environ.get('EDUKE32_SYSROOT'),'tests':sorted(results,key=lambda item:item['test']),
              'gameplay_verified':False}
        atomic_json(report,data)
    save()
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        for future in as_completed([pool.submit(execute,item) for item in tests]):
            result=future.result();results.append(result)
            try:save()
            except OSError as error:
                # Individual outcomes are durable. Continue collecting instead
                # of silently draining queued tests in executor.__exit__.
                print('Report publication failed; individual results retained: '+str(error),file=sys.stderr,flush=True)
            print(f'{result["status"].upper()}: {result["test"]} ({result["elapsed_seconds"]}s)',flush=True)
    save(True)
    failures=sum(item['status']!='passed' for item in results)
    if regression_inputs()!=initial_inputs:
        failures+=1
        print('Regression inputs changed during execution; this run cannot attest one revision.',flush=True)
    print(f'{len(results)-failures}/{len(tests)} passed; report: {report}')
    return 1 if failures else 0


if __name__=='__main__':sys.exit(main())
