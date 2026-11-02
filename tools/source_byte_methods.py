"""Borrowed native objects: exact original nonvirtual method bodies.

These TU-local ABI thunks receive existing byte views, not new C++ objects.
They grant no construction, copying, lifetime or virtual-dispatch semantics.
"""
import copy
import hashlib
import json
import re
from pathlib import Path
from source_cpp_references import function_type_parts


def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)


def recover(ast,candidates,views,aliases,normalize,source_root,source_rel,header_bytes):
    """Only exact Clang member IDs can select a body; names never select one."""
    methods={}
    full_calls=set();full_methods=set()
    for root in ast:
        if root.get('kind')!='TranslationUnitDecl':continue
        for node in walk(root):
            if node.get('kind')=='CXXMemberCallExpr':full_calls.add(id(node))
            if node.get('kind')=='CXXMethodDecl':full_methods.add(id(node))
    managed={record.get('name') for root in ast for record in walk(root)
        if record.get('kind')=='CXXRecordDecl' and record.get('completeDefinition') and any(
            member.get('kind') in ('CXXConstructorDecl','CXXDestructorDecl') and not member.get('isImplicit')
            and any(child.get('kind')=='CompoundStmt' for child in member.get('inner',[]))
            for member in record.get('inner',[]))}
    for root in ast:
        for record in walk(root):
            if record.get('kind')!='CXXRecordDecl' or not record.get('completeDefinition'):continue
            for method in record.get('inner',[]):
                if method.get('kind')=='CXXMethodDecl' and method.get('id'):
                    methods.setdefault(method['id'],[]).append((record,method))
    def spelling(node):
        typ=node.get('type',{})
        return typ.get('desugaredQualType') or typ.get('qualType','')
    def owner(node):return normalize(spelling(node).strip().rstrip('*&').strip(),aliases)
    def raw(node,arrow,force_this):
        stripped=node
        while stripped.get('kind') in ('ImplicitCastExpr','ParenExpr','ExprWithCleanups','MaterializeTemporaryExpr') and len(stripped.get('inner',[]))==1:
            stripped=stripped['inner'][0]
        if force_this and stripped.get('kind')=='CXXThisExpr':return True
        if arrow:
            name=owner(node)
            return name in views and name not in managed
        if stripped.get('kind')=='UnaryOperator' and stripped.get('opcode')=='*':
            return raw(stripped['inner'][0],True,force_this)
        if stripped.get('kind')=='MemberExpr' and stripped.get('inner') and not spelling(stripped).rstrip().endswith(('*','&')):
            return raw(stripped['inner'][0],stripped.get('isArrow',False),force_this)
        return False
    files=None
    def proof(record,method):
        nonlocal files
        loc=method.get('loc',{});offset=loc.get('offset');name=method.get('name','')
        record_loc=record.get('loc',{});record_offset=record_loc.get('offset')
        record_name=record.get('_source_template_name',record.get('name',''))
        if not isinstance(offset,int) or not isinstance(record_offset,int):return None
        # Require the actual selected method AND enclosing record tokens in
        # one physical source, including when Clang elides repeated filenames.
        if files is None:files=header_bytes()
        physical=loc.get('file') or record_loc.get('file')
        matches=[]
        for path,data in files:
            if physical:
                requested=Path(physical)
                requested=(requested if requested.is_absolute() else Path(source_root)/requested).resolve()
                if Path(path).resolve()!=requested:continue
            if data[offset:offset+len(name)]!=name.encode():continue
            if data[record_offset:record_offset+len(record_name)]!=record_name.encode():continue
            if loc.get('line') is not None and data[:offset].count(b'\n')+1!=loc['line']:continue
            if loc.get('col') is not None and offset-data.rfind(b'\n',0,offset)!=loc['col']:continue
            start_loc=method.get('range',{}).get('begin',{})
            end_loc=method.get('range',{}).get('end',{})
            begin=start_loc.get('expansionLoc',start_loc).get('offset')
            end=end_loc.get('expansionLoc',end_loc).get('offset')
            record_end=record.get('range',{}).get('end',{}).get('offset')
            if not all(isinstance(v,int) for v in (begin,end,record_end)):continue
            if not record_offset<=begin<=offset<=end<=record_end<len(data):continue
            matches.append((Path(path).resolve(),data))
        if len(matches)!=1:return None
        path,data=matches[0];root=Path(source_root).resolve()
        return {'source_header':path.relative_to(root).as_posix() if path.is_relative_to(root) else path.as_posix(),
            'source_offset':offset,'source_line':data[:offset].count(b'\n')+1,
            'header_sha256':hashlib.sha256(data).hexdigest(),'mangled_name':method['mangledName'],
            'original_type':spelling(method),'original_name':name,
            'original_ast_kind':'CXXMethodDecl','translation_unit':source_rel,
            'abi':'source-byte-instance-method/1'}
    pending=list(candidates);added=[];known={}
    while pending:
        candidate=pending.pop();force_this=bool(candidate.get('_source_this_parameter'))
        for call in walk(candidate):
            if call.get('kind')!='CXXMemberCallExpr' or not call.get('inner'):continue
            callee=call['inner'][0]
            if callee.get('kind')!='MemberExpr' or len(callee.get('inner',[]))!=1:continue
            selection=callee.get('_source_member_declaration')
            if not selection and id(call) not in full_calls and not candidate.get('_source_byte_method_full_body'):continue
            receiver=callee['inner'][0]
            if not raw(receiver,callee.get('isArrow',False),force_this):continue
            name=owner(receiver);view=views.get(name,{}).get('byte_schema')
            if not view:continue
            choices=methods.get(callee.get('referencedMemberDecl'),[])
            bodies=[(record,method) for record,method in choices
                if any(child.get('kind')=='CompoundStmt' for child in method.get('inner',[]))]
            # Identical repeated AST roots are fine; conflicting selected
            # declarations are not. Mangling and exact source offsets agree.
            identities={(method.get('mangledName'),spelling(method),method.get('loc',{}).get('offset')) for _,method in bodies}
            if len(identities)!=1 or not bodies:continue
            record,method=bodies[0]
            if callee.get('name')!=method.get('name'):continue
            if selection and (selection.get('kind')!='CXXMethodDecl' or
                    spelling(selection)!=spelling(method) or selection.get('loc',{}).get('offset')!=method.get('loc',{}).get('offset')):continue
            if (not method.get('mangledName') or method.get('virtual') or method.get('pure')
                    or method.get('storageClass')=='static' or method.get('variadic')
                    or not re.fullmatch(r'[A-Za-z_]\w*',method.get('name',''))):continue
            if any(node.get('kind')=='VarDecl' and node.get('storageClass')=='static' for node in walk(method)):continue
            parts=function_type_parts(spelling(method))
            if not parts or '&' in parts[0]:continue
            evidence=proof(record,method)
            if not evidence:continue
            schema_digest=hashlib.sha256(json.dumps(view,sort_keys=True).encode()).hexdigest()
            key=(method['mangledName'],schema_digest)
            helper=known.get(key)
            if helper is None:
                digest=hashlib.sha256((source_rel+'\0'+method['mangledName']+'\0'+schema_digest).encode()).hexdigest()[:20]
                helper_name='__source_byte_method_'+method['name']+'_'+digest
                receiver_name='__source_this_'+digest
                parameters=[copy.deepcopy(n) for n in method.get('inner',[]) if n.get('kind')=='ParmVarDecl']
                self_type=spelling(receiver).strip().rstrip('*&').strip()+' *'
                parameters.insert(0,{'id':'byte-this-'+digest,'kind':'ParmVarDecl','name':receiver_name,'type':{'qualType':self_type}})
                helper={'id':'byte-method-'+digest,'kind':'FunctionDecl','name':helper_name,
                    'type':{'qualType':parts[0]+' ('+', '.join([self_type,*parts[1]])+')'},
                    'loc':copy.deepcopy(method.get('loc',{})),'storageClass':'static',
                    'inner':parameters+[copy.deepcopy(n) for n in method['inner'] if n.get('kind')=='CompoundStmt'],
                    '_source_this_parameter':receiver_name,
                    '_source_byte_method_full_body':id(method) in full_methods,
                    '_source_byte_method':{**evidence,'receiver_schema':view,'receiver_schema_sha256':schema_digest}}
                # A specialization's private typedef (e.g. __int_type) is
                # intentionally absent from the ambiguous source-wide map.
                # Its selected enclosing declaration proves the local alias.
                local_aliases={};conflicts=set()
                for declaration in record.get('inner',[]):
                    if declaration.get('kind') not in ('TypedefDecl','TypeAliasDecl') or not declaration.get('name'):continue
                    typ=declaration.get('type',{})
                    value=typ.get('desugaredQualType') or typ.get('qualType')
                    alias=declaration['name']
                    if alias in local_aliases and local_aliases[alias]!=value:conflicts.add(alias)
                    if value:local_aliases[alias]=value
                helper['_source_method_type_aliases']={k:v for k,v in local_aliases.items() if k not in conflicts}
                def resolved_type(typ):
                    seen=set()
                    for _ in range(24):
                        if typ in seen:break
                        seen.add(typ)
                        replaced=re.sub(r'\b[A-Za-z_]\w*\b',lambda token:helper['_source_method_type_aliases'].get(token[0],token[0]),typ)
                        if replaced==typ:return typ
                        typ=replaced
                    return None
                method_type=resolved_type(spelling(method))
                resolved_parts=function_type_parts(method_type) if method_type else None
                if not resolved_parts:continue
                helper['_source_byte_method']['method_type']=method_type
                helper['type']={'qualType':resolved_parts[0]+' ('+', '.join([self_type,*resolved_parts[1]])+')'}
                for parameter in parameters[1:]:
                    resolved=resolved_type(spelling(parameter))
                    if resolved:parameter['type']={'qualType':resolved}
                known[key]=helper;added.append(helper);pending.append(helper)
            arguments=list(call['inner'][1:])
            call['_source_byte_method_call']={'name':helper['name'],'receiver_schema':view,'arguments':arguments,
                'method_type':helper['_source_byte_method']['method_type']}
            # Clang represents omitted arguments by empty expressions. Only
            # the selected original parameter initializer supplies their value.
            params=[n for n in method.get('inner',[]) if n.get('kind')=='ParmVarDecl']
            for index,arg in enumerate(arguments):
                if arg.get('kind')=='CXXDefaultArgExpr' and not arg.get('inner') and index<len(params):
                    values=params[index].get('inner',[])
                    if params[index].get('init') and len(values)==1:
                        arguments[index]={**arg,'inner':[copy.deepcopy(values[0])]}
    return added
