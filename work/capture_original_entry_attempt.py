"""Diagnostic only: retain a successfully lowered ORIGINAL body before link pruning.

Uses the canonical compiler unchanged. Missing providers stay unresolved and throw
when reached. Production manifests retain their blocked status. No stubs.
"""
import copy, hashlib, json, os, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import source_ast_to_js as compiler
OUT=ROOT/'factory-output/source-first/oct15-entry-attempt'
TARGET=ROOT/'factory-output/source-first/browser-target'
index=json.loads((TARGET/'browser-combined-symbol-owners.json').read_text())
(ROOT/'work/entry-attempt-owners.json').write_text(json.dumps({k:v for k,v in index.items() if v!='source/duke3d/src/game.cpp'},indent=2)+'\n')
original=compiler.produce
captured={}
def produce(*args,**kwargs):
    # This diagnostic is a separate module fragment. Bind same-TU definitions
    # to their existing, real module, retaining its owner-controlled cells.
    kwargs['project_symbols']=index
    seen={}
    def trace(frame,event,arg):
        if frame.f_code is original.__code__:
            if event=='return':
                seen['source']=frame.f_locals.get('source',[])
            return trace
        return None
    sys.settrace(trace)
    try: units,manifest=original(*args,**kwargs)
    finally: sys.settrace(None)
    for node,code,row in seen.get('source',[]):
        if row.get('name')=='app_main':
            captured.clear();captured.update(code=code,row=copy.deepcopy(row))
            if code and row.get('status')=='blocked' and row.get('reason','').startswith('unlinked identifiers:'):
                units=units+[code]
    return units,manifest
compiler.produce=produce
sys.argv=['source_ast_to_js.py','--root',str(ROOT/'factory-output/source-tree/eduke32-master'),
    '--source','source/duke3d/src/game.cpp','--filter','app_main','--header-dependency-closure',
    '--enum-closure','--project-symbols',str(ROOT/'work/entry-attempt-owners.json'),
    '--out-dir',str(OUT),'--ast-cache-dir',str(ROOT/'work/ast-cache-boot-probes')]
if '--finish' in sys.orig_argv:
    saved=json.loads((OUT/'source/duke3d/src/game.cpp.manifest.json').read_text())
    captured.update(code='previously captured original body',row=next(r for r in saved['definitions'] if r['name']=='app_main'))
else:
    compiler.main()
if not captured.get('code'):raise RuntimeError('Original app_main did not pass semantic lowering')
row=captured['row']
path=OUT/'source/duke3d/src/game.cpp.mjs'
text=path.read_text()
# Relocate compiler-generated dependency imports to the actual verified providers.
def relocate(match):
    provider=(path.parent/match.group(2)).resolve().relative_to(OUT).as_posix()
    actual=TARGET/provider
    if not actual.is_file():raise FileNotFoundError(actual)
    spec=os.path.relpath(actual,path.parent).replace('\\','/')
    return 'from '+json.dumps(spec if spec.startswith('.') else './'+spec)
text=re.sub(r'from ([\'"])([^\'"]+)\1',relocate,text)
storage={v['name']:v for v in row.get('external_storage_imports',[])}
existing=set(re.findall(r'^import \{ (\w+) \}',text,re.M))
imports=[]
rejected=[]
for name in row.get('source_references',[]):
    if name not in index:continue
    binding=storage.get(name,{}).get('binding',name)
    if binding in existing:continue
    actual=TARGET/(index[name]+'.mjs')
    if not actual.is_file():raise FileNotFoundError(actual)
    # A supplementary storage import must carry the same owner ABI/layout proof.
    if name in storage:
        from source_first_global_link import storage_import_error
        mf=json.loads(actual.with_suffix('.manifest.json').read_text())
        dep={**storage[name],'from':index[name]}
        err=storage_import_error(dep,{index[name]:{'manifest':mf,'module':actual}})
        if err:
            # Leave this binding genuinely absent; do not bypass the ABI gate.
            rejected.append({'name':name,'binding':binding,'reason':err})
            continue
    spec=os.path.relpath(actual,path.parent).replace('\\','/')
    imports.append('import { '+binding+' } from '+json.dumps(spec if spec.startswith('.') else './'+spec)+';')
path.write_text('// DIAGNOSTIC: original AST body with unresolved dependencies; NOT a linked game.\n'
    +'\n'.join(imports)+'\n'+text.replace('// Status: partial STRICT semantic conversion, not a full engine module.',
    '// Status: UNLINKED original-entry execution diagnostic.'))
report={'format':'original-entry-unlinked-execution-diagnostic/1',
    'compiler_unchanged':True,'original_definition':row,'module':str(path.relative_to(ROOT)),
    'module_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
    'original_source_sha256':hashlib.sha256((ROOT/'factory-output/source-tree/eduke32-master/source/duke3d/src/game.cpp').read_bytes()).hexdigest(),
    'missing_implementations_stubbed':False,'production_manifest_status':row['status'],
    'rejected_storage_imports':rejected,
    'gameplay_verified':False}
(ROOT/'reports/oct15-original-entry-attempt-build.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'diagnostic_module':str(path),'unresolved':row.get('unresolved_references',[])}))
