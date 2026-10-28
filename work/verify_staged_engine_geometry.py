"""Compare actual source-generated engine inside() with its original C++ body."""
import functools,hashlib,http.server,json,os,re,subprocess,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
source=root/'factory-output/source-tree/eduke32-master'
target=root/'factory-output/source-first/browser-target'
engine=root/'factory-output/source-first/oct15-startup-repair/source/build/src/engine.cpp.mjs'
clock=root/'factory-output/source-first/oct15-header-providers/source/build/include/clockticks.hpp.mjs'
work=root/'work/staged-engine-geometry';work.mkdir(exist_ok=True)
text=(source/'source/build/src/engine.cpp').read_text()
def extract(name):
    match=re.search(r'^(?:static )?int32_t '+name+r'\(',text,re.M)
    assert match,name
    begin=text.index('{',match.start());i=begin+1;depth=1
    while depth:
        depth+=(text[i]=='{')-(text[i]=='}');i+=1
    return text[match.start():i]
bodies='\n'.join(extract(name) for name in ('inside_19950829','inside_compat','inside'))
(work/'main.cpp').write_text('#include "compat.h"\n#include "build.h"\n#include <cstdio>\nsectortype *sector;walltype *wall;int16_t numsectors;int32_t enginecompatibilitymode;\n'+bodies+'''
int main(){sectortype sectors[1]={};walltype walls[4]={};sector=sectors;wall=walls;numsectors=1;
sector[0].wallptr=0;sector[0].wallnum=4;
for(int i=0;i<4;i++){wall[i].x=(i==1||i==2)?100:0;wall[i].y=i>=2?100:0;wall[i].point2=(i+1)%4;}
int modes[]={ENGINE_EDUKE32,ENGINE_19950829,0};
for(int mode:modes){enginecompatibilitymode=mode;for(int x=-10;x<=110;x+=5)for(int y=-10;y<=110;y+=5)printf("%d\\n",inside(x,y,0));}}
''')
def run(args):
    p=subprocess.run(args,cwd=root,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(p.stdout[-1000:],p.stderr[-3000:]);return p.stdout
exe=work/('native.exe' if os.name=='nt' else 'native')
run(['clang++','-std=gnu++14','-funsigned-char','-DNOASM',*['-I'+str(source/part) for part in ('source/build/include','source/glad/include','source/mact/include','source/audiolib/include','source/voidwrap/include','source/imgui/include','source/mimalloc/include')],str(work/'main.cpp'),'-o',str(exe)])
expected=run([str(exe)]).splitlines()
manifest=json.loads(engine.with_suffix('.manifest.json').read_text())
cells={r['name']:r['global_storage']['binding'] for r in manifest['definitions'] if r.get('global_storage')}
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
    def translate_path(self,path):
        original=Path(super().translate_path(path))
        overlays={(target/'source/build/src/engine.cpp.mjs').resolve():engine,
                  (target/'source/build/include/clockticks.hpp.mjs').resolve():clock}
        return str(overlays.get(original.resolve(),original))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
errors=[]
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
        page=browser.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto('http://127.0.0.1:'+str(server.server_port)+'/')
        actual=page.evaluate('''async cells=>{
            const e=await import('/factory-output/source-first/browser-target/source/build/src/engine.cpp.mjs');
            e[cells.sector]().value=e.sector_s;e[cells.wall]().value=e.wall_s;e[cells.numsectors]().value=1;
            e.sector_s[0].wallptr=0;e.sector_s[0].wallnum=4;
            for(let i=0;i<4;i++){
                const w=e.wall_s[i];w.__cxx_anonymous_0.__cxx_anonymous_0.x=(i===1||i===2)?100:0;
                w.__cxx_anonymous_0.__cxx_anonymous_0.y=i>=2?100:0;w.point2=(i+1)%4;
            }
            const results=[];
            for(const mode of [2147483647,19950829,0]){e[cells.enginecompatibilitymode]().value=mode;
                for(let x=-10;x<=110;x+=5)for(let y=-10;y<=110;y+=5)results.push(String(e.inside(x,y,0)));}
            return results;
        }''',cells)
        version=browser.version;browser.close()
    assert actual==expected and not errors,(errors,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),None))
    report={'passed':True,'native_chromium_cases':len(expected),'browser_version':version,
        'original_body_sha256':hashlib.sha256(bodies.encode()).hexdigest(),
        'generated_engine_sha256':hashlib.sha256(engine.read_bytes()).hexdigest(),
        'checks':['original inside() and both compatibility implementations','native packed world records','wall and sector pointer aliases','boundary and interior points'],
        'manually_supplied_rectangle_is_not_a_loaded_game_level':True,'original_gameplay_verified':False}
    (root/'reports/oct15-staged-engine-geometry.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
finally:server.shutdown();server.server_close();thread.join()
