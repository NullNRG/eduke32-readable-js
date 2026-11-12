"""Default-MXCSR scalar SSE rounding: exact native float32 bit-pattern oracle."""
import base64,copy,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_scalar_round import recover,walk
SOURCE='''#include <xmmintrin.h>
int convert(float x){__m128 vector=_mm_load_ss(&x);return _mm_cvtss_si32(vector);}
int convert_const(const float value){__m128 vector=_mm_load_ss(&value);return _mm_cvtss_si32(vector);}
int unproven_pointer(const float *p){__m128 vector=_mm_load_ss(p);return _mm_cvtss_si32(vector);}
'''
def run(command,cwd):
 result=subprocess.run(list(map(str,command)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert result.returncode==0,(command,result.stdout[-1500:],result.stderr[-3000:])
 return result.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-scalar-sse-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('''#include <cstdio>
#include <cstdint>
#include <cstring>
#include "unit.cpp"
int main(){_mm_setcsr(0x1f80);
uint32_t edges[]={0,0x80000000u,0x3f000000u,0xbf000000u,0x3fc00000u,0xbfc00000u,0x40200000u,0xc0200000u,
 0x4f000000u,0xcf000000u,0x4effffffu,0xcf000001u,0x7f800000u,0xff800000u,0x7fc00000u,0x7f800001u,
 1,0x80000001u,0x007fffffu,0x00800000u};uint32_t state=0x12345678;
for(int n=0;n<4096;n++){state^=state<<13;state^=state>>17;state^=state<<5;
 uint32_t bits=n<20?edges[n]:state;float value;memcpy(&value,&bits,4);
 printf("%08x %d %d\\n",bits,convert(value),convert_const(value));}}
''')
 run(['clang++','-std=c++14','-frounding-math',root/'main.cpp','-o',root/'native.exe'],root)
 expected=run([root/'native.exe'],root).splitlines();assert len(expected)==4096
 # Validate the recognizer against actual same-parse selected native bodies.
 native_ast=json.loads(run(['clang++','-std=c++14','-Xclang','-ast-dump=json','-fsyntax-only',root/'unit.cpp'],root))
 declarations={node['id']:node for node in walk(native_ast) if node.get('id')}
 function=next(node for node in walk(native_ast) if node.get('kind')=='FunctionDecl' and node.get('name')=='convert')
 proof=recover(function,declarations);assert proof
 widened=copy.deepcopy(function);widened['type']['qualType']='int32_t (float)'
 returned=next(node for node in widened['inner'] if node.get('kind')=='CompoundStmt')['inner'][-1]
 returned['inner']=[{'kind':'ImplicitCastExpr','castKind':'IntegralCast',
     'type':{'qualType':'int32_t','desugaredQualType':'long long'},'inner':returned['inner']}]
 assert recover(widened,declarations) is None
 missing=dict(declarations);missing.pop(proof['native_wrappers'][0]['clang_id']);assert recover(function,missing) is None
 changed=dict(declarations);identity=proof['native_wrappers'][1]['clang_id'];changed[identity]=copy.deepcopy(changed[identity])
 builtin=next(node for node in walk(changed[identity]) if node.get('kind')=='DeclRefExpr' and node.get('referencedDecl',{}).get('name')=='__builtin_ia32_cvtss2si')
 builtin['referencedDecl']['name']='different_builtin';assert recover(function,changed) is None
 changed=dict(declarations);identity=proof['native_wrappers'][0]['clang_id'];changed[identity]=copy.deepcopy(changed[identity])
 loads=[node for node in walk(changed[identity]) if node.get('kind')=='DeclRefExpr' and node.get('referencedDecl',{}).get('kind')=='ParmVarDecl']
 assert loads
 for load in loads:load['referencedDecl']['id']='another-original-parameter'
 assert recover(function,changed) is None
 modules=[]
 for mode in ('full','filtered'):
  command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode]
  if mode=='filtered':
   # The exact selected native intrinsic bodies must be present. A filtered
   # caller alone cannot claim this proof and is deliberately not accepted.
   command+=['--filter','convert,convert_const','--exact-filter','--dependency-closure','--header-dependency-closure']
  run(command,ROOT);module=root/mode/'unit.cpp.mjs'
  rows={row['source_name']:row for row in json.loads(module.with_suffix('.manifest.json').read_text())['definitions']}
  if mode=='filtered' and any(rows[name]['status']=='blocked' for name in ('convert','convert_const')):
   assert all(not rows[name].get('source_scalar_sse_round') for name in ('convert','convert_const') if rows[name]['status']=='blocked')
   continue
  for name in ('convert','convert_const'):
   assert rows[name]['status']=='source-first' and rows[name].get('source_scalar_sse_round'),rows[name]
  if mode=='full':assert rows['unproven_pointer']['status']=='blocked' and not rows['unproven_pointer'].get('source_scalar_sse_round')
  modules.append(module)
  evaluator='''async ({url,expected})=>{const m=await import(url),buffer=new ArrayBuffer(4),view=new DataView(buffer);return expected.map(line=>{const [hex]=line.split(' ');view.setUint32(0,parseInt(hex,16),true);const value=view.getFloat32(0,true);return hex+' '+m.convert(value)+' '+m.convert_const(value);});}'''
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps({'url':module.as_uri(),'expected':expected})+')).join("\\n"));')
  assert run(['node',root/'run.mjs'],ROOT).splitlines()==expected
 browser_checked=bool(os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'))
 if browser_checked:
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True);page=browser.new_page()
   for module in modules:
    assert page.evaluate(evaluator,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode(),'expected':expected})==expected
   browser.close()
print('PASS: 8,192 native/Node scalar results'+(' and Chromium comparisons' if browser_checked else '; Chromium not configured')+'; float32 ties, signed zero, subnormals, NaNs/infinities and INT32 overflow; exact selected wrapper bodies required; unproven pointer/vector storage stays blocked')
