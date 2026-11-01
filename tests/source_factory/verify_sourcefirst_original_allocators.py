"""Original mimalloc new/delete header wrappers, identities and native behavior.

The instrumented mi_* providers below are differential-test fixtures only.
Production manifests must retain those dependencies when no real provider exists.
"""
import hashlib,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];SOURCE=ROOT/'factory-output/source-tree/eduke32-master'
def run(args,cwd=ROOT):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=120)
 assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-2000:]);return p.stdout.strip()
with tempfile.TemporaryDirectory(prefix='eduke-original-allocators-') as temp:
 root=Path(temp);out=root/'out';out.mkdir()
 index=root/'providers.json';index.write_text(json.dumps({n:'test-providers' for n in ('mi_new','mi_new_nothrow','mi_free','mi_free_size')}))
 providers=out/'test-providers.mjs'
 providers.write_text('''const block=new Uint8Array(32);let count=0,total=0n,freed=0,sized=0n;
 export function mi_new(n){count++;total+=BigInt(n);return block;}
 export function mi_new_nothrow(n){count+=10;total+=BigInt(n);return block;}
 export function mi_free(p){if(p===block)freed++;else throw new Error('wrong allocation identity');}
 export function mi_free_size(p,n){mi_free(p);sized+=BigInt(n);}
 export function reset(){count=0;total=0n;freed=0;sized=0n;}
 export function snapshot(){return [count,total,freed,sized].join(',');}
 ''')
 cmd=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(SOURCE),'--source','source/build/src/smmalloc_generic.cpp',
  '--compile-commands',str(ROOT/'factory-output/compile_commands.json'),'--filter','operator new,operator delete',
  '--out-dir',str(out),'--ast-cache-dir',str(ROOT/'work/ast-cache-boot-probes')]
 run(cmd)
 mf=out/'source/build/src/smmalloc_generic.cpp.manifest.json'
 blocked=json.loads(mf.read_text())['definitions'];assert len(blocked)==10
 assert all(d['status']=='blocked' and d.get('unresolved_references') for d in blocked)
 assert all(d['linkage']=='external' and 'odr_inline' not in d for d in blocked)
 run(cmd+['--project-symbols',str(index)])
 rows=json.loads(mf.read_text())['definitions'];assert len(rows)==10 and all(d['status']=='source-first' for d in rows),rows
 for row in rows:
  proof=row['original_allocator_definition'];header=SOURCE/proof['source_header']
  assert proof['header_sha256']==hashlib.sha256(header.read_bytes()).hexdigest()
  assert proof['owner_translation_unit']=='source/build/src/smmalloc_generic.cpp'
 names={r['original_allocator_definition']['mangled_name']:r['name'] for r in rows}
 module=out/'source/build/src/smmalloc_generic.cpp.mjs'
 driver=root/'run.mjs';driver.write_text('import * as m from '+json.dumps(module.as_uri())+';import * as t from '+json.dumps(providers.as_uri())+''';
 for(let n=0;n<512;n++){t.reset();let a=m.'''+names['_Znwm']+'''(BigInt(n));let b=m.'''+names['_Znam']+'''(BigInt(n+1));let c=m.'''+names['_ZnwmRKSt9nothrow_t']+'''(BigInt(n+2),{});let d=m.'''+names['_ZnamRKSt9nothrow_t']+'''(BigInt(n+3),{});
 m.'''+names['_ZdlPv']+'''(a);m.'''+names['_ZdaPv']+'''(b);m.'''+names['_ZdlPvRKSt9nothrow_t']+'''(c,{});m.'''+names['_ZdaPvRKSt9nothrow_t']+'''(d,{});m.'''+names['_ZdlPvm']+'''(a,BigInt(n+4));m.'''+names['_ZdaPvm']+'''(b,BigInt(n+5));console.log(t.snapshot());}
 ''')
 actual=run(['node',str(driver)]).splitlines()
 cpp=root/'native.cpp';cpp.write_text('''#define MI_STATIC_LIB
 #include "mimalloc-new-delete.h"
 #include <cstdio>
 static unsigned char block[32];static int count,freed;static unsigned long long total,sized;
 extern "C" void *mi_new(size_t n){count++;total+=n;return block;}
 extern "C" void *mi_new_nothrow(size_t n) noexcept{count+=10;total+=n;return block;}
 extern "C" void mi_free(void *p) noexcept{if(p==block)freed++;else freed=-999;}
 extern "C" void mi_free_size(void *p,size_t n) noexcept{mi_free(p);sized+=n;}
 int main(){for(int n=0;n<512;n++){count=freed=0;total=sized=0;
 void *a=::operator new(n),*b=::operator new[](n+1),*c=::operator new(n+2,std::nothrow),*d=::operator new[](n+3,std::nothrow);
 ::operator delete(a);::operator delete[](b);::operator delete(c,std::nothrow);::operator delete[](d,std::nothrow);
 ::operator delete(a,(size_t)n+4);::operator delete[](b,(size_t)n+5);
 printf("%d,%llu,%d,%llu\\n",count,total,freed,sized);}}
 ''')
 exe=root/'native.exe';run(['clang++','-std=c++14','-fsized-deallocation','-I',str(SOURCE/'source/mimalloc/include'),str(cpp),'-o',str(exe)])
 expected=run([str(exe)]).splitlines();assert actual==expected,next(((a,b)for a,b in zip(actual,expected)if a!=b),None)
 # Real new/delete expressions retain the selected operator dependencies.
 sys.path.insert(0,str(ROOT/'tools'))
 from source_ast_to_js import reference_names
 expression={'kind':'CXXNewExpr','operatorNewDecl':{'id':'x','kind':'FunctionDecl','name':'operator new'}}
 assert reference_names(expression,lambda d:'exact_operator',allocation_dependencies=True)=={'exact_operator'}
 osd=root/'osd'
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(SOURCE),
  '--source','source/build/src/osd.cpp','--filter','OSD_Puts','--out-dir',str(osd),
  '--ast-cache-dir',str(ROOT/'work/ast-cache-boot-probes')])
 puts=next(r for r in json.loads((osd/'source/build/src/osd.cpp.manifest.json').read_text())['definitions'] if r['name']=='OSD_Puts')
 assert names['_Znwm'] in puts['source_references'],puts
 assert puts['status']=='blocked',puts
 assert ('original provider' in puts['reason'] or puts['reason']=='record pointer member requires original byte layout: osdmain_t'),puts
 report={'format':'original-allocation-operators-native-parity/1','operators':10,'native_js_cases':512,'compared_values':2048,
  'missing_original_providers_remain_blocked':True,'original_source_ownership':True,'fixture_providers_shipped':False,
  'original_osd_allocation_dependency_matches_provider_identity':True,
  'symbols':names,'passed':True,'gameplay_verified':False}
 (ROOT/'reports/oct15-original-allocator-parity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
