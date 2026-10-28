"""Clang-derived bitfields versus native SysV layout, in Node and Chromium."""
import base64,hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,text=True,capture_output=True,timeout=150)
 assert p.returncode==0,(args,p.stdout[-1300:],p.stderr[-2800:]);return p.stdout.strip()
with tempfile.TemporaryDirectory(prefix='eduke-bitfield-parity-') as temp:
 root=Path(temp);out=root/'out'
 (root/'unit.cpp').write_text(r'''
 extern "C" void*memset(void*,int,__SIZE_TYPE__);
 struct Bits{unsigned a:3;signed b:9;unsigned:4;unsigned c:16;unsigned long long d:37;signed long long e:13;bool f:1;};
 struct __attribute__((packed)) PackedBits{unsigned char lead;unsigned x:9;signed y:13;unsigned tail:5;};
 unsigned long long bit_snapshot(int n,int field){
  Bits b={};PackedBits p={};memset(&b,0,sizeof(b));memset(&p,0,sizeof(p));
  b.a=n;b.b=n-600;b.c=n*37;b.d=(unsigned long long)n*12345678901ull;b.e=n*13-9000;b.f=n&1;
  p.lead=n;p.x=n*3;p.y=n*17-8000;p.tail=n;
  switch(field){case 0:return b.a;case 1:return b.b;case 2:return b.c;case 3:return b.d;case 4:return b.e;case 5:return b.f;
   case 6:return p.lead;case 7:return p.x;case 8:return p.y;case 9:return p.tail;}
  unsigned sum=0;for(unsigned i=0;i<sizeof(b);i++)sum+=((unsigned char*)&b)[i];for(unsigned i=0;i<sizeof(p);i++)sum+=((unsigned char*)&p)[i];return sum;
 }
 union WordBits{unsigned word;struct{unsigned lo:7;signed hi:13;unsigned tail:12;}parts;};
 unsigned bit_union(int n){WordBits b={};b.word=(unsigned)n*0x9e3779b9u;b.parts.hi=n-4000;return b.word^b.parts.lo;}
 struct Split{unsigned a:3;unsigned:0;signed b:11;};
 int zero_width(int n){Split s={};s.a=n;s.b=n-700;return (int)sizeof(Split)*10000+s.a*100+s.b;}
 ''')
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=0;n<1024;n++){for(int f=0;f<11;f++)printf("%llu,",bit_snapshot(n,f));printf("%u,%d\\n",bit_union(n),zero_width(n));}}')
 exe=root/'native.exe';run(['clang++','-std=c++14','-mno-ms-bitfields','-funsigned-char','main.cpp','-o',str(exe)],root)
 expected=run([str(exe)],root).splitlines()
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(out)],root)
 module=out/'unit.cpp.mjs';mf=json.loads(module.with_suffix('.manifest.json').read_text())
 for name in ('bit_snapshot','bit_union','zero_width'):
  row=next(r for r in mf['definitions']if r['name']==name);assert row['status']=='source-first',row
 js='''async url=>{const m=await import(url),rows=[];for(let n=0;n<1024;n++){let line=[];for(let f=0;f<11;f++)line.push(String(m.bit_snapshot(n,f)));line.push(String(m.bit_union(n)),String(m.zero_width(n)));rows.push(line.join(','));}return rows;}'''
 driver=root/'run.mjs';driver.write_text('console.log((await ('+js+')('+json.dumps(module.as_uri())+')).join("\\n"));')
 actual=run(['node',str(driver)],root).splitlines();assert actual==expected,next(((i,a,b)for i,(a,b)in enumerate(zip(actual,expected))if a!=b),None)
 from playwright.sync_api import sync_playwright
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
  page=browser.new_page();url='data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()
  observed=page.evaluate(js,url);assert observed==expected;version=browser.version;browser.close()
 report={'format':'target-clang-bitfields-native-parity/1','native_js_cases':1024,'compared_values':13312,'native_chromium_cases':1024,
  'checks':['signed and unsigned truncation','64-bit fields','bool fields','packed fields crossing byte boundaries','unnamed padding','zero-width alignment gaps','numeric union aliasing','neighbor and padding bytes preserved'],
  'passed':True,'gameplay_verified':False,'browser_version':version,'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest()}
 (ROOT/'reports/oct15-bitfield-parity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
