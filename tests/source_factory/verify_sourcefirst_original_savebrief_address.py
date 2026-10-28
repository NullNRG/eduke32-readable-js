"""Cross-TU record addresses preserve original owner storage and pointer identity."""
import json,os,subprocess,sys,tempfile,hashlib,copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=120)
 assert p.returncode==0,(p.stdout[-1000:],p.stderr[-3000:])
 return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke-record-global-address-') as td:
 work=Path(td)
 header=ROOT/'factory-output/source-tree/eduke32-master/source/duke3d/src/savegame.h'
 original=header.read_text();begin=original.index('struct savebrief_t');opening=original.index('{',begin);i=opening+1;depth=1
 while depth:
  depth+=(original[i]=='{')-(original[i]=='}');i+=1
 body=original[begin:i+1]
 macros='\n'.join(line for line in original.splitlines() if line.startswith('#define MAXSAVEGAMENAME'))
 compat=(ROOT/'factory-output/source-tree/eduke32-master/source/build/include/compat.h').read_text()
 macros+='\n'+next(line for line in compat.splitlines() if line.startswith('#define BMAX_PATH '))
 (work/'table.h').write_text('#pragma once\n#include <stdint.h>\n#include <string.h>\n'+macros+'\n'+body+'\nextern savebrief_t table;savebrief_t *owner_address();\n')
 (work/'provider.cpp').write_text('#include "table.h"\nsavebrief_t table;savebrief_t *owner_address(){return &table;}\n')
 (work/'consumer.cpp').write_text('#include "table.h"\nsavebrief_t *retained;void update(savebrief_t *p,int n){p->path[0]=(char)(n+1);p->isExt=(uint8_t)n;}extern "C" int record_addresses(int n){retained=&table;retained->reset();update(retained,n);return (int)table.path[0]+table.isExt+10*retained->isValid()+100*(retained==&table)+200*(retained==owner_address());}\n')
 (work/'main.cpp').write_text('#include <cstdio>\nextern "C" int record_addresses(int);int main(){for(int n=-256;n<256;n++)printf("%d\\n",record_addresses(n));}\n')
 exe=work/('native.exe' if os.name=='nt' else 'native')
 run(['clang++','-funsigned-char',str(work/'provider.cpp'),str(work/'consumer.cpp'),str(work/'main.cpp'),'-o',str(exe)])
 expected=run([str(exe)]).splitlines()
 plan=work/'plan.json';plan.write_text(json.dumps({'root':str(work),'units':[{'source':'provider.cpp'},{'source':'consumer.cpp'}]}))
 out=work/'out'
 run([sys.executable,str(ROOT/'tools/source_first_project.py'),'--plan',str(plan),'--out-dir',str(out),'--strict'])
 mf=json.loads((out/'provider.cpp.manifest.json').read_text())
 metadata=next(r for r in mf['storage_exports'] if r['name']=='table')
 assert metadata.get('record_layout_sha256'),metadata
 consumer=json.loads((out/'consumer.cpp.manifest.json').read_text())
 dependency=next(r for r in consumer['imports'] if r['name']=='table' and r.get('binding'))
 assert dependency.get('record_layout_sha256')==metadata['record_layout_sha256'],(dependency,metadata)
 sys.path.insert(0,str(ROOT/'tools'))
 from source_first_global_link import storage_import_error
 units={'provider.cpp':{'manifest':mf,'module':out/'provider.cpp.mjs'}}
 assert storage_import_error(dependency,units) is None
 bad={**dependency,'record_layout_sha256':'incorrect'}
 assert 'layout differs' in storage_import_error(bad,units)
 (work/'run.mjs').write_text('import {record_addresses} from '+json.dumps((out/'consumer.cpp.mjs').as_uri())+';for(let n=-256;n<256;n++)console.log(record_addresses(n));')
 actual=run(['node',str(work/'run.mjs')]).splitlines();assert actual==expected,(actual[:3],expected[:3])
 (ROOT/'reports/original-savebrief-address-parity.json').write_text(json.dumps({'passed':True,'native_js_cases':512,'original_class_sha256':hashlib.sha256(body.encode()).hexdigest(),'record_layout_tampering_rejected':True,'checks':['original savebrief_t constructor and reset/isValid methods','cross-unit pointer identity','callee field writes','retained source address'],'gameplay_verified':False},indent=2)+'\n')
 print('PASS: 512 original savebrief_t native/JS constructor, method, cross-unit address and exact-layout cases')
