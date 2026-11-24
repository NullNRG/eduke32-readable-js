"""Reuse one original TU-private callable, never a name-only global alias."""
import hashlib,json,re
from pathlib import Path
from source_field_bindings import body_semantic

ABI='source-clang-tu-function-identity/1'
NATIVE='_source_tu_function_native'

def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)

def native(node):
    if node.get('kind')!='FunctionDecl' or node.get('storageClass')!='static':return None
    bodies=[v for v in node.get('inner',[]) if v.get('kind')=='CompoundStmt']
    mangled=node.get('mangledName');typ=node.get('type',{}).get('qualType')
    loc=node.get('loc',{});loc=loc.get('expansionLoc',loc);offset=loc.get('offset')
    if len(bodies)!=1 or not mangled or not typ or not isinstance(offset,int):return None
    return {'mangled_name':mangled,'original_type':typ,'source_name':node.get('name'),
            'source_offset':offset,'body_sha256':hashlib.sha256(json.dumps(
                body_semantic(bodies[0]),sort_keys=True,separators=(',',':')).encode()).hexdigest()}

def annotate(ast):
    # Freeze native shape before type/field/lowering annotations are applied.
    for tree in ast:
        for node in walk(tree):
            if NATIVE not in node:
                proof=native(node)
                if proof:node[NATIVE]=proof

def identity(node,source,inputs,origin=None):
    shape=node.get(NATIVE)
    if (not shape or shape['source_name']!=node.get('name')
            or shape['original_type']!=node.get('type',{}).get('qualType')
            or not inputs or not inputs.get('preprocessor_verified')):return None
    proof={'abi':ABI,'translation_unit':source,'preprocessor_sha256':inputs['sha256'],**shape}
    if origin:proof['original_definition']=origin
    return proof

def selected(node,contracts):
    choices=[c['identity'] for c in contracts.values() if c['identity'].get('abi')==ABI
             and c['identity'].get('mangled_name')==node.get('mangledName')
             and c['identity'].get('original_type')==node.get('type',{}).get('qualType')]
    if not choices:return None
    shape=node.get(NATIVE) or native(node)
    matches={json.dumps(p,sort_keys=True):p for p in choices
             if shape and all(p.get(k)==v for k,v in shape.items())}
    return next(iter(matches.values())) if len(matches)==1 else None

def implementation(module,manifest,name,export_reader):
    """Return the immutable defining shard's bytes, independent of its path.

    A direct owner retains its exact prefix when the installer appends source
    shard re-exports. Only those explicit declarations may follow the prefix.
    """
    module=Path(module).resolve();matches=[]
    if name not in export_reader(module):return None
    if re.search(r'(?m)^export function '+re.escape(name)+r'\s*\(',module.read_text(encoding='utf-8')):
        sections=module.read_bytes().split(b'\n// Original Clang-generated fragment; imports existing owner storage.\n')
        tail=rb'(?:export \{ [A-Za-z0-9_$, ]+ \} from "\./_source_(?:legacy|storage)_[A-Za-z0-9_.-]+\.mjs";\s*)+'
        if any(not re.fullmatch(tail,part) for part in sections[1:]):return None
        digest=hashlib.sha256(sections[0]).hexdigest()
        if manifest.get('emitted_module_sha256')!=digest:return None
        matches.append(digest)
    for fragment in manifest.get('module_fragments',[]):
        if name not in fragment.get('reexports',fragment.get('exports',[])):continue
        # Installer-owned shards must be adjacent to their original facade.
        path=module.parent/Path(fragment['module']).name
        if (Path(fragment['module']).parent!=Path(manifest['source']).parent
                or not path.is_file() or fragment.get('original_source')!=manifest.get('source')
                or hashlib.sha256(path.read_bytes()).hexdigest()!=fragment.get('sha256')):return None
        if (name in export_reader(path) and re.search(r'(?m)^export function '+re.escape(name)+r'\s*\(',
                                                     path.read_text(encoding='utf-8'))):
            matches.append(fragment['sha256'])
    return matches[0] if len(matches)==1 else None

def load(root,source,inputs,owners):
    if root is None or not inputs or not inputs.get('preprocessor_verified'):return {}
    from source_first_global_link import exported_names
    root=Path(root);module=root/(source+'.mjs');path=module.with_suffix('.manifest.json')
    if not module.is_file() or not path.is_file():return {}
    doc=json.loads(path.read_text(encoding='utf-8'))
    if doc.get('source')!=source or doc.get('native_pointer_abi')!='source-lp64-addresses/2':return {}
    result={}
    for row in doc.get('definitions',[]):
        p=row.get('cpp_function_identity',{});name=row.get('name','')
        if (row.get('status')!='source-first' or row.get('kind')!='FunctionDecl'
                or row.get('linkage')!='internal' or p.get('abi')!=ABI
                or p.get('translation_unit')!=source or p.get('preprocessor_sha256')!=inputs['sha256']
                or p.get('source_name')!=row.get('source_name') or p.get('original_type')!=row.get('original_type')
                or owners.get(name,source)!=source):continue
        digest=implementation(module,doc,name,exported_names)
        if not digest:continue
        key=json.dumps(p,sort_keys=True)
        value={'name':name,'from':source,'identity':p,'implementation_sha256':digest}
        if key in result:raise ValueError('Duplicate original TU callable identity: '+name)
        result[key]=value
    return result

def import_error(dependency,provider,export_reader):
    p=dependency['cpp_function_identity'];source=p.get('translation_unit')
    if (not provider or p.get('abi')!=ABI or source!=dependency.get('from')
            or source!=dependency.get('consumer_source') or provider['manifest'].get('source')!=source):
        return 'TU-private callable cannot cross original translation-unit ownership'
    rows=[r for r in provider['manifest'].get('definitions',[])
          if r.get('name')==dependency['name'] and r.get('status')=='source-first']
    if (len(rows)!=1 or rows[0].get('linkage')!='internal' or rows[0].get('kind')!='FunctionDecl'
            or rows[0].get('cpp_function_identity')!=p
            or rows[0].get('original_type')!=p.get('original_type')):
        return 'TU-private callable differs from original Clang body/type/context'
    if implementation(provider['module'],provider['manifest'],dependency['name'],export_reader)!=dependency.get('implementation_sha256'):
        return 'TU-private callable implementation bytes changed or are not uniquely owned'
    return None
