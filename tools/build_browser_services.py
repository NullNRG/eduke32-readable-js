"""Build SDL2-only WASM services. Original engine/game sources are forbidden."""
import argparse,hashlib,json,os,re,subprocess,sys
from pathlib import Path
from source_ast_cache_paths import make_dependency_paths
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'runtime/native_services/sdl_services.c'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--emsdk',type=Path,default=ROOT/'work/dependencies/emsdk')
    parser.add_argument('--out',type=Path,default=ROOT/'factory-output/browser-services')
    args=parser.parse_args();sdk=args.emsdk.resolve();out=args.out.resolve();out.mkdir(parents=True,exist_ok=True)
    compiler=sdk/'upstream/emscripten/emcc.py'
    if not compiler.is_file() or not (sdk/'.emscripten').is_file():
        raise SystemExit('Install and activate pinned Emscripten 6.0.13; see BROWSER_SERVICES.md')
    env={**os.environ,'EM_CONFIG':str(sdk/'.emscripten'),'EMCC_CORES':'1'}
    for name in ('EMCC_CFLAGS','EMMAKEN_CFLAGS','EMCC_FORCE_STDLIBS'):env.pop(name,None)
    def run(command):
        result=subprocess.run(list(map(str,command)),cwd=ROOT,env=env,capture_output=True,text=True,timeout=900)
        if result.returncode:raise RuntimeError(result.stdout[-2000:]+'\n'+result.stderr[-9000:])
        return result.stdout.strip()
    version=run([sys.executable,compiler,'--version'])
    if not re.search(r'\b6\.0\.13\b',version):raise ValueError('Service SDK version differs from pinned 6.0.13')
    names=re.findall(r'^SF_EXPORT\s+\w+\s+(sf_\w+)\(',SOURCE.read_text(),re.M)
    if len(names)!=len(set(names)) or len(names)<20:raise ValueError('Native service export declarations changed')
    module=out/'sdl-services.mjs';wasm=out/'sdl-services.wasm'
    command=[sys.executable,compiler,str(SOURCE),'--use-port=sdl2','--no-entry','-O2','-g2','--emit-symbol-map',
        '-sMODULARIZE=1','-sEXPORT_ES6=1','-sENVIRONMENT=web','-sWASM_BIGINT=1','-sALLOW_MEMORY_GROWTH=1',
        '-sINITIAL_MEMORY=16777216','-sMAXIMUM_MEMORY=268435456','-sFILESYSTEM=0',
        '-sEXPORTED_RUNTIME_METHODS=["HEAPU8"]',
        '-sEXPORTED_FUNCTIONS='+json.dumps(['_'+n for n in names]),'-o',str(module)]
    print('Building native SDL2 services; zero original EDuke32 translation units',flush=True)
    output=run(command);(out/'build.log').write_text(output+'\n')
    dependencies=run([sys.executable,compiler,str(SOURCE),'--use-port=sdl2','-M','-MT','__sourcefactory_ast_deps__'])
    inputs=[]
    for name in make_dependency_paths(dependencies):
        path=Path(name);path=(path if path.is_absolute() else ROOT/path).resolve()
        if path!=SOURCE.resolve() and not path.is_relative_to(sdk):
            raise ValueError('Non-service source included in native WASM: '+str(path))
        inputs.append({'path':str(path),'sha256':sha(path),'role':'upstream-SDL-or-toolchain' if path.is_relative_to(sdk) else 'platform-service-bridge'})
    inspector='''import fs from 'node:fs';const m=new WebAssembly.Module(fs.readFileSync(process.argv[1]));console.log(JSON.stringify({exports:WebAssembly.Module.exports(m),imports:WebAssembly.Module.imports(m)}));'''
    symbols=json.loads(run(['node','--input-type=module','-e',inspector,str(wasm)]))
    for item in symbols['exports']:
        if item['name'] in ('app_main','enginePreInit','drawrooms','G_DrawRooms','A_Execute','G_DoMoveThings'):
            raise ValueError('Original gameplay/renderer symbol in native service module')
    record={'format':'sourcefactory-native-browser-services/1','backend':'sdl2-wasm32',
        'sdk_version':version,'sdk_commit':run(['git','-C',sdk,'rev-parse','HEAD']),
        'native_pointer_bits':32,'engine_pointer_bits':64,'shared_engine_memory':False,
        'roles':['sdl2','platform','timing','audio-backend'],'project_sources':[
            {'path':SOURCE.relative_to(ROOT).as_posix(),'sha256':sha(SOURCE)}],
        'original_engine_translation_units':[],'dependencies':inputs,'command':list(map(str,command)),
        'exports':names,'wasm_symbols':symbols,
        'artifacts':{'wasm':{'path':wasm.relative_to(ROOT).as_posix(),'sha256':sha(wasm),'bytes':wasm.stat().st_size},
                     'glue':{'path':module.relative_to(ROOT).as_posix(),'sha256':sha(module),'bytes':module.stat().st_size}},
        'browser_service_execution_verified':False,'original_gameplay_verified':False}
    (out/'build-manifest.json').write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps({'backend':record['backend'],'artifacts':record['artifacts'],'original_engine_translation_units':[]},indent=2))
if __name__=='__main__':main()
