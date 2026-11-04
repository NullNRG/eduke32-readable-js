"""Cross-unit global tag/typedef pointers require identical Clang record proof."""
import copy,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import storage_import_error
def run(args,success=True):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert (p.returncode==0)==success,(args,p.stdout[-1200:],p.stderr[-2500:]);return p.stdout+p.stderr
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='pointer-types-') as folder:
    root=Path(folder);header=root/'node.hpp'
    header.write_text('typedef struct Node{int value;struct Node*next;}Node;extern Node*shared;\n')
    (root/'owner.cpp').write_text('#include "node.hpp"\nstruct Node*shared=nullptr;extern "C" int same(Node*p){return shared==p;}\n')
    (root/'consumer.cpp').write_text('#include "node.hpp"\nextern "C" int use(Node*p){shared=p;shared->value+=7;return shared->value;}\n')
    (root/'main.cpp').write_text('#include "node.hpp"\n#include <cstdio>\nextern "C" int use(Node*),same(Node*);int main(){for(int n=0;n<256;n++){Node v{n*11,nullptr};int r=use(&v);printf("%d,%d,%d\\n",r,same(&v),v.value);}}')
    native=root/'native.exe';run(['clang++',root/'owner.cpp',root/'consumer.cpp',root/'main.cpp','-o',native]);expected=run([native]).splitlines()
    compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--require-record-layouts','--header-dependency-closure']
    target=root/'target';run([*compiler,'--source','owner.cpp','--out-dir',target])
    symbols=root/'symbols.json';symbols.write_text(json.dumps({'shared':'owner.cpp'}))
    out=root/'consumer';run([*compiler,'--source','consumer.cpp','--out-dir',out,'--project-symbols',symbols,'--import-root',target])
    provider=json.loads((target/'owner.cpp.manifest.json').read_text());consumer=json.loads((out/'consumer.cpp.manifest.json').read_text())
    dep=next(r for r in consumer['imports'] if r['name']=='shared');row=next(r for r in provider['definitions'] if r['name']=='shared')
    assert dep['original_type']!=row['global_storage']['original_type'],(dep,row)
    units={'owner.cpp':{'manifest':provider,'module':target/'owner.cpp.mjs'}}
    assert dep['record_pointer_identity']==row['global_storage']['record_pointer_identity']
    assert storage_import_error(dep,units) is None
    for key in ('layout_sha256','record_name','pointee_cv'):
        bad=copy.deepcopy(dep);bad['record_pointer_identity'][key]=['const'] if key=='pointee_cv' else 'different'
        assert storage_import_error(bad,units),key
    runner=root/'run.mjs';runner.write_text('import {use} from '+json.dumps((out/'consumer.cpp.mjs').as_uri())+';import {same} from '+json.dumps((target/'owner.cpp.mjs').as_uri())+';for(let n=0;n<256;n++){const b=new Uint8Array(16),v=new DataView(b.buffer);v.setInt32(0,n*11,true);const r=use(b);console.log(r+","+same(b)+","+v.getInt32(0,true));}')
    assert run(['node',runner]).splitlines()==expected
    before=(target/'owner.cpp.mjs').read_bytes();header.write_text(header.read_text().replace('int value','long long value'))
    error=run([*compiler,'--source','consumer.cpp','--out-dir',out,'--project-symbols',symbols,'--import-root',target],False)
    assert 'global storage declaration type differs' in error or 'global pointer record identity' in error,error
    assert (target/'owner.cpp.mjs').read_bytes()==before
print('PASS 768 native/JS values: tag/typedef global pointer identity, one shared owner and exact target layout; changed record, qualifiers, layout and header rejected')
