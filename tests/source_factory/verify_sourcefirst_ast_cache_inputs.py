"""Persistent AST caches invalidate actual headers/layouts, even at old mtimes."""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_ast_cache_paths import make_dependency_paths
assert make_dependency_paths('__sourcefactory_ast_deps__: C\\:/a\\ b.h path\\#name.h \\\n folder/it\'s.h dollar$$file.h\n')==['C:/a b.h','path#name.h',"folder/it's.h",'dollar$file.h']
for invalid in ('wrong: a.h','__sourcefactory_ast_deps__:'):
    try:make_dependency_paths(invalid)
    except ValueError:pass
    else:raise AssertionError('Invalid dependency proof accepted')
def run(args,cwd=ROOT):
    result=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=150)
    assert result.returncode==0,(args,result.stdout[-1200:],result.stderr[-3000:])
    return result.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source cache inputs ') as temporary:
    root=Path(temporary);out=root/'out';cache=root/'cache'
    # Unusual include suffixes are real C/C++ inputs too; extension scans miss
    # them. Quotes and escaped spaces must not be interpreted as shell syntax.
    header=root/"original table's.data"
    header.write_text('struct Layout { int value[1]; };\nenum {HEADER_VALUE=3};\n')
    (root/'original.hpp').write_text('#include "original table\'s.data"\ninline int header_value(){return HEADER_VALUE;}\n')
    source=root/'unit.cpp';source.write_text('#include "original.hpp"\n#ifndef CONFIG\n#define CONFIG 0\n#endif\nint result(){return header_value()+sizeof(Layout)+CONFIG;}\n')
    original_source=source.read_bytes();stamp=header.stat()
    def emit(extra=None):
        args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
              '--out-dir',out,'--ast-cache-dir',cache,'--require-record-layouts','--header-dependency-closure']
        if extra:args.append('--extra='+extra)
        run(args)
        manifest=json.loads((out/'unit.cpp.manifest.json').read_text())
        row=next(r for r in manifest['definitions'] if r['name']=='result')
        assert row['status']=='source-first',row
        driver=root/'run.mjs';driver.write_text('import {result} from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';console.log(result());')
        return int(run(['node',driver])),manifest
    value,first=emit();assert value==7,value
    value,warm=emit();assert value==7 and warm['ast_decode'][0]['cache_hit'],warm['ast_decode']
    assert first['ast_cache_inputs']==warm['ast_cache_inputs']
    header.write_text('struct Layout { int value[5]; };\nenum {HEADER_VALUE=9};\n')
    os.utime(header,ns=(stamp.st_atime_ns,stamp.st_mtime_ns))
    assert source.read_bytes()==original_source
    value,changed=emit();assert value==29,value
    assert not changed['ast_decode'][0]['cache_hit'] and changed['ast_cache_inputs']!=first['ast_cache_inputs']
    (root/'notes.md').write_text('Unrelated notes do not change the Clang dependency graph.')
    value,notes=emit();assert value==29 and notes['ast_decode'][0]['cache_hit']
    assert notes['ast_cache_inputs']==changed['ast_cache_inputs']
    value,flags=emit('-DCONFIG=13');assert value==42,value
    assert not flags['ast_decode'][0]['cache_hit'] and flags['ast_cache_inputs']!=changed['ast_cache_inputs']
print('PASS: current source/include/layout/flag contents bind all AST queries; unchanged inputs reuse; restored mtimes and unusual include paths cannot reuse stale ASTs')
