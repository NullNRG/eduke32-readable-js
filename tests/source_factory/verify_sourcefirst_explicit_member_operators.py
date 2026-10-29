"""Explicit member operator overloads retain exact Clang call selection."""
import asyncio
import base64
import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from source_explicit_member_operators import rebind_explicit_operators
from source_ast_to_js import normalized_record_name, target_type_layout

assert normalized_record_name('Box<const int *, 3>',{'Box<const int *, 3>':'ProvenBox'})=='ProvenBox'
assert normalized_record_name('Box<const int *, 3> *',{'Box<const int *, 3>':'ProvenBox'}) is None
assert normalized_record_name('struct Link',{'Link':'struct Link'})=='Link'
assert normalized_record_name('const Link',{'Link':'struct Link'})=='Link'
assert target_type_layout('Box<int *>',{}) is None
assert target_type_layout('Box<int *> *',{})==(8,8)


def run(args, cwd):
    result = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=100)
    assert result.returncode == 0, (args, result.stdout[-2000:], result.stderr[-3000:])
    return result.stdout.strip()


async def browser(module, expected):
    executable = os.environ.get('EDUKE_CHROMIUM_EXECUTABLE')
    if not executable:
        return False
    from playwright.async_api import async_playwright
    async with async_playwright() as playwright:
        instance = await playwright.chromium.launch(executable_path=executable, headless=True)
        try:
            page = await instance.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            await page.set_content('<title>Clang explicit source operators</title>')
            observed = await page.evaluate('''async encoded=>{
              const url=URL.createObjectURL(new Blob([Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))],{type:'text/javascript'}));
              try {const m=await import(url);return Array.from({length:1024},(_,i)=>[m.api_explicit(i-512),m.api_template(i-512)].join(','));}
              finally {URL.revokeObjectURL(url);}
            }''', base64.b64encode(module.read_bytes()).decode())
            assert observed == expected
            assert not errors, errors
            return True
        finally:
            await instance.close()


# Synthetic ambiguity/macro-range checks exercise the identity proof itself.
member = {'kind': 'MemberExpr', 'name': 'operator[]', 'referencedMemberDecl': 'filtered',
          'range': {'begin': {'offset': 22, 'tokLen': 1}, 'end': {'offset': 35, 'tokLen': 1}}}
owner = {'kind': 'FunctionDecl', 'name': 'probe', 'mangledName': '_Z5probei',
         'type': {'qualType': 'int (int)'}, 'loc': {'offset': 4},
         'inner': [{'kind': 'CompoundStmt', 'inner': [member]}]}
method = {'kind': 'CXXMethodDecl', 'name': 'operator[]', 'id': 'selected',
          'type': {'qualType': 'int &(int)'}}
complete = copy.deepcopy(owner)
complete['inner'][0]['inner'][0]['referencedMemberDecl'] = 'selected'
assert rebind_explicit_operators([copy.deepcopy(owner)], [complete, method]) == 1
assert rebind_explicit_operators([copy.deepcopy(owner)], [complete, complete, method]) == 0
changed = copy.deepcopy(owner)
changed['mangledName'] = '_Z5probed'
assert rebind_explicit_operators([changed], [complete, method]) == 0
macro = copy.deepcopy(owner)
macro['inner'][0]['inner'][0]['range']['begin'] = {'expansionLoc': {'offset': 22, 'tokLen': 1}}
assert rebind_explicit_operators([macro], [complete, method]) == 0

with tempfile.TemporaryDirectory(prefix='eduke-explicit-members-') as temporary:
    root = Path(temporary)
    (root / 'ops.hpp').write_text('''#pragma once
struct Values {
 int first; int second;
 explicit Values(int n):first(n),second(n+3){}
 int &operator[](int i){return i ? second:first;}
 const int &operator[](int i) const{return i ? first:second;}
 int operator()(int n){first+=n;return first+second;}
 int operator()(int n,int m) const{return first*n+second*m;}
};
enum Mode { SelectedMode=3 };
template<class T,Mode M> struct Tagged {
 int first,second,third;
 Tagged(int n):first(n),second(n+1),third(n+2){}
 int &operator[](int i){return i?second:first;}
};
''')
    (root / 'unit.cpp').write_text('''#include "ops.hpp"
extern "C" int api_explicit(int n){
 Values v(n); Values *p=&v; const Values &c=v;
 v.operator[](0)+=5; p->operator[](1)+=7;
 int result=c.operator[](0)*3+c.operator[](1)*5;
 return result+v.operator()(11)+c.operator()(2,3);
}
extern "C" int api_template(int n){
 Tagged<const int *,SelectedMode> t(n);
 t.operator[](1)+=9;
 return t.operator[](0)+t.third+3*t.second+9*sizeof(t);
}
''')
    (root / 'main.cpp').write_text('''#include <cstdio>
extern "C" int api_explicit(int),api_template(int);
int main(){for(int n=-512;n<512;n++)printf("%d,%d\\n",api_explicit(n),api_template(n));}
''')
    executable = root / ('native.exe' if os.name == 'nt' else 'native')
    run(['clang++', '-std=c++14', 'unit.cpp', 'main.cpp', '-o', str(executable)], root)
    expected = run([str(executable)], root).splitlines()
    run([sys.executable, str(ROOT / 'tools/source_ast_to_js.py'), '--root', str(root),
         '--source', 'unit.cpp', '--filter', 'api_explicit,api_template', '--dependency-closure',
         '--out-dir', str(root / 'out')], ROOT)
    manifest = json.loads((root / 'out/unit.cpp.manifest.json').read_text())
    row = next(row for row in manifest['definitions'] if row['name'] == 'api_explicit')
    assert row['status'] == 'source-first', row
    row = next(row for row in manifest['definitions'] if row['name'] == 'api_template')
    assert row['status'] == 'source-first', row
    assert manifest['full_type_closure']['explicit_member_calls_rebound'] == 8
    module = root / 'out/unit.cpp.mjs'
    runner = root / 'run.mjs'
    runner.write_text('import * as m from ' + json.dumps(module.as_uri()) + ';\n'
                     'for(let i=-512;i<512;i++)console.log([m.api_explicit(i),m.api_template(i)].join(","));\n')
    assert run(['node', str(runner)], root).splitlines() == expected
    chromium = asyncio.run(browser(module, expected))
    print('PASS 2048 native/Node' + ('/Chromium' if chromium else '')
          + ' values: explicit operators, const overloads, pointer/enum template identity and layout, reference mutation; ambiguous callsites rejected')
