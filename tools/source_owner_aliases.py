"""Retain legacy same-TU header names as aliases to the exact rebuilt body.

No implementation or storage is copied. This handles the compiler's explicit
header selection versus dependency-selection spelling during full-owner builds.
"""
import copy,hashlib,re

def retain_header_aliases(original,current,missing,code):
    if not missing:return current,code
    source=current.get('source')
    inputs=current.get('ast_cache_inputs')
    if (not source or original.get('source')!=source or not inputs or
            not inputs.get('preprocessor_verified') or original.get('ast_cache_inputs')!=inputs):
        raise ValueError('Legacy header aliases require identical complete original TU inputs')
    aliases=[]
    for name in sorted(missing):
        old=[row for row in original['definitions'] if row.get('name')==name and row.get('status')=='source-first']
        if len(old)!=1:raise ValueError('No unique original header alias declaration: '+name)
        old=old[0];spelling=old.get('source_name','');typ=old.get('original_type')
        expected=spelling+'__header_'+hashlib.sha256((source+'\0'+spelling+'\0'+str(typ)).encode()).hexdigest()[:12]
        if (old.get('kind')!='FunctionDecl' or old.get('linkage')!='internal' or name!=expected
                or not re.fullmatch(r'[A-Za-z_]\w*',spelling) or not isinstance(old.get('line'),int)):
            raise ValueError('Missing export is not a proven legacy internal header spelling: '+name)
        matches=[row for row in current['definitions'] if row.get('status')=='source-first'
            and row.get('kind')=='FunctionDecl' and row.get('source_name')==spelling
            and row.get('original_type')==typ and row.get('line')==old['line'] and row.get('linkage')=='internal']
        if len(matches)!=1 or not re.fullmatch(r'[A-Za-z_$][\w$]*',matches[0]['name']):
            raise ValueError('Rebuilt header declaration is missing or ambiguous: '+name)
        actual=matches[0]
        if old.get('physical_source') and actual.get('physical_source')!=old['physical_source']:
            raise ValueError('Rebuilt header physical declaration differs: '+name)
        proof={'canonical_name':actual['name'],'source_name':spelling,'line':old['line'],
            'original_type':typ,'same_tu_preprocessor_sha256':inputs['sha256'],
            'same_callable_identity':True,'additional_source_definition':False}
        aliases.append({**copy.deepcopy(actual),'name':name,'source_references':[actual['name']],
            'external_imports':[],'external_storage_imports':[],'external_reference_imports':[],
            'compiler_abi_alias':proof})
    doc=copy.deepcopy(current);doc['definitions'].extend(aliases)
    doc['source_definitions_emitted_before_abi_aliases']=current['emitted']
    doc['compiler_abi_aliases']=[{'name':row['name'],**row['compiler_abi_alias']} for row in aliases]
    doc['found']+=len(aliases);doc['emitted']+=len(aliases)
    return doc,code+'\n// Same original header functions; legacy ABI names retain callable identity.\n'+''.join(
        'export const '+row['name']+' = '+row['compiler_abi_alias']['canonical_name']+';\n' for row in aliases)
