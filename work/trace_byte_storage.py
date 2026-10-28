from pathlib import Path
import sys,json
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import source_ast_to_js as compiler
from source_ast_stream import parse_ast_file
directory=ROOT/'work/original-aggregate-storage-cache'
dump=next(p for p in directory.glob('*.json') if p.stat().st_size>10000000)
with dump.open('rb') as stream:ast,_=parse_ast_file(stream)
compiler.normalize_specializations(ast)
aliases=compiler.recover_type_aliases(ast)
layouts=json.loads(next(directory.glob('layouts*.json')).read_text())
source=(ROOT/'tools/source_byte_records.py').read_text()
source=source.replace('    records = {}','    debug = []\n    records = {}',1)
source=source.replace("        if not valid or not layout or not fields or not (0 < layout['size'] <= 1048576):",
 "        if not valid or not layout or not fields or not (0 < layout['size'] <= 1048576):\n            debug.append({'record':by_id_names.get(identity), 'traits_valid':valid,'layout':layout,'fields':len(fields)})")
source=source.replace('        cached[identity] = result if valid else None',
 "        if not valid:debug.append({'record':by_id_names.get(identity),'field':field,'offset':offset,'base':locals().get('base'),'layout':layout})\n        cached[identity] = result if valid else None")
source=source.replace('    return recovered',"    global TRACE\n    TRACE=debug\n    return recovered")
namespace={};exec(source,namespace)
recovered=namespace['recover_byte_records'](ast,layouts,aliases)
out={'recovered':list(recovered),'failures':namespace['TRACE']}
(ROOT/'reports/nested-byte-storage-trace.json').write_text(json.dumps(out,indent=2)+'\n')
print('TRACE',len(recovered),'records',len(namespace['TRACE']),'failures')
print(json.dumps([r for r in namespace['TRACE'] if any('vec3' in str(n) or 'playerspawn' in str(n) for n in (r.get('record') or []))],indent=2)[:10000])
