"""Rejected fragment imports preserve the whole unit's dependency evidence."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(command, *, success=True):
    result = subprocess.run(list(map(str, command)), cwd=ROOT, capture_output=True,
                            text=True, timeout=180)
    assert (result.returncode == 0) == success, (command, result.stdout[-2000:], result.stderr[-2000:])
    return result


with tempfile.TemporaryDirectory(prefix='eduke_import_catalog_') as directory:
    root = Path(directory)
    owner = root / 'owner'
    stage = root / 'consumer'
    (root / 'provider.cpp').write_text('extern "C" int first(int n){return n+3;}\n'
                                       'extern "C" int second(int n){return n*2;}\n')
    (root / 'consumer.cpp').write_text('extern "C" int first(int),second(int);\n'
                                       'extern "C" int combined(int n){return first(n)+second(n);}\n'
                                       'extern "C" int caller(int n){return combined(n)+1;}\n'
                                       'extern "C" int independent(){return 42;}\n')
    base = [sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', root]
    run([*base, '--source', 'provider.cpp', '--out-dir', owner])
    provider_manifest = owner / 'provider.cpp.manifest.json'
    provider_bytes = provider_manifest.read_bytes()
    provider = json.loads(provider_bytes)
    symbols = root / 'symbols.json'
    symbols.write_text(json.dumps({'first': 'provider.cpp', 'second': 'provider.cpp'}))
    command = [*base, '--source', 'consumer.cpp', '--out-dir', stage,
               '--project-symbols', symbols, '--import-root', owner]
    provider['native_pointer_abi'] = 'incompatible-fixture-abi'
    provider_manifest.write_text(json.dumps(provider))
    result = run(command, success=False)
    rejection_path = stage / 'consumer.cpp.rejected-imports.json'
    rejection = json.loads(rejection_path.read_text())
    assert {row['name'] for row in rejection['rejected_imports']} == {'first', 'second'}, rejection
    assert {row['category'] for row in rejection['rejected_imports']} == {'native-pointer-abi'}
    assert {'combined', 'caller'} <= set(rejection['affected_definitions']), rejection
    assert 'independent' not in rejection['affected_definitions'], rejection
    assert len(rejection['compiler_runtime_input_sha256']) == 64
    assert not rejection['module_written'] and not rejection['link_verified']
    assert not (stage / 'consumer.cpp.mjs').exists()
    assert not (stage / 'consumer.cpp.manifest.json').exists()
    assert 'Rejected import catalog:' in result.stderr
    provider_manifest.write_bytes(provider_bytes)
    provider_module = owner / 'provider.cpp.mjs'
    module_bytes = provider_module.read_bytes()
    assert b'export function second' in module_bytes
    provider_module.write_bytes(module_bytes.replace(b'export function second', b'function second'))
    run(command, success=False)
    missing = json.loads(rejection_path.read_text())
    assert [row['name'] for row in missing['rejected_imports']] == ['second'], missing
    assert missing['rejected_imports'][0]['category'] == 'implementation', missing
    assert not (stage / 'consumer.cpp.mjs').exists()
    provider_module.write_bytes(module_bytes)
    run(command)
    assert not rejection_path.exists()
    manifest = json.loads((stage / 'consumer.cpp.manifest.json').read_text())
    assert manifest['blocked'] == 0, manifest
    script = root / 'run.mjs'
    script.write_text('import {caller,independent} from ' + json.dumps((stage / 'consumer.cpp.mjs').as_uri())
                      + ';for(let n=-64;n<64;n++)console.log(caller(n),independent());\n')
    actual = run(['node', script]).stdout.splitlines()
    (root / 'main.cpp').write_text('#include <cstdio>\nextern "C" int caller(int),independent();\n'
                                  'int main(){for(int n=-64;n<64;n++)printf("%d %d\\n",caller(n),independent());}\n')
    native = root / 'native.exe'
    run(['clang++', root / 'provider.cpp', root / 'consumer.cpp', root / 'main.cpp', '-o', native])
    assert run([native]).stdout.splitlines() == actual

print('PASS all rejected imports and transitive callers cataloged, no rejected module published, repaired imports match 256 native values')
