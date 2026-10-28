import collections,ctypes,hashlib,json,os,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_toolchain import frontend_config
from source_ast_stream import parse_ast_file
source='source/build/src/loguru.cpp'
root=ROOT/'factory-output/source-tree/eduke32-master'
comp=next(c for c in json.loads((ROOT/'factory-output/compile_commands.json').read_text()) if c['file']==source)
raw=comp['arguments'][1:];args=[];i=0
while i<len(raw):
 a=raw[i]
 if a in ('-c','-MMD','-MP','-M','-MM','-o','-MF','-MT','-MQ'):
  i+=2 if a in ('-o','-MF','-MT','-MQ') else 1;continue
 if a==source or a.startswith(('-O','-flto','-march','-mfpmath','-funswitch','-fomit','-fjump')):i+=1;continue
 args.append(a);i+=1
frontend,target=frontend_config(True)
command=[frontend,'-x','c++','-Xclang','-ast-dump=json','-fsyntax-only',*args,
 '-Iplatform/Windows/include','-Iplatform/Windows/include/SDL2','-Wno-unknown-warning-option',*target,source]
output=ROOT/'work/ast-memory-probe.json'
start=time.monotonic()
with output.open('wb') as stream:
 process=subprocess.run(command,cwd=root,stdout=stream,stderr=subprocess.PIPE,timeout=180)
if process.returncode:raise RuntimeError(process.stderr.decode(errors='replace')[-5000:])
size=output.stat().st_size;clang_seconds=time.monotonic()-start
begin=time.monotonic()
with output.open('rb') as stream:ast,stats=parse_ast_file(stream)
decode_seconds=time.monotonic()-begin
class Counters(ctypes.Structure):
 _fields_=[('cb',ctypes.c_ulong),('faults',ctypes.c_ulong)]+[(name,ctypes.c_size_t) for name in ('peak','working','quota_peak_paged','quota_paged','quota_peak_nonpaged','quota_nonpaged','pagefile','peak_pagefile')]
state=Counters();state.cb=ctypes.sizeof(state)
kernel=ctypes.WinDLL('kernel32',use_last_error=True);kernel.GetCurrentProcess.restype=ctypes.c_void_p
psapi=ctypes.WinDLL('psapi',use_last_error=True);psapi.GetProcessMemoryInfo.argtypes=(ctypes.c_void_p,ctypes.POINTER(Counters),ctypes.c_ulong)
if not psapi.GetProcessMemoryInfo(kernel.GetCurrentProcess(),ctypes.byref(state),state.cb):raise ctypes.WinError(ctypes.get_last_error())
kinds=collections.Counter()
def walk(item):
 if isinstance(item,dict):
  if item.get('kind'):kinds[item['kind']]+=1
  for child in item.values():walk(child)
 elif isinstance(item,list):
  for child in item:walk(child)
walk(ast)
report={'format':'source-ast-stream-memory-probe/1','source':source,'source_sha256':hashlib.sha256((root/source).read_bytes()).hexdigest(),
 'command':command,'input_json_bytes':size,'clang_seconds':round(clang_seconds,3),'decode_seconds':round(decode_seconds,3),
 'python_peak_working_set_bytes':state.peak,'python_working_set_bytes':state.working,'stats':stats,
 'all_retained_node_kinds':dict(kinds),'retained_function_declarations':kinds['FunctionDecl'],
 'retained_compound_statements':kinds['CompoundStmt'],'retained_declaration_references':kinds['DeclRefExpr'],
 'source_header_definition_filtering':False,'only_omitted_field':'range','canonical_semantic_index_retains_source_spans':True}
(ROOT/'reports/ast-stream-memory-probe.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
output.unlink()
print(json.dumps({key:value for key,value in report.items() if key not in ('command','all_retained_node_kinds')},indent=2))
