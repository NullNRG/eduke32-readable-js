"""Clang-selected namespace constants fold only at actual non-ODR uses."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def run(args,ok=True):
 p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
 assert (p.returncode==0)==ok,(args,p.stdout[-1200:],p.stderr[-2600:]);return p.stdout

with tempfile.TemporaryDirectory(prefix='non-odr-integers-',dir=ROOT/'work') as folder:
 root=Path(folder)
 header='''namespace Alpha {constexpr short K=1312;} namespace Beta {constexpr short K=1323;}
constexpr unsigned short wrap=65540;
constexpr signed char neg=-127;
constexpr short casted=(signed char)255;
constexpr unsigned long long wide=~0u;
const int signed_value=-19;
volatile const int visible=31;
'''
 (root/'unit.cpp').write_text('''#include "constants.hpp"
extern "C" int read(int n){return n+Alpha::K+Beta::K+wrap+neg+casted+signed_value;}
extern "C" int compare(int n){return (n==Alpha::K)+2*(n==Beta::K)+casted;}
extern "C" unsigned long long large(){return wide;}
extern "C" const short *address(){return &Alpha::K;}
extern "C" int volatile_read(){return visible;}
''')
 (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int read(int),compare(int);extern "C" unsigned long long large();int main(){for(int n=-256;n<256;n++)printf("%d,%d,%llu\\n",read(n),compare(n),large());}\n')
 chromium_values=0
 for changed in (False,True):
  (root/'constants.hpp').write_text(header.replace('K=1312','K=1300') if changed else header)
  out=root/str(changed);exe=root/'native.exe'
  run(['clang++','-std=c++14','-funsigned-char',root/'unit.cpp',root/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
  args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,
        '--filter','read,compare,large','--exact-filter','--dependency-closure','--dependency-query-limit','1','--ast-cache-dir',root/'cache']
  run(args);module=out/'unit.cpp.mjs';d=json.loads(module.with_suffix('.manifest.json').read_text())
  assert d['blocked']==0 and d['imports']==[],d
  rows={r['name']:r for r in d['definitions']}
  assert len(rows['read']['non_odr_header_constants'])==6,rows['read']
  assert rows['large']['non_odr_header_constants'][0]['value']==4294967295,rows['large']
  keys=[p for p in rows['read']['non_odr_header_constants'] if p['name']=='K']
  assert len(keys)==2 and keys[0]['mangled_name']!=keys[1]['mangled_name'],keys
  assert not any(r['kind']=='VarDecl' for r in d['definitions']),d['definitions']
  expression='''async url=>{const m=await import(url),rows=[];for(let n=-256;n<256;n++)rows.push([m.read(n),m.compare(n),m.large().toString()].join(','));return rows;}'''
  script=root/'run.mjs';script.write_text('console.log(JSON.stringify(await ('+expression+')('+json.dumps(module.as_uri())+')));')
  assert json.loads(run(['node',script]))==expected
  if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
   from playwright.sync_api import sync_playwright
   with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
    try:
     assert browser.new_page().evaluate(expression,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())==expected
     chromium_values+=1536
    finally:browser.close()
 # Address/reference and volatile uses must not become numeric substitutions.
 negative=root/'negative'
 p=subprocess.run(list(map(str,[*args[:args.index('--filter')],'--out-dir',negative,'--filter','address,volatile_read','--exact-filter',
     '--dependency-closure','--header-dependency-closure','--ast-cache-dir',root/'cache'])),cwd=ROOT,capture_output=True,text=True,timeout=180)
 doc=json.loads((negative/'unit.cpp.manifest.json').read_text())
 assert not any(r.get('non_odr_header_constants') for r in doc['definitions']),doc
print(f'PASS 3072 native/Node values, {chromium_values} Chromium values: namespace constant identities, typed narrowing/unsigned promotion, changed-header cache invalidation; address and volatile uses retain storage')
