"""Original guarded C case entries retain structured switches and native flow."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = '''extern "C" int guarded(int op,int n){int checks=0,result=0;
 switch(op){case 1:if((++checks,n>0)){__attribute__((fallthrough));case 2:result+=n*3;}break;
 case 3:result=17;break;default:result=-5;break;}return result+checks*1000;}
extern "C" int continued(int op,int n){int total=0,checks=0;
 for(int i=0;i<4;i++){switch(op){case 1:if((++checks,n+i>0)){;case 2:total+=n+i;}continue;
 default:total-=7;break;}total+=13;}return total+checks*1000;}
extern "C" int returned(int op,int n){int checks=0;
 switch(op){case 1:if((++checks,n>0)){;case 2:n+=9;}return n+checks*1000;default:return -3;}}
extern "C" int ordinary(int op,int n){switch(op){case 1:case 2:return n+1;default:return n-1;}}
'''
NAMES = ['guarded', 'continued', 'returned', 'ordinary']


def run(command):
    result = subprocess.run(list(map(str, command)), cwd=ROOT, capture_output=True, text=True, timeout=180)
    assert result.returncode == 0, (command, result.stdout[-1800:], result.stderr[-2200:])
    return result.stdout.splitlines()


with tempfile.TemporaryDirectory(prefix='source-guarded-case-') as directory:
    root = Path(directory)
    (root / 'unit.cpp').write_text(SOURCE)
    (root / 'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){'
        'for(int op=0;op<4;op++)for(int n=-32;n<32;n++)printf("%d %d %d %d\\n",'
        + ','.join(name + '(op,n)' for name in NAMES) + ');}\n')
    native = root / 'native.exe'
    run(['clang++', '-std=gnu++14', root / 'main.cpp', '-o', native])
    expected = run([native])
    for mode in ('full', 'filtered'):
        output = root / mode
        command = [sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', root,
                   '--source', 'unit.cpp', '--out-dir', output]
        if mode == 'filtered':
            command += ['--filter', ','.join(NAMES), '--exact-filter', '--dependency-closure']
        run(command)
        module = output / 'unit.cpp.mjs'
        manifest = json.loads(module.with_suffix('.manifest.json').read_text())
        assert manifest['blocked'] == 0, manifest
        rows = {row['name']: row for row in manifest['definitions']}
        for name in NAMES[:3]:
            assert len(rows[name]['source_guarded_switch_cases']) == 1, rows[name]
            assert rows[name].get('control_flow', {}).get('strategy') != 'source-native-coroutine-continuations'
        assert not rows['ordinary'].get('source_guarded_switch_cases')
        script = root / (mode + '.mjs')
        script.write_text('import * as m from ' + json.dumps(module.as_uri()) + ';'
            'for(let op=0;op<4;op++)for(let n=-32;n<32;n++)console.log('
            + json.dumps(NAMES) + '.map(name=>m[name](op,n)).join(" "));\n')
        assert run(['node', script]) == expected

print('PASS 1024 native/full/filtered values for guarded switch entry, condition side effects, break, outer-loop continue and return')
