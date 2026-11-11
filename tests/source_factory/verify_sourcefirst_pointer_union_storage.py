"""Native valid-pointer unions share bytes with numeric/raw context alternatives."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(args):
    result = subprocess.run(list(map(str, args)), cwd=ROOT, capture_output=True,
                            text=True, timeout=120)
    assert result.returncode == 0, (args, result.stdout[-1600:], result.stderr[-3000:])
    return result.stdout


with tempfile.TemporaryDirectory(prefix='source-pointer-union-') as directory:
    root = Path(directory)
    (root / 'unit.cpp').write_text('''#include <stdint.h>
extern "C" void *memset(void*,int,__SIZE_TYPE__);
union Address { int *pointer; uint64_t bits; };
struct Context { int *pointer; uint32_t table[8]; };
union State { unsigned char bytes[64]; Context context; };
extern "C" int exercise(int input) {
    int values[2]={input,input*3+7}; Address address={};
    address.pointer=&values[1]; uint64_t bits=address.bits;
    address.bits=bits; *address.pointer+=9;
    State state; memset(&state,0,sizeof(state));
    state.context.pointer=&values[0]; state.context.table[3]=input*31;
    State copy=state; *copy.context.pointer+=5;
    int same=copy.context.pointer==state.context.pointer;
    memset(&copy,0,sizeof(copy));
    return *address.pointer+*state.context.pointer+state.context.table[3]
        +1000*same+2000*(copy.context.pointer==nullptr)+4000*(address.bits==(uint64_t)(uintptr_t)&values[1]);
}
''')
    (root / 'main.cpp').write_text('''#include <cstdio>
extern "C" int exercise(int);
int main(){for(int n=-256;n<256;n++)printf("%d\\n",exercise(n));}
''')
    run(['clang++', root / 'unit.cpp', root / 'main.cpp', '-o', root / 'native'])
    expected = run([root / 'native']).splitlines()
    for name, flags in [('full', []), ('filtered', ['--filter', 'exercise', '--exact-filter', '--dependency-closure'])]:
        output = root / name
        run([sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', root, '--source', 'unit.cpp',
             '--out-dir', output, '--require-record-layouts', '--header-dependency-closure', *flags])
        module = output / 'unit.cpp.mjs'
        document = json.loads(module.with_suffix('.manifest.json').read_text())
        row = next(row for row in document['definitions'] if row['name'] == 'exercise')
        assert row['status'] == 'source-first', row
        text = module.read_text()
        assert '"pointerEncoding": "source-lp64-addresses/2"' in text
        runner = root / 'run.mjs'
        runner.write_text('import {exercise} from ' + json.dumps(module.as_uri())
                          + ';for(let n=-256;n<256;n++)console.log(exercise(n));')
        assert run(['node', runner]).splitlines() == expected
print('PASS: 1024 native/full/filtered pointer-union cases, raw zeroing, full-width address round trips, independent copies and shared pointee identity')
