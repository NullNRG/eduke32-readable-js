"""Clang-owned member/array destruction order versus native C++ execution.

This validates the opt-in semantic plan. It deliberately does not claim the
parent emitter has integrated that plan or that sm::Allocator is executable.
"""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_cpp_lifetime import recover_lifetime_classes

def run(args):
    result=subprocess.run(args,capture_output=True,text=True,timeout=90)
    assert result.returncode==0,(args,result.stdout[-1000:],result.stderr[-2000:])
    return result.stdout

source='''unsigned events[32],count;
void note(unsigned value){events[count++]=value;}
namespace own {
struct Leaf{unsigned value;explicit Leaf(unsigned x):value(x){}~Leaf(){note(value);}};
struct Pair{Leaf left,right;explicit Pair(unsigned x):left(x),right(x+1){}~Pair()=default;};
struct Owner{
 Leaf first;Pair pair;Leaf cells[2][2];Leaf *borrowed;unsigned marker;
 Owner(unsigned x,Leaf *other):first(x),pair(x+1),cells{{Leaf(x+3),Leaf(x+4)},{Leaf(x+5),Leaf(x+6)}},borrowed(other),marker(100+x){}
 ~Owner(){note(marker);}
};
struct Implicit{Pair pair;Leaf tail;explicit Implicit(unsigned x):pair(x),tail(x+2){}};
struct RefOwner{Leaf &borrowed;Leaf owned;RefOwner(Leaf &x,unsigned v):borrowed(x),owned(v){}~RefOwner()=default;};
struct VirtualOwner:Leaf{explicit VirtualOwner(unsigned x):Leaf(x){}virtual ~VirtualOwner(){}};
struct DeletedOwner{Leaf owned;~DeletedOwner()=delete;};
}
void authored(unsigned x){own::Leaf borrowed(x+99);count=0;{own::Owner owner(x,&borrowed);} }
void implicit(unsigned x){count=0;{own::Implicit owner(x);} }
void reference(unsigned x){own::Leaf borrowed(x+99);count=0;{own::RefOwner owner(borrowed,x);} }
'''

with tempfile.TemporaryDirectory(prefix='owned-lifetime-plan-') as directory:
    folder=Path(directory);unit=folder/'unit.cpp';unit.write_text(source)
    # Main observes the owner cleanup before the independent borrowed object
    # is destroyed, so incorrect pointer/reference ownership is detectable.
    native_source='''#include <cstdio>
#include "unit.cpp"
int main(){for(unsigned x=0;x<128;x++){
 {own::Leaf borrowed(x+99);count=0;{own::Owner owner(x,&borrowed);}
 printf("A");for(unsigned i=0;i<count;i++)printf(" %u",events[i]);puts("");}
 {count=0;{own::Implicit owner(x);}
 printf("I");for(unsigned i=0;i<count;i++)printf(" %u",events[i]);puts("");}
 {own::Leaf borrowed(x+99);count=0;{own::RefOwner owner(borrowed,x);}
 printf("R");for(unsigned i=0;i<count;i++)printf(" %u",events[i]);puts("");}
}}
'''
    (folder/'main.cpp').write_text(native_source)
    exe=folder/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++17',str(folder/'main.cpp'),'-o',str(exe)])
    expected=[line.split() for line in run([str(exe)]).splitlines()]
    ast=json.loads(run(['clang++','-std=c++17','-Xclang','-ast-dump=json','-fsyntax-only',str(unit)]))
    baseline,_=recover_lifetime_classes([ast])
    assert 'Leaf' in baseline and not {'Pair','Owner','Implicit','RefOwner'}&baseline.keys(),baseline.keys()
    classes,aliases=recover_lifetime_classes([ast],enable_owned_subobjects=True)
    assert {'Leaf','Pair','Owner','Implicit','RefOwner'}<=classes.keys(),classes.keys()
    assert not {'VirtualOwner','DeletedOwner'}&classes.keys(),classes.keys()
    assert aliases['own::Pair']=='Pair' and aliases['own::Owner']=='Owner'
    assert classes['Pair']['implicit_destructor'] and classes['Implicit']['implicit_destructor']
    assert classes['RefOwner']['borrowed_reference_fields']==['borrowed']
    assert [row['field'] for row in classes['Owner']['subobject_destruction']]==['cells','pair','first']
    assert classes['Owner']['subobject_destruction'][0]['array_extents']==[2,2]
    assert classes['Owner']['field_initialization_order']==['first','pair','cells','borrowed','marker']

    def destroy(name,value):
        if name=='Leaf':return [value['value']]
        rows=[]
        if name=='Owner':rows.append(value['marker'])
        def array(plan,storage,dimensions):
            if not dimensions:return destroy(plan['record'],storage)
            assert len(storage)==dimensions[0]
            return [event for element in reversed(storage) for event in array(plan,element,dimensions[1:])]
        for plan in classes[name]['subobject_destruction']:
            rows.extend(array(plan,value[plan['field']],plan['array_extents']))
        return rows
    actual=[]
    for x in range(128):
        leaf=lambda v:{'value':v}
        pair=lambda v:{'left':leaf(v),'right':leaf(v+1)}
        owner={'first':leaf(x),'pair':pair(x+1),'cells':[[leaf(x+3),leaf(x+4)],[leaf(x+5),leaf(x+6)]],
            'borrowed':leaf(x+99),'marker':x+100}
        actual += [['A',*map(str,destroy('Owner',owner))],
            ['I',*map(str,destroy('Implicit',{'pair':pair(x),'tail':leaf(x+2)}))],
            ['R',*map(str,destroy('RefOwner',{'borrowed':leaf(x+99),'owned':leaf(x)}))]]
    assert actual==expected,[(a,b) for a,b in zip(actual,expected) if a!=b][:3]
    # A missing or deleted child destructor must invalidate all owning plans,
    # rather than turning a field into a trivially destructible value.
    import copy
    broken=copy.deepcopy(ast)
    def visit(node):
        if node.get('kind')=='CXXRecordDecl' and node.get('name')=='Leaf' and node.get('completeDefinition'):
            node['inner']=[child for child in node.get('inner',[]) if child.get('kind')!='CXXDestructorDecl']
        for child in node.get('inner',[]):visit(child)
    visit(broken)
    rejected,_=recover_lifetime_classes([broken],enable_owned_subobjects=True)
    assert not {'Pair','Owner','Implicit','RefOwner'}&rejected.keys(),rejected.keys()
    report={'passed':True,'native_cleanup_traces':384,'reverse_fields_and_multidimensional_arrays':True,
        'borrowed_pointer_and_reference_not_owned':True,'implicit_and_defaulted_destructors_proven':True,
        'default_compiler_behavior_unchanged':True,'emitter_integration_verified':False,
        'original_allocator_verified':False,'gameplay_verified':False}
    (ROOT/'reports/oct26-owned-lifetime-plan-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
