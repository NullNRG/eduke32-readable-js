"""Native C++14 parity for source constructors, move ownership and destructor order."""
import json
import hashlib
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
TOOLS=Path(os.environ.get('EDUKE_TEST_COMPILER_DIR',ROOT/'tools'))

def run(args,cwd):
    result=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=180)
    assert result.returncode==0,(args,result.stdout[-1500:],result.stderr[-5000:])
    return result.stdout

with tempfile.TemporaryDirectory(prefix='source-cpp-lifetime-') as directory:
    root=Path(directory)
    (root/'unit.cpp').write_text(r'''
unsigned events;
void record_event(int event){events=events*33u+(unsigned)event;}
namespace owned {
class Ticket {
public:
  int value;
  explicit Ticket(int x):value(x){record_event(100+x);}
  Ticket(Ticket &&other){value=other.value;other.value=-1;record_event(150+value);}
  Ticket(const Ticket &)=delete;
  ~Ticket();
  int get() const{return value;}
};
Ticket::~Ticket(){record_event(200+value);}
Ticket make_ticket(int x){return Ticket(x);}
}
void reset_events(){events=0;}
void explicit_destroy(owned::Ticket *value){value->~Ticket();}
int lifetime_case(int x){
 events=0;
 owned::Ticket a(x);
 if(x&1){owned::Ticket b(owned::make_ticket(x+1));return a.get()+b.get();}
 owned::Ticket c(x+2);
 for(int i=0;i<4;i++){
   owned::Ticket d(i);
   if(i==1)continue;
   if(i==2)break;
   record_event(d.get());
 }
 return a.get()+c.get();
}
int temporary_case(int x){
 events=0;
 int result=owned::make_ticket(x).get();
 owned::make_ticket(x+1);
 return result;
}
struct Nested {owned::Ticket member;Nested(int x):member(x){}~Nested(){}};
int rejected_nested(int x){Nested value(x);return x;}
int rejected_static(int x){static owned::Ticket value(x);return value.get();}
int rejected_goto(int x){owned::Ticket value(x);if(x)goto done;done:return x;}
int rejected_by_value(owned::Ticket value){return value.get();}
int rejected_reference(int x){const owned::Ticket &value=owned::make_ticket(x);return value.get();}
unsigned for_scope_case(int x){events=0;for(owned::Ticket value(x);value.value<x+2;value.value++){record_event(value.get());if(value.get()&1)break;}return events;}
struct Implicit {int value;~Implicit(){}};
int rejected_implicit(int x){Implicit value{};return value.value;}
''')
    (root/'main.cpp').write_text(r'''#include <cstdio>
#include <new>
#include "unit.cpp"
extern unsigned events;int lifetime_case(int),temporary_case(int);unsigned for_scope_case(int);
int main(){for(int x=0;x<128;x++){int a=lifetime_case(x);unsigned b=events;int c=temporary_case(x);unsigned d=events;unsigned e=for_scope_case(x);reset_events();alignas(owned::Ticket) unsigned char storage[sizeof(owned::Ticket)];auto *value=new(storage) owned::Ticket(x);explicit_destroy(value);printf("%d,%u,%d,%u,%u,%u\n",a,b,c,d,e,events);}}
''')
    native=root/'native.exe'
    run(['clang++','-std=c++14','-fno-elide-constructors','main.cpp','-o',str(native)],root)
    expected=run([str(native)],root).splitlines()
    run([sys.executable,str(TOOLS/'source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(root/'out')],root)
    module=root/'out/unit.cpp.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={row['source_name']:row for row in manifest['definitions']}
    for name in ('Ticket','make_ticket','lifetime_case','temporary_case','for_scope_case','explicit_destroy'):
        assert rows[name]['status']=='source-first',(name,rows[name])
    for name in ('rejected_nested','rejected_static','rejected_goto','rejected_by_value',
                 'rejected_reference','rejected_implicit'):
        assert rows[name]['status']=='blocked',(name,rows[name])
    driver=root/'run.mjs'
    constructor='__cxx_construct_'+hashlib.sha256(b'void (int)').hexdigest()[:16]
    driver.write_text('import * as m from '+json.dumps(module.as_uri())+';\n'
        +'for(let x=0;x<128;x++){let a=m.lifetime_case(x),b=m.events,c=m.temporary_case(x),d=m.events,e=m.for_scope_case(x);m.reset_events();m.explicit_destroy(m.Ticket.'+constructor+'(x));console.log(`${a},${b},${c},${d},${e},${m.events}`);}\n')
    observed=run(['node',str(driver)],root).splitlines()
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b),('length',len(expected),len(observed)))

print('PASS: 768 native C++ values for source constructor/move/destructor bodies, explicit destructor calls, lexical/for-initializer cleanup, early return/break/continue and temporaries; unproven nested/static/goto/ref/parameter/implicit-constructor lifetime stays blocked')
