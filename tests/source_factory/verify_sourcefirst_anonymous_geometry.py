"""Anonymous native geometry retains its owner across repeated header includes."""
import copy
import json
import subprocess
import sys
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import parse_json_stream,parse_clang_record_layouts
from source_byte_records import recover_byte_records
from source_ast_to_js import recover_type_aliases

def run(args,cwd=ROOT):
    result=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert result.returncode==0,(args,result.stdout[-1800:],result.stderr[-3000:])
    return result.stdout

with tempfile.TemporaryDirectory(prefix='source-owned-anonymous-') as directory:
    root=Path(directory)
    (root/'types.hpp').write_text('''typedef struct {
 union { struct { int x,y; }; Vec xy; };
 short marker;
} NAME(Wall);
''')
    (root/'unit.cpp').write_text('''struct Vec {int x,y; int sum()const{return x+y;}};
#define NAME(x) x
#include "types.hpp"
#undef NAME
#define NAME(x) U##x
#include "types.hpp"
extern "C" unsigned exercise(int n){
 Wall a={}; UWall b={};
 a.x=n*31; a.y=17-n; a.marker=(short)(n*47);
 b.xy.x=n*13; b.xy.y=-n*19; b.marker=(short)(n*23);
 Wall *p=&a; UWall *q=&b; p->xy.y+=q->x; q->y-=p->x;
 unsigned h=(unsigned)(p->x+q->x+p->y+q->y);
 const unsigned char *x=(const unsigned char*)&a,*y=(const unsigned char*)&b;
 for(unsigned i=0;i<sizeof(a);i++)h=h*33+x[i];
 for(unsigned i=0;i<sizeof(b);i++)h=h*33+y[i];
 return h;
}
''')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" unsigned exercise(int);int main(){for(int n=-256;n<256;n++)printf("%u\\n",exercise(n));}\n')
    run(['clang++',root/'unit.cpp',root/'main.cpp','-o',root/'native'])
    expected=run([root/'native']).splitlines()
    for name,flags in [('full',[]),('filtered',['--filter','exercise','--exact-filter','--dependency-closure'])]:
        out=root/name
        run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--require-record-layouts','--header-dependency-closure',*flags])
        module=out/'unit.cpp.mjs'
        doc=json.loads(module.with_suffix('.manifest.json').read_text())
        row=next(row for row in doc['definitions'] if row['name']=='exercise')
        assert row['status']=='source-first',row
        runner=root/'run.mjs';runner.write_text('import {exercise} from '+json.dumps(module.as_uri())+';for(let n=-256;n<256;n++)console.log(exercise(n));')
        assert run(['node',runner]).splitlines()==expected
    # A scoped spelling wins over a physically identical sibling. Changing
    # that owner's native field types may not borrow the sibling's valid ABI.
    ast=parse_json_stream(run(['clang++','-Xclang','-ast-dump=json','-fsyntax-only','unit.cpp'],root))
    layouts=parse_clang_record_layouts(run(['clang++','-Xclang','-fdump-record-layouts','-S','-emit-llvm','-femit-all-decls','-o',str(root/'unused.ll'),'unit.cpp'],root))
    aliases=recover_type_aliases(ast)
    views=recover_byte_records(ast,layouts,aliases,root,storage_views=True)
    assert '__cxx_anonymous_0' in views['Wall']['byte_schema']['fields']
    damaged=copy.deepcopy(layouts)
    for spelling,layout in damaged.items():
        if spelling.startswith(('Wall::','struct Wall::','union Wall::','class Wall::')) and len(layout.get('fields',[]))==2 and layout['fields'][0]['declaration'].endswith(' x'):
            layout['fields'][0]['declaration']='double x'
    damaged_views=recover_byte_records(ast,damaged,aliases,root,storage_views=True)
    wall=damaged_views.get('Wall',{}).get('byte_schema',{})
    anon=wall.get('fields',{}).get('__cxx_anonymous_0',{}).get('byteRecord',{})
    assert '__cxx_anonymous_0' not in anon.get('fields',{}),anon
print('PASS: 1024 native/full/filtered anonymous coordinate cases, two typedef owners from one header, pointer aliases, full object bytes, and rejection of changed owner layouts')
