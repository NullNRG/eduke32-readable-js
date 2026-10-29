"""Source-proven header aggregate prototypes and concrete template identities."""
import hashlib
from functools import lru_cache
import json
from pathlib import Path
import re

def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)

def normalize_specializations(ast):
    def namespaces(node,scope=()):
        if node.get('kind')=='NamespaceDecl' and node.get('name'):scope=(*scope,node['name'])
        if node.get('kind')=='ClassTemplateSpecializationDecl':node['_source_namespace']='::'.join(scope)
        for child in node.get('inner',[]):
            if child:namespaces(child,scope)
    for root in ast:namespaces(root)
    # A specialization is nested in its exact ClassTemplateDecl, but Clang
    # may omit its repeated physical filename. Its owning template proves
    # that filename when both declaration name and byte offset agree.
    for root in ast:
        for template in walk(root):
            if template.get('kind')!='ClassTemplateDecl':continue
            location=template.get('loc',{})
            if not location.get('file'):continue
            for child in template.get('inner',[]):
                loc=child.get('loc',{})
                if (child.get('kind')=='ClassTemplateSpecializationDecl' and
                        child.get('name')==template.get('name') and not loc.get('file') and
                        isinstance(loc.get('offset'),int) and loc['offset']==location.get('offset')):
                    loc['file']=location['file']
    for root in ast:
        for record in walk(root):
            if record.get('kind')!='ClassTemplateSpecializationDecl' or not record.get('completeDefinition'):
                continue
            args=[]
            for argument in record.get('inner',[]):
                if argument.get('kind')!='TemplateArgument':continue
                typ=argument.get('type',{}).get('qualType')
                if typ and not re.search(r'\b(?:type-parameter|auto)\b',typ):args.append(typ)
                elif argument.get('value') is not None:args.append(str(argument['value']))
                else:args=[];break
            name=record.get('name')
            if not name or not args:continue
            spelling=name+'<'+', '.join(args)+'>'
            record['_source_record_name']=spelling
            namespace=record.get('_source_namespace','')
            full=(namespace+'::' if namespace else '')+spelling
            record['_source_record_qualified_name']=full
            record['_source_template_name']=name
            # The selected specialization's own this-expressions carry exact
            # source spellings (including enum-valued template arguments).
            # Keep these aliases only under this owning Clang declaration;
            # never evaluate textual template expressions to guess identity.
            self_types=set()
            def selected_this(node):
                if node is not record and node.get('kind') in ('CXXRecordDecl','ClassTemplateSpecializationDecl','LambdaExpr'):
                    return
                if node.get('kind')=='CXXThisExpr':
                    typ=node.get('type',{}).get('qualType','').strip()
                    if typ.endswith('*'):
                        typ=typ[:-1].strip()
                        typ=re.sub(r'^(?:const\s+|volatile\s+)+','',typ)
                        self_types.add(typ)
                for child in node.get('inner',[]):
                    if child:selected_this(child)
            selected_this(record)
            record['_source_self_type_spellings']=sorted(self_types)
            record['name']='__cxx_record_'+name+'_'+hashlib.sha256(full.encode()).hexdigest()[:16]
            record['kind']='CXXRecordDecl'

def specialization_aliases(ast):
    found={}
    for root in ast:
        for node in walk(root):
            if not node.get('_source_record_name'):continue
            for spelling in (node['_source_record_name'],node.get('_source_record_qualified_name'),
                             *node.get('_source_self_type_spellings',[])):
                if spelling:found.setdefault(spelling,set()).add(node['name'])
    return {spelling:next(iter(names)) for spelling,names in found.items() if len(names)==1}


def specialization_layouts(ast, layouts):
    """Alias only exact Clang layout spellings of an identified specialization."""
    aliases=specialization_aliases(ast)
    found={}
    for spelling,name in aliases.items():
        if spelling in layouts:
            found.setdefault(name,[]).append(layouts[spelling])
    result={}
    for name,options in found.items():
        unique={json.dumps(layout,sort_keys=True):layout for layout in options}
        if len(unique)==1:
            layout=next(iter(unique.values()))
            if name not in layouts or layouts[name]==layout:result[name]=layout
    return result

@lru_cache(maxsize=1)
def _source_header_index(root_string):
    """Index original class/struct/union name offsets in one bounded pass.

    Clang sometimes supplies only `includedFrom` and a byte offset. Finding
    each header record used to scan *every* header for every record, which is
    particularly expensive in the 156-TU source build. Index (offset, name)
    once, then confirm each lookup against the exact original header bytes.
    The byte proof and ambiguity rule in ``header_proof`` remain authoritative.
    """
    root=Path(root_string)
    index={}
    pattern=re.compile(rb'(?:struct|class|union)\s*([A-Za-z_]\w*)')
    for path in sorted(root.rglob('*')):
        if not path.is_file() or path.suffix.lower() not in ('.h','.hpp','.hh','.hxx'):
            continue
        data=path.read_bytes()
        for found in pattern.finditer(data):
            offset=found.start(1)
            # Preserve the original 32-byte-before-offset proof restriction.
            if not re.search(rb'(?:struct|class|union)\s*$',data[max(0,offset-32):offset]):
                continue
            key=(offset,found.group(1))
            index.setdefault(key,[]).append((path,data))
    return index


def header_proof(node,source_root):
    if not source_root:return None
    loc=node.get('loc',{})
    offset=loc.get('offset')
    name=node.get('_source_template_name',node.get('name'))
    if not isinstance(offset,int) or not name:return None
    root=Path(source_root).resolve()
    physical=loc.get('file')
    if physical:
        path=Path(physical)
        path=(path if path.is_absolute() else root/path).resolve()
        pairs=((path,path.read_bytes()),) if path.is_file() and path.is_relative_to(root) else ()
    elif loc.get('includedFrom'):
        pairs=_source_header_index(str(root)).get((offset,name.encode()),())
    else:pairs=()
    matches=[]
    for path,data in pairs:
        if path.suffix.lower() not in ('.h','.hpp','.hh','.hxx'):continue
        if data[offset:offset+len(name)]!=name.encode():continue
        if not re.search(rb'(?:struct|class|union)\s*$',data[max(0,offset-32):offset]):continue
        matches.append((path,data))
        if len(matches)>1:return None
    if len(matches)!=1:return None
    path,data=matches[0]
    # Ignore use flags/ephemeral IDs but preserve exact specialized types,
    # selected source operations/callees and method bodies. Different method
    # instantiations remain ambiguous rather than claiming ODR equivalence.
    keys=('kind','name','opcode','value','castKind','isArrow','isPostfix','storageClass','valueCategory')
    def stable(n):
        out={key:n[key] for key in keys if key in n}
        if n.get('type'):out['type']={key:n['type'][key] for key in ('qualType','desugaredQualType') if key in n['type']}
        if n.get('referencedDecl'):
            ref=n['referencedDecl'];out['referencedDecl']={k:ref.get(k) for k in ('kind','name')}
            out['referencedDecl']['type']={key:ref.get('type',{})[key] for key in ('qualType','desugaredQualType') if key in ref.get('type',{})}
        # Implicit special-member declarations/bodies appear only when a TU
        # uses them. Their presence does not change the authored header type
        # or its explicit method implementations. Triviality is attested in
        # definitionData; source-defined special members stay in the digest.
        out['inner']=[stable(c) for c in n.get('inner',[]) if c and not (
            c.get('isImplicit') and c.get('kind') in (
                'CXXConstructorDecl','CXXDestructorDecl','CXXMethodDecl'))]
        return out
    def traits(value):
        if isinstance(value,dict):return {k:traits(v) for k,v in value.items()
            if k not in ('needsImplicit','needsOverloadResolution')}
        return value
    evidence={'header_sha256':hashlib.sha256(data).hexdigest(),
              'record':stable(node),'traits':traits(node.get('definitionData',{}))}
    return {'source_header':path.relative_to(root).as_posix(),'source_offset':offset,
            'enclosing_record':node.get('_source_record_name',name),
            'type':node.get('_source_record_name',name),
            'semantic_sha256':hashlib.sha256(json.dumps(evidence,sort_keys=True).encode()).hexdigest(),
            'prototype_factory_abi':'source-header-record-factory/1'}

def safe_scalar_default_member_record(node):
    """A Clang-proven implicit default constructor with scalar DMI fields.

    Unlike a trivial default ctor, a default member initializer makes the ctor
    nontrivial. Recover ONLY pointer-free scalar fields with direct AST default
    initializers and no user-authored ctor, bases, destructor, or field aliasing.
    Actual initializer expressions are lowered by the AST emitter, not guessed.
    """
    traits=node.get('definitionData',{})
    if (node.get('kind')!='CXXRecordDecl' or not node.get('completeDefinition')
            or node.get('bases') or traits.get('isStandardLayout') is not True
            or traits.get('isAggregate') is not True
            or traits.get('dtor',{}).get('trivial') is not True):return False
    fields=[c for c in node.get('inner',[]) if c.get('kind')=='FieldDecl']
    if not fields or any(c.get('kind')=='CXXConstructorDecl' and not c.get('isImplicit')
                           for c in node.get('inner',[])):return False
    scalar=re.compile(r'(?:const )?(?:(?:unsigned|signed) )?(?:char|short|int|long|long long|bool|float|double|_Bool|u?int(?:8|16|32|64)_t|size_t|ptrdiff_t)')
    def literal_only(expr):
        kind=expr.get('kind')
        if kind in ('IntegerLiteral','CharacterLiteral','FloatingLiteral','CXXBoolLiteralExpr'):
            return bool(expr.get('value') is not None or kind=='CXXBoolLiteralExpr')
        if kind in ('ImplicitCastExpr','ConstantExpr','ParenExpr','CStyleCastExpr'):
            args=expr.get('inner',[])
            return len(args)==1 and literal_only(args[0])
        if kind=='UnaryOperator' and expr.get('opcode') in ('+','-','~','!'):
            args=expr.get('inner',[])
            return len(args)==1 and literal_only(args[0])
        return False
    return all(f.get('name') and not f.get('isBitfield') and not f.get('mutable')
               and scalar.fullmatch(f.get('type',{}).get('qualType',''))
               and len(f.get('inner',[]))==1
               and literal_only(f['inner'][0]) for f in fields)


def safe_zero_default_member_record(node):
    """Prove default initialization of a simple nonaggregate header class.

    C++ classes with private fields and `{}` field initializers are not
    aggregates, but Clang proves their implicitly defaulted constructors and
    trivial destructors. Accept only pointers (null) and scalar integer/bool
    fields with empty InitListExpr, never unions, bitfields or object members.
    """
    traits=node.get('definitionData',{})
    if (node.get('kind')!='CXXRecordDecl' or not node.get('completeDefinition')
        or node.get('bases') or not traits.get('isStandardLayout')
        or traits.get('dtor',{}).get('trivial') is not True
        or any(c.get('kind')=='CXXConstructorDecl' and not c.get('isImplicit')
               for c in node.get('inner',[]))):
        return False
    fields=[c for c in node.get('inner',[]) if c.get('kind')=='FieldDecl']
    if not fields:return False
    simple=re.compile(r'(?:(?:const|volatile|signed|unsigned)\s+)*(?:bool|char|short|int|long|long long|int\d+_t|uint\d+_t|size_t|intptr_t|uintptr_t|ptrdiff_t|float|double)')
    for f in fields:
        t=f.get('type',{}).get('qualType','').strip()
        init=f.get('inner',[])
        if not f.get('name') or f.get('isBitfield') or f.get('mutable') or '&' in t:
            return False
        if not (simple.fullmatch(t) or re.fullmatch(r'[A-Za-z_]\w*\s*\*',t)):
            return False
        if len(init)!=1 or init[0].get('kind')!='InitListExpr' or init[0].get('inner'):
            return False
    return True

def eligible_record(node):
    traits=node.get('definitionData',{})
    ordinary=(node.get('kind')=='CXXRecordDecl' and node.get('completeDefinition') and
            not node.get('bases') and traits.get('isStandardLayout') is True and
            traits.get('isAggregate') is True and traits.get('defaultCtor',{}).get('trivial') is True and
            traits.get('dtor',{}).get('trivial') is True and
            not any(child.get('kind')=='VarDecl' or child.get('isBitfield') or
                child.get('virtual') or child.get('pure') or
                child.get('kind')=='FieldDecl' and '&' in child.get('type',{}).get('qualType','')
                for child in node.get('inner',[])))
    # The AST emitter already supports source-authored scalar constructors,
    # including Clang-selected delegating overloads. Header discovery must not
    # hide those classes merely because authored constructors make them
    # nonaggregates. Storage/lifetime and every method still pass normal
    # lowering; this permits discovery, never invents a constructor body.
    fields=[child for child in node.get('inner',[]) if child.get('kind')=='FieldDecl']
    scalar=re.compile(r'(?:const )?(?:(?:unsigned|signed) )?(?:char|short|int|long|long long|bool|float|double|_Bool|u?int(?:8|16|32|64)_t|size_t|ptrdiff_t)')
    def primitive_storage(field):
        spelling=field.get('type',{}).get('desugaredQualType') or field.get('type',{}).get('qualType','')
        extents=re.findall(r'\[\s*(\d+)\s*\]',spelling)
        base=re.sub(r'(?:\s*\[\s*\d+\s*\])+\s*$','',spelling).strip()
        return bool(scalar.fullmatch(base) and all(0<int(n)<=1000000 for n in extents))
    authored_scalar=(node.get('kind')=='CXXRecordDecl' and node.get('completeDefinition')
        and not node.get('bases') and traits.get('isStandardLayout') is True
        and traits.get('dtor',{}).get('trivial') is True and bool(fields)
        and all(child.get('name') and not child.get('isBitfield') and
            primitive_storage(child) for child in fields)
        and not any(child.get('virtual') or child.get('pure') for child in node.get('inner',[]))
        and any(child.get('kind')=='CXXConstructorDecl' and not child.get('isImplicit')
            and any(body.get('kind')=='CompoundStmt' for body in child.get('inner',[]))
            for child in node.get('inner',[])))
    return ordinary or authored_scalar or safe_scalar_default_member_record(node) or safe_zero_default_member_record(node)

def demanded_header_records(ast,candidates,storage_records,aliases,normalize,schema,source_root,unsupported_error=ValueError):
    needed=set()
    static_owners={}
    for root in ast:
        for record in walk(root):
            if record.get('kind')!='CXXRecordDecl' or not record.get('completeDefinition'):continue
            for member in record.get('inner',[]):
                if member.get('kind')=='CXXMethodDecl' and member.get('storageClass')=='static':
                    static_owners[member.get('id')]=record
    # Static calls may never construct an object. Follow exact method IDs so
    # classes with scalar-returning static methods also enter header closure.
    pending=list(candidates);visited=set()
    while pending:
        candidate=pending.pop()
        if id(candidate) in visited:continue
        visited.add(id(candidate))
        for node in walk(candidate):
            if node.get('kind')!='DeclRefExpr':continue
            owner=static_owners.get(node.get('referencedDecl',{}).get('id'))
            if owner is not None and owner.get('name'):
                needed.add(owner['name']);pending.append(owner)
    def prototypes(shape):
        if not shape:return
        if shape.get('prototype'):needed.add(shape['prototype'])
        for child in shape.get('record',{}).values():prototypes(child)
        if shape.get('byteRecord'):prototypes(shape['byteRecord'])
        for child in shape.get('fields',{}).values():prototypes(child)
    for candidate in candidates:
        if candidate.get('kind')=='CXXRecordDecl' and candidate.get('name'):
            needed.add(candidate['name'])
        for node in walk(candidate):
            if node.get('kind') in ('CXXConstructExpr','CXXTemporaryObjectExpr'):
                spelling=(node.get('type',{}).get('desugaredQualType') or
                          node.get('type',{}).get('qualType','')).strip()
                if re.fullmatch(r'[A-Za-z_]\w*',spelling):needed.add(spelling)
            raw=node.get('type',{}).get('desugaredQualType') or node.get('type',{}).get('qualType','')
            raw=re.sub(r'(?:\s*\[\s*\d+\s*\])+','',raw).rstrip(' &*').strip()
            # Prototype discovery must not fail on an unrelated Clang-unproven
            # aggregate layout. Actual aggregate uses still fail closed.
            try:
                shape=schema(raw,storage_records,aliases,allow_pointer_storage=True)
            except unsupported_error:
                continue
            prototypes(shape)
    records={}
    proofs={}
    conflicts=set()
    for root in ast:
        for node in walk(root):
            name=node.get('name')
            if name not in needed or not eligible_record(node):continue
            proof=header_proof(node,source_root)
            if not proof:continue
            if name in proofs and proofs[name]!=proof:conflicts.add(name)
            else:records[name]=node;proofs[name]=proof
    for name in conflicts:records.pop(name,None);proofs.pop(name,None)
    return [records[name] for name in sorted(records)],proofs
