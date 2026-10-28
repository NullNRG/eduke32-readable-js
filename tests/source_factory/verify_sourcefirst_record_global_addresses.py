"""Cross-TU record addresses preserve original owner storage and pointer identity."""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=120)
 assert p.returncode==0,(p.stdout[-1000:],p.stderr[-3000:])
 return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke-record-global-address-') as td:
 work=Path(td)
 (work/'table.h').write_text('struct Table {int count;int values[4];};extern Table table;Table *owner_address();\n')
 (work/'provider.cpp').write_text('#include "table.h"\nTable table={3,{1,2,3,4}};Table *owner_address(){return &table;}\n')
 (work/'consumer.cpp').write_text('#include "table.h"\nTable *retained;void update(Table *p,int n){p->count=n;p->values[2]=n*7;}extern "C" int record_addresses(int n){retained=&table;update(retained,n);return table.count+table.values[2]+100*(retained==&table)+200*(retained==owner_address());}\n')
 (work/'main.cpp').write_text('#include <cstdio>\nextern "C" int record_addresses(int);int main(){for(int n=-256;n<256;n++)printf("%d\\n",record_addresses(n));}\n')
 exe=work/('native.exe' if os.name=='nt' else 'native')
 run(['clang++',str(work/'provider.cpp'),str(work/'consumer.cpp'),str(work/'main.cpp'),'-o',str(exe)])
 expected=run([str(exe)]).splitlines()
 plan=work/'plan.json';plan.write_text(json.dumps({'root':str(work),'units':[{'source':'provider.cpp'},{'source':'consumer.cpp'}]}))
 out=work/'out'
 run([sys.executable,str(ROOT/'tools/source_first_project.py'),'--plan',str(plan),'--out-dir',str(out),'--strict'])
 mf=json.loads((out/'provider.cpp.manifest.json').read_text())
 assert any(r['name']=='table' for r in mf['storage_exports']),mf
 consumer=json.loads((out/'consumer.cpp.manifest.json').read_text())
 assert any(r['name']=='table' and r.get('binding') for r in consumer['imports']),consumer
 (work/'run.mjs').write_text('import {record_addresses} from '+json.dumps((out/'consumer.cpp.mjs').as_uri())+';for(let n=-256;n<256;n++)console.log(record_addresses(n));')
 actual=run(['node',str(work/'run.mjs')]).splitlines();assert actual==expected,(actual[:3],expected[:3])
 (ROOT/'reports/record-global-address-parity.json').write_text(json.dumps({'passed':True,'native_js_cases':512,'checks':['shared original record owner','cross-unit pointer identity','callee field writes','retained source address'],'gameplay_verified':False},indent=2)+'\n')
 print('PASS: 512 native/JS cross-unit record storage address, identity and mutation cases')
