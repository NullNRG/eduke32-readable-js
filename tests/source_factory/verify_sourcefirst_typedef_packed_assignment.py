"""Native/Node/Chromium packed anonymous typedef copy/move and alias parity."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_trivial_assignment import annotate_typedef_assignment_names

def run(arguments):
    result=subprocess.run(list(map(str,arguments)),cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert result.returncode==0,(arguments,result.stdout[-2000:],result.stderr[-3500:])
    return result.stdout

with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='packed-assignment-') as directory:
    root=Path(directory)
    (root/'types.h').write_text('''#include <stdint.h>
#pragma pack(push,1)
typedef struct { uint32_t bits; int16_t fvel,svel; int32_t q16avel,q16horz; uint32_t extbits; } input_t;
#pragma pack(pop)
typedef input_t saved_input_t;
''')
    (root/'unit.cpp').write_text('''#include "types.h"
extern "C" uint32_t copy_input(input_t* dst,const saved_input_t* src){
 *dst=*src;return dst->bits ^ dst->extbits ^ (uint32_t)dst->fvel ^ (uint32_t)src->svel;
}
extern "C" uint32_t move_input(input_t* dst,input_t* src){
 *dst=static_cast<input_t&&>(*src);return dst->bits ^ dst->extbits ^ (uint32_t)dst->q16avel;
}
extern "C" uint32_t self_input(input_t* dst){
 *dst=*dst;return dst->bits ^ (uint32_t)dst->q16horz;
}
''')
    (root/'main.cpp').write_text('''#include "types.h"
#include <cstdio>
extern "C" uint32_t copy_input(input_t*,const saved_input_t*),move_input(input_t*,input_t*),self_input(input_t*);
void bytes(const input_t* p){auto b=(const unsigned char*)p;for(unsigned i=0;i<sizeof(*p);i++)printf("%02x",b[i]);}
int main(){static_assert(sizeof(input_t)==20,"packed input ABI");static_assert(alignof(input_t)==1,"alignment");
for(int n=0;n<256;n++){
 input_t a{(uint32_t)n,(int16_t)(-n),7,n*31,n-95,(uint32_t)(n*911)};
 input_t b{0xf0000000U+(uint32_t)n,(int16_t)(n*97),(int16_t)(n*-51),-n*773,n*99001,0xa0000000U+(uint32_t)(n*919)};
 bytes(&a);printf(" ");bytes(&b);auto c=copy_input(&a,&b);auto m=move_input(&b,&a);auto s=self_input(&a);
 printf(" %u,%u,%u ",c,m,s);bytes(&a);printf(" ");bytes(&b);printf("\\n");}}
''')
    native=root/'oracle.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',native])
    cases=[line.split() for line in run([native]).splitlines()]
    for filtered in (False,True):
        out=root/str(filtered)
        command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
                 '--out-dir',out,'--require-record-layouts','--header-dependency-closure']
        if filtered:command+=['--filter','copy_input,move_input,self_input','--exact-filter','--dependency-closure']
        run(command);module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
        rows={row['name']:row for row in manifest['definitions']}
        for name in ('copy_input','move_input','self_input'):assert rows[name]['status']=='source-first',rows[name]
        assert 'cAssignAggregate(' in module.read_text()
        js='''async({url,cases})=>{const m=await import(url);
 const bytes=s=>Uint8Array.from(s.match(/../g),v=>parseInt(v,16));
 const hex=b=>Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');
 return cases.map(row=>{const a=bytes(row[0]),b=bytes(row[1]);
  const values=[m.copy_input(a,b),m.move_input(b,a),m.self_input(a)].join(',');
  return [values,hex(a),hex(b)];});}'''
        runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps({'url':module.as_uri(),'cases':cases})+')));')
        expected=[row[2:] for row in cases];actual=json.loads(run(['node',runner]));assert actual==expected,(filtered,actual[:2],expected[:2])
        if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
                    actual=page.evaluate(js,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode(),'cases':cases})
                    assert actual==expected and not errors,(filtered,actual[:2],errors)
                finally:browser.close()

# Query-local tag IDs never become a cross-parse name lookup. A typedef-only
# filtered dump must not acquire a proof from a different invocation's record.
traits={'isStandardLayout':True,'isTriviallyCopyable':True,'isAggregate':True,
        'copyAssign':{'trivial':True},'moveAssign':{'trivial':True},'dtor':{'trivial':True}}
record={'kind':'CXXRecordDecl','id':'tag','completeDefinition':True,'definitionData':traits}
alias={'kind':'TypedefDecl','id':'alias','name':'input_t','inner':[{'kind':'RecordType','isTagOwned':True,'decl':{'id':'tag','kind':'CXXRecordDecl'}}]}
assert annotate_typedef_assignment_names([alias])==0
assert annotate_typedef_assignment_names([record])==0
assert annotate_typedef_assignment_names([{'kind':'TranslationUnitDecl','inner':[record,alias]}])==1
record.pop('_source_trivial_assignment_typedefs')
collision={'kind':'NamespaceDecl','name':'other','inner':[{'kind':'TypedefDecl','id':'another','name':'input_t'}]}
assert annotate_typedef_assignment_names([{'kind':'TranslationUnitDecl','inner':[record,alias,collision]}])==0
assert '_source_trivial_assignment_typedefs' not in record
print('PASS 512 native/Node and 512 native/Chromium packed copy/move/self-assignment cases; all 20-byte objects checked; cross-query and scoped alias collisions rejected')
