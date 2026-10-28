"""Compare double floor/ceil browser adapters to the native C library."""
import json,math,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=90)
 assert p.returncode==0,(p.stdout[-1000:],p.stderr[-3000:])
 return p.stdout
values=[-0.0,0.0,-1e-300,1e-300,-1e20,1e20]+[i/7 for i in range(-1024,1025)]
with tempfile.TemporaryDirectory() as td:
 work=Path(td)
 (work/'unit.cpp').write_text('#include <math.h>\nextern "C" double source_floor(double x){return floor(x); }\nextern "C" double source_ceil(double x){return ceil(x); }\n')
 literals=','.join('-0.0' if x==0 and math.copysign(1,x)<0 else repr(x) for x in values)
 (work/'main.cpp').write_text('#include <cstdio>\nextern "C" double source_floor(double),source_ceil(double);\nint main(){double values[]={'+literals+'};for(double x:values)printf("%.0f,%.0f\\n",source_floor(x),source_ceil(x));}\n')
 exe=work/('native.exe' if os.name=='nt' else 'native')
 run(['clang++',str(work/'unit.cpp'),str(work/'main.cpp'),'-o',str(exe)])
 expected=run([str(exe)]).splitlines()
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(work),'--source','unit.cpp','--out-dir',str(work/'out')])
 module=work/'out/unit.cpp.mjs'
 mf=json.loads(module.with_suffix('.manifest.json').read_text());assert mf['blocked']==0,mf
 (work/'run.mjs').write_text('import * as s from '+json.dumps(module.as_uri())+'; const fmt=x=>Object.is(x,-0)?"-0":x.toFixed(0);for(const x of ['+literals+'])console.log(fmt(s.source_floor(x))+","+fmt(s.source_ceil(x)));')
 actual=run(['node',str(work/'run.mjs')]).splitlines()
 assert expected==actual,next(((i,a,b) for i,(a,b) in enumerate(zip(expected,actual)) if a!=b),None)
 (ROOT/'reports/double-rounding-parity.json').write_text(json.dumps({'passed':True,'native_js_values':len(values)*2,'negative_zero_checked':True,'gameplay_verified':False},indent=2)+'\n')
 print('PASS:',len(values)*2,'native double floor/ceil values, including negative zero')
