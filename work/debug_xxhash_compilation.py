import sys,json
sys.path.insert(0,'tools')
import source_ast_to_js as compiler
original=compiler.recover_referenced_header_functions
seen=set()
def trace(ast,candidates,root):
 result=original(ast,candidates,root)
 ns=[n for top in ast for n in compiler.descendants(top) if n.get('name')=='XXH3_accumulate_scalar' and n.get('kind')=='FunctionDecl']
 for n in ns:
  key=(n.get('id'),bool([x for x in n.get('inner',[]) if x.get('kind')=='CompoundStmt']))
  if key in seen:continue
  seen.add(key)
  print('TRACE',json.dumps({'loc':n.get('loc'),'range':n.get('range'),'body_range':[x.get('range') for x in n.get('inner',[]) if x.get('kind')=='CompoundStmt'],'type':n.get('type'),'body':key[1],'storage':n.get('storageClass'),'origin':str(compiler.macro_header_origin(n,root)),'added':n in result[0],'candidate':n in candidates}))
 return result
compiler.recover_referenced_header_functions=trace
prior=compiler.verified_libc_byte_symbol
sig=set()
def libc(d):
 if d.get('name')=='memcpy' and str(d.get('type')) not in sig:
  sig.add(str(d.get('type')));print('MEMCPY',d.get('type'),prior(d))
 return prior(d)
compiler.verified_libc_byte_symbol=libc
compiler.main()
