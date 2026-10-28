#!/usr/bin/env python3
"""Refresh the captured original Clang AST type declarations used by record recovery.
Source-root restored with `python tools/prepare_sources.py` before running.
"""
import sys,json,subprocess,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];src=ROOT/'factory-output/source-tree/eduke32-master';commands=json.loads((ROOT/'factory-output/compile_commands.json').read_text())
from sys import path
path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import parse_json_stream,kind,descendants
from source_first_toolchain import frontend_config
for file,query in [('source/duke3d/src/global.cpp','user_defs'),('source/build/src/baselayer.cpp','controllerinput_t'),('source/audiolib/src/multivoc.cpp','VoiceNode'),('source/build/src/2d.cpp','vec3'),('source/duke3d/src/gameexec.cpp','spritetypev7'),('source/duke3d/src/gameexec.cpp','actor_t')]:
 comp=next(c for c in commands if c['file']==file)
 raw=comp['arguments'][1:];args=[];i=0
 while i<len(raw):
  a=raw[i]
  if a in ('-c','-MMD','-MP','-M','-MM','-o','-MF','-MT','-MQ'):i+=2 if a in ('-o','-MF','-MT','-MQ') else 1;continue
  if a==file or a.startswith(('-O','-flto','-march','-mfpmath','-funswitch','-fomit','-fjump')):i+=1;continue
  args.append(a);i+=1
 args+=['-Iplatform/Windows/include','-Iplatform/Windows/include/SDL2','-Wno-unknown-warning-option']
 frontend,target=frontend_config(True)
 cmd=[frontend,'-x','c++','-Xclang','-ast-dump=json','-Xclang','-ast-dump-filter='+query,'-fsyntax-only',*args,*target,file]
 p=subprocess.run(cmd,cwd=src,capture_output=True,text=True,timeout=60)
 print('\n==',file,query,'rc',p.returncode,'bytes',len(p.stdout),'error',p.stderr[-350:])
 if p.returncode:continue
 roots=parse_json_stream(p.stdout);out=[]
 for root in roots:
  if root.get('name')==query or root.get('kind')=='TypedefDecl':
   out.append((root.get('kind'),root.get('name'),len(root.get('inner',[])),root.get('type',{})))
   for n in descendants(root):
    if kind(n)=='CXXRecordDecl' and n.get('completeDefinition'):
     out.append(('RECORD',n.get('name'),[(v.get('name'),v.get('type',{}).get('qualType'),v.get('isBitfield')) for v in n.get('inner',[]) if kind(v)=='FieldDecl'][:32],n.get('definitionData',{}).get('defaultCtor')))
 print(str(out)[:2500]);
 (ROOT/'reports'/('type-query-'+('uspritetypev7' if query=='spritetypev7' else query)+'.json')).write_text(json.dumps(roots,indent=1))
