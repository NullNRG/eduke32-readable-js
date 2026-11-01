"""Canonical C scalar calls stay distinct from C++ overloads and retain widths."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run([str(x) for x in args],cwd=ROOT,capture_output=True,text=True,timeout=90)
 assert p.returncode==0,(args,p.stderr[-2200:],p.stdout[-1000:]);return p.stdout
source='''extern "C" int abs(int) noexcept;
namespace specimen {
int abs(int x) { return x+100; }
long long abs(long long x) { return __builtin_llabs(x); }
}
extern "C" int integer_probe(int x) { return ::abs(x)+specimen::abs(x); }
extern "C" long long wide_probe(long long x) { return specimen::abs(x); }
extern "C" double double_probe(double x) { return __builtin_fabs(x); }
extern "C" float float_probe(float x) { return __builtin_fabsf(x); }
extern "C" int effect_probe() { int x=-7; return __builtin_abs(x++ )*100+x; }
'''
with tempfile.TemporaryDirectory(prefix='source-scalar-intrinsics-',dir=ROOT/'work') as temporary:
 d=Path(temporary);(d/'unit.cpp').write_text(source)
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',d,'--source','unit.cpp','--out-dir',d/'out'])
 module=d/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 assert manifest['blocked']==0,manifest
 (d/'run.mjs').write_text('import * as m from '+json.dumps(module.as_uri())+''';
for(let x=-128;x<128;x++)console.log(m.integer_probe(x));
for(const x of [0n,1n,-1n,9223372036854775807n,-9223372036854775807n,9007199254740993n,-9007199254740993n])console.log(String(m.wide_probe(x)));
for(const x of [-16,-0,0,0.25,1024])console.log(m.double_probe(x),m.float_probe(x));
console.log(m.effect_probe());
if(!Object.is(m.double_probe(-0),0)||!Number.isNaN(m.double_probe(NaN)))throw Error('floating abs special values');
let rejected=false;try{m.wide_probe(-9223372036854775808n);}catch(e){rejected=e instanceof RangeError;}if(!rejected)throw Error('signed overflow must be diagnosed');
''')
 actual=run(['node',d/'run.mjs']).splitlines()
 (d/'oracle.cpp').write_text('''#include <cstdio>
extern "C" int integer_probe(int),effect_probe();extern "C" long long wide_probe(long long);extern "C" double double_probe(double);extern "C" float float_probe(float);
int main(){for(int x=-128;x<128;x++)printf("%d\\n",integer_probe(x));
for(long long x: {0LL,1LL,-1LL,9223372036854775807LL,-9223372036854775807LL,9007199254740993LL,-9007199254740993LL})printf("%lld\\n",wide_probe(x));
for(double x: {-16.,-0.,0.,0.25,1024.})printf("%g %g\\n",double_probe(x),(double)float_probe((float)x));printf("%d\\n",effect_probe());}
'''.replace('#include <cstdio>','#include <cstdio>\n#include <initializer_list>'))
 run(['clang++',d/'unit.cpp',d/'oracle.cpp','-o',d/'oracle.exe'])
 assert actual==run([d/'oracle.exe']).splitlines(),actual
 # Independent filtered dependency queries have different Clang IDs. Prove
 # the selected canonical C declaration from the unchanged same-TU callsite.
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',d,'--source','unit.cpp','--filter','integer_probe','--exact-filter','--dependency-closure','--out-dir',d/'filtered'])
 filtered=d/'filtered/unit.cpp.mjs';fm=json.loads(filtered.with_suffix('.manifest.json').read_text())
 assert next(row for row in fm['definitions'] if row['name']=='integer_probe')['status']=='source-first',fm
 (d/'filtered.mjs').write_text('import {integer_probe} from '+json.dumps(filtered.as_uri())+';for(let x=-128;x<128;x++)console.log(integer_probe(x));')
 assert run(['node',d/'filtered.mjs']).splitlines()==actual[:256]
print('PASS: 525 native scalar cases; canonical C versus namespaced overloads across independent queries, exact signed64, float/double, evaluation order and overflow rejection')
