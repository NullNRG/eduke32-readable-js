"""External overload binding through exact Clang native function identities."""
import hashlib,json,re
from pathlib import Path
from source_field_bindings import body_semantic
ABI='source-clang-cpp-function-identity/1'
SELECTION='_source_cpp_function_selection'
BINDING='_source_cpp_function_binding'
def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)
def identity(node):
    mangled=node.get('mangledName','');typ=node.get('type',{}).get('qualType')
    if (node.get('kind')!='FunctionDecl' or not mangled.startswith('_Z')
        or mangled.startswith('_ZL') or node.get('storageClass')=='static' or not typ):return None
    return {'abi':ABI,'mangled_name':mangled,'original_type':typ,'source_name':node.get('name')}
def sites(ast,names):
    for tree in ast:
        for owner in walk(tree):
            if owner.get('kind') not in ('FunctionDecl','CXXMethodDecl'):continue
            bodies=[node for node in owner.get('inner',[]) if node.get('kind')=='CompoundStmt']
            offset=owner.get('loc',{}).get('offset');mangled=owner.get('mangledName')
            if not mangled or not isinstance(offset,int) or len(bodies)!=1:continue
            references=[node for node in walk(bodies[0]) if node.get('kind')=='DeclRefExpr'
                and node.get('referencedDecl',{}).get('kind')=='FunctionDecl'
                and node['referencedDecl'].get('name') in names]
            if not references:continue
            digest=hashlib.sha256(json.dumps(body_semantic(bodies[0]),sort_keys=True,separators=(',',':')).encode()).hexdigest()
            for ordinal,reference in enumerate(references):
                yield (mangled,owner.get('type',{}).get('qualType'),offset,digest,ordinal),reference
def index(complete,names):
    result={}
    if not names:return result
    for tree in complete:
        if tree.get('kind')!='TranslationUnitDecl':continue
        declarations={node['id']:node for node in walk(tree) if node.get('kind')=='FunctionDecl' and node.get('id')}
        for key,reference in sites([tree],names):
            selected=reference.get('referencedDecl',{});declaration=declarations.get(selected.get('id'),{})
            proof=identity(declaration)
            if (proof and declaration.get('name')==selected.get('name')
                and declaration.get('type',{}).get('qualType')==selected.get('type',{}).get('qualType')):
                result.setdefault(key,{})[json.dumps(proof,sort_keys=True)]=proof
    return result
def rebind(ast,proofs,names):
    for key,reference in sites(ast,names):
        choices=proofs.get(key,{})
        if len(choices)==1:reference['referencedDecl'][SELECTION]=next(iter(choices.values()))
def load(root,owners):
    if root is None:return {}
    from source_first_global_link import exported_names
    root=Path(root).resolve();result={};exports={}
    for path in root.rglob('*.manifest.json'):
        doc=json.loads(path.read_text(encoding='utf-8'));source=doc.get('source')
        if not source:continue
        for row in doc.get('definitions',[]):
            name=row.get('name','');proof=row.get('cpp_function_identity',{})
            if (row.get('status')!='source-first' or row.get('kind')!='FunctionDecl'
                or row.get('linkage')!='external' or owners.get(name)!=source
                or not re.search(r'__cxx_[0-9a-f]{12}$',name)
                or proof.get('abi')!=ABI or proof.get('source_name')!=row.get('source_name')
                or proof.get('original_type')!=row.get('original_type')):continue
            module=root/(source+'.mjs')
            if module not in exports:exports[module]=exported_names(module)
            if name not in exports[module]:continue
            key=json.dumps(proof,sort_keys=True)
            result.setdefault(key,{})[(source,name)]={'name':name,'from':source,'identity':proof}
    return {key:next(iter(choices.values())) for key,choices in result.items() if len(choices)==1}
def bind(ast,contracts,local_ids):
    if not contracts:return
    names={proof['identity']['source_name'] for proof in contracts.values()}
    rebind(ast,index(ast,names),names)
    for tree in ast:
        for reference in walk(tree):
            if reference.get('kind')!='DeclRefExpr':continue
            declaration=reference.get('referencedDecl',{})
            if declaration.get('kind')!='FunctionDecl' or declaration.get('id') in local_ids:continue
            declaration.pop(BINDING,None)
            selected=declaration.get(SELECTION)
            proof=contracts.get(json.dumps(selected,sort_keys=True)) if selected else None
            if proof:declaration[BINDING]=proof
def import_error(dependency,units,export_reader):
    expected=dependency.get('cpp_function_identity')
    if expected is None:return None
    provider=units.get(dependency['from'])
    if not provider:return 'C++ function identity provider missing'
    rows=[row for row in provider['manifest'].get('definitions',[]) if row.get('name')==dependency['name'] and row.get('status')=='source-first']
    if (len(rows)!=1 or rows[0].get('kind')!='FunctionDecl' or rows[0].get('linkage')!='external'
        or expected.get('abi')!=ABI or rows[0].get('cpp_function_identity')!=expected
        or rows[0].get('original_type')!=expected.get('original_type')
        or dependency['name'] not in export_reader(provider['module'])):
        return 'C++ function identity/type/export differs from Clang-selected provider'
    return None
