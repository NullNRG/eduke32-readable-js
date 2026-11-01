"""A recovered callee can introduce the first required native record layout."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1400:],p.stderr[-2500:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='dependency-layout-fixedpoint-',dir=ROOT/'work') as temporary:
    root=Path(temporary)
    (root/'unit.cpp').write_text('''struct Entry{Entry *next;int value;};
int leaf(Entry*p,int n){int sum=0;while(p){p->value+=n;sum+=p->value;p=p->next;}return sum;}
int middle(Entry*p,int n){return leaf(p,n);}
extern "C" int outer(Entry*p,int n){return middle(p,n);}
''')
    (root/'main.cpp').write_text('''#include <cstdio>
struct Entry{Entry *next;int value;};extern "C" int outer(Entry*,int);
int main(){for(int n=-128;n<128;n++){Entry tail={nullptr,n*3},head={&tail,n*7};
 int result=outer(&head,n);printf("%d,%d,%d\\n",result,head.value,tail.value);}}
''')
    exe=root/'oracle.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
        '--filter','outer','--exact-filter','--dependency-closure','--header-dependency-closure',
        '--out-dir',root/'out'],root)
    module=root/'out/unit.cpp.mjs';document=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={row['name']:row for row in document['definitions']}
    assert all(rows[name]['status']=='source-first' for name in ('outer','middle','leaf')),document['definitions']
    assert document['record_layout_extraction']['records']>0,document['record_layout_extraction']
    runner=root/'run.mjs';runner.write_text('import {outer} from '+json.dumps(module.as_uri())+''';
for(let n=-128;n<128;n++){const tail={next:null,value:n*3},head={next:tail,value:n*7};
 const result=outer(head,n);console.log([result,head.value,tail.value].join(','));}
''')
    observed=run(['node',runner],root).splitlines();assert observed==expected,(observed[:3],expected[:3])
print('PASS 768 native/JS results: transitive original callee layout extraction, primary-source record identity and original node mutations reach one dependency fixed point')
