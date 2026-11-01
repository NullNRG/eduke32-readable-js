"""Native parity for authored nested-loop resumptions, without a generated PC."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='source-resume-dispatch-',dir=ROOT/'work') as temporary:
    root=Path(temporary)
    header='struct State{int resume,saved_i,sum,count,limit,budget;};\n'
    (root/'state.hpp').write_text(header)
    (root/'unit.cpp').write_text('''#include "state.hpp"
extern "C" int step(State*s,int budget){
 int i;
 s->budget=budget;
 switch(s->resume){case 0:goto begin;case 1:goto inner;case 2:goto other;case 3:goto finished;}
 begin:;
 do {
  i=0;
  for(;i<5;i++){
   if(s->budget<=0){s->saved_i=i;s->resume=1;goto done;inner:;i=s->saved_i;}
   s->sum+=i*7+3;s->count++;s->budget--;
   if(i&1)continue;
   s->sum+=11;
  }
  while(s->count<s->limit){
   if(s->budget<=0){s->resume=2;goto done;other:;}
   s->sum+=s->count*13+7;s->count++;s->budget--;
   if(s->count>=s->limit)break;
  }
 }while(s->count<s->limit);
 finished:;s->resume=3;
 done:;return s->sum;
}
''')
    (root/'main.cpp').write_text('''#include "state.hpp"
#include <cstdio>
extern "C" int step(State*,int);
int main(){for(int n=0;n<128;n++){State s={0,-1,0,0,5+n%31,0};
 for(int frame=0;frame<40;frame++){
  int result=step(&s,1+(n+frame)%4);
  printf("%d,%d,%d,%d,%d\\n",result,s.count,s.resume,s.saved_i,s.budget);
  if(frame==21){s.resume=0;s.sum=0;s.count=0;s.saved_i=-1;}
 }}}
''')
    exe=root/'oracle.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    for filtered in (False,True):
        out=root/('filtered' if filtered else 'full')
        args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
            '--out-dir',out,'--require-record-layouts']
        if filtered:args+=['--filter','step','--exact-filter','--dependency-closure','--header-dependency-closure']
        run(args,root);module=out/'unit.cpp.mjs';document=json.loads(module.with_suffix('.manifest.json').read_text())
        row=next(row for row in document['definitions'] if row['name']=='step')
        assert row['status']=='source-first',row
        assert row['control_flow']['strategy']=='readable-original-resume-guards',row
        assert row['control_flow']['original_resume_labels']==['begin','finished','inner','other'],row
        code=module.read_text();assert '__cxx_pc' not in code and '__cxx_cfg_loop' not in code
        runner=root/'run.mjs';runner.write_text('import {step} from '+json.dumps(module.as_uri())+''';
for(let n=0;n<128;n++){const s={resume:0,saved_i:-1,sum:0,count:0,limit:5+n%31,budget:0};
 for(let frame=0;frame<40;frame++){
  const result=step(s,1+(n+frame)%4);
  console.log([result,s.count,s.resume,s.saved_i,s.budget].join(','));
  if(frame===21){s.resume=0;s.sum=0;s.count=0;s.saved_i=-1;}
 }}
''')
        observed=run(['node',runner],root).splitlines()
        if observed!=expected:
            (ROOT/'work/resume-dispatch-failure.mjs').write_text(code)
        assert observed==expected,(next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected)) if a!=b),None),observed[:4],expected[:4])
print('PASS 10240 native/JS resumptions: original dispatch labels, nested do/for/while loops, prefix side effects, continue/break, completion and restart; no generated program counter')
