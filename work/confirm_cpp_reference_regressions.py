"""Retry failed checks after competing source workers exit, preserving attempts."""
import argparse,copy,hashlib,json,os,subprocess,time
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--input',type=Path,default=ROOT/'reports/oct16-cpp-references-regression-verified.json')
parser.add_argument('--out',type=Path,default=ROOT/'reports/oct16-cpp-references-regression-confirmed.json');args=parser.parse_args()
args.input=args.input.resolve();args.out=args.out.resolve()
data=json.loads(args.input.read_text());assert data['complete'] and data['regression_inputs_unchanged']
def guard():
 for name,expected in data['regression_inputs'].items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,name
guard();result=copy.deepcopy(data);result['initial_complete_report']=args.input.relative_to(ROOT).as_posix()
result['initial_complete_report_sha256']=hashlib.sha256(args.input.read_bytes()).hexdigest();result['failure_retries']=[]
for row in result['tests']:
 if row['status']=='passed':continue
 previous=copy.deepcopy(row);start=time.monotonic()
 try:
  process=subprocess.run(row['command'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=240,env={**os.environ,'PYTHONUTF8':'1'})
  output=process.stdout+'\n--- stderr ---\n'+process.stderr;status='passed' if process.returncode==0 else 'failed';exit_code=process.returncode
 except subprocess.TimeoutExpired as error:
  output=str(error);status='timeout';exit_code=None
 log=args.out.parent/(args.out.stem+'-'+row['test']+'.log');log.write_text(output)
 row.update(status=status,returncode=exit_code,elapsed_seconds=round(time.monotonic()-start,3),log=str(log),output_tail=output[-5000:])
 result['failure_retries'].append({'test':row['test'],'previous_attempt':previous,'retry':copy.deepcopy(row),'reason':'Repeat failed check without competing game source compilation workers; identical compiler/test inputs'})
 print(status.upper()+': '+row['test'],flush=True);guard()
result['counts']={status:sum(row['status']==status for row in result['tests'])for status in ('passed','failed','timeout','launch-failed')}
result['all_passed']=result['counts']['passed']==result['selected_tests'];result['updated_utc']=datetime.now(timezone.utc).isoformat();guard()
args.out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'counts':result['counts'],'all_passed':result['all_passed'],'inputs_unchanged':True,'gameplay_verified':False}))
raise SystemExit(0 if result['all_passed'] else 1)
