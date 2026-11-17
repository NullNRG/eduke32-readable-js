"""Compare selected scalar and pointer slots in a large Clang record."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(*args):
    return subprocess.check_output([str(arg) for arg in args], cwd=ROOT, text=True, timeout=120)


with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    (root / 'snapshot.h').write_text('''
struct Snapshot { unsigned char data[2 << 20]; int *slots[2]; int scalar; };
''')
    source = root / 'snapshot.cpp'
    source.write_text('''
#include "snapshot.h"
extern "C" int exchange(Snapshot *snapshot, int *value, int index) {
    snapshot->slots[index] = value;
    snapshot->scalar += *snapshot->slots[index];
    return snapshot->scalar;
}
''')
    driver = root / 'native.cpp'
    driver.write_text('''
#include <cstdio>
#include "snapshot.h"
extern "C" int exchange(Snapshot *, int *, int);
int main() {
    static Snapshot snapshot;
    for (int n=0;n<256;++n) {
        int value=n-119;
        std::printf("%d\\n", exchange(&snapshot, &value, n%2));
    }
    std::printf("%zu %zu\\n", sizeof(Snapshot), __builtin_offsetof(Snapshot, scalar));
}
''')
    native = root / 'snapshot.exe'
    run('clang++', source, driver, '-o', native)
    *expected, layout = run(native).splitlines()
    size, offset = map(int, layout.split())
    out = root / 'out'
    run(sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', root,
        '--source', source.name, '--out-dir', out, '--require-record-layouts')
    module = out / 'snapshot.cpp.mjs'
    manifest = json.loads(module.with_suffix('.manifest.json').read_text(encoding='utf-8'))
    definition, = [row for row in manifest['definitions'] if row['name'] == 'exchange']
    assert definition['status'] == 'source-first', definition
    script = root / 'snapshot.mjs'
    script.write_text(f'import {{exchange}} from {json.dumps(module.as_uri())};\n' + f'''
const bytes = new Uint8Array({size});
const view = new DataView(bytes.buffer);
const value = new Int32Array(1);
for (let n=0; n<256; ++n) {{
    value[0] = n-119;
    const result = exchange(bytes, value, n%2);
    if (result !== view.getInt32({offset}, true)) throw Error('Source record aliases its original bytes');
    console.log(result);
}}
try {{ exchange(bytes.subarray(0, -1), value, 0); }}
catch (error) {{ if (error instanceof RangeError) process.exit(0); throw error; }}
throw Error('Accepted incomplete original record storage');
''')
    assert run('node', script).splitlines() == expected
print('PASS 256 native comparison values for scalar and pointer slots in a large record')
