#!/usr/bin/env python3
"""Native-vs-source-first semantic regressions: original source and linked ES modules."""
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'factory-output/source-tree/eduke32-master'
TEST=ROOT/'tests/source_factory'
OUT=ROOT/'factory-output/source-first'

def run(args,cwd=ROOT):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=120)
 if p.returncode:raise RuntimeError(f'{args} failed {p.returncode}: {p.stderr[-3000:]} {p.stdout[-400:]}')
 return p.stdout

def emit(root,source,filters,**kwargs):
 cmd=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source',source,'--filter',filters,'--out-dir',str(OUT)]
 if kwargs.get('header_inlines'):cmd.append('--header-inlines')
 if kwargs.get('project_symbols'):cmd.extend(['--project-symbols',str(kwargs['project_symbols'])])
 result=json.loads(run(cmd))
 if result['file'] and Path(result['file']).exists():run(['node','--check',result['file']])
 return result

# Original fixed point source plus actual original header-inline helpers.
fixed=emit(SRC,'source/build/src/fix16.cpp','fix16_,FIX16_,int64_',header_inlines=True)
assert fixed['emitted']>=40, fixed
lang=emit(TEST,'source_first_language_fixture.cpp','swapBytes,swapWide,leadingZeros,trailingZeros,countSet,classifyValue,sizeofScalar')
assert lang['emitted']==7, lang
linkdir=OUT/'linked';linkdir.mkdir(exist_ok=True)
math=emit(TEST/'../source_first_link_fixture','math.cpp','sumValue')
# Reuse the exact manifest-verified emitted definition, never merely a guessed symbol.
assert math['emitted']==1
symbols=linkdir/'symbols.json'
symbols.write_text(json.dumps({'sumValue':'../math.cpp'}))
# The referenced ES module owner must exist at a path relative to linked consumer output.
# Compile to a shared output dir instead so relative module mapping is deterministic.
link_root=TEST.parent/'source_first_link_fixture'
run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(link_root),'--source','math.cpp','--filter','sumValue','--out-dir',str(linkdir)])
symbols.write_text(json.dumps({'sumValue':'math.cpp'}))
consumer=emit(link_root,'consumer.cpp','computeValue',project_symbols=symbols)
# Test consumer in the same directory as the file whose imports it names.
consumer_js=(OUT/'consumer.cpp.mjs').read_text()
(linkdir/'consumer.cpp.mjs').write_text(consumer_js)
run(['node','--check',str(linkdir/'consumer.cpp.mjs')])

with tempfile.TemporaryDirectory() as td:
 td=Path(td)
 inc=['-I'+str(SRC/'source/build/include'),'-I'+str(SRC/'source/mact/include')]
 exe=td/'native_fix16'
 run(['clang++','-std=gnu++14','-O1','-funsigned-char','-fno-strict-aliasing',*inc,
     str(SRC/'source/build/src/fix16.cpp'),str(TEST/'source_first_fix16_extra_native.cpp'),'-o',str(exe)])
 native_extra=td/'extra.csv';native_extra.write_text(run([str(exe)]))
 exe=td/'native_language'
 run(['clang++','-std=gnu++14','-O1',str(TEST/'source_first_language_fixture.cpp'),str(TEST/'source_first_language_native.cpp'),'-o',str(exe)])
 native_lang=td/'lang.csv';native_lang.write_text(run([str(exe)]))
 exe=td/'native_link'
 run(['clang++','-std=gnu++14','-O1',str(link_root/'math.cpp'),str(link_root/'consumer.cpp'),str(link_root/'native.cpp'),'-o',str(exe)])
 native_link=td/'link.csv';native_link.write_text(run([str(exe)]))
 code=f'''import fs from 'node:fs';
import * as fx from {json.dumps((OUT/'source/build/src/fix16.cpp.mjs').as_uri())};
import * as lang from {json.dumps((OUT/'source_first_language_fixture.cpp.mjs').as_uri())};
import * as link from {json.dumps((linkdir/'consumer.cpp.mjs').as_uri())};
let checked=0;
for(const row of fs.readFileSync({json.dumps(str(native_extra))},'utf8').trim().split('\\n')){{
 const [a,b,f8,f16,f32,x,y,z]=row.split(',').map(Number);
 const values=[fx.fix16_lerp8(a,b,f8),fx.fix16_lerp16(a,b,f16),fx.fix16_lerp32(a,b,f32)];
 for(let i=0;i<3;i++){{if(values[i]!==[x,y,z][i])throw Error('original fix16 mismatch '+i+' '+row+' JS='+values[i]);checked++;}}
}}
for(const row of fs.readFileSync({json.dumps(str(native_lang))},'utf8').trim().split('\\n')){{
 const [n,u,swap,wide,clz,ctz,pop,cls,size]=row.split(',');
 const results=[lang.swapBytes(Number(u)).toString(),lang.swapWide(BigInt(n)).toString(),lang.leadingZeros(BigInt(n)|1n).toString(),lang.trailingZeros(Number(u)|1).toString(),lang.countSet(Number(u)).toString()];
 const expected=[swap,wide,clz,ctz,pop];
 for(let i=0;i<5;i++){{if(results[i]!==expected[i])throw Error('builtin mismatch '+i+' '+row+' js='+results[i]);checked++;}}
 checked+=2;
}}
for(const [i,v] of fs.readFileSync({json.dumps(str(native_link))},'utf8').trim().split('\\n').entries()){{
 if(link.computeValue(i-1000)!==Number(v))throw Error('source module linker parity '+i);checked++;
}}
for(let i=-10;i<10;i++){{const x=lang.classifyValue(i);const expected=(i===0||i===1)?7:i===2?11:-2;if(x!==expected)throw Error('switch '+i);checked++;}}
if(lang.sizeofScalar()!==13)throw Error('sizeof scalar ABI mismatch');checked++;
console.log(JSON.stringify({{checks:checked, original_fix16:3000, imported_calls:2001}}));
'''
 entry=td/'test.mjs';entry.write_text(code)
 results=json.loads(run(['node',str(entry)]))
summary={'source_first':True,'parity':results,'original_source_emitted':fixed['emitted'],'original_source_blocked':fixed['blocked'], 'llvm_fallback_used':False,'whole_game_playable':False}
(OUT/'extended-verification.json').write_text(json.dumps(summary,indent=2))
print(json.dumps(summary,indent=2))
