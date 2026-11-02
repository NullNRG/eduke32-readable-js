"""Original constructors over one native allocation; no implicit copying.

This deliberately narrow lifetime domain has one nonvirtual base at offset zero
and Clang-trivial destruction. Every initialization is the selected original
CXXCtorInitializer/body, recursively including base and member constructors.
"""
import copy
import hashlib
import json
import re
from pathlib import Path
from source_cpp_references import function_type_parts


def walk(node):
    yield node
    for child in node.get('inner', []):
        if child:yield from walk(child)


def spelling(node):
    typ=node.get('type', {})
    return typ.get('desugaredQualType') or typ.get('qualType', '')


def recover(ast, candidates, views, aliases, normalize, source_root, source_rel, header_bytes):
    records={}
    full_records={id(node) for tree in ast if tree.get('kind')=='TranslationUnitDecl'
        for node in walk(tree) if node.get('kind')=='CXXRecordDecl'}
    def visit(node, scope=()):
        if node.get('kind')=='NamespaceDecl' and node.get('name'):scope=(*scope,node['name'])
        if node.get('kind')=='CXXRecordDecl' and node.get('completeDefinition'):
            names={node.get('name'),node.get('_source_record_name'),node.get('_source_record_qualified_name'),
                   *node.get('_source_self_type_spellings',[])}
            if node.get('name'):names.add('::'.join((*scope,node['name'])))
            for name in names:
                if name:records.setdefault(normalize(name,aliases),[]).append(node)
        for child in node.get('inner',[]):
            if child:visit(child,scope)
    for tree in ast:visit(tree)
    def record_for(name):
        choices=records.get(name,[])
        identities={(r.get('id'),r.get('loc',{}).get('offset')) for r in choices}
        return choices[0] if len(identities)==1 else None
    files=None
    def proof(record,ctor):
        nonlocal files
        if files is None:files=header_bytes()
        loc=ctor.get('loc',{});rloc=record.get('loc',{})
        offset=loc.get('offset');roffset=rloc.get('offset')
        token=record.get('_source_template_name',record.get('name',''))
        start=ctor.get('range',{}).get('begin',{}).get('offset')
        end=ctor.get('range',{}).get('end',{}).get('offset')
        rend=record.get('range',{}).get('end',{}).get('offset')
        if not token or not all(isinstance(n,int) for n in (offset,roffset,start,end,rend)):return None
        physical=loc.get('file') or rloc.get('file');matches={}
        for path,data in files:
            path=Path(path).resolve()
            if physical:
                expected=Path(physical)
                expected=(expected if expected.is_absolute() else Path(source_root)/expected).resolve()
                if path!=expected:continue
            if not roffset<=start<=offset<=end<=rend<len(data):continue
            if data[roffset:roffset+len(token)]!=token.encode():continue
            if data[offset:offset+len(token)]!=token.encode():continue
            if loc.get('line') and data[:offset].count(b'\n')+1!=loc['line']:continue
            matches[path]=data
        if len(matches)!=1:return None
        path,data=next(iter(matches.items()));root=Path(source_root).resolve()
        return {'abi':'source-byte-constructor/1','source_header':path.relative_to(root).as_posix()
                if path.is_relative_to(root) else path.as_posix(),
                'source_offset':offset,'source_line':data[:offset].count(b'\n')+1,
                'header_sha256':hashlib.sha256(data).hexdigest(),'mangled_name':ctor.get('mangledName'),
                'original_type':spelling(ctor),'original_ast_kind':'CXXConstructorDecl',
                'implicit':bool(ctor.get('isImplicit')),'translation_unit':source_rel,
                'destruction':'clang-trivial','copy_semantics_granted':False}
    helpers={};active=set();native_classes=set()
    def plan(name,signature):
        key=(name,signature)
        if key in helpers:return helpers[key]
        if key in active:return None
        record=record_for(name);schema=views.get(name,{}).get('byte_schema')
        if not record or not schema or not record.get('definitionData',{}).get('dtor',{}).get('trivial'):return None
        ctors=[c for c in record.get('inner',[]) if c.get('kind')=='CXXConstructorDecl' and spelling(c)==signature]
        if len(ctors)!=1:return None
        ctor=ctors[0]
        if ctor.get('explicitlyDeleted') or ctor.get('isDeleted') or ctor.get('explicitlyDefaulted')=='deleted':return None
        body=[c for c in ctor.get('inner',[]) if c.get('kind')=='CompoundStmt']
        evidence=proof(record,ctor)
        if len(body)!=1 or not evidence or not evidence['mangled_name']:return None
        # A selected copy/move or variadic constructor requires a separate ABI.
        parts=function_type_parts(signature)
        if not parts or '...' in parts[1]:return None
        params=[c for c in ctor.get('inner',[]) if c.get('kind')=='ParmVarDecl']
        if any(normalize(spelling(p).rstrip(' &'),aliases)==name for p in params):return None
        fields={f.get('id'):f for f in record.get('inner',[]) if f.get('kind')=='FieldDecl'}
        digest=hashlib.sha256((source_rel+'\0'+evidence['mangled_name']+'\0'+json.dumps(schema,sort_keys=True)).encode()).hexdigest()[:20]
        receiver='__source_this_'+digest
        this={'kind':'CXXThisExpr','type':{'qualType':name+' *'}}
        statements=[];active.add(key)
        try:
            for init in ctor.get('inner',[]):
                if init.get('kind')!='CXXCtorInitializer':continue
                values=init.get('inner',[])
                if len(values)!=1:return None
                value=values[0]
                if init.get('delegatingInit'):return None
                if init.get('baseInit'):
                    bases=schema.get('bases',[])
                    if len(bases)!=1 or bases[0]['offset']!=0:return None
                    target=normalize(spelling({'type':init['baseInit']}),aliases)
                    destination=copy.deepcopy(this)
                else:
                    field=fields.get(init.get('anyInit',{}).get('id'))
                    if not field or not field.get('name') or field['name'] not in schema['fields']:return None
                    target=normalize(spelling(field),aliases)
                    destination={'kind':'MemberExpr','isArrow':True,'name':field['name'],
                        'type':copy.deepcopy(field['type']),'referencedMemberDecl':field['id'],'inner':[copy.deepcopy(this)]}
                    if value.get('kind')=='CXXDefaultInitExpr':
                        defaults=field.get('inner',[])
                        if not field.get('hasInClassInitializer') or len(defaults)!=1:return None
                        value=defaults[0]
                if value.get('kind')=='CXXConstructExpr':
                    child=plan(target,value.get('ctorType',{}).get('qualType',''))
                    if not child:return None
                    statements.append({'kind':'SourceByteConstructInPlaceExpr','helper':child['name'],
                        'inner':[destination,*copy.deepcopy(value.get('inner',[]))]})
                elif init.get('baseInit'):return None
                else:
                    # Scalar initialization writes its exact original field.
                    field_schema=schema['fields'][field['name']]
                    if not (field_schema.get('pointer') or field_schema.get('native')) or field_schema.get('length') is not None:return None
                    statements.append({'kind':'BinaryOperator','opcode':'=','type':copy.deepcopy(field['type']),
                        'inner':[destination,copy.deepcopy(value)]})
            statements.extend(copy.deepcopy(body[0].get('inner',[])))
            helper={'id':'byte-ctor-'+digest,'kind':'FunctionDecl','name':'__source_byte_ctor_'+digest,
                'loc':copy.deepcopy(ctor.get('loc',{})),'storageClass':'static',
                'type':{'qualType':'void ('+', '.join([name+' *',*parts[1]])+')'},
                'inner':[{'id':'ctor-this-'+digest,'kind':'ParmVarDecl','name':receiver,'type':{'qualType':name+' *'}},
                    *copy.deepcopy(params),{'kind':'CompoundStmt','inner':statements}],
                '_source_this_parameter':receiver,'_source_byte_method_full_body':id(record) in full_records,
                '_source_byte_constructor':{**evidence,'receiver_schema':schema}}
            # Specialization-private typedefs are resolved only in this helper.
            helper['_source_method_type_aliases']={c['name']:spelling(c) for c in record.get('inner',[])
                if c.get('kind') in ('TypedefDecl','TypeAliasDecl') and c.get('name')}
            helpers[key]=helper
            return helper
        finally:active.remove(key)
    for candidate in candidates:
        for node in walk(candidate):
            if node.get('kind')!='CXXNewExpr' or node.get('isArray') or node.get('isPlacement'):continue
            values=node.get('inner',[])
            if len(values)!=1 or values[0].get('kind')!='CXXConstructExpr':continue
            construct=values[0];name=normalize(spelling(construct),aliases);record=record_for(name)
            # Avoid replacing the established managed-class domain. Only the
            # previously unsupported single-base byte-backed domain enters.
            if not record or len(record.get('bases',[]))!=1:continue
            helper=plan(name,construct.get('ctorType',{}).get('qualType',''))
            if helper:
                node['_source_byte_constructor_call']={'name':helper['name'],'record_name':name,
                    'schema':views[name]['byte_schema']}
                native_classes.add(name)
    # Failed plans may have proved descendants. Keep only the helper closure
    # actually used by a successful original allocation.
    selected=set()
    def retain(name):
        if name in selected:return
        selected.add(name)
        for helper in helpers.values():
            if helper['name']==name:
                for node in walk(helper):
                    if node.get('kind')=='SourceByteConstructInPlaceExpr':retain(node['helper'])
    for candidate in candidates:
        for node in walk(candidate):
            if node.get('_source_byte_constructor_call'):retain(node['_source_byte_constructor_call']['name'])
    return [h for h in helpers.values() if h['name'] in selected],native_classes
