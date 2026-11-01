"""Original C++ void* comparator, record storage and live aliases versus native."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 r=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120);assert r.returncode==0,(r.stdout[-1800:],r.stderr[-2500:]);return r.stdout
with tempfile.TemporaryDirectory(prefix='source-record-qsort-',dir=ROOT/'work') as directory:
 p=Path(directory);(p/'unit.cpp').write_text('''#include <cstdlib>
struct Record {int key,payload;};static Record records[9];
static int compare_records(const void *a_,const void *b_){const Record *a=(const Record*)a_;const Record*b=(const Record*)b_;return a->key-b->key;}
extern "C" int sort_case(int seed){
 for(int i=0;i<9;i++){records[i].key=(seed*13+i*37)%101-50;records[i].payload=seed+i*11;}
 int *first_payload=&records[0].payload;qsort(records,9,sizeof(Record),compare_records);
 int sum=*first_payload;for(int i=0;i<9;i++)sum+=(records[i].key+51)*(i+1)+records[i].payload;return sum;}
''')
 symbols=p/'symbols.json';symbols.write_text(json.dumps({'qsort':'host'}));out=p/'out';out.mkdir()
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',p,'--source','unit.cpp','--project-symbols',symbols,'--out-dir',out])
 manifest=json.loads((out/'unit.cpp.manifest.json').read_text());assert manifest['blocked']==0,manifest
 (out/'host.mjs').write_text('import {NativeRuntime} from '+json.dumps((ROOT/'runtime/index.mjs').as_uri())+';const runtime=new NativeRuntime();export const qsort=(...args)=>runtime.library.symbols.qsort(...args);\n')
 (p/'main.cpp').write_text('#include <cstdio>\nextern "C" int sort_case(int);int main(){for(int i=0;i<512;i++)printf("%d\\n",sort_case(i));}\n')
 exe=p/'native.exe';run(['clang++','-std=c++14',p/'unit.cpp',p/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
 (p/'check.mjs').write_text('import {sort_case} from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';for(let i=0;i<512;i++)console.log(sort_case(i));\n')
 assert run(['node',p/'check.mjs']).splitlines()==expected
print('PASS 512 native cases: source C++ comparator, contiguous Clang record bytes, in-place qsort and retained member-address aliases')
