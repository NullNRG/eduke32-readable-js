"""Unmodified Build macro-generated fixed-point math versus native C++."""
import base64,hashlib,json,os,shutil,subprocess,sys,tempfile
from pathlib import Path
from contextlib import nullcontext
ROOT=Path(__file__).resolve().parents[2]
INCLUDE=ROOT/'factory-output/source-tree/eduke32-master/source/build/include'
NAMES=[family+str(shift) for family in ('mulscale','dmulscale','tmulscale') for shift in range(1,33)]
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-4000:]);return p.stdout.strip()

fixed=os.environ.get('EDUKE32_MACRO_TEST_DIR')
with (nullcontext(fixed) if fixed else tempfile.TemporaryDirectory(prefix='eduke-original-macro-')) as directory:
 root=Path(directory).resolve();root.mkdir(parents=True,exist_ok=True)
 for name in ('compat.h','fix16.h','pragmas.h'):shutil.copyfile(INCLUDE/name,root/name)
 cases=[]
 for i,name in enumerate(NAMES):
  args=['a','b']+(['c','d'] if name.startswith(('dmul','tmul')) else [])+(['e','f'] if name.startswith('tmul') else [])
  cases.append('case '+str(i)+':return '+name+'('+','.join(args)+');')
 (root/'unit.cpp').write_text('#include "compat.h"\n#include "pragmas.h"\nint math_case(int n,int which){\n'
  +'int a=n*7919-1000000,b=n*1237-130000,c=n*3571-400000,d=555555-n*3469,e=n*2371-250000,f=99999-n*769;\n'
  +'switch(which){'+''.join(cases)+'default:return 0;}}\n')
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=0;n<256;n++)for(int k=0;k<96;k++)printf("%d\\n",math_case(n,k));}')
 flags=['-std=c++14','-funsigned-char','-DNOASM','-I'+str(root),'-I'+str(INCLUDE)]
 native=root/'native.exe';run(['clang++',*flags,'main.cpp','-o',str(native)],root)
 expected=run([str(native)],root).splitlines()
 commands=root/'commands.json';commands.write_text(json.dumps([{'file':'unit.cpp','arguments':['clang++',*flags,'-c','unit.cpp']}]))
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp',
  '--compile-commands',str(commands),'--out-dir',str(root/'out'),'--header-dependency-closure'],root)
 module=root/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 rows={r['source_name']:r for r in manifest['definitions']}
 for name in [*NAMES,'math_case']:assert rows[name]['status']=='source-first',rows.get(name)
 for name in NAMES:
  proof=rows[name]['macro_header_definition']
  assert proof['source_header']=='pragmas.h' and rows[name]['linkage']=='internal',rows[name]
  assert proof['header_sha256']==hashlib.sha256((INCLUDE/'pragmas.h').read_bytes()).hexdigest()
 assert manifest['llvm_fallback_used'] is False
 js='async url=>{const m=await import(url),result=[];for(let n=0;n<256;n++)for(let k=0;k<96;k++)result.push(String(m.math_case(n,k)));return result;}'
 (root/'run.mjs').write_text('console.log((await ('+js+')('+json.dumps(module.as_uri())+')).join("\\n"));')
 actual=run(['node',str(root/'run.mjs')],root).splitlines()
 assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),('length',len(actual),len(expected)))
 from playwright.sync_api import sync_playwright
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
  page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  observed=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
  assert observed==expected and not errors,(errors,observed[:2],expected[:2]);version=browser.version;browser.close()
 report={'format':'original-macro-header-parity/1','passed':True,'original_definitions':NAMES,
  'native_node_values':len(expected),'native_chromium_values':len(expected),'browser_version':version,
  'original_header_sha256':hashlib.sha256((INCLUDE/'pragmas.h').read_bytes()).hexdigest(),
  'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
  'checks':['96 original macro-generated function bodies','signed fixed-point shifts 1 through 32',
   '64-bit intermediate products and sums','TU-private original ownership','verified macro expansion provenance'],
  'gameplay_verified':False}
 (ROOT/'reports/oct20-original-macro-header-parity.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({k:v for k,v in report.items() if k!='original_definitions'},indent=2))
