"""Static C NUL-terminated char-pointer table parity and preserved buffers."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC='tests/source_factory/source_first_string_pointer_fixture.cpp'
def run(argv):
 p=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,timeout=90)
 assert p.returncode==0,(argv,p.stderr[-1200:],p.stdout[-500:]);return p.stdout
with tempfile.TemporaryDirectory() as temp:
 d=Path(temp)
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',SRC,'--out-dir',str(d)])
 module=d/(SRC+'.mjs');data=json.loads(module.with_suffix('.manifest.json').read_text())
 assert data['emitted']==6 and data['blocked']==0,data
 run(['node','--check',str(module)])
 script=d/'run.mjs'
 script.write_text('import * as m from '+json.dumps(module.as_uri())+';\nconst enc=new TextDecoder();const text=p=>p===null?"-":enc.decode(p.subarray(0,p.indexOf(0)));\nfor(let i=0;i<512;i++){const a=m.select_filename(i),b=m.select_tag(i);if(a!==m.select_filename(i)||b!==m.select_tag(i))throw Error("pointer identity");const title=m.title_name();if(title!==m.title_name()||!(title instanceof Uint8Array))throw Error("literal pointer identity");console.log(text(a)+"|"+text(b)+"|"+text(title));}\n')
 observed=run(['node',str(script)]).splitlines()
 (d/'driver.cpp').write_text('#include <cstdio>\nextern "C" const char *select_filename(int),*select_tag(int),*title_name();\nint main(){for(int i=0;i<512;i++){const char *a=select_filename(i),*b=select_tag(i);printf("%s|%s|%s\\n",a?a:"-",b?b:"-",title_name());}}')
 run(['clang++','-std=c++20',str(ROOT/SRC),str(d/'driver.cpp'),'-o',str(d/'native')])
 expected=run([str(d/'native')]).splitlines()
 assert observed==expected,(observed[:6],expected[:6])
 print('PASS: 1,536 native C++/JS string-table comparisons with stable C NUL-terminated byte-buffer identities')
