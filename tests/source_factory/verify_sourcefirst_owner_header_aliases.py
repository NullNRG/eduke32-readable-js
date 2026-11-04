"""Whole-owner rebuild aliases retain actual original header callable identity."""
import copy,hashlib,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_owner_aliases import retain_header_aliases
from browser_target_closure import active_exports
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(args,p.stdout[-1200:],p.stderr[-2500:]);return p.stdout
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='owner-header-aliases-') as folder:
    root=Path(folder);(root/'header.hpp').write_text('static inline int leaf(int n){return n*3+7;}\nstatic inline int advance(int n){return leaf(n);}\nstatic inline int unused(){asm("nop");return 0;}\n')
    (root/'unit.cpp').write_text('#include "header.hpp"\nextern "C" int entry(int n){return advance(n);}\n')
    compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
              '--header-dependency-closure','--dependency-closure','--ast-cache-dir',root/'cache']
    old=root/'old';run([*compiler,'--filter','entry','--exact-filter','--out-dir',old])
    before=json.loads((old/'unit.cpp.manifest.json').read_text());old_exports=active_exports(old/'unit.cpp.mjs')
    symbols=root/'symbols.json';symbols.write_text('{}');new=root/'new'
    digest=hashlib.sha256((old/'unit.cpp.mjs').read_bytes()).hexdigest()
    run([*compiler,'--header-inlines','--header-inline-filter','advance','--out-dir',new,'--project-symbols',symbols,'--import-root',old,'--rebuild-owner-sha256',digest])
    module=new/'unit.cpp.mjs';current=json.loads(module.with_suffix('.manifest.json').read_text())
    assert not any(row.get('source_name')=='unused' for row in current['definitions'])
    missing=old_exports-active_exports(module);assert len(missing)==1,missing
    doc,code=retain_header_aliases(before,current,missing,module.read_text());module.write_text(code)
    assert old_exports<=active_exports(module)
    assert len(doc['compiler_abi_aliases'])==1 and doc['compiler_abi_aliases'][0]['additional_source_definition'] is False
    name=next(iter(missing));runner=root/'run.mjs'
    runner.write_text('import * as m from '+json.dumps(module.as_uri())+';if(m['+json.dumps(name)+']!==m.advance)throw Error("Callable alias changed identity");for(let n=-128;n<128;n++)if(m.entry(n)!==m['+json.dumps(name)+'](n)||m.entry(n)!==n*3+7)throw Error("Original body differs");')
    run(['node',runner])
    for mutate in ('input','line','type'):
        bad=copy.deepcopy(before)
        if mutate=='input':bad['ast_cache_inputs']['sha256']='0'*64
        else:
            row=next(r for r in bad['definitions'] if r['name']==name)
            row['line']=row['line']+1 if mutate=='line' else row['line']
            if mutate=='type':row['original_type']='long (long)'
        try:retain_header_aliases(bad,current,missing,module.read_text())
        except ValueError:pass
        else:raise AssertionError('Unproved alias accepted: '+mutate)
print('PASS 256 source results and exact callable identity across rebuilt header names; changed TU bytes, line and signature rejected; aliases excluded from source-definition recovery')
