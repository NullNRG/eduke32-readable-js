#!/usr/bin/env python3
"""Native C++ parity for POD text literals and shared static-array addresses."""
from pathlib import Path
import json,subprocess,tempfile,sys
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=80)
 assert p.returncode==0,(args,p.stdout[-800:],p.stderr[-1400:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke-pod-text-') as temp:
 d=Path(temp)
 (d/'source.cpp').write_text(r'''#include <stdint.h>
typedef struct {const char *text; int32_t tokenid;} Token;
enum Tokens { A=8, B=21, C=34 };
static const Token words[4]={{"HELLO",A},{"WORLD",B},{"",C},{"HI\nBYE",A}};
extern "C" int token_at(int i) {return words[i%4].tokenid;}
static char nonliteral[]="DYNAMIC";
static const Token forbidden[1]={{nonliteral,99}};
static const Token unowned[1]={{(const char *)123,99}};
extern "C" int table_alias(int i) {
    int index=i%7, adjacent=(index+1)%7;
    nonliteral[index]=(char)('A'+i%26);
    char *address=const_cast<char *>(forbidden[0].text);
    address[adjacent]=(char)('a'+i%26);
    return (unsigned char)forbidden[0].text[index]
        +3*(unsigned char)nonliteral[adjacent]
        +5*(unsigned char)forbidden[0].text[(index+2)%7];
}
extern "C" int table_identity() {
    return (forbidden[0].text==nonliteral)
        +2*(forbidden[0].text+7==&nonliteral[7])
        +4*(forbidden[0].text[7]=='\0');
}
''')
 (d/'driver.cpp').write_text(r'''#include <cstdio>
#include <stdint.h>
extern "C" int token_at(int),table_alias(int),table_identity();
int main(){for(int i=0;i<256;i++){printf("%d,%d,%d\n",token_at(i),table_alias(i),table_identity());}}
''')
 run(['clang++','-std=c++17','source.cpp','driver.cpp','-o','native'],d)
 expected=run([str(d/'native')],d).splitlines()
 out=d/'out'
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(d),'--source','source.cpp','--out-dir',str(out)],d)
 code=out/'source.cpp.mjs'; r=json.loads(code.with_suffix('.manifest.json').read_text())
 rows={x['source_name']:x for x in r['definitions']}
 assert rows['words']['status']=='source-first',rows['words']
 assert rows['forbidden']['status']=='source-first',rows['forbidden']
 assert rows['unowned']['status']=='blocked',rows['unowned']
 assert rows['token_at']['status']=='source-first',rows['token_at']
 for name in ('table_alias','table_identity'):
  assert rows[name]['status']=='source-first',rows[name]
 run(['node','--check',str(code)],d)
 (d/'check.mjs').write_text('''import {words,token_at,table_alias,table_identity} from './out/source.cpp.mjs';
const nativeText=['HELLO','WORLD','','HI\\nBYE'];
for(let i=0;i<4;i++){
 if(!(words[i].text instanceof Uint8Array))throw new Error('C char pointer is not byte storage');
 if(new TextDecoder().decode(words[i].text)!==nativeText[i]+'\\0')throw new Error('incorrect NUL bytes');
}
if(words[0].text===words[1].text)throw new Error('different C literals have aliased JS storage');
for(let i=0;i<256;i++)console.log(`${token_at(i)},${table_alias(i)},${table_identity()}`);
''')
 actual=run(['node','check.mjs'],d).splitlines()
 assert actual==expected,next(((i,e,a) for i,(e,a) in enumerate(zip(expected,actual)) if e!=a),None)
 print('PASS 768 native C++/JS values: POD literal storage, shared char-array alias mutation/equality/indexing, and forged-address rejection')
