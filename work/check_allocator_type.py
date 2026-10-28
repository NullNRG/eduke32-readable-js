import json,sys
from pathlib import Path
sys.path.insert(0,'tools')
from source_ast_to_js import parse_json_stream,descendants
for name in ('39f1bb00dfc6b984962a82e6dc3cccbac2548a336004c8844b64ee4a0f8bfca0','fb4f55be6564c4d97a834431bb18a10ca2c7625d5a582657b55f9756eb23fce7'):
 ast=parse_json_stream((Path('work/ast-cache-boot-probes')/(name+'.json')).read_text())
 for r in ast:
  if r.get('name')=='operator new' and r.get('mangledName')=='_Znwm':print({k:r[k]for k in ('id','name','type','mangledName')})
