"""Attest saved contiguous record-array schemas without changing their JS bytes."""
import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path
from source_record_array_storage import metadata
from browser_target_closure import active_exports

ROOT = Path(__file__).resolve().parents[1]


def upgrade(module, expected_sha256, history):
    module = Path(module).resolve()
    manifest = module.with_suffix('.manifest.json')
    code, before = module.read_bytes(), manifest.read_bytes()
    digest = hashlib.sha256(code).hexdigest()
    if digest != expected_sha256:
        raise ValueError('Original array owner changed')
    document = json.loads(before)
    if (document.get('native_pointer_abi') != 'source-lp64-addresses/2'
            or not (document.get('ast_cache_inputs') or {}).get('preprocessor_verified')):
        raise ValueError('Original array preprocessing/pointer contract is missing')
    targets = [row for row in document['definitions'] if row.get('status') == 'source-first'
               and row.get('kind') == 'VarDecl'
               and row.get('object_storage', {}).get('abi') == 'source-byte-record-array/1']
    relative = Path(document['source'])
    if relative.is_absolute() or '..' in relative.parts:
        raise ValueError('Invalid original source owner')
    root = module.parents[len(relative.parts) - 1]
    files = [(module, code)]
    for fragment in document.get('module_fragments', []):
        path = (root / fragment['module']).resolve()
        if path.parent != module.parent:
            raise ValueError('Original fragment escapes its source owner')
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != fragment['sha256']:
            raise ValueError('Original array fragment changed')
        files.append((path, data))
    parser = r'''import ts from 'typescript';let input='';for await(const p of process.stdin)input+=p;
const {files,names}=JSON.parse(input),rows=[];
for(const text of files){
 const ast=ts.createSourceFile('owner.mjs',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 if(ast.parseDiagnostics.length)throw Error('Invalid original module');
 for(const s of ast.statements){
  if(!ts.isVariableStatement(s)||!s.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))continue;
  for(const d of s.declarationList.declarations){
   if(!ts.isIdentifier(d.name)||!names.includes(d.name.text)||!d.initializer||!ts.isCallExpression(d.initializer))continue;
   const call=d.initializer;if(call.expression.getText(ast)!=='cByteRecordNDArray'||call.arguments.length<2)continue;
   rows.push({name:d.name.text,schema:JSON.parse(call.arguments[0].getText(ast)),dimensions:JSON.parse(call.arguments[1].getText(ast))});
  }
 }
}process.stdout.write(JSON.stringify(rows));'''
    process = subprocess.run(['node', '--input-type=module', '-e', parser], cwd=ROOT,
                             input=json.dumps({'files': [data.decode() for _, data in files],
                                               'names': [row['name'] for row in targets]}),
                             capture_output=True, text=True, timeout=120)
    if process.returncode:
        raise ValueError('Original record-array initializer parse failed: ' + process.stderr[-1600:])
    parsed = json.loads(process.stdout)
    exports = active_exports(module)
    changes = []
    for row in targets:
        storage = row['object_storage']
        found = [entry for entry in parsed if entry['name'] == row['name']]
        if len(found) != 1 or row['name'] not in exports:
            raise ValueError('Original exported array initializer is not unique: ' + row['name'])
        original = found[0]
        schema = original['schema']
        if (not schema.get('fields') or schema.get('size') != storage.get('stride')
                or original['dimensions'] != storage.get('dimensions')
                or hashlib.sha256(json.dumps(schema, sort_keys=True).encode()).hexdigest() != storage.get('schema_sha256')):
            raise ValueError('Original array initializer differs from recorded native schema: ' + row['name'])
        contract = metadata(schema)
        if any(key in storage and storage[key] != value for key, value in contract.items()):
            raise ValueError('Conflicting original native array contract: ' + row['name'])
        if all(storage.get(key) == value for key, value in contract.items()):
            continue
        storage.update(contract)
        changes.append({'name': row['name'], 'full_schema_sha256': storage['schema_sha256'], **contract})
    proof = {'format': 'verified-original-native-record-array/1', 'source': document['source'],
             'owner_sha256': digest, 'previous_manifest_sha256': hashlib.sha256(before).hexdigest(),
             'changed': bool(changes), 'arrays': changes, 'source_code_changed': False,
             'source_definitions_recovered': 0,
             'actual_code_sha256': {path.relative_to(root).as_posix(): hashlib.sha256(data).hexdigest()
                                    for path, data in files}}
    if not changes:
        return proof
    if manifest.read_bytes() != before or any(path.read_bytes() != data for path, data in files):
        raise ValueError('Original array owner changed during attestation')
    document.setdefault('record_array_storage_attestations', []).append(proof)
    saved = Path(history) / (digest + '-array-' + proof['previous_manifest_sha256'][:16])
    saved.mkdir(parents=True, exist_ok=True)
    (saved / 'original.mjs').write_bytes(code)
    (saved / 'original.manifest.json').write_bytes(before)
    temporary = manifest.with_suffix('.array-layout.tmp')
    temporary.write_text(json.dumps(document, indent=2) + '\n')
    os.replace(temporary, manifest)
    return proof


if __name__ == '__main__':
    import recover_browser_component as component
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sources', nargs='+')
    args = parser.parse_args()
    selected = {row['file'] for row in json.loads(component.COMMANDS.read_text())}
    with component.component_lock():
        for source in args.sources:
            if source not in selected:
                raise ValueError('Not a selected original source unit')
            module = component.OUT / (source + '.mjs')
            print(json.dumps(upgrade(module, hashlib.sha256(module.read_bytes()).hexdigest(),
                                     component.BASE / 'owner-history'), indent=2))
        component.checkpoint()
