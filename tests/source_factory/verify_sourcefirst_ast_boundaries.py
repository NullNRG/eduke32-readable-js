"""Offline Clang JSON tokenizer preserves split UTF-8, decimals and strict grammar."""
from io import BytesIO
import json
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_events import basic_parse
from source_ast_stream import parse_ast_file

for size in (65520,65535,65536,65537,131070,131072):
    tree={'kind':'TranslationUnitDecl','value':'❤'*size,'line':size,
          'precision':1.23e-12,'escapes':'"\\\n\u2028😊'}
    payload=json.dumps(tree,ensure_ascii=False).encode('utf-8')
    output,stats=parse_ast_file(BytesIO(payload))
    assert output==[tree] and stats['roots']==1
for payload in (b'{"kind": true false}',b'{"kind":1,}',b'{"kind":1',
                b'{"kind":01}',b'[1,]',b'"hello"',b'{}{}garbage'):
    try:list(basic_parse(BytesIO(payload)))
    except ValueError:pass
    else:raise AssertionError('invalid JSON accepted: '+str(payload))
print('PASS: incremental UTF-8 chunk boundaries, long scalar tokens, precise values and malformed JSON fail-closed')
