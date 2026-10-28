"""Original menu header methods, borrowed pointer aliases and canonical ODR providers."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
TOOLS=Path(os.environ.get('EDUKE_TEST_COMPILER_DIR',ROOT/'tools'))
SOURCE=ROOT/'factory-output/source-tree/eduke32-master'
sys.path.insert(0,str(TOOLS))
from source_first_global_link import ownership

def run(args,cwd=ROOT):
    result=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=180)
    assert result.returncode==0,(args,result.stdout[-2000:],result.stderr[-5000:])
    return result.stdout

with tempfile.TemporaryDirectory(prefix='original-menu-headers-') as directory:
    work=Path(directory)
    includes=[]
    for part in ('source/build/include','source/mact/include','source/audiolib/include',
                 'source/glad/include','source/voidwrap/include','source/imgui/include',
                 'source/mimalloc/include','source/duke3d/src'):
        includes+=['-I',str(SOURCE/part)]
    flags=['-std=gnu++14','-funsigned-char','-DNOASM',*includes]
    first='tests/source_factory/original_menu_header_fixture.cpp'
    second='tests/source_factory/original_menu_header_second.cpp'
    main=work/'main.cpp'
    main.write_text('''#include <cstdio>
extern "C" int oracle_yline(int),oracle_yoffset(int),oracle_margin(int),oracle_indent(int);
int main(){for(int i=1;i<=256;i++)std::printf("%d,%d,%d,%d\\n",oracle_yline(i),oracle_yoffset(i),oracle_margin(i),oracle_indent(i));}
''')
    native=work/'native.exe'
    run(['clang++',*flags,first,str(main),'-o',str(native)])
    expected=run([str(native)]).splitlines()
    assert len(expected)==256
    commands=work/'commands.json'
    commands.write_text(json.dumps([{'file':source,'directory':str(ROOT),
        'arguments':['clang++',*flags,'-c',source,'-o','unused.o']} for source in (first,second)]))
    def emit(source,output,extra=()):
        names=('oracle_yline,oracle_yoffset,oracle_margin,oracle_indent,MenuFont_t,MenuOptionSet_t,MenuEntryFormat_t,vec2,mulscale16'
               if source==first else 'second_yline,MenuFont_t,vec2,mulscale16')
        run([sys.executable,str(TOOLS/'source_ast_to_js.py'),'--root',str(ROOT),'--source',source,
             '--compile-commands',str(commands),'--out-dir',str(output),'--filter',names,
             '--header-inlines','--header-dependency-closure','--dependency-closure',*extra])
        module=output/(source+'.mjs')
        return {'manifest':json.loads(module.with_suffix('.manifest.json').read_text()),'module':module}
    first_unit=emit(first,work/'out')
    rows={r['source_name']:r for r in first_unit['manifest']['definitions']}
    for name in ('oracle_yline','oracle_yoffset','oracle_margin','oracle_indent'):
        assert rows[name]['status']=='source-first',rows[name]
    driver=work/'run.mjs'
    driver.write_text('import {oracle_yline,oracle_yoffset,oracle_margin,oracle_indent} from '+json.dumps(first_unit['module'].as_uri())+';\n'
                     +'for(let i=1;i<=256;i++)console.log(`${oracle_yline(i)},${oracle_yoffset(i)},${oracle_margin(i)},${oracle_indent(i)}`);\n')
    assert run(['node',str(driver)]).splitlines()==expected
    second_unit=emit(second,work/'discovery')
    owners,ambiguous=ownership({first:first_unit,second:second_unit},ROOT)
    assert 'MenuFont_t' not in ambiguous and owners.get('MenuFont_t')==first,(owners,ambiguous)
    symbols=work/'symbols.json'
    symbols.write_text(json.dumps({'MenuFont_t':first}))
    linked=emit(second,work/'out',('--project-symbols',str(symbols)))
    assert all(r['status']=='source-first' for r in linked['manifest']['definitions'])
    assert any(d['name']=='MenuFont_t' and d['from']==first for d in linked['manifest']['imports'])
    assert not any(r.get('header_record_factory') and r['name']=='MenuFont_t' for r in linked['manifest']['definitions'])
    driver.write_text('import {second_yline} from '+json.dumps(linked['module'].as_uri())+';\n'
                     +'for(let i=1;i<=256;i++)console.log(second_yline(i));\n')
    assert run(['node',str(driver)]).splitlines()==[row.split(',')[0] for row in expected]

print('PASS: 1280 original menu-header native comparisons, borrowed pointer alias preservation, and two-unit canonical header prototype provider')
