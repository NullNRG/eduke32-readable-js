"""Inspect Clang's source-defined template lifetime instantiations (diagnostic)."""
import json,subprocess,sys,tempfile
from pathlib import Path
sys.path.insert(0,'tools')
from source_first_toolchain import frontend_config
from source_semantic_index import captured_args
from source_ast_to_js import parse_json_stream,descendants,kids,kind,qual,produce,parse_clang_record_layouts
from source_header_records import normalize_specializations,header_proof
root=Path('factory-output/browser-classic/source-tree/eduke32-master').resolve()
commands=json.loads(Path('factory-output/browser-classic/compile_commands.json').read_text())
entry=next(row for row in commands if row['file']=='source/build/src/osd.cpp')
frontend,_=frontend_config(True);args=captured_args(entry)
with tempfile.TemporaryDirectory(prefix='eduke-template-instantiation-') as temporary:
 wrapper=Path(temporary)/'instantiate.cpp'
 directive=('template CircularQueue<char *,1024,RF_INIT_AND_FREE>::~CircularQueue();' if '--destructor' in sys.argv else 'template class CircularQueue<char *,1024,RF_INIT_AND_FREE>;')
 wrapper.write_text('#include '+json.dumps((root/entry['file']).as_posix())+'\n'+directive+'\n')
 result=subprocess.run([frontend,*args,'-Xclang','-ast-dump=json','-Xclang','-ast-dump-filter=CircularQueue','-fsyntax-only',str(wrapper)],cwd=root,capture_output=True,text=True,timeout=120)
 print('Clang returncode',result.returncode,'AST bytes',len(result.stdout));print(result.stderr[-2000:])
 if result.returncode==0:
  ast=parse_json_stream(result.stdout);normalize_specializations(ast)
  for tree in ast:
   for record in descendants(tree):
    if record.get('_source_record_name','').startswith('CircularQueue<char *, 1024,'):
     print('record',record['_source_record_name'],'proof',header_proof(record,root))
     for member in kids(record):
      if kind(member) in ('CXXConstructorDecl','CXXDestructorDecl','CXXMethodDecl'):
       print(kind(member),member.get('name'),qual(member),[kind(c) for c in kids(member) if kind(c) in ('CompoundStmt','CXXCtorInitializer')])
  raw=subprocess.run([frontend,*args,'-Xclang','-ast-dump=json','-Xclang','-ast-dump-filter=OSD_Init','-fsyntax-only',str(wrapper)],cwd=root,capture_output=True,text=True,timeout=120)
  more=parse_json_stream(raw.stdout)
  emitted,report=produce([*ast,*more],root/entry['file'],entry['file'],filters='OSD_Init',source_root=root,header_dependency_closure=True,standard_heap_runtime=True)
  print('lowering',[(r['name'],r.get('reason',r['status'])) for r in report])
