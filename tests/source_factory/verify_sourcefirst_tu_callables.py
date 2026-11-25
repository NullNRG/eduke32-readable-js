"""Original static helpers share state/callbacks across same-TU fragments only."""
import copy,functools,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from attest_tu_callable_providers import attest, component
from source_first_global_link import storage_import_error
from source_tu_function_bindings import ABI,load
from source_cpp_function_bindings import sites,rebind,SELECTION

def run(args,ok=True):
 p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
 assert (p.returncode==0)==ok,(args,p.stdout[-1600:],p.stderr[-2600:]);return p.stdout

with tempfile.TemporaryDirectory(prefix='tu-callables-',dir=ROOT/'work') as folder:
 root=Path(folder);source=root/'source';source.mkdir();owner=root/'owner';fragment=root/'fragment'
 (root/'index.html').write_text('<!doctype html><link rel="icon" href="data:,">')
 (source/'helpers.hpp').write_text('''static int tick(int n){static int total=7;total+=n;return total;}
static int tick(double n){return (int)n-1000;}
int external_pick(int);int external_pick(double);
''')
 (source/'external.cpp').write_text('int external_pick(int n){return n+101;}\nint external_pick(double n){return (int)n-301;}')
 (source/'unit.cpp').write_text('''static int tick(int);
static int tick(double);
int external_pick(int);int external_pick(double);
typedef int (*Callback)(int);
extern "C" int owner_read(int n){return tick(n);}
extern "C" Callback owner_address(){return tick;}
extern "C" int fragment_step(int n){Callback p=tick;return p(n)+tick((double)n);}
extern "C" Callback fragment_address(){return tick;}
extern "C" int extra_step(int n){return tick(n*2);}
extern "C" int late_overloads(int n){return external_pick(n)+tick(n)+external_pick((double)n)+tick((double)n);}
static int legacy_helper(int n){return n*7+13;}
#include "helpers.hpp"
''')
 (source/'other.cpp').write_text('#include "helpers.hpp"\nextern "C" int other_read(int n){return tick(n);}')
 def compile(unit,out,names,existing=None):
  args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',source,'--source',unit,'--out-dir',out,
        '--filter',names,'--exact-filter','--dependency-closure','--header-dependency-closure','--ast-cache-dir',root/'cache']
  if existing:args+=['--project-symbols',root/'symbols.json','--import-root',existing]
  run(args);d=json.loads((out/(unit+'.manifest.json')).read_text());assert d['blocked']==0,d['definitions'];return d
 (root/'symbols.json').write_text('{}')
 external=compile('external.cpp',owner,'external_pick')
 (root/'symbols.json').write_text(json.dumps({r['name']:'external.cpp' for r in external['definitions'] if r['status']=='source-first'}))
 first=compile('unit.cpp',owner,'owner_read,owner_address,fragment_step')
 funcs=[r for r in first['definitions'] if r.get('cpp_function_identity',{}).get('abi')==ABI]
 assert len(funcs)==2,funcs
 # Reconnection must reject a wrong selected name/type even if an ordinal
 # key was obtained from a different callable-name subset of the same body.
 selected=funcs[0]['cpp_function_identity']
 for name,typ in [('unrelated',selected['original_type']),('tick','int (char)')]:
  reference={'kind':'DeclRefExpr','referencedDecl':{'kind':'FunctionDecl','name':name,'type':{'qualType':typ}}}
  caller={'kind':'FunctionDecl','mangledName':'_Z6calleri','type':{'qualType':'int (int)'},'loc':{'offset':0},
          'inner':[{'kind':'CompoundStmt','inner':[reference]}]}
  key,_=next(sites([caller],{name}));rebind([caller],{key:{'mismatch':selected}},{name})
  assert SELECTION not in reference['referencedDecl']
 # Keep only the original owner/callback entrypoints plus both overloads.
 # fragment_step is compiled here to demand both original header overloads;
 # a second original entrypoint is used for actual incremental installation.
 later=compile('unit.cpp',fragment,'extra_step,fragment_address,late_overloads',owner)
 deps=[v for v in later['imports'] if v.get('cpp_function_identity',{}).get('abi')==ABI]
 assert len(deps)==2,later
 assert not any(r.get('source_name')=='tick' for r in later['definitions']),later['definitions']
 units={'unit.cpp':{'manifest':first,'module':owner/'unit.cpp.mjs'}}
 assert storage_import_error(deps[0],units) is None,deps
 for field,value in [('consumer_source','other.cpp'),('implementation_sha256','0'*64)]:
  assert storage_import_error({**deps[0],field:value},units),(field,value)
 altered=copy.deepcopy(deps[0]);altered['cpp_function_identity']['body_sha256']='0'*64
 assert storage_import_error(altered,units)
 inputs=first['ast_cache_inputs'];assert not load(owner,'other.cpp',inputs,{})
 assert not load(owner,'unit.cpp',{**inputs,'sha256':'0'*64},{})
 original=(owner/'unit.cpp.mjs').read_bytes()
 (owner/'unit.cpp.mjs').write_bytes(original.replace(b'1000',b'1001'))
 assert not load(owner,'unit.cpp',inputs,{})
 (owner/'unit.cpp.mjs').write_bytes(original)
 install=[sys.executable,ROOT/'tools/install_verified_fragment.py','--manifest',fragment/'unit.cpp.manifest.json',
          '--target',owner,'--exports','extra_step','fragment_address','late_overloads','--report',root/'installed.json']
 run(install)
 after=json.loads((owner/'unit.cpp.manifest.json').read_text())
 assert storage_import_error(deps[0],{'unit.cpp':{'manifest':after,'module':owner/'unit.cpp.mjs'}}) is None
 # Appending an explicit shard re-export keeps the original owner prefix and
 # callable contract unchanged.
 assert len(load(owner,'unit.cpp',inputs,{}))==2
 untouched=(owner/'unit.cpp.mjs').read_bytes()
 (owner/'unit.cpp.mjs').write_bytes(untouched+b'\nlet unproven=1;\n')
 assert not load(owner,'unit.cpp',inputs,{})
 (owner/'unit.cpp.mjs').write_bytes(untouched)
 refresh=root/'refresh';compile('unit.cpp',refresh,'extra_step,fragment_address,late_overloads',owner)
 active=after['module_fragments'][0]
 unchanged={p:p.read_bytes() for p in owner.glob('*.mjs')}
 run([sys.executable,ROOT/'tools/install_verified_fragment.py','--manifest',refresh/'unit.cpp.manifest.json',
      '--target',owner,'--exports','extra_step','fragment_address','late_overloads',
      '--replace-fragment-sha256',active['sha256'],'--report',root/'reattested.json'])
 assert json.loads((root/'reattested.json').read_text())['implementation_bytes_unchanged']
 assert all(p.read_bytes()==data for p,data in unchanged.items())

 # Reattach an original callable identity from a new Clang measurement while
 # continuing to execute the exact immutable original fragment bytes.
 archived=root/'boot-probes'/'unit.cpp'/'producer'
 witness=root/'witness'
 compiled=compile('unit.cpp',witness,'legacy_helper',owner)
 archived.mkdir(parents=True)
 saved=copy.deepcopy(compiled)
 legacy=next(r for r in saved['definitions'] if r['name']=='legacy_helper')
 del legacy['cpp_function_identity']
 saved['output']=str(archived/'unit.cpp.mjs')
 (archived/'unit.cpp.mjs').write_bytes((witness/'unit.cpp.mjs').read_bytes())
 (archived/'unit.cpp.manifest.json').write_text(json.dumps(saved))
 run([sys.executable,ROOT/'tools/install_verified_fragment.py','--manifest',archived/'unit.cpp.manifest.json',
      '--target',owner,'--exports','legacy_helper','--report',root/'archive-install.json'])
 installed_manifest=owner/'unit.cpp.manifest.json'
 before_attestation=installed_manifest.read_bytes()
 modules_before={p:p.read_bytes() for p in owner.glob('*.mjs')}
 predicates={'BASE':root,'OUT':owner,'SOURCE':source}
 with patch.multiple(component,**predicates):
  evidence=witness/'unit.cpp.manifest.json'
  report=root/'legacy-attestation.json'
  try:
   attest(evidence,['legacy_helper','extra_step'],report)
  except ValueError as error:
   assert 'extra_step' in str(error),error
  else:
   raise AssertionError('missing fresh callable identity accepted')
  assert not report.exists() and installed_manifest.read_bytes()==before_attestation
  result=attest(evidence,['legacy_helper'],report)
 assert result['implementation_bytes_changed'] is False
 assert all(p.read_bytes()==data for p,data in modules_before.items())
 assert any(proof['name']=='legacy_helper' for proof in load(owner,'unit.cpp',inputs,{}).values())

 compile('other.cpp',owner,'other_read')
 (root/'driver.cpp').write_text('''#include <cstdio>
typedef int(*Callback)(int);
extern "C" int owner_read(int),fragment_step(int),extra_step(int),other_read(int),late_overloads(int);
extern "C" Callback owner_address(),fragment_address();
int main(){for(int n=0;n<256;n++){int a=owner_read(n),b=fragment_step(n),c=extra_step(n),d=other_read(n),e=late_overloads(n);printf("%d,%d,%d,%d,%d,%d\\n",a,b,c,d,e,(int)(owner_address()==fragment_address()));}}
''')
 exe=root/'native.exe';run(['clang++','-std=c++14',source/'unit.cpp',source/'other.cpp',source/'external.cpp',root/'driver.cpp','-o',exe]);expected=run([exe]).splitlines()
 expression='''async base=>{const a=await import(base+'/unit.cpp.mjs'),b=await import(base+'/other.cpp.mjs'),rows=[];for(let n=0;n<256;n++){const x=a.owner_read(n),y=a.fragment_step(n),z=a.extra_step(n),w=b.other_read(n),v=a.late_overloads(n);rows.push([x,y,z,w,v,Number(a.owner_address()===a.fragment_address())].join(','));}return rows;}'''
 runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+expression+')('+json.dumps(owner.as_uri())+')));')
 assert json.loads(run(['node',runner]))==expected
 class Quiet(SimpleHTTPRequestHandler):
  extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
  def log_message(self,*args):pass
 browser_values=0
 if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
  with ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root))) as server:
   thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
   from playwright.sync_api import sync_playwright
   with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
    try:
     page=browser.new_page();origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin)
     assert page.evaluate(expression,origin+'/owner')==expected;browser_values=1536
    finally:browser.close();server.shutdown();thread.join()
print(f'PASS 1536 native/Node values, {browser_values} Chromium values: TU-local overload/state/callback identity, unchanged-shard reattestation, independent TUs and changed-context/body/bytes rejection')
