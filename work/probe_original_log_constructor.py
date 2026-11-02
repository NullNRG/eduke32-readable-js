"""Native/JS parity of the exact original console log-node constructor.

Only the constructor's original record span is copied into a fixture header;
the list-node template is the byte-identical original atomiclist.h. This does
not attest console initialization, engine startup or gameplay.
"""
import base64,hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
SOURCE=ROOT/profile['prepared_source_root']
def run(args):
    result=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=240)
    assert result.returncode==0,(args,result.stdout[-1500:],result.stderr[-4000:]);return result.stdout
with tempfile.TemporaryDirectory(prefix='original-log-constructor-',dir=ROOT/'work') as temporary:
    root=Path(temporary)
    original=SOURCE/'source/build/include/osd.h';data=original.read_bytes()
    start=data.index(b'struct AtomicLogString :');end=data.index(b'\n};',start)+3
    fragment=data[start:end]
    (root/'original-log-record.h').write_bytes(fragment+b'\n')
    atomic=SOURCE/'source/build/include/atomiclist.h'
    (root/'atomiclist.h').write_bytes(atomic.read_bytes())
    (root/'fixture.hpp').write_text('#include "atomiclist.h"\n#include "original-log-record.h"\n')
    cpp=root/'unit.cpp';cpp.write_text('''#include "fixture.hpp"
extern "C" int exercise(int n){char text[3]={(char)(n&127),42,0};
 AtomicLogString*node=new AtomicLogString(text);
 int result=(node->m_next==nullptr?10000:0)+(node->m_value==text?20000:0);
 result+=node->m_value[0]+node->m_isLogged.load()*71;
 node->m_isLogged.store(n+5);result+=node->m_isLogged.load();
 delete node;return result;}
''')
    main=root/'main.cpp';main.write_text('''#include <cstdio>
extern "C" int exercise(int);
int main(){for(int n=0;n<256;n++)printf("%d\\n",exercise(n));}
''')
    flags=['-std=gnu++14','-fsized-deallocation','-funsigned-char','-DNOASM','-DNDEBUG','-DEDUKE32_BROWSER=1']
    flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/audiolib/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
    oracle=root/'oracle.exe';run(['clang++','-O1',*flags,cpp,main,'-o',oracle])
    expected=list(map(int,run([oracle]).splitlines()))
    commands=root/'commands.json';commands.write_text(json.dumps([{'directory':str(root),'file':'unit.cpp',
        'arguments':['clang++',*flags,'-c','unit.cpp','-o','unused.o']}]))
    # The configured fixture uses the same ownership gate as the real game.
    # Prove allocator absence from its actual semantic index, never fabricate
    # a standard-heap witness just to make `new` emit.
    database=root/'index.sqlite'
    run([sys.executable,ROOT/'tools/source_semantic_index.py','--root',root,'--commands',commands,'--out',database])
    sys.path.insert(0,str(ROOT/'tools'))
    from source_standard_heap_contract import create
    create(root,commands,database)
    out=root/'out'
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
        '--out-dir',out,'--compile-commands',commands,'--filter','exercise','--exact-filter',
        '--dependency-closure','--header-dependency-closure','--require-record-layouts'])
    module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    row=next(row for row in manifest['definitions'] if row['name']=='exercise')
    assert row['status']=='source-first',[(r['name'],r['status'],r.get('reason')) for r in manifest['definitions']]
    constructors=[r['original_byte_constructor'] for r in manifest['definitions'] if r.get('original_byte_constructor')]
    assert any(row['mangled_name']=='_ZN15AtomicLogStringC1EPc' for row in constructors),constructors
    js='async url=>{const {exercise}=await import(url);return Array.from({length:256},(_,n)=>exercise(n));}'
    runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    actual=json.loads(run(['node',runner]));assert actual==expected,(actual[:3],expected[:3])
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
        try:
            page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
            assert actual==expected and not errors,(actual[:3],expected[:3],errors)
            version=browser.version
        finally:browser.close()
    report={'format':'original-console-log-constructor-native-parity/1','passed':True,
        'native_node_chromium_cases':256,'browser_version':version,'page_errors':errors,
        'source_header':'source/build/include/osd.h','original_header_sha256':hashlib.sha256(data).hexdigest(),
        'original_record_offset':start,'original_record_bytes':len(fragment),'original_record_sha256':hashlib.sha256(fragment).hexdigest(),
        'fixture_record_span_is_byte_identical_to_original':True,'original_list_header_sha256':hashlib.sha256(atomic.read_bytes()).hexdigest(),
        'constructors':constructors,'emitted_module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),
        'compiler_and_runtime_helpers':{path.relative_to(ROOT).as_posix():hashlib.sha256(path.read_bytes()).hexdigest()
            for path in sorted((ROOT/'tools').glob('source_*')) if path.suffix in ('.py','.mjs')},
        'javascript_constructed_original_log_node':True,'original_default_base_initializer_executed':True,
        'original_scalar_atomic_constructor_executed':True,'console_initialization_verified':False,
        'original_engine_startup_verified':False,'gameplay_verified':False}
    (ROOT/'reports/nov02-original-log-constructor-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ('constructors','compiler_and_runtime_helpers')},indent=2))
