"""A real frontend run must not publish output after helper revision changes."""
import os,shutil,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
if os.name!='nt':
    print('SKIP Windows frontend shim; the production revision guard is platform independent')
    raise SystemExit(0)
with tempfile.TemporaryDirectory(prefix='emission-revision-',dir=ROOT/'work') as temporary:
    root=Path(temporary);project=root/'compiler';project.mkdir()
    shutil.copytree(ROOT/'tools',project/'tools',ignore=shutil.ignore_patterns('__pycache__'))
    shutil.copytree(ROOT/'runtime',project/'runtime',ignore=shutil.ignore_patterns('__pycache__'))
    original=root/'original';original.mkdir();(original/'unit.cpp').write_text('int original(int*p){return p[0]+9;}\n')
    output=root/'out';output.mkdir();module=output/'unit.cpp.mjs';manifest=output/'unit.cpp.manifest.json'
    module.write_text('// previous verified output\n');manifest.write_text('{"previous":"verified"}\n')
    before_module=module.read_bytes();before_manifest=manifest.read_bytes()
    (root/'shim.c').write_text('''#include <process.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
int main(int argc,char**argv){
 for(int i=1;i<argc;i++)if(strcmp(argv[i],"-ast-dump=json")==0){
  FILE*f=fopen(getenv("EDUKE_EMISSION_GUARD_HELPER"),"ab");if(!f)return 91;
  fputs("\\n// intentional isolated revision mutation\\n",f);fclose(f);break;}
 char*real=getenv("EDUKE_EMISSION_GUARD_FRONTEND");argv[0]=real;
 return (int)_spawnv(_P_WAIT,real,(const char*const*)argv);
}
''')
    shim=root/'clang-shim.exe'
    built=subprocess.run(['clang',str(root/'shim.c'),'-o',str(shim)],capture_output=True,text=True)
    assert built.returncode==0,built.stderr
    environment={**os.environ,'EDUKE32_CLANGXX':str(shim),
        'EDUKE_EMISSION_GUARD_FRONTEND':shutil.which('clang++'),
        'EDUKE_EMISSION_GUARD_HELPER':str(project/'tools/source_pointer_runtime.mjs')}
    result=subprocess.run([sys.executable,str(project/'tools/source_ast_to_js.py'),'--root',str(original),
        '--source','unit.cpp','--out-dir',str(output)],cwd=ROOT,capture_output=True,text=True,env=environment,timeout=150)
    assert result.returncode!=0 and 'Compiler/runtime inputs changed during source emission' in result.stderr,(result.stdout[-1000:],result.stderr[-3000:])
    assert module.read_bytes()==before_module and manifest.read_bytes()==before_manifest
print('PASS real Clang extraction after isolated helper mutation rejected publication; previous module and manifest preserved byte-for-byte')
