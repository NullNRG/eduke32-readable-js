"""Streaming decoding preserves all source/header semantics and emitted code."""
from io import BytesIO
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_stream import parse_ast_file,run_clang_ast
from source_ast_to_js import parse_json_stream,produce
from source_first_toolchain import frontend_config


def strip_ranges(value):
    if isinstance(value,dict):return {key:strip_ranges(item) for key,item in value.items() if key!='range'}
    if isinstance(value,list):return [strip_ranges(item) for item in value]
    return value


example={'kind':'TranslationUnitDecl','inner':[
    {'id':'0x1','kind':'FunctionDecl','loc':{'file':'original.h','offset':12},
     'range':{'begin':{'offset':0},'end':{'offset':42}},
     'type':{'qualType':'int (int)'},'inner':[{'id':'0x2','kind':'CompoundStmt',
        'inner':[{'kind':'DeclRefExpr','referencedDecl':{'id':'0x3','kind':'VarDecl','name':'global',
        'type':{'qualType':'unsigned long'}},'range':{'begin':{'offset':1},'end':{'offset':2}}}]}]},
    {'kind':'StringLiteral','value':'quoted " slash \\ Unicode é','type':{'qualType':'char[30]'}}]}
text=json.dumps(example)+'\n'+json.dumps({'kind':'IntegerLiteral','value':'18446744073709551616'})
baseline=parse_json_stream(text)
decoded,stats=parse_ast_file(BytesIO(text.encode()))
assert decoded==strip_ranges(baseline),(decoded,baseline)
lossless,_=parse_ast_file(BytesIO(text.encode()),retain_ranges=True)
assert lossless==baseline
assert stats['ranges_omitted']==2 and stats['roots']==2,stats
static_ref={'kind':'DeclRefExpr','range':{'begin':{'offset':20,'tokLen':4},'end':{'offset':26,'tokLen':3}},
    'referencedDecl':{'id':'method','kind':'CXXMethodDecl','name':'run','type':{'qualType':'int (int)'}}}
static_decoded,static_stats=parse_ast_file(BytesIO(json.dumps(static_ref).encode()))
assert static_decoded==[static_ref] and static_stats['semantic_barrier_ranges_retained']==1,static_stats
for invalid in (b'{"kind":',b'{"kind":"A"} garbage',b'{"kind":"A","inner":[}'): 
    try:parse_ast_file(BytesIO(invalid))
    except (ValueError,Exception) as error:assert error is not None
    else:raise AssertionError('malformed AST accepted')

frontend,flags=frontend_config(True)
with tempfile.TemporaryDirectory(prefix='source ast stream ') as temp:
    root=Path(temp)
    header=root/'original.h'
    header.write_text('''struct Box {int value; Box(int v):value(v){} int add(int v){return value+=v;} };
inline int original_inline(int v){return v*3;}
''')
    source=root/'original.cpp'
    source.write_text('''#include "original.h"
int counter=4;
int run_original(int v){Box x(counter);return x.add(original_inline(v));}
''')
    command=[frontend,*flags,'-std=c++14','-Xclang','-ast-dump=json','-fsyntax-only','original.cpp']
    native=subprocess.run(command,cwd=root,capture_output=True,text=True)
    assert native.returncode==0,native.stderr
    old=parse_json_stream(native.stdout)
    new,stats=run_clang_ast(command,cwd=root,cache_path=root/'ast.json')
    # Clang pointer IDs differ across processes, so compare the exact same dump.
    with (root/'ast.json').open('rb') as stream:raw=json.load(stream)
    assert strip_ranges(new)==strip_ranges([raw])
    def walk(node):
        yield node
        for child in node.get('inner',[]):
            if child:yield from walk(child)
    # Instance-method lowering needs the exact original class and method
    # spans. Verify these against the same native dump, independently of the
    # decoder's omission of unrelated ranges.
    for node_kind,name in (('CXXRecordDecl','Box'),('CXXMethodDecl','add'),('CXXConstructorDecl','Box')):
        expected=[node['range'] for node in walk(raw) if node.get('kind')==node_kind
                  and node.get('name')==name and 'range' in node]
        actual=[node['range'] for tree in new for node in walk(tree) if node.get('kind')==node_kind
                and node.get('name')==name and 'range' in node]
        assert expected and actual==expected,(node_kind,name,actual,expected)
    assert stats['instance_method_ranges_retained']>=2,stats
    normal=produce([raw],source,'original.cpp',include_header_inlines=True,source_root=root,
                   header_dependency_closure=True)
    streamed=produce(new,source,'original.cpp',include_header_inlines=True,source_root=root,
                     header_dependency_closure=True)
    assert normal==streamed,'streaming changed generated JS, definitions or imports'
    cached,cache_stats=run_clang_ast(['__not_a_compiler__'],cwd=root,cache_path=root/'ast.json')
    assert cache_stats['cache_hit'] and cached==new
    try:run_clang_ast([frontend,'--invalid-compiler-option-for-test'],cwd=root,cache_path=root/'bad.json')
    except RuntimeError:pass
    else:raise AssertionError('frontend error silently accepted')
    assert not (root/'bad.json').exists() and not (root/'bad.json.partial').exists()
print('PASS: streaming AST exact semantic tree, source/header bodies, original emission parity, cache and fail-closed errors')
