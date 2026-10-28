"""Unchanged original Text methods/destructor versus an instrumented allocator observer.

The observer records release calls and pointer bytes, not allocator correctness.
It exists only in this temporary unit test and is never a game provider.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
TOOLS=Path(os.environ.get('EDUKE_TEST_COMPILER_DIR',ROOT/'tools'))
SOURCE=ROOT/'factory-output/source-tree/eduke32-master'

def run(args,cwd):
    result=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=180)
    assert result.returncode==0,(args,result.stdout[-2000:],result.stderr[-5000:])
    return result.stdout

original=(SOURCE/'source/build/src/loguru.cpp').read_text()
destructors=re.findall(r'Text::~Text\(\)\s*\{[^{}]+\}',original)
assert len(destructors)==1 and 'LOGURU_FREE(_str)' in destructors[0]
header=SOURCE/'source/build/include/loguru.hpp'
with tempfile.TemporaryDirectory(prefix='original-loguru-lifetime-') as directory:
    root=Path(directory)
    (root/'unit.cpp').write_text('#include <stddef.h>\n#include '+json.dumps(header.as_posix())+'\n'+r'''
unsigned releases;
unsigned released_bytes;
void _xfree(void *pointer){
 if(pointer!=nullptr){releases++;released_bytes+=(unsigned)((unsigned char*)pointer)[0];}
}
namespace loguru {
'''+destructors[0]+r'''
Text make_owned(char *value){return Text(value);}
}
int text_case(int x){
 releases=0;released_bytes=0;
 char data[2]={(char)(x%127+1),0};
 loguru::Text original(data);
 loguru::Text moved(static_cast<loguru::Text&&>(original));
 int total=original.empty()*1000+(unsigned char)moved.c_str()[0];
 {loguru::Text returned(loguru::make_owned(moved.release()));total+=returned.empty()*100;}
 total+=moved.empty()*10000;
 return total;
}
int released_case(int x){
 releases=0;released_bytes=0;
 char data[2]={(char)(x%127+1),0};
 loguru::Text original(data);
 char *released=original.release();
 int total=original.empty()*1000+(unsigned char)released[0];
 _xfree(released);
 return total;
}
''')
    (root/'main.cpp').write_text(r'''#include <cstdio>
extern unsigned releases,released_bytes;int text_case(int),released_case(int);
int main(){for(int i=0;i<256;i++){int a=text_case(i);unsigned b=releases,c=released_bytes;int d=released_case(i);printf("%d,%u,%u,%d,%u,%u\n",a,b,c,d,releases,released_bytes);}}
''')
    native=root/'native.exe'
    run(['clang++','-std=c++14','-funsigned-char','-fno-elide-constructors','unit.cpp','main.cpp','-o',str(native)],root)
    expected=run([str(native)],root).splitlines()
    run([sys.executable,str(TOOLS/'source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(root/'out')],root)
    module=root/'out/unit.cpp.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={row['source_name']:row for row in manifest['definitions']}
    for name in ('Text','make_owned','text_case','released_case'):
        assert rows[name]['status']=='source-first',(name,rows[name])
    driver=root/'run.mjs'
    driver.write_text('import * as m from '+json.dumps(module.as_uri())+';\n'
        +'for(let i=0;i<256;i++){let a=m.text_case(i),b=m.releases,c=m.released_bytes,d=m.released_case(i);console.log(`${a},${b},${c},${d},${m.releases},${m.released_bytes}`);}\n')
    observed=run(['node',str(driver)],root).splitlines()
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b),('length',len(expected),len(observed)))

print('PASS: 1536 native values from unchanged original loguru::Text constructor/move/empty/c_str/release/destructor, with allocator release observer; original allocator remains separately unverified')
