"""Project discovery must coalesce source-proven aggregate header factories."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
TOOLS=Path(os.environ.get('EDUKE_TEST_COMPILER_DIR',ROOT/'tools'))

def run(args,cwd):
    result=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=180)
    assert result.returncode==0,(args,result.stdout[-2000:],result.stderr[-4000:])
    return result.stdout

with tempfile.TemporaryDirectory(prefix='header-record-project-') as directory:
    root=Path(directory)
    (root/'header.hpp').write_text('struct Header { int value; int get() const { return value+3; } };\n')
    for name,add in (('one',0),('two',4)):
        copy='Header copied=object;' if name=='one' else ''
        receiver='copied' if name=='one' else 'object'
        (root/(name+'.cpp')).write_text('#include "header.hpp"\nint '+name+'(int x){Header object{};object.value=x;'
            +copy+'return '+receiver+'.get()+'+str(add)+';}\n'
            +'Header make_'+name+'(int x){Header object{};object.value=x;return object;}\n')
    (root/'main.cpp').write_text('#include <cstdio>\nint one(int),two(int);\nint main(){for(int i=-128;i<128;i++)printf("%d,%d\\n",one(i),two(i));}\n')
    native=root/'native.exe'
    run(['clang++','-std=c++14','one.cpp','two.cpp','main.cpp','-o',str(native)],root)
    expected=run([str(native)],root).splitlines()
    plan=root/'plan.json'
    plan.write_text(json.dumps({'root':str(root),'units':[{'source':name+'.cpp','header_inlines':True,
        'header_dependency_closure':True,'dependency_closure':True} for name in ('one','two')]}))
    output=root/'out'
    run([sys.executable,str(TOOLS/'source_first_project.py'),'--plan',str(plan),'--out-dir',str(output),'--strict'],root)
    report=json.loads((output/'project-build.json').read_text())
    assert report['canonical_header_odr_owners']['Header']=='one.cpp',report
    assert not report['invalid_imports'] and report['source_definitions_blocked']==0,report
    assert report['compiler_passes']==3 and report['relowered_with_external_index']==['two.cpp'],report
    assert report['reused_unaffected_external_index_probes']==['one.cpp'],report
    first=json.loads((output/'one.cpp.manifest.json').read_text())
    second=json.loads((output/'two.cpp.manifest.json').read_text())
    assert sum(bool(row.get('header_record_factory')) for row in first['definitions'])==1
    assert not any(row.get('header_record_factory') for row in second['definitions'])
    assert any(row['name']=='Header' and row['from']=='one.cpp' for row in second['imports']),second
    driver=root/'run.mjs'
    driver.write_text('import {one,make_one} from '+json.dumps((output/'one.cpp.mjs').as_uri())+';\n'
        +'import {two,make_two} from '+json.dumps((output/'two.cpp.mjs').as_uri())+';\n'
        +'if(Object.getPrototypeOf(make_one(5))!==Object.getPrototypeOf(make_two(9)))throw Error("header prototype identity differs across original units");\n'
        +'for(let i=-128;i<128;i++)console.log(`${one(i)},${two(i)}`);\n')
    assert run(['node',str(driver)],root).splitlines()==expected

print('PASS: 512 native values through two-unit header record ODR discovery, canonical imports and retained compiler-pass accounting')
