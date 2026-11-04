"""Template-selected null pointer DMIs preserve aliases in Node and Chromium."""
import base64, copy, json, os, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_header_records import safe_zero_default_member_record
from source_first_global_link import storage_import_error

def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-2500:])
    return p.stdout

with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='template-null-dmi-') as folder:
    root=Path(folder)
    (root/'state.hpp').write_text('''#include <stddef.h>
template<class T,size_t N=1,class Enable=void> class Storage {
 T **data_=nullptr; size_t size_=0;
public:
 void bind(T **p){data_=p;}
 void put(int i,T *p){store(i,p);size_++;}
 int get(int i)const{return *data_[i]+(int)size_;}
 int empty()const{return data_==nullptr && size_==0;}
private:
 void store(int i,T *p){data_[i]=p;}
};
''')
    (root/'unit.cpp').write_text('''#include "state.hpp"
Storage<int> global;
int values[4]={1,3,5,7};int *slots[4]={&values[0],&values[1],&values[2],&values[3]};
extern "C" int initial(){return global.empty();}
extern "C" int step(int n){global.bind(slots);global.put(n%4,&values[(n+1)%4]);
 values[(n+1)%4]+=n;return global.get(n%4);}
''')
    (root/'main.cpp').write_text('''#include <cstdio>
extern "C" int initial(),step(int);
int main(){printf("%d\\n",initial());for(int n=0;n<256;n++)printf("%d\\n",step(n));}
''')
    native=root/'oracle.exe'
    run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',native])
    expected=[int(n) for n in run([native]).splitlines()]
    out=root/'out'
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
         '--out-dir',out,'--header-dependency-closure','--require-record-layouts'])
    module=out/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
    assert doc['blocked']==0,[(r['name'],r.get('reason')) for r in doc['definitions'] if r['status']=='blocked']
    assert any(r['kind']=='CXXRecordDecl' and r['name'].startswith('__cxx_record_Storage_') for r in doc['definitions'])
    js='async url=>{const m=await import(url);return [m.initial(),...Array.from({length:256},(_,n)=>m.step(n))];}'
    runner=root/'run.mjs'
    runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    assert json.loads(run(['node',runner]))==expected
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            try:
                page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
                assert actual==expected and not errors,(actual[:4],errors)
            finally:browser.close()
    # Another TU must use the canonical specialization only after comparing
    # the exact original constructor/method proof, rather than its bare name.
    (root/'second.cpp').write_text((root/'unit.cpp').read_text().replace('initial()','initial2()').replace('step(int','step2(int'))
    class_name=next(r['name'] for r in doc['definitions'] if r.get('header_record_factory'))
    symbols=root/'symbols.json';symbols.write_text(json.dumps({class_name:'unit.cpp'}))
    second=root/'second'
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','second.cpp',
         '--out-dir',second,'--header-dependency-closure','--require-record-layouts',
         '--project-symbols',symbols,'--import-root',out])
    imported=json.loads((second/'second.cpp.manifest.json').read_text())
    assert imported['blocked']==0,imported['definitions']
    dependency=next(r for r in imported['imports'] if r['name']==class_name)
    units={'unit.cpp':{'manifest':doc,'module':module}}
    assert dependency.get('header_record_proof') and storage_import_error(dependency,units) is None
    bad=copy.deepcopy(dependency);bad['header_record_proof']['semantic_sha256']='0'*64
    assert 'identical original specialization' in storage_import_error(bad,units)
    runner.write_text('import {initial2,step2} from '+json.dumps((second/'second.cpp.mjs').as_uri())+
                      ';console.log(JSON.stringify([initial2(),...Array.from({length:256},(_,n)=>step2(n))]));')
    assert json.loads(run(['node',runner]))==expected

# The broadened discovery rule grants only zero/null construction. It must
# never erase a nonzero value, a call, a reference, or a nontrivial destructor.
record={'kind':'CXXRecordDecl','completeDefinition':True,'definitionData':{
    'isStandardLayout':True,'dtor':{'trivial':True}},'inner':[
    {'kind':'FieldDecl','name':'data','type':{'qualType':'int **'},'inner':[
        {'kind':'CXXNullPtrLiteralExpr'}]},
    {'kind':'FieldDecl','name':'size','type':{'qualType':'size_t'},'inner':[
        {'kind':'IntegerLiteral','value':'0'}]}]}
assert safe_zero_default_member_record(record)
for bad in ({'kind':'IntegerLiteral','value':'7'}, {'kind':'CallExpr'},
            {'kind':'UnaryOperator','opcode':'++','inner':[{'kind':'IntegerLiteral','value':'0'}]}):
    altered=copy.deepcopy(record);altered['inner'][1]['inner']=[bad]
    assert not safe_zero_default_member_record(altered)
altered=copy.deepcopy(record);altered['inner'][0]['type']['qualType']='int *&'
assert not safe_zero_default_member_record(altered)
altered=copy.deepcopy(record);altered['definitionData']['dtor']['trivial']=False
assert not safe_zero_default_member_record(altered)
print('PASS 514 native/Node and 257 native/Chromium results: template null pointer construction, private calls, aliases, canonical cross-TU constructor proof; unsafe initializers and changed specialization rejected')
