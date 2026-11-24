"""Compare original VM scalar writes and Build angle deltas with native C++."""
import hashlib
import json
import re
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
    header = (duke / 'gamevars.h').read_text()
    labels = (duke / 'gamedef.h').read_text()
    label_defines = '\n'.join(re.findall(r'(?m)^#define LABEL_(?:CHAR|SHORT|INT|UNSIGNED)\s[^\n]*', labels))
    writer = function(header, 'static FORCE_INLINE void __fastcall VM_SetStruct(')
    angles = function((duke / 'gameexec.cpp').read_text(), 'int __fastcall G_GetAngleDelta(')
    native = '\n'.join(['#include <cstdio>', '#include "compat.h"', '#include "pragmas.h"', label_defines,
                       '#define LABEL_TYPES (LABEL_CHAR|LABEL_SHORT|LABEL_INT|LABEL_UNSIGNED)',
                       writer, angles]) + r'''
int main() {
    const unsigned flags[] = {LABEL_CHAR, LABEL_CHAR|LABEL_UNSIGNED, LABEL_SHORT,
                              LABEL_SHORT|LABEL_UNSIGNED, LABEL_INT, LABEL_INT|LABEL_UNSIGNED};
    for (unsigned flag : flags)
        for (int i=0; i<128; ++i) {
            intptr_t word;
            auto bytes = reinterpret_cast<unsigned char*>(&word);
            for (unsigned j=0; j<sizeof(word); ++j) bytes[j]=0xa5;
            VM_SetStruct(flag, &word, (i-64)*100003);
            printf("%u", flag);
            for (unsigned j=0; j<sizeof(word); ++j) printf(",%u", unsigned(bytes[j]));
            puts("");
        }
    for (int i=-1024; i<=1024; ++i)
        printf("%d\n", G_GetAngleDelta(i*37, i*-53+1024));
}
'''
    with tempfile.TemporaryDirectory(prefix='native-vm-writes-') as temporary:
        root = Path(temporary)
        unit, executable = root / 'oracle.cpp', root / 'oracle.exe'
        unit.write_text(native)
        includes = ['-I' + str(source / name) for name in (
            'source/build/include', 'platform/Windows/include', 'platform/Windows/include/SDL2')]
        subprocess.run(['clang++', '-std=c++14', '-funsigned-char', '-DNOASM', '-DNDEBUG',
                        '-DEDUKE32_BROWSER=1', *includes, unit, '-o', executable], check=True)
        expected = subprocess.check_output([executable], text=True).splitlines()

    owner = ROOT / profile['boot_module_root'] / 'source/duke3d/src/gameexec.cpp.manifest.json'
    rows = json.loads(owner.read_text())['definitions']
    names = {}
    for source_name in ('VM_SetStruct', 'G_GetAngleDelta'):
        matches = [row['name'] for row in rows if row.get('source_name') == source_name
                   and row.get('status') == 'source-first']
        assert len(matches) == 1, (source_name, matches)
        names[source_name] = matches[0]
    flags = [int(expected[i * 128].split(',')[0]) for i in range(6)]
    probe = r'''async base => {
        const {NativeRuntime}=await import('/runtime/index.mjs');
        const runtime=new NativeRuntime({renderer:'canvas2d', memoryBytes:16<<20});
        runtime.bindSourceMemory();
        const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
        const ptr=runtime.heap.malloc(8,8);
        try {
            const game=await import(base+'/source/duke3d/src/gameexec.cpp.mjs');
            const address=globalThis[Symbol.for('source-lp64-addresses/2')].decode(BigInt(ptr));
            const bytes=new Uint8Array(runtime.heap.buffer,ptr,8);
            const names=ORIGINAL_NAMES, rows=[];
            for (const flag of ORIGINAL_FLAGS) for (let i=0;i<128;++i) {
                bytes.fill(0xa5);
                game[names.VM_SetStruct](flag,address,(i-64)*100003);
                rows.push([flag,...bytes].join(','));
            }
            for (let i=-1024;i<=1024;++i)
                rows.push(String(game[names.G_GetAngleDelta](i*37,i*-53+1024)));
            return {rows};
        } finally { runtime.heap.free(ptr);release();runtime.close(); }
    }'''.replace('ORIGINAL_NAMES', json.dumps(names)).replace('ORIGINAL_FLAGS', json.dumps(flags))
    inputs = current_inputs()
    actual = run_browser_probe(probe)
    assert actual['rows'] == expected, next(
        ((i, a, b) for i, (a, b) in enumerate(zip(actual['rows'], expected)) if a != b), None)
    report = {'verified': True, 'source_exports': names, 'original_writes': 768,
              'original_angle_deltas': 2049, 'native_chromium_values': 768 * 8 + 2049,
              'chromium_version': actual['chromium_version'],
              'native_oracle_sha256': hashlib.sha256(native.encode()).hexdigest(),
              'results_sha256': hashlib.sha256(json.dumps(expected).encode()).hexdigest(),
              'gameplay_verified': False, **unchanged_inputs(inputs)}
    (ROOT / 'reports/nov24-original-vm-leaves.json').write_text(
        json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print('PASS 768 original scalar writes, adjacent byte preservation and 2049 angle deltas')


if __name__ == '__main__':
    main()
