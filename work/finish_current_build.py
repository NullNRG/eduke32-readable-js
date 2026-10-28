"""Finish the already-authorized rebuild with logged linking and strict audits."""
from pathlib import Path
from datetime import datetime,timezone
import argparse,ctypes,json,os,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[1]
STATE=ROOT/'reports/oct15-queued-link.json'
def now():return datetime.now(timezone.utc).isoformat()
def save(data):
    temporary=STATE.with_suffix('.json.partial');temporary.write_text(json.dumps(data,indent=2)+'\n');temporary.replace(STATE)
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--wait-pid',type=int,required=True)
    parser.add_argument('--directory',default='factory-output/source-first/oct15-world-recovery')
    parser.add_argument('--out',default='factory-output/source-first/oct15-world-linked')
    parser.add_argument('--state',default='reports/oct15-queued-link.json')
    parser.add_argument('--rounds',type=int,default=4);parser.add_argument('--retry-budget',type=int,default=12)
    args=parser.parse_args()
    global STATE
    STATE=(ROOT/args.state).resolve()
    if not STATE.is_relative_to(ROOT):parser.error('state output must remain in canonical workspace')
    state={'format':'source-first-postbuild-job/1','started_utc':now(),'worker_pid':os.getpid(),
        'wait_for_build_pid':args.wait_pid,'phase':'waiting-for-original-rebuild','steps':[],
        'gameplay_verified':False,'game_complete':False,'build_directory':args.directory,'link_directory':args.out}
    save(state)
    if os.name=='nt':
        kernel=ctypes.WinDLL('kernel32',use_last_error=True)
        kernel.OpenProcess.restype=ctypes.c_void_p
        kernel.WaitForSingleObject.argtypes=[ctypes.c_void_p,ctypes.c_ulong]
        kernel.CloseHandle.argtypes=[ctypes.c_void_p]
        handle=kernel.OpenProcess(0x100000,False,args.wait_pid)
        if handle:
            try:
                deadline=time.monotonic()+4*3600
                while kernel.WaitForSingleObject(handle,1000)==258:
                    if time.monotonic()>deadline:
                        state.update(phase='wait-timeout',finished_utc=now());save(state);return 2
            finally:kernel.CloseHandle(handle)
    else:
        while True:
            try:os.kill(args.wait_pid,0)
            except ProcessLookupError:break
            time.sleep(1)
    report=ROOT/args.directory/'recovery-report.json'
    if not report.is_file():
        state.update(phase='missing-final-build-report',finished_utc=now());save(state);return 2
    build=json.loads(report.read_text())
    state['build_summary']={key:build.get(key) for key in ('original_selected_units','verified_batch_units',
        'failed_batch_units','uniform_compiler_revision_verified','readable_definitions','blocked_definitions')}
    if not build.get('uniform_compiler_revision_verified') or build.get('verified_batch_units')!=156:
        state.update(phase='incomplete-source-build',finished_utc=now());save(state);return 2
    commands=[('global-link',[sys.executable,'tools/source_first_global_link.py','--directory',
        args.directory,'--out',args.out,
        '--rounds',str(args.rounds),'--jobs','2','--timeout','180','--retry-budget',str(args.retry_budget),'--persistent-ast-cache','--resume']),
        ('original-boot-audit',[sys.executable,'tools/source_first_boot_audit.py','--manifest-root',
         args.out,'--fast-current-only','--entry','app_main',
         '--probe','enginePreInit','--out','reports/oct15-postbuild-boot.json']),
        ('strict-game-gate',[sys.executable,'tests/source_factory/verify_playable_browser.py'])]
    for name,command in commands:
        state.update(phase=name,updated_utc=now());save(state)
        log=STATE.parent/(STATE.stem+'-'+name+'.log')
        with log.open('w',encoding='utf-8') as output:
            result=subprocess.run(command,cwd=ROOT,stdout=output,stderr=subprocess.STDOUT)
        state['steps'].append({'name':name,'command':command,'exit_code':result.returncode,
                              'log':log.relative_to(ROOT).as_posix(),'finished_utc':now()});save(state)
    state.update(phase='audits-finished',finished_utc=now(),
        game_complete=state['steps'][-1]['exit_code']==0,gameplay_verified=state['steps'][-1]['exit_code']==0)
    save(state)
    return 0 if state['game_complete'] else 2
if __name__=='__main__':sys.exit(main())
