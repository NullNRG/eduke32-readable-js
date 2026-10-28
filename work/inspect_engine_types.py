import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from source_ast_stream import parse_ast_file
from source_header_records import normalize_specializations
from source_ast_to_js import recover_type_aliases
from source_byte_records import recover_byte_records,descendants
root=Path(__file__).resolve().parents[1]
cache=root/'work/ast-cache-engine-pools'
with next(cache.glob('full-types-*.json')).open('rb') as f: ast,stats=parse_ast_file(f)
normalize_specializations(ast)
layouts=json.loads(next(cache.glob('layouts-*.json')).read_text())
if 'layouts' in layouts:layouts=layouts['layouts']
aliases=recover_type_aliases(ast)
failures=[]
def trace(frame,event,arg):
    if frame.f_code.co_filename.endswith('source_byte_records.py') and frame.f_code.co_name=='build' and event=='return':
        if arg is None:
            loc=frame.f_locals;r=loc.get('record',{});names=loc.get('by_id_names',{}).get(loc.get('identity'),[])
            if any(any(t in n for t in ('sprite','wall','vec2','vec3')) for n in names):
                failures.append(dict(names=names,traits=r.get('definitionData'),line=frame.f_lineno,
                    valid=loc.get('valid'),layout=loc.get('layout'),field=loc.get('field'),
                    methods=[n.get('name') for n in r.get('inner',[]) if n.get('kind')=='CXXMethodDecl' and not n.get('isImplicit')]))
    return trace
sys.settrace(trace)
result=recover_byte_records(ast,layouts,aliases,source_root=root/'factory-output/source-tree/eduke32-master')
sys.settrace(None)
output={'layouts_count':len(layouts),'aliases':{k:v for k,v in aliases.items() if any(t in k for t in ('sprite','wall','vec2','vec3'))},'recovered':[n for n in result if any(t in n for t in ('sprite','wall','vec2','vec3'))],'failures':failures}
(root/'work/engine-type-diagnosis.json').write_text(json.dumps(output,indent=2))
print(json.dumps(output,indent=2)[:16000])
