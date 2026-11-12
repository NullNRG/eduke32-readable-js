"""Give expanded native parameter declarations distinct JavaScript bindings."""
def unique_parameters(function,identifier):
    parameters=[n for n in function.get('inner',[]) if n.get('kind')=='ParmVarDecl']
    def walk(node):
        yield node
        for child in node.get('inner',[]):
            if child:yield from walk(child)
    reserved={identifier(n.get('name','')) for n in walk(function) if n.get('name')}
    reserved|={identifier(n['referencedDecl']['name']) for n in walk(function)
               if n.get('referencedDecl',{}).get('name')}
    seen=set();bindings={};proof=[]
    identities=[p.get('id') for p in parameters]
    for index,parameter in enumerate(parameters):
        name=identifier(parameter.get('name') or 'arg'+str(index))
        if name not in seen:seen.add(name);continue
        identity=parameter.get('id')
        if not identity or identities.count(identity)!=1:
            raise ValueError('duplicate parameter spelling lacks unique Clang declaration identity')
        candidate='__cxx_parameter_'+str(index)+'_'+name;serial=0
        while candidate in reserved or candidate in seen:
            serial+=1;candidate='__cxx_parameter_'+str(index)+'_'+name+'_'+str(serial)
        reserved.add(candidate);seen.add(candidate);bindings[identity]=candidate
        proof.append({'clang_id':identity,'original_name':parameter.get('name',''),
                      'emitted_name':candidate,'index':index,'original_type':parameter.get('type',{})})
    if not bindings:return function,[]
    def rewrite(node):
        result={**node}
        if node.get('kind')=='ParmVarDecl' and node.get('id') in bindings:result['name']=bindings[node['id']]
        reference=node.get('referencedDecl',{})
        if reference.get('kind')=='ParmVarDecl' and reference.get('id') in bindings:
            result['referencedDecl']={**reference,'name':bindings[reference['id']]}
        for key in ('inner','array_filler'):
            if key in node:result[key]=[rewrite(child) if child else child for child in node[key]]
        return result
    return rewrite(function),proof
