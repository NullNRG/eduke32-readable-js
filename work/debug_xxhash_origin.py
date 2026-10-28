import sys,json
from pathlib import Path
sys.path.insert(0,'tools')
from source_ast_to_js import macro_header_origin
node=json.load(open('work/xxhash-accumulate-ast.json',encoding='utf-8-sig'))
root=Path('factory-output/source-tree/eduke32-master').resolve()
node['loc']['expansionLoc']['file']=str(root/'source/build/include/xxhash.h')
print(macro_header_origin(node,root));print(node.get('_source_macro_header'))
