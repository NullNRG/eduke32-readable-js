"""A nominally recovered outer record still needs all nested storage types."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=150)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='nested-global-array-',dir=ROOT/'work') as temporary:
    root=Path(temporary)
    (root/'types.hpp').write_text('''#include <stdint.h>
#pragma pack(push,1)
struct Input{uint32_t bits;int16_t fvel,svel;int32_t angle,horizon;uint32_t ext;};
struct Player{Player*ps;Input input;int32_t adjust[1];uint64_t stamp;uint8_t name[16];uint32_t revision;};
#pragma pack(pop)
#ifdef UNIT_OWNER
static Player storage[17];Player*const players=&storage[1];
#else
extern Player*const players;
#endif
'''.replace('int32_t adjust[1]','int32_t adjust'))
    (root/'unit.cpp').write_text('''#define UNIT_OWNER
#include "types.hpp"
int mutate(int n){int slot=n%16;Player*p=&players[slot];
 p->input.bits=n*31u;p->input.fvel=n-129;p->adjust=n+5;p->stamp=(uint64_t)n*1009;
 p->ps=p;players[-1].revision=n+7;
 return p->input.bits+p->input.fvel+p->adjust+(int)p->stamp+players[-1].revision+(p->ps==p?10000:0);}
''')
    (root/'main.cpp').write_text('''#include <cstdio>
int mutate(int);int main(){for(int n=0;n<256;n++)printf("%d\\n",mutate(n));}
''')
    oracle=root/'oracle.exe';run(['clang++','-std=c++14','-O1',root/'unit.cpp',root/'main.cpp','-o',oracle])
    expected=list(map(int,run([oracle]).splitlines()))
    out=root/'out';run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
        '--filter','players,mutate','--exact-filter','--dependency-closure','--header-dependency-closure',
        '--require-record-layouts','--out-dir',out])
    module=out/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={row['source_name']:row for row in doc['definitions']}
    assert rows['players']['status']==rows['mutate']['status']=='source-first',doc['definitions']
    assert doc['full_type_closure']['attempted'],doc['full_type_closure']
    assert 'export const '+rows['players']['name']+' = cStaticPointer(' in module.read_text()
    js='async url=>{const {mutate}=await import(url);return Array.from({length:256},(_,n)=>mutate(n));}'
    runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    actual=json.loads(run(['node',runner]));assert actual==expected,(actual[:3],expected[:3])
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            try:
                actual=browser.new_page().evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
                assert actual==expected,(actual[:3],expected[:3])
            finally:browser.close()
print('PASS 256 native/Node/Chromium nested global record-array results: complete type closure, sentinel element, native aliases and packed scalar fields')
