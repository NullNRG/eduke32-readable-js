"""Original hash-table union and namespace-owned libdivide layout parity."""
import hashlib,json,os,subprocess,sys,tempfile,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
INC=ROOT/'factory-output/source-tree/eduke32-master/source/build/include'
def run(args):
 p=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=120)
 assert p.returncode==0,(p.stdout[-1000:],p.stderr[-3000:])
 return p.stdout
with tempfile.TemporaryDirectory(prefix='original-hash-storage-') as td:
 work=Path(td)
 for name in ('hash.h','libdivide.h'):shutil.copyfile(INC/name,work/name)
 unit=work/'unit.cpp'
 unit.write_text('#include "compat.h"\n#include "hash.h"\nhashtable_t original_table={};hashtable_t copied_table={};hashitem_t *slots[2];\nextern "C" int original_hash_storage(int n){original_table.size=(uint32_t)n;original_table.prime.d.magic=(uint32_t)(n*3);original_table.prime.d.more=(uint8_t)(n&31);original_table.items=slots;memcpy(&copied_table,&original_table,sizeof(original_table));return (int)copied_table.prime.v+(int)copied_table.prime.d.magic+copied_table.prime.d.more+100*(copied_table.items==original_table.items)+(int)sizeof(hashtable_t);}\n')
 (work/'main.cpp').write_text('#include <cstdio>\nextern "C" int original_hash_storage(int);int main(){for(int n=0;n<512;n++)printf("%d\\n",original_hash_storage(n));}\n')
 exe=work/('native.exe' if os.name=='nt' else 'native')
 run(['clang++','-std=c++14','-funsigned-char','-I'+str(INC),str(unit),str(work/'main.cpp'),'-o',str(exe)])
 expected=run([str(exe)]).splitlines()
 out=work/'out'
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(work),'--source','unit.cpp','--extra=-I'+str(INC),'--out-dir',str(out),'--header-dependency-closure'])
 module=out/'unit.cpp.mjs';mf=json.loads(module.with_suffix('.manifest.json').read_text())
 blocked=[(r['name'],r.get('reason')) for r in mf['definitions'] if r['status']!='source-first'];assert not blocked,blocked
 (work/'run.mjs').write_text('import {original_hash_storage} from '+json.dumps(module.as_uri())+';for(let n=0;n<512;n++)console.log(original_hash_storage(n));')
 observed=run(['node',str(work/'run.mjs')]).splitlines();assert observed==expected,(observed[:3],expected[:3])
 (ROOT/'reports/original-hash-storage-parity.json').write_text(json.dumps({'passed':True,'native_js_cases':512,'original_header_sha256':{n:hashlib.sha256((INC/n).read_bytes()).hexdigest() for n in ['hash.h','libdivide.h']},'checks':['original hashtable_t size','original numeric union aliases','namespace-qualified packed libdivide record','borrowed pointer-to-pointer field copy','whole-record memcpy'],'gameplay_verified':False},indent=2)+'\n')
 print('PASS: 512 original hash-table/libdivide namespace record, union, pointer and memcpy comparisons')
