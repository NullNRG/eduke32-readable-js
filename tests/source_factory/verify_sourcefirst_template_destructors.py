"""Clang-demanded source template destruction preserves cross-module lifetime."""
import json
import asyncio
import base64
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]


def run(args,cwd):
    result=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=100)
    assert result.returncode==0,(args,result.stdout[-2500:],result.stderr[-3500:])
    return result.stdout.strip()


async def browser(out,expected):
    executable=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE')
    if not executable:return False
    from playwright.async_api import async_playwright
    async with async_playwright() as playwright:
        instance=await playwright.chromium.launch(executable_path=executable,headless=True)
        try:
            page=await instance.new_page();errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            await page.set_content('<title>Original template lifetime ABI</title>')
            data={name:base64.b64encode((out/(name+'.cpp.mjs')).read_bytes()).decode() for name in ('make','drop')}
            actual=await page.evaluate('''async ({make,drop})=>{
              const url=encoded=>URL.createObjectURL(new Blob([Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))],{type:'text/javascript'}));
              const a=url(make),b=url(drop);
              try {const m=await import(a),d=await import(b),rows=[];
                for(let n=-512;n<512;n++){const p=new Int32Array([n]);const obj=m.make_owner(p);
                  const before=m.read_owner(obj);m.change_owner(obj,before+9);d.drop_owner(obj);
                  const g=m.make_global(p);d.drop_global(g);rows.push(`${before},${p[0]},${m.read_destroyed()}`);}
                return rows;
              }finally{URL.revokeObjectURL(a);URL.revokeObjectURL(b);}
            }''',data)
            assert actual==expected
            assert not errors,errors
            return True
        finally:await instance.close()


with tempfile.TemporaryDirectory(prefix='source-template-dtor-') as temporary:
    root=Path(temporary)
    (root/'owner.hpp').write_text('''#pragma once
enum Flag {ChosenFlag=3};
template<class T,Flag F> struct Owner {
 T *slot=nullptr;
 Owner(T *p){slot=p;*slot+=F;}
 ~Owner() {*slot+=F*7;}
 T get() const{return *slot;}
 void set(T n){*slot=n;}
};
extern int destroyed;
template<class T> struct GlobalOwner {T *slot;GlobalOwner(T *p):slot(p){}
 ~GlobalOwner()noexcept{*slot+=4;destroyed++;}};
''')
    (root/'make.cpp').write_text('''#include "owner.hpp"
Owner<int,ChosenFlag> *make_owner(int *p){return new Owner<int,ChosenFlag>(p);}
int read_owner(Owner<int,ChosenFlag> *p){return p->get();}
void change_owner(Owner<int,ChosenFlag> *p,int n){p->set(n);}
int destroyed=0;
GlobalOwner<int>*make_global(int*p){return new GlobalOwner<int>(p);}
int read_destroyed(){return destroyed;}
''')
    (root/'drop.cpp').write_text('''#include "owner.hpp"
void drop_owner(Owner<int,ChosenFlag> *p){delete p;}
void drop_global(GlobalOwner<int>*p){delete p;}
''')
    (root/'driver.cpp').write_text('''#include <cstdio>
#include "owner.hpp"
Owner<int,ChosenFlag> *make_owner(int*);void drop_owner(Owner<int,ChosenFlag>*);
int read_owner(Owner<int,ChosenFlag>*);void change_owner(Owner<int,ChosenFlag>*,int);
GlobalOwner<int>*make_global(int*);void drop_global(GlobalOwner<int>*);int read_destroyed();
int main(){for(int n=-512;n<512;n++){int value=n;
 auto*p=make_owner(&value);int before=read_owner(p);change_owner(p,before+9);drop_owner(p);
 auto*g=make_global(&value);drop_global(g);printf("%d,%d,%d\\n",before,value,read_destroyed());}}
''')
    executable=root/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14','make.cpp','drop.cpp','driver.cpp','-o',str(executable)],root)
    expected=run([str(executable)],root).splitlines()
    def emit(name,out,filtered=False):
        command=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),
                 '--source',name,'--out-dir',str(out),'--dependency-closure']
        if filtered:command+=['--filter','make_owner']
        run(command,ROOT)
        return json.loads((out/(name+'.manifest.json')).read_text())
    out=root/'out'
    made=emit('make.cpp',out)
    row=next(row for row in made['definitions'] if row['name']=='make_owner')
    assert row['status']=='source-first',(row,made['template_destructor_closure'])
    assert len(made['template_destructor_closure']['proven'])==2,made['template_destructor_closure']
    row=next(row for row in made['definitions'] if row['name']=='make_global')
    assert row['status']=='source-first',row
    dropped=emit('drop.cpp',out)
    row=next(row for row in dropped['definitions'] if row['name']=='drop_owner')
    assert row['status']=='source-first',row
    runner=root/'run.mjs'
    runner.write_text('import {make_owner,read_owner,change_owner,make_global,read_destroyed} from '+json.dumps((out/'make.cpp.mjs').as_uri())+';\n'
        +'import {drop_owner,drop_global} from '+json.dumps((out/'drop.cpp.mjs').as_uri())+';\n'
        +'for(let n=-512;n<512;n++){const p=new Int32Array([n]);const obj=make_owner(p);const before=read_owner(obj);change_owner(obj,before+9);drop_owner(obj);const g=make_global(p);drop_global(g);console.log(`${before},${p[0]},${read_destroyed()}`);}\n')
    assert run(['node',str(runner)],root).splitlines()==expected
    chromium=asyncio.run(browser(out,expected))
    filtered=root/'filtered'
    made=emit('make.cpp',filtered,True)
    row=next(row for row in made['definitions'] if row['name']=='make_owner')
    assert row['status']=='source-first',(row,made['template_destructor_closure'])
    # Changing TU macro context must not silently alter an authored destructor.
    (root/'context.hpp').write_text('''#pragma once
template<class T> struct Context {T *slot;Context(T *p):slot(p){}
 ~Context()noexcept{*slot+=__BASE_FILE__[0];}};
''')
    (root/'context.cpp').write_text('#include "context.hpp"\nContext<int> *bad_context(int *p){return new Context<int>(p);}\n')
    context=emit('context.cpp',root/'context')
    row=next(row for row in context['definitions'] if row['name']=='bad_context')
    assert row['status']=='blocked',row
    assert any('macro context' in reason for reason in context['template_destructor_closure']['rejected'].values()),context['template_destructor_closure']
print('PASS 3072 native/Node'+('/Chromium' if chromium else '')+' values: demanded template destructors, original global mutation, filtered recovery, cross-module delete; macro-context changes rejected')
