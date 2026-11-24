"""Exercise the installed sprite queries using their original native fields."""
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

from original_probe_evidence import current_inputs, unchanged_inputs
from verify_original_demo_snapshot_heap import ROOT, run_browser_probe
from verify_original_vm_array_access import function


def main():
    profile = json.loads((ROOT / 'tools/browser_classic_profile.json').read_text())
    source = ROOT / profile['prepared_source_root']
    duke = source / 'source/duke3d/src'
    actors = (duke / 'actors.h').read_text()
    player = (duke / 'player.h').read_text()
    end = actors.index('} tiledata_t;') + len('} tiledata_t;')
    tile_type = actors[actors.rfind('typedef struct', 0, end):end]
    native = '\n'.join([
        '#include <cstdio>', '#include <cstddef>', '#include "compat.h"', '#include "build.h"',
        'struct projectile_t;', tile_type, 'tiledata_t g_tile[256];',
        function(actors, 'enum sflags_t') + ';',
        function(actors, 'ACTOR_INLINE int A_CheckEnemyTile').replace('ACTOR_INLINE ', ''),
        function(actors, 'EXTERN_INLINE int A_CheckEnemySprite').replace('EXTERN_INLINE ', ''),
        function(player, 'static inline int P_GetP'),
    ]) + r'''
int main() {
    printf("%zu,%zu,%zu\n",sizeof(uspritetype),offsetof(uspritetype,picnum),offsetof(uspritetype,yvel));
    uspritetype sprite{};
    for (unsigned i=0;i<256;i++) {
        g_tile[i].flags = (i*104729u) ^ (i << 19);
        sprite.picnum = i;
        sprite.yvel = 0;
        printf("%u,%d,%d\n",g_tile[i].flags,A_CheckEnemySprite(&sprite),P_GetP(&sprite));
    }
}
'''
    with tempfile.TemporaryDirectory(prefix='native-sprite-queries-') as folder:
        root = Path(folder)
        unit, executable = root / 'oracle.cpp', root / 'oracle.exe'
        unit.write_text(native, encoding='utf-8')
        includes = ['-I' + str(source / name) for name in (
            'source/build/include', 'source/glad/include', 'platform/Windows/include',
            'platform/Windows/include/SDL2')]
        subprocess.run(['clang++', '-std=c++14', '-funsigned-char', '-DNOASM', '-DNDEBUG',
                        '-DNETCODE_DISABLE', '-DEDUKE32_BROWSER=1', *includes, unit, '-o', executable], check=True)
        expected = subprocess.check_output([executable], text=True).splitlines()
    layout = [int(value) for value in expected.pop(0).split(',')]
    flags = [int(row.split(',')[0]) for row in expected]
    config = json.dumps({'layout': layout, 'flags': flags})
    probe = r'''async base => {
        const {NativeRuntime}=await import('/runtime/index.mjs');
        const runtime=new NativeRuntime({renderer:'canvas2d', memoryBytes:16<<20});
        runtime.bindSourceMemory();
        const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
        const {layout:[size,tileOffset,playerOffset],flags}=CONFIG;
        const ptr=runtime.heap.malloc(size,8);
        try {
            const game=await import(base+'/source/duke3d/src/gameexec.cpp.mjs');
            const {g_tile}=await import(base+'/source/duke3d/src/global.cpp.mjs');
            const pointer=globalThis[Symbol.for('source-lp64-addresses/2')].decode(BigInt(ptr));
            const bytes=new DataView(runtime.heap.buffer,ptr,size);
            const rows=[];
            for(let tile=0;tile<flags.length;tile++){
                g_tile[tile].flags=flags[tile];
                bytes.setInt16(tileOffset,tile,true);
                bytes.setInt16(playerOffset,0,true);
                rows.push([g_tile[tile].flags,game.A_CheckEnemySprite(pointer),game.P_GetP(pointer)].join(','));
            }
            return {rows};
        } finally {runtime.heap.free(ptr);release();runtime.close();}
    }'''.replace('CONFIG', config)
    inputs = current_inputs()
    actual = run_browser_probe(probe)
    assert actual['rows'] == expected, next(
        ((i, a, b) for i, (a, b) in enumerate(zip(actual['rows'], expected)) if a != b), None)
    report = {'verified': True, 'original_sprite_queries': 512, 'sprite_native_layout': layout,
              'scope': 'Tile enemy flags and profile player query with valid player index',
              'chromium_version': actual['chromium_version'],
              'results_sha256': hashlib.sha256(json.dumps(expected).encode()).hexdigest(),
              'gameplay_verified': False, **unchanged_inputs(inputs)}
    (ROOT / 'reports/nov24-original-sprite-queries.json').write_text(
        json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print('PASS 512 original sprite queries against native C++')


if __name__ == '__main__':
    main()
