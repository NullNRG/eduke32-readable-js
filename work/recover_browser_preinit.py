"""Link original startup fragments to preserved source state and real host APIs."""
import hashlib,json,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from browser_target_closure import build
BASE=ROOT/'factory-output/source-first/oct20-source-closure-linked'
TARGET=ROOT/'factory-output/source-first/oct20-engine-preinit-browser'
FRAGMENTS=ROOT/'factory-output/source-first/oct20-platform-fragments'
steps=[]
def run(label,args):
    log=ROOT/'reports'/('oct20-preinit-'+label+'.log')
    with log.open('w',encoding='utf-8') as stream:
        result=subprocess.run([sys.executable,*map(str,args)],cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT)
    steps.append({'step':label,'returncode':result.returncode,'log':log.relative_to(ROOT).as_posix()})
    (ROOT/'reports/oct20-browser-preinit-integration.json').write_text(json.dumps({'steps':steps,'gameplay_verified':False},indent=2)+'\n')
    if result.returncode:raise SystemExit('Failed: '+str(log))
    print(label+' finished',flush=True)

# Snapshot every exact source module so existing state remains owned once.
# Only generated browser staging is written; the attested link is immutable.
for path in (BASE/'source').rglob('*'):
    if path.is_file() and path.suffix in ('.mjs','.json'):
        dest=TARGET/path.relative_to(BASE);dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(path,dest)
for source,entry in [('source/build/src/sdlayer.cpp','wm_msgbox'),('source/build/src/engine.cpp','enginePreInit')]:
    build(TARGET,TARGET,ROOT/'reports/oct20-browser-platform-closure.json')
    index=json.loads((TARGET/'browser-combined-symbol-owners.json').read_text())
    index.pop(entry,None)
    symbols=FRAGMENTS/(entry+'-symbols.json');symbols.parent.mkdir(parents=True,exist_ok=True)
    symbols.write_text(json.dumps(index,indent=2)+'\n')
    run(entry+'-compile',['tools/source_ast_to_js.py','--root',ROOT/'factory-output/source-tree/eduke32-master',
        '--source',source,'--compile-commands',ROOT/'factory-output/compile_commands.json','--filter',entry,
        '--out-dir',FRAGMENTS,'--project-symbols',symbols,'--import-root',TARGET,
        '--dependency-closure','--enum-closure','--header-dependency-closure'])
    manifest=FRAGMENTS/(source+'.manifest.json')
    doc=json.loads(manifest.read_text());rows=[r for r in doc['definitions'] if r['name']==entry]
    if len(rows)!=1 or rows[0]['status']!='source-first':
        (ROOT/('reports/oct20-preinit-blocked-'+entry+'.json')).write_text(json.dumps(rows,indent=2)+'\n')
        raise SystemExit(entry+' remains blocked; see recorded original definition')
    run(entry+'-install',['tools/install_verified_fragment.py','--manifest',manifest,'--target',TARGET,'--exports',entry,
        '--report',ROOT/('reports/oct20-preinit-'+entry+'-integration.json')])
print('Original enginePreInit linked as a source fragment; execution remains to be tested.')
