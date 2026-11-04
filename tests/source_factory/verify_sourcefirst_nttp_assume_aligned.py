#!/usr/bin/env python3
"""Clang-selected non-type template substitutions and alignment hints retain native semantics.

These are source-neutral compiler features. No EDuke32 function names are special-cased.
"""
from pathlib import Path
import subprocess,sys,tempfile
import os
sys.path.insert(0,os.environ.get("EDUKE_TEST_COMPILER_DIR") or str(Path(__file__).resolve().parents[2]/"tools"))
from source_ast_to_js import parse_json_stream,produce,Emit,Unsupported
from source_runtime_helpers import embedded

def run(cmd,cwd):
    proc=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True,timeout=50)
    assert proc.returncode==0,(cmd,proc.stderr[-2500:],proc.stdout[-1000:])
    return proc.stdout

with tempfile.TemporaryDirectory() as temp:
    p=Path(temp)
    (p/'templates.hpp').write_text('''#pragma once
template <int N> inline int templ_sum(int x) { return x + N; }
template <int K> inline unsigned templ_mask(unsigned x) { return x & ((1u << K)-1u); }
''')
    (p/'case.cpp').write_text('''#include <stdint.h>
#include "templates.hpp"
int sum_case(int x) {return templ_sum<3>(x) + templ_sum<7>(x);}
unsigned mask_case(unsigned x) {return templ_mask<4>(x) + templ_mask<6>(x);}
int align_case(int x) {int v[8] = {1,3,5,7,9,11,13,17};
    int *p = (int*)__builtin_assume_aligned(v, 1<<2);
    return p[(unsigned)x & 7u];}
int align_size(int x) { int v[4]={2,4,8,16}; int *p=(int*)__builtin_assume_aligned(v,sizeof(int));return p[(unsigned)x&3u]; }
''')
    (p/'driver.cpp').write_text('''#include <cstdio>
int sum_case(int);unsigned mask_case(unsigned);int align_case(int);int align_size(int);
int main(){for (int i=0;i<256;i++) {
 int x=i*97-900;printf("%d %u %d %d\\n",sum_case(x),mask_case((unsigned)x),align_case(x),align_size(x));}}
''')
    run(['clang++','-std=c++17','case.cpp','driver.cpp','-o','native'],p)
    native=run([str(p/'native')],p)
    ast=parse_json_stream(run(['clang++','-std=c++17','-Xclang','-ast-dump=json','-fsyntax-only','case.cpp'],p))
    code,rows=produce(ast,p/'case.cpp','case.cpp',source_root=p,header_dependency_closure=True)
    assert all(r['status']=='source-first' for r in rows),rows
    helper_root=Path(__file__).resolve().parents[2]/'tools'
    (p/'case.mjs').write_text(embedded(helper_root/'source_address_runtime.mjs')+'\n'+embedded(helper_root/'source_pointer_runtime.mjs')+'\nconst i32=x=>Number(x)|0;const u32=x=>Number(x)>>>0;\n'+'\n'.join(code)+'''
for (let i=0;i<256;i++){let x=i*97-900;console.log(`${sum_case(x)} ${mask_case(x>>>0)} ${align_case(x)} ${align_size(x)}`)}
''')
    run(['node','--check','case.mjs'],p)
    js=run(['node','case.mjs'],p)
    assert js==native,(js[:300],native[:300])
    # Fail closed if Clang has not selected the instantiated argument.
    invalid_nttp={'kind':'SubstNonTypeTemplateParmExpr','type':{'qualType':'int'},
                  'inner':[{'kind':'NonTypeTemplateParmDecl','name':'N'}]}
    try:Emit().expr(invalid_nttp)
    except Unsupported:pass
    else:raise AssertionError('unresolved template parameter must remain blocked')
    def assumed(alignment):
        return {'kind':'CallExpr','type':{'qualType':'int *'},'inner':[
            {'kind':'DeclRefExpr','referencedDecl':{'kind':'FunctionDecl','name':'__builtin_assume_aligned'}},
            {'kind':'DeclRefExpr','type':{'qualType':'int *'},'referencedDecl':{'kind':'ParmVarDecl','name':'ptr'}},
            {'kind':'IntegerLiteral','type':{'qualType':'int'},'value':str(alignment)}]}
    for invalid_align in (0,3,-8):
        try:Emit().expr(assumed(invalid_align))
        except Unsupported:pass
        else:raise AssertionError('unproven alignment must not be silently lowered')
    print('PASS: 1,024 native C++/JS non-type-template and assumed-alignment results; invalid AST/alignment rejected')
