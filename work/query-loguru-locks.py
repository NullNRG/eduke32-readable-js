import json,sys,subprocess
from pathlib import Path
sys.path.insert(0,'tools')
from source_first_toolchain import frontend_config
from source_ast_to_js import parse_json_stream,descendants
root=Path('factory-output/source-tree/eduke32-master').resolve()
entries=json.loads(Path('factory-output/compile_commands.json').read_text())
entry=next(e for e in entries if e['file']=='source/build/src/loguru.cpp')
raw=entry['arguments'][1:];args=[];i=0
while i<len(raw):
 a=raw[i]
 if a in ('-c','-MMD','-MP','-M','-MM','-o','-MF','-MT','-MQ'):i+=2 if a in ('-o','-MF','-MT','-MQ') else 1;continue
 if a==entry['file'] or a.startswith(('-O','-flto','-march','-mfpmath','-funswitch','-fomit','-fjump')):i+=1;continue
 args.append(a);i+=1
frontend,target=frontend_config(True)
args+=['-Iplatform/Windows/include','-Iplatform/Windows/include/SDL2','-Wno-unknown-warning-option']
for query in ('recursive_mutex','lock_guard'):
 p=subprocess.run([frontend,'-x','c++',*target,*args,'-Xclang','-ast-dump=json','-Xclang','-ast-dump-filter='+query,'-fsyntax-only',entry['file']],cwd=root,capture_output=True,text=True,timeout=90)
 print(query,p.returncode,len(p.stdout),p.stderr[-200:])
 Path('work/loguru-'+query+'-ast.json').write_text(p.stdout)
 for n in parse_json_stream(p.stdout):
  print(n.get('kind'),n.get('name'),n.get('loc'),n.get('bases'))
  if n.get('completeDefinition'):
   for c in n.get('inner',[]):
    if c.get('kind') in ('FieldDecl','CXXConstructorDecl','CXXDestructorDecl','CXXMethodDecl'):print(' ',c.get('kind'),c.get('name'),c.get('type'),[v.get('kind') for v in c.get('inner',[])])
