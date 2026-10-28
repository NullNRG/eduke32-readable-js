"""Compare original Build world layout, union aliases and vector methods to C++."""
import hashlib,json,os,shutil,subprocess,sys,tempfile
import functools,http.server,threading
from pathlib import Path
from contextlib import nullcontext
ROOT=Path(__file__).resolve().parents[2]
SOURCE='tests/source_factory/source_first_original_world_storage.cpp'
INCLUDE=ROOT/'factory-output/source-tree/eduke32-master/source/build/include'
def run(args):
    p=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-2000:],p.stderr[-4000:])
    return p.stdout
fixed=os.environ.get('EDUKE32_WORLD_STORAGE_TEST_DIR')
with (nullcontext(fixed) if fixed else tempfile.TemporaryDirectory(prefix='eduke-original-world-')) as scratch:
    work=Path(scratch)
    work.mkdir(parents=True,exist_ok=True)
    for name in ('vec.h','buildtypes.h'):shutil.copyfile(INCLUDE/name,work/name)
    build_header=(INCLUDE/'build.h').read_text()
    end=build_header.index('} spriteext_t;')+len('} spriteext_t;')
    start=build_header.rfind('typedef struct',0,end)
    spriteext=build_header[start:end]
    assert spriteext.startswith('typedef struct') and 'tspriteptr_t' in spriteext
    (work/'original-spriteext.h').write_text(spriteext+'\n')
    shutil.copyfile(ROOT/SOURCE,work/'unit.cpp')
    flags=['-std=c++14','-funsigned-char','-DNOASM','-I'+str(work),'-I'+str(INCLUDE)]
    main=work/'main.cpp'
    main.write_text('''#include <cstdio>
extern "C" int original_world_sizes(),original_world_mutate(int),original_world_copy(int),original_world_clear(),original_pointer_storage(int);
int main(){printf("%d,%d\\n",original_world_sizes(),original_world_clear());
for(int i=0;i<512;i++){int a=original_world_mutate(i),b=original_world_copy(i),c=original_pointer_storage(i);printf("%d,%d,%d\\n",a,b,c);}
printf("%d\\n",original_world_clear());}
''')
    native=work/('native.exe' if os.name=='nt' else 'native')
    run(['clang++',*flags,str(work/'unit.cpp'),str(main),'-o',str(native)])
    expected=run([str(native)]).splitlines()
    commands=work/'commands.json'
    commands.write_text(json.dumps([{'file':'unit.cpp','arguments':['clang++',*flags,'-c','unit.cpp']}]))
    out=work/'out'
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(work),'--source','unit.cpp',
         '--compile-commands',str(commands),'--out-dir',str(out),'--header-dependency-closure'])
    module=out/'unit.cpp.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    failures=[(r['name'],r.get('reason')) for r in manifest['definitions'] if r['status']!='source-first']
    assert not failures,failures
    driver=work/'run.mjs'
    driver.write_text('import * as s from '+json.dumps(module.as_uri())+';\n'
        +'console.log(`${s.original_world_sizes()},${s.original_world_clear()}`);\n'
        +'for(let i=0;i<512;i++)console.log(`${s.original_world_mutate(i)},${s.original_world_copy(i)},${s.original_pointer_storage(i)}`);\n'
        +'console.log(s.original_world_clear());\n')
    actual=run(['node',str(driver)]).splitlines()
    assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),None)
    report={'passed':True,'native_js_values':1539,'original_spriteext_sha256':hashlib.sha256(spriteext.encode()).hexdigest(),'original_headers':{
        n:hashlib.sha256((INCLUDE/n).read_bytes()).hexdigest() for n in ('vec.h','buildtypes.h')},
        'checks':['original packed world sizes','overlapping position and velocity aliases',
                  'original vector operators on nested byte views','independent record copy',
                  'whole-array memcpy','whole-array memset with methods retained',
                  'original sprite-extension pointer storage, dereference, identity, memcpy and null clear'],
        'gameplay_verified':False}
    executable=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE')
    if executable:
        from playwright.sync_api import sync_playwright
        class QuietHandler(http.server.SimpleHTTPRequestHandler):
            extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.js':'text/javascript'}
            def log_message(self,*args):pass
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(work)))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        errors=[]
        try:
            with sync_playwright() as playwright:
                browser=playwright.chromium.launch(executable_path=executable,headless=True)
                page=browser.new_page()
                page.on('pageerror',lambda error:errors.append(str(error)))
                page.goto('http://127.0.0.1:'+str(server.server_port)+'/')
                observed=page.evaluate('''async()=>{
                    const s=await import('/out/unit.cpp.mjs');
                    const rows=[`${s.original_world_sizes()},${s.original_world_clear()}`];
                    for(let i=0;i<512;i++)rows.push(`${s.original_world_mutate(i)},${s.original_world_copy(i)},${s.original_pointer_storage(i)}`);
                    rows.push(String(s.original_world_clear()));return rows;
                }''')
                report['browser']={'passed':observed==expected and not errors,'version':browser.version,
                    'executable':executable,'native_js_values':1539,'exceptions':errors}
                browser.close()
                assert observed==expected and not errors,(errors,observed[:3],expected[:3])
        finally:server.shutdown();server.server_close();thread.join()
    report['compiler_sha256']=hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest()
    report['generated_module_sha256']=hashlib.sha256(module.read_bytes()).hexdigest()
    (ROOT/'reports/original-world-storage-parity.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: 1539 original Build world-storage native/JS values, nested methods, contiguous memcpy/memset and borrowed pointers')
