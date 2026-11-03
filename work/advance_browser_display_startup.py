"""Refresh browser ownership proofs, then retry only affected startup units."""
import hashlib,json,sqlite3,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
base=ROOT/profile['build_root'];commands=ROOT/profile['derived_commands'];source=ROOT/profile['prepared_source_root']
database=base/'reports/semantic-index.sqlite';report=ROOT/'reports/nov02-browser-display-startup.json'
state={'format':'original-browser-display-startup-recovery/1','steps':[],
       'gameplay_verified':False,'original_engine_startup_verified':False}
def save():report.write_text(json.dumps(state,indent=2)+'\n')
def run(label,*args,allow_failure=False):
    path=ROOT/'reports'/('nov02-display-'+label+'.log');started=time.monotonic()
    with path.open('w',encoding='utf-8') as stream:
        proc=subprocess.run([sys.executable,*map(str,args)],cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT)
    state['steps'].append({'step':label,'returncode':proc.returncode,'seconds':round(time.monotonic()-started,2),
                           'log':path.relative_to(ROOT).as_posix()});save()
    print(label+': '+str(proc.returncode),flush=True)
    if proc.returncode and not allow_failure:raise SystemExit(proc.returncode)
    return proc.returncode

# Run after the existing semantic extraction process exits. create() refuses
# incomplete or mismatched selected-unit evidence; this never upgrades counts.
connection=sqlite3.connect(database)
try:
    # Ownership validation repeatedly queries these columns in the multi-GB
    # index. Extra search indexes change no declaration, observation or proof.
    connection.execute('CREATE INDEX IF NOT EXISTS source_decl_name ON declarations(name)')
    connection.execute('CREATE INDEX IF NOT EXISTS source_decl_definition ON declarations(definition,linkage,file)')
    connection.commit()
finally:connection.close()
run('heap-contract','tools/source_standard_heap_contract.py','--root',source,'--commands',commands,'--database',database)
run('header-owners','tools/source_header_definitions.py','--root',source,'--commands',commands,'--database',database)
prepared=json.loads((ROOT/'reports/browser-classic-preparation.json').read_text())
build_profile=base/'build-profile.json';configuration=json.loads(build_profile.read_text())
configuration['source_adaptations']=prepared['source_adaptations']
assert configuration['commands_sha256']==prepared['commands_sha256']
build_profile.write_text(json.dumps(configuration,indent=2)+'\n')
for owner,names in (('source/build/src/engine.cpp','r_tror_nomaskpass,usevoxels'),
        ('source/build/src/hightile.cpp','usehightile'),('source/build/src/screenshot.cpp','screenshot_dir'),
        ('source/build/src/sdlayer.cpp','refreshfreq'),('source/build/src/timer.cpp','timerGetNanoTickRate')):
    run(Path(owner).stem+'-globals','tools/recover_browser_component.py',owner,names)
for owner,names in (('source/build/src/baselayer.cpp','baselayer_init'),('source/build/src/engine.cpp','enginePreInit')):
    run(Path(owner).stem,'work/recover_boot_reachable.py',owner,names,allow_failure=True)
run('engine-probe','work/verify_fresh_engine_startup.py','--report','reports/oct30-original-browser-component.json',allow_failure=True)
proof=json.loads((ROOT/'reports/oct30-original-browser-component.json').read_text())
state['original_engine_startup_verified']=bool(proof.get('original_engine_startup_verified'));save()
owner=ROOT/profile['boot_module_root']/'source/duke3d/src/global.cpp.manifest.json'
document=json.loads(owner.read_text());fragments=[row for row in document.get('module_fragments',[]) if 'g_player' in row['exports']]
assert len(fragments)==1,'Original player source fragment ownership must be unique'
fragment=fragments[0]
run('player-relocation','work/rebuild_storage_fragment.py','source/duke3d/src/global.cpp','--fragment-sha256',fragment['sha256'])
run('player-storage','work/verify_original_player_storage.py')
run('console-probe','tools/verify_browser_engine_component.py','--console-only','--report','reports/nov02-original-console-chromium.json')
# The player refresh changes the graph fingerprint; bind startup evidence to
# the final graph even when its engine functions are unchanged.
run('final-engine-probe','work/verify_fresh_engine_startup.py','--report','reports/oct30-original-browser-component.json',allow_failure=True)
run('component-snapshot','tools/recover_browser_component.py','--snapshot')
proof=json.loads((ROOT/'reports/oct30-original-browser-component.json').read_text())
state['original_engine_startup_verified']=bool(proof.get('original_engine_startup_verified'))
state['compiler_frontend_sha256']=hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest();save()
