#!/usr/bin/env python3
"""Execute original ES-module initializers in isolated, bounded Node processes.

Parsing and import-name audits cannot detect an undefined constructor used by
a global initializer. This audit executes precisely the published modules; it
never supplies fabricated globals or calls app_main. Passing is initialization
evidence only, not gameplay or native semantic parity.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys

from source_first_automate import run_compiler_process
from source_first_global_link import gather_batches

ROOT=Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory',type=Path,default=ROOT/'factory-output/source-first/automatic')
    parser.add_argument('--out',type=Path,default=ROOT/'reports/module-initialization.json')
    parser.add_argument('--jobs',type=int,choices=(1,2),default=1)
    parser.add_argument('--timeout',type=int,default=20)
    args=parser.parse_args()
    if args.timeout<1:parser.error('timeout must be positive')
    compile_report,units=gather_batches(args.directory.resolve())
    initial={source:{'manifest_sha256':hashlib.sha256(json.dumps(unit['manifest'],sort_keys=True).encode()).hexdigest(),
                     'module_sha256':digest(unit['module']) if unit['module'] else None}
             for source,unit in units.items()}
    rows=[]
    args.out.parent.mkdir(parents=True,exist_ok=True)

    def execute(item):
        source,unit=item
        row={'source':source,**initial[source]}
        if unit['module'] is None:
            return {**row,'status':'no-emitted-module'}
        script='try { await import('+json.dumps(unit['module'].resolve().as_uri())+'); process.exit(0); } catch(error) { console.error(error.stack || error); process.exit(1); }'
        try:
            result=run_compiler_process(['node','--input-type=module','--eval',script],args.timeout)
            row.update(status='passed' if result.returncode==0 else 'failed',returncode=result.returncode,
                       stderr=result.stderr[-5000:],stdout=result.stdout[-1000:])
        except subprocess.TimeoutExpired:
            row.update(status='timeout',returncode=None)
        except OSError as error:
            row.update(status='launch-failed',error=str(error))
        row['module_unchanged']=digest(unit['module'])==initial[source]['module_sha256']
        if not row['module_unchanged']:row['status']='input-changed'
        return row

    def save(complete=False):
        failed=[r for r in rows if r['status'] not in ('passed','no-emitted-module')]
        report={'format':'source-first-module-initialization-audit/1',
                'timestamp_utc':datetime.now(timezone.utc).isoformat(),'complete':complete,
                'directory':str(args.directory.resolve()),'selected_source_units':len(units),
                'completed_units':len(rows),'module_evaluations_passed':sum(r['status']=='passed' for r in rows),
                'failed_module_evaluations':len(failed),'all_emitted_modules_initialize':complete and not failed,
                'published_compiler_revision_source_counts':compile_report.get('compiler_revision_source_counts',{}),
                'app_main_executed':False,'original_gameplay_verified':False,
                'results':sorted(rows,key=lambda r:r['source'])}
        stage=args.out.with_suffix('.json.partial')
        stage.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
        stage.replace(args.out)
    save()
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        for future in as_completed([pool.submit(execute,item) for item in units.items()]):
            row=future.result();rows.append(row);save()
            if row['status'] not in ('passed','no-emitted-module'):
                print(row['status']+': '+row['source'],flush=True)
    save(True)
    print(str(sum(r['status']=='passed' for r in rows))+' modules initialized; report '+str(args.out))
    return 2 if any(r['status'] not in ('passed','no-emitted-module') for r in rows) else 0


if __name__=='__main__':sys.exit(main())
