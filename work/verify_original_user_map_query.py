"""Compare original G_HaveUserMap and live UD field storage with native C++."""
import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path

from verify_original_demo_snapshot_heap import ROOT, run_browser_probe


def original_typedef(text, name):
    end = text.index('} ' + name + ';') + len('} ' + name + ';')
    return text[text.rfind('typedef struct', 0, end):end]


PROBE = r'''async base => {
 const {NativeRuntime}=await import('/runtime/index.mjs');
 const runtime=new NativeRuntime({renderer:'canvas2d',memoryBytes:16<<20});
 runtime.bindSourceMemory();
 const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
 try {
  const layer=await import(base+'/source/build/src/baselayer.cpp.mjs');
  layer.engineSetupAllocator();
  const game=await import(base+'/source/duke3d/src/gameexec.cpp.mjs');
  const globals=await import(base+'/source/duke3d/src/global.cpp.mjs');
  const engine=await import(base+'/source/duke3d/src/game.cpp.mjs');
  const saved=[engine.boardfilename[0],globals.ud.volume_number,globals.ud.level_number];
  const storage=globals.ud[Symbol.for('source-first.original-byte-record-storage/1')];
  if(!(storage?.bytes instanceof Uint8Array))throw Error('UD lacks original native byte storage');
  const results=[];
  try {
   for(const filename of [0,77,255])for(const volume of [0,1,2])for(const level of [0,6,7,8]){
    engine.boardfilename[0]=filename;globals.ud.volume_number=volume;globals.ud.level_number=level;
    const value=game.G_HaveUserMap();
    if(engine.boardfilename[0]!==filename||globals.ud.volume_number!==volume||globals.ud.level_number!==level)
     throw Error('Original query changed its input state');
    results.push([filename,volume,level,value]);
   }
  } finally {
   engine.boardfilename[0]=saved[0];globals.ud.volume_number=saved[1];globals.ud.level_number=saved[2];
  }
  return {results,ud_storage_bytes:storage.bytes.length,original_gameplay_verified:false};
 } finally {release();runtime.close();}
}'''


if __name__ == '__main__':
    profile = json.loads((ROOT / 'tools/browser_classic_profile.json').read_text())
    source = ROOT / profile['prepared_source_root']
    game = (source / 'source/duke3d/src/game.h').read_text()
    control = (source / 'source/mact/include/control.h').read_text()
    defines = game[game.index('#define MAXRIDECULE '):game.index('typedef struct ud_setup_s')]
    defines += re.search(r'^#define MAXMOUSEBUTTONS\s+.+$', control, re.M)[0] + '\n'
    types = '\n'.join(original_typedef(game, name) for name in ('ud_setup_t', 'user_defs'))
    function = re.search(r'static inline int G_HaveUserMap\(void\)\s*\{[^}]*\}', game)[0]
    unit = ('#include <cstdio>\n#include <cstddef>\n#include "vec.h"\n#include "fix16.h"\n'
            '#include "gamedefs.h"\n#include "function.h"\n#include "inv.h"\n'
            + defines + '\n' + types + '\nuser_defs ud;char boardfilename[BMAX_PATH];\n'
            + function + '\nint main(){printf("%zu\\n",sizeof(ud));'
            'for(int filename: {0,77,255})for(int volume: {0,1,2})for(int level: {0,6,7,8}){'
            'boardfilename[0]=filename;ud.volume_number=volume;ud.level_number=level;'
            'printf("%d %d %d %d\\n",filename,volume,level,G_HaveUserMap());}}\n')
    with tempfile.TemporaryDirectory(prefix='original-user-map-') as directory:
        folder = Path(directory)
        cpp = folder / 'oracle.cpp'
        cpp.write_text('#include <initializer_list>\n' + unit)
        native = folder / 'oracle.exe'
        includes = ['-I' + str(source / relative) for relative in (
            'source/build/include', 'source/mact/include', 'source/audiolib/include', 'source/duke3d/src')]
        result = subprocess.run(['clang++', '-std=c++14', '-funsigned-char', '-DNOASM', *includes,
                                 str(cpp), '-o', str(native)], capture_output=True, text=True)
        if result.returncode:
            raise RuntimeError(result.stderr)
        lines = subprocess.check_output([str(native)], text=True).splitlines()
    browser = run_browser_probe(PROBE)
    expected = [[int(value) for value in line.split()] for line in lines[1:]]
    assert browser['results'] == expected, (browser['results'], expected)
    assert browser['ud_storage_bytes'] == int(lines[0]), browser
    report = {'original_G_HaveUserMap_verified': True, 'native_chromium_cases': len(expected),
              'full_original_ud_type_bytes': int(lines[0]),
              'original_function_sha256': hashlib.sha256(function.encode()).hexdigest(),
              'original_type_excerpts_sha256': hashlib.sha256(types.encode()).hexdigest(),
              'native_oracle_source_sha256': hashlib.sha256(unit.encode()).hexdigest(), **browser}
    (ROOT / 'reports/nov19-original-user-map-query.json').write_bytes(
        (json.dumps(report, indent=2) + '\n').encode('utf-8'))
    print('PASS original G_HaveUserMap and complete UD type match native C++ in 36 Chromium cases')
