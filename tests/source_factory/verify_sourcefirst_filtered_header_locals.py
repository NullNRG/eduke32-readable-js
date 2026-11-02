"""Filtered header locals cannot acquire namespace storage or shadow globals."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=150)
    assert p.returncode==0,(args,p.stdout[-1800:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='header-local-scope-',dir=ROOT/'work') as temporary:
    root=Path(temporary)
    for language in ('c','cpp'):
        case=root/language;case.mkdir()
        (case/'original.h').write_text('''extern int ud;
static int header_value=13;
static inline int first(int n){unsigned short ud=n+7;return ud+header_value;}
static inline int second(int n){static unsigned int ud=5;return ud++ + n*3;}
''')
        source='unit.'+language
        (case/source).write_text('''#include "original.h"
int ud=31;
int original(int n){return ud+first(n)+second(n);}
''')
        (case/('main.'+language)).write_text('''#include <stdio.h>
int original(int);
int main(){for(int n=0;n<256;n++)printf("%d\\n",original(n));}
''')
        oracle=case/'oracle.exe';compiler='clang' if language=='c' else 'clang++'
        run([compiler,'-O1',case/source,case/('main.'+language),'-o',oracle])
        expected=list(map(int,run([oracle]).splitlines()))
        for filtered in (False,True):
            out=case/str(filtered);arguments=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',case,
                '--source',source,'--out-dir',out,'--header-dependency-closure']
            if filtered:arguments+=['--filter','original,ud','--exact-filter','--dependency-closure']
            run(arguments);module=out/(source+'.mjs');doc=json.loads(module.with_suffix('.manifest.json').read_text())
            globals=[row for row in doc['definitions'] if row['source_name']=='ud']
            assert len(globals)==1 and globals[0]['original_type']=='int' and globals[0]['status']=='source-first',globals
            assert all(row['status']=='source-first' for row in doc['definitions']),doc['definitions']
            assert doc['compiler_runtime_inputs_unchanged']
            if language=='c' and filtered:
                scope=doc['filtered_c_storage_scope']
                assert scope['attempted'] and scope['proven_file_scope'] and scope['local_or_ambiguous_roots_rejected'],scope
            (case/'run.mjs').write_text('import {original} from '+json.dumps(module.as_uri())+';console.log(JSON.stringify(Array.from({length:256},(_,n)=>original(n))));')
            actual=json.loads(run(['node',case/'run.mjs']));assert actual==expected,(actual[:3],expected[:3])
            if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
                from playwright.sync_api import sync_playwright
                with sync_playwright() as pw:
                    browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                    try:
                        actual=browser.new_page().evaluate('async url=>{const {original}=await import(url);return Array.from({length:256},(_,n)=>original(n));}',
                            'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
                        assert actual==expected,(actual[:3],expected[:3])
                    finally:browser.close()
print('PASS 1024 native/Node/Chromium C/C++ header-scope results: automatic/static header locals stay local, true globals preserve storage and static local lifetimes')
