"""Native parity for contiguous ordinary POD storage and typed byte views."""
import base64,copy,hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=150)
 assert p.returncode==0,(args,p.stdout[-1800:],p.stderr[-2800:]);return p.stdout.strip()
with tempfile.TemporaryDirectory(prefix='eduke-contiguous-records-') as temp:
 root=Path(temp);out=root/'out'
 (root/'unit.cpp').write_text(r'''
 extern "C" void*memcpy(void*,const void*,__SIZE_TYPE__);
 extern "C" void*memset(void*,int,__SIZE_TYPE__);
 struct Cell{unsigned int x;unsigned short y;unsigned char z;};
 Cell globals[3]={{13,17,19},{23,29,31},{37,41,43}};
 Cell matrix[2][2]={{{1,2,3},{5,7,11}},{{13,17,19},{23,29,31}}};
 int record_bytes(int n){
  union {unsigned long long alignment;unsigned char data[sizeof(Cell)*3];} storage={};unsigned char *bytes=storage.data;memset(bytes,0,sizeof(storage.data));
  Cell *p=(Cell*)bytes;p[0].x=n+101;p[1].y=(unsigned short)(n+203);p[2].z=(unsigned char)(n+41);
  Cell copy=p[1];copy.y++;
  return p[0].x+p[1].y+p[2].z+copy.y+1000*(p[0].x==*(unsigned int*)bytes);
 }
 int global_bytes(int n){
  union {unsigned long long alignment;unsigned char data[sizeof(globals)];} storage={};unsigned char *bytes=storage.data;memset(bytes,0,sizeof(storage.data));memcpy(bytes,globals,sizeof(globals));
  Cell*p=(Cell*)bytes;p[1].x=n;
  return p[0].x+p[1].x+p[2].z+1000*(globals[1].x==23);
 }
 int local_bytes(int n){
  Cell cells[3]={{1,2,3},{5,7,11},{13,17,19}};
  union {unsigned long long alignment;unsigned char data[sizeof(cells)];} storage={};unsigned char *bytes=storage.data;memset(bytes,0,sizeof(storage.data));memcpy(bytes,cells,sizeof(cells));
  Cell*p=(Cell*)bytes;Cell*q=(Cell*)((unsigned char*)cells);
  p[2].y=n;return p[0].x+p[1].z+p[2].y+100*(q+2-cells==2)+1000*(q==cells);
 }
 int matrix_bytes(int n){
  Cell cells[2][2]={{{1,2,3},{5,7,11}},{{13,17,19},{23,29,31}}};
  union {unsigned long long alignment;unsigned char data[sizeof(cells)];} storage={};unsigned char *bytes=storage.data;memset(bytes,0,sizeof(storage.data));memcpy(bytes,cells,sizeof(cells));
  Cell*p=(Cell*)(bytes+sizeof(Cell)*2);p[1].z=n;
  return p[0].x+p[1].z+cells[1][1].z+matrix[1][0].y;
 }
 int field_address(int n){
  Cell cell={101,17,19};unsigned int *p=&cell.x;unsigned int*q=(unsigned int*)&cell;
  *p=n;Cell*back=(Cell*)p;return *q+1000*(p==q)+10000*(p==&cell.x)+100000*(back==&cell);
 }
 struct Link{Cell *target;unsigned int code;};
 int pointer_field_copy(int n){
  Link a={globals+(n%3),17};union {unsigned long long alignment;unsigned char data[sizeof(Link)];} storage={};unsigned char *bytes=storage.data;memset(bytes,0,sizeof(storage.data));
  memcpy(bytes,&a,sizeof(Link));Link*b=(Link*)bytes;
  Link c=*b;c.target=nullptr;
  return b->target->x+100*(b->target==a.target)+1000*(b->code==17)+10000*(b->target!=nullptr);
 }
 ''')
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=0;n<512;n++)printf("%d,%d,%d,%d,%d,%d\\n",record_bytes(n),global_bytes(n),local_bytes(n),matrix_bytes(n),field_address(n),pointer_field_copy(n));}')
 exe=root/'native.exe';run(['clang++','-std=c++14','-funsigned-char','main.cpp','-o',str(exe)],root)
 expected=run([str(exe)],root).splitlines()
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(out)],root)
 module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 wanted=['globals','matrix','record_bytes','global_bytes','local_bytes','matrix_bytes','field_address','pointer_field_copy']
 for name in wanted:
  row=next(r for r in manifest['definitions'] if r['name']==name);assert row['status']=='source-first',row
 driver=root/'run.mjs';driver.write_text('import * as m from '+json.dumps(module.as_uri())+';for(let n=0;n<512;n++)console.log([m.record_bytes(n),m.global_bytes(n),m.local_bytes(n),m.matrix_bytes(n),m.field_address(n),m.pointer_field_copy(n)].join(","));')
 actual=run(['node',str(driver)],root).splitlines();assert actual==expected,next(((i,a,b)for i,(a,b)in enumerate(zip(actual,expected))if a!=b),None)
 # A separately compiled user of an incomplete extern array needs this ABI.
 (root/'reader.cpp').write_text('extern "C" void*memcpy(void*,const void*,__SIZE_TYPE__);struct Cell{unsigned int x;unsigned short y;unsigned char z;};extern Cell globals[];int cross_unit_bytes(int n){union ReaderBytes{unsigned long long align;unsigned char data[sizeof(Cell)*3];}s={};memcpy(s.data,globals,sizeof(Cell)*3);return ((Cell*)s.data)[n%3].x;}')
 index=root/'owners.json';index.write_text(json.dumps({'globals':'unit.cpp'}))
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','reader.cpp','--out-dir',str(out),'--project-symbols',str(index)],root)
 reader=json.loads((out/'reader.cpp.manifest.json').read_text())
 assert any(d['name']=='globals' for d in reader['imports']),reader['definitions']
 dep=next(d for d in reader['imports'] if d['name']=='globals')
 assert dep['abi']=='source-byte-record-array/1' and dep['dimensions']==[None],dep
 sys.path.insert(0,str(ROOT/'tools'));from source_first_global_link import storage_import_error
 provider={'unit.cpp':{'manifest':manifest,'module':module}}
 assert storage_import_error(dep,provider) is None
 old=copy.deepcopy(manifest);next(d for d in old['definitions'] if d['name']=='globals').pop('object_storage')
 assert storage_import_error(dep,{'unit.cpp':{'manifest':old,'module':module}}) is not None
 wrong={**dep,'dimensions':[4]};assert storage_import_error(wrong,provider) is not None
 driver.write_text('import {cross_unit_bytes}from '+json.dumps((out/'reader.cpp.mjs').as_uri())+';for(let i=0;i<3;i++)console.log(cross_unit_bytes(i));')
 assert run(['node',str(driver)],root).splitlines()==['13','23','37']
 from playwright.sync_api import sync_playwright
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
  page=browser.new_page();url='data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()
  observed=page.evaluate('async url=>{const m=await import(url),rows=[];for(let n=0;n<512;n++)rows.push([m.record_bytes(n),m.global_bytes(n),m.local_bytes(n),m.matrix_bytes(n),m.field_address(n),m.pointer_field_copy(n)].join(","));return rows;}',url)
  assert observed==expected;version=browser.version;browser.close()
 report={'format':'contiguous-pod-record-native-parity/1','native_js_cases':512,'compared_values':3072,
  'checks':['ordinary POD layouts','explicit global and local initializers','multidimensional rows share bytes','typed record views over byte buffers','record pointer arithmetic and subtraction','numeric field address identity','pointer field copy identity','independent destination bytes'],
  'native_chromium_cases':512,'browser_version':version,'cross_unit_array_abi_verified':True,'incompatible_old_storage_rejected':True,
  'passed':True,'gameplay_verified':False,'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest()}
 (ROOT/'reports/oct15-contiguous-record-parity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
