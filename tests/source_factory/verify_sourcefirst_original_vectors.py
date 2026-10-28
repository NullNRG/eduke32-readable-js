"""Original vec.h return values must remain records, not numeric coercions."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
TOOLS=Path(os.environ.get('EDUKE_TEST_COMPILER_DIR',ROOT/'tools'))
sys.path.insert(0,str(TOOLS))
from source_ast_to_js import js_cast, scalar_size, is_64, is_int32, is_unsigned

def run(args):
    result=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=180)
    assert result.returncode==0,(args,result.stdout[-3000:],result.stderr[-5000:])
    return result.stdout

for record in ('vec2<int>','const vec2<float>','vec2<unsigned short>',
               'vec2<long long>','outer<int>::inner','Holder<bool>'):
    assert js_cast('original_object',record)=='original_object',record
    assert scalar_size(record) is None and not is_64(record) and not is_int32(record) and not is_unsigned(record),record
assert scalar_size('long unsigned int')==8 and is_64('long unsigned int')

with tempfile.TemporaryDirectory(prefix='original-vector-values-') as directory:
    work=Path(directory)
    source='tests/source_factory/source_first_original_vector_fixture.cpp'
    include=ROOT/'factory-output/source-tree/eduke32-master/source/build/include'
    flags=['-std=gnu++14','-funsigned-char','-DNOASM','-I',str(include)]
    main=work/'main.cpp'
    main.write_text('''#include <cstdio>
extern "C" int vector_integer(int);
extern "C" float vector_float(int);
extern "C" long long vector_wide(int);
extern "C" unsigned int vector_short(int);
int main(){for(int x=-128;x<128;x++)printf("%d,%.9g,%lld,%u\\n",vector_integer(x),(double)vector_float(x),vector_wide(x),vector_short(x));}
''')
    native=work/'native.exe'
    run(['clang++',*flags,source,str(main),'-o',str(native)])
    expected=[row.split(',') for row in run([str(native)]).splitlines()]
    commands=work/'commands.json'
    commands.write_text(json.dumps([{'file':source,'directory':str(ROOT),
        'arguments':['clang++',*flags,'-c',source,'-o','unused.o']}]))
    output=work/'out'
    run([sys.executable,str(TOOLS/'source_ast_to_js.py'),'--root',str(ROOT),
        '--source',source,'--compile-commands',str(commands),'--out-dir',str(output),
        '--filter','vector_integer,vector_float,vector_wide,vector_short,vec2',
        '--header-inlines','--header-dependency-closure','--dependency-closure'])
    module=output/(source+'.mjs')
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={r['source_name']:r for r in manifest['definitions']}
    for name in ('vector_integer','vector_float','vector_wide','vector_short'):
        assert rows[name]['status']=='source-first',(rows[name],[(r['name'],r.get('reason')) for r in manifest['definitions'] if r.get('header_record_factory')])
    driver=work/'run.mjs'
    driver.write_text('import {vector_integer,vector_float,vector_wide,vector_short} from '+json.dumps(module.as_uri())+';\n'
        +'for(let x=-128;x<128;x++)console.log(`${vector_integer(x)},${vector_float(x)},${vector_wide(x)},${vector_short(x)}`);\n')
    actual=[row.split(',') for row in run(['node',str(driver)]).splitlines()]
    assert len(actual)==len(expected)==256
    for x,(a,b) in enumerate(zip(actual,expected)):
        assert int(a[0])==int(b[0]) and float(a[1])==float(b[1]) and int(a[2])==int(b[2]) and int(a[3])==int(b[3]),(x-128,a,b)

print('PASS: 1024 original vec.h native/JS values for integer, float, BigInt and narrow unsigned record returns')
