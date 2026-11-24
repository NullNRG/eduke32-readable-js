"""Compare the original strided CON pointer relocation with native EDuke32."""
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
    header = (duke / 'savegame.h').read_text(encoding='utf-8')
    cpp = (duke / 'savegame.cpp').read_text(encoding='utf-8')
    modes = header[header.rfind('enum', 0, header.index('P2I_BACK_BIT')):]
    native = '\n'.join(['#include <cstdio>', '#include "compat.h"', function(modes, 'enum') + ';',
                        function(cpp, 'void G_Util_PtrToIdx2(')]) + r'''
template<size_t stride> void verify() {
    struct Slot { intptr_t value; unsigned char guard[stride-sizeof(intptr_t)]; };
    static_assert(sizeof(Slot)==stride,"native slot extent");
    unsigned char anchor[1024]{};
    intptr_t base=reinterpret_cast<intptr_t>(anchor);
    for (int mode=0;mode<4;mode++) {
        Slot slots[32]{};
        for (int i=0;i<32;i++) {
            if (i%3) slots[i].value=(mode&1 ? 0 : base)+i*13;
            for (auto& guard:slots[i].guard) guard=0xa5;
        }
        G_Util_PtrToIdx2(slots,32,stride,anchor,mode);
        for (auto& slot:slots) {
            auto value=slot.value;
            if (mode&1) { if(value) value-=base; }
            else if(value==-base) value=-1;
            bool intact=true;
            for (auto guard:slot.guard) intact&=guard==0xa5;
            printf("%lld,%d\n",(long long)value,intact);
        }
    }
}
int main(){verify<16>();verify<32>();verify<40>();verify<96>();}
'''
    with tempfile.TemporaryDirectory(prefix='script-relocation-') as folder:
        root = Path(folder)
        unit, executable = root / 'oracle.cpp', root / 'oracle.exe'
        unit.write_text(native, encoding='utf-8')
        subprocess.run(['clang++', '-std=c++14', '-funsigned-char', '-DNOASM',
                        '-I' + str(source / 'source/build/include'), unit, '-o', executable], check=True)
        expected = subprocess.check_output([executable], text=True).splitlines()
    probe = r'''async base => {
        const {NativeRuntime}=await import('/runtime/index.mjs');
        const runtime=new NativeRuntime({renderer:'canvas2d',memoryBytes:16<<20});
        runtime.bindSourceMemory();
        const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
        const anchor=runtime.heap.malloc(1024,8), data=runtime.heap.malloc(96*32,8);
        const address=globalThis[Symbol.for('source-lp64-addresses/2')];
        try {
            const {G_Util_PtrToIdx2}=await import(base+'/source/duke3d/src/savegame.cpp.mjs');
            const bytes=new DataView(runtime.heap.buffer), rows=[];
            const object=address.decode(BigInt(data)), originalBase=address.decode(BigInt(anchor));
            for(const stride of [16,32,40,96]) for(let mode=0;mode<4;++mode){
                for(let i=0;i<32;++i){
                    const offset=data+i*stride;
                    bytes.setBigInt64(offset,i%3?BigInt((mode&1 ? 0 : anchor)+i*13):0n,true);
                    for(let b=8;b<stride;++b)bytes.setUint8(offset+b,0xa5);
                }
                G_Util_PtrToIdx2(object,32,BigInt(stride),originalBase,mode);
                for(let i=0;i<32;++i){
                    const offset=data+i*stride;
                    let value=bytes.getBigInt64(offset,true);
                    if(mode&1){if(value)value-=BigInt(anchor);}
                    else if(value===-BigInt(anchor))value=-1n;
                    let intact=true;
                    for(let b=8;b<stride;++b)intact&&=bytes.getUint8(offset+b)===0xa5;
                    rows.push([value.toString(),Number(intact)].join(','));
                }
            }
            return {rows};
        } finally {runtime.heap.free(data);runtime.heap.free(anchor);release();runtime.close();}
    }'''
    inputs = current_inputs()
    actual = run_browser_probe(probe)
    assert actual['rows'] == expected, next(
        ((i, got, want) for i, (got, want) in enumerate(zip(actual['rows'], expected)) if got != want), None)
    report = {'verified': True, 'original_relocations': len(expected),
              'strides': [16, 32, 40, 96], 'original_modes': [0, 1, 2, 3],
              'adjacent_bytes_preserved': True, 'chromium_version': actual['chromium_version'],
              'results_sha256': hashlib.sha256(json.dumps(expected).encode()).hexdigest(),
              'gameplay_verified': False, **unchanged_inputs(inputs)}
    (ROOT / 'reports/nov24-original-script-relocation.json').write_text(
        json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print('PASS 512 original CON relocations and adjacent byte guards against native C++')


if __name__ == '__main__':
    main()
