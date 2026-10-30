"""Exact anonymous typedef layouts do not imply support for object lifetimes."""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd=ROOT):
    result=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=120)
    assert result.returncode==0,(args,result.stdout[-1000:],result.stderr[-3000:])
    return result.stdout.strip()
with tempfile.TemporaryDirectory(prefix='anonymous-nontrivial-layout-') as temporary:
    root=Path(temporary)
    (root/'original.hpp').write_text('''#pragma once
struct Resource {long long state[2];Resource();~Resource();};
typedef struct {Resource resource;void*next;int counts[3];} OriginalState;
namespace left {typedef struct {long long data[3];} same_name;}
namespace right {typedef struct {int data[7];} same_name;}
''')
    (root/'unit.cpp').write_text('''#include "original.hpp"
unsigned long long original_size(int n){return (unsigned long long)(sizeof(OriginalState)*1000+alignof(OriginalState)*100+sizeof(left::same_name)*10+sizeof(right::same_name)+n);}
OriginalState cannot_construct(){OriginalState state;return state;}
''')
    (root/'main.cpp').write_text('''#include "original.hpp"
#include <cstdio>
int main(){for(int n=0;n<256;n++)printf("%llu\\n",(unsigned long long)(sizeof(OriginalState)*1000+alignof(OriginalState)*100+sizeof(left::same_name)*10+sizeof(right::same_name)+n));}
''')
    native=root/('native.exe' if os.name=='nt' else 'native');run(['clang++','-std=c++14','main.cpp','-o',native],root)
    expected=run([native],root).splitlines();out=root/'out'
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
         '--out-dir',out,'--require-record-layouts'])
    manifest=json.loads((out/'unit.cpp.manifest.json').read_text());rows={r['name']:r for r in manifest['definitions']}
    assert rows['original_size']['status']=='source-first',rows['original_size']
    assert rows['cannot_construct']['status']=='blocked',rows['cannot_construct']
    driver=root/'run.mjs';driver.write_text('import {original_size} from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';for(let n=0;n<256;n++)console.log(String(original_size(n)));')
    assert run(['node',driver],root).splitlines()==expected
print('PASS 256 native/JS sizes: Clang-owned anonymous typedefs, nontrivial fields, qualified names; unsupported construction stays blocked')
