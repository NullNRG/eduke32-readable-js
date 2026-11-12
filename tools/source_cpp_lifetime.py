"""Clang-proven source classes with standalone, nonvirtual destructor lifetimes.

No ownership is inferred from a pointer field: constructors, moves and the
destructor execute their original bodies. Nested nontrivial subobjects, bases,
arrays and exceptional C++ control flow are deliberately excluded. Borrowed
lvalue reference fields retain source aliases and confer no object ownership.
"""
import hashlib
import re

def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)

def recover_lifetime_classes(ast, *, enable_owned_subobjects=False):
    records={};qualified={};origins={};external=[]
    def scan(node,scope=(),physical_file=None):
        kind=node.get('kind');name=node.get('name')
        physical_file=node.get('loc',{}).get('file') or physical_file
        if kind=='NamespaceDecl':
            if not name:return
            scope=(*scope,name)
        if kind=='CXXRecordDecl' and node.get('completeDefinition') and name:
            records.setdefault(name,[]).append(node)
            qualified[id(node)]='::'.join((*scope,name))
            origins[id(node)]=(physical_file,node.get('loc',{}).get('offset'))
        if kind in ('CXXDestructorDecl','CXXConstructorDecl','CXXMethodDecl') and node.get('parentDeclContextId'):
            external.append(node)
        child_scope=(*scope,name) if kind=='CXXRecordDecl' and node.get('completeDefinition') and name else scope
        for child in node.get('inner',[]):
            if child:scan(child,child_scope,physical_file)
    for root in ast:scan(root)
    # The redeclaration and owning context IDs must come from the SAME Clang
    # invocation. Name matching cannot prove an out-of-line special member.
    for definitions in records.values():
        for record in definitions:
            by_id={child.get('id'):child for child in record.get('inner',[]) if child}
            for member in external:
                if member.get('parentDeclContextId')!=record.get('id'):continue
                previous=by_id.get(member.get('previousDecl'))
                body=[child for child in member.get('inner',[]) if child.get('kind') in ('CompoundStmt','CXXCtorInitializer')]
                if not previous or not body or previous.get('kind')!=member.get('kind'):continue
                if previous.get('_source_external_instance_declaration'):continue
                if previous.get('type')!=member.get('type'):continue
                if any(child.get('kind')=='CompoundStmt' for child in previous.get('inner',[])):continue
                previous['inner']=[child for child in member.get('inner',[]) if child]
                previous['_source_out_of_line_definition']=member.get('loc',{})
    result={};aliases={};owned_candidates={}
    scalar=re.compile(r'^(?:(?:unsigned|signed) )?(?:bool|char|short|int|long|long long|float|double|wchar_t|[ui]?int(?:8|16|32|64)_t)$')
    for name,definitions in records.items():
        # Separate filtered Clang queries can repeat a record without its
        # NamespaceDecl parent. Prefer the parent-proven identity only when
        # the physical declaration is exactly the same original header byte.
        scoped=[record for record in definitions if qualified[id(record)]!=name]
        scoped_origins={origins[id(record)] for record in scoped}
        if scoped:
            definitions=[record for record in definitions if qualified[id(record)]!=name
                         or origins[id(record)] not in scoped_origins]
        identities={(qualified[id(record)],*origins[id(record)]) for record in definitions}
        if len(identities)!=1:continue
        record=definitions[0];traits=record.get('definitionData',{})
        fields=[child for child in record.get('inner',[]) if child.get('kind')=='FieldDecl']
        # Reference data members make even a simple scope guard non-standard-
        # layout. They need no native byte representation for standalone
        # source lifetimes; references are borrowed aliases, never copies.
        has_references=any(f.get('type',{}).get('qualType','').strip().endswith('&') for f in fields)
        if record.get('bases') or (not traits.get('isStandardLayout') and not has_references) or record.get('tagUsed')=='union':continue
        if any(not field.get('name') or field.get('isBitfield') for field in fields):continue
        owned_candidates[name]=(record,qualified[id(record)],fields)
        def safe_field(field):
            typ=field.get('type',{}).get('desugaredQualType') or field.get('type',{}).get('qualType','')
            if '[' in typ or '&&' in typ:return False
            if '&' in typ:
                if not typ.strip().endswith('&') or '(' in typ or ')' in typ:return False
                typ=typ.strip()[:-1].strip()
                if re.fullmatch(r'(?:const\s+)?(?:[A-Za-z_]\w*::)*[A-Za-z_]\w*(?:<[^;{}()]+>)?',typ):return True
            if '*' in typ:return True
            typ=re.sub(r'\b(?:const|volatile)\b','',typ).strip()
            return bool(scalar.fullmatch(typ))
        if not all(safe_field(field) for field in fields):continue
        members=record.get('inner',[])
        if any(member.get('virtual') or member.get('pure') for member in members):continue
        destructors=[member for member in members if member.get('kind')=='CXXDestructorDecl'
                     and any(child.get('kind')=='CompoundStmt' for child in member.get('inner',[]))]
        if len(destructors)!=1:continue
        if any(node.get('kind') in ('CXXThrowExpr','CXXTryStmt','CXXDeleteExpr','CXXNewExpr')
               for node in walk(record)):continue
        destructor=destructors[0]
        if 'noexcept' not in destructor.get('type',{}).get('qualType',''):continue
        fullname=qualified[id(record)]
        result[name]={'record':record,'destructor':destructor,
                      'destroy_symbol':'__cxx_destruct_'+hashlib.sha256(fullname.encode()).hexdigest()[:16],
                      'qualified_name':fullname,'field_types':{f['name']:f.get('type',{}) for f in fields},
                      'borrowed_reference_fields':[f['name'] for f in fields if f.get('type',{}).get('qualType','').strip().endswith('&')],
                      'constructors':{member.get('type',{}).get('qualType') for member in members
                          if member.get('kind')=='CXXConstructorDecl' and not member.get('isImplicit')
                          and member.get('explicitlyDefaulted')!='default'
                          and any(child.get('kind')=='CompoundStmt' for child in member.get('inner',[]))}}
        if fullname!=name:aliases[fullname]=name
    if enable_owned_subobjects:
        _recover_owned_subobjects(owned_candidates,result,aliases)
    return result,aliases


def _recover_owned_subobjects(candidates,result,aliases):
    """Opt-in destruction plans; consuming emitters MUST honor the contract.

    No child object is flattened or treated as a borrowed pointer. Construction
    must follow the original CXXCtorInitializer expressions in declaration
    order. A successfully constructed child is registered before constructing
    the next child; a failed constructor destroys only completed children.
    Destruction runs the owner's original body, then the listed reverse-order
    cleanup, recursively reversing every fixed array dimension.

    This is separate from native byte-layout support. Resolving a C++ lifetime
    does not authorize treating its class or std::array as raw scalar storage.
    """
    from copy import deepcopy
    from source_scalar_types import scalar_info

    def canonical(value):
        value=re.sub(r'\b(?:const|volatile|restrict|__restrict)\b',' ',value)
        value=re.sub(r'^(?:struct|class)\s+','',value.strip())
        return re.sub(r'\s*([<>,])\s*',r'\1',' '.join(value.split()))

    spellings={}
    for name,(record,fullname,_) in candidates.items():
        scope=fullname.rsplit('::',1)[0] if '::' in fullname else ''
        names={fullname,record.get('_source_record_qualified_name')}
        original=record.get('_source_record_name')
        if original:names.add((scope+'::' if scope else '')+original)
        for spelling in names-{None}:
            spellings.setdefault(canonical(spelling),set()).add(name)

    def resolve(spelling,owner):
        spelling=canonical(spelling)
        if '::' in spelling:
            values=spellings.get(spelling,set())
            return next(iter(values)) if len(values)==1 else None
        # Normal C++ lexical scope lookup, never a global bare-name match to
        # some similarly named record in an unrelated namespace.
        scope=owner.split('::')[:-1]
        while True:
            values=spellings.get('::'.join([*scope,spelling]),set())
            if values:return next(iter(values)) if len(values)==1 else None
            if not scope:return None
            scope.pop()

    def field_plan(field,owner):
        typ=field.get('type',{}).get('desugaredQualType') or field.get('type',{}).get('qualType','')
        dims=[int(value) for value in re.findall(r'\[(\d+)\]',typ)]
        base=re.sub(r'\[\d+\]','',typ).strip()
        if '[' in base or ']' in base or len(dims)>8:return None
        count=1
        for extent in dims:
            if extent<1:return None
            count*=extent
        if count>1000000:return None
        if '&' in base:
            # Reference arrays are ill-formed C++; do not use malformed AST
            # evidence to silently turn owned members into borrowed aliases.
            if dims or '&&' in base or not base.endswith('&'):return None
            return {'field':field['name'],'ownership':'borrowed-reference','type':typ}
        if '*' in base:
            return {'field':field['name'],'ownership':'borrowed-pointer','type':typ,'array_extents':dims}
        scalar=scalar_info(canonical(base))
        if scalar and scalar[0]!='extended-floating':
            return {'field':field['name'],'ownership':'scalar','type':typ,'array_extents':dims}
        child=resolve(base,owner)
        if child is None:return None
        declaration,fullname,_=candidates[child]
        traits=declaration.get('definitionData',{})
        trivial=traits.get('dtor',{}).get('trivial') is True
        if not trivial and child not in result:return None
        return {'field':field['name'],'ownership':'owned-record','type':typ,
            'record':child,'qualified_record':fullname,'array_extents':dims,
            'trivial_destructor':trivial,
            'destroy_symbol':None if trivial else result[child]['destroy_symbol']}

    pending=set(candidates)-set(result)
    while pending:
        progress=False
        for name in sorted(pending):
            record,fullname,fields=candidates[name]
            members=[member for member in record.get('inner',[]) if member]
            if any(member.get('virtual') or member.get('pure') for member in members):continue
            if any(node.get('kind') in ('CXXThrowExpr','CXXTryStmt','CXXDeleteExpr','CXXNewExpr')
                   for node in walk(record)):continue
            destructors=[member for member in members if member.get('kind')=='CXXDestructorDecl']
            if len(destructors)!=1:continue
            destructor=destructors[0]
            if destructor.get('isDeleted') or destructor.get('explicitlyDefaulted')=='deleted':continue
            if 'noexcept' not in destructor.get('type',{}).get('qualType',''):continue
            bodies=[child for child in destructor.get('inner',[]) if child.get('kind')=='CompoundStmt']
            implicit=bool(destructor.get('isImplicit') or destructor.get('explicitlyDefaulted')=='default')
            if len(bodies)>1 or not bodies and not implicit:continue
            plans=[field_plan(field,fullname) for field in fields]
            if any(plan is None for plan in plans):continue
            owned=[plan for plan in plans if plan['ownership']=='owned-record']
            cleanup=[plan for plan in reversed(owned) if not plan['trivial_destructor']]
            # An implicit/defaulted body can omit the semantic destruction of
            # fields in JSON AST. Accept it only with an explicit exact plan.
            if implicit and not cleanup:continue
            if not bodies:
                destructor=deepcopy(destructor)
                destructor.setdefault('inner',[]).append({'kind':'CompoundStmt','inner':[],
                    '_source_requires_owned_subobject_cleanup':True})
            result[name]={'record':record,'destructor':destructor,
                'destroy_symbol':'__cxx_destruct_'+hashlib.sha256(fullname.encode()).hexdigest()[:16],
                'qualified_name':fullname,'field_types':{f['name']:f.get('type',{}) for f in fields},
                'borrowed_reference_fields':[plan['field'] for plan in plans if plan['ownership']=='borrowed-reference'],
                'constructors':{member.get('type',{}).get('qualType') for member in members
                    if member.get('kind')=='CXXConstructorDecl' and not member.get('isImplicit')
                    and member.get('explicitlyDefaulted')!='default'
                    and any(child.get('kind')=='CompoundStmt' for child in member.get('inner',[]))},
                'owned_subobject_contract':'source-cpp-owned-subobjects/1',
                'implicit_destructor':implicit,'owned_subobjects':owned,
                'subobject_destruction':cleanup,'requires_owned_member_construction':True,
                'requires_subobject_cleanup':bool(cleanup),
                'construction_failure_cleanup':'reverse-completed-subobjects-only',
                'field_initialization_order':[plan['field'] for plan in plans]}
            if fullname!=name:aliases[fullname]=name
            progress=True
        pending-=set(result)
        if not progress:break
