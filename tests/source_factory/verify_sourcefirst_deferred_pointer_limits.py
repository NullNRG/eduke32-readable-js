"""Native short-input guards and loop snapshots, retaining all pointer bounds."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(args):
    result = subprocess.run(list(map(str, args)), cwd=ROOT, capture_output=True,
                            text=True, timeout=120)
    assert result.returncode == 0, (args, result.stdout[-1500:], result.stderr[-2500:])
    return result.stdout


with tempfile.TemporaryDirectory(prefix='source-pointer-limits-') as directory:
    root = Path(directory)
    (root / 'unit.cpp').write_text('''
static int count(const unsigned char *p,const unsigned char *end){return p<end?*p:0;}
extern "C" int guarded(const unsigned char *source,int length){
    const unsigned char *const end=source+length;
    const unsigned char *const limit=end-12+1;
    const unsigned char *const match=end-5;
    if(length<13)return length;
    return (source+3<limit)+count(source+2,match);
}
extern "C" int compare_limits(const unsigned char *source,int length){
    const unsigned char *const end=source+length;
    const unsigned char *const limit=end-12;
    const unsigned char *const inner=limit+4;
    return (source<limit)+2*(source<=inner)+3*(source+2==inner)+4*(end-limit==12);
}
extern "C" int snapshots(const unsigned char *source){
    const unsigned char *saved[4];
    for(int n=0;n<4;n++){
        const unsigned char *const end=source+n+13;
        const unsigned char *const limit=end-12;
        saved[n]=limit;
    }
    return *saved[0]+*saved[1]+*saved[2]+*saved[3];
}
extern "C" int invalid_read(const unsigned char *source){
    const unsigned char *const end=source;
    const unsigned char *const limit=end-12;
    return *limit;
}
extern "C" int mutable_base(const unsigned char *source){
    const unsigned char *end=source;
    const unsigned char *const limit=end-12;
    return 0;
}
extern "C" int escaped_base(const unsigned char *source){
    const unsigned char *const end=source;
    const unsigned char *const *alias=&end;
    const unsigned char *const limit=end-12;
    return alias!=0;
}
''')
    (root / 'main.cpp').write_text('''#include <cstdio>
extern "C" int guarded(const unsigned char*,int),snapshots(const unsigned char*);
extern "C" int compare_limits(const unsigned char*,int);
int main(){unsigned char data[600];for(int i=0;i<600;i++)data[i]=(unsigned char)(i*17+3);
for(int n=0;n<512;n++)printf("%d %d %d\\n",guarded(data,n),snapshots(data),compare_limits(data+32,n));}
''')
    run(['clang++', root / 'unit.cpp', root / 'main.cpp', '-o', root / 'native'])
    expected = run([root / 'native']).splitlines()
    output = root / 'out'
    run([sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', root, '--source', 'unit.cpp', '--out-dir', output])
    module = output / 'unit.cpp.mjs'
    document = json.loads(module.with_suffix('.manifest.json').read_text())
    rows = {row['name']: row for row in document['definitions']}
    assert len(rows['guarded']['deferred_pointer_initializers']) == 2
    assert len(rows['snapshots']['deferred_pointer_initializers']) == 1
    for name in ('mutable_base', 'escaped_base'):
        assert not rows[name].get('deferred_pointer_initializers'), rows[name]
    runner = root / 'run.mjs'
    runner.write_text('import * as m from ' + json.dumps(module.as_uri())
                      + ';const data=Uint8Array.from({length:600},(_,i)=>(i*17+3)&255);'
                      + 'for(const name of ["invalid_read","mutable_base","escaped_base"]){let rejected=false;try{m[name](data)}catch(error){if(!(error instanceof RangeError))throw error;rejected=true;}if(!rejected)throw Error("Invalid pointer accepted: "+name);}'
                      + 'for(let n=0;n<512;n++)console.log([m.guarded(data,n),m.snapshots(data),m.compare_limits(data.subarray(32),n)].join(" "));')
    assert run(['node', runner]).splitlines() == expected
print('PASS: 1536 native/JS guarded-limit/snapshot/address-comparison results; invalid reads and unproven mutable/escaped bases retain checked failures')
