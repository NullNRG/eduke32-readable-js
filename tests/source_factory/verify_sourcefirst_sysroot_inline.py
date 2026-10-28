"""Execute actual target std::min/max bodies and original vec3 goto lifetimes."""
import base64, hashlib, json, os, shutil, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
INCLUDE=ROOT/'factory-output/source-tree/eduke32-master/source/build/include'
SOURCE=r'''
#include <algorithm>
#include <stdint.h>
#include "vec.h"
int algorithms(int n){
 int a=n,b=17-n;short x=(short)(n-7),y=(short)(n+3);
 const int &lo=std::min(a,b),&hi=std::max(a,b);
 const int &tie=std::min(a,a);
 int value=lo*3+hi*5+std::min(x,y)*7+std::max(x,y)*11;
 int changed=lo;a+=5;b-=2;
 return value+changed+lo*13+hi*17+1000*(&tie==&a);
}
long long wide_algorithms(int n){
 long long a=9007199254741000LL+n,b=9007199254742000LL-n;
 return std::max(a,b)-std::min(a,b);
}
int original_vector_goto(int n){
 vec3_t point={n,n+3,n+7};int step=0,sum=0;
 again:vec3_t copy=point;++step;copy.x+=step;
 if(step%2)goto append;
 copy.y+=9;
 append:sum+=copy.x+copy.y+copy.z;
 if(step<4)goto again;
 return sum+point.x;
}
'''
FUNCTIONS=('algorithms','wide_algorithms','original_vector_goto')
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-1200:],p.stderr[-4000:]);return p.stdout.strip()

with tempfile.TemporaryDirectory(prefix='eduke-sysroot-inline-') as directory:
 root=Path(directory);shutil.copyfile(INCLUDE/'vec.h',root/'vec.h')
 (root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=-256;n<256;n++)printf("%d,%lld,%d\\n",algorithms(n),wide_algorithms(n),original_vector_goto(n));}')
 flags=['-std=c++14','-funsigned-char','-DNOASM','-I'+str(root),'-I'+str(INCLUDE)]
 native=root/'native.exe';run(['clang++',*flags,'main.cpp','-o',str(native)],root)
 expected=run([str(native)],root).splitlines()
 commands=root/'commands.json';commands.write_text(json.dumps([{'file':'unit.cpp','arguments':['clang++',*flags,'-c','unit.cpp']}]))
 out=root/'out'
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp',
      '--compile-commands',str(commands),'--out-dir',str(out),'--header-dependency-closure'],root)
 module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 rows={r['source_name']:r for r in manifest['definitions']}
 for name in FUNCTIONS:assert rows[name]['status']=='source-first',rows[name]
 selected=[r for r in manifest['definitions'] if r['source_name'] in ('min','max')]
 assert len(selected)==6,selected
 for row in selected:
  assert row['status']=='source-first' and row['cpp_reference_contract']['parameters'],row
  proof=row['toolchain_header_definition'];assert proof['source_header'].startswith('@sysroot/'),proof
  header=Path(os.environ['EDUKE32_SYSROOT'])/proof['source_header'].removeprefix('@sysroot/')
  assert hashlib.sha256(header.read_bytes()).hexdigest()==proof['header_sha256']
  assert row['name'].startswith(row['source_name']+'__template_'),row
 js='async url=>{const m=await import(url),result=[];for(let n=-256;n<256;n++)result.push(['+','.join('m.'+f+'(n)' for f in FUNCTIONS)+'].join(","));return result;}'
 (root/'run.mjs').write_text('console.log((await ('+js+')('+json.dumps(module.as_uri())+')).join("\\n"));')
 observed=run(['node',str(root/'run.mjs')],root).splitlines()
 assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected)) if a!=b),('length',len(observed),len(expected)))
 from playwright.sync_api import sync_playwright
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
  page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
  assert actual==expected and not errors,(errors,actual[:2],expected[:2]);version=browser.version;browser.close()
 report={'format':'source-sysroot-inline-parity/1','passed':True,'native_node_cases':512,
  'native_chromium_cases':512,'compared_values':1536,'original_header_sha256':hashlib.sha256((INCLUDE/'vec.h').read_bytes()).hexdigest(),
  'toolchain_definitions':[{'name':r['name'],'proof':r['toolchain_header_definition']} for r in selected],
  'browser_version':version,'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
  'checks':['original std::min/max bodies','Clang-selected short/int/long-long specializations',
   'returned references retain original arguments and tie identity','integers beyond IEEE-754 exact range',
   'original vec3<int> trivial construction/copy with source goto reentry'],
  'gameplay_verified':False}
 (ROOT/'reports/oct19-sysroot-inline-parity.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({k:v for k,v in report.items() if k!='toolchain_definitions'},indent=2))
