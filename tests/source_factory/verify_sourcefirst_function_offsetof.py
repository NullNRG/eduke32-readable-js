"""Compare function-body offsetof and array initializers with native Clang."""
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
    source = root / 'offset.cpp'
    source.write_text('''
struct Child { unsigned char tag; int value; };
struct Record { short version; Child members[3]; long long trailer; };
#define RECORD_OFFSET(field) __builtin_offsetof(Record, field)
extern "C" const unsigned long record_offsets[] = { RECORD_OFFSET(trailer) };
extern "C" unsigned long field_offset(int kind) {
    if (kind == 0) return RECORD_OFFSET(members[2].value);
    if (kind == 1) return __builtin_offsetof(Record, version);
    return record_offsets[0];
}
''', encoding='utf-8')
    driver = root / 'native.cpp'
    driver.write_text('''
#include <cstdio>
extern "C" unsigned long field_offset(int);
int main() {
    for (int i = 0; i < 3; ++i) std::printf("%lu\\n", field_offset(i));
}
''', encoding='utf-8')
    native = root / 'offset.exe'
    run('clang++', source, driver, '-o', native)
    expected = run(native).splitlines()
    out = root / 'out'
    run(sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', root,
        '--source', source.name, '--out-dir', out)
    module = out / 'offset.cpp.mjs'
    manifest = json.loads(module.with_suffix('.manifest.json').read_text(encoding='utf-8'))
    assert manifest['original_offset_constants']['by_kind']['offsets'] == 3, manifest
    script = root / 'offset.mjs'
    script.write_text(f'import {{field_offset}} from {json.dumps(module.as_uri())};\n' +
                      'for (let i = 0; i < 3; ++i) console.log(String(field_offset(i)));\n',
                      encoding='utf-8')
    assert run('node', script).splitlines() == expected
print('PASS function-body offsetof, nested member offsets, and array initializers match native Clang')
