"""Reattest unchanged numeric header constants after a primary source edit."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PARSER = r'''import ts from 'typescript';let input='';for await(const part of process.stdin)input+=part;
const {files,specs}=JSON.parse(input),rows=[];
const printer=ts.createPrinter({removeComments:true,newLine:ts.NewLineKind.LineFeed});
const casts=new Set(['i8','u8','i16','u16','i32','u32','i64','u64']);
for(let fileIndex=0;fileIndex<files.length;fileIndex++){
 const file=ts.createSourceFile('source.mjs',files[fileIndex],ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 if(file.parseDiagnostics.length)throw Error('Invalid original source module');
 const functions=new Map(),bindings=new Set();
 for(const statement of file.statements){
  if(ts.isFunctionDeclaration(statement)&&statement.name){
   const name=statement.name.text;
   functions.set(name,functions.has(name)?null:statement);bindings.add(name);
  }
  if(ts.isVariableStatement(statement))for(const d of statement.declarationList.declarations)
   if(ts.isIdentifier(d.name))bindings.add(d.name.text);
  if(ts.isImportDeclaration(statement)&&statement.importClause){
   const clause=statement.importClause;if(clause.name)bindings.add(clause.name.text);
   if(clause.namedBindings){
    if(ts.isNamespaceImport(clause.namedBindings))bindings.add(clause.namedBindings.name.text);
    else for(const element of clause.namedBindings.elements)bindings.add(element.name.text);
   }
  }
 }
 for(const statement of file.statements){
  if(!ts.isVariableStatement(statement)||!statement.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))continue;
  for(const declaration of statement.declarationList.declarations){
   if(!ts.isIdentifier(declaration.name))continue;
   const name=declaration.name.text,spec=specs[name],init=declaration.initializer;
   if(!spec||!init||bindings.has('Number')||bindings.has('BigInt'))continue;
   const used=new Set();
   function literal(node){
    if(ts.isNumericLiteral(node)||ts.isBigIntLiteral(node))return true;
    if(ts.isParenthesizedExpression(node))return literal(node.expression);
    if(ts.isPrefixUnaryExpression(node))return [ts.SyntaxKind.PlusToken,ts.SyntaxKind.MinusToken,ts.SyntaxKind.TildeToken].includes(node.operator)&&literal(node.operand);
    if(ts.isBinaryExpression(node))return new Set(['+','-','*','/','%','<<','>>','>>>','&','|','^']).has(node.operatorToken.getText(file))&&literal(node.left)&&literal(node.right);
    if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&casts.has(node.expression.text)&&node.arguments.length===1){
     used.add(node.expression.text);return literal(node.arguments[0]);
    }
    return false;
   }
   if(spec.array){
    if(!ts.isNewExpression(init)||!ts.isIdentifier(init.expression)||init.expression.text!==spec.array||
       bindings.has(spec.array)||init.arguments?.length!==1||!ts.isArrayLiteralExpression(init.arguments[0])||
       init.arguments[0].elements.length!==spec.length||!init.arguments[0].elements.every(literal))continue;
   }else if(!literal(init))continue;
   if([...used].some(name=>!functions.get(name)))continue;
   rows.push({name,fileIndex,initializer:printer.printNode(ts.EmitHint.Expression,init,file),
    helpers:Object.fromEntries([...used].sort().map(name=>[name,printer.printNode(ts.EmitHint.Unspecified,functions.get(name),file)]))});
  }
 }
}process.stdout.write(JSON.stringify(rows));'''


def attest(owner_module, source, current_rows, old_values, current_code):
    from browser_target_closure import active_exports

    eligible = {}
    identity = ('source_header', 'source_offset', 'translation_unit', 'linkage')
    for row in current_rows:
        previous = old_values.get(row['name'], {})
        private = row.get('private_storage', {})
        array = private.get('scalar_array', {})
        proof = row.get('header_global_definition', {})
        old_proof = previous.get('header_global_definition', {})
        spelling = row.get('original_type', '')
        scalar = bool(re.fullmatch(r'const (?:signed |unsigned )?(?:char|short|int|long|long long|bool|float|double)', spelling)
                      or re.fullmatch(r'const (?:[A-Za-z_]\w*::)*[A-Za-z_]\w*', spelling))
        numeric_array = (len(array.get('dims', [])) == 1 and 0 < array['dims'][0] <= 1_000_000
                         and array.get('array') in ('Int8Array', 'Uint8Array', 'Int16Array', 'Uint16Array',
                                                   'Int32Array', 'Uint32Array', 'BigInt64Array', 'BigUint64Array'))
        if (row.get('status') == 'source-first' and row.get('kind') == 'VarDecl'
                and row.get('linkage') == 'internal' and re.search(r'\bconst\b', spelling)
                and not re.search(r'\bvolatile\b|[*&]', spelling)
                and (not private and scalar or private.get('owner_source') == source)
                and private == previous.get('private_storage', {})
                and spelling == previous.get('original_type') and proof and old_proof
                and all(proof.get(key) == old_proof.get(key) for key in identity)
                and proof.get('translation_unit') == source and (numeric_array or scalar and not private)):
            eligible[row['name']] = row
    if not eligible:
        return {}, []
    manifest = json.loads(owner_module.with_suffix('.manifest.json').read_text(encoding='utf-8'))
    if manifest.get('source') != source or manifest.get('native_pointer_abi') != 'source-lp64-addresses/2':
        return {}, []
    exported = active_exports(owner_module)
    eligible = {name: row for name, row in eligible.items()
                if name in exported and (not row.get('private_storage')
                                         or row['private_storage']['binding'] in exported)}
    if not eligible:
        return {}, []
    root = owner_module.parents[len(Path(source).parts) - 1]
    files = {owner_module: owner_module.read_bytes()}
    for fragment in manifest.get('module_fragments', []):
        path = (root / fragment['module']).resolve()
        if path.parent != owner_module.parent.resolve():
            raise ValueError('Original header storage fragment escapes its source owner')
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != fragment['sha256']:
            raise ValueError('Original header storage fragment content changed')
        files[path] = data
    specs = {name: ({'array': row['private_storage']['scalar_array']['array'],
                    'length': row['private_storage']['scalar_array']['dims'][0]}
                   if row.get('private_storage', {}).get('scalar_array') else {})
             for name, row in eligible.items()}
    result = subprocess.run(['node', '--input-type=module', '-e', PARSER], cwd=ROOT,
                            input=json.dumps({'files': [data.decode('utf-8') for data in files.values()] + [current_code],
                                              'specs': specs}), capture_output=True, text=True, timeout=120)
    if result.returncode:
        raise ValueError('Original header constant initializer parse failed: ' + result.stderr[-1600:])
    parsed = json.loads(result.stdout)
    borrowed, proofs = {}, []
    for name, row in eligible.items():
        previous = [entry for entry in parsed if entry['name'] == name and entry['fileIndex'] < len(files)]
        current = [entry for entry in parsed if entry['name'] == name and entry['fileIndex'] == len(files)]
        if (len(previous) != 1 or len(current) != 1
                or previous[0]['initializer'] != current[0]['initializer']
                or previous[0]['helpers'] != current[0]['helpers']):
            continue
        borrowed[name] = old_values[name]
        proofs.append({'abi': ('source-immutable-header-array-reattestation/1' if row.get('private_storage')
                              else 'source-immutable-header-scalar-reattestation/1'), 'name': name,
                       'original_header': row['header_global_definition'],
                       'private_storage': row.get('private_storage'),
                       'initializer_sha256': hashlib.sha256(current[0]['initializer'].encode()).hexdigest(),
                       'scalar_helper_sha256': {key: hashlib.sha256(value.encode()).hexdigest()
                                                for key, value in current[0]['helpers'].items()},
                       'owner_code_sha256': {path.relative_to(root).as_posix(): hashlib.sha256(data).hexdigest()
                                             for path, data in files.items()}})
    if any(path.read_bytes() != data for path, data in files.items()):
        raise ValueError('Original header storage owner changed during reattestation')
    return borrowed, proofs
