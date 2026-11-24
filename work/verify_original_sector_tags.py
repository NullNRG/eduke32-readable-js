"""Compare the installed original sector operation queries with native EDuke32."""
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
    duke = ROOT / profile['prepared_source_root'] / 'source/duke3d/src'
    game = (duke / 'game.h').read_text(encoding='utf-8')
    sector = (duke / 'sector.cpp').read_text(encoding='utf-8')
    tags = function(game[game.index('// sector lotags'):], 'enum') + ';'
    native = '\n'.join([
        '#include <cstdio>',
        tags,
        function(sector, 'int isanearoperator('),
        function(sector, 'int isanunderoperator('),
        '''int main() {
            for (int tag=-1024;tag<1024;tag++)
                printf("%d,%d\\n",isanearoperator(tag),isanunderoperator(tag));
        }''',
    ])
    with tempfile.TemporaryDirectory(prefix='original-sector-tags-') as folder:
        root = Path(folder)
        unit, executable = root / 'oracle.cpp', root / 'oracle.exe'
        unit.write_text(native, encoding='utf-8')
        subprocess.run(['clang++', '-std=c++14', unit, '-o', executable], check=True)
        expected = subprocess.check_output([executable], text=True).splitlines()
    probe = r'''async base => {
        const {NativeRuntime}=await import('/runtime/index.mjs');
        const runtime=new NativeRuntime({renderer:'canvas2d',memoryBytes:16<<20});
        runtime.bindSourceMemory();
        const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
        try {
            // Follow the engine-first order used by the browser startup probe.
            await import(base+'/source/build/src/engine.cpp.mjs');
            const sector=await import(base+'/source/duke3d/src/sector.cpp.mjs');
            const rows=[];
            for (let tag=-1024;tag<1024;tag++)
                rows.push([sector.isanearoperator(tag),sector.isanunderoperator(tag)].join(','));
            return {rows};
        } finally {release();runtime.close();}
    }'''
    inputs = current_inputs()
    actual = run_browser_probe(probe)
    assert actual['rows'] == expected, next(
        ((i, got, want) for i, (got, want) in enumerate(zip(actual['rows'], expected)) if got != want), None)
    report = {'verified': True, 'definitions': ['isanearoperator', 'isanunderoperator'],
              'native_chromium_values': 4096, 'chromium_version': actual['chromium_version'],
              'native_oracle_sha256': hashlib.sha256(native.encode()).hexdigest(),
              'results_sha256': hashlib.sha256(json.dumps(expected).encode()).hexdigest(),
              'gameplay_verified': False, **unchanged_inputs(inputs)}
    (ROOT / 'reports/nov24-original-sector-tags.json').write_text(
        json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print('PASS 4096 original sector tag results against native C++')


if __name__ == '__main__':
    main()
