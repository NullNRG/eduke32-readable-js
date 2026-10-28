"""C octal/hex escapes in original XMP source must be native bytes, not invalid JS escapes."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import re
import shutil
import subprocess
import sys
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'factory-output/source-tree/eduke32-master/source/audiolib/src/xmp.cpp'
text=SOURCE.read_text()
match=re.search(r'static int mtm_test_memory\([^\n]+\)\s*\{.*?\n\}',text,re.S)
assert match, 'original source test missing'
with TemporaryDirectory(prefix='eduke_xmp_string_') as temp:
    temp=Path(temp)
    cxx=temp/'reference.cpp'
    native='''#include <cstdint>\n#include <cstring>\n#include <cstdio>\n#define Bmemcmp std::memcmp\n'''+match.group(0)+'''
int main(){ for (int i=0;i<256;i++){char input[5]={'M','T','M',char(i),0};for(int len=3;len<=5;len++) std::printf("%d\\n",mtm_test_memory(input,len));} }\n'''
    cxx.write_text(native)
    subprocess.run(['g++','-std=c++14','-O0',str(cxx),'-o',str(temp/'native')],check=True,capture_output=True,text=True)
    expected=subprocess.run([str(temp/'native')],check=True,capture_output=True,text=True).stdout.strip().splitlines()
    out=temp/'js'
    proc=subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT/'factory-output/source-tree/eduke32-master'),'--source','source/audiolib/src/xmp.cpp','--out-dir',str(out),'--header-dependency-closure'],capture_output=True,text=True,timeout=160)
    assert proc.returncode==0, proc.stderr[-1000:]
    generated=out/'source/audiolib/src/xmp.cpp.mjs'
    subprocess.run(['node','--check',str(generated)],check=True,capture_output=True,text=True)
    js=generated.read_text()
    assert 'new Uint8Array(5)' in js and 'bytes.set([77, 84, 77, 16])' in js
    assert '\\020' not in js
    cmd='''import {mtm_test_memory} from %s;
for(let i=0;i<256;i++) {const buf=Uint8Array.from([77,84,77,i,0]); for(let len=3;len<=5;len++) console.log(mtm_test_memory(buf,len));}
'''%json.dumps(generated.as_uri())
    outjs=subprocess.run(['node','--input-type=module','-e',cmd],capture_output=True,text=True,check=True)
    actual=outjs.stdout.strip().splitlines()
    assert actual==expected, f'C++/JS byte escape mismatch: {list(zip(expected,actual))[:8]}'
    print('PASS native C++ vs JS original XMP MTM octal escape:',len(expected),'comparisons')
