"""Reproduce the original allocator proof and the frozen compiler checkpoint."""
import argparse,json,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--skip-preparation',action='store_true')
args=parser.parse_args()
steps=[]
def run(label,arguments):
    start=time.monotonic();print('START '+label,flush=True)
    result=subprocess.run([sys.executable,*arguments],cwd=ROOT)
    steps.append({'step':label,'arguments':arguments,'returncode':result.returncode,
                  'elapsed_seconds':round(time.monotonic()-start,3)})
    (ROOT/'reports/oct29-memory-checkpoint-steps.json').write_text(json.dumps({
        'steps':steps,'gameplay_verified':False},indent=2)+'\n')
    if result.returncode:raise SystemExit(result.returncode)
if not args.skip_preparation:
    run('Rebuild original libdivide provider',['tools/build_libdivide_source.py'])
    run('Rebuild original xxHash provider',['tools/build_xxhash_source.py'])
    run('Recompile all eight original generic allocator methods',[
        'tools/source_ast_to_js.py','--root','factory-output/browser-classic/source-tree/eduke32-master',
        '--source','source/build/src/smmalloc_generic.cpp','--compile-commands','factory-output/browser-classic/compile_commands.json',
        '--header-dependency-closure','--require-record-layouts',
        '--ast-cache-dir','work/ast/f3f73c89e7558265637b0512990774fe2bdcc6ec733701b88b4869ed0334ea68/shard-00',
        '--out-dir','factory-output/source-first/oct29-browser-generic-allocator-addresses'])
    run('Original allocator native/Node/Chromium comparison',['work/verify_original_generic_allocator_full.py'])
    run('Affected integrations',['tools/verify_recovery_suite.py','--match','browser_scanf','--match','partial_array',
        '--match','reexport','--match','wide_division','--match','native_addresses','--match','cpp_heap',
        '--match','fragment','--report','reports/oct29-memory-corrected-regression.json','--timeout','180'])
run('Complete frozen compiler regression',['tools/verify_recovery_suite.py',
    '--report','reports/oct29-memory-final-regression.json','--timeout','240'])
