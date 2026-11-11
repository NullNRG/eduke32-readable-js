"""Native unaligned C/C++ storage from macro-argument anonymous typedef tags."""
import copy
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from source_ast_to_js import parse_json_stream, parse_clang_record_layouts
from source_byte_records import typedef_record_layouts


def run(args):
    result = subprocess.run(list(map(str, args)), cwd=ROOT, capture_output=True,
                            text=True, timeout=120)
    assert result.returncode == 0, (args, result.stdout[-1500:], result.stderr[-2500:])
    return result.stdout


with tempfile.TemporaryDirectory(prefix='source-macro-packed-') as directory:
    root = Path(directory)
    body = '''#include <stdint.h>
#define PACK(DECL) DECL __attribute__((__packed__))
PACK(typedef struct {uint16_t value;}) Read16;
PACK(typedef struct {uint32_t value;}) Read32;
PACK(typedef struct {uint64_t value;}) Read64;
#ifdef __cplusplus
extern "C"
#endif
uint32_t exercise(unsigned char *bytes, unsigned input) {
    unsigned offset=input&7;
    Read16 *a=(Read16*)(bytes+offset);
    Read32 *b=(Read32*)(bytes+offset+2);
    Read64 *c=(Read64*)(bytes+offset+6);
    a->value^=(uint16_t)(input*193u);
    b->value^=input*2654435761u;
    c->value^=(uint64_t)input*UINT64_C(0x100000001);
    return a->value ^ b->value ^ (uint32_t)c->value ^ (uint32_t)(c->value>>32);
}
'''
    for suffix, frontend in [('cpp', 'clang++'), ('c', 'clang')]:
        source = root / ('unit.' + suffix)
        source.write_text(body)
        driver = root / ('main.' + suffix)
        driver.write_text('''#include <stdio.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C"
#endif
uint32_t exercise(unsigned char*,unsigned);
int main(){for(unsigned n=0;n<256;n++){
 unsigned char data[32];for(unsigned i=0;i<32;i++)data[i]=(unsigned char)(i*13+n*7);
 uint32_t value=exercise(data,n);printf("%u ",(unsigned)value);
 for(unsigned i=0;i<32;i++)printf("%02x",(unsigned)data[i]);printf("\\n");}}
''')
        native = root / ('native-' + suffix)
        run([frontend, source, driver, '-o', native])
        expected = run([native]).splitlines()
        for label, flags in [('full', []), ('filtered', ['--filter', 'exercise', '--exact-filter', '--dependency-closure'])]:
            output = root / (suffix + '-' + label)
            run([sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', root,
                 '--source', source.name, '--out-dir', output, '--require-record-layouts', *flags])
            module = output / (source.name + '.mjs')
            manifest = json.loads(module.with_suffix('.manifest.json').read_text())
            assert manifest['blocked'] == 0, manifest
            runner = root / 'run.mjs'
            runner.write_text('import {exercise} from ' + json.dumps(module.as_uri())
                              + ';for(let n=0;n<256;n++){const bytes=Uint8Array.from({length:32},(_,i)=>(i*13+n*7)&255);'
                              + 'const value=exercise(bytes,n);console.log(value+" "+Array.from(bytes,v=>v.toString(16).padStart(2,"0")).join(""));}')
            assert run(['node', runner]).splitlines() == expected
        ast = parse_json_stream(run([frontend, '-Xclang', '-ast-dump=json', '-fsyntax-only', source]))
        layouts = parse_clang_record_layouts(run([frontend, '-Xclang', '-fdump-record-layouts-complete', '-fsyntax-only', source]))
        assert all(name in typedef_record_layouts(ast, layouts, root) for name in ('Read16', 'Read32', 'Read64'))
        for field in ('spellingLoc', 'expansionLoc'):
            changed = copy.deepcopy(ast)
            record = next(row for tree in changed for row in tree.get('inner', [])
                          if row.get('kind') in ('RecordDecl', 'CXXRecordDecl') and row.get('loc', {}).get('expansionLoc'))
            record['loc'][field]['offset'] += 1
            assert 'Read16' not in typedef_record_layouts(changed, layouts, root)
print('PASS: 1024 native/full/filtered C/C++ packed-macro cases; every byte/canary compared; changed spelling/expansion proofs rejected')
