import ast,json,sys,subprocess
from pathlib import Path
sys.path.insert(0,'tools')
from source_first_toolchain import frontend_config
from source_ast_to_js import parse_json_stream,descendants
root=Path('work/contiguous-record-fixture');root.mkdir(exist_ok=True)
t=ast.parse(Path('tests/source_factory/verify_sourcefirst_contiguous_records.py').read_text());source=next(n.args[0].value for n in ast.walk(t)if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute)and n.func.attr=='write_text' and isinstance(n.args[0],ast.Constant))
(root/'unit.cpp').write_text(source)
front,flags=frontend_config(True);p=subprocess.run([front,*flags,'-std=c++14','-Xclang','-ast-dump=json','-fsyntax-only','unit.cpp'],cwd=root,text=True,capture_output=True);assert p.returncode==0,p.stderr
ast=parse_json_stream(p.stdout)
for top in ast:
 for n in descendants(top):
  if n.get('kind')=='AlignedAttr':print(n)
