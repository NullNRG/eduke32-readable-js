"""Original C++ void* comparator, record storage and live aliases versus native."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 r=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120);assert r.returncode==0,(r.stdout[-1800:],r.stderr[-2500:]);return r.stdout
with tempfile.TemporaryDirectory(prefix='source-record-bsearch-',dir=ROOT/'work') as directory:
 p=Path(directory);(p/'unit.cpp').write_text('''#include <cstdlib>
struct Record {int key,payload;};static Record records[33];
static int compare_records(const void *a_,const void *b_){const Record*a=(const Record*)a_;const Record*b=(const Record*)b_;return (a->key>b->key)-(a->key<b->key);}
extern "C" int search_case(int seed){
 for(int i=0;i<33;i++){records[i].key=i*3-50;records[i].payload=seed+i*11;}
 Record key={seed%111-60,0};
 Record *found=(Record*)bsearch(&key,records,33,sizeof(Record),compare_records);
 if(!found)return -123;
 int *alias=&found->payload;*alias+=7;
 return (int)(found-records)*1000+records[(int)(found-records)].payload;}
''')
 symbols=p/'symbols.json';symbols.write_text(json.dumps({'bsearch':'host'}));out=p/'out';out.mkdir()
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',p,'--source','unit.cpp','--project-symbols',symbols,'--out-dir',out])
 manifest=json.loads((out/'unit.cpp.manifest.json').read_text());assert manifest['blocked']==0,manifest
 (out/'host.mjs').write_text('import {NativeRuntime} from '+json.dumps((ROOT/'runtime/index.mjs').as_uri())+';const runtime=new NativeRuntime();export const bsearch=(...args)=>runtime.library.symbols.bsearch(...args);\n')
 (p/'main.cpp').write_text('#include <cstdio>\nextern "C" int search_case(int);int main(){for(int i=0;i<512;i++)printf("%d\\n",search_case(i));}\n')
 exe=p/'native.exe';run(['clang++','-std=c++14',p/'unit.cpp',p/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
 (p/'check.mjs').write_text('import {search_case} from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';for(let i=0;i<512;i++)console.log(search_case(i));\n')
 assert run(['node',p/'check.mjs']).splitlines()==expected
print('PASS 512 native cases: source C++ comparator, bounded binary search, original record/member address identity and mutation')
