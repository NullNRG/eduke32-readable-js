"""Compare the actual recovered compat.h search helpers to their native source.

This is a component test after original engine initialization, not map/gameplay
verification. The native driver includes the unchanged original source header.
"""
import ast
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
profile = json.loads((ROOT / 'tools/browser_classic_profile.json').read_text())
source = ROOT / profile['prepared_source_root']
modules = ROOT / profile['boot_module_root']
stage = ROOT / 'work/original-bfirst-native'
stage.mkdir(exist_ok=True)
header = source / 'source/build/include/compat.h'
driver = stage / 'driver.cpp'
driver.write_text('#include ' + json.dumps(header.as_posix()) + r'''
#include <cstdio>
int main() {
    for (int input = 0; input < 512; ++input) {
        int16_t list[64] = {}, count = 0;
        uint8_t bitmap[8] = {};
        bfirst_search_init(list, bitmap, &count, 64, input & 63);
        for (int j = 0; j < 48; ++j) {
            int next = (input * 17 + j * 13) & 63;
            bfirst_search_try(list, bitmap, &count, next);
            bfirst_search_try(list, bitmap, &count, next);
        }
        uint32_t hash = 2166136261u;
        for (int j = 0; j < 64; ++j) hash = (hash ^ (uint16_t)list[j]) * 16777619u;
        for (int j = 0; j < 8; ++j) hash = (hash ^ bitmap[j]) * 16777619u;
        printf("%d %u\n", (int)count, (unsigned)hash);
    }
}
''')
command = ['clang++', '-std=gnu++14', '-funsigned-char', '-DNOASM',
           '-I' + str(source / 'source/build/include'), str(driver),
           '-o', str(stage / 'native.exe')]
build = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=120)
(stage / 'build.log').write_text(build.stdout + '\n' + build.stderr)
if build.returncode:
    raise SystemExit(build.stderr[-4000:])
result = subprocess.run([str(stage / 'native.exe')], capture_output=True, text=True,
                        check=True, timeout=30)
expected = [[int(value) for value in line.split()] for line in result.stdout.splitlines()]
assert len(expected) == 512
manifest = json.loads((modules / 'source/build/src/engine.cpp.manifest.json').read_text())
selected = {}
for name in ('bfirst_search_init', 'bfirst_search_try'):
    rows = [row for row in manifest['definitions'] if row.get('source_name') == name
            and row.get('status') == 'source-first'
            and 'short *' in row.get('original_type', '')]
    assert len(rows) == 1, (name, rows)
    selected[name] = rows[0]['name']

# Extend the existing real-engine harness; keep its original initialization,
# raw GRP loading, native palette/trig comparisons, traces and artifact hashes.
probe = ROOT / 'work/verify_original_engine_init.py'
tree = ast.parse(probe.read_text())
constants = [node for node in ast.walk(tree) if isinstance(node, ast.Constant)
             and isinstance(node.value, str) and 'engineInitialization={original_engineInit_executed:true' in node.value]
assert len(constants) == 1
constants[0].value += '\nconst nativeSearchExpected=' + json.dumps(expected) + ';\n' + r'''
      for(let input=0;input<512;input++) {
        const list=new Int16Array(64),bitmap=new Uint8Array(8),count=new Int16Array(1);
        engine[INIT](list,bitmap,count,64,input&63);
        for(let j=0;j<48;j++) {
          const next=(input*17+j*13)&63;
          engine[TRY](list,bitmap,count,next);engine[TRY](list,bitmap,count,next);
        }
        let hash=2166136261;
        for(const value of list)hash=Math.imul(hash^(value&65535),16777619)>>>0;
        for(const value of bitmap)hash=Math.imul(hash^value,16777619)>>>0;
        if(count[0]!==nativeSearchExpected[input][0]||hash!==nativeSearchExpected[input][1])
          throw Error('Original breadth-first search differs from native at '+input);
      }
      engineInitialization.original_bfirst_search_native_cases=512;
'''.replace('engine[INIT]', 'engine[' + json.dumps(selected['bfirst_search_init']) + ']') \
    .replace('engine[TRY]', 'engine[' + json.dumps(selected['bfirst_search_try']) + ']')
if '--report' not in sys.argv:
    sys.argv += ['--report', 'reports/nov10-original-bfirst-search.json']
report = ROOT / sys.argv[sys.argv.index('--report') + 1]
try:
    exec(compile(ast.fix_missing_locations(tree), str(probe), 'exec'),
         {'__file__': str(probe), '__name__': '__main__'})
finally:
    if report.is_file():
        evidence = json.loads(report.read_text())
        evidence['original_search_native_reference'] = {
            'header': header.relative_to(ROOT).as_posix(),
            'header_sha256': hashlib.sha256(header.read_bytes()).hexdigest(),
            'driver': driver.relative_to(ROOT).as_posix(),
            'driver_sha256': hashlib.sha256(driver.read_bytes()).hexdigest(),
            'cases': len(expected), 'host_abi': 'native host; fixed-width int16/uint8/uint32 inputs only',
            'gameplay_verified': False}
        report.write_text(json.dumps(evidence, indent=2) + '\n')
