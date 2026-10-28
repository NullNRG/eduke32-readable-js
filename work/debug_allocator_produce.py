import json,sys
from pathlib import Path
sys.path.insert(0,'tools')
from source_ast_to_js import parse_json_stream,produce
from source_cpp_heap import original_allocator_definitions
root=Path('factory-output/source-tree/eduke32-master').resolve()
ast=[]
for name in ('39f1bb00dfc6b984962a82e6dc3cccbac2548a336004c8844b64ee4a0f8bfca0','fb4f55be6564c4d97a834431bb18a10ca2c7625d5a582657b55f9756eb23fce7'):
 ast+=parse_json_stream((Path('work/ast-cache-boot-probes')/(name+'.json')).read_text())
print('matches',[(n['name'],p['source_line'])for n,p in original_allocator_definitions(ast,root,'source/build/src/smmalloc_generic.cpp')])
u,r=produce(ast,(root/'source/build/src/smmalloc_generic.cpp').read_text(),'source/build/src/smmalloc_generic.cpp',filters='operator new,operator delete',source_root=root)
print(r)
