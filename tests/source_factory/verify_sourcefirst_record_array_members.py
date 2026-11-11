"""Native and Chromium parity for original contiguous C array subobjects."""
import base64,hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE='extern "C" void* memcpy(void*,const void*,__SIZE_TYPE__);\nextern "C" void* memset(void*,int,__SIZE_TYPE__);\nstruct Cell {unsigned int x;unsigned short y;};\nstruct Bundle {int tag;Cell cells[2][2];int *links[3];int values[2][3];int *other[2];};\nint originals[4]={7,11,13,17};\nint member_arrays(int n){\n Bundle value={};value.tag=n;\n value.cells[1][1].x=n+31;value.cells[0][1].y=n+17;\n value.links[0]=originals;value.links[1]=originals+1;value.links[2]=nullptr;\n value.other[0]=originals+2;value.other[1]=originals+3;\n value.values[1][2]=n+53;\n Bundle copy=value;copy.cells[1][1].x++;copy.links[0]=originals+3;\n int **p=value.links;p[2]=value.other[1];\n return value.cells[1][1].x+copy.cells[1][1].x+value.cells[0][1].y+value.values[1][2]\n   +*value.links[0]+*copy.links[0]+*value.links[2]+*value.other[0]+1000*(p==&value.links[0]);\n}\nint member_array_bytes(int n){\n Bundle value={};value.cells[1][0].y=n+23;value.links[1]=originals+2;value.values[0][2]=n+47;\n Bundle copy={};memcpy(&copy,&value,sizeof(value));copy.links[1]=originals+3;copy.values[0][2]++;\n Cell *cells=(Cell*)value.cells;int *numbers=(int*)value.values;\n return cells[2].y+numbers[2]+*copy.links[1]+*value.links[1]+copy.values[0][2]\n  +1000*(cells+2==&value.cells[1][0]);\n}\nint member_array_init(int n){\n Bundle value={n,{{{1,2},{3,4}},{{5,6},{7,8}}},{originals,originals+1,nullptr},{{11,13,17},{19,23,29}},{originals+2,originals+3}};\n return value.tag+value.cells[1][1].x+*value.links[1]+value.values[1][2]+*value.other[0];\n}\nBundle global_bundle={19,{{{1,2},{3,4}},{{5,6},{7,8}}},{originals,originals+1,nullptr},{{11,13,17},{19,23,29}},{originals+2,originals+3}};\nint global_member_array(int n){Bundle copy=global_bundle;copy.cells[0][0].x=n;return copy.cells[0][0].x+global_bundle.cells[0][0].x+*copy.links[1]+copy.values[1][2];}\n\n\nunion Mixed {int *pointers[2];unsigned long long bits[2];};\nint rejected_mixed(int n){Mixed m={};m.bits[0]=n;return *m.pointers[0];}\nstruct PointerRow {int *slots[2];};union MixedNested {PointerRow rows[2];unsigned long long bits[4];};int rejected_nested_mixed(int n){MixedNested m={};m.bits[0]=n;return *m.rows[0].slots[0];}\nstruct MemberPair {int *first;int *second;};int pointer_member_refs(int n){MemberPair value={originals,originals+1};int **p=&value.first;*p=originals+2;memcpy(&value.second,&value.first,sizeof(int*));return *value.first+*value.second+1000*(p==&value.first);}\nint pointer_slot_arithmetic(int n){Bundle b={};int **p=&b.links[0];p[1]=originals+1;p[2]=originals+2;int **q=p+1;*q=originals+3;memcpy(&b.links[2],&b.links[1],sizeof(int*));return *q[0]+*p[2]+1000*(q+1==&b.links[2])+10000*(q-p==1);}\n'
FUNCTIONS=('member_arrays','member_array_bytes','member_array_init','global_member_array','pointer_slot_arithmetic','pointer_member_refs')
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=150)
 assert p.returncode==0,(args,p.stdout[-1200:],p.stderr[-2800:]);return p.stdout.strip()
with tempfile.TemporaryDirectory(prefix='eduke-record-array-members-') as temp:
 root=Path(temp);out=root/'out';(root/'unit.cpp').write_text(SOURCE)
 main='#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=0;n<512;n++)printf("%d,%d,%d,%d,%d,%d\\n",'+','.join(f+'(n)' for f in FUNCTIONS)+');}'
 (root/'main.cpp').write_text(main)
 exe=root/'native.exe';run(['clang++','-std=c++14','main.cpp','-o',str(exe)],root)
 expected=run([str(exe)],root).splitlines()
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(out)],root)
 module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 rows={r['name']:r for r in manifest['definitions']}
 for name in (*FUNCTIONS,'global_bundle'):assert rows[name]['status']=='source-first',rows[name]
 for name in ('rejected_mixed','rejected_nested_mixed'):assert rows[name]['status']=='source-first',rows[name]
 js='async url=>{const m=await import(url),rows=[];for(const name of ["rejected_mixed","rejected_nested_mixed"]){let rejected=false;try{m[name](23)}catch{rejected=true;}if(!rejected)throw Error("Unallocated pointer union address accepted");}for(let n=0;n<512;n++)rows.push(['+','.join('m.'+f+'(n)' for f in FUNCTIONS)+'].join(","));return rows;}'
 driver=root/'run.mjs';driver.write_text('console.log((await ('+js+')('+json.dumps(module.as_uri())+')).join("\\n"));')
 observed=run(['node',str(driver)],root).splitlines()
 assert observed==expected,next(((i,a,b)for i,(a,b)in enumerate(zip(observed,expected))if a!=b),('length',len(observed),len(expected)))
 from playwright.sync_api import sync_playwright
 with sync_playwright() as playwright:
  browser=playwright.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
  page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
  assert actual==expected and not errors,(errors,actual[:2],expected[:2]);version=browser.version;browser.close()
 report={'format':'clang-contiguous-record-array-members/1','native_js_cases':512,'compared_values':3072,'native_chromium_cases':512,
  'checks':['nested record arrays','multidimensional scalar arrays','multiple pointer-array fields sharing one record',
    'explicit local and global initializers','whole-object memcpy','independent aggregate copies','row byte aliases',
    'pointer-slot addresses, pointer-to-pointer arithmetic and original pointer-field lvalue dereference','mixed numeric/pointer unions reject unallocated addresses'],
  'passed':True,'gameplay_verified':False,'browser_version':version,'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest()}
 (ROOT/'reports/oct16-array-members-parity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
