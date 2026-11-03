"""Keep the exact selected anonymous union field across filtered Clang dumps."""
import base64,copy,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_field_bindings import index,rebind
def run(args):
    result=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert result.returncode==0,(args,result.stdout[-1600:],result.stderr[-2400:]);return result.stdout

with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='union-selection-') as folder:
    root=Path(folder)
    (root/'vector.h').write_text('''#include <stdint.h>
struct Vec {
 union {struct {int32_t x,y,z;};struct {int32_t d,u,v;};};
};
typedef Vec vector_t;
union Choice {int32_t first;int64_t second;};
''')
    (root/'unit.cpp').write_text('''#include "vector.h"
extern "C" int mutate(vector_t* p,int n){vector_t const rhs={n*97,-n*31,n+701};
 *p=rhs;return p->d+p->u+p->v;
}
extern "C" int64_t choose(int n){Choice c={.second=0x1234567800000000LL+n};return c.second;}
''')
    (root/'main.cpp').write_text('''#include "vector.h"
#include <cstdio>
extern "C" int mutate(vector_t*,int);extern "C" int64_t choose(int);
void bytes(const vector_t*p){auto b=(const unsigned char*)p;for(unsigned i=0;i<sizeof(*p);i++)printf("%02x",b[i]);}
int main(){static_assert(sizeof(vector_t)==12,"vector ABI");for(int n=-128;n<128;n++){
 vector_t p={n,n+3,n+9};bytes(&p);int result=mutate(&p,n);printf(" %d ",result);bytes(&p);printf(" %lld\\n",(long long)choose(n));}}
''')
    oracle=root/'oracle.exe';run(['clang++','-std=gnu++14',root/'unit.cpp',root/'main.cpp','-o',oracle])
    cases=[row.split() for row in run([oracle]).splitlines()]
    for filtered in (False,True):
        out=root/str(filtered);command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
            '--out-dir',out,'--require-record-layouts','--header-dependency-closure']
        if filtered:command+=['--filter','mutate,choose','--exact-filter','--dependency-closure']
        run(command);module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
        rows={row['name']:row for row in manifest['definitions']}
        for name in ('mutate','choose'):assert rows[name]['status']=='source-first',(filtered,rows[name])
        js='''async({url,cases})=>{const m=await import(url);return cases.map((row,i)=>{
 const data=Uint8Array.from(row[0].match(/../g),v=>parseInt(v,16)),n=i-128,result=m.mutate(data,n);
 return [String(result),Array.from(data,v=>v.toString(16).padStart(2,'0')).join(''),String(m.choose(n))];});}'''
        expected=[row[1:] for row in cases];runner=root/'run.mjs'
        runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps({'url':module.as_uri(),'cases':cases})+')));')
        actual=json.loads(run(['node',runner]));assert actual==expected,(filtered,actual[:2],expected[:2])
        if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
                    actual=page.evaluate(js,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode(),'cases':cases})
                    assert actual==expected and not errors,(filtered,actual[:2],expected[:2],errors)
                finally:browser.close()
# Identical query-local IDs do not authorize changed source callsites. Keep
# the selected member in the body witness, including unnamed-field spelling.
field={'kind':'FieldDecl','id':'complete-tag','type':{'qualType':'Original::(anonymous struct at original.h:7:3)'}}
initializer={'kind':'InitListExpr','type':{'qualType':'Original'},'field':{**field,'name':''},
             'inner':[{'kind':'IntegerLiteral','type':{'qualType':'int'},'value':'19'}]}
owner={'kind':'FunctionDecl','name':'original','mangledName':'original','type':{'qualType':'int ()'},
       'loc':{'offset':127},'inner':[{'kind':'CompoundStmt','inner':[initializer]}]}
proof=index([owner],[field]);filtered=copy.deepcopy(owner);selected=filtered['inner'][0]['inner'][0]['field'];selected['id']='other-process-tag'
assert rebind([filtered],proof)==1
assert filtered['inner'][0]['inner'][0]['field']['id']=='complete-tag'
assert rebind([filtered],proof)==0,'Rebinding must be stable after normalization'
changed=copy.deepcopy(owner);changed['inner'][0]['inner'][0]['inner'][0]['value']='20'
assert rebind([changed],proof)==0,'A changed initializer body must not inherit another callsite selection'
changed=copy.deepcopy(owner);changed['inner'][0]['inner'][0]['field']['type']['qualType']='Other'
assert rebind([changed],proof)==0,'A changed selected member must not inherit the old declaration'
print('PASS 512 native/Node and 512 native/Chromium cases: exact anonymous union initialization, common initial sequence, named nonfirst union member and 12-byte original storage; changed callsites rejected')
