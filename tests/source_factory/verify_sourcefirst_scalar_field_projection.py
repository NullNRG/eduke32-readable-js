"""A native scalar arrow access keeps byte identity without unrelated prototypes."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(command, cwd):
    output = subprocess.run(list(map(str, command)), cwd=cwd, capture_output=True,
                            text=True, timeout=120)
    assert output.returncode == 0, (output.stdout[-1400:], output.stderr[-2000:])
    return output.stdout


with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    (root / 'types.hpp').write_text('''template<class T> struct Vec {
    T x, y;
    bool operator!=(const Vec other) { return (x!=other.x)|(y!=other.y); }
};
struct State { Vec<int> position; int count; };
static_assert(sizeof(State)==12 && __builtin_offsetof(State,count)==8,"fixture layout");
''')
    (root / 'fields.cpp').write_text('''#include "types.hpp"
extern "C" int read_count(const State *state) { return state->count; }
extern "C" void write_count(State *state,int n) { state->count=n*3; }
extern "C" bool compare_vec(Vec<int> a,Vec<int> b) { return a!=b; }
struct Row { long long keep, value; };
static Row rows[4];
static void visit_values(void* start, int count, unsigned long long stride, int n){
    auto bytes=static_cast<unsigned char*>(start);
    for (int i=0;i<count;i++){
        *reinterpret_cast<long long*>(bytes)+=n+i;
        bytes+=stride;
    }
}
extern "C" int strided_fields(int n){
    for (int i=0;i<4;i++){rows[i].keep=91-i;rows[i].value=n*7+i*3;}
    visit_values(&rows[0].value,4,sizeof(Row),n);
    return int(rows[0].keep + rows[3].keep + rows[0].value + rows[3].value);
}
''')
    (root / 'native.cpp').write_text('''#include <cstdio>
#include "types.hpp"
extern "C" int read_count(const State*);
extern "C" void write_count(State*,int);
extern "C" int strided_fields(int);
int main(){
    for (int n=-128;n<128;n++) {
        State state{{n,n+3},n+5};
        int previous=read_count(&state);
        write_count(&state,n);
        std::printf("%d %d %d %d %d\\n",previous,read_count(&state),state.position.x,state.position.y,strided_fields(n));
    }
}
''')
    exe = root / 'oracle.exe'
    run(['clang++', root / 'native.cpp', root / 'fields.cpp', '-o', exe], root)
    expected = run([exe], root).splitlines()
    out = root / 'out'
    run([sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', root, '--source', 'fields.cpp',
         '--out-dir', out, '--header-dependency-closure', '--require-record-layouts'], ROOT)
    module = out / 'fields.cpp.mjs'
    manifest = json.loads(module.with_suffix('.manifest.json').read_text())
    for name in ('read_count', 'write_count'):
        row = next(row for row in manifest['definitions'] if row['name'] == name)
        assert row['status'] == 'source-first', row
        assert not any(ref.startswith('__cxx_record_') for ref in row['source_references']), row
    runner = root / 'run.mjs'
    runner.write_text('import * as source from ' + json.dumps(module.as_uri()) + ';\n' + '''
for (let n=-128;n<128;n++) {
    const state=new Int32Array([n,n+3,n+5]);
    const before=source.read_count(state);
    source.write_count(state,n);
    console.log(before,source.read_count(state),state[0],state[1],source.strided_fields(n));
}
let bounded=false;
try { source.read_count(new Int32Array(2)); }
catch (error) { bounded=error instanceof RangeError; }
if (!bounded) throw Error('Projected field access lost the original native record bounds');
''')
    assert run(['node', runner], root).splitlines() == expected
print('PASS 1,280 native/JavaScript results for scalar field views and strided record access')
