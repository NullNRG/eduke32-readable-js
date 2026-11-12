"""Source-defined nonvirtual C++ instance methods with an explicit JS this ABI.

Original class construction/storage remains with its existing provider. Calls
select a source function by Clang declaration/mangling, never by JS name/arity.
The thunk is called with Function.call over the original object/view; it does
not fabricate a prototype, allocate another receiver, or copy its storage.
"""
import copy
import hashlib
import re
from pathlib import Path

ABI='source-instance-method-this/1'

def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)

def symbol(method):
    name=method.get('name','');mangled=method.get('mangledName','')
    if not re.fullmatch(r'[A-Za-z_]\w*',name) or not re.fullmatch(r'_Z[A-Za-z0-9_]+',mangled):return None
    return name+'__cxx_instance_'+hashlib.sha256(mangled.encode()).hexdigest()[:20]

def recover(ast,source_root,source_rel,prove_header):
    if not source_root:return [],{}
    root=Path(source_root).resolve();path=(root/source_rel).resolve()
    if not path.is_relative_to(root) or not path.is_file():return [],{}
    data=path.read_bytes();records={};declarations={};bodies={};contexts={}
    def visit(node,scope=(),anonymous=False):
        kind=node.get('kind');name=node.get('name')
        if kind=='NamespaceDecl':
            anonymous=anonymous or not name
            if name:scope=(*scope,name)
        if kind=='CXXRecordDecl' and node.get('completeDefinition') and name:
            records[node.get('id')]=node
            contexts[node.get('id')]=('::'.join((*scope,name)),anonymous)
            for member in node.get('inner',[]):
                if member.get('kind')=='CXXMethodDecl' and member.get('id'):
                    declarations[member['id']]=(node,member)
            scope=(*scope,name)
        if kind=='CXXMethodDecl' and node.get('id'):
            bodies[node['id']]=node
        for child in node.get('inner',[]):
            if child:visit(child,scope,anonymous)
    for tree in ast:visit(tree)
    bindings={};outputs=[];seen=set()
    for identity,(record,decl) in declarations.items():
        owner=record.get('id');qualified,anonymous=contexts[owner]
        if (anonymous or record.get('bases') or record.get('definitionData',{}).get('isPolymorphic')
                or record.get('definitionData',{}).get('dtor',{}).get('trivial') is not True
                or any(m.get('kind') in ('CXXConstructorDecl','CXXDestructorDecl') and not m.get('isImplicit') for m in record.get('inner',[]))
                or decl.get('storageClass')=='static' or decl.get('virtual') or decl.get('pure')
                or decl.get('isImplicit') or decl.get('variadic') or not symbol(decl)):
            continue
        # Inline bodies keep the established original class/prototype ABI.
        if any(child.get('kind')=='CompoundStmt' for child in decl.get('inner',[])):continue
        proof=prove_header(record,root)
        if not proof:continue
        contract={'abi':ABI,'mangled_name':decl['mangledName'],
                  'owner':qualified,'declaration_type':decl.get('type',{}).get('qualType'),
                  'class_header_proof':proof}
        candidates=[];chain={identity}
        for _ in range(len(bodies)+1):
            extra={key for key,node in bodies.items() if node.get('previousDecl') in chain
                   and node.get('mangledName')==decl['mangledName']
                   and node.get('parentDeclContextId')==owner}
            if extra<=chain:break
            chain.update(extra)
        for key in chain:
            method=bodies.get(key,{})
            if not any(child.get('kind')=='CompoundStmt' for child in method.get('inner',[])):continue
            if method.get('name')!=decl.get('name') or method.get('mangledName')!=decl['mangledName']:continue
            loc=method.get('loc',{});offset=loc.get('offset');physical=loc.get('file')
            physical=(Path(physical) if Path(physical).is_absolute() else root/physical).resolve() if physical else None
            if (not isinstance(offset,int) or physical is not None and physical!=path
                    or physical is None and loc.get('includedFrom')
                    or data[offset:offset+len(decl['name'])]!=decl['name'].encode()):continue
            candidates.append(method)
        if len(candidates)>1:continue
        binding={'symbol':symbol(decl),'contract':contract,'declaration':decl}
        for key in chain:bindings[key]=binding
        decl['_source_external_instance_declaration']=ABI
        if not candidates:continue
        method=candidates[0];key=(method['mangledName'],method['loc']['offset'])
        if key in seen:continue
        seen.add(key)
        converted=copy.deepcopy(method)
        converted.update(kind='FunctionDecl',name=binding['symbol'],
            loc={**method['loc'],'file':source_rel,
                 'line':data[:method['loc']['offset']].count(b'\n')+1},
            _source_instance_member={'contract':contract,'name':decl['name'],
                'source_offset':method['loc']['offset'],
                'source_file_sha256':hashlib.sha256(data).hexdigest()})
        converted.pop('storageClass',None)
        outputs.append(converted)
    return outputs,bindings

def import_error(dependency,units,export_reader):
    expected=dependency.get('instance_method_contract')
    if expected is None:return None
    provider=units.get(dependency['from'])
    if not provider:return 'original instance-method provider missing'
    rows=[row for row in provider['manifest'].get('definitions',[])
          if row.get('name')==dependency['name'] and row.get('status')=='source-first']
    if (expected.get('abi')!=ABI or len(rows)!=1 or
            rows[0].get('original_instance_member',{}).get('contract')!=expected):
        return 'original instance method requires identical class declaration and selected ABI'
    module=provider.get('module')
    if not module or dependency.get('binding',dependency['name']) not in export_reader(module):
        return 'original instance method absent from actual provider JavaScript'
    return None
