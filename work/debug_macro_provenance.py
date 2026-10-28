import json,sys,subprocess,io
from pathlib import Path
sys.path.insert(0,'tools')
from source_first_toolchain import frontend_config
from source_ast_stream import parse_ast_file
from source_ast_to_js import macro_header_origin,descendants
root=Path('work/macro-parity-debug').resolve()
comp=json.load(open(root/'commands.json'))[0]
front,target=frontend_config(True)
p=subprocess.run([front,*target,*comp['arguments'][1:-2],'-Xclang','-ast-dump=json','-Xclang','-ast-dump-filter=mulscale1','-fsyntax-only','unit.cpp'],cwd=root,capture_output=True)
assert not p.returncode,p.stderr[-1000:]
a,s=parse_ast_file(io.BytesIO(p.stdout))
print(s)
for top in a:
 for n in descendants(top):
  if n.get('name')=='mulscale1':
   print(json.dumps({k:n.get(k)for k in ('kind','name','loc','range')},indent=2))
   print(macro_header_origin(n,root))
