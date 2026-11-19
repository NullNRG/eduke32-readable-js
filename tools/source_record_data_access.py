"""Separate native field storage from optional JS class-method prototypes.

Only direct scalar/pointer field expressions qualify. Whole-object use,
construction, method calls and unknown member declarations remain strict.
"""
import copy,hashlib,json,re
from source_scalar_types import scalar_info
from source_cpp_types import has_outer_indirection

LAYOUT_ABI='source-record-field-storage/1'
ACCESS_ABI='source-record-field-access/1'

def physical_schema(schema):
    result=copy.deepcopy(schema);result.pop('prototype',None)
    for field in result.get('fields',{}).values():
        for key in ('byteRecord','recordArray'):
            if key in field:field[key]=physical_schema(field[key])
    return result

def layout_contract(schema,*,preserve_nested_prototypes=False):
    # A JavaScript prototype is not an in-object C++ vptr. All actual native
    # fields, offsets, widths, alignment, unions and projection flags remain.
    physical=({key:value for key,value in schema.items() if key!='prototype'}
              if preserve_nested_prototypes else physical_schema(schema))
    return {'abi':LAYOUT_ABI,'sha256':hashlib.sha256(json.dumps(physical,sort_keys=True).encode()).hexdigest()}

def scalar_or_pointer_type(spelling):
    if scalar_info(spelling):return True
    if '::*' in ''.join(spelling.split()) or not has_outer_indirection(spelling,'*'):return False
    # A star inside template arguments is not a pointer declarator. Keep
    # member pointers, references and pointer-to-array fields conservative.
    return bool(re.search(r'\*\s*(?:(?:const|volatile|restrict|__restrict)\s*)*$',spelling)
        or re.search(r'\(\s*\*\s*(?:(?:const|volatile)\s*)*\)\s*\(',spelling))

def field_access_contract(tree,identifiers,declarations,resolve_type):
    parents={};references=[];pending=[tree]
    while pending:
        node=pending.pop()
        if node.get('kind')=='DeclRefExpr' and node.get('referencedDecl',{}).get('id') in identifiers:
            references.append(node)
        for child in node.get('inner',[]):
            parents[id(child)]=node;pending.append(child)
    if not references:return None
    accesses=[]
    for ref in references:
        node=ref;path=[]
        while True:
            parent=parents.get(id(node),{})
            if parent.get('kind') in ('ParenExpr','ImplicitCastExpr'):
                if parent.get('kind')=='ImplicitCastExpr' and parent.get('castKind') not in ('NoOp','LValueToRValue'):return None
                node=parent;continue
            if parent.get('kind')!='MemberExpr':break
            member=parent.get('_source_member_declaration') or declarations.get(parent.get('referencedMemberDecl'),{})
            if member.get('kind')!='FieldDecl':return None
            path.append({'id':member.get('id'),'name':parent.get('name')})
            node=parent
        if not path:return None
        typ=node.get('type',{}).get('desugaredQualType') or node.get('type',{}).get('qualType','')
        typ=resolve_type(typ)
        if not scalar_or_pointer_type(typ):return None
        accesses.append({'clang_reference_id':ref['referencedDecl']['id'],'fields':path,'result_type':typ})
    return {'abi':ACCESS_ABI,'reference_count':len(references),'accesses':accesses}

def compatible(dependency,provider):
    layout=dependency.get('byte_record_native_layout');actual=provider.get('byte_record_native_layout')
    access=dependency.get('byte_record_data_access',{})
    if not isinstance(layout,dict) or not isinstance(actual,dict):return False
    if layout.get('abi')!=LAYOUT_ABI or actual.get('abi')!=LAYOUT_ABI:return False
    digest=layout.get('sha256')
    if not isinstance(digest,str) or not re.fullmatch(r'[a-f0-9]{64}',digest) or digest!=actual.get('sha256'):return False
    uses=access.get('accesses',[])
    if access.get('abi')!=ACCESS_ABI or not uses or access.get('reference_count')!=len(uses):return False
    return all(use.get('clang_reference_id') and use.get('fields') and all(
        field.get('id') and re.fullmatch(r'[A-Za-z_]\w*',field.get('name','')) for field in use['fields'])
        and scalar_or_pointer_type(use.get('result_type','')) for use in uses)
