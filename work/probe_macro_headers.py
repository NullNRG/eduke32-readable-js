import json,sys,subprocess
from pathlib import Path
sys.path.insert(0,'tools')
from source_first_toolchain import frontend_config
from source_ast_to_js import parse_json_stream
root=Path('factory-output/source-tree/eduke32-master').resolve()
source='source/build/src/engine.cpp'
comp=next(c for c in json.load(open('factory-output/compile_commands.json')) if c['file']==source)
raw=comp['arguments'][1:];args=[];i=0
while i<len(raw):
 a=raw[i]
 if a in ('-c','-MMD','-MP','-M','-MM','-o','-MF','-MT','-MQ'):
  i+=2 if a in ('-o','-MF','-MT','-MQ') else 1;continue
 if a==source or a.startswith(('-O','-flto','-march','-mfpmath','-funswitch','-fomit','-fjump')):i+=1;continue
 args.append(a);i+=1
frontend,target=frontend_config(True)
p=subprocess.run([frontend,'-x','c++','-Xclang','-ast-dump=json','-Xclang','-ast-dump-filter=mulscale24','-fsyntax-only',*args,'-Iplatform/Windows/include','-Iplatform/Windows/include/SDL2',*target,source],cwd=root,capture_output=True,text=True)
assert not p.returncode,p.stderr[-3000:]
ast=parse_json_stream(p.stdout)
Path('work/macro-header-probe.json').write_text(json.dumps(ast,indent=2))
print(json.dumps([{k:n.get(k)for k in ('kind','name','loc','range','storageClass','inline')} for n in ast],indent=2))

