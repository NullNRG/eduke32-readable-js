import sys,json
from pathlib import Path
sys.path.insert(0,'tools')
from source_ast_to_js import parse_json_stream
from source_cpp_heap import original_allocator_definitions,allocation_symbol
root=Path('factory-output/source-tree/eduke32-master').resolve()
for file in sorted(Path('work/ast-cache-boot-probes').glob('*.json'),key=lambda p:p.stat().st_mtime,reverse=True)[:4]:
 if file.stat().st_size<1:continue
 text=file.read_text();asts=parse_json_stream(text)
 for n in asts:
  if n.get('name') in ('operator new','operator delete','operator new[]','operator delete[]'):
   print(file.name,n.get('name'),n.get('loc'),n.get('range'),n.get('mangledName'),n.get('inline'),[c.get('kind') for c in n.get('inner',[])])
 print('recovered',len(original_allocator_definitions(asts,root,'source/build/src/smmalloc_generic.cpp')))
