#!/usr/bin/env python3
"""Source-first, strict C/C++ AST -> readable ES modules.

Uses Clang's *pre-optimization* AST. Fails closed for unsupported semantics;
never emits LLVM registers, basic-block switches, or synthetic gameplay.
This is deliberately an incremental source-to-source compiler, not a full C++ ABI.
"""
from __future__ import annotations
import argparse, json, re, subprocess, sys, os, hashlib
from collections import Counter
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from source_control_flow import SourceFlowPlan, ControlFlowUnsupported
from source_resume_dispatch import recover as recover_resume_dispatch, allowed_expression as resume_allowed_expression
from source_coroutine_cfg import CoroutineCFG, CoroutineUnsupported, needs_cfg
from source_byte_records import recover_byte_records, clean_type as clean_record_type, owned_anonymous_record_members, typedef_record_layouts
from source_trivial_assignment import recover_trivial_assignment_methods
from source_cpp_lifetime import recover_lifetime_classes
from source_cpp_references import REFERENCE_ABI, function_type_parts, lvalue_referent, const_referent
from source_cpp_types import has_outer_indirection
from source_cpp_heap import standard_allocation_operators, allocation_symbol, original_allocator_definitions
from source_standard_heap_contract import validate as validate_standard_heap_contract
from source_header_records import normalize_specializations, specialization_aliases, specialization_layouts, demanded_header_records, header_proof, eligible_record, safe_scalar_default_member_record, safe_zero_default_member_record
from source_first_toolchain import frontend_config, target_attestation, fingerprint_toolchain
from source_ast_stream import run_clang_ast
from source_ast_cache_paths import source_ast_input_fingerprint
from source_scalar_types import scalar_info, is_integer
from source_private_record_schema import private_record_schema_compatible
from source_empty_asm import prove_empty_asm
from source_anonymous_records import blocked_anonymous_global_arrays
from source_template_destructors import complete as complete_template_destructors
from source_static_members import recover as recover_out_of_line_static_members, constant_members, rebind_static_references
from source_c_allocators import complete as complete_c_allocator_declarations
from source_explicit_member_operators import explicit_operator, has_unresolved_explicit_operators, rebind_explicit_operators
from source_c_function_bindings import rebind as rebind_c_function_references, contexts as c_function_contexts
from source_field_bindings import index as index_source_fields, rebind as rebind_source_fields
from source_header_definitions import load as load_header_definitions, match as match_header_definition
from source_byte_methods import recover as recover_byte_methods
from source_byte_constructors import recover as recover_byte_constructors

HERE=Path(__file__).resolve().parents[1]
NATIVE_POINTER_ABI='source-lp64-addresses/2'
WRAPPERS={'ImplicitCastExpr','ExprWithCleanups','MaterializeTemporaryExpr','FullExpr','ConstantExpr','ParenExpr','CXXBindTemporaryExpr'}
UNSUPPORTED=("CXXNewExpr", "CXXDeleteExpr", "CXXThrowExpr", "CXXTryStmt", "AsmStmt", "GCCAsmStmt", "LambdaExpr", "CXXMemberCallExpr")

def kids(n): return [x for x in n.get('inner',[]) if x]

def is_unevaluated_assume(n):
    if kind(n)!='CallExpr' or len(kids(n))!=2:return False
    callee=kids(n)[0]
    while kind(callee) in WRAPPERS and len(kids(callee))==1:callee=kids(callee)[0]
    return (kind(callee)=='DeclRefExpr' and
            callee.get('referencedDecl',{}).get('name')=='__builtin_assume')

def semantic_kids(n):
    """Visit initializer dependencies without changing expression operand arity.

    Clang places explicit elements of partially initialized arrays after an
    implicit filler in array_filler, rather than inner. Both carry declarations
    and calls that dependency/lifetime analysis must see.
    """
    # Clang's assume operand is unevaluated, including side effects and calls.
    # Do not invent dependencies, allocations or lifetimes for that operand.
    if is_unevaluated_assume(n):return []
    result=kids(n)
    filler=n.get('array_filler',[])
    if isinstance(filler,dict):filler=[filler]
    seen={id(child) for child in result}
    for child in filler:
        if isinstance(child,dict) and child and id(child) not in seen:
            result.append(child);seen.add(id(child))
    return result

def recover_enum_values(ast, supplemental=None):
    """Resolve C/C++ enum constants by Clang IDs and source initializer rules.

    A *syntactically explicit* initializer whose AST isn't evaluable is NOT an
    implicit first enumerator of value zero. Its successors stay unknown until
    another explicit, provable value occurs. This prevents silent wrong values
    for `FIRST = OTHER_ENUM_VALUE, SECOND, THIRD` in original game headers.
    """
    values={}
    def initial_value(expr):
        k=kind(expr)
        if k=='ConstantExpr' and expr.get('value') is not None:
            try:return int(str(expr['value']),0)
            except ValueError:return None
        if k in ('IntegerLiteral','CharacterLiteral') and expr.get('value') is not None:
            try:return int(str(expr['value']),0)
            except ValueError:return None
        if k=='DeclRefExpr':
            ref=expr.get('referencedDecl',{})
            if ref.get('kind')=='EnumConstantDecl':return values.get(ref.get('id'))
            return None
        if k in ('ImplicitCastExpr','ParenExpr','CStyleCastExpr','CXXStaticCastExpr') and len(kids(expr))==1:
            return initial_value(kids(expr)[0])
        return None
    def scan(node):
        if kind(node)=='EnumDecl':
            current=None;seen_enumerator=False
            for constant in kids(node):
                if kind(constant)!='EnumConstantDecl':continue
                # Documentation and enumerator attributes are declarations,
                # not explicit initializer expressions. Doxygen comments on
                # implicit enumerators must not erase their proven sequence.
                init=[child for child in kids(constant) if not kind(child).endswith(('Comment','Attr'))]
                if init:
                    current=initial_value(init[0]) if len(init)==1 else None
                elif not seen_enumerator:current=0
                elif current is not None:current+=1
                seen_enumerator=True
                if current is not None and constant.get('id'):
                    values[constant['id']]=current
        for child in kids(node):scan(child)
    for item in ast:scan(item)
    if supplemental:
        for root in ast:
            for node in descendants(root):
                if kind(node)!='DeclRefExpr':continue
                decl=node.get('referencedDecl',{})
                if decl.get('kind')!='EnumConstantDecl':continue
                name=decl.get('name')
                if decl.get('id') and name in supplemental:
                    value=supplemental[name]
                    existing=values.get(decl['id'])
                    if existing is not None and existing!=value:
                        raise Unsupported('enum declaration ID has conflicting Clang values: '+name)
                    values[decl['id']]=value
    return values

def recover_enum_type_names(ast):
    """Only enum names with one unique Clang definition may be by-value operands."""
    names={};values=recover_enum_values(ast)
    def visit(node,scope=()):
        if kind(node) in ('NamespaceDecl','CXXRecordDecl') and node.get('name'):scope=(*scope,node['name'])
        if kind(node)=='EnumDecl' and node.get('name'):
            constants=[item for item in kids(node) if kind(item)=='EnumConstantDecl']
            # A forward declaration has no values. Repeated Clang dumps have
            # different IDs and use flags; neither changes the original enum.
            if constants and all(item.get('id') in values for item in constants):
                name=node['name'];qualified='::'.join((*scope,name))
                signature=(qualified,node.get('loc',{}).get('offset'),
                    tuple((item.get('name'),values[item['id']]) for item in constants))
                for spelling in (name,qualified):names.setdefault(spelling,set()).add(signature)
        for child in kids(node):visit(child,scope)
    for root in ast:visit(root)
    return {name for name,identities in names.items() if len(identities)==1}

def conversion_js_symbol(name, signature):
    """C++ conversion functions are class methods, not JS type casts."""
    if not re.fullmatch(r'operator (?:const )?(?:unsigned |signed )?[A-Za-z_][\w: ]*',name):
        raise Unsupported('unsupported C++ conversion declaration: '+name)
    return '__cxx_conversion_'+hashlib.sha256((name+'\0'+signature).encode()).hexdigest()[:16]

def odr_body_digest(node):
    """Stable Clang semantic shape for header inline ODR validation.

    Clang pointer IDs/locations differ between translation units. Preserve
    source expression structure, types, selected callee name and signatures,
    literal values, and operator/cast kinds, not ephemeral AST addresses.
    """
    fields=('kind','name','opcode','value','castKind','isArrow','isPostfix',
            'constructionKind','storageClass','valueCategory','isUsed')
    def stable(n):
        result={k:n[k] for k in fields if k in n}
        if n.get('type'):result['type']={key:n['type'][key] for key in
            ('qualType','desugaredQualType') if key in n['type']}
        if n.get('referencedDecl'):
            decl=n['referencedDecl']
            result['referencedDecl']={k:decl.get(k) for k in ('kind','name')}
            result['referencedDecl']['type']=decl.get('type',{}).get('qualType')
        result['children']=[stable(c) for c in kids(n)]
        return result
    return hashlib.sha256(json.dumps(stable(node),sort_keys=True,separators=(',',':')).encode()).hexdigest()

def operator_js_symbol(name, signature):
    """Unique, stable, JS-safe identifier for a Clang source C++ operator."""
    if not re.fullmatch(r'operator(?:\[\]|\(\)|[+*/%\-=&|^!<>~]+)',name):
        raise Unsupported('C++ operator name requires precise declaration: '+name)
    return '__cxx_operator_'+hashlib.sha256((name+'\0'+signature).encode()).hexdigest()[:16]

def recover_type_aliases(ast):
    """Accept typedef expansion only when Clang supplies an unambiguous underlying type.

    This map is deliberately conservative: conflicting typedef names in distinct
    scopes are removed, not silently assigned an arbitrary layout.
    """
    aliases=specialization_aliases(ast);ambiguous=set()
    record_names={node.get('name') for root in ast for node in descendants(root)
                  if kind(node) in ('RecordDecl','CXXRecordDecl') and node.get('completeDefinition')}
    for root in ast:
        for node in descendants(root):
            if kind(node) not in ('TypedefDecl','TypeAliasDecl','EnumDecl'):continue
            name=node.get('name')
            if not name:continue
            if kind(node)=='EnumDecl':
                if name in record_names:
                    ambiguous.add(name);continue
                # Only Clang's explicit fixed underlying type proves enum
                # object width/sign. Never assume an inferred enum is int.
                ty=node.get('fixedUnderlyingType',{})
            else:ty=node.get('type',{})
            desugared=ty.get('desugaredQualType') or ty.get('qualType')
            if not desugared or desugared==name:continue
            if name in aliases and aliases[name]!=desugared:ambiguous.add(name)
            else:aliases[name]=desugared
    return {name:typ for name,typ in aliases.items() if name not in ambiguous}

def target_type_layout(type_name,records,aliases=None,depth=0):
    """Recover LP64 array sizes from exact fixed extents and Clang type data.

    A sized C array is NOT a pointer. sizeof(T[N]) = sizeof(T)*N,
    alignof(T[N]) = alignof(T). Runtime-length arrays fail closed.
    """
    if depth>12:return None
    original=type_name.strip()
    extents=[]
    # Function-pointer arrays put their extents INSIDE the declarator:
    # int (*[3])(int), unlike int *[3]. Only inspect the outer declarator;
    # an array appearing in a function parameter does not size that pointer.
    declarator=re.match(r'^[^()]+\(\s*\*\s*((?:\[\s*\d+\s*\]\s*)+)\)',original)
    if declarator:
        extents.extend(int(n) for n in re.findall(r'\[\s*(\d+)\s*\]',declarator[1]))
        original=original[:declarator.start(1)]+original[declarator.end(1):]
    # A pointer TO an array is still one pointer; trailing bounds belong to
    # its pointee. This also covers arrays of pointers to fixed arrays above.
    if re.match(r'^[^()]+\(\s*\*\s*\)\s*\[',original):
        size=8
        for length in extents:size*=length
        return size,8
    while True:
        match=re.search(r'\s*\[\s*(\d+)\s*\]\s*$',original)
        if not match:break
        extents.append(int(match.group(1)))
        original=original[:match.start()].strip()
    cleaned=re.sub(r'\b(?:const|volatile|restrict|__restrict|signed)\b','',original).strip()
    value=records.get(original) or records.get(cleaned)
    elaborated=re.fullmatch(r'(?:struct|class|union)\s+(.+)',cleaned)
    if value is None and elaborated:
        tag=elaborated.group(1)
        # Clang may print an anonymous typedef-owned C++ tag as `struct T`,
        # while its proven layout is indexed by T. Do not cross C's distinct
        # tag/typedef namespaces when a conflicting typedef spelling exists.
        alias=(aliases or {}).get(tag)
        if alias is None or alias in (tag,cleaned):value=records.get(tag)
    if value is not None:
        size,alignment=value['size'],value['align']
    elif aliases and original in aliases and aliases[original]!=original:
        value=target_type_layout(aliases[original],records,aliases,depth+1)
        if value is None:return None
        size,alignment=value
    elif has_outer_indirection(cleaned):
        # Original selected build targets x86-64 LP64.
        size=alignment=8
    else:
        sizes={'char':1,'unsigned char':1,'bool':1,'_Bool':1,
               'short':2,'unsigned short':2,'int':4,'unsigned int':4,
               'long':8,'unsigned long':8,'long long':8,'unsigned long long':8,
               'float':4,'double':8,'long double':16,
               'int8_t':1,'uint8_t':1,'int16_t':2,'uint16_t':2,
               'int32_t':4,'uint32_t':4,'int64_t':8,'uint64_t':8,
               'size_t':8,'ptrdiff_t':8,'intptr_t':8,'uintptr_t':8}
        if cleaned in sizes:size=alignment=sizes[cleaned]
        elif aliases and cleaned in aliases and aliases[cleaned]!=cleaned:
            value=target_type_layout(aliases[cleaned],records,aliases,depth+1)
            if value is None:return None
            size,alignment=value
        else:return None
    for length in extents:size*=length
    return (size,alignment)

def normalized_record_name(t, aliases=None):
    """Only resolve type spellings backed by Clang declarations, not substrings."""
    aliases=aliases or {}
    def outer_qualifiers(spelling):
        spelling=re.sub(r'\s+',' ',spelling).strip()
        spelling=re.sub(r'^(?:(?:const|volatile|struct|class|union)\s+)+','',spelling).strip()
        return re.sub(r'(?:\s+(?:const|volatile))+$','',spelling).strip()
    t=outer_qualifiers(t)
    seen=set()
    while t in aliases and t not in seen:
        seen.add(t)
        # Only the record's own qualifiers/tags are removable. A pointer or
        # const inside Queue<const char *> is part of the template identity.
        next_name=outer_qualifiers(aliases[t])
        if next_name==t or next_name in seen:break
        t=next_name
    if has_outer_indirection(t):return None
    return t

def recover_trivial_aggregate_records(ast, static_storage=False, source_root=None):
    """Collect exact Clang POD record-field evidence for by-value JS lowering.

    C++ record type spellings may be ambiguous between namespaces. Ambiguous
    layouts are excluded. Union records never become JS property objects:
    overlapping bytes must instead have a verified byte-storage layout.
    """
    found={};ambiguous=set()
    # An anonymous C `typedef struct { ... } Name;` has an unnamed record
    # in Clang but an exact ownedTagDecl ID in its TypedefDecl. Recover only
    # uniquely owned names; never invent names from field layouts or offsets.
    aliases_by_record={}
    for root in ast:
        for decl in descendants(root):
            if kind(decl)=='CXXRecordDecl' and decl.get('completeDefinition'):
                members=owned_anonymous_record_members(decl,source_root)
                for field in kids(decl):
                    child=members.get(field.get('id'))
                    if child is None:continue
                    spelling=normalized_record_name(qual(field))
                    if spelling:aliases_by_record.setdefault(child['id'],set()).add(spelling)
            if kind(decl)!='TypedefDecl' or not decl.get('name'):continue
            # A typedef can refer to a PREVIOUS typedef whose RecordType
            # embeds the original ownedTagDecl transitively. Only the direct
            # typedef-owned tag is a naming claim; following descendants
            # made `typedef projectile_t defaultprojectile_t` look like a
            # second owner of the anonymous source struct and rejected both.
            for subtype in kids(decl):
                owned=subtype.get('ownedTagDecl',{})
                # Clang 22 serializes a typedef-owned anonymous tag as a
                # RecordType declaration plus isTagOwned, rather than the
                # earlier ElaboratedType. Preserve the same exact tag ID.
                if not owned and kind(subtype)=='RecordType' and subtype.get('isTagOwned') is True:
                    owned=subtype.get('decl',{})
                if owned.get('kind')=='CXXRecordDecl' and owned.get('id'):
                    aliases_by_record.setdefault(owned['id'],set()).add(decl['name'])
    for root in ast:
        for n in descendants(root):
            if kind(n)!='CXXRecordDecl' or not n.get('completeDefinition'):continue
            # Several typedefs can name the SAME Clang-owned record tag.
            # Those are proven aliases, not ambiguous competing definitions.
            # Keep every spelling; conflicting physical shapes still poison
            # their individual names below.
            names=set(aliases_by_record.get(n.get('id'),set()))
            if n.get('name'):names.add(n['name'])
            if not names:continue
            traits=n.get('definitionData',{})
            if traits.get('isStandardLayout') is not True or traits.get('isAggregate') is not True:
                continue
            if static_storage:
                # A static POD object's initial bytes are zero even when the
                # type has a custom assignment operator; do not invoke it.
                # Require trivial default construction and destruction. This
                # rule is ONLY for global storage, never object-copy lowering.
                if traits.get('defaultCtor',{}).get('trivial') is not True or traits.get('dtor',{}).get('trivial') is not True:
                    continue
            elif traits.get('isTriviallyCopyable') is not True:
                continue
            if n.get('bases'):continue
            if not static_storage and any(kind(child)=='CXXMethodDecl' and not child.get('isImplicit') and any(kind(inner)=='CompoundStmt' for inner in kids(child))
                   for child in kids(n)):continue
            fields=[f for f in kids(n) if kind(f)=='FieldDecl']
            pointer_aliases=[]
            flattened_anonymous_members=[]
            flattened_anonymous_types=[]
            # C POD anonymous pointer unions: both anonymous IndirectFieldDecl
            # names are views of one pointer slot, not independent properties.
            # Only recognize the exact Clang nested-union AST and trivial ABI.
            unnamed=[f for f in fields if not f.get('name')]
            if unnamed and static_storage and len(unnamed)==1:
                union_nodes=[child for child in kids(n)
                             if kind(child)=='CXXRecordDecl' and child.get('tagUsed')=='union'
                             and child.get('completeDefinition')]
                indirect={child.get('name') for child in kids(n)
                          if kind(child)=='IndirectFieldDecl'}
                if len(union_nodes)==1:
                    members=[child for child in kids(union_nodes[0]) if kind(child)=='FieldDecl']
                    if (len(members)>=2 and all(m.get('name') and re.fullmatch(
                            r'[A-Za-z_][\w:]*(?:\s+\w+)?\s*\*',qual(m).strip())
                            for m in members)
                            and {m['name'] for m in members}==indirect
                            and all(kind(c)!='CXXRecordDecl' for c in kids(union_nodes[0]))):
                        pointer_aliases.append([m['name'] for m in members])
                        flattened_anonymous_members.append(unnamed[0]['id'])
                        flattened_anonymous_types.append(clean_record_type(qual(unnamed[0])))
                        fields=[f for f in fields if f.get('name')]+members
            if any(f.get('isBitfield') or not f.get('name') for f in fields):continue
            # An anonymous union embedded in a POD struct is byte-overlapping
            # storage. Accept opaque *copying* only if every alternative is a
            # finite integer/float array, with no pointers or member objects.
            anonymous_unions=[child for child in kids(n)
                if kind(child)=='CXXRecordDecl' and child.get('tagUsed')=='union']
            safe_union=(bool(anonymous_unions) and len(fields)==len(anonymous_unions)
                and all(re.search(r'\((?:unnamed|anonymous)(?: union)? at ',qual(field))
                        and 'union ' in qual(field) for field in fields))
            for union in anonymous_unions:
                alternatives=[item for item in kids(union) if kind(item)=='FieldDecl']
                if not alternatives or any(not re.fullmatch(
                    r'(?:const )?(?:unsigned )?(?:char|short|int|float|double|u?int(?:8|16|32|64)_t)\s*\[\d+\]',
                    qual(item)) for item in alternatives):
                    safe_union=False
            signature=(n.get('tagUsed'),tuple((f['name'],qual(f)) for f in fields))
            for key in names:
                if key in found and found[key]['signature']!=signature:ambiguous.add(key)
                else:found[key]={'signature':signature,'fields':[(f['name'],qual(f)) for f in fields],
                             'union':n.get('tagUsed')=='union', 'opaque_union':safe_union,
                             'prototype':(n.get('name') or '<anonymous>') if any(kind(m) in ('CXXMethodDecl','CXXConversionDecl')
                                 and not m.get('isImplicit') and any(kind(b)=='CompoundStmt' for b in kids(m))
                                 for m in kids(n)) else None,
                             'copyable':static_storage or traits.get('copyCtor',{}).get('trivial') is True,
                             'moveable':traits.get('moveCtor',{}).get('trivial') is True,
                             'pointer_aliases':pointer_aliases,
                             'flattened_anonymous_types':flattened_anonymous_types,
                             'flattened_anonymous_members':flattened_anonymous_members}
    return {name:value for name,value in found.items() if name not in ambiguous}


def recover_trivial_copy_classes(ast):
    """Clang-proven trivial copy constructors with scalar-only fields.

    This deliberately excludes pointer/reference/union/array/object fields,
    inheritance, custom copies and destructors. A JS prototype-preserving
    shallow scalar copy is then equivalent to Clang's copy constructor.
    """
    found={};ambiguous=set()
    simple=re.compile(r'(?:const )?(?:signed |unsigned )?(?:char|short|int|long|long long|bool|float|double|_Bool|u?int(?:8|16|32|64)_t|size_t|ptrdiff_t)')
    for root in ast:
        for record in descendants(root):
            if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition') or not record.get('name'):continue
            traits=record.get('definitionData',{})
            if not (traits.get('copyCtor',{}).get('trivial') is True and
                    traits.get('dtor',{}).get('trivial') is True and
                    not record.get('bases')):continue
            fields=[f for f in kids(record) if kind(f)=='FieldDecl']
            if not fields or any(not f.get('name') or f.get('isBitfield') or f.get('mutable')
                                  or not simple.fullmatch(qual(f).strip()) for f in fields):continue
            if any(kind(c)=='CXXConstructorDecl' and
                   c.get('explicitlyDefaulted') not in (None,'default')
                   for c in kids(record)):continue
            name=record['name'];shape=tuple((f['name'],qual(f)) for f in fields)
            if name in found and found[name]!=shape:ambiguous.add(name)
            else:found[name]=shape
    return {name:[field for field,_ in shape] for name,shape in found.items() if name not in ambiguous}

def constructor_js_symbol(signature):
    """Static Clang-selected constructor factory, never JS runtime arity guessing."""
    return '__cxx_construct_'+hashlib.sha256(signature.encode()).hexdigest()[:16]

def recover_constructor_factories(ast):
    found={};ambiguous=set()
    for root in ast:
        for record in descendants(root):
            if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition') or not record.get('name'):continue
            constructors=[v for v in kids(record) if kind(v)=='CXXConstructorDecl'
                         and any(kind(x)=='CompoundStmt' for x in kids(v))
                         and v.get('explicitlyDefaulted')!='default']
            if len(constructors)<=1:continue
            signatures=[qual(v) for v in constructors]
            if len(signatures)!=len(set(signatures)):
                ambiguous.add(record['name']);continue
            mapping={signature:constructor_js_symbol(signature) for signature in signatures}
            if record['name'] in found and found[record['name']]!=mapping:
                ambiguous.add(record['name'])
            found[record['name']]=mapping
    return {name:mapping for name,mapping in found.items() if name not in ambiguous}

def recover_pointer_span_records(ast):
    """Find C++ classes whose begin/end literally delimit one owned pointer array.

    Clang-proven *method bodies* and fields are required. The spelling of the
    collection class is irrelevant. Any same-name class with conflicting span
    semantics poisons that name, instead of permitting type confusion.
    """
    found={}; invalid=set()
    def strip(node):
        while kind(node) in WRAPPERS and len(kids(node))==1:
            node=kids(node)[0]
        return node
    def field(node):
        node=strip(node)
        if kind(node)!='MemberExpr' or len(kids(node))!=1 or kind(strip(kids(node)[0]))!='CXXThisExpr':
            return None
        return node.get('name')
    for root in ast:
        for record in descendants(root):
            if kind(record) not in ('CXXRecordDecl','ClassTemplateSpecializationDecl') or not record.get('completeDefinition'):
                continue
            name=record.get('name')
            if not name or record.get('bases'):continue
            fields={node.get('name'):qual(node) for node in kids(record) if kind(node)=='FieldDecl' and node.get('name')}
            methods={}
            for node in kids(record):
                if kind(node)=='CXXMethodDecl' and node.get('name') in ('begin','end'):
                    body=next((v for v in kids(node) if kind(v)=='CompoundStmt'),None)
                    if body and len(kids(body))==1 and kind(kids(body)[0])=='ReturnStmt' and len(kids(kids(body)[0]))==1:
                        methods.setdefault(node['name'],[]).append((qual(node),strip(kids(kids(body)[0])[0])))
            candidates=[]
            for signature,begin in methods.get('begin',[]):
                data=field(begin)
                if not data or not fields.get(data,'').strip().endswith('*'):continue
                for end_signature,end in methods.get('end',[]):
                    if signature!=end_signature or kind(end)!='BinaryOperator' or end.get('opcode')!='+' or len(kids(end))!=2:
                        continue
                    data_end=field(kids(end)[0]);size=field(kids(end)[1])
                    if data_end!=data or not size or size==data:continue
                    # The end bound must be a native integer field; an
                    # overloaded quantity or an arbitrary expression is unsafe.
                    if not re.fullmatch(r'(?:const )?(?:size_t|ptrdiff_t|unsigned (?:long(?: long)?|int)|int|long(?: long)?|u?int(?:32|64)_t)',fields.get(size,'')):
                        continue
                    candidates.append((data,size))
            if len(set(candidates))!=1:
                # Other full definitions with this name must not be accepted
                # if their range semantics do not match.
                invalid.add(name);continue
            contract=candidates[0]
            if name in found and found[name]!=contract:invalid.add(name)
            else:found[name]=contract
    return {name:{'data':data,'size':size} for name,(data,size) in found.items() if name not in invalid}

def range_container_names(ast):
    """Clang AST demand discovery for class-template range loops, not game lists."""
    found=set()
    for root in ast:
        for node in descendants(root):
            if kind(node)!='CXXForRangeStmt':continue
            raw=node.get('inner',[])
            if len(raw)<3 or not raw[1] or kind(raw[1])!='DeclStmt':continue
            ds=kids(raw[1])
            if len(ds)!=1:continue
            name=re.sub(r'\b(?:const|volatile|struct|class)\b','',qual(ds[0])).strip()
            name=name.rstrip(' &').strip()
            # Template arguments have type syntax. Only the primary Clang
            # identifier is a valid AST-dump lookup name.
            match=re.fullmatch(r'([A-Za-z_]\w*(?:::[A-Za-z_]\w*)*)(?:\s*<.*>)?',name)
            if match:found.add(match.group(1).split('::')[-1])
    return found

def aggregate_type_schema(t, records, aliases, layouts=None, depth=0, allow_pointer_storage=False, enum_types=None):
    """Provide the exact recursively copyable field shape, rejecting pointers/unions.

    Nested numeric C arrays become TypedArrays or arrays of those TypedArrays.
    Every record field must have a supported representation; partial copying
    would otherwise silently drop original object state.
    """
    if depth>12:return None
    byte_record=records.get(clean_record_type(t))
    if byte_record and byte_record.get('byte_schema') and not byte_record.get('opaque_union'):
        return {'byteRecord':byte_record['byte_schema']}
    dims=[int(v) for v in re.findall(r'\[\s*(\d+)\s*\]',t)]
    base=re.sub(r'\[\s*\d+\s*\]','',t).strip()
    base=re.sub(r'\b(?:const|volatile|restrict|__restrict)\b','',base).strip()
    pointer_base=base;seen_pointer_aliases=set()
    while pointer_base in aliases and pointer_base not in seen_pointer_aliases:
        seen_pointer_aliases.add(pointer_base);pointer_base=aliases[pointer_base].strip()
    if (allow_pointer_storage and len(dims)==1 and 0<=dims[0]<=1000000 and
            '*' in pointer_base and '&' not in pointer_base and
            ('(' not in pointer_base or re.search(r'\(\s*\*\s*\)\s*\(',pointer_base))):
        return {'pointerArray':dims[0],'stride':8}
    if allow_pointer_storage and '*' in base and '&' not in base and '(' not in base and ')' not in base:
        # Global POD storage may contain null pointer slots. This schema is
        # never authorized for pointer dereference or aggregate copy.
        if dims:return None
        # Only a literal-backed byte pointer is safe to materialize without
        # the original referenced object's allocation/ownership. All other
        # pointer fields remain zero-only.
        byte_pointee=bool(re.fullmatch(r'(?:char|unsigned char|signed char|int8_t|uint8_t)\s*\*',base))
        return {'pointer':True,'pointee':'byte'} if byte_pointee else {'pointer':True}
    if allow_pointer_storage and not dims and re.search(r'\(\s*\*\s*\)\s*\(',base):
        # A function-pointer slot at C++ zero-initialization is null.
        # A later assignment can hold the original callable JS function.
        return {'pointer':True}
    known_record_name=normalized_record_name(base,aliases)
    if '*' in base or '&' in base:return None
    if ('(' in base or ')' in base) and known_record_name not in records:return None
    numeric={'char':'Uint8Array','unsigned char':'Uint8Array','uint8_t':'Uint8Array',
             'int8_t':'Int8Array','short':'Int16Array','unsigned short':'Uint16Array',
             'int16_t':'Int16Array','uint16_t':'Uint16Array','int':'Int32Array',
             'unsigned int':'Uint32Array','int32_t':'Int32Array','uint32_t':'Uint32Array',
             'float':'Float32Array','double':'Float64Array','int64_t':'BigInt64Array',
             'uint64_t':'BigUint64Array','long':'BigInt64Array','unsigned long':'BigUint64Array',
             'long long':'BigInt64Array','unsigned long long':'BigUint64Array'}
    # Alias resolution follows Clang typedefs, not source-name heuristics.
    resolved=base;visited=set()
    while resolved in aliases and resolved not in visited:
        visited.add(resolved)
        resolved=re.sub(r'\b(?:const|volatile|restrict|__restrict)\b','',aliases[resolved]).strip()
    numeric_type=numeric.get(resolved)
    primitive=scalar_info(resolved)
    if primitive and primitive[0] in ('integer','boolean') and primitive[1] in (1,2,4,8):
        numeric_type={1:('Int8Array','Uint8Array'),2:('Int16Array','Uint16Array'),
                      4:('Int32Array','Uint32Array'),8:('BigInt64Array','BigUint64Array')}[primitive[1]][primitive[2] or primitive[0]=='boolean']
    if dims:
        record=records.get(normalized_record_name(base,aliases),{})
        if record.get('byte_schema') and all(0<v<=1000000 for v in dims):
            return {'recordArray':record['byte_schema'],'dims':dims}
        if not numeric_type or any(v<1 or v>1_000_000 for v in dims):return None
        return {'array':numeric_type,'dims':dims}
    # A proven Clang EnumDecl is a by-value scalar in JS records. Never
    # extrapolate pointer, array or byte serialization layouts from its name.
    # Original enumerator values still come from Clang, not guessed ordinals.
    resolved_enum = re.sub(r'^(?:enum\s+)', '', resolved).strip()
    base_enum = re.sub(r'^(?:enum\s+)', '', base).strip()
    if not dims and enum_types and (resolved_enum in enum_types or base_enum in enum_types):
        return {'scalar':'enum'}
    if numeric_type:
        # Runtime zero construction needs the exact proven primitive width,
        # including fixed-enum/typedef64 storage; a type spelling is not ABI.
        return {'scalar':resolved}
    name=normalized_record_name(base,aliases)
    record=records.get(name)
    if record is None or not record['copyable'] or record['union']:return None
    # Qualified/typedef spellings may resolve to a byte-backed record only
    # here. Such records deliberately have a byte_schema, not legacy fields.
    if record.get('byte_schema') and not record.get('opaque_union'):
        return {'byteRecord':record['byte_schema']}
    if record.get('opaque_union'):
        # A union's overlapped storage has no nonaliasing JS field equivalent.
        # Use exact native-layout-sized opaque bytes and reject unverified sizes.
        layout=target_type_layout(t,layouts or {},aliases)
        if layout is None:raise Unsupported('aggregate copy needs exact Clang layout: '+name)
        if not 0 < layout[0] <= 1024*1024:return None
        return {'bytes':layout[0]}
    fields={}
    for field,t in record['fields']:
        item=aggregate_type_schema(t,records,aliases,layouts,depth+1,allow_pointer_storage,enum_types)
        if item is None:return None
        fields[field]=item
    schema={'record':fields}
    if record.get('pointer_aliases'):
        for group in record['pointer_aliases']:
            if len(group)<2 or any(fields.get(f,{}).get('pointer') is not True for f in group):return None
        schema['pointerAliases']=record['pointer_aliases']
    if record.get('prototype'):schema['prototype']=record['prototype']
    return schema

def schema_has_prototype(schema):
    return bool(schema_prototypes(schema))

def schema_prototypes(schema):
    if not schema:return set()
    result={schema['prototype']} if schema.get('prototype') else set()
    for field in schema.get('record',{}).values():result.update(schema_prototypes(field))
    if schema.get('byteRecord'):result.update(schema_prototypes(schema['byteRecord']))
    if schema.get('recordArray'):result.update(schema_prototypes(schema['recordArray']))
    for field in schema.get('fields',{}).values():result.update(schema_prototypes(field))
    return result

def is_clang_va_list(t):
    return bool(re.fullmatch(r'(?:va_list|__builtin_va_list|(?:struct )?__va_list_tag\s*\[\s*1\s*\])',t.strip()))

def qual(n): return n.get('type',{}).get('desugaredQualType') or n.get('type',{}).get('qualType','')
def kind(n):return n.get('kind','')
# JavaScript module bindings cannot use these names in strict mode,
# although they may be legal original C/C++ source identifiers.
JS_UNSAFE_BINDINGS={'Number','Boolean','Array','Object','String','BigInt','Math','JSON','Symbol','Promise','Date','Error','Map','Set','RegExp','globalThis','console','undefined','NaN','Infinity','arguments','eval','await','yield','let','static','implements','interface',
    'package','private','protected','public','enum','default','class','function','export',
    'import','new','return','const','var','break','continue','delete','switch','case',
    'catch','throw','try','finally','if','else','for','while','do','super','this','extends',
    'in','instanceof','typeof','void','with','debugger','of','null','true','false','async'}
def js_ident(name):
    return '__cxx_'+name if name in JS_UNSAFE_BINDINGS else name

GLOBAL_STORAGE_ABI='source-global-cell/2'
PRIVATE_STORAGE_ABI='source-private-cell/1'

def private_storage_binding(source,name):
    return '__cxx_private_cell_'+hashlib.sha256((source+'\0'+name).encode()).hexdigest()[:24]

def private_address_binding(source,name):
    return '__cxx_static_address_'+hashlib.sha256((source+'\0'+name).encode()).hexdigest()[:24]

def global_storage_binding(name):
    """Supplementary owner-controlled storage; never an original declaration."""
    return '__cxx_global_cell_'+hashlib.sha256(name.encode()).hexdigest()[:24]

def immutable_global(node):
    typ=qual(node).strip()
    # Function-pointer parameter types can themselves contain stars/const.
    # Only the outer pointer declarator qualifies the storage object.
    declarator=re.search(r'\(([^()]*)\)\s*\(',typ)
    pointer_region=declarator[1] if declarator and '*' in declarator[1] else typ
    return bool(node.get('constexpr') or re.search(r'\bconst\b',pointer_region.rsplit('*',1)[-1] if '*' in pointer_region else pointer_region))

def mutable_scalar_global(node, aliases=None, enum_types=None):
    if kind(node) not in ('VarDecl','DeclRefExpr'):return False
    typ=qual(node).strip()
    if '[' in typ or '&' in typ or node.get('constexpr'):return False
    if '*' in typ:
        # const T* is a mutable pointer; T* const is a constant object.
        return not immutable_global(node)
    if immutable_global(node):return False
    resolved=resolve_scalar_storage_alias(typ,aliases)
    return scalar_size(resolved) is not None or re.sub(r'^enum\s+','',resolved) in (enum_types or set())

def addressable_record_global(node,records,aliases,layouts,enum_types,classes=None):
    """Borrow an original owner-controlled record without replacing its storage."""
    if kind(node)!='VarDecl' or any(c in qual(node) for c in ('*','&','[')):return False
    if normalized_record_name(qual(node),aliases) in (classes or ()):
        return target_type_layout(qual(node),layouts,aliases) is not None
    try:
        shape=aggregate_type_schema(qual(node),records,aliases,layouts,
            allow_pointer_storage=True,enum_types=enum_types)
    except Unsupported:return False
    return bool(shape and ('record' in shape or 'byteRecord' in shape))


def _plain_scalar_type(t):
    clean=' '.join(re.sub(r'\b(?:const|volatile|restrict|__restrict|__restrict__)\b',' ',t).split())
    return clean if scalar_info(clean) else None
def is_unsigned(t):return is_integer(t,unsigned=True)
def is_record_pointee(t):return bool(re.search(r'\b(?:struct|class|union)\s+\w+\s*\*',t))

def typed_pointer(t):
    # C pointers to plain numeric elements become bounded native TypedArray views.
    # Opaque, function, record, and multi-level pointers still require explicit handling.
    if '*' not in t or t.count('*')!=1 or '(*)' in t:return None
    base=' '.join(re.sub(r'\b(const|volatile|restrict|__restrict|__restrict__)\b','',t.split('*')[0]).split())
    if base.startswith('signed ') and base!='signed char':base=base.removeprefix('signed ')
    return {'bool':'Uint8Array','_Bool':'Uint8Array','char':'Uint8Array','signed char':'Int8Array', 'unsigned char':'Uint8Array','uint8_t':'Uint8Array','int8_t':'Int8Array',
            'short':'Int16Array','unsigned short':'Uint16Array','int16_t':'Int16Array','uint16_t':'Uint16Array',
            'int':'Int32Array','unsigned int':'Uint32Array','int32_t':'Int32Array','uint32_t':'Uint32Array',
            'float':'Float32Array','double':'Float64Array',
            'int64_t':'BigInt64Array','uint64_t':'BigUint64Array',
            'intptr_t':'BigInt64Array','uintptr_t':'BigUint64Array',
            'ptrdiff_t':'BigInt64Array','size_t':'BigUint64Array',
            'long':'BigInt64Array','unsigned long':'BigUint64Array',
            'long long':'BigInt64Array','unsigned long long':'BigUint64Array'}.get(base)

def is_64(t):return is_integer(t,width=8)
def is_wide_integer(t):
    info=scalar_info(t)
    return bool(info and info[0]=='integer' and info[1]>=8)
def is_int32(t):return is_integer(t,width=4)
def js_cast(expr,t):
    info=scalar_info(t)
    if info is None:return expr
    family,width,unsigned=info
    if family=='extended-floating':raise Unsupported('long double arithmetic requires verified extended precision')
    if family=='floating':return f'Math.fround({expr})' if width==4 else expr
    if family=='boolean':return f'Boolean({expr})'
    if width==1:return f'(u32({expr}) & 255)' if unsigned else f'((u32({expr}) << 24) >> 24)'
    if width==2:return f'(u32({expr}) & 65535)' if unsigned else f'((u32({expr}) << 16) >> 16)'
    if width==4:return f'u32({expr})' if unsigned else f'i32({expr})'
    if width==8:return f'{'u64' if unsigned else 'i64'}({expr})'
    if width==16:return f'{'u128' if unsigned else 'i128'}({expr})'
    return expr

class Unsupported(Exception):
    def __init__(self,feature,*,required_records=()):
        super().__init__(feature)
        self.required_records=tuple(name for name in required_records if isinstance(name,str) and name)

def declared_array_alignment(node,type_aliases=None):
    attrs=[v for v in kids(node) if kind(v)=='AlignedAttr']
    if not attrs:return None
    typ=qual(node)
    shape=re.fullmatch(r'(.+?)\s*\[\s*([1-9]\d*)\s*\]',typ)
    if not shape or not typed_pointer(resolve_scalar_storage_alias(shape[1],type_aliases or {})+' *'):
        raise Unsupported('explicit alignment requires one contiguous scalar array: '+typ)
    values=[]
    for attr in attrs:
        parts=kids(attr)
        if len(parts)!=1 or kind(parts[0])!='ConstantExpr' or 'value' not in parts[0]:
            raise Unsupported('explicit alignment requires Clang integer constant')
        try:value=int(str(parts[0]['value']),0)
        except ValueError:raise Unsupported('explicit alignment is not an integer')
        if value<0 or value>1048576 or value and value&(value-1):
            raise Unsupported('explicit alignment exceeds supported power-of-two allocation')
        values.append(value)
    return max([1,*values])

def aligned_storage_expression(node,value,type_aliases=None):
    alignment=declared_array_alignment(node,type_aliases)
    return 'cAlignedStorage('+value+', '+str(alignment)+')' if alignment else value

class Emit:
    def __init__(self):self.c_variadic=False;self.c_vararg_last_id=None;self.level=0;self.local_types={};self.records={};self.used=set();self.static_locals={};self.static_defs=[];self.current_function='';self.goto_plan=None;self.last_flow_report=None;self.enum_values={};self.record_layouts={};self.type_aliases={};self.function_symbols={};self.signature_symbols={};self.ambiguous_source_names=set();self.range_aliases={};self.range_sequence=0;self.trivial_destructors=set();self.aggregate_records={};self.global_storage_records={};self.pointer_span_records={};self.enum_types=set();self.member_operators={};self.member_conversions={};self.member_conversion_names={};self.copy_classes={};self.constructor_factories={};self.static_member_refs={}
    def pointer_type(self,t):
        # Fixed-enum and typedef pointees use the exact Clang scalar storage
        # ABI, including signed bytes and64-bit LP64 elements.
        if t.count('*')!=1:return typed_pointer(t)
        base,suffix=t.split('*',1)
        return typed_pointer(resolve_scalar_storage_alias(base,self.type_aliases)+' *'+suffix)
    def requires_constant_evaluation(self,node):
        queries=getattr(self,'constant_query_functions',set())
        return any(name=='__builtin_is_constant_evaluated' or (name,typ) in queries
            for name,typ in constant_query_references(node,getattr(self,'all_declarations',{})))
    def lifetime_class(self,typ):
        name=normalized_record_name(typ,self.type_aliases)
        return getattr(self,'lifetime_classes',{}).get(name)
    def scalar_reference(self,typ):
        base=lvalue_referent(typ)
        if base is None:return None
        resolved=resolve_scalar_storage_alias(base,self.type_aliases)
        if scalar_info(resolved) or re.fullmatch(r'[^()\[\]&]+\*\s*(?:const\s*)?',resolved):return resolved
        return None
    def reference_contract(self,typ):
        parts=function_type_parts(typ)
        if not parts:return None
        result,params=parts
        refs=[{'index':index,'type':self.scalar_reference(t),'const':const_referent(t)}
              for index,t in enumerate(params) if self.scalar_reference(t)]
        ret=self.scalar_reference(result)
        if not refs and not ret:return None
        return {'abi':REFERENCE_ABI,'parameters':refs,'result':ret}
    def call_type(self,n):
        if n.get('_source_byte_method_call'):return n['_source_byte_method_call']['method_type']
        if not kids(n):return ''
        callee=kids(n)[0]
        while kind(callee) in WRAPPERS and len(kids(callee))==1:callee=kids(callee)[0]
        if kind(callee)=='DeclRefExpr':return qual(callee.get('referencedDecl',{}))
        if kind(callee)=='MemberExpr':
            return qual(callee.get('_source_member_declaration') or
                        getattr(self,'all_declarations',{}).get(callee.get('referencedMemberDecl'),{}))
        return qual(kids(n)[0])
    def reference_argument(self,n,typ):
        original=n
        temporary=False
        while kind(original) in WRAPPERS and len(kids(original))==1:
            temporary=temporary or kind(original)=='MaterializeTemporaryExpr'
            original=kids(original)[0]
        if original.get('valueCategory')=='lvalue' and not temporary:
            return self.lvalue_reference(n)
        if const_referent(typ):
            value=self.expression_temp()
            return '(('+value+') => cRef(() => '+value+', () => { throw new TypeError("const C++ reference write"); }))('+self.expr(n)+')'
        raise Unsupported('mutable C++ reference requires original lvalue')
    def call_expression(self,n,target,as_reference=False,argument_nodes=None,prefix_arguments=()):
        parts=function_type_parts(self.call_type(n))
        arguments=kids(n)[1:] if argument_nodes is None else argument_nodes
        types=parts[1] if parts else []
        values=[self.reference_argument(v,types[index])
                if index<len(types) and self.scalar_reference(types[index]) else self.expr(v)
                for index,v in enumerate(arguments)]
        contract=self.reference_contract(self.call_type(n))
        callee=kids(n)[0]
        while kind(callee) in WRAPPERS and len(kids(callee))==1:callee=kids(callee)[0]
        if contract and kind(callee)=='MemberExpr' and kids(callee) and not prefix_arguments:
            receiver=qual(kids(callee)[0]).strip().rstrip('*&').strip()
            owner=normalized_record_name(receiver,self.type_aliases)
            if owner:self.used_reference_classes=getattr(self,'used_reference_classes',set())|{owner}
        if contract and re.fullmatch(r'[A-Za-z_$][\w$]*',target):
            if prefix_arguments:
                contract={**contract,'parameters':[{**parameter,'index':parameter['index']+len(prefix_arguments)}
                    for parameter in contract['parameters']]}
            imports=getattr(self,'used_reference_contracts',{})
            if target in imports and imports[target]!=contract:
                raise Unsupported('conflicting C++ reference call contracts: '+target)
            self.used_reference_contracts={**imports,target:contract}
        result=target+'('+', '.join([*prefix_arguments,*values])+')'
        returns_ref=bool(parts and self.scalar_reference(parts[0]))
        if as_reference:
            if not returns_ref:raise Unsupported('call has no Clang-proven scalar reference result')
            return result
        return '('+result+').value' if returns_ref else result
    def constructor_arguments(self,n):
        parts=function_type_parts(n.get('ctorType',{}).get('qualType',''))
        if self.reference_contract(n.get('ctorType',{}).get('qualType','')):
            owner=normalized_record_name(qual(n),self.type_aliases)
            if owner:self.used_reference_classes=getattr(self,'used_reference_classes',set())|{owner}
        types=parts[1] if parts else []
        return ', '.join(self.reference_argument(v,types[index])
                        if index<len(types) and self.scalar_reference(types[index]) else self.expr(v)
                        for index,v in enumerate(kids(n)))
    def plan_local_reference_cells(self,function):
        # A C address has stable identity even when no C++ reference appears
        # anywhere in the function. Repeated &local must reuse one lvalue cell,
        # including when stored in a pointer or used by compare-and-exchange.
        needed=set()
        def lvalue(node):
            while kind(node) in WRAPPERS and len(kids(node))==1:node=kids(node)[0]
            if kind(node)=='DeclRefExpr':
                decl=node.get('referencedDecl',{})
                if decl.get('kind') in ('VarDecl','ParmVarDecl') and not self.scalar_reference(qual(decl)):
                    needed.add(decl.get('id'))
            elif kind(node)=='ConditionalOperator':
                for branch in kids(node)[1:]:lvalue(branch)
        result=function_type_parts(qual(function))
        for node in descendants(function):
            children=kids(node);k=kind(node)
            if k=='UnaryOperator' and node.get('opcode')=='&' and children:lvalue(children[0])
            if k=='VarDecl' and self.scalar_reference(qual(node)) and children:lvalue(children[-1])
            if k=='ReturnStmt' and result and self.scalar_reference(result[0]) and children:lvalue(children[0])
            if k in ('CallExpr','CXXMemberCallExpr','CXXOperatorCallExpr'):
                parts=function_type_parts(self.call_type(node));arguments=children[1:]
                callee=children[0] if children else {}
                while kind(callee) in WRAPPERS and len(kids(callee))==1:callee=kids(callee)[0]
                if k=='CXXOperatorCallExpr' and callee.get('referencedDecl',{}).get('kind')=='CXXMethodDecl':arguments=children[2:]
            elif k in ('CXXConstructExpr','CXXTemporaryObjectExpr'):
                parts=function_type_parts(node.get('ctorType',{}).get('qualType',''));arguments=children
            else:continue
            if parts:
                for argument,typ in zip(arguments,parts[1]):
                    if self.scalar_reference(typ):lvalue(argument)
        return {node.get('id'):self.expression_temp() for node in descendants(function)
                if node.get('id') in needed and kind(node) in ('VarDecl','ParmVarDecl')
                and node.get('storageClass')!='static'
                and not self.scalar_reference(qual(node)) and (scalar_info(resolve_scalar_storage_alias(qual(node),self.type_aliases))
                    or re.fullmatch(r'[^()\[\]&]+\*\s*(?:const\s*)?',qual(node)))}
    def local_reference_declaration(self,node,name):
        binding=getattr(self,'local_reference_cells',{}).get(node.get('id'))
        if not binding:return ''
        native=getattr(self,'byte_scalar_cells',{}).get(node.get('id'))
        if native:return binding+' = cScalarStorage('+native+(', '+name if kind(node)=='ParmVarDecl' or kids(node) else '')+')'
        assigned=self.expression_temp()
        return binding+' = cRef(() => '+name+', '+assigned+' => { '+name+' = '+js_cast(assigned,qual(node))+'; })'
    def plan_byte_scalar_cells(self,function):
        """Materialize initialized scalar locals whose address is reinterpreted.

        Their single native array becomes the original object representation;
        all scalar reads/writes and address aliases use that same storage. No
        snapshots, arbitrary pointer tokens, or detached byte copies are used.
        """
        declarations={node.get('id'):node for node in descendants(function)
            if kind(node) in ('VarDecl','ParmVarDecl') and node.get('id')}
        parents={id(child):node for node in descendants(function) for child in kids(node)}
        selected={}
        casts={'CStyleCastExpr','CXXReinterpretCastExpr','CXXStaticCastExpr','ImplicitCastExpr'}
        for node in descendants(function):
            if kind(node) not in casts or '*' not in qual(node):continue
            for operation in descendants(node):
                if kind(operation)!='UnaryOperator' or operation.get('opcode')!='&' or len(kids(operation))!=1:continue
                operand=kids(operation)[0]
                while kind(operand) in WRAPPERS and len(kids(operand))==1:operand=kids(operand)[0]
                if kind(operand)!='DeclRefExpr':continue
                identity=operand.get('referencedDecl',{}).get('id');declaration=declarations.get(identity)
                if not declaration:continue
                typ=resolve_scalar_storage_alias(qual(declaration),self.type_aliases)
                info=scalar_info(typ)
                if not info or info[0] not in ('integer','floating'):continue
                native=self.pointer_type(typ+' *')
                if not native:raise Unsupported('scalar byte alias requires native scalar storage: '+typ)
                if declaration.get('storageClass')=='static':
                    raise Unsupported('static scalar byte alias requires original persistent storage')
                if kind(declaration)=='VarDecl' and not kids(declaration):
                    # `read(fd,&value,sizeof value)` needs storage before the
                    # call writes it. This allocates bytes, not a fabricated
                    # source initializer. Keep arbitrary uninitialized byte
                    # reads/escaping aliases blocked. Every selected address
                    # must be passed directly to a mutable pointer parameter.
                    current=operation;parent=parents.get(id(current))
                    while parent and kind(parent) in WRAPPERS|casts:
                        current=parent;parent=parents.get(id(current))
                    arguments=kids(parent)[1:] if parent and kind(parent) in ('CallExpr','CXXMemberCallExpr') else []
                    position=next((i for i,arg in enumerate(arguments) if arg is current),None)
                    signature=function_type_parts(self.call_type(parent)) if parent and position is not None else None
                    parameter=signature[1][position] if signature and position<len(signature[1]) else ''
                    parameter=re.sub(r'\b(?:restrict|__restrict|__restrict__)\b','',parameter).strip()
                    if not parameter.endswith('*') or re.search(r'\bconst\b',parameter.rsplit('*',1)[0]):
                        raise Unsupported('uninitialized scalar byte alias requires tracked object initialization')
                selected[identity]=native
        if selected and (needs_cfg(function) or any(kind(node)=='GotoStmt' for node in descendants(function))):
            raise Unsupported('scalar byte alias across goto requires proven storage lifetime')
        for identity in selected:
            if identity not in self.local_reference_cells:self.local_reference_cells[identity]=self.expression_temp()
        return selected
    def indirect_pointer_stride(self,t):
        # Every pointer subobject is eight bytes in the verified LP64 target.
        # A pointer-to-pointer may index those original slots, independently
        # of whether its final pointee record is complete. Exclude function
        # declarators and array spellings whose binding needs richer parsing.
        plain=re.sub(r'\b(?:const|volatile|restrict|__restrict)\b','',t).strip()
        if plain.count('*')>=2 and plain.endswith('*') and not any(c in plain for c in '()[]&'):
            return 8
        return None
    def record_pointer_stride(self,t):
        """Only Clang-proven by-value record pointees have a usable byte stride.

        A pointer spelling alone does NOT prove an element size. Require an
        exact complete record in the selected target layout; all pointer
        arithmetic still goes through checked C-array storage at runtime.
        """
        if t.count('*')!=1 or '(' in t or ')' in t or '[' in t:return None
        base=normalized_record_name(t.partition('*')[0],self.type_aliases)
        layout=self.record_layouts.get(base) if base else None
        if not isinstance(layout,dict):return None
        width=layout.get('size');alignment=layout.get('align')
        if (not isinstance(width,int) or width<=0 or
            not isinstance(alignment,int) or alignment<=0 or
            width%alignment):return None
        return width
    def record_pointer_expr(self,t,expression):
        if self.record_pointer_stride(t) is None:return None
        base=normalized_record_name(t.partition('*')[0],self.type_aliases)
        storage=self.global_storage_records.get(base)
        if base not in getattr(self,'native_byte_classes',set()) and (
                base in getattr(self,'managed_record_names',set()) or
                storage is not None and not storage.get('byte_schema')):
            return expression
        return self.record_pointer_view(t,expression)
    def record_pointer_view(self,t,expression):
        """A recovered schema also proves a view when filtered layouts are absent."""
        base=normalized_record_name(t.rstrip().rstrip('*').strip(),self.type_aliases)
        storage=self.global_storage_records.get(base,{})
        if storage.get('byte_schema'):
            shape={'byteRecord':storage['byte_schema']}
            return 'cRecordPointer('+expression+', '+json.dumps(storage['byte_schema'],sort_keys=True)+', '+self.byte_record_prototypes(shape)+')'
        if base not in getattr(self,'managed_record_names',set()) or base in getattr(self,'native_byte_classes',set()):
            view=getattr(self,'record_storage_views',{}).get(base,{})
            if view.get('byte_schema'):
                return 'cRecordPointer('+expression+', '+json.dumps(view['byte_schema'],sort_keys=True)+')'
            raise Unsupported('record pointer member requires original byte layout: '+str(base))
        return expression
    def record_object_expr(self,pointer_type,expression):
        """Use the same original storage for field reads, addresses and updates."""
        return 'cRecordObject('+self.record_pointer_view(pointer_type,expression)+')'
    def raw_record_receiver(self,expression,arrow):
        spelling=qual(expression).strip()
        stripped=expression
        while kind(stripped) in WRAPPERS and len(kids(stripped))==1:stripped=kids(stripped)[0]
        if getattr(self,'byte_this_parameter',None) and kind(stripped)=='CXXThisExpr':return True
        if arrow:
            name=normalized_record_name(spelling.rstrip('*').strip(),self.type_aliases)
            return (name in getattr(self,'record_storage_views',{}) and not self.global_storage_records.get(name,{}).get('byte_schema')
                    and (name not in getattr(self,'managed_record_names',set()) or name in getattr(self,'native_byte_classes',set())))
        while kind(expression) in WRAPPERS and len(kids(expression))==1:expression=kids(expression)[0]
        if kind(expression)=='UnaryOperator' and expression.get('opcode')=='*' and kids(expression):
            return self.raw_record_receiver(kids(expression)[0],True)
        if kind(expression)=='MemberExpr' and kids(expression) and not has_outer_indirection(qual(expression)):
            return self.raw_record_receiver(kids(expression)[0],expression.get('isArrow',False))
        return False
    def expr(self,n):
        k=kind(n); a=kids(n)
        if n.get('castKind')=='IntegralToPointer' and re.search(r'\(\s*\*\s*(?:const\s*)?\)',qual(n)):
            if len(a)!=1:raise Unsupported('Integer/function pointer conversion requires original operand')
            return 'cSourceAddresses.functionFromInteger('+self.expr(a[0])+')'
        if k=='SourceByteConstructInPlaceExpr':
            self.used_byte_methods=getattr(self,'used_byte_methods',set())|{n['helper']}
            return n['helper']+'('+', '.join(self.expr(v) for v in a)+')'
        if k=='SourceResumeCondition':
            selector=n['selector']
            selected=' || '.join(selector+' === '+json.dumps(name) for name in n['labels'])
            original=self.expr(a[0]) if a else 'true'
            return '(('+selected+') || (!'+selector+' && ('+original+')))' if selected else '(!'+selector+' && ('+original+'))'
        if k in ('ImplicitCastExpr','CStyleCastExpr','CXXStaticCastExpr','CXXFunctionalCastExpr','CXXReinterpretCastExpr') and n.get('castKind')=='NullToPointer':
            if len(a)!=1:raise Unsupported('null-pointer cast operand shape')
            zero=a[0]
            while kind(zero) in WRAPPERS and len(kids(zero))==1:zero=kids(zero)[0]
            if kind(zero) in ('CXXNullPtrLiteralExpr','GNUNullExpr') or kind(zero)=='IntegerLiteral' and zero.get('value')=='0':return 'null'
            return '('+self.expr(a[0])+', null)'
        if k in ('ImplicitCastExpr','CStyleCastExpr','CXXStaticCastExpr','CXXFunctionalCastExpr','CXXReinterpretCastExpr') and n.get('castKind')=='PointerToIntegral':
            if len(a)!=1:raise Unsupported('pointer/integer cast operand shape')
            target=resolve_scalar_storage_alias(qual(n),self.type_aliases)
            if not is_integer(target):raise Unsupported('pointer cast requires proven integer ABI: '+target)
            return js_cast('cSourceAddresses.encode('+self.expr(a[0])+')',target)
        if k in ('ImplicitCastExpr','CXXStaticCastExpr') and n.get('castKind') in ('DerivedToBase','UncheckedDerivedToBase'):
            if len(a)!=1:raise Unsupported('base pointer cast requires exact original operand')
            source=normalized_record_name(qual(a[0]).rstrip(' *&'),self.type_aliases)
            target=normalized_record_name(qual(n).rstrip(' *&'),self.type_aliases)
            if self.raw_record_receiver(a[0],True):
                current=source;seen=set()
                while current!=target and current not in seen:
                    seen.add(current)
                    bases=getattr(self,'record_storage_views',{}).get(current,{}).get('byte_schema',{}).get('bases',[])
                    if len(bases)!=1 or bases[0]['offset']!=0:break
                    current=normalized_record_name(bases[0]['type'],self.type_aliases)
                schema=getattr(self,'record_storage_views',{}).get(target,{}).get('byte_schema')
                if current!=target or not schema:raise Unsupported('base cast requires proved zero-offset original subobject')
                return 'cRecordPointer('+self.expr(a[0])+', '+json.dumps(schema,sort_keys=True)+')'
        if k=='CXXBindTemporaryExpr':
            evidence=self.lifetime_class(qual(n))
            if not evidence:
                if normalized_record_name(qual(n),self.type_aliases) in self.trivial_destructors:return self.expr(a[0])
                raise Unsupported('C++ temporary cleanup destructor requires original source provider: '+qual(n))
            scopes=getattr(self,'temporary_lifetime_scopes',[])
            if len(a)!=1 or not scopes:raise Unsupported('C++ temporary needs original full-expression cleanup scope')
            return 'cLifetime.own('+scopes[-1]+', '+self.expr(a[0])+', '+json.dumps(evidence['destroy_symbol'])+')'
        if k=='ExprWithCleanups':
            if len(a)!=1:raise Unsupported('C++ full-expression cleanup shape')
            if not any(kind(child)=='CXXBindTemporaryExpr' for child in descendants(n)):return self.expr(a[0])
            scope=self.expression_temp()
            previous=getattr(self,'temporary_lifetime_scopes',[])
            self.temporary_lifetime_scopes=[*previous,scope]
            try:value=self.expr(a[0])
            finally:self.temporary_lifetime_scopes=previous
            transfer=bool(self.lifetime_class(qual(n))) and not getattr(self,'discard_lifetime_result',False)
            return 'cLifetime.expression(('+scope+') => '+value+', '+str(transfer).lower()+')'
        if k in WRAPPERS:
            if not a:raise Unsupported(f'{k}: empty')
            if k=='ImplicitCastExpr' and n.get('castKind')=='IntegralToPointer':
                return 'cSourceAddresses.decode('+self.expr(a[0])+')'
            if k=='ImplicitCastExpr' and n.get('castKind')=='ArrayToPointerDecay':
                literal=a[0]
                while kind(literal) in WRAPPERS and len(kids(literal))==1:
                    literal=kids(literal)[0]
                if kind(literal)=='StringLiteral':
                    # C string literals have static byte storage, NOT a JS
                    # UTF-16 string. The original pointer can be indexed,
                    # offset, compared or passed to libc byte functions.
                    # Build once per Clang literal identity and preserve the
                    # trailing NUL, including embedded high-bit/zero bytes.
                    if not self.current_function:
                        raise Unsupported('C string pointer requires static literal owner')
                    if not hasattr(self,'byte_literals'):self.byte_literals={}
                    identity=literal.get('id') or n.get('id')
                    if not identity:
                        raise Unsupported('unidentified C string literal pointer')
                    if identity not in self.byte_literals:
                        binding='__cxx_literal_'+hashlib.sha256((self.current_function+'\0'+str(identity)).encode()).hexdigest()[:20]
                        payload=c_string_bytes(literal.get('value','""'))+b'\0'
                        self.static_defs.append('const '+binding+' = Uint8Array.from('+json.dumps(list(payload))+');')
                        self.byte_literals[identity]=binding
                    return self.byte_literals[identity]
            result=self.expr(a[0])
            if k=='ImplicitCastExpr' and n.get('castKind') in ('IntegralCast','IntegralToFloating','FloatingToIntegral','IntegralToBoolean','FloatingToBoolean'):
                return js_cast(result,qual(n))
            return result
        if k=='SubstNonTypeTemplateParmExpr':
            # Clang's instantiated non-type template parameter substitution
            # contains the parameter DECLARATION followed by its evaluated
            # argument expression. The declaration is not a runtime value.
            # Never lower an unspecialized template parameter by name.
            if (len(a)!=2 or kind(a[0])!='NonTypeTemplateParmDecl'
                or kind(a[1]) in ('NonTypeTemplateParmDecl','TemplateArgument')):
                raise Unsupported('non-type template substitution lacks Clang-selected argument')
            return js_cast(self.expr(a[1]),qual(n))
        if k=='VAArgExpr':
            # Clang's original va_arg type must correspond to an ABI-safe
            # promoted scalar or pointer; records via va_arg need a distinct
            # aggregate ABI and are deliberately not guessed.
            if len(a)!=1:raise Unsupported('va_arg source cursor unavailable')
            t=qual(n).strip()
            scalar=resolve_scalar_storage_alias(t,self.type_aliases)
            if not (target_type_layout(scalar,self.record_layouts,self.type_aliases)
                    and (('*' in scalar and '&' not in scalar) or
                         re.fullmatch(r'(?:const\s+)?(?:unsigned\s+|signed\s+)?(?:char|short|int|long|long long|float|double|bool|_Bool|size_t|ptrdiff_t|[ui]?int(?:8|16|32|64)_t)',scalar))):
                raise Unsupported('va_arg needs proven promoted scalar or pointer ABI: '+t)
            return js_cast('cVariadic.next('+self.expr(a[0])+')',scalar)
        if k=='IntegerLiteral':
            value=n.get('value','0')
            # Large literals must not undergo an IEEE-754 precision loss.
            return value+'n' if is_wide_integer(qual(n)) or abs(int(value,0))>2**53-1 else value
        if k=='CXXConstCastExpr':
            # A Clang-validated const_cast changes cv-qualification, not object
            # address, storage or lifetime. Keep EXACT original alias identity.
            # Do not treat a pointer cast as a load/copy of its pointee.
            if len(a)!=1 or not any(ch in qual(n) for ch in '*&'):
                raise Unsupported('const_cast requires original pointer/reference AST')
            def without_cv(t):
                return re.sub(r'\b(?:const|volatile|__restrict|restrict)\b','',t).replace(' ','')
            if without_cv(qual(n))!=without_cv(qual(a[0])):
                raise Unsupported('const_cast changes underlying target type')
            return self.expr(a[0])
        if k=='AtomicExpr':
            operation=n.get('name','')
            shape={'__atomic_load_n':('load',2),'__atomic_store_n':('store',3),
                   '__atomic_exchange_n':('exchange',3),'__atomic_compare_exchange_n':('compare',6)}
            for operator in ('add','sub','and','or','xor','nand'):
                shape['__atomic_fetch_'+operator]=(operator+':old',3)
                shape['__atomic_'+operator+'_fetch']=(operator+':new',3)
            selected=shape.get(operation)
            if not selected or len(a)!=selected[1]:raise Unsupported('source atomic operation/AST shape: '+operation)
            pointee=re.sub(r'\b(?:const|volatile|restrict|__restrict)\b','',qual(a[0])).strip()
            if not pointee.endswith('*'):raise Unsupported('source atomic operand lacks original pointer type')
            pointee=resolve_scalar_storage_alias(pointee[:-1].strip(),self.type_aliases)
            pointer=pointee.endswith('*') and '(' not in pointee
            typ=self.pointer_type(pointee+' *') if not pointer else None
            if not pointer and typ not in ('Int8Array','Uint8Array','Int16Array','Uint16Array','Int32Array','Uint32Array','BigInt64Array','BigUint64Array'):
                raise Unsupported('source atomic requires a proven integral/pointer element: '+pointee)
            if pointer and ':' in selected[0]:raise Unsupported('source atomic pointer arithmetic requires original byte stride')
            if selected[0]=='compare':
                arguments=[self.expr(a[4]),self.expr(a[2]),self.expr(a[3]),self.expr(a[5])]
            else:arguments=[self.expr(a[2])] if len(a)>2 else []
            expression='cAtomic('+', '.join([self.expr(a[0]),typ or 'null',json.dumps(selected[0]),self.expr(a[1]),*arguments])+')'
            return expression if qual(n)=='void' else js_cast(expression,qual(n))
        if k=='ImplicitValueInitExpr':
            # C++ value-initializes scalars to zero/null. Aggregate objects
            # instead need their actual recursive member constructors/layouts.
            if a:raise Unsupported('implicit value initialization with subobjects')
            t=qual(n)
            if '*' in t or re.search(r'\bnullptr_t\b',t):return 'null'
            primitive=scalar_info(resolve_scalar_storage_alias(t,self.type_aliases))
            if primitive and primitive[0]=='boolean':return 'false'
            if primitive and primitive[0]=='integer' and primitive[1]>=8:return '0n'
            if primitive and primitive[0] in ('integer','floating'):return '0'
            if re.sub(r'^enum\s+','',t) in self.enum_types:return '0'
            schema=aggregate_type_schema(t,self.aggregate_records,self.type_aliases,self.record_layouts,enum_types=self.enum_types)
            if schema is None:
                candidate=aggregate_type_schema(t,self.global_storage_records,self.type_aliases,self.record_layouts,allow_pointer_storage=True,enum_types=self.enum_types)
                if schema_has_prototype(candidate):schema=candidate
            if schema is not None and ('record' in schema or 'array' in schema):
                return self.zero_aggregate(schema)
            raise Unsupported('implicit aggregate initialization requires constructor: '+t)
        if k=='CXXDefaultInitExpr':
            # Clang has already substituted the actual in-class initializer.
            # Empty placeholders must not silently become zero.
            if len(a)!=1:raise Unsupported('default member initializer lacks AST')
            return self.expr(a[0])
        if k=='CXXDefaultArgExpr':
            # Clang includes the actual default-expression AST after overload
            # resolution. Do not guess the default from a signature or use a
            # fabricated zero; lower the original expression if supported.
            if len(a)!=1:raise Unsupported('default argument without original initializer AST')
            return self.expr(a[0])
        if k=='FloatingLiteral':return js_cast(n.get('value','0.0'),qual(n))
        if k=='CharacterLiteral':return str(n.get('value',0))
        if k=='CXXBoolLiteralExpr':return 'true' if n.get('value',False) else 'false'
        if k in ('CXXNullPtrLiteralExpr','GNUNullExpr'):return 'null'
        if k=='CXXThisExpr':return getattr(self,'byte_this_parameter',None) or 'this'
        if k=='DeclRefExpr':
            decl=n.get('referencedDecl',{})
            constant=getattr(self,'non_odr_static_values',{}).get(decl.get('id')) if n.get('nonOdrUseReason')=='constant' else None
            if constant:
                self.used_static_constants=getattr(self,'used_static_constants',{})|{decl['id']:constant}
                return js_cast(str(constant['value'])+('n' if is_wide_integer(constant['type']) else ''),constant['type'])
            if decl.get('id') in getattr(self,'byte_scalar_cells',{}):
                return self.local_reference_cells[decl['id']]+'.value'
            if decl.get('kind')=='CXXMethodDecl':
                method=getattr(self,'static_method_owners',{}).get(decl.get('id'))
                if not method:
                    raise Unsupported('method reference lacks exact static class owner: '+str(decl.get('name')))
                owner,member=method
                self.used_static_method_owners=getattr(self,'used_static_method_owners',set())|{owner}
                if member is None:return owner
                receiver=owner+'()' if owner in self.header_record_factories else owner
                return receiver+'.'+member
            if decl.get('id') in self.range_aliases:
                return self.range_aliases[decl['id']]
            if self.scalar_reference(qual(decl)):
                local=(self.goto_plan.alpha_locals.get(decl.get('id')) if self.goto_plan else None)
                return (local or js_ident(decl.get('name','')))+'.value'
            cell=getattr(self,'external_global_cells',{}).get(decl.get('id'))
            if cell:
                if cell['binding'] in self.global_binding_collisions:
                    raise Unsupported('global storage binding collides with original symbol: '+cell['name'])
                self.used_global_cells.add(cell['name'])
                return cell['binding']+'().value'
            if decl.get('kind')=='VarDecl' and decl.get('id') in self.static_member_refs:
                return self.static_member_refs[decl['id']]
            if decl.get('kind')=='EnumConstantDecl':
                if decl.get('id') not in self.enum_values:
                    raise Unsupported('enum constant without Clang-verified value: '+str(decl.get('name')))
                number=self.enum_values[decl['id']]
                storage=resolve_scalar_storage_alias(qual(n),self.type_aliases)
                return str(number)+'n' if is_wide_integer(storage) or abs(number)>2**53-1 else str(number)
            name=decl.get('name') or n.get('name')
            if not name:raise Unsupported('unresolved identifier')
            # C++ loop references to scalar array elements are actual lvalues,
            # never for-of copies. The lexical alias is installed only for the
            # duration of its source range-for body.
            if decl.get('id') in self.range_aliases:
                return self.range_aliases[decl['id']]
            if self.goto_plan and decl.get('id') in self.goto_plan.alpha_locals:
                return self.goto_plan.alpha_locals[decl['id']]
            if decl.get('kind')=='VarDecl':
                if decl.get('id') in self.function_symbols:
                    return self.function_symbols[decl['id']]
                if decl.get('id') not in getattr(self,'lexical_local_ids',set()):
                    # Header-stored values can have separate Clang declaration
                    # IDs after redeclaration; only a uniquely proven variable
                    # signature may resolve to the translated TU-local owner.
                    for spelling in (decl.get('type',{}).get('qualType'),
                                     decl.get('type',{}).get('desugaredQualType')):
                        target=self.signature_symbols.get((name,spelling))
                        if target:return target
            if decl.get('kind')=='FunctionDecl':
                # Type-directed C++ call resolution from Clang's semantic AST,
                # never dispatch based on JavaScript runtime typeof/arity.
                if decl.get('id') in self.function_symbols:
                    return self.function_symbols[decl['id']]
                signature=(name,decl.get('type',{}).get('qualType'))
                if signature in self.signature_symbols:
                    return self.signature_symbols[signature]
                if name in self.ambiguous_source_names:
                    raise Unsupported('ambiguous C++ overload call: '+name+' '+str(signature[1]))
            return self.static_locals.get(name,js_ident(name))
        if k=='MemberExpr':
            if not a:raise Unsupported('member without receiver')
            name=n.get('name','')
            if self.raw_record_receiver(a[0],n.get('isArrow',False)):
                owner=normalized_record_name(qual(a[0]).rstrip(' *&'),self.type_aliases)
                view=getattr(self,'record_storage_views',{}).get(owner,{})
                selected=n.get('_source_member_declaration') or getattr(self,'all_declarations',{}).get(n.get('referencedMemberDecl'),{})
                if selected.get('kind') in ('CXXMethodDecl','CXXConversionDecl'):
                    raise Unsupported('nontrivial byte-view method requires original class prototype: '+str(owner)+'::'+name)
                if name and name not in view.get('byte_schema',{}).get('fields',{}):
                    raise Unsupported('record field requires verified native storage: '+str(owner)+'::'+name)
            if not name and any(n.get('referencedMemberDecl') in record.get('flattened_anonymous_members',()) or
                    clean_record_type(qual(n)) in record.get('flattened_anonymous_types',())
                    for record in self.global_storage_records.values()):
                receiver=self.expr(a[0])
                return f'cRecordObject({receiver})' if n.get('isArrow') else receiver
            if name.startswith('~'):
                receiver_type=re.sub(r'[&*]+\s*$','',qual(a[0])).strip()
                evidence=self.lifetime_class(receiver_type)
                if not evidence or name!='~'+evidence['record']['name']:
                    raise Unsupported('explicit C++ destructor requires original source class ABI: '+receiver_type)
                receiver=self.expr(a[0])
                if n.get('isArrow'):receiver='cRecordObject('+receiver+')'
                return '('+receiver+').'+evidence['destroy_symbol']
            if not name:
                names={identity:field for record in self.aggregate_records.values()
                       for identity,field in record.get('anonymous_members',{}).items()}
                name=names.get(n.get('referencedMemberDecl'),'')
                if not name:
                    physical_names={record.get('anonymous_member_types',{}).get(clean_record_type(qual(n)))
                        for record in self.aggregate_records.values()}
                    physical_names.discard(None)
                    if len(physical_names)==1:name=next(iter(physical_names))
            if not re.match(r'^[\w$]+$',name):
                if explicit_operator(n):
                    declaration=(n.get('_source_member_declaration') or
                        getattr(self,'all_declarations',{}).get(n.get('referencedMemberDecl'),{}))
                    receiver_type=re.sub(r'[&*]+\s*$','',qual(a[0])).strip()
                    cls=normalized_record_name(receiver_type,self.type_aliases)
                    if (declaration.get('kind')!='CXXMethodDecl' or declaration.get('name')!=name
                            or not qual(declaration)):
                        raise Unsupported('explicit C++ member operator requires exact source declaration: '+name)
                    resolved=self.member_operators.get((cls,name,qual(declaration)))
                    if not resolved:
                        raise Unsupported('explicit C++ member operator requires source-defined class/method ABI: '
                                          +str((cls,name,qual(declaration))))
                    name=resolved
                elif name.startswith('operator '):
                    resolved=self.member_conversions.get(n.get('referencedMemberDecl'))
                    if not resolved:
                        receiver_type=qual(a[0]).strip()
                        receiver_type=receiver_type[:-1].strip() if receiver_type.endswith('&') else receiver_type
                        cls=normalized_record_name(receiver_type,self.type_aliases)
                        resolved=self.member_conversion_names.get((cls,name))
                    if not resolved:
                        raise Unsupported('C++ conversion requires linked source-defined class method: '+name)
                    name=resolved
                else:raise Unsupported('nonidentifier member')
            receiver=self.expr(a[0])
            # Clang's arrow MemberExpr already proves record-member access.
            if not name.startswith('operator'):
                cls=normalized_record_name(re.sub(r'[&*]+\s*$','',qual(a[0])).strip(),self.type_aliases)
                if (cls,name) in getattr(self,'overloaded_member_names',set()):
                    selected=n.get('_source_member_declaration') or getattr(self,'all_declarations',{}).get(n.get('referencedMemberDecl'),{})
                    resolved=getattr(self,'member_method_symbols',{}).get((cls,name,qual(selected)))
                    if selected.get('kind')!='CXXMethodDecl' or not resolved:
                        raise Unsupported('overloaded member requires exact Clang-selected source method: '+str((cls,name)))
                    name=resolved
            # Typedef spelling and a filtered-out layout do not determine the
            # pointer representation: it may be a reference, array relocation,
            # or original class object. Resolve through the common ABI.
            if n.get('isArrow') and kind(a[0])!='CXXThisExpr':
                receiver=self.record_object_expr(qual(a[0]),receiver)
            member=receiver+'.'+name
            declaration=getattr(self,'all_declarations',{}).get(n.get('referencedMemberDecl'),{})
            return member+'.value' if self.scalar_reference(qual(declaration)) else member
        if k=='ArraySubscriptExpr':
            base=a[0]
            while kind(base) in WRAPPERS and kids(base):base=kids(base)[0]
            pointer_type=self.pointer_type(qual(a[0]))
            if pointer_type:
                return f'(cDeref(cPointerOffset({self.expr(a[0])}, {self.expr(a[1])}, {pointer_type}.BYTES_PER_ELEMENT), {pointer_type}).value)'
            if '*' in qual(a[0]):
                record_pointer=self.record_pointer_expr(qual(a[0]),self.expr(a[0]))
                if record_pointer:
                    return f'(cPointerElementRef({record_pointer}, {self.expr(a[1])}).value)'
                return f'(cPointerElementRef({self.expr(a[0])}, {self.expr(a[1])}).value)'
            return f'{self.expr(a[0])}[{self.expr(a[1])}]'
        if k in ('BinaryOperator','CompoundAssignOperator'):
            op=n.get('opcode')
            if len(a)!=2 or op is None:raise Unsupported(k+' operands')
            address_depth=getattr(self,'address_comparison_depth',0)
            if op in ('<','>','<=','>=','==','!=') and '*' in qual(a[0]) and '*' in qual(a[1]):
                self.address_comparison_depth=address_depth+1
            try:lhs=self.expr(a[0]);rhs=self.expr(a[1])
            finally:self.address_comparison_depth=address_depth
            if op in ('=','+=','-=','*=','/=','%=','&=','|=','^=','<<=','>>='):
                if not self.is_lvalue(a[0]):raise Unsupported('assignment lvalue')
                self.validate_external_global_write(a[0])
                t=self.local_types.get(lhs,qual(a[0]))
                if op!='=':
                    original=a[0]
                    while kind(original) in WRAPPERS and kids(original):original=kids(original)[0]
                    if kind(original)!='DeclRefExpr':
                        target=self.expression_temp()
                        reference=self.lvalue_reference(original)
                        lhs=target+'.value'
                    else:target=reference=None
                def assignment(value):
                    text=f'({lhs} = {value})'
                    return f'(({target}) => {text})({reference})' if op!='=' and target else text
                if op in ('+=','-=') and '*' in t:
                    scalar_pointer=self.pointer_type(t)
                    stride=(scalar_pointer+'.BYTES_PER_ELEMENT' if scalar_pointer
                            else self.record_pointer_stride(t))
                    if stride is None:raise Unsupported('pointer compound assignment requires bounded element layout: '+t)
                    offset=rhs if op=='+=' else f'-({rhs})'
                    return assignment(f'cPointerOffset({lhs}, {offset}, {stride})')
                if op=='=':
                    shape=aggregate_type_schema(t,self.global_storage_records,self.type_aliases,
                        self.record_layouts,allow_pointer_storage=True,enum_types=self.enum_types)
                    if shape and 'byteRecord' in shape:
                        return f'cAssignAggregate({lhs}, {rhs}, {json.dumps(shape,sort_keys=True)})'
                    return f'({lhs} = {js_cast(rhs,t)})'
                # JS bitwise ops already coerce to i32, arithmetic requires C-width conversion.
                sym=op[:-1]
                if is_wide_integer(t):
                    calc=f'(BigInt({lhs}) {sym} BigInt({rhs}))'
                elif is_int32(t) and sym=='*':
                    # JavaScript Number multiplication loses low bits for
                    # 32-bit operands (up to a 64-bit product). This changes
                    # integer vector coordinates and fixed-point transforms.
                    # Math.imul preserves the exact low 32 bits, matching the
                    # target C int/unsigned-int storage representation.
                    calc=f'Math.imul({lhs}, {rhs})'
                elif is_int32(t) and sym in ('+','-','/','%'):
                    calc=f'(Number({lhs}) {sym} Number({rhs}))'
                else:calc=f'({lhs} {sym} {rhs})'
                return assignment(js_cast(calc,t))
            if op==',':return f'({lhs}, {rhs})'
            if op not in ('+','-','*','/','%','<<','>>','&','|','^','==','!=','<','>','<=','>=','&&','||'):raise Unsupported('operator '+str(op))
            # Pointer arithmetic is not JavaScript numeric arithmetic.
            # Require explicit array-view lowering before accepting it.
            if op in ('+','-','<','>','<=','>=') and ('*' in qual(a[0]) or '*' in qual(a[1])):
                pointer=self.pointer_type(qual(a[0]))
                record_width=self.indirect_pointer_stride(qual(a[0])) or self.record_pointer_stride(qual(a[0]))
                stride=(pointer+'.BYTES_PER_ELEMENT' if pointer else record_width)
                if op in ('+','-') and stride and '*' not in qual(a[1]):
                    address_only=', true' if getattr(self,'address_comparison_depth',0) else ''
                    return f'cPointerOffset({lhs}, {rhs if op=="+" else "-("+rhs+")"}, {stride}{address_only})'
                if op=='-' and stride and (
                        self.pointer_type(qual(a[1]))==pointer if pointer else
                        (self.indirect_pointer_stride(qual(a[1])) or self.record_pointer_stride(qual(a[1])))==record_width):
                    return f'cPointerDiff({lhs}, {rhs}, {stride})'
                if op in ('<','>','<=','>=') and stride and (
                        self.pointer_type(qual(a[1])) if pointer else
                        (self.indirect_pointer_stride(qual(a[1])) or self.record_pointer_stride(qual(a[1])))==record_width):
                    return f'cPointerCompare({lhs}, {rhs}, {json.dumps(op)})'
                raise Unsupported('pointer arithmetic/comparison requires bounded memory view: '+qual(a[0]))
            if op in ('==','!=') and ('*' in qual(a[0]) or '*' in qual(a[1]) or self.pointer_type(qual(a[0])) or self.pointer_type(qual(a[1]))
                    or self.record_pointer_stride(qual(a[0])) or self.record_pointer_stride(qual(a[1]))):
                return f'cPointerCompare({lhs}, {rhs}, {json.dumps(op)})'
            # C integer division truncates; 64-bit integers require native BigInt.
            result_type=qual(n)
            if is_wide_integer(result_type):
                if op in ('&&','||','==','!=','<','>','<=','>='):
                    return f'({lhs} {op} {rhs})'
                lx=f'BigInt({lhs})';rx=f'BigInt({rhs})'
                return js_cast(f'({lx} {op} {rx})',result_type)
            if re.search(r'\bfloat\b',result_type) and op in ('+','-','*','/'):
                return f'Math.fround(({lhs} {op} {rhs}))'
            if op=='>>' and is_unsigned(qual(a[0])) and not is_wide_integer(result_type):
                return f'({lhs} >>> {rhs})'
            if op=='/' and is_int32(result_type):return f'Math.trunc({lhs} / {rhs})'
            if op=='*' and is_int32(result_type):
                product=f'Math.imul({lhs}, {rhs})'
                return js_cast(product,result_type)
            expression=f'({lhs} {op} {rhs})'
            if op in ('<<','>>','&','|','^'):
                # ECMAScript's bitwise result is signed i32, whereas C's
                # bitwise result follows the *Clang-proven* expression type.
                # In particular, a u32 LE load using byte | (byte << 24)
                # must zero-extend before promotion into a 64-bit bit buffer.
                # Otherwise any byte >= 128 sign-extends to 64 bits and
                # corrupts dynamic-Huffman streams during native JS execution.
                storage=n.get('type',{}).get('desugaredQualType') or resolve_scalar_storage_alias(result_type,self.type_aliases)
                if is_int32(storage):return js_cast(expression,storage)
            if op in ('+','-') and is_int32(result_type):return js_cast(expression,result_type)
            return expression
        if k=='UnaryOperator':
            op=n.get('opcode')
            if op in ('++','--'):
                self.validate_external_global_write(a[0])
                target=self.expression_temp();reference=self.lvalue_reference(a[0]);t=qual(a[0])
                scalar_pointer=self.pointer_type(t)
                stride=(scalar_pointer+'.BYTES_PER_ELEMENT' if scalar_pointer else self.indirect_pointer_stride(t) or self.record_pointer_stride(t))
                if '*' in t and stride is None:
                    raise Unsupported('pointer increment requires bounded element layout: '+t)
                if stride is not None:
                    change=f'cPointerOffset(previous, {1 if op=="++" else -1}, {stride})'
                else:
                    change=js_cast(f'(previous {"+" if op=="++" else "-"} {"1n" if is_wide_integer(t) else "1"})',t)
                result='previous' if n.get('isPostfix') else 'next'
                return f'(({target}) => {{ const previous = {target}.value; const next = {change}; {target}.value = next; return {result}; }})({reference})'
            if op in ('+','-','!','~'):
                if op!='!' and is_wide_integer(qual(n)):
                    value=self.expr(a[0])
                    return js_cast(value if op=='+' else f'({op}{value})',qual(n))
                return f'({op}{self.expr(a[0])})'
            if op=='&':
                node=a[0]
                while kind(node) in WRAPPERS and kids(node):node=kids(node)[0]
                if kind(node)=='DeclRefExpr':
                    if self.scalar_reference(qual(node.get('referencedDecl',{}))):
                        return self.lvalue_reference(node)
                    if node.get('referencedDecl',{}).get('id') in getattr(self,'local_reference_cells',{}):
                        return self.lvalue_reference(node)
                    if (node.get('referencedDecl',{}).get('kind')=='FunctionDecl' or
                            node.get('referencedDecl',{}).get('id') in getattr(self,'static_method_owners',{})):
                        # A source function's address is its selected callable
                        # identity, not a scalar storage reference wrapper.
                        return self.expr(node)
                    identity=node.get('referencedDecl',{}).get('id')
                    range_address=getattr(self,'range_addresses',{}).get(identity)
                    if range_address:return range_address
                    address=getattr(self,'global_address_cells',{}).get(identity)
                    if address:
                        if identity in self.external_global_cells:self.used_global_cells.add(address['name'])
                        # &array and &record address the aggregate's actual
                        # bytes. A scalar/pointer variable's address remains
                        # its lvalue slot; unwrapping that slot would confuse
                        # char** with the char* allocation stored inside it.
                        shape=aggregate_type_schema(qual(node),self.global_storage_records,
                            self.type_aliases,self.record_layouts,allow_pointer_storage=True,
                            enum_types=self.enum_types)
                        if shape and ('byteRecord' in shape or 'pointerArray' in shape or
                                'array' in shape):
                            return self.expr(node)
                        return address['binding']+'()'
                    declaration=node.get('referencedDecl',{})
                    if (declaration.get('kind')=='VarDecl' and
                            identity not in getattr(self,'lexical_local_ids',set()) and
                            identity not in getattr(self,'static_source_owners',{}) and
                            declaration.get('name') in getattr(self,'project_source_symbols',set())):
                        raise Unsupported('external object address requires a verified owner identity ABI: '+
                            str(declaration.get('name'))+' '+qual(node))
                    target=self.expr(node)
                    shape=aggregate_type_schema(qual(node),self.global_storage_records,
                        self.type_aliases,self.record_layouts,allow_pointer_storage=True,
                        enum_types=self.enum_types)
                    if identity in getattr(self,'lexical_local_ids',set()) and shape and (
                            'byteRecord' in shape or 'pointerArray' in shape or
                            'array' in shape):
                        return target
                    if is_record_pointee(qual(n)):
                        return target
                    assigned=self.expression_temp()
                    return f'cRef(() => {target}, {assigned} => {{ {target} = {assigned}; }})'
                if kind(node)=='ArraySubscriptExpr':
                    elem_pointer=self.pointer_type(qual(n))
                    record_width=self.record_pointer_stride(qual(n))
                    if elem_pointer or record_width:
                        stride=(elem_pointer+'.BYTES_PER_ELEMENT' if elem_pointer else record_width)
                        return f'cPointerOffset({self.expr(kids(node)[0])}, {self.expr(kids(node)[1])}, {stride})'
                    if qual(n).count('*')>=2:
                        return f'cPointerElementRef({self.expr(kids(node)[0])}, {self.expr(kids(node)[1])})'
                    return f'cArrayRef({self.expr(kids(node)[0])}, {self.expr(kids(node)[1])})'
                if kind(node)=='MemberExpr':
                    return self.lvalue_reference(node)
                raise Unsupported('address-of requires a stable lvalue')
            if op=='*':
                if re.search(r'\(\s*\*[^)]*\)\s*\(',qual(a[0])):
                    return self.expr(a[0])
                if kind(a[0])=='CXXThisExpr':return self.expr(a[0])
                if is_record_pointee(qual(a[0])) or self.record_pointer_stride(qual(a[0])):
                    return f'cRecordObject({self.expr(a[0])})'
                if self.pointer_type(qual(a[0])):
                    return f'(cDeref({self.expr(a[0])}, {self.pointer_type(qual(a[0]))}).value)'
                if self.indirect_pointer_stride(qual(a[0])):
                    return f'(cPointerElementRef({self.expr(a[0])}, 0).value)'
                return '('+self.expr(a[0])+').value'
            raise Unsupported('unary '+str(op))
        if k=='ConditionalOperator':return f'({self.expr(a[0])} ? {self.expr(a[1])} : {self.expr(a[2])})'
        if k=='CXXOperatorCallExpr':
            if len(a)<2:raise Unsupported('C++ operator call has no operands')
            callee=a[0]
            while kind(callee) in WRAPPERS and len(kids(callee))==1:callee=kids(callee)[0]
            decl=callee.get('referencedDecl',{}) if kind(callee)=='DeclRefExpr' else {}
            name=decl.get('name','')
            if decl.get('kind')=='CXXMethodDecl':
                if len(a)<2:raise Unsupported('C++ member operator requires receiver')
                t=qual(a[1]).strip()
                cls=normalized_record_name(t,self.type_aliases)
                key=(cls,name,decl.get('type',{}).get('qualType'))
                lifetime=getattr(self,'lifetime_classes',{}).get(cls)
                if lifetime and name=='operator=' and any(
                        member.get('id')==decl.get('id') and member.get('isImplicit')
                        for member in kids(lifetime['record'])):
                    raise Unsupported('nontrivial lifetime assignment requires verified memberwise ABI')
                assignment=(getattr(self,'trivial_assignment_methods',{}).get(decl.get('id')) or
                            getattr(self,'header_trivial_assignments',{}).get(key))
                # An implicit/defaulted C++ union/record copy-assignment
                # operator has no user-authored body to emit as a JS method.
                # Use in-place C value assignment ONLY for a complete Clang
                # record with trivial copy assignment and an exact verified
                # byte-backed schema. Never infer triviality from spelling.
                # Clang may spell a namespace-owned POD as ns::Record in the
                # operator receiver, while a filtered CXXRecordDecl carries
                # only the unqualified record name. Accept that spelling only
                # when this same AST provides a UNIQUE complete, trivially
                # assignable record declaration. Do not infer a layout from
                # the name or allow an ambiguous namespace collision.
                local_record=cls
                if (cls and '::' in cls and cls not in self.aggregate_records):
                    short=cls.rsplit('::',1)[-1]
                    if (short in getattr(self,'verified_scoped_trivial_records',set())
                        and short in self.aggregate_records):
                        local_record=short
                if not assignment and name=='operator=' and local_record in getattr(self,'implicit_byte_assignable',set()):
                    assignment={'mode':'clang-trivial-implicit-byte-copy'}
                if name=='operator=' and assignment and len(a)==3:
                    receiver=normalized_record_name(qual(a[1]),self.type_aliases)
                    argument=normalized_record_name(qual(a[2]),self.type_aliases)
                    if receiver!=argument:
                        # Clang can spell a method's injected class argument
                        # without its namespace. Reconnect only the unique
                        # complete POD already proven for this same TU.
                        short=receiver.rsplit('::',1)[-1] if receiver else None
                        if ('::' in (receiver or '') and argument==short and
                                short in getattr(self,'verified_scoped_trivial_records',set())):
                            argument=receiver
                    storage_type=local_record if receiver==cls and local_record!=cls else qual(a[1])
                    schema=aggregate_type_schema(storage_type,self.aggregate_records,self.type_aliases,self.record_layouts,enum_types=self.enum_types)
                    if schema is None:
                        schema=aggregate_type_schema(storage_type,self.global_storage_records,self.type_aliases,self.record_layouts,allow_pointer_storage=True,enum_types=self.enum_types)
                    if not receiver or receiver!=argument or schema is None:
                        raise Unsupported('trivial assignment requires matching Clang-proven pointer-free storage: '+str(key))
                    return f'cAssignAggregate({self.expr(a[1])}, {self.expr(a[2])}, {json.dumps(schema,sort_keys=True)})'
                method=self.member_operators.get(key)
                if not method:
                    raise Unsupported('C++ member operator requires source-defined class/method ABI: '+str(key),
                        required_records=(cls,) if name=='operator=' else ())
                return self.call_expression(n,self.expr(a[1])+'.'+method,argument_nodes=a[2:])
            if decl.get('kind')!='FunctionDecl' or not re.fullmatch(r'operator(?:\[\]|\(\)|[+*/%\-=&|^!<>~]+)', name) is not None:
                raise Unsupported('C++ operator has no Clang-resolved free function')
            signature=decl.get('type',{}).get('qualType')
            target=(self.function_symbols.get(decl.get('id')) or
                    self.signature_symbols.get((name,signature)))
            if not target:
                raise Unsupported('C++ operator missing uniquely emitted source definition: '+name+' '+str(signature))
            # Passing a C++ class by value or a reference through ordinary JS
            # would silently change copying/aliasing. Until the object ABI is
            # linked, only Clang-proven enum operands and arithmetic scalars
            # may use this direct type-selected operator invocation.
            call_signature=re.fullmatch(r'[^()]*\(([^()]*)\)(?:\s+noexcept)?',signature or '')
            if not call_signature:
                raise Unsupported('C++ operator parameter ABI cannot be parsed from Clang: '+str(signature))
            param_types=[p.strip() for p in call_signature.group(1).split(',')]
            if len(param_types)!=len(a)-1:
                raise Unsupported('C++ operator parameter count does not match Clang call')
            for operand,param_type in zip(a[1:],param_types):
                t=qual(operand).strip()
                basic=bool(re.fullmatch(r'(?:const )?(?:signed |unsigned )?(?:char|short|int|long|long long|bool|float|double|_Bool|(?:u?int(?:8|16|32|64)_t))',t))
                enum=t.removeprefix('const ').removeprefix('enum ').strip() in self.enum_types
                cls=normalized_record_name(param_type[:-1].strip() if param_type.endswith("&") else param_type,self.type_aliases)
                if cls in self.copy_classes:
                    # Const class lvalue references preserve JS object identity.
                    # Class-by-value must have a Clang-selected trivial copy
                    # constructor at this EXACT argument node.
                    if re.fullmatch(r'const\s+'+re.escape(cls)+r'\s*&',param_type):
                        continue
                    node=operand
                    while kind(node) in WRAPPERS and len(kids(node))==1:
                        node=kids(node)[0]
                    if param_type==cls and kind(node)=='CXXConstructExpr':
                        continue
                if not (basic or enum) or '*' in t or '&' in t:
                    raise Unsupported('C++ operator needs proven by-value operand ABI: '+param_type)
            return self.call_expression(n,target)
        if k in ('CallExpr','CXXMemberCallExpr'):
            if not a:raise Unsupported('call without callee')
            byte_call=n.get('_source_byte_method_call')
            if k=='CXXMemberCallExpr' and byte_call and kind(a[0])=='MemberExpr' and kids(a[0]) and self.raw_record_receiver(kids(a[0])[0],a[0].get('isArrow',False)):
                receiver=self.expr(kids(a[0])[0])
                receiver='cRecordObject(cRecordPointer('+receiver+', '+json.dumps(byte_call['receiver_schema'],sort_keys=True)+'))'
                target=byte_call['name']
                self.used_byte_methods=getattr(self,'used_byte_methods',set())|{target}
                return self.call_expression(n,target,prefix_arguments=[receiver],argument_nodes=byte_call['arguments'])
            target=self.expr(a[0])
            if target=='__builtin_is_constant_evaluated':
                if len(a)!=1 or qual(n)!='bool' or self.call_type(n) not in ('bool () noexcept','bool ()'):
                    raise Unsupported('constant-evaluation query requires original Clang bool builtin')
                # Emitted functions execute at runtime. Constant initializers
                # requiring evaluation of a function body are separately gated.
                self.used_runtime_queries=getattr(self,'used_runtime_queries',set())|{target}
                return 'false'
            if target=='__builtin_assume':
                if not is_unevaluated_assume(n) or qual(n)!='void':
                    raise Unsupported('assume requires original Clang void builtin signature')
                # Optimization hint only. Evaluating the argument would change C++.
                return 'void 0'
            if target in ('__builtin_expect','__builtin_expect_with_probability'):
                expected=2 if target=='__builtin_expect' else 3
                if len(a)-1!=expected:raise Unsupported('builtin arity '+target)
                # Clang requires compile-time-constant expected/probability
                # arguments. They do not affect the evaluated value.
                return self.expr(a[1])
            if target=='__builtin_assume_aligned':
                # A Clang builtin alignment promise has no runtime side
                # effects and returns precisely its input pointer. It does
                # NOT clone storage, dereference, or grant new ownership.
                # Invalid promises are C/C++ undefined behavior; a missing
                # or unproven constant must not be guessed at translation.
                if len(a) not in (3,4) or '*' not in qual(n) or '*' not in qual(a[1]):
                    raise Unsupported('assume_aligned requires pointer and 1-2 constants')
                def clang_int_constant(node):
                    while kind(node) in ('ImplicitCastExpr','ParenExpr','ConstantExpr'):
                        if kind(node)=='ConstantExpr' and node.get('value') is not None:
                            try:return int(str(node['value']),0)
                            except (ValueError,TypeError):return None
                        if len(kids(node))!=1:return None
                        node=kids(node)[0]
                    if kind(node)=='IntegerLiteral' and node.get('value') is not None:
                        try:return int(str(node['value']),0)
                        except (ValueError,TypeError):return None
                    if kind(node)=='UnaryExprOrTypeTraitExpr' and node.get('name') in ('sizeof','alignof'):
                        argument=node.get('argType',{}).get('qualType')
                        layout=target_type_layout(argument,self.record_layouts,self.type_aliases) if argument else None
                        if layout:return layout[0] if node['name']=='sizeof' else layout[1]
                    if kind(node)=='BinaryOperator' and len(kids(node))==2:
                        left=clang_int_constant(kids(node)[0]);right=clang_int_constant(kids(node)[1])
                        if left is None or right is None:return None
                        op=node.get('opcode')
                        if op=='<<' and 0<=right<=62 and left>=0:return left<<right
                        if op=='>>' and 0<=right<=62 and left>=0:return left>>right
                        if op=='+':return left+right
                        if op=='-':return left-right
                        if op=='*':return left*right
                        if op=='|':return left|right
                        if op=='&':return left&right
                        if op=='^':return left^right
                    return None
                alignment=clang_int_constant(a[2]);offset=clang_int_constant(a[3]) if len(a)==4 else 0
                if alignment is None or alignment<1 or alignment&(alignment-1) or offset is None or offset<0:
                    raise Unsupported('assume_aligned requires provable power-of-two alignment and offset')
                return self.expr(a[1])
            if target=='__builtin_umull_overflow':
                # Calculate the true 128-bit product; write the truncated u64
                # into the original output pointer, independently of the flag.
                if len(a)!=4 or 'bool' not in qual(n) or not all(
                    target_type_layout(qual(v),self.record_layouts,self.type_aliases)==(8,8)
                    for v in (a[1],a[2])) or '*' not in qual(a[3]):
                    raise Unsupported('umull_overflow requires proven 64-bit operands and output pointer')
                pointee=qual(a[3]).replace('const','').strip().rstrip('*').strip()
                if target_type_layout(pointee,self.record_layouts,self.type_aliases)!=(8,8) or not is_unsigned(pointee):
                    raise Unsupported('umull_overflow output must be unsigned 64-bit storage')
                # Preserve object-pointer identity across an ABI-equivalent C
                # pointer cast. A Clang-proven size_t* -> unsigned long* cast
                # must still refer to the caller's writable scalar object,
                # not be reconstructed as bounded ArrayBuffer storage.
                # Reject incompatible widths/signedness instead of suppressing
                # all pointer casts globally.
                def unsigned_64_storage_ptr(value):
                    spelling=qual(value).strip()
                    if not spelling.endswith('*') or spelling.count('*')!=1:return False
                    underlying=resolve_scalar_storage_alias(spelling[:-1].strip(),self.type_aliases)
                    return (target_type_layout(underlying,self.record_layouts,self.type_aliases)==(8,8)
                            and is_unsigned(underlying))
                output=a[3]
                while kind(output) in ('ImplicitCastExpr','CStyleCastExpr','ParenExpr') and len(kids(output))==1:
                    child=kids(output)[0]
                    if kind(output)=='ParenExpr' or (unsigned_64_storage_ptr(output) and unsigned_64_storage_ptr(child)):
                        output=child
                    else:break
                return 'cUMullOverflow('+', '.join((self.expr(a[1]),self.expr(a[2]),self.expr(output)))+')'
            if target=='__builtin_alloca':
                # A C alloca allocation is private contiguous byte storage,
                # valid only while the source call frame is live. JS GC owns
                # the buffer; C pointers retained past return are undefined
                # in the original language and are not granted validity.
                # Never lower alloca_with_align without its ABI alignment.
                if len(a)!=2 or '*' not in qual(n):
                    raise Unsupported('alloca needs one Clang-proven byte count and pointer result')
                amount_type=resolve_scalar_storage_alias(qual(a[1]),self.type_aliases)
                if target_type_layout(amount_type,self.record_layouts,self.type_aliases) is None or (
                    '*' in amount_type or '&' in amount_type or not re.fullmatch(
                        r'(?:const )?(?:signed |unsigned )?(?:char|short|int|long|long long|size_t|ptrdiff_t|u?int(?:8|16|32|64)_t)',amount_type)):
                    raise Unsupported('alloca count lacks verified integer ABI')
                return 'cStackAlloc('+self.expr(a[1])+')'
            if target in ('__builtin_va_start','__builtin_va_end','__builtin_va_copy'):
                if target=='__builtin_va_start':
                    if not self.c_variadic or len(a)!=3 or self.c_vararg_last_id is None:
                        raise Unsupported('va_start outside Clang-verified variadic function')
                    last=a[2]
                    while kind(last) in WRAPPERS and len(kids(last))==1:last=kids(last)[0]
                    if kind(last)!='DeclRefExpr' or last.get('referencedDecl',{}).get('id')!=self.c_vararg_last_id:
                        raise Unsupported('va_start argument not final named parameter')
                    return 'cVariadic.start('+self.expr(a[1])+', __cxx_varargs)'
                if target=='__builtin_va_end' and len(a)==2:
                    return 'cVariadic.end('+self.expr(a[1])+')'
                if target=='__builtin_va_copy' and len(a)==3:
                    return 'cVariadic.copy('+self.expr(a[1])+', '+self.expr(a[2])+')'
                raise Unsupported('unsupported C va_list builtin layout')
            if target in ('__builtin_memcpy','__builtin_memmove','__builtin_memset','__builtin_memcmp'):
                if len(a)!=4:raise Unsupported('builtin arity '+target)
                return f'cByteMemory.{target[10:]}({", ".join(self.expr(v) for v in a[1:])})'
            if target in LIBM:
                return f'{target}({", ".join(self.expr(v) for v in a[1:])})'
            if target in ('__builtin_abs','__builtin_labs','__builtin_llabs','__builtin_fabs','__builtin_fabsf'):
                expected={'__builtin_abs':(4,4),'__builtin_labs':(8,8),'__builtin_llabs':(8,8),
                          '__builtin_fabs':(8,8),'__builtin_fabsf':(4,4)}[target]
                if len(a)!=2 or target_type_layout(qual(a[1]),self.record_layouts,self.type_aliases)!=expected:
                    raise Unsupported('scalar absolute-value builtin requires original target width: '+target)
                self.used.add(target)
                return f'{target}({self.expr(a[1])})'
            if target in BUILTIN_HELPERS:
                if len(a)-1 != BUILTIN_HELPERS[target][1]:raise Unsupported('builtin arity '+target)
                self.used.add(target)
                return f'{target}({", ".join(self.expr(v) for v in a[1:])})'
            if target.startswith('__builtin_'):raise Unsupported('builtin '+target)
            return self.call_expression(n,target)
        if k in ('CXXNewExpr','CXXDeleteExpr'):
            array=n.get('isArray') is True or n.get('isArrayForm') is True
            operation=n.get('operatorNewDecl' if k=='CXXNewExpr' else 'operatorDeleteDecl',{})
            operator_key=(operation.get('name'),operation.get('type',{}).get('qualType'))
            if (n.get('isPlacement') or operation.get('kind')!='FunctionDecl' or
                    operator_key not in getattr(self,'standard_heap_operators',{})):
                raise Unsupported('C++ allocation operator requires original provider: '+str(operator_key))
            pointer_type=qual(n) if k=='CXXNewExpr' else qual(a[0]) if len(a)==1 else ''
            if not pointer_type.strip().endswith('*'):
                raise Unsupported('C++ allocation requires proven object pointer type')
            element=pointer_type.strip()[:-1].strip()
            layout=target_type_layout(element,self.record_layouts,self.type_aliases)
            if layout is None:raise Unsupported('sizeof/alignof record layout: '+element)
            native=self.pointer_type(pointer_type)
            primitive=scalar_info(resolve_scalar_storage_alias(element,self.type_aliases))
            if native and primitive:
                identity='scalar:'+json.dumps(primitive,separators=(',',':'))
            else:
                name=normalized_record_name(element,self.type_aliases)
                if array or name not in (getattr(self,'heap_classes',set())|getattr(self,'native_byte_classes',set())):
                    raise Unsupported('C++ heap object needs complete original class construction/destruction: '+element)
                identity='class:'+name
            if k=='CXXDeleteExpr':
                return 'cxxHeap.destroy('+self.expr(a[0])+', '+str(array).lower()+', '+json.dumps(identity)+')'
            if native and primitive:
                count=self.expr(a[0]) if array and a else '1'
                initializers=a[1:] if array else a
                if len(initializers)>1:raise Unsupported('C++ allocation initializer shape')
                initializer='null'
                if initializers:
                    init=initializers[0]
                    if array:
                        filler=init.get('array_filler',[])
                        if (kind(init) not in ('InitListExpr','ImplicitValueInitExpr') or kids(init) or
                                len(filler)>1 or any(kind(value)!='ImplicitValueInitExpr' or kids(value) for value in filler)):
                            raise Unsupported('C++ array new needs verified per-element initialization')
                        initializer='() => null'
                    else:
                        zero='0n' if native in ('BigInt64Array','BigUint64Array') else '0'
                        value=zero if kind(init)=='InitListExpr' and not kids(init) else self.expr(init)
                        initializer='() => '+value
                return ('cxxHeap.native('+json.dumps(native)+', '+count+', '+str(layout[0])+', '+str(layout[1])+', '
                        +json.dumps(identity)+', '+str(array).lower()+', '+initializer+')')
            if len(a)!=1 or kind(a[0])!='CXXConstructExpr':
                raise Unsupported('C++ class new requires Clang-selected constructor')
            byte_constructor=n.get('_source_byte_constructor_call')
            if byte_constructor:
                self.storage_constructor_nodes=getattr(self,'storage_constructor_nodes',set())|{id(a[0])}
                self.used_byte_methods=getattr(self,'used_byte_methods',set())|{byte_constructor['name']}
                arguments=self.constructor_arguments(a[0])
                receiver='cRecordObject(cRecordPointer(__storage, '+json.dumps(byte_constructor['schema'],sort_keys=True)+'))'
                return ('cxxHeap.record('+str(layout[0])+', '+str(layout[1])+', '+json.dumps(identity)+', '
                    '__storage => '+byte_constructor['name']+'('+receiver+(', '+arguments if arguments else '')+'))')
            lifetime=self.lifetime_class(element)
            destructor=json.dumps(lifetime['destroy_symbol']) if lifetime else 'null'
            return ('cxxHeap.object('+str(layout[0])+', '+str(layout[1])+', '+json.dumps(identity)+', () => '
                    +self.expr(a[0])+', '+destructor+')')
        if k in ('CXXConstructExpr','CXXTemporaryObjectExpr'):
            if k=='CXXTemporaryObjectExpr' and normalized_record_name(qual(n),self.type_aliases) not in self.trivial_destructors and not self.lifetime_class(qual(n)):
                raise Unsupported('C++ temporary requires Clang-proven trivial destructor')
            # Clang implicit POD copy construction is NOT `new T(...)`.
            # Copy values recursively according to a proven pointer-free field
            # schema; no aliasing of the original arrays or nested aggregates.
            name=normalized_record_name(qual(n),self.type_aliases)
            ctor=n.get('ctorType',{}).get('qualType','')
            record=self.aggregate_records.get(name)
            lifetime=self.lifetime_class(qual(n))
            if lifetime:
                if ctor not in lifetime['constructors']:
                    raise Unsupported('C++ lifetime constructor requires original source body: '+str(name)+' '+ctor)
                if not name or not re.fullmatch(r'[A-Za-z_]\w*',name):
                    raise Unsupported('constructor requires Clang-identified record type: '+qual(n),required_records=(qual(n),))
                factory=self.constructor_factories.get(name)
                if factory:
                    symbol=factory.get(ctor)
                    if not symbol:raise Unsupported('C++ lifetime constructor lacks Clang-selected original body: '+str(name)+' '+ctor)
                    self.used_class_constructors=getattr(self,'used_class_constructors',set())|{js_ident(name)}
                    return js_ident(name)+'.'+symbol+'('+self.constructor_arguments(n)+')'
                self.used_class_constructors=getattr(self,'used_class_constructors',set())|{js_ident(name)}
                return 'new '+js_ident(name)+'('+self.constructor_arguments(n)+')'
            class_fields=self.copy_classes.get(name)
            selected=re.fullmatch(r'void \((.+)\)(?: noexcept)?',ctor)
            param=selected[1].strip() if selected else ''
            owner=normalized_record_name(param.rstrip(' &'),self.type_aliases)
            is_copy=bool(name and len(a)==1 and owner==name and param.endswith('&')
                         and not param.endswith('&&') and re.search(r'\bconst\b',param))
            is_move=bool(name and len(a)==1 and owner==name and param.endswith('&&'))
            if is_copy or is_move:
                if record and record.get('byte_schema') and record.get('moveable' if is_move else 'copyable'):
                    schema={'byteRecord':record['byte_schema']}
                    self.byte_record_prototypes(schema)
                    return f'cCopyAggregate({self.expr(a[0])}, {json.dumps(schema,sort_keys=True)})'
                if class_fields is not None:
                    target=js_ident(name)+('()' if name in self.header_record_factories else '')
                    self.used_aggregate_prototypes=getattr(self,'used_aggregate_prototypes',set())|{js_ident(name)}
                    return f'cCopyTrivialClass({self.expr(a[0])}, {target}, {json.dumps(class_fields)})'
                if not record or not record['moveable' if is_move else 'copyable']:
                    raise Unsupported('record copy/move requires Clang-proven trivial semantics: '+str(name),
                        required_records=(n.get('type',{}).get('desugaredQualType') or qual(n),))
                schema=aggregate_type_schema(qual(n),self.aggregate_records,self.type_aliases,self.record_layouts,enum_types=self.enum_types)
                if schema is None:
                    raise Unsupported('aggregate copy requires verified pointer-free field shape: '+str(name))
                return f'cCopyAggregate({self.expr(a[0])}, {json.dumps(schema,sort_keys=True)})'
            cname=normalized_record_name(qual(n),self.type_aliases)
            # A proven trivial default constructor needs storage, not a
            # runtime class binding. This includes named header PODs such as
            # checksum states. Methods still require their original prototype;
            # authored construction/lifetime cannot use this path.
            if (not a and ctor in ('void ()','void () noexcept') and record
                    and not record.get('union')
                    and record.get('trivial_default_constructor')
                    and record.get('trivial_destructor') and record.get('byte_schema')
                    and not record['byte_schema'].get('prototype')):
                self.storage_constructor_nodes=getattr(self,'storage_constructor_nodes',set())|{id(n)}
                return self.zero_aggregate({'byteRecord':record['byte_schema']})
            if not cname or not re.fullmatch(r'[A-Za-z_]\w*',cname):
                raise Unsupported('constructor requires Clang-identified record type: '+qual(n),required_records=(qual(n),))
            factory=self.constructor_factories.get(cname)
            if factory:
                symbol=factory.get(ctor)
                if not symbol:
                    raise Unsupported('C++ constructor lacks Clang-selected source body: '+cname+' '+str(ctor))
                self.used_class_constructors=getattr(self,'used_class_constructors',set())|{js_ident(cname)}
                target=(f'({js_ident(cname)}())' if cname in getattr(self,'header_record_factories',set()) else js_ident(cname))
                return f'{target}.{symbol}({self.constructor_arguments(n)})'
            if not record and class_fields is None and cname not in getattr(self,'source_class_providers',set()):
                # An identifier match is not constructor evidence. C APIs can
                # legally share a spelling with a record tag (for example a
                # metadata query and its output record). Demand the actual
                # selected record before using any imported JS binding.
                raise Unsupported('constructor requires complete original record: '+qual(n),
                    required_records=(qual(n),))
            self.used_class_constructors=getattr(self,'used_class_constructors',set())|{js_ident(cname)}
            target=(f'({js_ident(cname)}())' if cname in getattr(self,'header_record_factories',set()) else js_ident(cname))
            return f'new {target}({self.constructor_arguments(n)})'
        if k=='CStyleCastExpr' or k in ('CXXStaticCastExpr','CXXFunctionalCastExpr','CXXReinterpretCastExpr'):
            if qual(n)=='void' and len(a)==1:
                # A discarded pure pointer calculation is not a memory read.
                # This includes disabled prefetch hints in original headers;
                # keep calls, volatile reads and all mutations executable.
                def pure(part):
                    tag=kind(part)
                    if re.search(r'\bvolatile\b',qual(part)):return False
                    if tag in ('DeclRefExpr','IntegerLiteral','CharacterLiteral','CXXNullPtrLiteralExpr'):
                        return not kids(part)
                    if tag in ('ImplicitCastExpr','ParenExpr','ConstantExpr','CStyleCastExpr'):
                        return len(kids(part))==1 and pure(kids(part)[0])
                    if tag=='BinaryOperator' and part.get('opcode') in ('+','-','*','&','|','^','<<','>>'):
                        return len(kids(part))==2 and all(pure(v) for v in kids(part))
                    if tag=='UnaryOperator' and part.get('opcode') in ('+','-','~','!'):
                        return len(kids(part))==1 and pure(kids(part)[0])
                    return False
                if pure(a[0]):return 'void 0'

            null_offset=self.proven_null_base_field_offset(n) if k=='CStyleCastExpr' else None
            if null_offset is not None:return str(null_offset)
            original=('cSourceAddresses.decode('+self.expr(a[0])+')'
                      if n.get('castKind')=='IntegralToPointer' else self.expr(a[0]))
            cast_t=self.pointer_type(qual(n))
            if cast_t:
                return f'cTypedPointer({original}, {cast_t})'
            target=qual(n)
            if target.strip().endswith('*'):
                base=normalized_record_name(target.strip()[:-1],self.type_aliases)
                record=self.global_storage_records.get(base,{})
                if record.get('byte_schema'):
                    shape={'byteRecord':record['byte_schema']}
                    return ('cRecordPointer('+original+', '+json.dumps(record['byte_schema'],sort_keys=True)
                        +', '+self.byte_record_prototypes(shape)+')')
            enum_name=re.sub(r'\b(?:const|volatile|enum)\b','',target).strip()
            storage=resolve_scalar_storage_alias(target,self.type_aliases) if enum_name in self.enum_types else target
            return js_cast(original,storage)
        if k=='InitListExpr':
            if self.lifetime_class(qual(n)):
                raise Unsupported('C++ lifetime aggregate initialization requires verified original class storage ABI')
            schema=aggregate_type_schema(qual(n),self.aggregate_records,self.type_aliases,self.record_layouts,enum_types=self.enum_types)
            static_zero_schema=False
            if schema is None:
                # An ordinary AUTOMATIC C++ POD can be value-initialized to
                # an object with exact null function/data-pointer fields. Do
                # not apply this rule to arbitrary copying/nontrivial records.
                schema=aggregate_type_schema(qual(n),self.global_storage_records,
                           self.type_aliases,self.record_layouts,allow_pointer_storage=True,enum_types=self.enum_types)
                static_zero_schema=schema is not None
            if schema and 'recordArray' in schema:
                return self.byte_record_array_initializer(schema,n)
            if schema and 'byteRecord' in schema:
                return self.byte_record_initializer(schema,n)
            if schema and 'pointerArray' in schema:
                values=a
                if not values and n.get('array_filler'):
                    filler=n['array_filler']
                    if kind(filler[0])!='ImplicitValueInitExpr':
                        raise Unsupported('pointer array has nonzero repeated initializer')
                    values=filler[1:]
                if len(values)>schema['pointerArray']:raise Unsupported('pointer array initializer exceeds extent')
                return ('cPointerArray('+str(schema['pointerArray'])+', ['
                        +', '.join(self.expr(value) for value in values)+'])')
            if schema and 'bytes' in schema:
                raise Unsupported('opaque union initializer needs byte-accurate member construction')
            if schema and 'record' in schema:
                fields=list(schema['record'].items())
                if not a and static_zero_schema:
                    return self.zero_aggregate(schema)
                if len(a)!=len(fields):
                    raise Unsupported('record initializer needs fully proven field values: '+qual(n))
                # Clang can encode an implicitly zeroed ARRAY/RECORD field
                # as an ImplicitValueInitExpr whose own type is only the first
                # scalar element. Use the declared FIELD schema, not that
                # scalar spelling, or `uint16_t b[3]{}` becomes `b: 0`.
                def field_value(schema,item):
                    if kind(item)=='ImplicitValueInitExpr' and not kids(item) and (
                            'array' in schema or 'record' in schema or 'pointerArray' in schema):
                        return self.zero_aggregate(schema)
                    if static_zero_schema and 'pointer' in schema:
                        if kind(item)=='ImplicitValueInitExpr' and not kids(item):return 'null'
                        raise Unsupported('automatic aggregate pointer initializer requires original owner')
                    return self.expr(item)
                value='({' + ', '.join(json.dumps(field)+': '+field_value(field_schema,item)
                    for (field,field_schema),item in zip(fields,a)) + '})'
                return self.aggregate_prototype(schema,'cMarkAggregate('+value+')')
            if schema and 'array' in schema:
                dims=schema['dims']
                if len(dims)!=1 or len(a)>dims[0]:
                    raise Unsupported('unsupported aggregate array extents')
                return 'new '+schema['array']+'(['+', '.join(self.expr(item) for item in a)+'])' if len(a)==dims[0] else (
                    '(() => { const v = new '+schema['array']+'('+str(dims[0])+'); '
                    'v.set(['+', '.join(self.expr(item) for item in a)+']); return v; })()')
            if not a:
                # `bool flag{}` MUST be false, not Boolean([]) (which is true).
                # Only scalars can be materialized without a record/array
                # initializer and its recursively verified constructors.
                t=qual(n)
                if '*' in t or t=='std::nullptr_t':return 'null'
                primitive=scalar_info(resolve_scalar_storage_alias(t,self.type_aliases))
                if primitive and primitive[0]=='boolean':return 'false'
                if primitive and primitive[0]=='integer' and primitive[1]>=8:return '0n'
                if primitive and primitive[0] in ('integer','floating'):return '0'
                if re.sub(r'^enum\s+','',t) in self.enum_types:return '0'
                if schema is not None and ('record' in schema or 'array' in schema):
                    return f'cZeroAggregate({json.dumps(schema,sort_keys=True)})'
                raise Unsupported('empty aggregate initializer requires layout: '+t)
            # A C++ scalar direct-list initializer is a scalar value, not an
            # Array expression. Returning [value] previously coerced numeric
            # results by accident and silently miscompiled bools and records.
            t=qual(n)
            if len(a)==1 and (scalar_info(resolve_scalar_storage_alias(t,self.type_aliases))
                    or re.sub(r'^enum\s+','',t) in self.enum_types or '*' in t or '&' in t):
                return js_cast(self.expr(a[0]),t)
            # Clang allows an anonymous union/record to be initialized using
            # InitListExpr. A JS array DOES NOT overlay its fields. Refuse to
            # emit code until the precise original byte representation exists.
            raise Unsupported('C aggregate list requires verified storage shape: '+t)
        if k=='UnaryExprOrTypeTraitExpr':
            # Sizes of scalar C types are statically known for the original LP64 target.
            arg_t=n.get('argType',{}).get('qualType') or (qual(a[0]) if a else '')
            layout=target_type_layout(arg_t,self.record_layouts,self.type_aliases)
            if n.get('name') in ('alignof','__alignof') and a:
                operand=a[0]
                while kind(operand) in WRAPPERS and len(kids(operand))==1:operand=kids(operand)[0]
                if kind(operand)=='DeclRefExpr':
                    declaration=getattr(self,'all_declarations',{}).get(operand.get('referencedDecl',{}).get('id'),{})
                    explicit=declared_array_alignment(declaration,self.type_aliases)
                    if explicit and layout:return str(max(explicit,layout[1]))
            if layout is None:
                raise Unsupported('sizeof/alignof record layout: '+arg_t)
            return str(layout[1] if n.get('name') in ('alignof','__alignof') else layout[0])
        if k=='StringLiteral':
            # C octal/hex escapes cannot be pasted unchanged into strict ESM.
            # JSON-encode the decoded byte units, never raw Clang spelling.
            raw=n.get('value','""')
            return json.dumps(c_string_bytes(raw).decode('latin-1'))
        if k=='PredefinedExpr':
            # Clang resolves __func__, __FUNCTION__ and __PRETTY_FUNCTION__
            # to exact source-language string literals. Preserve that proven
            # value rather than inventing a JS function-name approximation.
            if len(a)!=1 or kind(a[0])!='StringLiteral':
                raise Unsupported('predefined identifier without Clang string literal')
            return self.expr(a[0])
        if k=='OpaqueValueExpr' and a:return self.expr(a[0])
        raise Unsupported(k)
    def proven_null_base_field_offset(self, cast):
        """Resolve a C source `(size_t)&((T*)0)->field` through target ABI.

        This idiom computes an offset, not a real pointer dereference. Only an
        exact Clang NullToPointer, arrow member, and uniquely reported direct
        field of the original target layout authorize a numeric replacement.
        """
        if cast.get('castKind')!='PointerToIntegral' or len(kids(cast))!=1:
            return None
        addr=kids(cast)[0]
        while kind(addr) in WRAPPERS and len(kids(addr))==1:addr=kids(addr)[0]
        if kind(addr)!='UnaryOperator' or addr.get('opcode')!='&' or len(kids(addr))!=1:
            return None
        field_expr=kids(addr)[0]
        while kind(field_expr) in WRAPPERS and len(kids(field_expr))==1:
            field_expr=kids(field_expr)[0]
        if kind(field_expr)!='MemberExpr' or not field_expr.get('isArrow') or len(kids(field_expr))!=1:
            return None
        field=field_expr.get('name')
        if not field or not field_expr.get('referencedMemberDecl'):
            return None
        base=kids(field_expr)[0]
        while kind(base) in WRAPPERS and len(kids(base))==1:base=kids(base)[0]
        if kind(base)!='CStyleCastExpr' or len(kids(base))!=1 or not qual(base).endswith('*'):
            return None
        pointer=kids(base)[0]
        if kind(pointer)!='ImplicitCastExpr' or pointer.get('castKind')!='NullToPointer' or len(kids(pointer))!=1:
            return None
        value=kids(pointer)[0]
        while kind(value) in WRAPPERS and len(kids(value))==1:value=kids(value)[0]
        if kind(value)!='IntegerLiteral' or value.get('value')!='0':return None
        typename=re.sub(r'\b(?:const|volatile|struct|class|union)\b','',qual(base)[:-1]).strip()
        # C typedef `typedef struct netSector_s {...} netSector_t;` keeps
        # the underlying tag as the record-layout owner. Follow only the
        # Clang-declared aliases, never substitute a guessed struct by name.
        seen=set()
        while typename in self.type_aliases and typename not in seen:
            seen.add(typename)
            underlying=self.type_aliases[typename]
            stripped=re.sub(r'\b(?:const|volatile|struct|class|union)\b','',underlying).strip()
            if '*' in stripped or '&' in stripped or '[' in stripped:break
            typename=stripped
        layout=self.record_layouts.get(typename) or self.record_layouts.get('struct '+typename)
        if not layout:
            raise Unsupported('null-field offset needs Clang ABI: '+typename)
        entries=[item for item in layout.get('fields',[])
                 if re.search(r'\b'+re.escape(field)+r'$',item['declaration'])
                 and ':' not in item['declaration']]
        if len(entries)!=1 or not (0<=entries[0]['offset']<layout['size']):
            raise Unsupported('null-field offset lacks unique direct layout: '+typename+'.'+field)
        return entries[0]['offset']

    def static_pointer_initializer(self,node):
        """Accept only Clang-resolved source addresses, never pointer guesses.

        Direct object/function addresses and fixed array decay are constant
        relocations. Their source providers remain normal audited dependencies.
        Calls, integer-to-pointer casts, reads of other pointer globals, and
        unknown external object owners are deliberately not authorized here.
        """
        owners=getattr(self,'static_source_owners',{})
        signature_owners=getattr(self,'static_source_signature_owners',{})
        def constant_index(n):
            if kind(n)=='ConstantExpr' and n.get('value') is not None:return True
            if kind(n) in ('IntegerLiteral','CharacterLiteral'):return True
            if kind(n) in ('ParenExpr','ImplicitCastExpr','CStyleCastExpr') and len(kids(n))==1:
                return constant_index(kids(n)[0])
            if kind(n)=='UnaryOperator' and n.get('opcode') in ('+','-') and len(kids(n))==1:
                return constant_index(kids(n)[0])
            if kind(n)=='BinaryOperator' and n.get('opcode') in ('+','-','*','<<','>>','&','|','^') and len(kids(n))==2:
                return all(constant_index(item) for item in kids(n))
            return False
        def owner_lvalue(n):
            while kind(n) in ('ParenExpr','ImplicitCastExpr') and len(kids(n))==1:n=kids(n)[0]
            if kind(n)=='DeclRefExpr':
                declaration=n.get('referencedDecl',{})
                return (declaration.get('id') in owners or
                        (declaration.get('name'),qual(declaration)) in signature_owners or
                        (declaration.get('kind')=='VarDecl' and
                         declaration.get('name') in getattr(self,'project_source_symbols',set()) and
                         ('[' in qual(declaration) or declaration.get('id') in getattr(self,'external_global_cells',{}))))
            if kind(n)=='MemberExpr' and not n.get('isArrow') and len(kids(n))==1:
                return owner_lvalue(kids(n)[0])
            if kind(n)=='ArraySubscriptExpr' and len(kids(n))==2:
                base=kids(n)[0]
                while kind(base) in ('ParenExpr','ImplicitCastExpr') and len(kids(base))==1:base=kids(base)[0]
                return '[' in qual(base) and owner_lvalue(base) and constant_index(kids(n)[1])
            return False
        def prove(n):
            k=kind(n);a=kids(n)
            if k in ('ParenExpr','ConstantExpr','ExprWithCleanups') and len(a)==1:return prove(a[0])
            if k=='ImplicitCastExpr' and len(a)==1:
                cast=n.get('castKind')
                if cast=='FunctionToPointerDecay':
                    inner=a[0]
                    return ('function' if kind(inner)=='DeclRefExpr' and
                            inner.get('referencedDecl',{}).get('kind')=='FunctionDecl' and
                            (inner.get('referencedDecl',{}).get('id') in self.function_symbols or
                             (inner.get('referencedDecl',{}).get('name'),qual(inner.get('referencedDecl',{}))) in self.signature_symbols or
                             inner.get('referencedDecl',{}).get('name') in getattr(self,'project_source_symbols',set())) else None)
                if cast=='ArrayToPointerDecay' and owner_lvalue(a[0]):return 'array'
                if cast in ('NoOp','BitCast') and '*' in qual(n):return prove(a[0])
            if k in ('CStyleCastExpr','CXXStaticCastExpr','CXXReinterpretCastExpr') and len(a)==1:
                if '*' in qual(n) and '*' in qual(a[0]):return prove(a[0])
            if k=='UnaryOperator' and n.get('opcode')=='&' and len(a)==1:
                if kind(a[0])=='DeclRefExpr' and a[0].get('referencedDecl',{}).get('kind')=='FunctionDecl':
                    return prove({'kind':'ImplicitCastExpr','castKind':'FunctionToPointerDecay','inner':a})
                if owner_lvalue(a[0]):return 'array' if kind(a[0])=='ArraySubscriptExpr' and (self.pointer_type(qual(n)) or self.record_pointer_stride(qual(n))) else 'object'
            if k=='BinaryOperator' and n.get('opcode') in ('+','-') and len(a)==2:
                if (self.pointer_type(qual(n)) or self.record_pointer_stride(qual(n))) and prove(a[0])=='array' and constant_index(a[1]):return 'array'
            return None
        proof=prove(node)
        if proof is None:raise Unsupported('static pointer initializer requires a proven original source address: '+kind(node)+' '+qual(node))
        if proof=='function':
            target=node
            while kind(target) in WRAPPERS|{'CStyleCastExpr','CXXStaticCastExpr','CXXReinterpretCastExpr'} and len(kids(target))==1:
                target=kids(target)[0]
            if kind(target)=='UnaryOperator' and target.get('opcode')=='&':target=kids(target)[0]
            return self.expr(target)
        expression=self.expr(node)
        if proof=='array':return f'cStaticPointer(() => {expression})'
        address=node
        while kind(address) in WRAPPERS|{'CStyleCastExpr','CXXStaticCastExpr','CXXReinterpretCastExpr'} and len(kids(address))==1:
            address=kids(address)[0]
        return f'cStaticReference(() => {expression})'

    def aggregate_prototype(self,schema,value):
        prototype=schema.get('prototype')
        if not prototype:return value
        if not re.fullmatch(r'[A-Za-z_]\w*',prototype):
            raise Unsupported('aggregate methods require exact original class identity')
        if not hasattr(self,'used_aggregate_prototypes'):self.used_aggregate_prototypes=set()
        self.used_aggregate_prototypes.add(js_ident(prototype))
        target=js_ident(prototype)+('()' if prototype in getattr(self,'header_record_factories',set()) else '')
        return f'cMarkAggregate(Object.assign(Object.create({target}.prototype), {value}))'

    def zero_aggregate(self,schema):
        if 'byteRecord' in schema or 'recordArray' in schema:
            return f'cZeroAggregate({json.dumps(schema,sort_keys=True)}, {self.byte_record_prototypes(schema)})'
        if not schema_has_prototype(schema):return f'cZeroAggregate({json.dumps(schema,sort_keys=True)})'
        if 'record' not in schema:raise Unsupported('aggregate prototype requires verified record fields')
        value='({'+', '.join(json.dumps(name)+': '+self.zero_aggregate(field)
                            for name,field in schema['record'].items())+'})'
        return self.aggregate_prototype(schema,value)

    def byte_record_prototypes(self,schema):
        names=schema_prototypes(schema)
        if not hasattr(self,'used_aggregate_prototypes'):self.used_aggregate_prototypes=set()
        self.used_aggregate_prototypes.update(names)
        fields=[]
        for name in sorted(names):
            if not re.fullmatch(r'[A-Za-z_]\w*',name):
                raise Unsupported('byte record methods require exact original class identity')
            target=name+('()' if name in getattr(self,'header_record_factories',set()) else '')
            fields.append(json.dumps(name)+': () => '+target+'.prototype')
        return '{'+', '.join(fields)+'}'

    def byte_record_array_initializer(self,schema,node):
        def values(current,dims):
            if current is None or kind(current)=='ImplicitValueInitExpr' or (kind(current)=='CXXConstructExpr' and not kids(current)):
                return '[]'
            if kind(current)!='InitListExpr':raise Unsupported('record array requires original list initializer')
            items=kids(current);filler=current.get('array_filler')
            if filler:
                if items:raise Unsupported('record array has ambiguous Clang filler')
                zero=filler[0]
                if any(kind(part) not in ('InitListExpr','ImplicitValueInitExpr') for part in descendants(zero)):
                    raise Unsupported('record array has nonzero repeated filler')
                items=filler[1:]
            if len(items)>dims[0]:raise Unsupported('record array initializer exceeds original extent')
            result=[values(item,dims[1:]) if len(dims)>1 else self.byte_record_initializer({'byteRecord':schema['recordArray']},item) for item in items]
            return '['+', '.join(result)+']'
        initial=values(node,schema['dims'])
        if not self.current_function:initial='cStaticInitializerValues('+initial+')'
        return ('cByteRecordNDArray('+json.dumps(schema['recordArray'],sort_keys=True)+', '
            +json.dumps(schema['dims'])+', '+self.byte_record_prototypes(schema)+', '+initial+')')

    def byte_record_initializer(self,schema,node):
        """Materialize the original selected union member into shared bytes."""
        record=schema['byteRecord'];values=kids(node)
        if kind(node)=='ImplicitValueInitExpr' or (kind(node)=='CXXConstructExpr' and not values):
            return self.zero_aggregate(schema)
        if kind(node)=='CXXConstructExpr' and len(values)==1:
            owner=normalized_record_name(qual(node),self.type_aliases)
            selected=re.fullmatch(r'void \((.+&)\)(?: noexcept)?',node.get('ctorType',{}).get('qualType',''))
            copied=normalized_record_name(selected[1].rstrip(' &'),self.type_aliases) if selected else None
            evidence=self.aggregate_records.get(owner,{})
            if copied==owner and evidence.get('copyable'):
                source=self.expr(values[0])
                if evidence.get('opaque_union'):
                    # Existing copy-only record ABI is an exact-sized opaque
                    # Uint8Array. Snapshot that proven representation before
                    # installing the nested Clang-proven byte member views.
                    storage='cCopyAggregate('+source+', '+json.dumps({'bytes':record['size']})+')'
                    return 'cInitByteRecord('+json.dumps(record,sort_keys=True)+', {}, '+storage+', '+self.byte_record_prototypes(schema)+')'
                return 'cCopyAggregate('+source+', '+json.dumps(schema,sort_keys=True)+')'
        if kind(node)!='InitListExpr':
            raise Unsupported('byte aggregate requires Clang-selected initializer')
        fields=list(record['fields'].items())
        if record['union']:
            selected=node.get('field',{}).get('name')
            if not selected:
                selected_id=node.get('field',{}).get('id')
                selected=next((entry['anonymous_members'][selected_id]
                    for entry in self.aggregate_records.values()
                    if selected_id in entry.get('anonymous_members',{})),None)
            if not values:return self.zero_aggregate(schema)
            if selected not in record['fields'] or len(values)!=1:
                raise Unsupported('union initializer lacks exact Clang-selected field')
            fields=[(selected,record['fields'][selected])]
        elif len(values)!=len(fields):
            raise Unsupported('byte record initializer differs from Clang field count')
        initializers=[]
        for (name,field),value in zip(fields,values):
            if kind(value)=='ImplicitValueInitExpr' and not kids(value):continue
            if field.get('recordArray'):
                result=self.byte_record_array_initializer({'recordArray':field['recordArray'],'dims':field['dims']},value)
            elif field.get('pointerArray') or field.get('nativeArray'):
                def array_values(current,dims):
                    if kind(current)=='ImplicitValueInitExpr' and not kids(current):return '[]'
                    if kind(current)!='InitListExpr':raise Unsupported('member array requires Clang list initializer')
                    items=kids(current);filler=current.get('array_filler')
                    if filler:
                        if items or kind(filler[0])!='ImplicitValueInitExpr':raise Unsupported('ambiguous member array filler')
                        items=filler[1:]
                    if len(items)>dims[0]:raise Unsupported('member array initializer exceeds extent')
                    if len(dims)>1:return '['+', '.join(array_values(item,dims[1:]) for item in items)+']'
                    values=[]
                    for item in items:
                        expression=self.expr(item)
                        if field.get('pointerArray') and not self.current_function:
                            expression='null' if expression in ('0','0n','null') else self.static_pointer_initializer(item)
                        values.append(expression)
                    return '['+', '.join(values)+']'
                result=array_values(value,field['dims'])
            elif 'byteRecord' in field:
                result=self.byte_record_initializer({'byteRecord':field['byteRecord']},value)
            elif field.get('pointer') and not self.current_function:
                literal=value
                while kind(literal) in WRAPPERS and len(kids(literal))==1:literal=kids(literal)[0]
                if kind(literal)=='StringLiteral':
                    payload=c_string_bytes(literal.get('value',''))+b'\0'
                    result='Uint8Array.from('+json.dumps(list(payload))+')'
                else:
                    result=self.expr(value)
                    result='null' if result in ('null','0','0n') else self.static_pointer_initializer(value)
            elif 'length' in field:
                if kind(value)!='InitListExpr':
                    raise Unsupported('byte record array requires exact C initializer')
                items=kids(value)
                if value.get('array_filler'):
                    filler=value['array_filler']
                    if items or kind(filler[0])!='ImplicitValueInitExpr':
                        raise Unsupported('byte record array has ambiguous filler')
                    items=filler[1:]
                if len(items)>field['length']:
                    raise Unsupported('byte record array exceeds field capacity')
                result='new '+field['native']+'(['+', '.join(self.expr(item) for item in items)+'])'
            else:result=self.expr(value)
            initializers.append(json.dumps(name)+': '+result)
        initial='{'+', '.join(initializers)+'}'
        if not self.current_function:initial='cStaticInitializerValues('+initial+')'
        return 'cInitByteRecord('+json.dumps(record,sort_keys=True)+', '+initial+', null, '+self.byte_record_prototypes(schema)+')'

    def is_lvalue(self,n):
        while kind(n) in WRAPPERS and kids(n): n=kids(n)[0]
        return (kind(n) in ('DeclRefExpr','MemberExpr','ArraySubscriptExpr') or (kind(n)=='UnaryOperator' and n.get('opcode')=='*')
                or kind(n) in ('CallExpr','CXXMemberCallExpr') and bool((self.reference_contract(self.call_type(n)) or {}).get('result')))
    def expression_temp(self):
        reserved=getattr(self,'expression_bindings',set())|set(self.local_types)
        number=getattr(self,'expression_temp_sequence',0)
        while '__cxx_lvalue_'+str(number) in reserved:number+=1
        self.expression_temp_sequence=number+1
        return '__cxx_lvalue_'+str(number)
    def lvalue_reference(self,n):
        """Capture an original lvalue once before read/modify/write lowering."""
        while kind(n) in WRAPPERS and kids(n):n=kids(n)[0]
        k=kind(n);a=kids(n)
        if k=='ConditionalOperator' and len(a)==3 and n.get('valueCategory')=='lvalue':
            return '('+self.expr(a[0])+' ? '+self.lvalue_reference(a[1])+' : '+self.lvalue_reference(a[2])+')'
        if k=='DeclRefExpr':
            ranged=getattr(self,'range_addresses',{}).get(n.get('referencedDecl',{}).get('id'))
            if ranged:return ranged
            if self.scalar_reference(qual(n.get('referencedDecl',{}))):
                local=(self.goto_plan.alpha_locals.get(n.get('referencedDecl',{}).get('id')) if self.goto_plan else None)
                return local or js_ident(n.get('referencedDecl',{}).get('name',''))
            identity=n.get('referencedDecl',{}).get('id')
            local=getattr(self,'local_reference_cells',{}).get(identity)
            if local:return local
            cell=getattr(self,'global_address_cells',{}).get(identity)
            if cell:
                if identity in self.external_global_cells:self.used_global_cells.add(cell['name'])
                return cell['binding']+'()'
            value=self.expr(n)
            assigned=self.expression_temp()
            return f'cRef(() => {value}, {assigned} => {{ {value} = {assigned}; }})'
        if k=='UnaryOperator' and n.get('opcode')=='*':
            pointer=self.expr(a[0]);typ=self.pointer_type(qual(a[0]))
            return (f'cDeref({pointer}, {typ})' if typ else
                    f'cPointerElementRef({pointer}, 0)' if self.indirect_pointer_stride(qual(a[0])) or self.record_pointer_stride(qual(a[0])) else pointer)
        if k=='ArraySubscriptExpr':
            base=a[0]
            while kind(base) in WRAPPERS and kids(base):base=kids(base)[0]
            typ=self.pointer_type(qual(a[0]))
            if typ:return f'cDeref(cPointerOffset({self.expr(a[0])}, {self.expr(a[1])}, {typ}.BYTES_PER_ELEMENT), {typ})'
            if '*' in qual(a[0]):
                pointer=self.record_pointer_expr(qual(a[0]),self.expr(a[0])) or self.expr(a[0])
                return f'cPointerElementRef({pointer}, {self.expr(a[1])})'
            return f'cArrayRef({self.expr(a[0])}, {self.expr(a[1])})'
        if k=='MemberExpr' and re.fullmatch(r'[A-Za-z_$][\w$]*',n.get('name','')):
            receiver=self.expr(a[0])
            if n.get('isArrow') and kind(a[0])!='CXXThisExpr':
                receiver=self.record_object_expr(qual(a[0]),receiver)
            declaration=getattr(self,'all_declarations',{}).get(n.get('referencedMemberDecl'),{})
            if self.scalar_reference(qual(declaration)):return receiver+'.'+n['name']
            return f'cObjectFieldRef({receiver}, {json.dumps(n["name"])})'
        if k in ('CallExpr','CXXMemberCallExpr'):
            return self.call_expression(n,self.expr(a[0]),as_reference=True)
        raise Unsupported('compound lvalue requires verified reference capture')
    def validate_external_global_write(self,n):
        while kind(n) in WRAPPERS and kids(n):n=kids(n)[0]
        if kind(n)=='DeclRefExpr' and n.get('referencedDecl',{}).get('id') in getattr(self,'external_aggregate_globals',set()):
            raise Unsupported('external aggregate assignment requires verified copy/storage ABI')
    def statements(self,n,level=1):
        guard=n.get('_source_resume_guard')
        if guard and kind(n) not in ('CompoundStmt','DeclStmt','VarDecl','CaseStmt','DefaultStmt'):
            pad='  '*level
            return pad+'if ('+resume_allowed_expression(guard['selector'],guard['labels'])+') {\n'+self._statements(n,level+1)+'\n'+pad+'}'
        return self._statements(n,level)
    def _statements(self,n,level=1):
        k=kind(n);a=kids(n);pad='  '*level
        if k=='SourceResumeDispatchStmt':
            arms=[]
            for arm in n['arms']:
                label='default' if arm['condition'] is None else 'case '+self.expr(arm['condition'])
                arms.append(pad+'  '+label+': '+n['selector']+' = '+json.dumps(arm['label'])+'; break;')
            return pad+'switch ('+self.expr(n['condition'])+') {\n'+'\n'.join(arms)+'\n'+pad+'}'
        if k=='SourceResumeLabelStmt':
            return (pad+'// Original resume label: '+n['name']+'\n'+pad+'if ('+
                resume_allowed_expression(n['selector'],[n['name']])+') {\n'+pad+'  '+n['selector']+' = null;\n'+
                '\n'.join(self.statements(child,level+1) for child in a)+'\n'+pad+'}')
        control=self.goto_plan.control_prefix(n) if self.goto_plan else ''
        if k=='CompoundStmt':
            owned=[node for child in a for node in (kids(child) if kind(child)=='DeclStmt' else [child])
                   if kind(node)=='VarDecl' and self.lifetime_class(qual(node))]
            if owned:
                if self.goto_plan:raise Unsupported('nontrivial C++ automatic lifetime across goto requires proven cleanup edges')
                scope=self.expression_temp();previous=getattr(self,'automatic_lifetime_scopes',[])
                owners=getattr(self,'automatic_lifetime_owner_ids',[])
                self.automatic_lifetime_owner_ids=[*owners,{node.get('id') for node in owned}]
                self.automatic_lifetime_scopes=[*previous,scope]
                try:
                    lines=[self.statements(child,level+1) if kind(child)!='CompoundStmt' else
                           '  '*(level+1)+'{\n'+self.statements(child,level+2)+'\n'+'  '*(level+1)+'}' for child in a]
                finally:
                    self.automatic_lifetime_scopes=previous
                    self.automatic_lifetime_owner_ids=owners
                return pad+'const '+scope+' = [];\n'+pad+'try {\n'+'\n'.join(lines)+'\n'+pad+'} finally {\n'+pad+'  cLifetime.close('+scope+');\n'+pad+'}'
            if self.goto_plan and self.goto_plan.has_scope_regions(n):
                return self.goto_plan.emit(self,level,scope=n)
            lines=[]
            for child in a:
                # C nested lexical blocks own their declarations. Flattening
                # those blocks introduced duplicate JS lets and changed the
                # lifetime of shadowed locals.
                if kind(child)=='CompoundStmt':
                    lines.append(pad+'{\n'+self.statements(child,level+1)+'\n'+pad+'}')
                else:lines.append(self.statements(child,level))
            return '\n'.join(lines)
        if k=='AttributedStmt':
            # Clang's performance-only branch likelihood and C++17 fallthrough
            # attributes do not change the semantics of their wrapped statement.
            # Unknown attributes (musttail, nomerge, thread-safety, etc) are
            # intentionally NOT discarded.
            executable=[child for child in a if not kind(child).endswith('Attr')]
            attrs=[child for child in a if kind(child).endswith('Attr')]
            if len(executable)!=1 or any(kind(attr) not in ('LikelyAttr','UnlikelyAttr','FallThroughAttr') for attr in attrs):
                raise Unsupported('attributed statement has nontrivial semantics')
            return self.statements(executable[0],level)
        if k=='DeclStmt':return '\n'.join(self.statements(ch,level) for ch in a)
        if k in ('StaticAssertDecl','UsingDirectiveDecl','UsingDecl','EmptyDecl','EnumDecl',
                 'RecordDecl','CXXRecordDecl','TypedefDecl','TypeAliasDecl'):
            # Clang already validated these compile-time declarations.
            # Enum references are inlined by their Clang declaration IDs,
            # never by guessing enum member names or using JS string values.
            return ''
        # Clang attaches full-expression cleanup wrappers to ordinary C++
        # expressions. Only discard the wrapper if there are no implicit
        # destructors or cleanups that would alter original C++ lifetimes.
        if k=='ExprWithCleanups' and any(kind(child)=='CXXBindTemporaryExpr' for child in descendants(n)):
            previous=getattr(self,'discard_lifetime_result',False);self.discard_lifetime_result=True
            try:value=self.expr(n)
            finally:self.discard_lifetime_result=previous
            return pad+value+';'
        if k in ('ExprWithCleanups','FullExpr'):
            if len(a)!=1 or any(kind(x) in ('CXXBindTemporaryExpr','CXXTemporaryObjectExpr','CXXDeleteExpr') for x in descendants(n)):
                raise Unsupported('nontrivial C++ temporary cleanup')
            return self.statements(a[0],level)

        if k=='VarDecl':
            declared_array_alignment(n,self.type_aliases)
            harmless={'AlignedAttr','UsedAttr','UnusedAttr','DeprecatedAttr','FullComment'}
            attributes=[v for v in a if kind(v).endswith('Attr')]
            if any(kind(v) not in harmless for v in attributes):
                raise Unsupported('local variable attribute requires original semantics')
            a=[v for v in a if kind(v) not in harmless]
            if (n.get('constexpr') or n.get('storageClass')=='static') and self.requires_constant_evaluation(n):
                raise Unsupported('constexpr function evaluation requires Clang-proven constant initializer')
            source_name=n.get('name');name=js_ident(source_name);t=qual(n)
            if self.goto_plan and n.get('id') in self.goto_plan.alpha_locals:
                name=self.goto_plan.alpha_locals[n['id']]
            if not name:raise Unsupported('unnamed local variable')
            self.local_types[name]=t
            if self.scalar_reference(t):
                if n.get('storageClass')=='static' or not a:
                    raise Unsupported('static/uninitialized C++ reference requires original storage lifetime')
                return pad+('' if self.goto_plan else 'const ')+name+' = '+self.reference_argument(a[-1],t)+';'
            lifetime_base=re.sub(r'\[\s*\d+\s*\]','',t).rstrip(' &')
            lifetime=self.lifetime_class(lifetime_base)
            if lifetime:
                if n.get('storageClass')=='static' or '[' in t or '&' in t:
                    raise Unsupported('C++ nontrivial static/array/reference lifetime requires original storage ABI')
                scopes=getattr(self,'automatic_lifetime_scopes',[])
                if not scopes or not a or n.get('id') not in self.automatic_lifetime_owner_ids[-1]:
                    raise Unsupported('C++ automatic lifetime requires lexical construction scope')
                value=self.expr(a[-1])
                return pad+'let '+name+' = cLifetime.own('+scopes[-1]+', '+value+', '+json.dumps(lifetime['destroy_symbol'])+');'
            if n.get('storageClass')=='static':
                base=re.sub(r'\[\s*\d+\s*\]','',t).strip()
                schema=aggregate_type_schema(base,self.global_storage_records,self.type_aliases,self.record_layouts,allow_pointer_storage=True,enum_types=self.enum_types)
                if schema_has_prototype(schema):
                    raise Unsupported('function-static aggregate methods require original initialization lifetime: '+base)
                # C statics retain their value between calls. A function-local
                # JS `let` would silently reinitialize on every invocation.
                static_name='__static_'+self.current_function+'_'+name
                if re.search(r'\[\d+\]',t):
                    # Original function-local static arrays are zeroed for the
                    # full program lifetime. Their *dynamic* C++ initializers,
                    # however, run on the FIRST execution of the declaration,
                    # not when the ES module is evaluated. Detect source AST
                    # lvalue reads, calls and mutations rather than pretending
                    # those source initializers were constexpr values.
                    initializer_nodes=[v for v in descendants(n) if v is not n]
                    dynamic=any(
                        kind(part) in ('CallExpr','CXXMemberCallExpr','CXXNewExpr','CXXDeleteExpr')
                        or kind(part)=='UnaryOperator' and part.get('opcode') in ('++','--')
                        or kind(part)=='ImplicitCastExpr' and part.get('castKind')=='LValueToRValue'
                           and any(kind(ref)=='DeclRefExpr' and
                                   ref.get('referencedDecl',{}).get('kind') in ('ParmVarDecl','VarDecl')
                                   for ref in descendants(part))
                        for part in initializer_nodes)
                    # The aggregate/byte-record emitter must separately prove
                    # every element's layout and lifetime. This gate does not
                    # grant unknown constructors or pointer ownership.
                    value=global_initializer(n,self.enum_values,self.record_layouts,
                        self.global_storage_records,self.type_aliases,self.enum_types,self)
                    if dynamic:
                        guard=static_name+'__init'
                        self.static_locals[source_name]=static_name
                        self.static_defs.extend((f'let {static_name};',f'let {guard} = 0;'))
                        # C++ guard state: zero => uninitialized, one =>
                        # initializing, two => initialized. An initializer
                        # exception permits another attempt on the next call.
                        # Recursive initialization is undefined by C++; make
                        # it a hard error instead of silently sharing partial
                        # JavaScript storage.
                        return (pad+f'if ({guard} === 1) throw new TypeError("recursive C++ static initialization");\n'
                                +pad+f'if ({guard} === 0) {{\n'
                                +pad+f'  {guard} = 1;\n'
                                +pad+f'  try {{ {static_name} = {value}; {guard} = 2; }}\n'
                                +pad+f'  catch (__cxx_static_error) {{ {guard} = 0; throw __cxx_static_error; }}\n'
                                +pad+'}')
                elif a:
                    initializer=a[-1]
                    if any(kind(x)=='DeclRefExpr' and x.get('referencedDecl',{}).get('kind')=='ParmVarDecl'
                           for x in descendants(initializer)):
                        raise Unsupported('dynamic function-static initializer')
                    if kind(initializer) in ('CXXConstructExpr','CallExpr','CXXNewExpr'):
                        raise Unsupported('nonconstant function-static initializer')
                    if re.search(r'\[\d+\]',t) or ('*' in t and any(kind(v)=='StringLiteral' for v in descendants(initializer))):
                        # A C function-static array/pointer has the same native
                        # storage semantics as a file-static aggregate: stable
                        # byte memory, correct NUL capacity, never JS strings.
                        value=global_initializer(n,self.enum_values,self.record_layouts,
                            self.global_storage_records,self.type_aliases,self.enum_types)
                    else:
                        value=js_cast(self.expr(initializer),t)
                else:
                    value='false' if re.search(r'\b(bool|_Bool)\b',t) else 'null' if '*' in t else ('0n' if is_wide_integer(t) else '0')
                self.static_locals[source_name]=static_name
                self.static_defs.append(f'let {static_name} = {value};')
                return ''
            if is_clang_va_list(t):
                # Clang C++ gives the implementation __va_list_tag[1] array a
                # trivial default CXXConstructExpr. This means uninitialized
                # cursor storage, not a user-defined constructor invocation.
                if a and not (len(a)==1 and kind(a[0])=='CXXConstructExpr'
                              and not kids(a[0]) and a[0].get('ctorType',{}).get('qualType')
                              in ('void ()','void () noexcept')):
                    raise Unsupported('va_list initializer requires explicit source va_copy semantics')
                return pad+(f'{name} = cVariadic.empty();' if self.goto_plan else f'let {name} = cVariadic.empty();')
            if a:
                value=aligned_storage_expression(n,js_cast(self.expr(a[-1]),t),self.type_aliases)
                text=pad+(f'{name} = {value};' if self.goto_plan else f'let {name} = {value};')
                reference=self.local_reference_declaration(n,name)
                return text+('\n'+pad+('' if self.goto_plan else 'const ')+reference+';' if reference else '')
            # A fixed C local array allocates storage when its declaration
            # executes. The individual elements are indeterminate until
            # assigned; for a pointer array, native JS slots model those
            # original lvalues without inventing pointee objects. For numeric
            # arrays use Clang-resolved widths and bounded TypedArray storage.
            dims=[int(v) for v in re.findall(r'\[\s*(\d+)\s*\]',t)]
            if dims:
                if len(dims)>8 or any(v<1 or v>1_000_000 for v in dims):
                    raise Unsupported('C local array has unsupported capacity')
                element=re.sub(r'\[\s*\d+\s*\]','',t).strip()
                pointer_schema=aggregate_type_schema(t,self.global_storage_records,self.type_aliases,
                    self.record_layouts,allow_pointer_storage=True,enum_types=self.enum_types)
                if pointer_schema and ('pointerArray' in pointer_schema or 'recordArray' in pointer_schema):
                    value=self.zero_aggregate(pointer_schema)
                elif '*' in element and '&' not in element and '(' not in element and ')' not in element:
                    # Bounded pointer slots; a read of an uninitialized slot
                    # remains undefined, exactly as in original C.
                    def pointer_storage(extents):
                        if len(extents)==1:return f'new Array({extents[0]})'
                        return f'Array.from({{length:{extents[0]}}}, () => {pointer_storage(extents[1:])})'
                    value=pointer_storage(dims)
                else:
                    schema=aggregate_type_schema(t,self.global_storage_records,
                        self.type_aliases,self.record_layouts,allow_pointer_storage=True,enum_types=self.enum_types)
                    if not schema or 'array' not in schema:
                        raise Unsupported('C local array needs verified scalar element storage: '+t)
                    value=self.zero_aggregate(schema)
                value=aligned_storage_expression(n,value,self.type_aliases)
                return pad+(f'{name} = {value};' if self.goto_plan else f'let {name} = {value};')
            # A C record without an initializer still owns native storage.
            # Its fields remain indeterminate in the source until written;
            # an empty JS binding cannot receive the original memset(&local).
            schema=aggregate_type_schema(t,self.global_storage_records,self.type_aliases,
                self.record_layouts,allow_pointer_storage=True,enum_types=self.enum_types)
            if schema and 'byteRecord' in schema:
                value=self.zero_aggregate(schema)
                return pad+(f'{name} = {value};' if self.goto_plan else f'let {name} = {value};')
            # Uninitialized scalar locals: JS undefined, never invented zero.
            reference=self.local_reference_declaration(n,name)
            return ('' if self.goto_plan else pad+f'let {name};')+('\n'+pad+('' if self.goto_plan else 'const ')+reference+';' if reference else '')
        if k=='ReturnStmt':
            result_type=self.local_types.get('!return','')
            value=(self.reference_argument(a[0],result_type) if self.scalar_reference(result_type)
                   else js_cast(self.expr(a[0]),result_type)) if a else None
            return pad+'return'+(' '+value if a else '')+';'
        if k=='IfStmt':
            # C++17 init-statements create a new lexical scope enclosing both
            # arms, not an expression to execute once per branch. Keep the
            # original C++ initializer and condition evaluation order.
            has_init=bool(n.get('hasInit'))
            if n.get('hasVar'):
                raise Unsupported('if condition-variable lifetime requires class ABI')
            if len(a)<2+int(has_init):raise Unsupported('if shape')
            init=a[0] if has_init else None
            condition_node=a[int(has_init)]
            then_node=a[int(has_init)+1]
            else_node=a[int(has_init)+2] if len(a)>int(has_init)+2 else None
            if has_init:
                declarations=kids(init) if kind(init)=='DeclStmt' else []
                # Scope-specialization requires one trivially destructible
                # scalar initializer. C++ temporary class destructors and
                # hidden reference aliases must not be erased.
                if len(declarations)!=1 or kind(declarations[0])!='VarDecl':
                    raise Unsupported('if initializer requires single proven scalar declaration')
                dtype=qual(declarations[0])
                if ('*' in dtype or '&' in dtype or not target_type_layout(
                    dtype,self.record_layouts,self.type_aliases)):
                    raise Unsupported('if initializer has unproven lifetime/alias ABI')
                if any(kind(c) in ('CXXConstructExpr','CXXTemporaryObjectExpr')
                       for c in descendants(init)):
                    raise Unsupported('if initializer requires C++ constructor lifetime')
                initializer=self.statements(init,level+1)
                if not initializer.strip():raise Unsupported('if initializer is not emitted')
                prefix=pad+'{\n'+initializer+'\n'
                inner=level+1
            else:
                prefix='';inner=level
            ip='  '*inner
            output=ip+f'if ({self.expr(condition_node)}) {{\n'+self.statements(then_node,inner+1)+'\n'+ip+'}'
            if else_node is not None:
                output+=' else {\n'+self.statements(else_node,inner+1)+'\n'+ip+'}'
            if has_init:return prefix+output+'\n'+pad+'}'
            return output
        if k=='WhileStmt':
            if n.get('hasVar'):
                if len(a)!=3 or kind(a[0])!='DeclStmt' or len(kids(a[0]))!=1 or kind(kids(a[0])[0])!='VarDecl':
                    raise Unsupported('while condition declaration requires exact Clang shape')
                declaration=kids(a[0])[0]
                typ=resolve_scalar_storage_alias(qual(declaration),self.type_aliases)
                if not (has_outer_indirection(typ,tokens='*') or scalar_info(typ) or typ in self.enum_types) or '&' in typ:
                    raise Unsupported('while condition object requires original per-iteration lifetime')
                # C++ constructs a fresh condition variable before every test.
                # Keep its scope through the body; continue must retest only
                # after leaving this iteration's variable scope.
                initial=self.statements(a[0],level+1)
                return (pad+control+'while (true) {\n'+initial+'\n'+'  '*(level+1)
                    +'if (!('+self.expr(a[1])+')) break;\n'+self.statements(a[2],level+1)+'\n'+pad+'}')
            if len(a)!=2:raise Unsupported('while shape')
            return pad+control+f'while ({self.expr(a[0])}) {{\n{self.statements(a[1],level+1)}\n{pad}}}'
        if k=='DoStmt':
            if len(a)!=2:raise Unsupported('do shape')
            return pad+control+f'do {{\n{self.statements(a[0],level+1)}\n{pad}}} while ({self.expr(a[1])});'
        if k=='CXXForRangeStmt':
            # Clang materializes __range/__begin/__end and a loop reference.
            # Recover the ORIGINAL array iteration, not its synthesized
            # iterator-pointer arithmetic. A record reference is an object
            # identity in both C++ and JS; by-value records require copying
            # and intentionally remain unsupported here.
            raw=n.get('inner',[])
            if len(raw)!=8 or any(not v for v in raw[1:]):
                raise Unsupported('unsupported C++ range loop layout')
            range_decl=kids(raw[1]);loop_decl=kids(raw[6])
            if (kind(raw[1])!='DeclStmt' or len(range_decl)!=1
                or kind(range_decl[0])!='VarDecl' or kind(raw[6])!='DeclStmt'
                or len(loop_decl)!=1 or kind(loop_decl[0])!='VarDecl'):
                raise Unsupported('C++ range loop declaration layout')
            original=kids(range_decl[0]);ref=loop_decl[0]
            # Recognize source-defined C++ pointer-backed spans by the Clang
            # body of begin()/end(), not the name GrowArray, or a JS iterable
            # guess. __range holds an lvalue reference; __begin/end are
            # pointer-typed, and Clang must actually select those methods.
            source_type=qual(original[0]) if len(original)==1 else ''
            is_array=bool(re.search(r'\[\d+\]',source_type))
            if not is_array:
                collection_type=qual(range_decl[0])
                primary=re.match(r'^(?:const )?(?:struct |class )?([A-Za-z_]\w*(?:::[A-Za-z_]\w*)*)(?:\s*<.*>)?\s*&$',collection_type)
                contract=self.pointer_span_records.get(primary.group(1).split('::')[-1]) if primary else None
                pointer_type=qual(kids(raw[2])[0]) if kind(raw[2])=='DeclStmt' and len(kids(raw[2]))==1 else ''
                end_type=qual(kids(raw[3])[0]) if kind(raw[3])=='DeclStmt' and len(kids(raw[3]))==1 else ''
                def selected_method(index,expected):
                    declaration=kids(raw[index])
                    if len(declaration)!=1 or kind(declaration[0])!='VarDecl':return False
                    initial=kids(declaration[0])
                    if len(initial)!=1 or kind(initial[0])!='CXXMemberCallExpr':return False
                    call=kids(initial[0])
                    return bool(call and kind(call[0])=='MemberExpr' and call[0].get('name')==expected)
                # Ensure the loop is the built-in ++ / != / * iterator form
                # and that its dereference is the original ref initializer.
                condition=raw[4];increment=raw[5]
                if (not contract or not pointer_type.endswith('*') or pointer_type!=end_type
                    or not selected_method(2,'begin') or not selected_method(3,'end')
                    or kind(condition)!='BinaryOperator' or condition.get('opcode')!='!='
                    or kind(increment)!='UnaryOperator' or increment.get('opcode')!='++'):
                    raise Unsupported('C++ range iteration requires Clang-proven pointer-span begin/end')
                refid=ref.get('id')
                if not refid or len(kids(ref))!=1:
                    raise Unsupported('C++ span range loop missing element declaration')
                element_type=qual(ref).strip()
                if not (element_type.endswith('*') or element_type.endswith('&')
                        or re.fullmatch(r'(?:const )?(?:u?int(?:8|16|32|64)_t|(?:unsigned )?(?:char|short|int|long(?: long)?)|bool|float|double)',element_type)):
                    raise Unsupported('C++ span element needs scalar or pointer storage: '+element_type)
                # A by-value element is a separate C++ local. For C++ ref
                # aliases install the exact indexed lvalue; nested escaping
                # references and potential calls are intentionally rejected.
                if '&' in element_type:
                    for subtree in descendants(raw[7]):
                        if kind(subtree) in ('CallExpr','CXXMemberCallExpr','CXXConstructExpr') and any(
                            kind(x)=='DeclRefExpr' and x.get('referencedDecl',{}).get('id')==refid
                            for x in descendants(subtree)):
                            raise Unsupported('C++ span reference escapes through call')
                seq=self.range_sequence;self.range_sequence+=1
                span=f'__cxx_span_{seq}';idx=f'__cxx_span_i_{seq}'
                self.range_aliases[refid]=(f'{span}.get({idx})' if '&' not in element_type
                    else f'{span}.get({idx})')
                # Assignments to references need a setter, so block them
                # until a proven indexed lvalue is expressible.
                if '&' in element_type:
                    for x in descendants(raw[7]):
                        if kind(x) in ('BinaryOperator','CompoundAssignOperator','UnaryOperator'):
                            sub=kids(x)
                            if sub and any(kind(d)=='DeclRefExpr' and d.get('referencedDecl',{}).get('id')==refid
                                           for d in descendants(sub[0])):
                                raise Unsupported('mutable C++ span reference requires write-through alias')
                try:
                    body=self.statements(raw[7],level+2)
                finally:self.range_aliases.pop(refid,None)
                source=self.expr(original[0])
                scalar_type=element_type.rstrip(' &').strip()
                layout=target_type_layout(scalar_type,self.record_layouts,self.type_aliases)
                if not layout:raise Unsupported('C++ span element requires proven native size: '+scalar_type)
                return (pad+'{\n'+pad+f'  const {span} = cxxPointerSpan({source}, {json.dumps(contract["data"])}, {json.dumps(contract["size"])}, {layout[0]});\n'
                    +pad+'  '+control+f'for (let {idx} = 0; {idx} < {span}.length; ++{idx}) {{\n'
                    +body+'\n'+pad+'  }\n'+pad+'}')
            if (len(original)!=1 or kind(original[0]) not in ('DeclRefExpr','MemberExpr')
                or not re.search(r'\[\d+\]',qual(original[0]))
                or '&' not in qual(ref)):
                raise Unsupported('C++ range iteration requires bounded array and reference')
            loopname=js_ident(ref.get('name',''))
            if not re.fullmatch(r'[A-Za-z_$][\w$]*',loopname):
                raise Unsupported('C++ range loop requires named reference')
            refid=ref.get('id')
            if not refid:raise Unsupported('C++ range reference without Clang declaration identity')
            # Recognize only C scalar elements with a known signed/unsigned
            # primitive representation. Record references keep object identity
            # in for-of; pointer/unknown/reference-escaping storage stays gated.
            base=re.sub(r'\b(const|volatile|restrict|__restrict)\b','',qual(ref).split('&')[0]).strip()
            pointer_element=bool(re.fullmatch(r'[^()\[\]&]+\*',base))
            scalar=base in ('char','signed char','unsigned char','bool',
                            'int8_t','uint8_t','int16_t','uint16_t',
                            'int32_t','uint32_t','int64_t','uint64_t',
                            'short','unsigned short','int','unsigned int',
                            'long','unsigned long','long long','unsigned long long',
                            'float','double')
            record_schema=aggregate_type_schema(base,self.global_storage_records,self.type_aliases,
                self.record_layouts,allow_pointer_storage=True) if not scalar else None
            record_layout=target_type_layout(base,self.record_layouts,self.type_aliases) if record_schema else None
            borrowed_record=bool(record_layout and record_schema and
                ('record' in record_schema or 'byteRecord' in record_schema))
            uses_write=False
            def used_alias(node):
                return any(kind(v)=='DeclRefExpr' and
                           v.get('referencedDecl',{}).get('id')==refid
                           for v in descendants(node))
            for child in descendants(raw[7]):
                sub=kids(child)
                left=sub[0] if sub else None
                while left and kind(left) in WRAPPERS and kids(left):left=kids(left)[0]
                direct=bool(left and kind(left)=='DeclRefExpr' and
                            left.get('referencedDecl',{}).get('id')==refid)
                if direct and ((kind(child) in ('BinaryOperator','CompoundAssignOperator')
                                and child.get('opcode','').endswith('='))
                               or (kind(child)=='UnaryOperator' and child.get('opcode') in ('++','--'))):
                    uses_write=True
                if direct and kind(child)=='UnaryOperator' and child.get('opcode')=='&' and not borrowed_record:
                    raise Unsupported('address-of C++ range element requires proven pointer ABI')
                if used_alias(child) and kind(child) in ('CallExpr','CXXMemberCallExpr','CXXConstructExpr'):
                    # A C++ range record reference is an alias to its source
                    # object, so reading `entry.field` as an argument is safe
                    # when Clang proves the argument is passed by value. The
                    # record itself, an address of its field, or a reference
                    # parameter may escape; none can be lowered as a plain
                    # JS value. Scalar range references retain the old gate.
                    def member_value_only(root):
                        if kind(root)=='UnaryOperator' and root.get('opcode')=='&' and used_alias(root):
                            operand=kids(root)[0] if kids(root) else None
                            while operand and kind(operand) in WRAPPERS and kids(operand):operand=kids(operand)[0]
                            if (borrowed_record and operand and kind(operand)=='DeclRefExpr' and
                                operand.get('referencedDecl',{}).get('id')==refid and
                                normalized_record_name(qual(root).rstrip(' *'),self.type_aliases)==
                                normalized_record_name(base,self.type_aliases)):
                                return True
                            return False
                        if kind(root)=='DeclRefExpr' and root.get('referencedDecl',{}).get('id')==refid:
                            return False
                        if kind(root)=='MemberExpr' and kids(root) and used_alias(kids(root)[0]):
                            field_type=qual(root)
                            if ('&' in field_type or '(' in field_type or
                                not (target_type_layout(field_type,self.record_layouts,self.type_aliases)
                                     or '*' in field_type)):
                                return False
                            # Every use of the range alias must be inside the
                            # receiver subtree for a field read; nested calls
                            # may not silently take the record itself.
                            def member_receiver(n):
                                if kind(n)=='DeclRefExpr' and n.get('referencedDecl',{}).get('id')==refid:
                                    return True
                                if kind(n) in WRAPPERS and len(kids(n))==1:
                                    return member_receiver(kids(n)[0])
                                return False
                            if member_receiver(kids(root)[0]):return True
                        return all(member_value_only(v) for v in kids(root))
                    callee=kids(child)[0] if kids(child) else None
                    signature=qual(callee) if callee else ''
                    def pointer_by_value(root):
                        if kind(root)=='ImplicitCastExpr' and root.get('castKind')=='LValueToRValue' and len(kids(root))==1:
                            value=kids(root)[0]
                            if kind(value)=='DeclRefExpr' and value.get('referencedDecl',{}).get('id')==refid:return True
                        if kind(root)=='DeclRefExpr' and root.get('referencedDecl',{}).get('id')==refid:return False
                        if kind(root)=='UnaryOperator' and root.get('opcode')=='&' and used_alias(root):return False
                        return all(pointer_by_value(v) for v in kids(root))
                    if '&' in signature or (not pointer_by_value(child) if pointer_element else scalar or not member_value_only(child)):
                        raise Unsupported('C++ range reference escapes through call/constructor')
                if kind(child)=='VarDecl' and '&' in qual(child) and any(used_alias(v) for v in kids(child)):
                    raise Unsupported('nested C++ array reference needs lifetime/alias analysis')
            if uses_write and not (scalar or pointer_element):
                raise Unsupported('non-scalar mutable range reference requires proven object alias')
            array=self.expr(original[0]);self.local_types[loopname]=qual(ref)
            if scalar or borrowed_record or pointer_element:
                match=re.search(r'\[(\d+)\]',qual(original[0]))
                if not match:raise Unsupported('scalar range iteration without fixed C array extent')
                length=int(match.group(1))
                seq=self.range_sequence;self.range_sequence+=1
                array_var=f'__cxx_range_array_{seq}'
                position=f'__cxx_range_index_{seq}'
                self.range_aliases[refid]=f'{array_var}[{position}]'
                if not hasattr(self,'range_addresses'):self.range_addresses={}
                if borrowed_record:
                    self.range_addresses[refid]=f'cPointerOffset({array_var}, {position}, {record_layout[0]})'
                elif scalar:
                    native=self.pointer_type(base+' *')
                    if not native:raise Unsupported('scalar range reference requires native source element type: '+base)
                    self.range_addresses[refid]=f'cDeref(cPointerOffset({array_var}, {position}, {native}.BYTES_PER_ELEMENT), {native})'
                try:body=self.statements(raw[7],level+2)
                finally:
                    self.range_aliases.pop(refid,None)
                    self.range_addresses.pop(refid,None)
                return (pad+'{\n'+pad+f'  const {array_var} = {array};\n'
                    +pad+f'  if ({array_var}.length !== {length}) throw new RangeError("C array extent mismatch");\n'
                    +(pad+f'  if (!{array_var}[Symbol.for("source-first.clang-pointer-array/1")]) throw new TypeError("C pointer array storage ABI missing");\n' if pointer_element else '')
                    +pad+'  '+control+f'for (let {position} = 0; {position} < {length}; ++{position}) {{\n'
                    +body+'\n'+pad+'  }\n'+pad+'}')
            # A const/non-reassigned C++ record reference aliases the same JS
            # object identity; by-value records remain rejected above.
            return pad+control+f'for (const {loopname} of {array}) {{\n{self.statements(raw[7],level+1)}\n{pad}}}'
        if k=='ForStmt':
            # Clang includes an empty placeholder for the condition-variable slot.
            raw=n.get('inner',[])
            if len(raw)<5:raise Unsupported('for shape')
            init,condvar,cond,inc,body=raw[:5]
            if condvar:raise Unsupported('for condition-variable')
            declarations=kids(init) if init and kind(init)=='DeclStmt' else []
            owned=[node for node in declarations if kind(node)=='VarDecl' and self.lifetime_class(qual(node))]
            if owned:
                if self.goto_plan:raise Unsupported('nontrivial C++ loop lifetime across goto requires proven cleanup edges')
                scope=self.expression_temp()
                previous=getattr(self,'automatic_lifetime_scopes',[])
                owners=getattr(self,'automatic_lifetime_owner_ids',[])
                self.automatic_lifetime_scopes=[*previous,scope]
                self.automatic_lifetime_owner_ids=[*owners,{node.get('id') for node in owned}]
                loop={**n,'inner':[{},condvar,cond,inc,body]}
                try:text=self.statements(init,level+1)+'\n'+self.statements(loop,level+1)
                finally:
                    self.automatic_lifetime_scopes=previous
                    self.automatic_lifetime_owner_ids=owners
                return pad+'const '+scope+' = [];\n'+pad+'try {\n'+text+'\n'+pad+'} finally {\n'+pad+'  cLifetime.close('+scope+');\n'+pad+'}'
            if init and kind(init)=='DeclStmt':
                declarations=[x for x in kids(init) if kind(x)=='VarDecl']
                if any(d.get('id') in getattr(self,'local_reference_cells',{}) for d in declarations):
                    # C++ for-init owns one object for the entire loop. JS
                    # `for (let x=...)` creates a fresh binding per iteration,
                    # which would disconnect a retained reference closure.
                    inner='  '*(level+1)
                    initialization=self.statements(init,level+1)
                    return (pad+'{\n'+initialization+'\n'+inner+control+'for (; '+(self.expr(cond) if cond else '')+'; '
                            +(self.expr(inc) if inc else '')+') {\n'+self.statements(body,level+2)+'\n'+inner+'}\n'+pad+'}')
                if not declarations:raise Unsupported('empty declaration in for initializer')
                if len(declarations)!=len(kids(init)):
                    raise Unsupported('mixed declaration and expression in for initializer')
                # C and C++ permit several declarators in a single for-init.
                # Emit one scoped native JS let declaration (not multiple lets
                # separated by semicolons, which is invalid in for headers).
                parts=[]
                for d in declarations:
                    name=js_ident(d.get('name'));t=qual(d)
                    if self.goto_plan and d.get('id') in self.goto_plan.alpha_locals:
                        name=self.goto_plan.alpha_locals[d['id']]
                    if not name or not re.fullmatch(r'[A-Za-z_$][\w$]*',name):
                        raise Unsupported('unnamed or nonidentifier for initializer')
                    self.local_types[name]=t
                    val=js_cast(self.expr(kids(d)[-1]),t) if kids(d) else None
                    parts.append(name+(' = '+val if val is not None else ''))
                    reference=self.local_reference_declaration(d,name)
                    if reference:parts.append(reference)
                ini=(', '.join(parts) if self.goto_plan else 'let '+', '.join(parts))
            else:ini=self.expr(init) if init else ''
            return pad+control+f'for ({ini}; {self.expr(cond) if cond else ""}; {self.expr(inc) if inc else ""}) {{\n{self.statements(body,level+1)}\n{pad}}}'
        if k=='SwitchStmt':
            # C permits Duff's-device/coroutine case labels inside arbitrary
            # nested statements. JavaScript accepts case labels only as direct
            # switch-body arms. Do NOT emit a syntactically invalid module or
            # silently change the saved C coroutine resume point: the whole
            # enclosing original function must be lowered by a CFG/state-
            # machine backend before it can be counted as executable.
            def require_direct_cases(node, direct=False):
                node_kind=kind(node)
                if node_kind=='SwitchStmt':
                    return  # Nested switches validate their own body.
                if node_kind in ('CaseStmt','DefaultStmt'):
                    if not direct:
                        raise Unsupported('C switch case nested in control flow requires coroutine CFG lowering')
                    for child in kids(node):
                        require_direct_cases(child,kind(child) in ('CaseStmt','DefaultStmt'))
                    return
                for child in kids(node):
                    require_direct_cases(child,False)
            # The outer switch body's CompoundStmt is the only source of
            # directly enterable labels; nested blocks and loops are not.
            switch_body=a[-1]
            if kind(switch_body)=='CompoundStmt':
                for child in kids(switch_body):
                    require_direct_cases(child,kind(child) in ('CaseStmt','DefaultStmt'))
            # C++17 switch(init; condition) lifetime matches a lexical block
            # enclosing all cases, including fallthrough and early returns.
            has_init=bool(n.get('hasInit'))
            if n.get('hasVar'):
                raise Unsupported('switch condition-variable lifetime requires class ABI')
            if len(a)!=2+int(has_init) or kind(a[-1])!='CompoundStmt':
                raise Unsupported('switch layout')
            if has_init:
                init=a[0]
                declarations=kids(init) if kind(init)=='DeclStmt' else []
                if len(declarations)!=1 or kind(declarations[0])!='VarDecl':
                    raise Unsupported('switch initializer requires single proven scalar declaration')
                dtype=qual(declarations[0])
                if ('*' in dtype or '&' in dtype or not target_type_layout(
                    dtype,self.record_layouts,self.type_aliases)):
                    raise Unsupported('switch initializer has unproven lifetime/alias ABI')
                if any(kind(c) in ('CXXConstructExpr','CXXTemporaryObjectExpr')
                       for c in descendants(init)):
                    raise Unsupported('switch initializer requires C++ constructor lifetime')
                initializer=self.statements(init,level+1)
                if not initializer.strip():raise Unsupported('switch initializer is not emitted')
                inner=level+1
            else:inner=level
            padinner='  '*inner
            arms=self.statements(a[-1],inner+1)
            statement=padinner+control+f'switch ({self.expr(a[int(has_init)])}) {{\n{arms}\n{padinner}}}'
            if has_init:return pad+'{\n'+initializer+'\n'+statement+'\n'+pad+'}'
            return statement
        if k=='CaseStmt':
            if len(a)<2:raise Unsupported('case layout')
            label=pad+f'case {self.expr(a[0])}:'
            if kind(a[-1]) in ('CaseStmt','DefaultStmt'):
                return label+'\n'+self.statements(a[-1],level)
            return label+' {\n'+self.statements(a[-1],level+1)+'\n'+pad+'}'
        if k=='DefaultStmt':
            if len(a)!=1:raise Unsupported('default layout')
            if kind(a[0]) in ('CaseStmt','DefaultStmt'):
                return pad+'default:\n'+self.statements(a[0],level)
            return pad+'default: {\n'+self.statements(a[0],level+1)+'\n'+pad+'}'
        if k=='GotoStmt':
            if self.goto_plan is None:raise Unsupported('goto without source-flow plan')
            return (self.statements(self.goto_plan.tail_return[id(n)],level) if id(n) in self.goto_plan.tail_return else pad+self.goto_plan.target(n))
        if k=='LabelStmt':
            if self.goto_plan and (n.get('declId') in self.goto_plan.nested_terminal or n.get('declId') in self.goto_plan.labels):
                return self.statements(a[0],level)
            raise Unsupported('nested/unplanned source label')
        if k=='BreakStmt':return pad+(self.goto_plan.control_exits[id(n)] if self.goto_plan else 'break;')
        if k=='ContinueStmt':return pad+(self.goto_plan.control_exits[id(n)] if self.goto_plan else 'continue;')
        if k=='NullStmt':return pad+';'
        if k=='GCCAsmStmt':
            if id(n) in getattr(self,'empty_asm_barriers',{}):
                return pad+'; // Original empty read/write-register compiler barrier.'
            raise Unsupported('inline assembly')
        if k.endswith('Expr') or k.endswith('Operator') or k in ('CallExpr','BinaryOperator','CompoundAssignOperator'):
            return pad+self.expr(n)+';'
        raise Unsupported('statement '+k)
    def constant(self,n,symbol=None):
        if self.requires_constant_evaluation(n):
            raise Unsupported('constexpr function evaluation requires Clang-proven constant initializer')
        if self.scalar_reference(qual(n)):
            raise Unsupported('global C++ reference requires source static relocation/lifetime ABI')
        name=symbol or js_ident(n.get('name',''))
        base=re.sub(r'\[\s*\d+\s*\]','',qual(n)).strip()
        schema=aggregate_type_schema(base,self.global_storage_records,self.type_aliases,self.record_layouts,allow_pointer_storage=True,enum_types=self.enum_types)
        if schema_prototypes(schema)-getattr(self,'allowed_static_prototypes',set()):
            raise Unsupported('global aggregate methods require original static construction order: '+base)
        if not re.fullmatch(r'[A-Za-z_][\w$]*',name):raise Unsupported('nonidentifier constant')
        if '[' in qual(n):
            return f'export const {name} = {global_initializer(n, self.enum_values, self.record_layouts, self.global_storage_records, self.type_aliases, self.enum_types, self)};' if 'const ' in qual(n) else f'export let {name} = {global_initializer(n, self.enum_values, self.record_layouts, self.global_storage_records, self.type_aliases, self.enum_types, self)};'
        # `const char *p` has a const POINTEE, not a const pointer.
        # Avoid freezing mutable C/C++ pointer variables in JavaScript.
        typ=qual(n).strip()
        immutable=immutable_global(n)
        if not immutable:
            return f'export let {name} = {global_initializer(n, self.enum_values, self.record_layouts, self.global_storage_records, self.type_aliases, self.enum_types, self)};'
        value=next((v for v in kids(n) if kind(v) not in ('FullComment','DeprecatedAttr')),None)
        if not value:raise Unsupported('constant initializer unavailable')
        # const original POD globals must follow identical zero/aggregate
        # semantics to mutable originals, not a JS default class constructor.
        record_schema=aggregate_type_schema(typ,self.global_storage_records,self.type_aliases,self.record_layouts,allow_pointer_storage=True,enum_types=self.enum_types)
        if record_schema and 'record' in record_schema:
            return f'export const {name} = {global_initializer(n,self.enum_values,self.record_layouts,self.global_storage_records,self.type_aliases,self.enum_types,self)};'
        if '*' in typ:
            return f'export const {name} = {global_initializer(n,self.enum_values,self.record_layouts,self.global_storage_records,self.type_aliases,self.enum_types,self)};'
        return f'export const {name} = {js_cast(self.expr(value),qual(n))};'
    def function(self,n,method=False,symbol=None):
        name=symbol or js_ident(n.get('name',''))
        if not re.fullmatch(r'[A-Za-z_$][\w$]*',name):raise Unsupported('invalid function name '+name)
        params=[x for x in kids(n) if kind(x)=='ParmVarDecl']
        bodies=[x for x in kids(n) if kind(x)=='CompoundStmt']
        if not bodies:raise Unsupported('declaration without definition')
        if any(self.lifetime_class(qual(parameter)) for parameter in params):
            raise Unsupported('C++ nontrivial by-value parameter requires caller/callee lifetime ABI')
        self.c_variadic=bool(n.get('variadic') or n.get('isVariadic'))
        self.c_vararg_last_id=params[-1].get('id') if self.c_variadic and params else None
        if self.c_variadic and (not params or '...' not in qual(n)):
            raise Unsupported('variadic function lacks Clang-verified fixed signature')
        self.local_types={js_ident(p.get('name','')):qual(p) for p in params};self.local_types['!return']=qual(n).split('(')[0].strip();self.static_locals={};self.static_defs=[];self.byte_literals={};self.current_function=name
        self.local_reference_cells=self.plan_local_reference_cells(n)
        self.byte_scalar_cells=self.plan_byte_scalar_cells(n)
        argnames=[]
        for i,p in enumerate(params):
            argnames.append(js_ident(p.get('name') or 'arg'+str(i)))
        self.goto_plan=None;self.last_flow_report=None
        resume=None
        if any(kind(v)=='GotoStmt' for v in descendants(bodies[-1])):
            resume=recover_resume_dispatch(bodies[-1],self.expression_temp())
            if resume:bodies=[resume['body']]
        if needs_cfg(bodies[-1]):
            try:
                lowering=CoroutineCFG(bodies[-1],self)
                text,count=lowering.generate()
            except CoroutineUnsupported as exc:
                raise Unsupported('C coroutine CFG: '+str(exc)) from exc
            finally:self.goto_plan=None
            self.last_flow_report={'strategy':'source-native-coroutine-continuations',
                                   'passes':['Clang case ownership','C lexical-local identities',
                                             'source CFG and jump resolution'],
                                   'detected':{'continuation_blocks':count}}
        else:
            if any(kind(v)=='GotoStmt' for v in descendants(bodies[-1])):
                try:self.goto_plan=SourceFlowPlan(bodies[-1],self.trivial_destructors,
                    lambda name:normalized_record_name(name,self.type_aliases))
                except ControlFlowUnsupported as exc:raise Unsupported('source control flow: '+str(exc))
                parameter_ids={param.get('id') for param in params}
                self.goto_plan.hoisted_locals.extend(binding for identity,binding in self.local_reference_cells.items() if identity not in parameter_ids)
                self.last_flow_report={'passes':list(self.goto_plan.passes),'detected':dict(self.goto_plan.diagnostics),'strategy':'structured-source-labels-no-opcode-dispatch'}
            try:
                text=(('  let '+', '.join(self.goto_plan.hoisted_locals)+';\n' if self.goto_plan.hoisted_locals else '')+self.goto_plan.emit(self)) if self.goto_plan else self.statements(bodies[-1])
            finally:
                self.goto_plan=None
        if resume:
            text='  let '+resume['selector']+' = null;\n'+text
            self.last_flow_report={**(self.last_flow_report or {}),'strategy':resume['strategy'],
                'original_resume_labels':resume['labels']}
        if self.c_variadic:argnames.append('...__cxx_varargs')
        prefix=[]
        for param in params:
            ref=self.local_reference_declaration(param,js_ident(param.get('name','')))
            if ref:prefix.append('  const '+ref+';')
        text='\n'.join(prefix)+('\n' if prefix else '')+text
        header=(name if method else 'export function '+name)
        return ('\n'.join(self.static_defs)+'\n' if self.static_defs else '')+f'{header}({", ".join(argnames)}) {{\n{text}\n}}'
    def record(self,n):
        name=js_ident(n.get('name',''))
        if not re.fullmatch(r'[A-Za-z_$][\w$]*',name):raise Unsupported('unnamed/invalid C++ record')
        fields=[v for v in kids(n) if kind(v)=='FieldDecl']
        record=self.aggregate_records.get(n.get('name'),{})
        byte_schema=record.get('byte_schema') if not record.get('opaque_union') else None
        if any(not v.get('name') for v in fields) and not byte_schema:
            raise Unsupported('anonymous record fields require exact Clang byte layout')
        if n.get('bases'):raise Unsupported('C++ inheritance requires a source-level inheritance lowering pass')
        if any(v.get('isBitfield') for v in fields):raise Unsupported('bitfield record')
        lifetime=getattr(self,'lifetime_classes',{}).get(n.get('name'))
        if any(kind(v)=='CXXDestructorDecl' and any(kind(x)=='CompoundStmt' for x in kids(v)) for v in kids(n)) and not lifetime:
            raise Unsupported('nontrivial C++ destructor requires standalone source lifetime ABI')
        if any(kind(v)=='CXXMethodDecl' and (v.get('virtual') or v.get('pure')) for v in kids(n)):
            raise Unsupported('virtual C++ method or interface')
        if any('*' in qual(v) or '&' in qual(v) for v in fields):
            traits=n.get('definitionData',{})
            if not lifetime and (n.get('name') not in getattr(self,'header_record_factories',set()) or
                    not traits.get('isStandardLayout') or
                    not (traits.get('isAggregate') and traits.get('defaultCtor',{}).get('trivial')
                         or safe_zero_default_member_record(n)) or
                    not traits.get('dtor',{}).get('trivial') or
                    any('&' in qual(v) for v in fields)):
                raise Unsupported('class pointer/reference field requires ownership/alias lowering')
        ctors=[v for v in kids(n) if kind(v)=='CXXConstructorDecl' and not v.get('isImplicit') and any(kind(x)=='CompoundStmt' for x in kids(v))]
        methods=[v for v in kids(n) if kind(v) in ('CXXMethodDecl','CXXConversionDecl') and not v.get('isImplicit') and any(kind(x)=='CompoundStmt' for x in kids(v))]
        # A compiler-synthesized/defaulted trivial copy constructor is
        # represented by cCopyTrivialClass at the *selected* CXXConstructExpr;
        # it is not an overloaded JS constructor entry point.
        if n.get('name') in self.copy_classes:
            ctors=[c for c in ctors if c.get('explicitlyDefaulted')!='default']
        overload_factories=self.constructor_factories.get(n.get('name'))
        if len(ctors)>1 and (not overload_factories or
                              set(overload_factories)!=set(qual(c) for c in ctors)):
            raise Unsupported('overloaded constructors need uniquely Clang-resolved source bodies')
        if len([(v.get('name'),qual(v)) for v in methods]) != len(set((v.get('name'),qual(v)) for v in methods)):
            raise Unsupported('overloaded methods require overload dispatcher')
        body=[]
        # A class-scoped constexpr is not a global JS binding. It belongs to
        # the class, and references use the declaration's Clang ID to avoid
        # collisions with locals or unrelated same-named static fields.
        static_fields=[v for v in kids(n) if kind(v)=='VarDecl' and
                       v.get('storageClass')=='static']
        static_refs={}
        for field in static_fields:
            if not (field.get('constexpr') is True and field.get('name')
                    and len(kids(field))==1 and re.fullmatch(r'[A-Za-z_]\w*',field['name'])):
                raise Unsupported('C++ class static member requires constexpr initializer')
            static_refs[field.get('id')]=name+'.'+field['name']
        previous_refs=self.static_member_refs
        self.static_member_refs={**previous_refs,**static_refs}
        for field in static_fields:
            body.append('  static '+field['name']+' = '+js_cast(self.expr(kids(field)[0]),qual(field))+';')
        # A C++ class may have authored constructors but still contain
        # fixed-width C arrays. The source compiler previously allocated
        # `Object.create(Clazz.prototype)` then ran an authored constructor
        # against *missing* array storage (e.g. savebrief_t::reset wrote
        # name[0] into undefined). Materialize only Clang-proven scalar
        # array fields as native typed storage before invoking the original
        # constructor body. This mirrors C++ aggregate array storage, not
        # a synthesized game-specific constructor.
        array_storage=[]
        for field in fields:
            shape=aggregate_type_schema(qual(field),self.global_storage_records,
                         self.type_aliases,self.record_layouts,allow_pointer_storage=True,
                         enum_types=self.enum_types)
            if shape and 'array' in shape and field.get('name'):
                array_storage.append('this.'+field['name']+' = '+self.zero_aggregate(shape)+';')
        if byte_schema:
            if ctors:raise Unsupported('byte record requires trivial original construction')
            body.append('  constructor() {\n    return Object.setPrototypeOf('
                        +self.zero_aggregate({'byteRecord':byte_schema})+', new.target.prototype);\n  }')
        elif overload_factories:
            # Each original constructor gets an independent, source-typed
            # static factory; no runtime overload-by-arity or typeof branch.
            # Deliberately bypass the JS constructor when setting up the
            # object, as a delegating C++ constructor must initialize SAME this.
            body.append('  constructor() { throw new TypeError("Clang-selected constructor factory required"); }')
            for c in ctors:
                signature=qual(c);symbol=overload_factories[signature]
                params=[v for v in kids(c) if kind(v)=='ParmVarDecl']
                names=[js_ident(v.get('name') or 'arg'+str(i)) for i,v in enumerate(params)]
                self.local_types={js_ident(v.get('name') or 'arg'+str(i)):qual(v) for i,v in enumerate(params)}
                ctor_body=[]
                for initializer in kids(c):
                    if kind(initializer)!='CXXCtorInitializer':continue
                    children=kids(initializer)
                    if len(children)!=1:raise Unsupported('C++ constructor initializer AST unavailable')
                    if initializer.get('delegatingInit'):
                        delegate=children[0]
                        if kind(delegate)!='CXXConstructExpr':raise Unsupported('C++ delegating initializer AST')
                        target=overload_factories.get(delegate.get('ctorType',{}).get('qualType'))
                        if not target:raise Unsupported('C++ delegated constructor missing unique original body')
                        ctor_body.append('this.'+target+'('+', '.join(self.expr(v) for v in kids(delegate))+');')
                    else:
                        field=initializer.get('anyInit',{}).get('name')
                        if not field or field not in [f.get('name') for f in fields]:
                            raise Unsupported('C++ base/unknown constructor initializer')
                        declaration=next(f for f in fields if f.get('name')==field)
                        value=(self.reference_argument(children[0],qual(declaration)) if self.scalar_reference(qual(declaration))
                               else self.expr(children[0]))
                        ctor_body.append('this.'+field+' = '+value+';')
                stmt=next((v for v in kids(c) if kind(v)=='CompoundStmt'),None)
                if stmt is None:raise Unsupported('C++ constructor without source body')
                ctor_body.append(self.statements(stmt,2))
                body.append('  '+symbol+'('+', '.join(names)+') {\n    '+'\n    '.join(array_storage+ctor_body)+'\n  }')
                body.append('  static '+symbol+'('+', '.join(names)+') {\n'
                    +'    const value=Object.create('+name+'.prototype);\n'
                    +'    value.'+symbol+'('+', '.join(names)+');\n'
                    +'    return value;\n  }')
        elif ctors:
            c=ctors[0]
            params=[v for v in kids(c) if kind(v)=='ParmVarDecl']
            if any(not v.get('name') for v in params):raise Unsupported('anonymous/implicit constructor parameter')
            self.local_types={js_ident(v['name']):qual(v) for v in params}
            # Constructor initializer lists live in CXXCtorInitializer nodes.
            inits=[]
            for i in kids(c):
                if kind(i)=='CXXCtorInitializer':
                    field=i.get('anyInit',{}).get('name') or i.get('baseInit',{}).get('qualType')
                    if field not in [f.get('name') for f in fields]:raise Unsupported('base initializer')
                    declaration=next(f for f in fields if f.get('name')==field)
                    value=(self.reference_argument(kids(i)[0],qual(declaration)) if self.scalar_reference(qual(declaration))
                           else self.expr(kids(i)[0]))
                    inits.append('    this.'+field+' = '+value+';')
            stmt=next(v for v in kids(c) if kind(v)=='CompoundStmt')
            body.append('  constructor('+', '.join(js_ident(v['name']) for v in params)+') {\n'+'\n'.join(array_storage+inits+[self.statements(stmt,2)])+'\n  }')
        elif fields:
            # C++ in-class default member initializers are executed by the
            # implicit default constructor. Never replace them with undefined.
            # For this source-proven scalar-only case, every initializer is
            # lowered from its original FieldDecl AST expression.
            from source_header_records import safe_scalar_default_member_record
            if safe_scalar_default_member_record(n):
                field_inits=['    this.'+f['name']+' = '+js_cast(self.expr(kids(f)[0]),qual(f))+';' for f in fields]
                body.append('  constructor() {\n'+'\n'.join(field_inits)+'\n  }')
            elif safe_zero_default_member_record(n):
                def zero(f):
                    t=qual(f)
                    if '*' in t:return 'null'
                    t=resolve_scalar_storage_alias(t,self.type_aliases)
                    if 'bool' in t:return 'false'
                    return js_cast('0n' if is_wide_integer(t) else '0',t)
                field_inits=['    this.'+f['name']+' = '+zero(f)+';' for f in fields]
                body.append('  constructor() {\n'+'\n'.join(field_inits)+'\n  }')
            else:
                body.append('  constructor() {\n'+'\n'.join('    this.'+f['name']+' = undefined;' for f in fields)+'\n  }')
        for method in methods:
            mname=method.get('name','')
            msymbol=(self.member_conversions.get(method.get('id')) if kind(method)=='CXXConversionDecl' else self.member_operators.get((n.get('name'),mname,qual(method)))) if mname.startswith('operator') else None
            if mname.startswith('operator') and not msymbol:
                raise Unsupported('member operator lacks verified declaration: '+mname)
            if (n.get('name'),mname) in getattr(self,'overloaded_member_names',set()):
                msymbol=self.member_method_symbols.get((n.get('name'),mname,qual(method)))
                if not msymbol:raise Unsupported('overloaded method lacks unique original signature: '+mname)
            m=self.function(method,True,symbol=msymbol)
            prefix='static ' if method.get('storageClass')=='static' else ''
            body.append('  '+prefix+m.replace('\n','\n  '))
        if lifetime:
            body.append('  '+self.function(lifetime['destructor'],True,symbol=lifetime['destroy_symbol']).replace('\n','\n  '))
        if not fields and not methods and not ctors:raise Unsupported('empty or implicit record')
        self.static_member_refs=previous_refs
        return f'export class {name} {{\n'+'\n'.join(body)+'\n}'

def simplify_idempotent_casts(source):
    """Remove redundant same-width conversions without changing numeric meaning.

    Match balanced parentheses, not regex substrings: calls inside the converted
    operand must not prevent the simplification.
    """
    for _ in range(10):
        changed=False
        for match in list(re.finditer(r'\b(i32|u32|i64|u64)\(\s*\1\(',source))[::-1]:
            start=match.start();end_inner=None;depth=1
            for pos in range(match.end(),len(source)):
                if source[pos]=='(':depth+=1
                elif source[pos]==')':
                    depth-=1
                    if depth==0:end_inner=pos;break
            if end_inner is None:continue
            after=end_inner+1
            while after<len(source) and source[after].isspace():after+=1
            if after>=len(source) or source[after]!=')':continue
            # Preserve the inner conversion; outer one has exactly the same width.
            inner_start=match.start()+len(match.group(1))+1
            source=source[:start]+source[inner_start:end_inner+1]+source[after+1:]
            changed=True
        if not changed:break
    return source

def parse_json_stream(s):
    decoder=json.JSONDecoder(); pos=0; out=[]
    while pos<len(s):
        while pos<len(s) and s[pos].isspace():pos+=1
        if pos>=len(s):break
        node,pos=decoder.raw_decode(s,pos);out.append(node)
    return out

# A deliberately small, source-neutral catalog of Clang builtins lowered through
# JavaScript integer primitives, never through LLVM opcodes.
LIBM={'powf':'const powf = (a,b) => Math.fround(Math.pow(Math.fround(a), Math.fround(b)));',
      'floor':'const floor = a => Math.floor(a);',
      'ceil':'const ceil = a => Math.ceil(a);',
      'sqrtf':'const sqrtf = a => Math.fround(Math.sqrt(Math.fround(a)));',
      'fabsf':'const fabsf = a => Math.fround(Math.abs(Math.fround(a)));',
      'floorf':'const floorf = a => Math.fround(Math.floor(Math.fround(a)));',
      'ceilf':'const ceilf = a => Math.fround(Math.ceil(Math.fround(a)));'}
BUILTIN_HELPERS={
    '__builtin_abs':('scalar_abs',1),'__builtin_labs':('scalar_abs',1),
    '__builtin_llabs':('scalar_abs',1),'__builtin_fabs':('scalar_abs',1),
    '__builtin_fabsf':('scalar_abs',1),
    '__builtin_clz':('clz32',1),'__builtin_clzl':('clz64',1),'__builtin_clzll':('clz64',1),
    '__builtin_ctz':('ctz32',1),'__builtin_ctzl':('ctz64',1),'__builtin_ctzll':('ctz64',1),
    '__builtin_popcount':('popcnt32',1),'__builtin_popcountl':('popcnt64',1),
    '__builtin_bswap16':('bswap16',1),'__builtin_bswap32':('bswap32',1),'__builtin_bswap64':('bswap64',1),
    '__builtin_expect':('expect',2),'__builtin_expect_with_probability':('expect',3),
    '__builtin_alloca':('stack_bytes',1),
    '__builtin_umull_overflow':('u64_product_overflow',3),
    '__builtin_memcpy':('bounded_bytes',3), '__builtin_memmove':('bounded_bytes',3),
    '__builtin_memset':('bounded_bytes',3), '__builtin_memcmp':('bounded_bytes',3),
    '__builtin_parity':('parity',1), '__builtin_parityl':('parity64',1),
    '__builtin_parityll':('parity64',1),
    '__builtin_ffs':('ffs',1), '__builtin_ffsl':('ffs64',1),
    '__builtin_ffsll':('ffs64',1),
    '__builtin_va_start':('va',2), '__builtin_va_end':('va',1), '__builtin_va_copy':('va',2),
    '__builtin_unreachable':('trap',0), '__builtin_trap':('trap',0), '__builtin_debugtrap':('trap',0),
}
BUILTIN_JS={
'__builtin_abs': 'const __builtin_abs = x => {x=Number(x)|0;if(x===-2147483648)throw new RangeError("C abs signed overflow");return Math.abs(x);};',
'__builtin_labs': 'const __builtin_labs = x => {x=BigInt.asIntN(64,BigInt(x));if(x===-9223372036854775808n)throw new RangeError("C labs signed overflow");return x<0n?-x:x;};',
'__builtin_llabs': 'const __builtin_llabs = x => {x=BigInt.asIntN(64,BigInt(x));if(x===-9223372036854775808n)throw new RangeError("C llabs signed overflow");return x<0n?-x:x;};',
'__builtin_fabs': 'const __builtin_fabs = x => Math.abs(x);',
'__builtin_fabsf': 'const __builtin_fabsf = x => Math.fround(Math.abs(Math.fround(x)));',
'__builtin_clz': 'const __builtin_clz = x => Math.clz32(Number(x) >>> 0);',
'__builtin_clzl': 'const __builtin_clzl = x => clz64(x);',
'__builtin_clzll': 'const __builtin_clzll = x => clz64(x);',
'__builtin_ctz': 'const __builtin_ctz = x => ctz64(BigInt.asUintN(32,BigInt(x)),32);',
'__builtin_ctzl': 'const __builtin_ctzl = x => ctz64(x,64);',
'__builtin_ctzll': 'const __builtin_ctzll = x => ctz64(x,64);',
'__builtin_popcount': 'const __builtin_popcount = x => popcnt(BigInt.asUintN(32,BigInt(x)));',
'__builtin_popcountl': 'const __builtin_popcountl = x => popcnt(BigInt.asUintN(64,BigInt(x)));',
'__builtin_bswap16': 'const __builtin_bswap16 = x => (((Number(x)&255)<<8)|((Number(x)>>>8)&255))&65535;',
'__builtin_bswap32': 'const __builtin_bswap32 = x => ((Math.imul(Number(x),0x1000000)>>>0)|((Number(x)&0xff00)<<8)|((Number(x)>>>8)&0xff00)|(Number(x)>>>24))>>>0;',
'__builtin_bswap64': 'const __builtin_bswap64 = x => { let n=BigInt.asUintN(64,BigInt(x)),r=0n;for(let j=0;j<8;j++){r=(r<<8n)|(n&255n);n>>=8n;}return r;};',
'__builtin_parity': 'const __builtin_parity = x => popcnt(BigInt.asUintN(32,BigInt(x)))&1;',
'__builtin_parityl': 'const __builtin_parityl = x => popcnt(BigInt.asUintN(64,BigInt(x)))&1;',
'__builtin_parityll': 'const __builtin_parityll = x => popcnt(BigInt.asUintN(64,BigInt(x)))&1;',
'__builtin_ffs': 'const __builtin_ffs = x => { const n=BigInt.asUintN(32,BigInt(x)); return n===0n?0:ctz64(n,32)+1; };',
'__builtin_ffsl': 'const __builtin_ffsl = x => { const n=BigInt.asUintN(64,BigInt(x)); return n===0n?0:ctz64(n,64)+1; };',
'__builtin_ffsll': 'const __builtin_ffsll = x => { const n=BigInt.asUintN(64,BigInt(x)); return n===0n?0:ctz64(n,64)+1; };',
'__builtin_unreachable': 'const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };',
'__builtin_trap': 'const __builtin_trap = () => { throw new Error("C++ trap reached"); };',
'__builtin_debugtrap': 'const __builtin_debugtrap = () => { throw new Error("C++ debug trap reached"); };',
}
# Clang's width-specific rotates mask the count modulo the bit width.
# BigInt avoids JS's signed 32-bit shifts and implements 64-bit rotation exactly.
for _bits in (8,16,32,64):
    for _direction in ('left','right'):
        _builtin='__builtin_rotate'+_direction+str(_bits)
        BUILTIN_HELPERS[_builtin]=('rotate',2)
        _expr='(n << shift) | (n >> (width-shift))' if _direction=='left' else '(n >> shift) | (n << (width-shift))'
        _result='result' if _bits==64 else 'Number(result)'
        BUILTIN_JS[_builtin]=(f'const {_builtin} = (value,count) => {{ const width={_bits}n; '
            f'const n=BigInt.asUintN({_bits},BigInt(value)), shift=BigInt(count)&(width-1n); '
            f'const result=BigInt.asUintN({_bits},{_expr}); return {_result}; }};')

# Verified C standard-library ABI adapters are not source-owned game implementations.
# A source-defined override must win; no function-name-only ABI guessing.
# Only Clang-declared canonical void-pointer signatures are lowered.
def verified_libc_byte_symbol(decl):
    if decl.get('kind') != 'FunctionDecl':return None
    name=decl.get('name','')
    if name not in ('malloc','calloc','realloc','free','memcpy','memmove','memset','memcmp',
                     'strlen','strcmp','strncmp','strcasecmp','strncasecmp','strcpy','strncpy','sprintf','snprintf','exit'):return None
    signature=decl.get('type',{}).get('qualType','')
    signature=re.sub(r'\b(?:__restrict|__restrict__|restrict|noexcept\s*\(true\))\b','',signature)
    signature=re.sub(r'noexcept\s*\(true\)\s*$','',signature)
    signature=re.sub(r'__attribute__\s*\(\(\s*noreturn\s*\)\)','',signature)
    signature=re.sub(r'\s+','',signature)
    signature=signature.replace('charconst*','constchar*')
    signature=signature.replace('unsignedlongint','unsignedlong').replace('longunsignedint','unsignedlong')
    signature=signature.replace('unsignedlonglongint','unsignedlonglong')
    signature=signature.replace('unsignedlong','size_t') # original build targets LP64
    expected={
        'malloc':'void*(size_t)',
        'calloc':'void*(size_t,size_t)',
        'realloc':'void*(void*,size_t)',
        'free':'void(void*)',
        'memcpy':'void*(void*,constvoid*,size_t)',
        'memmove':'void*(void*,constvoid*,size_t)',
        'memset':'void*(void*,int,size_t)',
        'memcmp':'int(constvoid*,constvoid*,size_t)',
        'strlen':'size_t(constchar*)',
        'strcmp':'int(constchar*,constchar*)',
        'strncmp':'int(constchar*,constchar*,size_t)',
        'strcasecmp':'int(constchar*,constchar*)',
        'strncasecmp':'int(constchar*,constchar*,size_t)',
        'strcpy':'char*(char*,constchar*)',
        'strncpy':'char*(char*,constchar*,size_t)',
        'sprintf':'int(char*,constchar*,...)',
        'snprintf':'int(char*,size_t,constchar*,...)',
        'exit':'void(int)',
    }
    if signature!=expected[name]:return None
    return ('cProcess.exit' if name=='exit' else
            'cCHeap.'+name if name in ('malloc','calloc','realloc','free') else 'cByteMemory.'+name)

def verified_libc_scalar_symbol(decl,original,project_symbols):
    """Only undeﬁned canonical C declarations may select scalar JS intrinsics.

    The real C ABI name and exact Clang type distinguish ::abs(int) from
    namespaced C++ overloads. Authored bodies and source-owned providers win.
    """
    name=decl.get('name')
    if not original.get('mangledName') and decl.get('_source_c_abi_selection',{}).get('abi')=='same-tu-c-function-selection/1':
        original=decl
    expected={'abs':'int(int)','labs':'long(long)','llabs':'longlong(longlong)',
              'fabs':'double(double)','fabsf':'float(float)'}
    if (decl.get('kind')!='FunctionDecl' or name not in expected
            or original.get('mangledName')!=name
            or any(kind(node)=='CompoundStmt' for node in kids(original))
            or name in project_symbols and project_symbols[name]!='browser-abi/libc_provider'):
        return None
    spelling=re.sub(r'noexcept(?:\s*\(true\))?\s*$','',qual(decl)).strip()
    spelling=re.sub(r'\s+','',spelling).replace('longint','long')
    return '__builtin_'+name if spelling==expected[name] else None

BUILTIN_RUNTIME='''
const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};
'''
def c_string_bytes(raw):
    """Decode a Clang ordinary StringLiteral to actual C bytes.

    Python's literal_eval maps \200 to U+0080; UTF-8 encoding that Unicode
    code point would create TWO bytes and corrupt the C input. Decode numeric
    escapes directly into bytes, preserving NUL and 8-bit values.
    """
    if len(raw)<2 or raw[0]!='"' or raw[-1]!='"':
        raise Unsupported('unsupported C string literal encoding')
    simple={'a':7,'b':8,'f':12,'n':10,'r':13,'t':9,'v':11,'\\':92,'"':34,"'":39,'?':63}
    out=bytearray();i=1;end=len(raw)-1
    while i<end:
        c=raw[i];i+=1
        if c!='\\':
            out.extend(c.encode('utf-8'));continue
        if i==end:raise Unsupported('incomplete C string escape')
        c=raw[i];i+=1
        if c in simple:out.append(simple[c]);continue
        if c in '01234567':
            value=c
            for _ in range(2):
                if i<end and raw[i] in '01234567':value+=raw[i];i+=1
                else:break
            number=int(value,8)
            if number>255:raise Unsupported('C octal escape exceeds byte width')
            out.append(number);continue
        if c=='x':
            start=i
            while i<end and raw[i] in '0123456789abcdefABCDEF':i+=1
            if start==i:raise Unsupported('empty hex escape')
            number=int(raw[start:i],16)
            if number>255:raise Unsupported('C hex escape exceeds byte width')
            out.append(number);continue
        if c in 'uU':
            size=4 if c=='u' else 8
            digits=raw[i:i+size]
            if len(digits)!=size or not all(x in '0123456789abcdefABCDEF' for x in digits):
                raise Unsupported('invalid universal character escape')
            i+=size
            try:out.extend(chr(int(digits,16)).encode('utf-8'))
            except (ValueError,UnicodeEncodeError):raise Unsupported('invalid C unicode escape')
            continue
        raise Unsupported('unrecognized C string escape '+repr(c))
    return bytes(out)

def resolve_scalar_storage_alias(base, aliases):
    """Expand only unambiguous Clang typedef chains for global array elements.

    Never invent sizes from a typedef spelling. Preserve pointer depth and
    leave non-scalar record aliases to their verified aggregate ABI.
    """
    aliases = aliases or {}
    typ = re.sub(r'\b(?:const|volatile|static|restrict|__restrict)\b', '', base).strip()
    seen = set()
    for _ in range(24):
        if typ in seen:
            raise Unsupported('cyclic global array element typedef: '+typ)
        seen.add(typ)
        spelling = aliases.get(typ)
        if not spelling:
            return typ
        typ = re.sub(r'\b(?:const|volatile|static|restrict|__restrict)\b', '', spelling).strip()
    raise Unsupported('global array typedef chain exceeds verified depth')

def verified_global_record_initializer(schema, node, enum_values, record_layouts,
                                       aggregate_records, type_aliases, emitter=None):
    """Translate ONLY a Clang-verified pointer-free record initializer.

    A file-scope POD default constructor must not become JS `new T()` with
    uninitialized properties. Initializer arrays may use Clang's `array_filler`
    encoding; every source field is retained, or the definition stays blocked.
    """
    emitter=emitter or Emit()
    if 'byteRecord' in schema:
        if node is None:return emitter.zero_aggregate(schema)
        emitter=emitter or Emit();emitter.enum_values=enum_values or {};emitter.record_layouts=record_layouts or {}
        emitter.aggregate_records=aggregate_records or {};emitter.type_aliases=type_aliases or {}
        return emitter.byte_record_initializer(schema,node)
    if 'record' not in schema:
        raise Unsupported('global record requires nonoverlapping aggregate layout')
    if node is None or kind(node) in ('ImplicitValueInitExpr',):
        return emitter.zero_aggregate(schema)
    if kind(node)=='CXXConstructExpr' and not kids(node):
        return emitter.zero_aggregate(schema)
    if kind(node)!='InitListExpr':
        raise Unsupported('global record requires verified aggregate initializer')
    fields=list(schema['record'].items())
    values=kids(node)
    if len(values)!=len(fields):
        raise Unsupported('global record initializer field count differs from Clang layout')
    emitter=emitter or Emit()
    emitter.enum_values=enum_values or {}
    emitter.record_layouts=record_layouts or {}
    emitter.aggregate_records=aggregate_records or {}
    emitter.type_aliases=type_aliases or {}
    def materialize(field_schema,value):
        if 'record' in field_schema:
            return verified_global_record_initializer(field_schema,value,enum_values,
                record_layouts,aggregate_records,type_aliases,emitter)
        if kind(value)=='ImplicitValueInitExpr' and not kids(value):
            if 'pointer' in field_schema:return 'null'
            if 'array' in field_schema or 'pointerArray' in field_schema:
                return 'cZeroAggregate('+json.dumps(field_schema,sort_keys=True)+')'
            return emitter.expr(value)
        if 'pointer' in field_schema:
            literal=value
            while kind(literal) in WRAPPERS and len(kids(literal))==1:
                literal=kids(literal)[0]
            if field_schema.get('pointee')=='byte' and kind(literal)=='StringLiteral':
                payload=c_string_bytes(literal.get('value',''))+b'\x00'
                return 'Uint8Array.from('+json.dumps(list(payload))+')'
            result=emitter.expr(value)
            if result not in ('null','0','0n'):
                return emitter.static_pointer_initializer(value)
            return 'null'
        return emitter.expr(value)
    value='({' + ', '.join(json.dumps(name)+': '+materialize(field_schema,value)
        for (name,field_schema),value in zip(fields,values)) + '})'
    return emitter.aggregate_prototype(schema,'cMarkAggregate('+value+')')

def global_initializer(n, enum_values=None, record_layouts=None, aggregate_records=None, type_aliases=None, enum_types=None, emitter=None):
    alignment=declared_array_alignment(n,type_aliases)
    if alignment:
        clean={**n,'inner':[v for v in kids(n) if kind(v)!='AlignedAttr']}
        value=global_initializer(clean,enum_values,record_layouts,aggregate_records,type_aliases,enum_types,emitter)
        return 'cAlignedStorage('+value+', '+str(alignment)+')'
    t=qual(n); dims=[int(x) for x in re.findall(r'\[(\d+)\]',t)]
    base=re.sub(r'\[\s*\d+\s*\]','',t).strip()
    schema=aggregate_type_schema(base,aggregate_records or {},type_aliases or {},record_layouts or {},allow_pointer_storage=True,enum_types=enum_types)
    full_schema=aggregate_type_schema(t,aggregate_records or {},type_aliases or {},record_layouts or {},allow_pointer_storage=True,enum_types=enum_types)
    if full_schema and 'pointerArray' in full_schema:
        initializers=[child for child in kids(n) if not kind(child).endswith('Attr') and kind(child)!='FullComment']
        if not initializers:return 'cPointerArray('+str(full_schema['pointerArray'])+')'
        if len(initializers)!=1 or kind(initializers[0])!='InitListExpr':
            raise Unsupported('pointer array requires original list initializer')
        em=emitter or Emit();em.aggregate_records=aggregate_records or {};em.global_storage_records=aggregate_records or {}
        em.type_aliases=type_aliases or {};em.record_layouts=record_layouts or {};em.enum_types=enum_types or set()
        values=kids(initializers[0])
        if not values and initializers[0].get('array_filler'):
            filler=initializers[0]['array_filler']
            if kind(filler[0])!='ImplicitValueInitExpr':raise Unsupported('pointer array has nonzero repeated initializer')
            values=filler[1:]
        if len(values)>full_schema['pointerArray']:raise Unsupported('global pointer initializer exceeds extent')
        def pointer_value(value):
            leaf=value
            while kind(leaf) in WRAPPERS and len(kids(leaf))==1:leaf=kids(leaf)[0]
            if kind(leaf)=='StringLiteral':
                return 'Uint8Array.from('+json.dumps(list(c_string_bytes(leaf.get('value',''))+b'\0'))+')'
            expression=em.expr(value)
            if expression in ('null','0','0n'):return 'null'
            # Static C relocations must not read a later ES-module binding
            # during evaluation of a cyclic import graph.
            return em.static_pointer_initializer(value)
        return 'cPointerArray('+str(full_schema['pointerArray'])+', () => ['+', '.join(pointer_value(value) for value in values)+'])'
    if schema_prototypes(schema)-getattr(emitter,'allowed_static_prototypes',set()):
        raise Unsupported('global aggregate methods require original static construction order: '+base)
    if dims:
        if any(d<0 or d>1000000 for d in dims):raise Unsupported('invalid/global oversized array')
        # VarDecl children include source metadata even when no initializer
        # exists. Placement/retention/link-label annotations are not runtime
        # initialization; unknown attributes remain an explicit blocker.
        harmless={'FullComment','UsedAttr','UnusedAttr',
                  'AsmLabelAttr','DeprecatedAttr'}
        unknown=[kind(child) for child in kids(n)
                 if kind(child).endswith('Attr') and kind(child) not in harmless]
        if unknown:raise Unsupported('static array declaration attribute needs semantics: '+', '.join(unknown))
        initializers=[child for child in kids(n) if kind(child) not in harmless]
        if len(initializers)>1:raise Unsupported('static array has multiple runtime initializer nodes')
        original_initializer=initializers[0] if initializers else None
        initializer=original_initializer if kind(original_initializer or {})=='InitListExpr' else None
        literal=next((v for v in descendants(original_initializer or {}) if kind(v)=='StringLiteral'),None)
        if literal is not None and len(dims)==1 and '*' not in t.split('[')[0] and \
           resolve_scalar_storage_alias(t.split('[')[0],type_aliases) in ('char','unsigned char','signed char','uint8_t','int8_t'):
            # C char[N] = "..." is a fixed-size, zero-padded byte buffer,
            # NOT a JS string. Escape decoding and bounds are checked at build
            # time; bytes survive embedded NUL and high-bit characters.
            base=resolve_scalar_storage_alias(t.split('[')[0],type_aliases)
            if base not in ('char','unsigned char','signed char','uint8_t','int8_t'):
                raise Unsupported('string initializer in non-character array')
            encoded=c_string_bytes(literal.get('value',''))
            if len(encoded)>dims[0]:raise Unsupported('C string exceeds fixed array')
            type_name='Int8Array' if base in ('int8_t','signed char') else 'Uint8Array'
            return (f'(() => {{ const bytes = new {type_name}({dims[0]}); '
                    f'bytes.set({list(encoded)}); return bytes; }})()')
        base=resolve_scalar_storage_alias(t.split('[')[0],type_aliases)
        # Clang's default construction of an aggregate at static storage is
        # zero-initialization, not a JavaScript class with undefined fields.
        element_schema=aggregate_type_schema(base,aggregate_records or {},
                                            type_aliases or {},record_layouts or {},allow_pointer_storage=True,enum_types=enum_types)
        record_array=bool(element_schema and ('record' in element_schema or 'byteRecord' in element_schema))
        if record_array:
            if any(dim<1 for dim in dims) or len(dims)>8:
                raise Unsupported('global record array has unsupported extent')
            total=1
            for dim in dims:
                total*=dim
                if total>1000000:raise Unsupported('global record array exceeds verified capacity')
            zero=(emitter or Emit()).zero_aggregate(element_schema)
            def build_record_array(depth, init):
                count=dims[depth]
                if init is None or kind(init)=='CXXConstructExpr' and not kids(init):
                    values=[]
                elif kind(init)=='InitListExpr':
                    values=kids(init)
                    filler=init.get('array_filler')
                    if filler:
                        if values:raise Unsupported('ambiguous global record array filler')
                        # Clang array_filler[0] is the fallback ZERO element,
                        # followed by the explicit ordered slots. The fallback
                        # is not element zero, even when its AST is InitListExpr.
                        if not all(kind(v) in ('InitListExpr','ImplicitValueInitExpr') for v in filler):
                            raise Unsupported('unverified aggregate array filler')
                        first=filler[0]
                        if kind(first)=='InitListExpr':
                            # Its fields must be entirely implicit zero values.
                            if any(kind(v) not in ('InitListExpr','ImplicitValueInitExpr') for v in descendants(first)):
                                raise Unsupported('nonzero aggregate array fallback')
                        values=filler[1:]
                else:
                    raise Unsupported('nontrivial global record array initializer')
                if len(values)>count:raise Unsupported('global record array initializer exceeds extent')
                def element(value):
                    if depth+1<len(dims):return build_record_array(depth+1,value)
                    return verified_global_record_initializer(element_schema,value,enum_values,
                        record_layouts,aggregate_records,type_aliases,emitter)
                # Each slot must receive a fresh independent aggregate object.
                if not values:
                    if depth+1==len(dims):return f'Array.from({{length:{count}}}, () => {zero})'
                    return f'Array.from({{length:{count}}}, () => {build_record_array(depth+1,None)})'
                explicit=[element(value) for value in values]
                if len(explicit)==count:return '['+', '.join(explicit)+']'
                remaining=count-len(explicit)
                if depth+1==len(dims):tail=f'Array.from({{length:{remaining}}}, () => {zero})'
                else:tail=f'Array.from({{length:{remaining}}}, () => {build_record_array(depth+1,None)})'
                return '['+', '.join(explicit)+'].concat('+tail+')'
            if original_initializer is not None and initializer is None:
                # The record schema already proves trivial default lifetime.
                # Clang constructs each array element with this no-argument
                # constructor after C/C++ static zero initialization.
                if kind(original_initializer)!='CXXConstructExpr' or kids(original_initializer):
                    raise Unsupported('nontrivial global record array initializer')
                if qual(original_initializer)!=t:
                    raise Unsupported('global array constructor differs from declared element extent')
            # A C byte-record array must have one contiguous backing store,
            # not N independently allocated buffers. Clang's verified offsets
            # are interpreted by the shared byte-record accessor. Restrict
            # this optimization to entirely default-zero one-dimensional
            # arrays; explicitly initialized arrays retain ordered lowering.
            if 'byteRecord' in element_schema:
                em=emitter or Emit()
                return em.byte_record_array_initializer({'recordArray':element_schema['byteRecord'],'dims':dims},original_initializer)
            return build_record_array(0,original_initializer)
        if original_initializer is not None and initializer is None:
            if kind(original_initializer)=='CXXConstructExpr':
                raise Unsupported('global aggregate array requires verified storage shape: '+base)
            raise Unsupported('global array initializer is not a C list')
        numeric={'bool':'Uint8Array','_Bool':'Uint8Array','uint8_t':'Uint8Array','int8_t':'Int8Array','char':'Uint8Array',
                 'uint16_t':'Uint16Array','int16_t':'Int16Array',
                 'uint32_t':'Uint32Array','int32_t':'Int32Array','int':'Int32Array',
                 'unsigned int':'Uint32Array','float':'Float32Array','double':'Float64Array',
                 'uint64_t':'BigUint64Array','int64_t':'BigInt64Array',
                 'unsigned char':'Uint8Array','signed char':'Int8Array',
                 'short':'Int16Array','unsigned short':'Uint16Array',
                 'unsigned long':'BigUint64Array','long':'BigInt64Array',
                 'unsigned long long':'BigUint64Array','long long':'BigInt64Array',
                 'size_t':'BigUint64Array','uintptr_t':'BigUint64Array',
                 'intptr_t':'BigInt64Array'}
        typ=numeric.get(base)
        # Each original char* string literal owns a trailing NUL byte. Keep a
        # stable byte buffer per slot, rather than a JS UTF-16 string which
        # has different pointer arithmetic and cannot represent embedded NUL.
        c_string_pointer=bool(re.fullmatch(r'(?:const\s+)?(?:signed\s+)?char\s*\*',base)
                              or re.fullmatch(r'(?:u?int8_t)\s*\*',base))
        # Arrays of native C pointers are arrays of ALIASES, not byte arrays.
        # Only null/value-initialized slots are supported until we can prove
        # initialization of every non-null pointee and its owner.
        pointer_array=typ is None and bool(re.fullmatch(r'[\w:<> ,]+\s*\*',base))
        if typ is None and not pointer_array:raise Unsupported('unsupported global array element type '+base)
        def build(dim,init):
            length=dims[dim]
            # Clang serializes `char rows[R][C] = {"abc", ...}` with each
            # row as StringLiteral(char[C]) and sometimes stores the rows in
            # the outer InitListExpr.array_filler. C++ does not create a char*
            # here: each row is an independent, fixed-width, zero-padded C
            # byte array. This case is proved from both dimensions and Clang's
            # row type, not from a guessed or game-specific initializer.
            if (dim==len(dims)-1 and len(dims)>=2 and
                base in ('char','signed char','unsigned char','int8_t','uint8_t') and
                kind(init or {})=='StringLiteral'):
                if qual(init) != f'{t.split("[")[0].strip()}[{length}]' and not re.fullmatch(
                    r'(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\['+str(length)+r'\]',qual(init)):
                    raise Unsupported('C nested string literal row differs from Clang array extent')
                raw=c_string_bytes(init.get('value',''))
                if len(raw)>length:raise Unsupported('C string exceeds nested array row')
                ctor='Int8Array' if base in ('int8_t','signed char') else 'Uint8Array'
                return (f'(() => {{ const row = new {ctor}({length}); '
                        f'row.set({json.dumps(list(raw))}); return row; }})()')
            if kind(init or {})=='ImplicitValueInitExpr':init=None
            items=kids(init) if init is not None else []
            if init is not None and 'array_filler' in init:
                # Clang often serializes completed static C arrays as
                # array_filler=[implicit_zero, explicit_0, explicit_1, ...]
                # while `inner` is empty. Treat slot zero as the fallback,
                # NOT the first explicit element. Never discard the data.
                filler=init['array_filler']
                if items:raise Unsupported('ambiguous Clang array initializer encodings')
                if not isinstance(filler,list) or not filler or kind(filler[0])!='ImplicitValueInitExpr':
                    raise Unsupported('nonzero Clang array filler requires aggregate construction')
                items=filler[1:]
            if len(items)>length:raise Unsupported('array initializer exceeds capacity')
            if dim==len(dims)-1:
                if not items:
                    return f'Array({length}).fill(null)' if pointer_array else f'new {typ}({length})'
                values=[]
                em=emitter or Emit();em.enum_values=enum_values;em.record_layouts=record_layouts;em.type_aliases=type_aliases or {};em.aggregate_records=aggregate_records or {}
                is_bigint=typ in ('BigInt64Array','BigUint64Array')
                for item in items:
                    string_node=item
                    if (kind(string_node)=='ImplicitCastExpr'
                        and string_node.get('castKind')=='ArrayToPointerDecay'
                        and len(kids(string_node))==1):
                        string_node=kids(string_node)[0]
                    if pointer_array and kind(string_node)=='StringLiteral' and c_string_pointer:
                        encoded=c_string_bytes(string_node.get('value',''))+b'\x00'
                        values.append('Uint8Array.from('+json.dumps(list(encoded))+')')
                        continue
                    expr=em.expr(item)
                    if pointer_array:
                        if expr not in ('null','0','0n'):
                            values.append(em.static_pointer_initializer(item))
                        else:values.append('null')
                    else:
                        values.append(f'BigInt({expr})' if is_bigint else expr)
                if pointer_array:
                    # C guarantees the trailing missing members are null.
                    return '['+', '.join(values+['null']*(length-len(values)))+']'
                if len(values)==length:return f'new {typ}([{", ".join(values)}])'
                return f'(() => {{ const items = new {typ}({length}); items.set([{", ".join(values)}]); return items; }})()'
            # Array-of-character-arrays may have independently zeroed rows
            # and Clang-proven string-literal rows; all other nested arrays
            # still require their original InitListExpr aggregate layout.
            if init is not None and any(kind(item)!='InitListExpr' and not (
                dim==len(dims)-2 and base in ('char','signed char','unsigned char','int8_t','uint8_t')
                and kind(item) in ('StringLiteral','ImplicitValueInitExpr')) for item in items):
                raise Unsupported('unsupported nested aggregate array initializer')
            if items:
                values=[build(dim+1,item) for item in items]
                while len(values)<length:values.append(build(dim+1,None))
                return '['+', '.join(values)+']'
            return f'Array.from({{ length: {length} }}, () => {build(dim+1,None)})'
        built=build(0,initializer)
        return ('cNativeArray('+json.dumps(typ)+', '+json.dumps(dims)+', '+built+')'
                if typ and len(dims)>1 else built)
    init=next((v for v in kids(n) if kind(v) not in ('FullComment','DeprecatedAttr')),None)
    if init:
        record_schema=aggregate_type_schema(t,aggregate_records or {},type_aliases or {},record_layouts or {},allow_pointer_storage=True,enum_types=enum_types)
        if record_schema and ('record' in record_schema or 'byteRecord' in record_schema):
            return verified_global_record_initializer(record_schema,init,enum_values,
                record_layouts,aggregate_records,type_aliases,emitter)
        if '*' in t and re.search(r'\b(?:char|int8_t|uint8_t)\s*\*',t):
            value=init
            if kind(value)=='ImplicitCastExpr' and value.get('castKind')=='ArrayToPointerDecay' and len(kids(value))==1:
                value=kids(value)[0]
            if kind(value)=='StringLiteral':
                # C static pointer to literal remains the SAME NUL-terminated
                # memory object across calls, never a JS UTF-16 string.
                blob=c_string_bytes(value.get('value',''))+b'\x00'
                return 'Uint8Array.from('+json.dumps(list(blob))+')'
        em=emitter or Emit();em.enum_values=enum_values;em.record_layouts=record_layouts;em.type_aliases=type_aliases or {};em.aggregate_records=aggregate_records or {}
        if '*' in t:
            try:return em.static_pointer_initializer(init)
            except Unsupported as error:
                if not str(error).startswith('static pointer initializer requires a proven original source address:'):raise
        return js_cast(em.expr(init),t)
    if '*' in t:return 'null'
    if re.search(r'\b(bool|_Bool)\b',t):return 'false'
    if is_wide_integer(t):return '0n'
    if scalar_size(t) is not None:return '0'
    # An enum declared in this translation unit is a C integer object;
    # implicit static zeroing does not require inventing an enumerator.
    enum_name=re.sub(r'^(?:const\s+)?enum\s+','',t).strip()
    if enum_name in (enum_types or set()):return '0'
    resolved=resolve_scalar_storage_alias(t,type_aliases)
    if resolved!=t and scalar_size(resolved) is not None:
        return '0n' if is_wide_integer(resolved) else '0'
    schema=aggregate_type_schema(t,aggregate_records or {},type_aliases or {},record_layouts or {},allow_pointer_storage=True,enum_types=enum_types)
    if schema is not None and ('record' in schema or 'byteRecord' in schema):
        return 'cZeroAggregate('+json.dumps(schema,sort_keys=True)+')'
    raise Unsupported('global initialization needs a C++ type/layout '+t)

def scalar_size(t):
    if '*' in t or '&' in t:return 8
    info=scalar_info(t)
    # Extended floating representations have no proven byte-storage provider.
    return info[1] if info and info[0]!='extended-floating' else None


def order_constant_initialization(candidates, aliases):
    """C++ static scalar initialization precedes every dynamic initializer.

    Header definitions can be discovered after their source consumers. Move
    only proven constant scalar initializers, in dependency order. A read of
    mutable/volatile storage is deliberately not a constant expression.
    """
    ready=[];pending=list(candidates);constant_ids=set()
    literals={'IntegerLiteral','FloatingLiteral','CharacterLiteral','CXXBoolLiteralExpr','ImplicitValueInitExpr'}
    wrappers={'ConstantExpr','ImplicitCastExpr','ParenExpr','CStyleCastExpr','CXXStaticCastExpr','CXXFunctionalCastExpr'}
    binary={'+','-','*','/','%','<<','>>','&','|','^','==','!=','<','<=','>','>=','&&','||',','}
    def expression(node):
        k=kind(node);children=kids(node)
        if k in literals:return not children
        if k in wrappers:return len(children)==1 and expression(children[0])
        if k=='DeclRefExpr':
            ref=node.get('referencedDecl',{})
            return ref.get('kind')=='EnumConstantDecl' or ref.get('id') in constant_ids
        if k=='UnaryOperator':return node.get('opcode') in ('+','-','!','~') and len(children)==1 and expression(children[0])
        if k=='BinaryOperator':return node.get('opcode') in binary and len(children)==2 and all(expression(c) for c in children)
        if k=='ConditionalOperator':return len(children)==3 and all(expression(c) for c in children)
        return False
    while True:
        moved=[]
        for node in pending:
            if kind(node)!='VarDecl':continue
            primitive=scalar_info(resolve_scalar_storage_alias(qual(node),aliases))
            if not primitive or primitive[0]=='extended-floating':continue
            initializers=[c for c in kids(node) if kind(c)!='FullComment' and not kind(c).endswith('Attr')]
            if len(initializers)>1 or initializers and not expression(initializers[0]):continue
            moved.append(node)
            if (node.get('constexpr') or immutable_global(node) and primitive[0] in ('integer','boolean')) and not re.search(r'\bvolatile\b',qual(node)):
                if node.get('id'):constant_ids.add(node['id'])
        if not moved:break
        ids={id(node) for node in moved}
        ready.extend(moved);pending=[node for node in pending if id(node) not in ids]
    return ready+pending

def descendants(node):
    yield node
    for child in semantic_kids(node):yield from descendants(child)

def constant_query_references(node,declarations):
    for part in descendants(node):
        if kind(part)=='DeclRefExpr':declaration=part.get('referencedDecl',{})
        elif kind(part)=='MemberExpr':
            declaration=part.get('_source_member_declaration') or declarations.get(part.get('referencedMemberDecl'),{})
        else:continue
        if declaration.get('kind') in ('FunctionDecl','CXXMethodDecl'):
            yield declaration.get('name'),qual(declaration)

@lru_cache(maxsize=4)
def original_header_source_bytes(source_root):
    """Read original headers once for exact Clang-elided filename provenance."""
    return tuple((header,header.read_bytes()) for header in source_header_inventory(source_root))


@lru_cache(maxsize=4)
def toolchain_header_source_bytes(sysroot):
    """Actual source bytes from the configured, fingerprinted target sysroot.

    Standard C++ header bodies are source dependencies too. Retain only
    readable include files; an exact unique identifier offset is still
    required when Clang elides a repeated physical filename.
    """
    root=Path(sysroot).resolve();include=root/'usr/include'
    if not include.is_dir():return ()
    return tuple((path,path.read_bytes()) for path in sorted(include.rglob('*'))
                 if path.is_file() and path.suffix.lower() in ('','.h','.hpp','.hh','.hxx','.inc','.tcc'))


def macro_header_origin(node,source_root,sysroot=None):
    """Prove the original expansion site of a macro-generated declaration.

    Token-pasted names legitimately live in Clang's <scratch space>. Their
    spelling is not a missing C++ implementation: the selected AST contains
    the expanded body and SourceManager identifies the original invocation.
    Never infer a provider from a function-name prefix or generate a formula.
    """
    loc=node.get('loc',{});exp=loc.get('expansionLoc',{})
    offset=exp.get('offset');length=exp.get('tokLen')
    if not loc.get('spellingLoc') or not isinstance(offset,int) or not isinstance(length,int) or length<1:return None
    root=Path(source_root).resolve();physical=exp.get('file')
    if physical:
        path=Path(physical);path=(path if path.is_absolute() else root/path).resolve()
        if not (path.is_relative_to(root) or (sysroot and path.is_relative_to(sysroot/'usr/include'))):return None
        pairs=((path,path.read_bytes()),) if path.is_file() else ()
    else:
        pairs=original_header_source_bytes(str(root))
        if sysroot:pairs=(*pairs,*toolchain_header_source_bytes(str(sysroot)))
    matches=[]
    for path,data in pairs:
        if path.suffix.lower() not in ('','.h','.hpp','.hh','.hxx','.inc','.tcc'):continue
        token=data[offset:offset+length]
        if not re.fullmatch(rb'[A-Za-z_]\w*',token):continue
        if exp.get('line') is not None and data[:offset].count(b'\n')+1!=exp['line']:continue
        if exp.get('col') is not None and offset-data.rfind(b'\n',0,offset)!=exp['col']:continue
        # With an omitted filename the macro identifier must also have a
        # definition in that same header. Otherwise provenance is ambiguous.
        if not physical and not re.search(rb'(?m)^\s*#\s*define\s+'+re.escape(token)+rb'\b',data):continue
        if any(node.get('range',{}).get(edge,{}).get('expansionLoc',{}).get('offset')!=offset for edge in ('begin','end')):
            # A separate macro may supply a function's leading static/inline
            # specifiers. Its complete BODY must still expand at the exact
            # verified name macro, with the declaration ending at that site.
            bodies=[v for v in kids(node) if kind(v)=='CompoundStmt']
            start=node.get('range',{}).get('begin',{}).get('expansionLoc',{}).get('offset')
            end=node.get('range',{}).get('end',{}).get('expansionLoc',{}).get('offset')
            if (kind(node)!='FunctionDecl' or len(bodies)!=1 or not isinstance(start,int)
                    or not 0<=start<=offset or end!=offset or
                    not re.fullmatch(rb'[A-Za-z_\s][A-Za-z_0-9\s]*',data[start:offset]) or
                    any(bodies[0].get('range',{}).get(edge,{}).get('expansionLoc',{}).get('offset')!=offset
                        for edge in ('begin','end'))):continue
        matches.append((path,data,token))
    if len(matches)!=1:return None
    path,data,token=matches[0]
    logical=path.relative_to(root).as_posix() if path.is_relative_to(root) else '@sysroot/'+path.relative_to(sysroot).as_posix()
    node['_source_macro_header']={'source_header':logical,'source_offset':offset,
        'source_line':data[:offset].count(b'\n')+1,'header_sha256':hashlib.sha256(data).hexdigest(),
        'expansion_token':token.decode('ascii'),'clang_spelling_location':loc['spellingLoc'],
        'physical_origin_proof':'clang-macro-expansion-at-verified-header-byte-offset',
        'expanded_body_sha256':odr_body_digest(node)}
    return path


def detached_file_storage(node,compile_as_cpp=True):
    """A filtered root alone does not establish file scope.

    Automatic locals have no native mangling; Itanium local statics begin
    _ZZ. C static locals need the complete lexical context: Clang's JSON
    mangling can be identical to a file-static variable's name.
    """
    if '_source_file_scope' in node:return node['_source_file_scope'] is True
    mangled=node.get('mangledName','')
    return bool(mangled and (not mangled.startswith('_ZZ') if compile_as_cpp else
        node.get('storageClass')!='static' and mangled==node.get('name')))


def storage_scope_key(node):
    return node.get('name'),qual(node),node.get('loc',{}).get('offset'),node.get('mangledName')


def lexical_storage_scopes(ast):
    """Keep ambiguity rather than joining unrelated same-offset declarations."""
    result={}
    def visit(node,parent=None):
        if kind(node)=='VarDecl':
            result.setdefault(storage_scope_key(node),set()).add(parent in
                ('TranslationUnitDecl','NamespaceDecl','LinkageSpecDecl'))
        for child in kids(node):visit(child,kind(node))
    for tree in ast:visit(tree)
    return result


def recover_original_header_globals(ast, source_root, source_rel, compile_as_cpp=True):
    """Inventory actual namespace-scope original-header storage in this TU.

    An EXTERN macro is interpreted by Clang before this analysis. Namespace
    VarDecls without `extern` own storage even with no initializer; an extern
    declaration owns storage only when Clang records its initializer. Neither
    comments nor declaration attributes are an initializer. No demand/name
    heuristic, system-header storage, or guessed physical origin is accepted.
    """
    if source_root is None:return [],{}
    root=Path(source_root).resolve()
    declarations={node.get('id'):node for top in ast for node in descendants(top)
                  if node.get('id')}
    variables=[]
    def visit(node,anonymous_namespace=False,file_scope=False):
        k=kind(node)
        if k in ('TranslationUnitDecl','NamespaceDecl','LinkageSpecDecl'):
            anonymous_namespace=anonymous_namespace or (k=='NamespaceDecl' and not node.get('name'))
            for child in kids(node):visit(child,anonymous_namespace,True)
        elif k=='VarDecl' and (file_scope or detached_file_storage(node,compile_as_cpp)):
            variables.append((node,anonymous_namespace,file_scope))
    for top in ast:visit(top)
    added=[];proofs={}
    for node,anonymous_namespace,file_scope in variables:
        has_initializer=node.get('init') is not None
        alias_storage=any(kind(child) in ('AliasAttr','IFuncAttr') for child in kids(node))
        if node.get('storageClass')=='extern' and not has_initializer and not alias_storage:continue
        name=node.get('name');loc=node.get('loc',{})
        if not name or not isinstance(loc.get('offset'),int):continue
        offset=loc['offset'];name_bytes=name.encode('utf-8')
        physical=loc.get('file')
        matches=[]
        if physical:
            header=Path(physical)
            header=(header if header.is_absolute() else root/header).resolve()
            try:header.relative_to(root)
            except ValueError:continue
            if header.suffix.lower() not in ('.h','.hpp','.hh','.hxx','.inc') or not header.is_file():continue
            data=header.read_bytes()
            if data[offset:offset+len(name_bytes)]==name_bytes:matches=[(header,data)]
        elif loc.get('includedFrom'):
            # includedFrom identifies the includer, never the actual header.
            # The identifier's exact unique byte offset proves the file.
            for header,data in original_header_source_bytes(str(root)):
                if data[offset:offset+len(name_bytes)]==name_bytes:
                    matches.append((header,data))
                    if len(matches)>1:break
        if len(matches)!=1:continue
        header,data=matches[0]
        chain=[];cursor=node;seen=set()
        while cursor.get('id') and cursor['id'] not in seen:
            seen.add(cursor['id']);chain.append(cursor['id'])
            cursor=declarations.get(cursor.get('previousDecl'),{})
        previously_external=any(declarations[identifier].get('storageClass')=='extern' for identifier in chain)
        internal=(node.get('storageClass')=='static' or anonymous_namespace or
                  (compile_as_cpp and immutable_global(node) and not previously_external and not node.get('inline')))
        proof={'source_header':header.relative_to(root).as_posix(),'source_offset':offset,
               'source_line':data[:offset].count(b'\n')+1,'translation_unit':source_rel,
               'clang_decl_id':node['id'],'redeclaration_chain':chain,
               'linkage':'internal' if internal else 'external',
               'definition_rule':'extern-with-Clang-initializer' if node.get('storageClass')=='extern' else 'namespace-scope-non-extern-storage',
               'scope_evidence':'enclosing-Clang-namespace' if file_scope else
                   'complete-same-TU-lexical-context' if node.get('_source_file_scope') else 'nonlocal-native-mangling',
               'clang_initializer_kind':node.get('init'),
               'physical_origin_proof':'unique-original-header-identifier-byte-offset'}
        if node.get('inline'):
            proof['unsupported_semantics']='inline header variable requires shared ODR storage and initialization lifetime'
        if node.get('tls'):
            proof['unsupported_semantics']='thread-local header variable requires original thread storage lifetime'
        if alias_storage:
            proof['unsupported_semantics']='header variable alias requires original owner-address linkage'
        proofs[id(node)]=proof;added.append(node)
    return added,proofs


def recover_referenced_header_functions(ast, candidates, source_root, requested_templates=(),compile_as_cpp=True):
    """Demand-driven closure of Clang-referenced, original header inline bodies.

    Clang elides repeated header filenames in its AST. For such entries,
    prove the original file by an EXACT, unique source-header byte offset.
    A matching name alone or declaration with no body is not sufficient.
    """
    if source_root is None:return [],{},set()
    root=Path(source_root).resolve()
    sysroot=Path(os.environ['EDUKE32_SYSROOT']).resolve() if os.environ.get('EDUKE32_SYSROOT') else None
    known_by_id={};by_signature={};invalid=set()
    origins={};template_ids=set()

    def verified_header(n):
        identifier=n.get('id')
        if identifier in origins:return origins[identifier]
        loc=n.get('loc',{});physical=loc.get('file','')
        if loc.get('expansionLoc'):
            origins[identifier]=macro_header_origin(n,root,sysroot)
            return origins[identifier]
        def inside_root(file):
            p=Path(file);p=(p if p.is_absolute() else root/p).resolve()
            if not (p.is_relative_to(root) or (sysroot and p.is_relative_to(sysroot/'usr/include'))):return None
            return p if p.is_file() else None
        path=inside_root(physical) if physical else None
        offset=loc.get('offset');name=n.get('name');spelling=name.encode() if name else b''
        if path and path.suffix.lower() in ('','.h','.hpp','.hh','.hxx','.inc','.tcc'):
            data=path.read_bytes()
            if isinstance(offset,int) and spelling and data[offset:offset+len(spelling)]==spelling:
                origins[identifier]=path;return path
            # An explicitly recorded filename cannot be replaced by a
            # coincidental identifier offset in a different header.
            origins[identifier]=None;return None
        # 'includedFrom' is NOT the physical file. Inspect exact source
        # bytes at the offset in each original header, accepting one match.
        if not physical and 'includedFrom' in loc and isinstance(offset,int) and name:
            matches=[]
            inventories=[original_header_source_bytes(str(root))]
            if sysroot:inventories.append(toolchain_header_source_bytes(str(sysroot)))
            for inventory in inventories:
                for header,data in inventory:
                    if data[offset:offset+len(spelling)]!=spelling:continue
                    # Exact identifier, not a prefix of another declaration.
                    if data[offset+len(spelling):offset+len(spelling)+1] in tuple(bytes([c]) for c in b'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789'):continue
                    matches.append(header)
                    if len(matches)>1:break
                if len(matches)>1:break
            if len(matches)==1:
                origins[identifier]=matches[0];return matches[0]
        origins[identifier]=None;return None

    for top in ast:
        stack=[(top,False)]
        while stack:
            n,file_scope=stack.pop();k=kind(n)
            if k in ('TranslationUnitDecl','NamespaceDecl','LinkageSpecDecl'):
                stack.extend((child,True) for child in reversed(kids(n)));continue
            if k=='FunctionTemplateDecl':
                # Clang's monomorphized FunctionDecl bodies live UNDER the
                # template node, not among ordinary namespace declarations.
                for specialization in kids(n):
                    if kind(specialization)=='FunctionDecl':
                        template_ids.add(id(specialization))
                        stack.append((specialization,file_scope))
                continue
            # Both source-defined callable helpers and TU-private header
            # constants participate in reference closure. Header static data
            # is never offered as an *external* cross-TU import.
            is_static_data=(k=='VarDecl' and n.get('storageClass')=='static'
                            and (kids(n) or n.get('constexpr')))
            if is_static_data and not file_scope and not detached_file_storage(n,compile_as_cpp):continue
            if not is_static_data and (k!='FunctionDecl' or
                    not any(kind(x)=='CompoundStmt' for x in kids(n))):
                continue
            external_inline=(n.get('storageClass')!='static' and
                (n.get('inline') is True or n.get('constexpr') is True))
            if n.get('storageClass')!='static' and not external_inline:continue
            # Function-local statics must have one shared C++ object across TUs.
            # Until that lifetime/identity is represented in JS, reject them.
            if external_inline and any(kind(v)=='VarDecl' and v.get('storageClass')=='static'
                    for v in descendants(n)):
                continue
            loc=n.get('loc',{})
            # Header provenance is validated only for referenced functions;
            # Clang ASTs can contain thousands of unrelated system headers.
            if not loc.get('file') and not loc.get('includedFrom') and not loc.get('expansionLoc'):continue
            signature=(k,n.get('name'),qual(n));identifier=n.get('id')
            if not identifier or not signature[0]:continue
            if signature in by_signature and by_signature[signature] is not n:
                invalid.add(signature)
            else:by_signature[signature]=n
            known_by_id[identifier]=n
    added=[];odr_origins={};selected={n.get('id') for n in candidates};queue=list(candidates)
    # A whole-owner rebuild can explicitly request a previously exported
    # specialization even when none of its remaining functions calls it.
    # Select only actual concrete Clang instances in proven original/target
    # headers; dependent patterns are not implementations. Keep the same
    # native mangling, original body and target-header provenance.
    for n in known_by_id.values():
        if (id(n) not in template_ids or n.get('name') not in requested_templates or
                not n.get('mangledName') or not any(kind(arg)=='TemplateArgument' for arg in kids(n)) or
                n.get('id') in selected):continue
        origin=verified_header(n)
        if origin is None:continue
        if sysroot and origin.is_relative_to(sysroot) and not origin.is_relative_to(root):
            n['_source_toolchain_header']={'source_header':'@sysroot/'+origin.relative_to(sysroot).as_posix(),
                'source_offset':n['loc'].get('offset',n['loc'].get('expansionLoc',{}).get('offset')),
                'header_sha256':hashlib.sha256(origin.read_bytes()).hexdigest(),
                'physical_origin_proof':'unique-target-sysroot-identifier-byte-offset',
                'target_abi':'x86_64-linux-lp64-le'}
        selected.add(n['id']);added.append(n);queue.append(n)
        if n.get('storageClass')!='static':
            odr_origins[id(n)]=(origin.relative_to(root).as_posix() if origin.is_relative_to(root)
                               else n['_source_toolchain_header']['source_header'])
    while queue:
        caller=queue.pop(0)
        local_ids={node.get('id') for node in descendants(caller) if node is not caller
                   and kind(node) in ('VarDecl','ParmVarDecl') and node.get('id')}
        for expr in descendants(caller):
            if kind(expr)!='DeclRefExpr':continue
            ref=expr.get('referencedDecl',{})
            if ref.get('kind') not in ('FunctionDecl','VarDecl'):continue
            if ref.get('kind')=='VarDecl' and ref.get('id') in local_ids:continue
            n=known_by_id.get(ref.get('id'))
            signature=(ref.get('kind'),ref.get('name'),ref.get('type',{}).get('qualType'))
            if n is None and signature not in invalid:n=by_signature.get(signature)
            if n is None or n.get('id') in selected:continue
            origin=verified_header(n)
            if origin is None:continue
            if sysroot and origin.is_relative_to(sysroot) and not origin.is_relative_to(root):
                n['_source_toolchain_header']={'source_header':'@sysroot/'+origin.relative_to(sysroot).as_posix(),
                    'source_offset':n['loc'].get('offset',n['loc'].get('expansionLoc',{}).get('offset')),'header_sha256':hashlib.sha256(origin.read_bytes()).hexdigest(),
                    'physical_origin_proof':'unique-target-sysroot-identifier-byte-offset',
                    'target_abi':'x86_64-linux-lp64-le'}
            selected.add(n['id']);added.append(n);queue.append(n)
            if n.get('storageClass')!='static':
                odr_origins[id(n)]=(origin.relative_to(root).as_posix() if origin.is_relative_to(root)
                    else n['_source_toolchain_header']['source_header'])
    return added,odr_origins,{id(n) for n in added if id(n) in template_ids}


def reference_names(node, resolver=None, class_dependencies=None, trivial_assignments=None, type_aliases=None, allocation_dependencies=False, static_method_owners=None, storage_constructor_nodes=None, non_odr_static_values=None):
    """Find non-local symbol dependencies using Clang DECLARATION IDENTITIES.

    Names alone are unsafe: a shadowing local `int globals;` must not suppress
    an unrelated `extern int globals;` used in another scope. The compiler's
    strict linker must see the latter reference and require a proven owner.
    Unidentified VarDecl references fail closed rather than being erased.
    """
    class_dependencies=class_dependencies or set()
    type_aliases=type_aliases or {}
    result=set()
    local_ids=set()
    def collect(n, parent_kind=None):
        k=kind(n)
        if k=='ParmVarDecl' and n.get('id'):
            local_ids.add(n['id'])
        elif k=='VarDecl' and n.get('id'):
            # Only variables DECLARED within a function/block/statement are
            # locals. A top-level VarDecl (including its initializer) is not.
            if parent_kind not in (None,'TranslationUnitDecl','NamespaceDecl','LinkageSpecDecl'):
                local_ids.add(n['id'])
        for child in semantic_kids(n):collect(child,k)
    collect(node)
    def walk(n):
        if allocation_dependencies and kind(n) in ('CXXNewExpr','CXXDeleteExpr'):
            for key in ('operatorNewDecl','operatorDeleteDecl'):
                declaration=n.get(key)
                if declaration and declaration.get('kind')=='FunctionDecl':
                    result.add(resolver(declaration) if resolver else js_ident(declaration['name']))
        if kind(n)=='MemberExpr' and (n.get('name','').startswith('operator ') or explicit_operator(n)):
            receiver=kids(n)
            if receiver:
                spelling=re.sub(r'[&*]+\s*$','',qual(receiver[0])).strip()
                cls=normalized_record_name(spelling,type_aliases)
                if cls:result.add(js_ident(cls))
        if kind(n) in ('CXXConstructExpr','CXXTemporaryObjectExpr'):
            cls=normalized_record_name(qual(n),type_aliases)
            if cls and cls in class_dependencies and id(n) not in (storage_constructor_nodes or set()):
                result.add(js_ident(cls))
        if kind(n)=='CXXOperatorCallExpr' and len(kids(n))>=2:
            callee=kids(n)[0]
            while kind(callee) in WRAPPERS and len(kids(callee))==1:callee=kids(callee)[0]
            ref=callee.get('referencedDecl',{}) if kind(callee)=='DeclRefExpr' else {}
            if ref.get('kind')=='CXXMethodDecl':
                cls=normalized_record_name(qual(kids(n)[1]),type_aliases)
                if cls and ref.get('id') not in (trivial_assignments or {}):result.add(js_ident(cls))
        if kind(n)=='DeclRefExpr':
            decl=n.get('referencedDecl',{})
            if n.get('nonOdrUseReason')=='constant' and decl.get('id') in (non_odr_static_values or {}):return
            dk=decl.get('kind')
            if dk=='CXXMethodDecl' and decl.get('id') in (static_method_owners or {}):
                result.add(static_method_owners[decl['id']][0])
            if dk not in ('EnumConstantDecl','CXXMethodDecl','ParmVarDecl'):
                name=decl.get('name')
                if name and decl.get('id') not in local_ids and name not in BUILTIN_HELPERS and name not in LIBM and name not in ('__builtin_assume_aligned',):
                    if resolver and dk in ('FunctionDecl','VarDecl'):name=resolver(decl)
                    else:name=js_ident(name)
                    if not name.startswith(('cByteMemory.','cProcess.','cCHeap.')):
                        result.add(name)
        for child in semantic_kids(n):walk(child)
    walk(node)
    return result

def parse_clang_record_layouts(output):
    """Only accept exact sizes/alignments reported by target Clang ABI."""
    parsed={}
    for block in output.split('*** Dumping AST Record Layout'):
        header=re.search(r'^\s*0\s+\|\s+(?:struct|class|union)\s+([^\n]+)',block,re.M)
        summary=re.search(r'\[sizeof=(\d+),[^\]]*?align=(\d+)',block,re.S)
        if not header or not summary:continue
        name=header.group(1).strip()
        layout={'size':int(summary.group(1)),'align':int(summary.group(2))}
        # Direct fields only. Bit ranges are reported by target Clang, never
        # reconstructed from host packing rules or an assumed storage unit.
        layout['fields']=[]
        for item in re.finditer(r'^\s*(\d+)(?::(\d+)-(\d+)|:(-))?\s*\|   (\S[^\n]*)$',block,re.M):
            byte,start,end,zero,declaration=item.groups()
            field={'offset':int(byte),'declaration':declaration.strip()}
            base=re.fullmatch(r'(.+?) \((primary base|base|virtual base|primary virtual base)\)',declaration.strip())
            if base:
                layout.setdefault('bases',[]).append({'offset':int(byte),'type':base[1],
                    'virtual':'virtual' in base[2]})
                continue
            if start is not None:field.update(bit_start=int(start),bit_width=int(end)-int(start)+1)
            elif zero is not None:field.update(bit_start=0,bit_width=0)
            layout['fields'].append(field)
        if layout['size']<0 or layout['align']<1:continue
        parsed[name]=layout
        # clang AST argType may carry a leading struct/class keyword.
        for prefix in ('struct ','class ','union '):parsed[prefix+name]=layout
    return parsed

def recover_typedef_record_layouts(ast, layouts):
    """Connect anonymous typedef-tag identities to exact Clang ABI layouts.

    In C/C++ a declaration such as ``typedef struct { ... } Midi;`` can
    appear as ``struct Midi`` in a later sizeof expression, while Clang's
    record-layout dump names the *physical declaration* ``(unnamed at
    header:line:col)``. Never derive sizes from fields or from the typedef's
    spelling; require one source-owned tag ID and an exact layout match.
    """
    records = {}
    for root in ast:
        for node in descendants(root):
            if kind(node) in ('RecordDecl','CXXRecordDecl') and node.get('completeDefinition') and node.get('id'):
                records.setdefault(node['id'], []).append(node)
    matched = {}
    ambiguous = set()
    for root in ast:
        for alias in descendants(root):
            if kind(alias) not in ('TypedefDecl','TypeAliasDecl') or not alias.get('name'):
                continue
            name = alias['name']
            tag_ids = {t.get('ownedTagDecl', {}).get('id') or t.get('decl', {}).get('id')
                       for t in descendants(alias)
                       if kind(t) in ('ElaboratedType','RecordType')}
            tag_ids.discard(None)
            if len(tag_ids) != 1:
                continue
            candidates = records.get(next(iter(tag_ids)), [])
            if len(candidates) != 1:
                continue
            tag = candidates[0]
            location = tag.get('loc', {})
            if tag.get('name') or not all(location.get(x) for x in ('file','line','col')):
                continue
            physical = f"(unnamed at {location['file']}:{location['line']}:{location['col']})"
            layout = layouts.get(physical)
            if layout is None:
                continue
            if not (isinstance(layout.get('size'), int) and isinstance(layout.get('align'), int)
                    and layout['size'] > 0 and layout['align'] > 0):
                continue
            if name in matched and matched[name] != layout:
                ambiguous.add(name)
            else:
                matched[name] = layout
    for name in ambiguous:
        matched.pop(name, None)
    return matched

@lru_cache(maxsize=24)
def source_header_inventory(source_root):
    """Only original-source headers are candidates for physical AST provenance."""
    root=Path(source_root)
    return tuple(sorted(p for p in root.rglob('*') if p.is_file()
                        and p.suffix.lower() in ('.h','.hpp','.hh','.hxx')))

@lru_cache(maxsize=512)
def resolve_friend_origin(source_root, record_name, record_offset, friend_name, friend_offset):
    """Uniquely identify a header's exact original *byte offsets*.

    In some full Clang AST dumps `loc.file` is omitted for nested FriendDecls.
    `includedFrom.file` is not physical source provenance, so never accept it.
    Rather than guessing a header by spelling, verify both AST offsets on real
    original header bytes. Ambiguous matches remain unknown. No title-based
    exceptions or hand-maintained symbol mapping.
    """
    if (not source_root or not isinstance(record_offset,int) or
        not isinstance(friend_offset,int) or min(record_offset,friend_offset)<1 or
        not record_name or not friend_name):return None
    root=Path(source_root)
    record_bytes=record_name.encode('utf-8');friend_bytes=friend_name.encode('utf-8')
    matches=[]
    for header in source_header_inventory(str(root)):
        try:
            if header.stat().st_size < max(record_offset+len(record_bytes),friend_offset+len(friend_bytes)):
                continue
            with header.open('rb') as f:
                f.seek(record_offset)
                if f.read(len(record_bytes))!=record_bytes:continue
                # CXXRecordDecl loc begins at class name, not class keyword.
                f.seek(max(0,record_offset-24))
                preceding=f.read(min(24,record_offset)).rstrip()
                if not re.search(rb'(?:class|struct|union)\s*$',preceding):continue
                f.seek(friend_offset)
                if f.read(len(friend_bytes))!=friend_bytes:continue
            matches.append(header.relative_to(root).as_posix())
            if len(matches)>1:return None
        except OSError:continue
    return matches[0] if len(matches)==1 else None

def produce(ast,source,source_rel,filters=None,include_header_inlines=False,project_symbols=None,record_layouts=None,enum_constants=None,source_root=None,header_dependency_closure=False,compile_as_cpp=True,standard_heap_runtime=False,private_source_storage=None,standard_c_heap_runtime=False,header_definition_owners=None,existing_source_storage=None):
    normalize_specializations(ast)
    lifetime_classes,lifetime_aliases=recover_lifetime_classes(ast)
    static_member_definitions,external_static_members=recover_out_of_line_static_members(ast,source_root,source_rel,header_proof)
    candidates=[];header_definition_proofs={}
    # Collect C++ destructor traits from the SAME Clang translation-unit AST.
    # A copy-constructed object must not be allowed past goto validation just
    # because it has a C++ class name. Ambiguous type names are fail-closed.
    destructor_evidence={}
    def collect_record_traits(node):
        if kind(node)=='CXXRecordDecl' and node.get('completeDefinition'):
            name=node.get('name','')
            dtor=node.get('definitionData',{}).get('dtor',{})
            if name:
                destructor_evidence.setdefault(name,set()).add(dtor.get('trivial') is True)
        for child in kids(node):collect_record_traits(child)
    for root in ast:collect_record_traits(root)
    trivial_destructors={name for name,values in destructor_evidence.items() if values=={True}}
    trivial_assignments=recover_trivial_assignment_methods(ast)
    aggregate_records=recover_trivial_aggregate_records(ast,source_root=source_root)
    global_storage_records=recover_trivial_aggregate_records(ast,static_storage=True,source_root=source_root)
    pointer_span_records=recover_pointer_span_records(ast)
    copy_classes=recover_trivial_copy_classes(ast)
    implicit_byte_assignable=set()
    for root_node in ast:
        for record in descendants(root_node):
            if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition') or not record.get('name'):
                continue
            traits=record.get('definitionData',{})
            if (traits.get('copyAssign',{}).get('trivial') is True and
                traits.get('isTriviallyCopyable') is True and
                traits.get('isStandardLayout') is True and
                not any(kind(method)=='CXXMethodDecl' and method.get('name')=='operator='
                            and not method.get('isImplicit') and any(kind(child)=='CompoundStmt' for child in kids(method))
                            for method in kids(record))):
                implicit_byte_assignable.add(record['name'])
    # Record declarations in Clang's AST filter are often detached from the
    # enclosing NamespaceDecl. Resolve a scoped POD's short storage name only
    # when the complete original record definition is unique in this AST.
    complete_record_counts={}
    repeated_records={}
    for root_node in ast:
        for record in descendants(root_node):
            if kind(record)=='CXXRecordDecl' and record.get('completeDefinition') and record.get('name'):
                repeated_records.setdefault(record['name'],[]).append(record)
                complete_record_counts.setdefault(record['name'],set()).add((
                    record.get('loc',{}).get('offset'),
                    record.get('loc',{}).get('file'),
                    tuple((field.get('name'),qual(field)) for field in kids(record) if kind(field)=='FieldDecl')))
    # Independent filtered dumps may omit a repeated header filename. Use
    # original header bytes and offsets to reconcile that omission, retaining
    # distinct physical declarations and differing fields as ambiguities.
    for name,records in repeated_records.items():
        if len(complete_record_counts[name])<2:continue
        origins=set()
        for record in records:
            proof=header_proof(record,source_root) if source_root else None
            if not proof:break
            origins.add((proof['source_header'],proof['source_offset'],proof['enclosing_record'],
                tuple((field.get('name'),qual(field)) for field in kids(record) if kind(field)=='FieldDecl')))
        else:
            if len(origins)==1:complete_record_counts[name]=origins
    constructor_factories=recover_constructor_factories(ast)
    member_operators={}
    for root in ast:
        for record in descendants(root):
            if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition') or not record.get('name'):continue
            cls=record['name']
            for method in kids(record):
                if (kind(method)=='CXXMethodDecl' and method.get('name','').startswith('operator')
                    and any(kind(v)=='CompoundStmt' for v in kids(method))):
                    name=method['name']
                    try:symbol=operator_js_symbol(name,qual(method))
                    except Unsupported:continue
                    key=(cls,name,qual(method))
                    if key in member_operators and member_operators[key]!=symbol:raise Unsupported('ambiguous operator class method')
                    member_operators[key]=symbol
    member_conversions={}
    member_method_symbols={};overloaded_member_names=set()
    for root in ast:
        for record in descendants(root):
            if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition'):continue
            cls=record.get('name');groups={}
            for method in kids(record):
                if kind(method)=='CXXMethodDecl' and not method.get('isImplicit') and not method.get('name','').startswith('operator'):
                    groups.setdefault(method['name'],set()).add(qual(method))
            for method_name,signatures in groups.items():
                if len(signatures)<2:continue
                overloaded_member_names.add((cls,method_name))
                for method in kids(record):
                    if (kind(method)=='CXXMethodDecl' and method.get('name')==method_name and
                            any(kind(body)=='CompoundStmt' for body in kids(method))):
                        signature=qual(method)
                        member_method_symbols[(cls,method_name,signature)]=js_ident(method_name)+'__cxx_method_'+hashlib.sha256(signature.encode()).hexdigest()[:16]
    member_conversion_names={}
    ambiguous_conversion_ids=set();ambiguous_conversion_names=set()
    for root in ast:
        for record in descendants(root):
            if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition'):continue
            for method in kids(record):
                if kind(method)!='CXXConversionDecl' or not method.get('id') or not any(kind(v)=='CompoundStmt' for v in kids(method)):continue
                try:symbol=conversion_js_symbol(method.get('name',''),qual(method))
                except Unsupported:continue
                if method['id'] in member_conversions and member_conversions[method['id']]!=symbol:
                    ambiguous_conversion_ids.add(method['id'])
                member_conversions[method['id']]=symbol
                key=(record.get('name'),method.get('name'))
                if key in member_conversion_names and member_conversion_names[key]!=symbol:
                    ambiguous_conversion_names.add(key)
                member_conversion_names[key]=symbol
    for invalid_id in ambiguous_conversion_ids:member_conversions.pop(invalid_id,None)
    for invalid in ambiguous_conversion_names:member_conversion_names.pop(invalid,None)
    enum_types=recover_enum_type_names(ast)
    enum_values=recover_enum_values(ast, enum_constants)
    aliases=recover_type_aliases(ast)
    aliases.update(lifetime_aliases)
    record_layouts=dict(record_layouts or {})
    record_layouts.update(typedef_record_layouts(ast,record_layouts,source_root))
    record_layouts.update(specialization_layouts(ast,record_layouts))
    record_layouts.update(recover_typedef_record_layouts(ast, record_layouts))
    byte_records=recover_byte_records(ast,record_layouts,aliases,source_root=source_root,layout_aliases=record_layouts,source_rel=source_rel)
    record_storage_views=recover_byte_records(ast,record_layouts,aliases,source_root=source_root,storage_views=True,source_rel=source_rel)
    for record_name,record in byte_records.items():
        # Preserve the older, explicitly opaque copy-only ABI for wrappers
        # that were already proven to use exact-size byte buffers.
        if aggregate_records.get(record_name,{}).get('opaque_union'):continue
        # Preserve the existing explicit pointer-alias facade ABI. Its slots
        # already retain original pointer identity and have regression coverage;
        # it cannot be silently migrated to nested byte views in a partial TU.
        if global_storage_records.get(record_name,{}).get('pointer_aliases'):continue
        aggregate_records[record_name]=record
        global_storage_records[record_name]=record
    # Include packed/byte-backed records in the same scoped identity proof.
    # Performing this before byte extraction omitted exactly those records,
    # even when Clang had proved their implicit assignment to be trivial.
    verified_scoped_trivial_records={name for name in implicit_byte_assignable
        if name in aggregate_records and len(complete_record_counts.get(name,set()))==1}
    scoped_record_types=set()
    for root_node in ast:
        for usage in descendants(root_node):
            candidate=normalized_record_name(qual(usage))
            if candidate and '::' in candidate and re.fullmatch(r'[A-Za-z_]\w*(?:::[A-Za-z_]\w*)+',candidate):
                if candidate.rsplit('::',1)[-1] in verified_scoped_trivial_records:
                    scoped_record_types.add(candidate)
    for full_name in sorted(scoped_record_types):
        short=full_name.rsplit('::',1)[-1]
        # A qualified byte-backed schema can coexist with a short register
        # aggregate for the same proven original declaration. Keep its exact
        # packed layout and still retain Clang's trivial assignment trait.
        implicit_byte_assignable.add(full_name)
        if full_name in aggregate_records and aggregate_records[full_name]!=aggregate_records[short]:
            continue
        aggregate_records[full_name]=aggregate_records[short]
        if short in global_storage_records:
            global_storage_records[full_name]=global_storage_records[short]
    # A source-constructed standard-layout class can be borrowed without
    # copying it, including fixed numeric array fields. Require a trivial
    # destructor and complete supported member storage; nested ownership and
    # unproven class layouts remain blocked rather than becoming plain objects.
    addressable_classes=set()
    for tree in ast:
        for record in descendants(tree):
            if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition'):continue
            name=record.get('name');traits=record.get('definitionData',{})
            fields=[field for field in kids(record) if kind(field)=='FieldDecl']
            if (not name or len(complete_record_counts.get(name,set()))!=1 or record.get('bases')
                or traits.get('isStandardLayout') is not True or name not in trivial_destructors
                or traits.get('isAggregate') is True
                or not fields or any(method.get('virtual') or method.get('pure') for method in kids(record))):continue
            try:
                supported=all(field.get('name') and not field.get('isBitfield') and '&' not in qual(field)
                    and aggregate_type_schema(qual(field),global_storage_records,aliases,record_layouts,
                        allow_pointer_storage=True,enum_types=enum_types) is not None for field in fields)
            except Unsupported:supported=False
            if supported:addressable_classes.add(name)
    project_symbols=project_symbols or {}
    template_source_bytes=None
    def scan(node,file_scope=False):
        nonlocal template_source_bytes
        k=kind(node)
        if k=='FunctionTemplateDecl':
            # Concrete free-function specializations live under their template
            # declaration even when authored in this .cpp rather than a header.
            # Require the original source token and native mangled instance;
            # the dependent primary template is never a callable definition.
            loc=node.get('loc',{});physical=loc.get('file','');offset=loc.get('offset');name=node.get('name','')
            own=(physical==source_rel or physical.endswith('/'+source_rel) or
                 not physical and not loc.get('includedFrom'))
            if not own:return
            if template_source_bytes is None:
                try:template_source_bytes=Path(source).read_bytes()
                except OSError:template_source_bytes=b''
            original=template_source_bytes
            if (own and name and isinstance(offset,int) and original[offset:offset+len(name)]==name.encode()):
                for child in kids(node):
                    if (kind(child)=='FunctionDecl' and child.get('mangledName') and
                        any(kind(arg)=='TemplateArgument' for arg in kids(child)) and
                        any(kind(body)=='CompoundStmt' for body in kids(child))):
                        scan(child,file_scope)
            return
        if k in ('FunctionDecl','CXXRecordDecl','VarDecl'):
            # Revisions/declarations from headers are not the body authored by this file.
            loc=node.get('loc',{});file=loc.get('file','')
            if not file and 'offset' in loc and 'includedFrom' not in loc: file=source_rel
            in_source=file==source_rel or file.endswith('/'+source_rel)
            # Explicitly requested header functions may be materialized in this
            # translation unit when proven static/inline. This preserves their
            # source bodies rather than inserting handwritten replacements.
            inline_header=(include_header_inlines and k=='FunctionDecl'
                           and not in_source and any(kind(v)=='CompoundStmt' for v in kids(node))
                           and any(x in node.get('storageClass','') or x in str(node.get('inline',False))
                                   for x in ('static','True')))
            owned_header=(match_header_definition(node,source_rel,source_root,header_definition_owners or {})
                          if k=='FunctionDecl' and not in_source else None)
            if owned_header:header_definition_proofs[id(node)]=owned_header
            if in_source or inline_header or owned_header or (filters and k=='VarDecl' and node.get('constexpr')):
                if k=='VarDecl':
                    # Clang's name filter also returns matching *local*
                    # VarDecls as dump roots, with their parent omitted. Such
                    # declarations must never become file-scope JS storage.
                    # At a dump root require Clang's global mangling evidence;
                    # Itanium _ZZ... names belong to function-local statics.
                    if not file_scope and not detached_file_storage(node,compile_as_cpp):return
                    # An `extern T x;` is only a declaration, never a source
                    # definition. A later `T x = ...;` may be the actual owner.
                    # Recording both falsely creates a blocked definition and
                    # can produce duplicate JavaScript exports.
                    is_extern_declaration=(node.get('storageClass')=='extern' and not node.get('init'))
                    if not is_extern_declaration:candidates.append(node)
                if k=='FunctionDecl' and any(kind(v)=='CompoundStmt' for v in kids(node)):
                    candidates.append(node)
                if k=='CXXRecordDecl' and node.get('completeDefinition'):
                    candidates.append(node)
        if k=='TranslationUnitDecl' or k in ('NamespaceDecl','LinkageSpecDecl'):
            for c in kids(node):scan(c,True)
    for node in ast:scan(node)
    candidates.extend(static_member_definitions)
    allocator_definitions=original_allocator_definitions(ast,source_root,source_rel)
    allocator_proofs={id(node):proof for node,proof in allocator_definitions}
    known_candidates={id(node) for node in candidates}
    candidates.extend(node for node,proof in allocator_definitions if id(node) not in known_candidates
        and (not filters or any(value in node.get('name','') for value in filters.split(','))))
    header_globals,header_global_proofs=recover_original_header_globals(ast,source_root,source_rel,compile_as_cpp)
    if filters:
        # Filtered probes retain only explicitly selected header storage and
        # exact referenced owners; a full selected-TU build inventories all.
        owners={identity:node for node in header_globals
                for identity in header_global_proofs[id(node)]['redeclaration_chain']}
        wanted={id(node) for node in header_globals
                if any(value in node.get('name','') for value in filters.split(','))}
        # When dependency closure invokes Clang again, each independent AST
        # has fresh pointer-based declaration IDs. An original FunctionDecl
        # can therefore reference the same header-defined global by a *different*
        # Clang ID than the recovered VarDecl. Reconnect only an exact, unique
        # name + qualified-type pair, and only to a header VarDecl which already
        # passed recover_original_header_globals()'s physical-location and
        # storage-ownership proof. No unresolved name is assigned a guessed
        # owner, and a same-name/different-type declaration stays blocked.
        referenced_storage=set()
        for definition in candidates:
            for ref in descendants(definition):
                if kind(ref)!='DeclRefExpr':continue
                declaration=ref.get('referencedDecl',{})
                if declaration.get('kind')=='VarDecl' and declaration.get('name'):
                    referenced_storage.add((declaration['name'],qual(declaration)))
        proved_storage={}
        for owner in header_globals:
            key=(owner.get('name'),qual(owner))
            proved_storage.setdefault(key,[]).append(owner)
        for key in referenced_storage:
            proven=proved_storage.get(key,[])
            unique_origins={(header_global_proofs[id(owner)]['source_header'],
                             header_global_proofs[id(owner)]['source_offset'],
                             header_global_proofs[id(owner)]['translation_unit'])
                            for owner in proven}
            if len(proven)==1 and len(unique_origins)==1 and key[0] not in project_symbols:
                wanted.add(id(proven[0]))
        pending=list(candidates)+[node for node in header_globals if id(node) in wanted]
        while pending:
            for ref in descendants(pending.pop()):
                if kind(ref)!='DeclRefExpr':continue
                owner=owners.get(ref.get('referencedDecl',{}).get('id'))
                if owner is not None and id(owner) not in wanted:
                    wanted.add(id(owner));pending.append(owner)
        header_globals=[node for node in header_globals if id(node) in wanted]
    header_global_internal={id(node) for node in header_globals
        if header_global_proofs[id(node)]['linkage']=='internal'}
    candidates.extend(header_globals)
    def byte_method_sources():
        source_path=Path(source).resolve()
        pairs=original_header_source_bytes(str(Path(source_root).resolve()))
        sysroot=os.environ.get('EDUKE32_SYSROOT')
        if sysroot:pairs=(*pairs,*toolchain_header_source_bytes(sysroot))
        return (*pairs,(source_path,source_path.read_bytes()))
    byte_constructors,native_byte_classes=recover_byte_constructors(ast,candidates,record_storage_views,aliases,
        normalized_record_name,source_root,source_rel,byte_method_sources)
    candidates.extend(byte_constructors)
    candidates.extend(recover_byte_methods(ast,candidates,record_storage_views,aliases,normalized_record_name,
        source_root,source_rel,byte_method_sources,native_classes=native_byte_classes))
    header_helpers,header_odr,header_templates=(recover_referenced_header_functions(ast,candidates,source_root,
                    requested_templates=set(filters.split(',')) if filters and include_header_inlines else (),compile_as_cpp=compile_as_cpp)
                    if header_dependency_closure else ([],{},set()))
    header_helper_ids={id(n) for n in header_helpers if id(n) not in header_odr}
    candidates.extend(header_helpers)
    # Clang omits a repeated primary-input filename. A selected header's own
    # class must use the same header factory ABI as its included declaration.
    # header_proof still verifies its exact physical bytes/name/offset.
    if Path(source_rel).suffix.lower() in ('.h','.hpp','.hh','.hxx'):
        for candidate in candidates:
            location=candidate.get('loc',{})
            if (kind(candidate)=='CXXRecordDecl' and not location.get('file') and
                    not location.get('includedFrom') and isinstance(location.get('offset'),int)):
                location['file']=source_rel
    header_records,header_record_proofs=demanded_header_records(ast,candidates,global_storage_records,aliases,
        normalized_record_name,aggregate_type_schema,source_root,Unsupported,record_layouts=record_layouts)
    header_record_factories=set(header_record_proofs)
    header_trivial_assignments={}
    for evidence in trivial_assignments.values():
        name=evidence.get('record_name')
        if name in header_record_factories:
            key=(name,'operator=',evidence['signature'])
            previous=header_trivial_assignments.get(key)
            if previous and previous['mode']!=evidence['mode']:
                raise Unsupported('conflicting original header assignment identities: '+str(key))
            header_trivial_assignments[key]=evidence
    # Pure type/method declarations are hoisted factories. They execute no C++
    # constructors, globals or methods at module evaluation, preserving cycles.
    header_ids={id(record) for record in header_records}
    candidates=[record for record in header_records if record['name'] not in project_symbols]+[
        candidate for candidate in candidates if id(candidate) not in header_ids]
    extra_helpers,extra_odr,extra_templates=(recover_referenced_header_functions(ast,candidates,source_root,compile_as_cpp=compile_as_cpp)
        if header_dependency_closure else ([],{},set()))
    existing_ids={node.get('id') for node in candidates}
    candidates.extend(node for node in extra_helpers if node.get('id') not in existing_ids)
    header_odr.update(extra_odr);header_templates.update(extra_templates)
    header_helper_ids.update(id(node) for node in extra_helpers if id(node) not in extra_odr)
    candidates=order_constant_initialization(candidates,aliases)
    # A filtered original-source bootstrap can require a C++ class defined in
    # an included header. Materialize it from its unique, complete Clang record
    # ONLY when the selected source actually constructs the class and the class
    # has an authored constructor body. POD structs use aggregate lowering and
    # do not need a fabricated JS class export.
    if filters:
        required_classes=set()
        for node in candidates:
            for expr in descendants(node):
                if kind(expr) not in ('CXXConstructExpr','CXXTemporaryObjectExpr'):continue
                name=normalized_record_name(qual(expr),aliases)
                if name:required_classes.add(name)
        for name in sorted(required_classes):
            definitions=[record for root in ast for record in descendants(root)
                         if kind(record)=='CXXRecordDecl' and record.get('completeDefinition')
                         and record.get('name')==name and any(
                             kind(c)=='CXXConstructorDecl' and c.get('explicitlyDefaulted')!='default'
                             and any(kind(child)=='CompoundStmt' for child in kids(c))
                             for c in kids(record))]
            origins={(r.get('loc',{}).get('file'),r.get('loc',{}).get('offset')) for r in definitions}
            if len(origins)==1 and definitions:
                candidates.append(definitions[0])
    demanded_lifetimes={normalized_record_name(qual(node),aliases) for candidate in candidates
        for node in descendants(candidate) if kind(node) in ('CXXConstructExpr','CXXTemporaryObjectExpr')}
    present={id(node) for node in candidates}
    for name in sorted(demanded_lifetimes-set([None])):
        evidence=lifetime_classes.get(name)
        if evidence and id(evidence['record']) not in present and name not in project_symbols:
            candidates.append(evidence['record']);present.add(id(evidence['record']))
    # A friend operator defined *inside* a C++ class is an actual namespace
    # FunctionDecl with a body, but its AST is nested beneath FriendDecl.
    # Clang does not duplicate it as a top-level FunctionDecl. Recover only
    # definitions actually called by this translation unit, matched by the
    # Clang-selected name AND function type. These are original header bodies,
    # not synthetic operator implementations or guessed arithmetic.
    requested_friends=set()
    for node in candidates:
        for expr in descendants(node):
            if kind(expr)!='CXXOperatorCallExpr' or not kids(expr):continue
            callee=kids(expr)[0]
            while kind(callee) in WRAPPERS and len(kids(callee))==1:
                callee=kids(callee)[0]
            decl=callee.get('referencedDecl',{}) if kind(callee)=='DeclRefExpr' else {}
            if decl.get('kind')=='FunctionDecl' and decl.get('name','').startswith('operator'):
                requested_friends.add((decl.get('name'), decl.get('type',{}).get('qualType')))
    friend_origins={};friend_locations={}
    for root in ast:
        for record in descendants(root):
            if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition'):continue
            for friend in kids(record):
                if kind(friend)!='FriendDecl':continue
                for function in kids(friend):
                    if (kind(function)!='FunctionDecl' or
                        not any(kind(child)=='CompoundStmt' for child in kids(function))):continue
                    signature=(function.get('name'),qual(function))
                    if signature not in requested_friends:continue
                    # Reject conflicting same-name/same-type bodies from
                    # distinct classes, namespaces or physical declarations.
                    loc=function.get('loc',{})
                    record_loc=record.get('loc',{})
                    header=loc.get('file') or record_loc.get('file')
                    if not header:
                        header=resolve_friend_origin(source_root,record.get('name'),
                                      record_loc.get('offset'),function.get('name'),loc.get('offset'))
                    origin=(record.get('name'),header,loc.get('offset'))
                    friend_origins.setdefault(signature,set()).add(origin)
                    friend_locations[id(function)]=origin
                    candidates.append(function)
    ambiguous_friends={sig for sig,locations in friend_origins.items() if len(locations)>1}
    def template_arguments_key(node):
        """Exact, stable Clang-selected function template argument identity.

        A non-type instantiation (f<3>) and (f<7>) can share the SAME
        C++ function type and definition location. Type-qualified symbol
        naming alone must never merge their different generated bodies.
        """
        arguments=[x for x in kids(node) if kind(x)=='TemplateArgument']
        if not arguments:
            raise Unsupported('template specialization lacks Clang-selected arguments')
        # The Clang ABI symbol is authoritative for qualified template type
        # and value arguments, including nested dependent type spellings
        # which AST JSON may serialize without an explicit scalar value.
        if node.get('mangledName'):
            return 'clang-mangled:'+node['mangledName']
        def stable(v):
            type_name=v.get('type',{}).get('qualType')
            children=kids(v)
            if kind(v)!='TemplateArgument' or (
                v.get('value') is None and not type_name and
                not (children and all(kind(c)=='TemplateArgument' for c in children))):
                raise Unsupported('template specialization requires unambiguous Clang template arguments')
            return { 'kind':kind(v), 'value':v.get('value'),
                     'type':type_name, 'children':[stable(x) for x in children] }
        return json.dumps([stable(arg) for arg in arguments],sort_keys=True,separators=(',',':'))
    # Dedupe AST clones by physical definition, never just by original name:
    # a C++ overload set can contain multiple legal functions with one name.
    unique=[];seen=set()
    previous_class_prototypes=set()
    for n in candidates:
        key=(kind(n),n.get('name'),n.get('loc',{}).get('offset'),qual(n),
             template_arguments_key(n) if id(n) in header_templates or
                kind(n)=='FunctionDecl' and any(kind(arg)=='TemplateArgument' for arg in kids(n)) else None)
        if key not in seen:unique.append(n);seen.add(key)
    # Type/layout closure can introduce a complete TU after the initial name
    # filter. Its declarations remain useful evidence, but an extension must
    # never allocate a second instance of already-owned source storage.
    candidates=[node for node in unique if not (kind(node)=='VarDecl' and
        node.get('name') in (existing_source_storage or {}) and
        qual(node)==existing_source_storage[node['name']]['original_type'] and
        project_symbols.get(node['name'])==source_rel)]
    # AST filter order is an extraction detail. C/C++ source declarations keep
    # their physical order, especially array constants used by later globals.
    original_positions=[]
    for position,node in enumerate(candidates):
        loc=node.get('loc',{});physical=loc.get('file','')
        if ((physical==source_rel or physical.endswith('/'+source_rel)) or
                not physical and 'includedFrom' not in loc and 'offset' in loc):
            if node.get('name') not in header_record_factories:
                original_positions.append(position)
    ordered=sorted((candidates[position] for position in original_positions),
                   key=lambda node:node.get('loc',{}).get('offset',0))
    for position,node in zip(original_positions,ordered):candidates[position]=node
    counts=Counter(js_ident(n.get('name')) for n in candidates if n.get('name'))
    signatures=Counter((n.get('name'),qual(n)) for n in candidates if kind(n)=='FunctionDecl')
    # Preserve ambiguity as a blocker even if AST-clone deduplication happened
    # to collapse one repeated friend declaration.
    for signature in ambiguous_friends:
        signatures[signature]=max(2,signatures[signature])
    # There can be same-signature declarations in different namespaces. They
    # cannot be resolved from a bare name/signature and must stay blocked.
    collision={n.get('name') for n in candidates if counts[js_ident(n.get('name'))]>1}
    symbols={};by_id={};by_signature={}
    for n in candidates:
        name=n.get('name')
        if not name:continue
        if kind(n)=='FunctionDecl' and allocation_symbol(n):
            symbol=allocation_symbol(n)
        elif id(n) in header_global_internal:
            proof=header_global_proofs[id(n)]
            symbol=js_ident(name)+'__header_global_'+hashlib.sha256(
                (source_rel+'\0'+proof['source_header']+'\0'+str(proof['source_offset'])+'\0'+name+'\0'+qual(n)).encode()).hexdigest()[:16]
        elif id(n) in header_helper_ids:
            # C/C++ 'static inline' header functions have INTERNAL linkage.
            # Never claim a project-global owner or collide across TUs.
            symbol=js_ident(name)+'__header_'+hashlib.sha256(
                (source_rel+'\0'+name+'\0'+qual(n)).encode()).hexdigest()[:12]
        elif id(n) in header_templates:
            # A template specialization must have a stable, type-qualified
            # owner even when one TU instantiates 1 overload and another 4.
            # Clang's ABI symbol also disambiguates namespaces and non-type
            # values (f<3> vs f<7>) when both return exactly int(int).
            # Demand proof of template arguments regardless of mangling.
            canonical=template_arguments_key(n)
            mangled=n.get('mangledName')
            identity=('clang-mangled\0'+mangled if mangled else
                      'template-args\0'+name+'\0'+qual(n)+'\0'+canonical)
            symbol=js_ident(name)+'__template_'+hashlib.sha256(
                identity.encode()).hexdigest()[:16]
        elif kind(n)=='FunctionDecl' and re.fullmatch(r'operator(?:\[\]|\(\)|[+*/%\-=&|^!<>~]+)', name) is not None:
            if signatures[(name,qual(n))]!=1:continue
            try:symbol=operator_js_symbol(name,qual(n))
            except Unsupported:continue
        elif name not in collision:symbol=js_ident(name)
        elif kind(n)=='FunctionDecl' and signatures[(name,qual(n))]==1:
            key=name+'\0'+qual(n)
            symbol=js_ident(name)+'__cxx_'+hashlib.sha256(key.encode()).hexdigest()[:12]
        else:continue
        symbols[id(n)]=symbol
        if n.get('id'):by_id[n['id']]=symbol
        if kind(n)=='FunctionDecl' and signatures[(name,qual(n))]==1:
            by_signature[(name,qual(n))]=symbol
    # Operator selection references in CXXNewExpr/CXXDeleteExpr carry Clang IDs,
    # often without mangling. Recover identities from the exact global declarations.
    for root in ast:
        for declaration in descendants(root):
            symbol=allocation_symbol(declaration)
            if symbol:
                if declaration.get('id'):by_id[declaration['id']]=symbol
                by_signature[(declaration['name'],qual(declaration))]=symbol
    # Match this browser logging service only to the exact C++ Loguru call
    # signature selected by Clang.  Do not confuse it with C math log(double),
    # or with similarly named functions from other namespaces/libraries.
    loguru_signature='void (Verbosity, const char *, unsigned int, const char *, ...)'
    if project_symbols.get('loguru_log')=='browser-abi/loguru_provider':
        for root in ast:
            for reference in descendants(root):
                if kind(reference)!='DeclRefExpr':continue
                decl=reference.get('referencedDecl',{})
                if (decl.get('kind')=='FunctionDecl' and decl.get('name')=='log'
                        and decl.get('type',{}).get('qualType')==loguru_signature):
                    if decl.get('id'):by_id[decl['id']]='loguru_log'
                    by_signature[('log',loguru_signature)]='loguru_log'
    # A header VarDecl may be referenced through a separate Clang declaration
    # ID (the non-defining redeclaration) and can use either the original
    # typedef spelling or its desugared type. Link only exact Clang-proven,
    # unique signatures to the TU-local owned binding; never fall back to
    # name-only resolution or widen this to an external source owner.
    variable_signatures={}
    ambiguous_variable_signatures=set()
    for node in candidates:
        if kind(node)!='VarDecl' or id(node) not in symbols:continue
        name=node.get('name')
        if not name or name in collision:continue
        for spelling in {qual(node),node.get('type',{}).get('qualType'),
                          node.get('type',{}).get('desugaredQualType')}:
            if not spelling:continue
            key=(name,spelling)
            if key in variable_signatures and variable_signatures[key]!=symbols[id(node)]:
                ambiguous_variable_signatures.add(key)
            variable_signatures[key]=symbols[id(node)]
    for key,symbol in variable_signatures.items():
        if key not in ambiguous_variable_signatures and key not in by_signature:
            by_signature[key]=symbol
    borrowed_header_values=set()
    for node in candidates:
        symbol=symbols.get(id(node));previous=(existing_source_storage or {}).get(symbol,{})
        proof=header_global_proofs.get(id(node),{});old=previous.get('header_global_definition',{})
        identity=('source_header','source_offset','translation_unit','linkage')
        if (kind(node)=='VarDecl' and immutable_global(node) and proof and old
                and scalar_info(resolve_scalar_storage_alias(qual(node),aliases))
                and previous.get('original_type')==qual(node)
                and all(proof.get(key)==old.get(key) for key in identity)
                and project_symbols.get(symbol)==source_rel):
            borrowed_header_values.add(id(node))
    # Keep the exact declaration-to-symbol bindings above, but emit no second
    # storage definition. The main entry point admits these header values only
    # when the complete original preprocessor dependency fingerprint matches.
    candidates=[node for node in candidates if id(node) not in borrowed_header_values]
    # Runtime lowering of is_constant_evaluated is false. A constant/static
    # initializer that reaches this query requires a separate Clang constant
    # value, even through a constexpr wrapper; do not emit that runtime result
    # as if it proved the compile-time branch.
    query_edges={}
    query_declarations={node.get('id'):node for tree in ast for node in descendants(tree) if node.get('id')}
    for tree in [*ast,*candidates]:
        for function in descendants(tree):
            if kind(function) not in ('FunctionDecl','CXXMethodDecl') or not any(kind(body)=='CompoundStmt' for body in kids(function)):continue
            key=(function.get('name'),qual(function))
            query_edges.setdefault(key,set()).update(constant_query_references(function,query_declarations))
    constant_query_functions=set()
    while True:
        discovered={key for key,refs in query_edges.items() if any(name=='__builtin_is_constant_evaluated' or (name,typ) in constant_query_functions for name,typ in refs)}
        if discovered<=constant_query_functions:break
        constant_query_functions.update(discovered)
    source_owned_names={n.get('name') for n in candidates if n.get('name')}
    # A complete class selected for source emission remains a constructor
    # provider even with no data fields. A record tag or same-named C function
    # does not establish that provider; its actual class must still link.
    source_class_providers={candidate.get('name') for candidate in candidates
        if kind(candidate)=='CXXRecordDecl' and candidate.get('completeDefinition')
        and symbols.get(id(candidate))==js_ident(candidate.get('name',''))}
    managed_record_names={record.get('name') for tree in ast for record in descendants(tree)
        if kind(record)=='CXXRecordDecl' and record.get('completeDefinition') and any(
            kind(member) in ('CXXConstructorDecl','CXXDestructorDecl') and not member.get('isImplicit')
            and any(kind(body)=='CompoundStmt' for body in kids(member)) for member in kids(record))}
    all_declarations={node.get('id'):node for top in ast for node in descendants(top) if node.get('id')}
    def libc_adapter(decl):
        scalar=verified_libc_scalar_symbol(decl,all_declarations.get(decl.get('id'),{}),project_symbols)
        if scalar:return scalar
        adapter=verified_libc_byte_symbol(decl)
        if adapter and adapter.startswith('cCHeap.'):
            original=all_declarations.get(decl.get('id'),{})
            if not standard_c_heap_runtime or original.get('mangledName')!=decl.get('name'):return None
        return adapter
    def resolve(decl):
        if decl.get('id') in by_id:return by_id[decl['id']]
        key=(decl.get('name'),decl.get('type',{}).get('qualType'))
        if key in by_signature:return by_signature[key]
        desugared=(decl.get('name'),decl.get('type',{}).get('desugaredQualType'))
        if desugared in by_signature:return by_signature[desugared]
        scalar=verified_libc_scalar_symbol(decl,all_declarations.get(decl.get('id'),{}),project_symbols)
        if scalar:return scalar
        if decl.get('name') not in source_owned_names and decl.get('name') not in project_symbols:
            adapter=libc_adapter(decl)
            if adapter and (standard_c_heap_runtime or not adapter.startswith('cCHeap.')):return adapter
        # A project-symbol table indexed only by spelling is insufficient for
        # overloads that share names with browser libc functions.  For the
        # canonical C math log(double), the host exposes the numeric math
        # function, while Loguru's log(...) has unrelated logging semantics.
        # Reject the latter unless an exact local/source implementation was
        # resolved above.  This is an ABI guard, not a Duke-specific stub.
        name=decl.get('name')
        if (name=='log' and project_symbols.get('log')=='browser-abi/libc_provider'
                and decl.get('kind')=='FunctionDecl'
                and decl.get('type',{}).get('qualType')!='double (double)'):
            raise Unsupported('incompatible C host provider: log requires double (double), got '
                              +str(decl.get('type',{}).get('qualType')))
        if decl.get('name') in collision:
            # No guessing when Clang gives an unresolved/differently scoped call.
            raise Unsupported('ambiguous C++ overload call: '+str(key))
        return js_ident(decl.get('name')) if decl.get('name') else None
    # A filtered Clang AST still includes declaration *references* to libc
    # functions. Bind only exact canonical C signatures and never replace a
    # candidate original source implementation with a JS intrinsic.
    for root in ast:
        for refnode in descendants(root):
            if kind(refnode)!='DeclRefExpr':continue
            decl=refnode.get('referencedDecl',{})
            scalar=verified_libc_scalar_symbol(decl,all_declarations.get(decl.get('id'),{}),project_symbols)
            if (decl.get('name') in source_owned_names or decl.get('name') in project_symbols) and not scalar:continue
            if decl.get('id') in by_id:continue
            adapter=libc_adapter(decl)
            if adapter and (standard_c_heap_runtime or not adapter.startswith('cCHeap.')):
                if decl.get('id'):by_id[decl['id']]=adapter
                by_signature[(decl['name'],decl.get('type',{}).get('qualType'))]=adapter
    class_dependencies={n.get('name') for n in candidates if kind(n)=='CXXRecordDecl'
        and n.get('name')
        and any(kind(member) in ('CXXConstructorDecl','CXXMethodDecl','CXXConversionDecl')
                and any(kind(body)=='CompoundStmt' for body in kids(member))
                and member.get('explicitlyDefaulted')!='default'
                for member in kids(n))}
    # The emitter and dependency auditor MUST use the same resolved identifiers.
    # A converted function is not publishable if any of its original callees
    # failed semantic lowering or have no uniquely proven owner.
    source=[]
    reserved_bindings=set(symbols.values())|set(project_symbols)
    def storage_metadata(node,name):
        metadata={'name':name,'binding':global_storage_binding(name),'abi':GLOBAL_STORAGE_ABI,'original_type':qual(node)}
        cls=normalized_record_name(qual(node),aliases)
        if cls in addressable_classes and target_type_layout(qual(node),record_layouts,aliases):
            layout=record_layouts.get(cls)
            if layout:metadata['record_layout_sha256']=hashlib.sha256(json.dumps(layout,sort_keys=True).encode()).hexdigest()
        record=global_storage_records.get(cls,{})
        if record.get('byte_schema'):
            metadata['byte_record_schema_sha256']=hashlib.sha256(json.dumps(record['byte_schema'],sort_keys=True).encode()).hexdigest()
        return metadata
    def private_scalar_array(node):
        schema=aggregate_type_schema(qual(node),global_storage_records,aliases,record_layouts,
            allow_pointer_storage=True,enum_types=enum_types)
        # Scalar rows are views into one contiguous original allocation.
        # Record arrays and pointer slots retain their separate layout ABIs.
        return schema if schema and 'array' in schema else None
    def private_byte_record(node):
        schema=aggregate_type_schema(qual(node),global_storage_records,aliases,record_layouts,
            allow_pointer_storage=True,enum_types=enum_types)
        record=(schema or {}).get('byteRecord')
        return record if private_record_schema_compatible(record) else None
    def pointer_array_metadata(node,name):
        typ=qual(node)
        # An extern incomplete array still requires the same pointer-slot ABI;
        # its element type is known even though this TU cannot prove its extent.
        incomplete=bool(re.search(r'\[\s*\]',typ))
        probe=re.sub(r'\[\s*\]','[1]',typ) if incomplete else typ
        schema=aggregate_type_schema(probe,global_storage_records,aliases,record_layouts,
            allow_pointer_storage=True,enum_types=enum_types)
        if schema and 'array' in schema and len(schema.get('dims',[]))>1:
            return {'name':name,'abi':'source-native-array/1','array':schema['array'],
                'dimensions':[None if incomplete and i==0 else n for i,n in enumerate(schema['dims'])],
                'original_type':typ}
        if schema and 'recordArray' in schema:
            return {'name':name,'abi':'source-byte-record-array/1','stride':schema['recordArray']['size'],
                'dimensions':[None if incomplete and i==0 else extent for i,extent in enumerate(schema['dims'])],
                'schema_sha256':hashlib.sha256(json.dumps(schema['recordArray'],sort_keys=True).encode()).hexdigest(),
                'original_type':typ}
        if not schema or 'pointerArray' not in schema:return None
        return {'name':name,'abi':'source-pointer-array/1','stride':8,
            'extent':None if incomplete else schema['pointerArray'],
            'element_declaration':re.sub(r'\[\s*\d*\s*\]','[]',typ),
            'original_type':typ}
    owned_cells={symbols[id(node)]:storage_metadata(node,symbols[id(node)])
                 for node in candidates if id(node) in symbols and kind(node)=='VarDecl'
                 and node.get('storageClass')!='static' and id(node) not in header_global_internal and
                 (mutable_scalar_global(node,aliases,enum_types) or
                  addressable_record_global(node,global_storage_records,aliases,record_layouts,enum_types,addressable_classes))}
    # Internal globals and record/array owners need stable address identity as
    # well, but do not widen the public mutable-scalar import ABI. Their lazy
    # address factories are private to this exact original translation unit.
    private_address_cells={symbols[id(node)]:{'name':symbols[id(node)],
        'binding':private_address_binding(source_rel,symbols[id(node)]),
        'node':node} for node in candidates if id(node) in symbols and kind(node)=='VarDecl'
        and symbols[id(node)] not in owned_cells}
    source_owners={}
    source_signature_candidates={}
    empty_asm_barriers={}
    if source_root:
        for top in ast:
            for node in descendants(top):
                if kind(node)!='GCCAsmStmt':continue
                proof=prove_empty_asm(node,source_root,source_rel,original_header_source_bytes(str(source_root)))
                if proof:empty_asm_barriers[id(node)]=proof
    non_odr_static_values=constant_members(ast,source_root,header_proof,
        lambda typ:resolve_scalar_storage_alias(typ,aliases),is_integer)
    # A static method is owned by its exact Clang record, not by its spelling
    # or return type. The dependency auditor must require that same class.
    static_method_owners={}
    for record in all_declarations.values():
        if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition'):continue
        owner=record.get('name')
        if not owner:continue
        for member in kids(record):
            if kind(member)=='CXXMethodDecl' and member.get('storageClass')=='static' and member.get('id'):
                static_method_owners[member['id']]=(js_ident(owner),member_method_symbols.get((owner,member['name'],qual(member)),js_ident(member['name'])))
    # Definitions outside the class can refer back to the class declaration.
    for declaration in all_declarations.values():
        previous=declaration.get('previousDecl')
        if kind(declaration)=='CXXMethodDecl' and previous in static_method_owners:
            static_method_owners[declaration['id']]=static_method_owners[previous]
    static_method_owners.update(external_static_members)
    reference_records={node.get('name'):node for node in all_declarations.values()
                       if kind(node)=='CXXRecordDecl' and node.get('completeDefinition')}
    heap_operators=standard_allocation_operators(ast,source_root) if standard_heap_runtime else {}
    for node in candidates:
        if id(node) not in symbols or kind(node)!='VarDecl':continue
        source_signature_candidates.setdefault((node.get('name'),qual(node)),set()).add(symbols[id(node)])
        identity=node.get('id');seen_declarations=set()
        while identity and identity not in seen_declarations:
            seen_declarations.add(identity);source_owners[identity]=symbols[id(node)]
            identity=all_declarations.get(identity,{}).get('previousDecl')
    source_signature_owners={key:next(iter(owners)) for key,owners in source_signature_candidates.items()
                             if len(owners)==1 and key[0] not in collision}
    for n in candidates:
        name=n.get('name') or '<anonymous>'
        symbol=symbols.get(id(n))
        row={'name':symbol or name,'source_name':n.get('_source_record_name',name),'kind':kind(n),
             'line':n.get('loc',{}).get('line'),'original_type':qual(n)}
        if kind(n)=='FunctionDecl' and any(kind(arg)=='TemplateArgument' for arg in kids(n)):
            row['clang_template_mangled_name']=n.get('mangledName')
        if n.get('_source_static_member'):
            row['source_name']=n['_source_static_member']['name']
            row['original_static_member']=n['_source_static_member']
        # C/C++ `static` at translation-unit scope has INTERNAL linkage.
        # ES modules may both contain an `fx` or `ErrorCode` without those
        # private declarations competing for a global provider.  Preserve
        # this Clang fact in the manifest even if semantic lowering blocks.
        # Header `static inline` closures have the same TU-local identity.
        row['linkage']=('internal' if n.get('storageClass')=='static'
                        or id(n) in header_helper_ids or id(n) in header_global_internal else 'external')
        source_path=n.get('loc',{}).get('file')
        if n.get('_source_byte_method'):
            row['original_byte_method']=n['_source_byte_method']
            source_path=n['_source_byte_method']['source_header']
            row['line']=n['_source_byte_method']['source_line']
        if id(n) in allocator_proofs:
            proof=allocator_proofs[id(n)]
            row['original_allocator_definition']=proof
            row['line']=proof['source_line'];source_path=proof['source_header']
        if id(n) in header_global_proofs:
            proof=header_global_proofs[id(n)]
            row['header_global_definition']=proof
            row['line']=proof['source_line']
            source_path=proof['source_header']
        # Clang may also expose a friend as a separate namespace FunctionDecl
        # root. It has the same physical definition but a different AST node
        # identity from the nested FriendDecl. Match its exact source offset,
        # name and qualified signature before recording ODR provenance.
        origin=friend_locations.get(id(n))
        if origin is None and kind(n)=='FunctionDecl':
            possible=friend_origins.get((name,qual(n)),set())
            matches=[item for item in possible if item[2]==n.get('loc',{}).get('offset')]
            if len(matches)==1:origin=matches[0]
        if id(n) in header_odr:
            header=header_odr[id(n)]
            offset=n.get('loc',{}).get('offset',n.get('loc',{}).get('expansionLoc',{}).get('offset'))
            if offset is not None:
                row['odr_inline']={'source_header':header,'source_offset':offset,
                                   'enclosing_record':'(free inline function)',
                                   'type':qual(n),'semantic_sha256':odr_body_digest(n)}
                source_path=header
        if origin:
            enclosing,header,offset=origin
            if (header and header!=source_rel and offset is not None
                    and Path(header).suffix in ('.h','.hpp','.hh','.hxx')):
                row['odr_inline']={'source_header':header,'source_offset':offset,
                                   'enclosing_record':enclosing,'type':qual(n),
                                   'semantic_sha256':odr_body_digest(n)}
                source_path=header
        if name in header_record_proofs:
            row['odr_inline']=header_record_proofs[name]
            row['header_record_factory']=True
            row['physical_source']=header_record_proofs[name]['source_header']
        if n.get('_source_toolchain_header'):
            row['toolchain_header_definition']=n['_source_toolchain_header']
            source_path=n['_source_toolchain_header']['source_header']
        if n.get('_source_byte_constructor'):
            row['original_byte_constructor']=n['_source_byte_constructor']
            row['physical_source']=n['_source_byte_constructor']['source_header']
        if n.get('_source_macro_header'):
            row['macro_header_definition']=n['_source_macro_header']
            row['line']=n['_source_macro_header']['source_line']
            source_path=n['_source_macro_header']['source_header']
        if source_path and name not in header_record_proofs:row['physical_source']=source_path
        if id(n) in header_definition_proofs:
            row['header_definition_owner']=header_definition_proofs[id(n)]
            row['physical_source']=header_definition_proofs[id(n)]['file']
        # Retain actual Clang source-level references EVEN when lowering fails.
        # This is diagnostic evidence for bootstrap/link planning, not a claim
        # that a blocked definition has linked imports or executable JS.
        try:
            row['source_references']=sorted(reference_names(n,resolve,class_dependencies,trivial_assignments,aliases,allocation_dependencies=not standard_heap_runtime,static_method_owners=static_method_owners,non_odr_static_values=non_odr_static_values))
        except Unsupported as exc:
            row['source_reference_error']=str(exc)
        if symbol is None:
            row.update(status='blocked',reason='ambiguous/overloaded source definitions require type-qualified JS identifiers')
            source.append((n,None,row));continue
        em=Emit();em.lifetime_classes=lifetime_classes;em.header_record_factories=header_record_factories;em.header_trivial_assignments=header_trivial_assignments;em.allowed_static_prototypes=set(previous_class_prototypes)|header_record_factories;em.trivial_assignment_methods=trivial_assignments;em.implicit_byte_assignable=implicit_byte_assignable;em.enum_values=enum_values;em.record_layouts=record_layouts
        em.all_declarations=all_declarations
        em.constant_query_functions=constant_query_functions
        em.byte_this_parameter=n.get('_source_this_parameter')
        em.source_class_providers=source_class_providers
        em.managed_record_names=managed_record_names
        em.record_storage_views=record_storage_views
        em.native_byte_classes=native_byte_classes
        em.member_method_symbols=member_method_symbols;em.overloaded_member_names=overloaded_member_names
        em.non_odr_static_values=non_odr_static_values
        em.empty_asm_barriers=empty_asm_barriers
        barriers=[empty_asm_barriers[id(part)] for part in descendants(n) if id(part) in empty_asm_barriers]
        if barriers:row['original_empty_asm_barriers']=barriers
        em.static_method_owners=static_method_owners
        if kind(n)=='CXXRecordDecl' and n.get('name'):previous_class_prototypes.add(n['name'])
        em.type_aliases={**aliases,**n.get('_source_method_type_aliases',{})};em.global_storage_records=global_storage_records;em.function_symbols=by_id;em.signature_symbols=by_signature
        em.standard_heap_operators=heap_operators;em.heap_classes=set(addressable_classes)|set(lifetime_classes)
        em.verified_scoped_trivial_records=verified_scoped_trivial_records
        em.ambiguous_source_names=collision;em.trivial_destructors=trivial_destructors;em.aggregate_records=aggregate_records;em.pointer_span_records=pointer_span_records;em.enum_types=enum_types;em.member_operators=member_operators;em.member_conversions=member_conversions;em.member_conversion_names=member_conversion_names;em.copy_classes=copy_classes;em.constructor_factories=constructor_factories
        # Keep dependency identities as original declarations while lowering
        # external lvalues through an explicitly owned storage binding. Local
        # variables with the same spelling are excluded by Clang identity.
        local_ids={v.get('id') for v in descendants(n) if v is not n and kind(v) in ('VarDecl','ParmVarDecl')}
        em.lexical_local_ids=local_ids
        em.external_global_cells={};em.external_aggregate_globals=set();em.used_global_cells=set()
        external_pointer_arrays={}
        em.global_address_cells={}
        em.static_source_owners=source_owners
        em.static_source_signature_owners=source_signature_owners
        em.project_source_symbols=set(project_symbols)
        em.global_binding_collisions=reserved_bindings
        em.expression_bindings=reserved_bindings|{js_ident(v['name']) for v in descendants(n) if v.get('name')}
        try:
            # Reference validation and emission are one safety gate.  A failed
            # Clang declaration-identity audit must never be silently cleared
            # by successful syntax lowering (e.g. Loguru::log linked to
            # libc math log simply because both spell their name `log`).
            if row.get('source_reference_error'):
                raise Unsupported('unresolved declaration identity: '+row['source_reference_error'])
            if id(n) in header_global_proofs and header_global_proofs[id(n)].get('unsupported_semantics'):
                raise Unsupported(header_global_proofs[id(n)]['unsupported_semantics'])
            for refnode in descendants(n):
                if kind(refnode)!='DeclRefExpr':continue
                decl=refnode.get('referencedDecl',{});refid=decl.get('id')
                # A local may share the spelling of an ambiguous project
                # declaration. Resolve ownership only after excluding its
                # lexical Clang identity, never from its name alone.
                if decl.get('kind')!='VarDecl' or not refid or refid in local_ids:continue
                refname=resolve(decl)
                if refname in owned_cells:
                    em.global_address_cells[refid]=owned_cells[refname]
                elif refid in source_owners and source_owners[refid] in private_address_cells:
                    em.global_address_cells[refid]=private_address_cells[source_owners[refid]]
                elif (decl.get('name'),qual(decl)) in source_signature_owners:
                    owner=source_signature_owners[(decl.get('name'),qual(decl))]
                    if owner in private_address_cells:em.global_address_cells[refid]=private_address_cells[owner]
                if refid in by_id or refname not in project_symbols:continue
                private=(private_source_storage or {}).get(refname)
                if private and project_symbols[refname]==source_rel:
                    scalar=mutable_scalar_global(decl,aliases,enum_types)
                    array=private_scalar_array(decl) if not scalar else None
                    record=private_byte_record(decl) if not scalar and not array else None
                    if private.get('byte_record') and not record:
                        raise Unsupported('sizeof/alignof record layout: '+qual(decl))
                    if (private.get('abi')!=PRIVATE_STORAGE_ABI or private.get('owner_source')!=source_rel or
                            private.get('binding')!=private_storage_binding(source_rel,refname) or
                            private.get('original_type')!=qual(decl) or (not scalar and not array and not record) or
                            private.get('scalar_array')!=array or private.get('byte_record')!=record):
                        raise Unsupported('private fragment storage requires identical original owner and storage type: '+refname)
                    em.external_global_cells[refid]={**private,'name':refname,'consumer_source':source_rel}
                    em.global_address_cells[refid]=em.external_global_cells[refid]
                    if array or record:em.external_aggregate_globals.add(refid)
                    continue
                array_metadata=pointer_array_metadata(decl,refname)
                existing=(existing_source_storage or {}).get(refname,{})
                if existing.get('linkage')=='internal' and '[' in qual(decl) and not array_metadata:
                    element=re.sub(r'(?:\s*\[\s*\d*\s*\])+\s*$','',qual(decl)).strip()
                    if existing.get('object_storage',{}).get('abi')=='source-byte-record-array/1':
                        raise Unsupported('sizeof/alignof record layout: '+element)
                    raise Unsupported('private array storage requires verified owner ABI: '+refname)
                if array_metadata:external_pointer_arrays[refname]={**array_metadata,'consumer_source':source_rel}
                record_address=addressable_record_global(decl,global_storage_records,aliases,record_layouts,enum_types,addressable_classes)
                if mutable_scalar_global(decl,aliases,enum_types) or record_address:
                    em.external_global_cells[refid]=storage_metadata(decl,refname)
                    em.global_address_cells[refid]=em.external_global_cells[refid]
                    if record_address:em.external_aggregate_globals.add(refid)
                elif not immutable_global(decl) and '[' not in qual(decl):
                    em.external_aggregate_globals.add(refid)
            if (kind(n)=='VarDecl' and normalized_record_name(qual(n),aliases) in addressable_classes
                    and target_type_layout(qual(n),record_layouts,aliases) is None):
                raise Unsupported('C++ global class address requires exact Clang layout: '+qual(n))
            code=(em.function(n,symbol=symbol) if kind(n)=='FunctionDecl' else
                  em.constant(n,symbol=symbol) if kind(n)=='VarDecl' else em.record(n))
            if getattr(em,'used_static_constants',None):row['non_odr_static_constants']=sorted(em.used_static_constants.values(),key=lambda x:(x['source_header'],x['member_offset'] or 0,x['name']))
            if kind(n)=='CXXRecordDecl' and name in header_record_proofs:
                original='export class '+js_ident(name)+' {'
                assert original in code
                # The class expression MUST NOT inherit the same lexical name
                # as its enclosing factory. Otherwise method bodies that call
                # the factory to construct another proven aggregate resolve
                # to the class constructor and throw "cannot be invoked without
                # new" at runtime (original vec2<T> operator + / - / *).
                implementation=js_ident(name)+'__implementation'
                definition=code.replace(original,'class '+implementation+' {',1)
                # Preserve source class static-member bindings: those refer to
                # the actual generated class, not its memoizing factory.
                definition=definition.replace(js_ident(name)+'.',implementation+'.')
                code='export function '+js_ident(name)+'() {\n  return '+js_ident(name)+'.type || ('+js_ident(name)+'.type = '+definition+');\n}'
            if getattr(em,'storage_constructor_nodes',None):
                # Remove only the precise constructor AST nodes already lowered
                # to verified storage. A same-named variable, function, operator,
                # static member or another constructor is still a dependency.
                row['source_references']=sorted(reference_names(n,resolve,class_dependencies,
                    trivial_assignments,aliases,allocation_dependencies=not standard_heap_runtime,
                    static_method_owners=static_method_owners,
                    storage_constructor_nodes=em.storage_constructor_nodes,non_odr_static_values=non_odr_static_values))
                row['storage_constructor_count']=len(em.storage_constructor_nodes)
            resolved_references=set(row.get('source_references',[]))|getattr(em,'used_aggregate_prototypes',set())
            # A filtered C++ class definition is emitted as its bare ES class
            # identifier; the same Clang AST references it by its qualified
            # C++ type. Reconnect only uniquely proved scoped PODs, never
            # arbitrary names or nontrivial class method dependencies.
            # Trivial aggregate construction/copy is fully represented by
            # verified scalar fields. It does not call an ES class constructor:
            # the C++ record type is compile-time ABI evidence, not a runtime
            # imported value. Retain references for records with actual
            # user-defined methods/prototypes or without complete POD proof.
            resolved_references={ref.rsplit('::',1)[-1]
                if ref in scoped_record_types and ref.rsplit('::',1)[-1] in verified_scoped_trivial_records
                else ref for ref in resolved_references}
            local_value_ids={part.get('id') for part in descendants(n) if part is not n
                and kind(part) in ('VarDecl','ParmVarDecl')}
            value_dependencies={resolve(part['referencedDecl']) for part in descendants(n)
                if kind(part)=='DeclRefExpr' and part.get('referencedDecl',{}).get('kind') in ('FunctionDecl','VarDecl')
                and part['referencedDecl'].get('id') not in local_value_ids}
            resolved_references={ref for ref in resolved_references
                if not (ref in verified_scoped_trivial_records
                    and ref in aggregate_records
                    and not aggregate_records[ref].get('prototype')
                    and ref not in getattr(em,'used_aggregate_prototypes',set())
                    and ref not in value_dependencies)}
            # A canonical C declaration may resolve to a width-checked JS
            # builtin. Its helper is emitted in this very module, so it is
            # not an external source dependency. Only helpers actually used
            # by this definition can leave the dependency frontier.
            resolved_references-=set(BUILTIN_HELPERS)&em.used
            resolved_references-=getattr(em,'used_runtime_queries',set())
            row['source_references']=sorted(resolved_references)
            row['source_references']=sorted(set(row['source_references'])|getattr(em,'used_class_constructors',set())|getattr(em,'used_reference_classes',set())|getattr(em,'used_static_method_owners',set())|getattr(em,'used_byte_methods',set()))
            for ref in row['source_references']:
                record=reference_records.get(ref)
                if record and any(em.reference_contract(qual(child)) for child in kids(record)
                        if kind(child) in ('CXXConstructorDecl','CXXMethodDecl','CXXConversionDecl')):
                    em.used_reference_classes=getattr(em,'used_reference_classes',set())|{ref}
            if kind(n)=='FunctionDecl' and em.reference_contract(qual(n)):
                row['cpp_reference_contract']=em.reference_contract(qual(n))
            if kind(n)=='CXXRecordDecl':
                row['cpp_reference_abi']=REFERENCE_ABI
                row['cpp_reference_required']=any(em.reference_contract(qual(child))
                    for child in kids(n) if kind(child) in ('CXXConstructorDecl','CXXMethodDecl','CXXConversionDecl'))
            contracts=dict(getattr(em,'used_reference_contracts',{}))
            for refnode in descendants(n):
                declaration=refnode.get('referencedDecl',{})
                if declaration.get('kind')!='FunctionDecl':continue
                target=(em.function_symbols.get(declaration.get('id')) or
                        em.signature_symbols.get((declaration.get('name'),qual(declaration))) or declaration.get('name'))
                contract=em.reference_contract(qual(declaration))
                if target in project_symbols and contract:contracts[target]=contract
            row['external_reference_imports']=[{'name':target,'reference_contract':contract}
                for target,contract in sorted(contracts.items())
                if target in project_symbols]
            row['external_reference_imports'].extend({'name':target,'reference_class_abi':REFERENCE_ABI}
                for target in sorted(getattr(em,'used_reference_classes',set())) if target in project_symbols)
            if kind(n)=='VarDecl':
                array_metadata=pointer_array_metadata(n,symbol)
                if array_metadata:row['object_storage']=array_metadata
            if getattr(em,'used_class_constructors',None):
                row['emitted_constructor_providers']=sorted(em.used_class_constructors)
            if kind(n)=='VarDecl' and row['linkage']=='external' and symbol in owned_cells:
                binding=global_storage_binding(symbol)
                if binding in reserved_bindings:
                    raise Unsupported('global storage binding collides with original symbol: '+symbol)
                row['global_storage']={key:value for key,value in owned_cells[symbol].items() if key!='name'}
                # Original value exports remain live and readable. Only the
                # owner performs assignment, so ESM's import immutability is
                # respected even by address-of closures in another module.
                # A hoisted factory permits a cross-unit static address
                # initializer to take &global before its owner's module body
                # has evaluated. Lazy reference identity is shared by all TUs.
                assigned=em.expression_temp()
                write=(symbol+' = '+js_cast(assigned,qual(n))+';' if mutable_scalar_global(n,aliases,enum_types)
                    else 'throw new TypeError("record address cannot replace original object storage");')
                code+='\nexport function '+binding+'() {\n  return '+binding+'.reference || ('+binding+'.reference = {\n    __cReference: true,\n    get value() { return '+symbol+'; },\n    set value('+assigned+') { '+write+' }\n  });\n}'
            if kind(n)=='VarDecl' and symbol in private_address_cells:
                binding=private_address_cells[symbol]['binding']
                if binding in reserved_bindings:raise Unsupported('static address binding collides with original source: '+symbol)
                assigned=em.expression_temp()
                write=(symbol+' = '+js_cast(assigned,qual(n))+';' if mutable_scalar_global(n,aliases,enum_types)
                       else 'throw new TypeError("static aggregate/const address assignment needs proven copy semantics");')
                # Fragments of this SAME source unit share the original private
                # address factory. Other translation units cannot import it as
                # a public global; the linker checks the owner/consumer pair.
                array=private_scalar_array(n)
                record=private_byte_record(n) if not array else None
                share_private=row['linkage']=='internal' and (mutable_scalar_global(n,aliases,enum_types) or array or record)
                if share_private:
                    row['private_storage']={'abi':PRIVATE_STORAGE_ABI,'binding':private_storage_binding(source_rel,symbol),
                        'owner_source':source_rel,'original_type':qual(n)}
                    if array:row['private_storage']['scalar_array']=array
                    if record:row['private_storage']['byte_record']=record
                code+='\nfunction '+binding+'() {\n  return '+binding+'.reference || ('+binding+'.reference = {\n    __cReference: true,\n    get value() { return '+symbol+'; },\n    set value('+assigned+') { '+write+' }\n  });\n}'
                if share_private:
                    code+='\nexport function '+row['private_storage']['binding']+'() { return '+binding+'(); }'
            cells={item['name']:item for item in em.external_global_cells.values()}
            row['external_storage_imports']=[cells[name] for name in sorted(em.used_global_cells)]
            row['external_storage_imports'].extend(external_pointer_arrays[name]
                for name in sorted(external_pointer_arrays) if name in resolved_references)
            # C++ records still require their own class-ABI naming model.
            if kind(n)=='CXXRecordDecl' and symbol!=js_ident(name):
                raise Unsupported('nonfunction symbol collision: '+name)
            location=n.get('loc',{})
            if location.get('line'):
                code=f'// C/C++ source: {row.get("physical_source",source_rel)}:{location["line"]}\n'+code
            row['status']='source-first'
            if em.last_flow_report:row['control_flow']=em.last_flow_report
            source.append((n,code,row))
        except Unsupported as e:
            if e.required_records:row['required_record_types']=sorted(set(e.required_records))
            if kind(n)=='CXXRecordDecl' and n.get('_source_record_qualified_name') and any(
                    kind(member)=='CXXDestructorDecl' and not member.get('isImplicit') and
                    not any(kind(body)=='CompoundStmt' for body in kids(member)) for member in kids(n)):
                row['required_original_destructor']=n['_source_record_qualified_name']
            row.update(status='blocked',reason=str(e));source.append((n,None,row))
    available={row['name'] for _,_,row in source if row['status']=='source-first'}
    while True:
        changed=False
        for n,code,row in source:
            if row['status']!='source-first':continue
            try:refs=set(row['source_references']) if 'source_references' in row else reference_names(n,resolve,class_dependencies,trivial_assignments,aliases,allocation_dependencies=not standard_heap_runtime,static_method_owners=static_method_owners,non_odr_static_values=non_odr_static_values)
            except Unsupported as exc:
                row.update(status='blocked',reason=str(exc));available.discard(row['name']);changed=True;continue
            missing=sorted(x for x in refs if x!=row['name'] and x not in available and x not in project_symbols)
            if missing:
                row.update(status='blocked',reason='unlinked identifiers: '+', '.join(missing[:12]))
                row['unresolved_references']=missing;available.discard(row['name']);changed=True
            else:
                row['external_imports']=sorted(x for x in refs if x in project_symbols and x not in available)
                row['unresolved_references']=[]
        if not changed:break
    # Original C++ class declarations do not run constructors themselves.
    # Their class bindings must exist before global dynamic initialization,
    # including the case where Clang's AST dump order lists source globals
    # before a class recovered from an included header. Move ONLY records
    # whose complete source-reference list is empty; a class static initializer
    # that depends on an unproven value stays in source order, fail closed.
    static_declaration_kinds={row['name']:kind(node) for node,_,row in source
        if row.get('status')=='source-first'}
    early_classes=[item for item in source
        if kind(item[0])=='CXXRecordDecl' and item[2].get('status')=='source-first'
        and not item[2].get('external_imports')
        and all(ref==item[2]['name'] or static_declaration_kinds.get(ref)=='FunctionDecl'
                for ref in item[2].get('source_references',[]))]
    if early_classes:
        class_ids={id(item) for item in early_classes}
        source=early_classes+[item for item in source if id(item) not in class_ids]
    # C++ constant-initialization occurs before dynamic initialization, even
    # when an original TU's header definition was discovered after a global
    # array that references it. ESM `const` instead observes textual TDZ.
    # Only hoist Clang-proven, dependency-free, immutable header scalars;
    # NEVER move dynamic initializers, record construction or mutable storage.
    def is_early_constant(item):
        node,code,row=item
        if row.get('status')!='source-first' or not row.get('header_global_definition'):
            return False
        if kind(node)!='VarDecl' or not immutable_global(node):return False
        if row.get('source_references') or row.get('external_imports'):return False
        if not code or not re.search(r'\bexport const '+re.escape(row['name'])+r'\s*=',code):
            return False
        # A Clang scalar initializer with no declaration references must be
        # constant-evaluable; exclude call expressions, constructors, and
        # anything capable of performing dynamic initialization.
        allowed={'IntegerLiteral','FloatingLiteral','CharacterLiteral',
                 'UnaryOperator','BinaryOperator','ParenExpr','ImplicitCastExpr',
                 'CStyleCastExpr','ConstantExpr','ExprWithCleanups',
                 'CXXStaticCastExpr','UnaryExprOrTypeTraitExpr','GNUNullExpr',
                 'CXXBoolLiteralExpr','ImplicitValueInitExpr','MaterializeTemporaryExpr'}
        return all(kind(v) in allowed for v in descendants(node) if v is not node)
    early=[item for item in source if is_early_constant(item)]
    if early:
        early_ids={id(item) for item in early}
        source=early+[item for item in source if id(item) not in early_ids]
    units=[code for _,code,row in source if row['status']=='source-first']
    manifest=[row for _,_,row in source]
    return units,manifest

def compile_source(source,source_rel,clang_args,filter_name=None):
    cmd=['clang++' if source.suffix.lower() in ('.cpp','.cc','.cxx') else 'clang','-Xclang','-ast-dump=json']
    if filter_name:cmd+=['-Xclang','-ast-dump-filter='+filter_name]
    cmd+=['-fsyntax-only']+clang_args+[source_rel]
    p=subprocess.run(cmd,cwd=source.parent.parent.parent.parent if False else Path.cwd(),capture_output=True,text=True)
    if p.returncode:raise RuntimeError('Clang AST frontend failed: '+' '.join(cmd)+'\n'+p.stderr[-4000:])
    return parse_json_stream(p.stdout)

def compiler_runtime_revision():
    digest=hashlib.sha256()
    paths=[path for path in (HERE/'tools').glob('source_*') if path.suffix in ('.py','.mjs')]
    paths.extend((HERE/'runtime').rglob('*.mjs'))
    for path in sorted(paths):
        digest.update(path.relative_to(HERE).as_posix().encode()+b'\0')
        digest.update(hashlib.sha256(path.read_bytes()).digest())
    return digest.hexdigest()


def main():
    compiler_revision=compiler_runtime_revision()
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,required=True,help='unpacked EDuke32 source root')
    parser.add_argument('--source',required=True,help='original translation-unit relative path')
    parser.add_argument('--compile-commands',type=Path,default=HERE/'factory-output/compile_commands.json')
    parser.add_argument('--out-dir',type=Path,default=HERE/'factory-output/source-first')
    parser.add_argument('--filter',default=None,help='Clang declaration-name filter for huge TUs')
    parser.add_argument('--require-record-layouts',action='store_true',
                        help='Require complete target Clang record layouts before emitting a storage owner')
    parser.add_argument('--extra',nargs='*',default=[])
    parser.add_argument('--project-symbols',type=Path,help='verified symbol-to-source index for exact ES imports')
    parser.add_argument('--import-root',type=Path,help='verified existing provider root for a separate source-module fragment')
    parser.add_argument('--rebuild-owner-sha256',help='Exact existing owner hash; rebuild all original storage for a fresh runtime instead of importing it')
    parser.add_argument('--ast-cache-dir',type=Path,help='ephemeral shared Clang AST cache for repeated project link passes')
    parser.add_argument('--header-inlines',action='store_true',help='lower selected static inline header definitions as source JS')
    parser.add_argument('--exact-filter',action='store_true',help='select exact initial declaration names; dependency closure still follows original references')
    parser.add_argument('--header-dependency-closure',action='store_true',
                        help='recover only Clang-resolved, source-defined original header inline dependencies')
    parser.add_argument('--dependency-closure',action='store_true',help='extend a filtered Clang AST with proven source declaration dependencies')
    parser.add_argument('--dependency-query-limit',type=int,default=256,
                        help='maximum memoized original declaration queries per source unit; exhaustion remains an explicit blocker')
    parser.add_argument('--enum-closure',action='store_true',help='query Clang-verifiable enum constants omitted by a filtered AST')
    opt=parser.parse_args();root=opt.root.resolve();src=root/opt.source
    if opt.dependency_query_limit<1:parser.error('--dependency-query-limit must be positive')
    if opt.import_root and opt.import_root.resolve()==opt.out_dir.resolve():
        parser.error('a module fragment must have a distinct existing import root')
    if not src.is_file():parser.error('missing source '+str(src))
    commands=json.loads(opt.compile_commands.read_text()) if opt.compile_commands.exists() else []
    comp=next((v for v in commands if v['file']==opt.source),None)
    private_source_storage={};existing_source_storage={};existing_header_values={};owner_input_fingerprint=None
    if opt.rebuild_owner_sha256 and not opt.import_root:
        parser.error('--rebuild-owner-sha256 requires an existing import root')
    if opt.import_root:
        owner_manifest=opt.import_root/(opt.source+'.manifest.json')
        if opt.rebuild_owner_sha256:
            owner_module=opt.import_root/(opt.source+'.mjs')
            if (not re.fullmatch(r'[a-f0-9]{64}',opt.rebuild_owner_sha256) or not owner_module.is_file() or
                    hashlib.sha256(owner_module.read_bytes()).hexdigest()!=opt.rebuild_owner_sha256):
                parser.error('Existing owner does not match --rebuild-owner-sha256')
        if owner_manifest.is_file():
            owner=json.loads(owner_manifest.read_text())
            if owner.get('source')==opt.source:
                owner_input_fingerprint=owner.get('ast_cache_inputs')
                for definition in owner.get('definitions',[]):
                    if (not opt.rebuild_owner_sha256 and definition.get('status')=='source-first' and definition.get('kind')=='VarDecl'
                            and (definition.get('physical_source',opt.source)==opt.source or
                                 definition.get('private_storage') or definition.get('global_storage'))):
                        existing_source_storage[definition['name']]=definition
                    if (not opt.rebuild_owner_sha256 and definition.get('status')=='source-first'
                            and definition.get('kind')=='VarDecl' and definition.get('header_global_definition')):
                        existing_header_values[definition['name']]=definition
                    if (not opt.rebuild_owner_sha256 and definition.get('status')=='source-first' and definition.get('linkage')=='internal'
                            and definition.get('private_storage')):
                        private_source_storage[definition['name']]=definition['private_storage']
    # A captured multi-unit program can replace global new/delete in another
    # unit (EDuke32 actually does). Never silently substitute the standalone
    # standard heap for those original source-owned allocator operators.
    standard_heap_contract=validate_standard_heap_contract(root,opt.compile_commands) if comp is not None else None
    header_definition_owners,header_definition_contract=load_header_definitions(root,opt.compile_commands,standard_heap_contract) if comp is not None else ({},None)
    c_allocator_declarations={'queried':[],'proven':[],'rejected':{}}
    c_allocator_query_cache={}
    cpp_allocator_queries=set()
    c_storage_scopes=None
    c_storage_scope_report={'attempted':False,'proven_file_scope':0,'local_or_ambiguous_roots_rejected':0}
    static_reference_context=[]
    field_selection_index={}
    full_enum_values={}
    standard_c_heap_runtime=bool(standard_heap_contract and standard_heap_contract.get('original_c_allocators_absent')) or comp is None
    def allocator_query(name,timeout=45):
        command=[frontend,*language,'-Xclang','-ast-dump=json','-Xclang','-ast-dump-filter='+name,'-fsyntax-only',*args,opt.source]
        cache=None
        if opt.ast_cache_dir:
            identity=json.dumps([str(root),command,toolchain,ast_cache_inputs],sort_keys=True)
            cache=opt.ast_cache_dir/(hashlib.sha256(identity.encode()).hexdigest()+'.json')
        declarations,decode=run_clang_ast(command,cwd=root,cache_path=cache,timeout=timeout)
        ast_decode.append(decode);return declarations
    def produce_current(*args,**kwargs):
        nonlocal c_storage_scopes
        detached=[node for node in args[0] if kind(node)=='VarDecl' and node.get('storageClass')=='static']
        if opt.filter and not compile_as_cpp and detached:
            if c_storage_scopes is None:
                command=[frontend,*language,'-Xclang','-ast-dump=json','-fsyntax-only',*compiler_arguments,opt.source]
                cache=None
                if opt.ast_cache_dir:
                    digest=hashlib.sha256(json.dumps([str(root),command,toolchain,ast_cache_inputs],sort_keys=True).encode()).hexdigest()
                    cache=opt.ast_cache_dir/('c-storage-scopes-'+digest+'.json')
                complete,decoded=run_clang_ast(command,cwd=root,cache_path=cache,timeout=90)
                ast_decode.append(decoded);c_storage_scopes=lexical_storage_scopes(complete)
                c_storage_scope_report['attempted']=True
            for node in detached:
                node['_source_file_scope']=c_storage_scopes.get(storage_scope_key(node))=={True}
            c_storage_scope_report['proven_file_scope']=sum(node['_source_file_scope'] for node in detached)
            c_storage_scope_report['local_or_ambiguous_roots_rejected']=sum(not node['_source_file_scope'] for node in detached)
        # Dependency closure can discover new/delete well after the initially
        # selected roots. Resolve their actual declarations too; otherwise a
        # transitive allocation is stranded despite a proved standard heap.
        if opt.filter:
            needed={decl['name'] for tree in args[0] for node in descendants(tree)
                for decl in (node.get('operatorNewDecl'),node.get('operatorDeleteDecl'))
                if decl and decl.get('kind')=='FunctionDecl'}
            for name in sorted(needed-cpp_allocator_queries):
                declarations=allocator_query(name)
                args[0].extend(declarations)
                cpp_allocator_queries.add(name)
        if full_enum_values:
            for tree in args[0]:
                for reference in descendants(tree):
                    declaration=reference.get('referencedDecl',{})
                    name=declaration.get('name')
                    if kind(reference)=='DeclRefExpr' and declaration.get('kind')=='EnumConstantDecl' and name in full_enum_values:
                        value=full_enum_values[name]
                        if name in enum_closure['proven_values'] and enum_closure['proven_values'][name]!=value:
                            raise ValueError('Complete same-TU enum conflicts with a queried constant: '+name)
                        enum_closure['proven_values'][name]=value
                        enum_closure['rejected'].pop(name,None)
            kwargs['enum_constants']={**kwargs.get('enum_constants',{}),**enum_closure['proven_values']}
        if static_reference_context:
            rebind_static_references(args[0],static_reference_context)
            rebind_explicit_operators(args[0],static_reference_context)
            rebind_c_function_references(args[0],static_reference_context)
        if field_selection_index:
            count=rebind_source_fields(args[0],field_selection_index)
            full_type_closure['field_references_rebound']=full_type_closure.get('field_references_rebound',0)+count
        if standard_c_heap_runtime:
            complete_c_allocator_declarations(args[0],allocator_query,verified_libc_byte_symbol,
                c_allocator_query_cache,c_allocator_declarations)
        return produce(*args,**kwargs,standard_heap_runtime=bool(standard_heap_contract) or (comp is None and opt.project_symbols is None),
                       standard_c_heap_runtime=standard_c_heap_runtime,
                       private_source_storage=private_source_storage,header_definition_owners=header_definition_owners,existing_source_storage=existing_source_storage)
    args=[]
    # Preserve the original compilation *language*, not the filename suffix.
    # EDuke32 builds several .c units with g++ and -std=gnu++14.
    compiler_name=Path(comp['arguments'][0]).name if comp else ''
    compile_as_cpp=(('++' in compiler_name) if comp else src.suffix!='.c')
    frontend,target_args=frontend_config(compile_as_cpp)
    toolchain=target_attestation(compile_as_cpp)
    language=['-x','c++' if compile_as_cpp else 'c']
    if comp:
        raw=comp['arguments'][1:];i=0
        while i<len(raw):
            a=raw[i]
            if a in ('-c','-MMD','-MP','-M','-MM','-o','-MF','-MT','-MQ'):
                i+=2 if a in ('-o','-MF','-MT','-MQ') else 1;continue
            if a==opt.source or a.startswith(('-O','-flto','-march','-mfpmath','-funswitch','-fomit','-fjump')):i+=1;continue
            args.append(a);i+=1
    else:args=['-std=gnu++14' if compile_as_cpp else '-std=gnu11','-funsigned-char']
    args+=['-Iplatform/Windows/include','-Iplatform/Windows/include/SDL2','-Wno-unknown-warning-option']
    args+=opt.extra
    args+=target_args
    compiler_arguments=tuple(args)
    ast_cache_inputs=(source_ast_input_fingerprint(root,frontend,language,args,opt.source)
                      if opt.ast_cache_dir else None)
    if (ast_cache_inputs and ast_cache_inputs.get('preprocessor_verified') is True
            and owner_input_fingerprint==ast_cache_inputs):
        existing_source_storage.update(existing_header_values)
    cmd=[frontend,*language,'-Xclang','-ast-dump=json']
    if opt.filter:cmd+=['-Xclang','-ast-dump-filter='+opt.filter]
    cmd+=['-fsyntax-only',*args,opt.source]
    ast=[];ast_decode=[]
    filter_names=opt.filter.split(',') if opt.filter else [None]
    for filter_name in filter_names:
        one=[frontend,*language,'-Xclang','-ast-dump=json']
        if filter_name:one+=['-Xclang','-ast-dump-filter='+filter_name]
        one+=['-fsyntax-only',*args,opt.source]
        # Clang source AST is identical on the project discovery/link passes.
        # Persistent reuse requires the current preprocessor dependency graph,
        # exact input bytes, toolchain and options, independent of emitter edits.
        cache_path=None
        if opt.ast_cache_dir:
            opt.ast_cache_dir.mkdir(parents=True,exist_ok=True)
            cache_key=hashlib.sha256(json.dumps([str(root),one,toolchain,
                ast_cache_inputs],separators=(',',':'),sort_keys=True).encode()).hexdigest()
            cache_path=opt.ast_cache_dir/(cache_key+'.json')
        try:
            decoded,decode_report=run_clang_ast(one,cwd=root,cache_path=cache_path)
            ast.extend(decoded);ast_decode.append(decode_report)
        except Exception as e:raise SystemExit('Clang AST extraction failed: '+str(e))
    if opt.exact_filter:
        if not opt.filter:parser.error('--exact-filter requires --filter')
        ast=[node for node in ast if node.get('name') in set(filter_names)]
    # Filtered new/delete expressions carry small declaration references, not
    # ABI mangling. Query their original global declarations in this same TU
    # so separate recovery runs still use identical allocator symbol names.
    if opt.filter:
        allocation_queries={declaration['name'] for tree in ast for node in descendants(tree)
            for declaration in (node.get('operatorNewDecl'),node.get('operatorDeleteDecl'))
            if declaration and declaration.get('kind')=='FunctionDecl'}
        for name in sorted(allocation_queries-set(filter_names)):
            command=[frontend,*language,'-Xclang','-ast-dump=json',
                '-Xclang','-ast-dump-filter='+name,'-fsyntax-only',*args,opt.source]
            cache=None
            if opt.ast_cache_dir:
                identity=json.dumps([str(root),command,toolchain,ast_cache_inputs],sort_keys=True)
                cache=opt.ast_cache_dir/(hashlib.sha256(identity.encode()).hexdigest()+'.json')
            declarations,decode=run_clang_ast(command,cwd=root,cache_path=cache)
            ast.extend(declarations);ast_decode.append(decode)
            cpp_allocator_queries.add(name)
    # Demand-driven Clang closure for C++ pointer spans. A filtered AST may
    # contain the loop but omit the template class and its method bodies.
    # Query only class names actually referenced by range-for declarations.
    span_closure={'queried':[],'proven':[],'rejected':{}}
    known=recover_pointer_span_records(ast)
    if opt.filter:
        for name in sorted(range_container_names(ast)-set(known))[:8]:
            if name in filter_names:continue
            command=[frontend,*language,'-Xclang','-ast-dump=json',
                     '-Xclang','-ast-dump-filter='+name,'-fsyntax-only',*args,opt.source]
            span_closure['queried'].append(name)
            try:proc=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=45)
            except (subprocess.TimeoutExpired,OSError) as exc:
                span_closure['rejected'][name]=type(exc).__name__;continue
            if proc.returncode:
                span_closure['rejected'][name]='Clang class query failed';continue
            supplemental=parse_json_stream(proc.stdout)
            proof=recover_pointer_span_records(supplemental)
            if name not in proof:
                span_closure['rejected'][name]='no unique source-method body proof';continue
            ast.extend(supplemental)
            span_closure['proven'].append(name)
    # A filtered TU may contain `static HeaderClass instance;` without the
    # definition of its class. Recover ONLY the original Clang-proven header
    # record accepted by the same source-proven header discovery rules used
    # for complete TUs. Constructor bodies still require normal AST lowering.
    header_ctor_closure={'queried':[],'proven':[],'rejected':{}}
    if opt.filter:
        constructed=set()
        for top in ast:
            for node in descendants(top):
                if kind(node) not in ('CXXConstructExpr','CXXTemporaryObjectExpr'):continue
                spelling=normalized_record_name(qual(node))
                if spelling and re.fullmatch(r'[A-Za-z_]\w*',spelling):constructed.add(spelling)
        present={node.get('name') for top in ast for node in descendants(top)
                 if kind(node)=='CXXRecordDecl' and node.get('completeDefinition')}
        for name in sorted(constructed-present)[:8]:
            header_ctor_closure['queried'].append(name)
            command=[frontend,*language,'-Xclang','-ast-dump=json',
                     '-Xclang','-ast-dump-filter='+name,'-fsyntax-only',*args,opt.source]
            try:proc=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=45)
            except (subprocess.TimeoutExpired,OSError) as exc:
                header_ctor_closure['rejected'][name]=type(exc).__name__;continue
            if proc.returncode:
                header_ctor_closure['rejected'][name]='Clang record query failed';continue
            roots=parse_json_stream(proc.stdout)
            records=[node for item in roots for node in descendants(item)
                     if kind(node)=='CXXRecordDecl' and node.get('completeDefinition')
                     and node.get('name')==name and eligible_record(node)]
            proofs=[(node,header_proof(node,root)) for node in records]
            proofs=[(node,proof) for node,proof in proofs if proof]
            evidence={json.dumps(proof,sort_keys=True) for node,proof in proofs}
            if len(evidence)!=1 or not proofs:
                header_ctor_closure['rejected'][name]='missing/ambiguous source-proven constructor class';continue
            ast.append(proofs[0][0]);header_ctor_closure['proven'].append(name)
    # An AST filtered by a function name contains the selected C++ operator
    # *call* but not the class definition from an included header. Recover
    # ONLY the exact class used by that source-resolved method call. The
    # physical header bytes and Clang AST must uniquely identify its body;
    # a guessed method or translated JavaScript stand-in is never accepted.
    member_operator_closure={'queried':[],'proven':[],'rejected':{}}
    if opt.filter:
        required={}
        for tree in ast:
            for operation in descendants(tree):
                if kind(operation)!='CXXOperatorCallExpr' or len(kids(operation))<2:continue
                callee=kids(operation)[0]
                while kind(callee) in WRAPPERS and len(kids(callee))==1:
                    callee=kids(callee)[0]
                if kind(callee)!='DeclRefExpr':continue
                method=callee.get('referencedDecl',{})
                if method.get('kind')!='CXXMethodDecl' or not method.get('name','').startswith('operator'):continue
                receiver=normalized_record_name(qual(kids(operation)[1]))
                if not receiver or not re.fullmatch(r'[A-Za-z_]\w*',receiver):continue
                required.setdefault(receiver,set()).add((method['name'],method.get('type',{}).get('qualType')))
        existing={n.get('name') for tree in ast for n in descendants(tree)
                  if kind(n)=='CXXRecordDecl' and n.get('completeDefinition')}
        for name in sorted(required.keys()-existing)[:12]:
            member_operator_closure['queried'].append(name)
            command=[frontend,*language,'-Xclang','-ast-dump=json',
                     '-Xclang','-ast-dump-filter='+name,'-fsyntax-only',*args,opt.source]
            try:
                response=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=45)
                if response.returncode:
                    member_operator_closure['rejected'][name]='Clang source query failed';continue
                roots=parse_json_stream(response.stdout)
            except (subprocess.TimeoutExpired,OSError,ValueError) as error:
                member_operator_closure['rejected'][name]=type(error).__name__;continue
            matches=[]
            for tree in roots:
                for record in descendants(tree):
                    if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition') or record.get('name')!=name:continue
                    signatures={(m.get('name'),qual(m)) for m in kids(record)
                                if kind(m)=='CXXMethodDecl' and any(kind(v)=='CompoundStmt' for v in kids(m))}
                    if not required[name].issubset(signatures):continue
                    proof=header_proof(record,root)
                    if proof:matches.append((record,proof))
            distinct={json.dumps(proof,sort_keys=True) for _,proof in matches}
            if len(distinct)!=1 or not matches:
                member_operator_closure['rejected'][name]='missing or ambiguous source-verified member operator';continue
            ast.append(matches[0][0]);member_operator_closure['proven'].append(name)
    # A qualified C++ POD's compiler-generated trivial operator= has NO
    # source method body. Recover its actual complete record from the original
    # header only if the call's Clang-selected implicit operator signature,
    # trivial copy/move traits and physical byte provenance all agree.
    # In particular this handles libdivide-style packed numeric records
    # without baking in any vendor-specific class names.
    implicit_member_closure={'queried':[],'proven':[],'rejected':{}}
    def retry_implicit_member_closure():
        if not opt.filter:return False
        before=len(implicit_member_closure['proven'])
        implicit_needed={}
        for tree in ast:
            for operation in descendants(tree):
                if kind(operation)!='CXXOperatorCallExpr' or len(kids(operation))!=3:continue
                callee=kids(operation)[0]
                while kind(callee) in WRAPPERS and len(kids(callee))==1:callee=kids(callee)[0]
                if kind(callee)!='DeclRefExpr':continue
                method=callee.get('referencedDecl',{})
                if method.get('kind')!='CXXMethodDecl' or method.get('name')!='operator=':continue
                receiver=normalized_record_name(qual(kids(operation)[1]))
                signature=method.get('type',{}).get('qualType')
                if not receiver or '::' not in receiver or not signature:continue
                short=receiver.rsplit('::',1)[-1]
                implicit_needed.setdefault(short,set()).add(signature)
        for short in sorted(implicit_needed)[:12]:
            if short in implicit_member_closure['queried']:continue
            present=[node for tree in ast for node in descendants(tree)
                if kind(node)=='CXXRecordDecl' and node.get('completeDefinition') and node.get('name')==short]
            if present:continue
            implicit_member_closure['queried'].append(short)
            command=[frontend,*language,'-Xclang','-ast-dump=json',
                     '-Xclang','-ast-dump-filter='+short,'-fsyntax-only',*args,opt.source]
            try:
                query=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=45)
                if query.returncode:
                    implicit_member_closure['rejected'][short]='Clang original source query failed';continue
                roots=parse_json_stream(query.stdout)
            except (subprocess.TimeoutExpired,OSError,ValueError) as error:
                implicit_member_closure['rejected'][short]=type(error).__name__;continue
            verified=[]
            for tree in roots:
                for record in descendants(tree):
                    if kind(record)!='CXXRecordDecl' or not record.get('completeDefinition') or record.get('name')!=short:continue
                    traits=record.get('definitionData',{})
                    if not (traits.get('isStandardLayout') is True and traits.get('isTriviallyCopyable') is True
                        and traits.get('copyAssign',{}).get('trivial') is True
                        and traits.get('moveAssign',{}).get('trivial') is True
                        and traits.get('dtor',{}).get('trivial') is True and not record.get('bases')):continue
                    signatures={qual(method) for method in kids(record)
                        if kind(method)=='CXXMethodDecl' and method.get('name')=='operator='
                        and method.get('isImplicit') is True and method.get('explicitlyDefaulted')=='default'}
                    if not implicit_needed[short].issubset(signatures):continue
                    if short not in recover_trivial_aggregate_records([record]):continue
                    proof=header_proof(record,root)
                    if proof:verified.append((record,proof))
            origins={json.dumps(proof,sort_keys=True) for _,proof in verified}
            if len(origins)!=1:
                implicit_member_closure['rejected'][short]='missing or ambiguous original POD operator/layout proof';continue
            ast.append(verified[0][0]);implicit_member_closure['proven'].append(short)
        return len(implicit_member_closure['proven'])!=before
    retry_implicit_member_closure()
    index=json.loads(opt.project_symbols.read_text()) if opt.project_symbols else {}
    for name in existing_source_storage:
        # TU-private names are intentionally absent from the global export
        # index. They enter only this exact original unit's fragment map.
        index[name]=opt.source
    # Only known, uniquely owned source-first *emitted* definitions may link.
    for name,owner in index.items():
        if not isinstance(owner,str) or (owner==opt.source and not opt.import_root) or not re.fullmatch(r'[A-Za-z_$][\w$]*',name):
            raise SystemExit('Invalid/duplicate project symbol owner: '+name)
    layout_cache=None
    if opt.ast_cache_dir:
        layout_cache=opt.ast_cache_dir/('layouts-'+hashlib.sha256(json.dumps([str(root),cmd,toolchain,
            ast_cache_inputs,hashlib.sha256(Path(__file__).read_bytes()).hexdigest()],sort_keys=True).encode()).hexdigest()+'.json')
    layouts=json.loads(layout_cache.read_text()) if layout_cache and layout_cache.exists() else {}
    if opt.require_record_layouts:
        layout_result=subprocess.run([frontend,*language,'-Xclang','-fdump-record-layouts-complete',
            '-fsyntax-only',*args,opt.source],cwd=root,capture_output=True,text=True,timeout=45)
        if layout_result.returncode:
            raise SystemExit('Required Clang record-layout extraction failed: '+layout_result.stderr[-2000:])
        layouts.update(parse_clang_record_layouts(layout_result.stdout+'\n'+layout_result.stderr))
        if not layouts:raise SystemExit('Required Clang record-layout extraction produced no layouts')
    emitted,report=produce_current(ast,src,opt.source,opt.filter,include_header_inlines=opt.header_inlines,
                           project_symbols=index,record_layouts=layouts,source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
    # A filtered Clang AST often omits typedef declarations required to
    # materialize fixed-size global arrays. Query the exact underlying type
    # DECLARATION (not a guessed width based on an identifier spelling), then
    # retry all blocked definitions together. Safe even when several arrays
    # share one missing scalar typedef.
    typedef_closure={'queried':[],'proven':{},'rejected':{}}
    if opt.filter:
        discovered=set()
        for row in report:
            m=re.fullmatch(r'unsupported global array element type ([A-Za-z_]\w*)',row.get('reason',''))
            if m:discovered.add(m.group(1))
        for name in sorted(discovered)[:24]:
            if name in recover_type_aliases(ast):continue
            typedef_closure['queried'].append(name)
            command=[frontend,*language,'-Xclang','-ast-dump=json',
                     '-Xclang','-ast-dump-filter='+name,'-fsyntax-only',*args,opt.source]
            try:proc=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=45)
            except (subprocess.TimeoutExpired,OSError) as exc:
                typedef_closure['rejected'][name]=type(exc).__name__;continue
            if proc.returncode:
                typedef_closure['rejected'][name]='Clang typedef query failed';continue
            roots=parse_json_stream(proc.stdout)
            alias_decls=[node for root_node in roots for node in descendants(root_node)
                         if kind(node) in ('TypedefDecl','TypeAliasDecl') and node.get('name')==name]
            expansions={qual(node) for node in alias_decls if qual(node)!=name}
            if len(expansions)!=1 or len(alias_decls)!=1:
                typedef_closure['rejected'][name]='ambiguous or missing Clang scalar typedef';continue
            expanded=next(iter(expansions))
            # Verify the declaration itself; adding arbitrary Clang roots to a
            # filtered candidate scan could accidentally claim new exports.
            if not re.fullmatch(r'(?:signed |unsigned )?(?:char|short|int|long(?: long)?|bool|float|double|u?int(?:8|16|32|64)_t|size_t|intptr_t|uintptr_t)',expanded):
                typedef_closure['rejected'][name]='typedef target is not a proven scalar';continue
            ast.extend(alias_decls)
            typedef_closure['proven'][name]=expanded
        if typedef_closure['proven']:
            emitted,report=produce_current(ast,src,opt.source,opt.filter,
                                   include_header_inlines=opt.header_inlines,
                                   project_symbols=index,record_layouts=layouts,
                                   source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
    # Demand-driven original POD record closure for filtered global tables.
    # In the filtered AST `static const Token table[] = {{"text", 1}}`,
    # Clang hides the `typedef struct {...} Token` that establishes exact
    # field ordering. Requery only the actual declared type and require a
    # unique complete original C++ POD record; unrelated declarations never
    # become new game exports.
    enum_closure={'enabled':bool(opt.filter and (opt.enum_closure or opt.dependency_closure)),
                  'queried':[],'proven_values':{},'rejected':{},'rounds':0}
    pod_record_closure={'queried':[],'proven':[],'rejected':{}}
    full_type_closure={'attempted':False,'retained_type_roots':0}
    def retry_pod_record_closure(required_types=()):
        nonlocal emitted, report, static_reference_context
        if not opt.filter:return
        unresolved_types=set(required_types)
        for row in report:
            reason=row.get('reason','')
            unresolved_types.update(row.get('required_record_types',()))
            # A layout dump proves offsets, but not the declarations of nested
            # record fields omitted by a filtered AST. Route such failures
            # through the same source type closure as aggregate initialization.
            layout_type=re.fullmatch(r'(?:sizeof/alignof record layout|record copy/move requires Clang-proven trivial semantics|record pointer member requires original byte layout): (?:struct |class |union )?([A-Za-z_]\w*)',reason)
            if layout_type:unresolved_types.add(layout_type.group(1))
            field_owner=re.fullmatch(r'record field requires verified native storage: ([A-Za-z_]\w*)::[A-Za-z_]\w*',reason)
            if field_owner:unresolved_types.add(field_owner.group(1))
            # Filtered function ASTs can retain an implicit copy/move
            # assignment call while omitting the record that proves it is
            # trivial. Query the exact Clang-reported owner; lowering still
            # requires the original traits, fields and target layout.
            assignment_owner=re.match(r"C\+\+ member operator requires source-defined class/method ABI: \('((?:[A-Za-z_]\w*::)*[A-Za-z_]\w*)', 'operator='",reason)
            if assignment_owner:unresolved_types.add(assignment_owner.group(1).rsplit('::',1)[-1])
            if reason.startswith('unlinked identifiers:'):
                missing={name.strip() for name in reason.partition(':')[2].split(',')}
                for tree in ast:
                    for operation in descendants(tree):
                        if kind(operation)!='CXXConstructExpr' or kids(operation):continue
                        name=normalized_record_name(qual(operation))
                        if name in missing and re.fullmatch(r'[A-Za-z_]\w*',name):unresolved_types.add(name)
            if reason=='nonidentifier member':
                for tree in ast:
                    for member in descendants(tree):
                        if kind(member)!='MemberExpr' or member.get('name') or not kids(member):continue
                        spelling=qual(kids(member)[0]).rstrip(' *&').strip()
                        spelling=re.sub(r'^(?:const )?(?:struct |class |union )?', '', spelling)
                        if re.fullmatch(r'[A-Za-z_]\w*',spelling):unresolved_types.add(spelling)
            if reason.startswith('external object address requires a verified owner identity ABI'):
                for tree in ast:
                    if tree.get('name')!=row.get('source_name',row.get('name')):continue
                    for address in descendants(tree):
                        if kind(address)!='UnaryOperator' or address.get('opcode')!='&' or not kids(address):continue
                        reference=kids(address)[0]
                        while kind(reference) in WRAPPERS and kids(reference):reference=kids(reference)[0]
                        if kind(reference)!='DeclRefExpr' or reference.get('referencedDecl',{}).get('kind')!='VarDecl':continue
                        spelling=qual(reference).rstrip(' &').strip()
                        spelling=re.sub(r'\b(?:const|volatile|struct|class|union)\b','',spelling).strip()
                        if re.fullmatch(r'[A-Za-z_]\w*',spelling) and scalar_size(spelling) is None:unresolved_types.add(spelling)
            if reason.startswith(('C++ range reference escapes','address-of C++ range element')):
                for tree in ast:
                    for loop in descendants(tree):
                        if kind(loop)!='CXXForRangeStmt':continue
                        slots=loop.get('inner',[])
                        if len(slots)!=8 or len(kids(slots[6]))!=1:continue
                        spelling=re.sub(r'\b(?:const|volatile|struct|class|union)\b','',qual(kids(slots[6])[0])).rstrip(' &').strip()
                        if re.fullmatch(r'[A-Za-z_]\w*',spelling):unresolved_types.add(spelling)
            match=re.fullmatch(r'unsupported global array element type (?:(?:struct|class|union) )?([A-Za-z_]\w*)',reason)
            if match:unresolved_types.add(match.group(1))
            array_shape=re.fullmatch(r'global aggregate array requires verified storage shape: (?:(?:struct|class|union) )?([A-Za-z_]\w*)',reason)
            if array_shape:unresolved_types.add(array_shape.group(1))
            local_match=re.fullmatch(
                r'C aggregate list requires verified storage shape: (?:(?:struct|class|union) )?'
                r'([A-Za-z_]\w*(?:<[^<>]+>)?)',reason)
            if local_match:unresolved_types.add(local_match.group(1))
        # A filtered global `static Record pool[N];` carries an implicit
        # CXXConstructExpr, not an InitListExpr. If the header's complete
        # record/typedef was filtered out, global_initializer reports the
        # fallback non-C-list error. Query that *declared* type from Clang,
        # but only authorize trivial zero construction from source evidence.
        # No game names, inferred structure sizes, or invented constructors.
        for row in report:
            if row.get('reason') != 'global array initializer is not a C list':
                continue
            typ=row.get('original_type','')
            candidate=re.fullmatch(r'([A-Za-z_]\w*)\s*(?:\[\d+\])+',typ)
            if candidate:unresolved_types.add(candidate.group(1))
        already=set(recover_trivial_aggregate_records(ast,static_storage=True))
        known_specializations=specialization_aliases(ast)
        for name in sorted(unresolved_types-set(pod_record_closure['queried']))[:16]:
            if name in already or name in known_specializations and known_specializations[name] in already:
                continue
            pod_record_closure['queried'].append(name)
            # Query the Clang template DECLARATION by its primary identifier,
            # then select ONLY the concrete specialization whose Clang-owned
            # type arguments exactly match the requested aggregate spelling.
            # A substring match is never evidence that vec<T> has vec<int>'s ABI.
            templated=re.fullmatch(r'([A-Za-z_]\w*)<([^<>]+)>',name)
            query_name=templated.group(1) if templated else name
            query=[frontend,*language,'-Xclang','-ast-dump=json',
                   '-Xclang','-ast-dump-filter='+query_name,'-fsyntax-only',*args,opt.source]
            try:
                roots=allocator_query(query_name)
            except (subprocess.TimeoutExpired,OSError,ValueError,RuntimeError) as exc:
                pod_record_closure['rejected'][name]=type(exc).__name__;continue
            if templated:
                normalize_specializations(roots)
                # The Clang AST is the type authority. Do not accept primary
                # templates, nearby specializations or incomplete declarations.
                matches=[node for root_node in roots for node in descendants(root_node)
                         if kind(node)=='CXXRecordDecl' and node.get('completeDefinition')
                         and node.get('_source_record_name')==name]
                proven=[node for node in matches if node['name'] in
                        recover_trivial_aggregate_records([node],static_storage=True)]
                if len(proven)!=1:
                    pod_record_closure['rejected'][name]='missing/ambiguous concrete Clang template POD specialization';continue
                ast.append(proven[0])
                pod_record_closure['proven'].append(name)
                continue
            verified=recover_trivial_aggregate_records(roots,static_storage=True)
            # Overlapping unions require the existing exact byte-backed ABI.
            # Its offsets come from Clang's target record-layout dump, never
            # from assumed field order or a synthesized JavaScript shape.
            if name not in verified and name not in recover_byte_records(roots,layouts,
                    recover_type_aliases(roots),source_root=root):
                pod_record_closure['rejected'][name]='no unambiguous trivial POD/byte record declaration';continue
            # Keep only the needed typedef and its exact Clang-tag record,
            # never filtered function bodies or unrelated globals.
            additions=[n for n in roots if kind(n) in ('TypedefDecl','RecordDecl','CXXRecordDecl')
                       and (n.get('name')==name or kind(n) in ('RecordDecl','CXXRecordDecl') and
                            not n.get('name') and n.get('completeDefinition'))]
            if not additions:
                pod_record_closure['rejected'][name]='missing corresponding original record';continue
            ast.extend(additions)
            pod_record_closure['proven'].append(name)
        # Named AST filters cannot dump an anonymous typedef-owned record.
        # Recover the complete SAME translation unit once and retain only
        # type declarations. Their typedef->tag IDs then come from one Clang
        # parse; no anonymous shape or layout is inferred from a nearby name.
        anonymous_arrays=blocked_anonymous_global_arrays(report)
        explicit_members=has_unresolved_explicit_operators(ast)
        static_members=any(row.get('reason','').startswith('method reference lacks exact static class owner:') for row in report)
        heap_types=any(row.get('reason','').startswith('C++ heap object needs complete original class construction/destruction:') for row in report)
        c_overloads=any('ambiguous C++ overload call:' in row.get('reason','') for row in report)
        unresolved_enums=bool(enum_closure['rejected'])
        # A named POD query can prove fields while omitting its namespace.
        # Keep the original same-TU declaration context before joining its
        # qualified target layout; never join merely by a matching short name.
        unresolved_record_views=any(row.get('reason','').startswith(('record pointer member requires original byte layout:',
            'record field requires verified native storage:',
            'global aggregate array requires verified storage shape:',
            'nontrivial byte-view method requires original class prototype:')) for row in report)
        ordinary_members=any(row.get('reason','').startswith('overloaded member requires exact Clang-selected source method:') for row in report)
        if (pod_record_closure['rejected'] or anonymous_arrays or explicit_members or ordinary_members or static_members or heap_types or c_overloads or unresolved_enums or unresolved_record_views) and not full_type_closure['attempted']:
            full_type_closure['attempted']=True
            full_command=[frontend,*language,'-Xclang','-ast-dump=json','-fsyntax-only',*args,opt.source]
            full_cache=None
            if opt.ast_cache_dir:
                key=hashlib.sha256(json.dumps([str(root),full_command,ast_cache_inputs],sort_keys=True).encode())
                full_cache=opt.ast_cache_dir/('full-types-'+key.hexdigest()+'.json')
            try:
                complete,decode=run_clang_ast(full_command,cwd=root,cache_path=full_cache)
                full_type_closure['explicit_member_calls_rebound']=rebind_explicit_operators(ast,complete)
                full_type_closure['static_member_references_rebound']=rebind_static_references(ast,complete)
                # Complete EnumDecls prove implicit successors as well as
                # explicit constants. Reconnect only uniquely valued names
                # actually referenced by the filtered source; retain this
                # evidence instead of recording only extra enum queries.
                needed_enums={node.get('referencedDecl',{}).get('name')
                    for tree in ast for node in descendants(tree)
                    if kind(node)=='DeclRefExpr' and node.get('referencedDecl',{}).get('kind')=='EnumConstantDecl'}
                complete_values=recover_enum_values(complete)
                by_enum_name={}
                for tree in complete:
                    for node in descendants(tree):
                        if kind(node)=='EnumConstantDecl' and node.get('id') in complete_values:
                            by_enum_name.setdefault(node.get('name'),set()).add(complete_values[node['id']])
                # Later dependency queries have fresh Clang IDs and may be the
                # first to reference an anonymous enum's implicit successor.
                # Retain only unambiguous values from the complete same TU;
                # produce_current installs evidence only for actual references.
                full_enum_values.update({name:next(iter(values)) for name,values in by_enum_name.items()
                                         if name and len(values)==1})
                for name in sorted(needed_enums-set([None])):
                    proven=by_enum_name.get(name,set())
                    if len(proven)==1:
                        value=next(iter(proven))
                        if name in enum_closure['proven_values'] and enum_closure['proven_values'][name]!=value:
                            raise ValueError('complete original TU conflicts with queried enum: '+name)
                        enum_closure['proven_values'][name]=value
                        enum_closure['rejected'].pop(name,None)
                type_kinds={'TypedefDecl','TypeAliasDecl','TypeAliasTemplateDecl','EnumDecl',
                            'RecordDecl','CXXRecordDecl','ClassTemplateDecl','ClassTemplateSpecializationDecl'}
                def types_only(node):
                    if kind(node) in type_kinds:return node
                    if kind(node) not in ('TranslationUnitDecl','NamespaceDecl','LinkageSpecDecl'):return None
                    children=[kept for child in kids(node) if (kept:=types_only(child)) is not None]
                    return {**node,'inner':children} if children else None
                additions=[kept for node in complete if (kept:=types_only(node)) is not None]
                field_selection_index.update(index_source_fields(complete,additions))
                # Retained original method bodies can call free inline header
                # functions. Keep their exact same-TU definitions as evidence;
                # normal demand-driven header recovery still decides emission.
                functions={node.get('id'):node for tree in complete for node in descendants(tree)
                    if kind(node)=='FunctionDecl' and any(kind(body)=='CompoundStmt' for body in kids(node))}
                pending=list(additions);kept_functions=set()
                while pending:
                    for reference in descendants(pending.pop()):
                        declaration=reference.get('referencedDecl',{})
                        identity=declaration.get('id')
                        function=functions.get(identity)
                        if declaration.get('kind')!='FunctionDecl' or not function or identity in kept_functions:continue
                        loc=function.get('loc',{})
                        if not loc.get('includedFrom') and not loc.get('file'):continue
                        if loc.get('file') in (opt.source,str(src)):continue
                        kept_functions.add(identity);pending.append(function)
                additions.extend(function for identity,function in functions.items() if identity in kept_functions)
                full_type_closure['retained_method_function_dependencies']=len(kept_functions)
                full_type_closure['field_selection_sites']=len(field_selection_index)
                retained_ids={id(node) for tree in additions for node in descendants(tree)}
                # Later dependency rounds can add another original header
                # wrapper that calls a static method or explicit operator. Retain its exact
                # same-TU selection evidence, without retaining the full
                # game function AST or reparsing every selected unit.
                call_context=[*c_function_contexts(complete),*[node for tree in complete for node in descendants(tree)
                    if kind(node)=='FunctionDecl' and id(node) not in retained_ids
                    and any(explicit_operator(ref) or
                            kind(ref)=='DeclRefExpr' and ref.get('referencedDecl',{}).get('kind')=='CXXMethodDecl'
                            for ref in descendants(node))]]
                static_reference_context=list(additions)
                for node in call_context:
                    if id(node) not in retained_ids:
                        static_reference_context.append(node)
                        retained_ids.update(id(child) for child in descendants(node))
                full_type_closure['static_callsite_context_roots']=len(static_reference_context)
                ast.extend(additions)
                full_type_closure.update(retained_type_roots=len(additions),ast_decode=decode,
                                         reason='anonymous or transitively aliased original record omitted by named filter')
                emitted,report=produce_current(ast,src,opt.source,opt.filter,include_header_inlines=opt.header_inlines,
                    project_symbols=index,record_layouts=layouts,enum_constants=enum_closure['proven_values'],
                    source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
            except (subprocess.TimeoutExpired,OSError,ValueError) as exc:
                full_type_closure['error']=str(exc)
        if pod_record_closure['proven']:
            emitted,report=produce_current(ast,src,opt.source,opt.filter,
                                   include_header_inlines=opt.header_inlines,
                                   project_symbols=index,record_layouts=layouts,
                                   enum_constants=enum_closure['proven_values'],source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
    # A source-filtered zero-initialized record pool requires the same target
    # layout evidence as a byte-backed union or pointer stride. Clang's AST
    # filter deliberately hides those layouts; recover the actual target's
    # layout dump once for this semantic family, never assume C packing.
    if opt.filter and any(r.get('reason')=='global array initializer is not a C list'
                          or r.get('reason','').startswith(('C++ range reference escapes','address-of C++ range element',
                              'external object address requires a verified owner identity ABI'))
                          or r.get('reason','').startswith('global aggregate array requires verified storage shape:')
                          or r.get('reason','').startswith('record pointer member requires original byte layout:')
                          or r.get('reason','').startswith('record field requires verified native storage:')
                          or r.get('reason','').startswith('unsupported global array element type ')
                          for r in report):
        layout_cmd=[frontend,*language,'-Xclang','-fdump-record-layouts-complete',
                    '-fsyntax-only',*args,opt.source]
        try:
            got=subprocess.run(layout_cmd,cwd=root,capture_output=True,text=True,timeout=45)
            if got.returncode==0:
                layouts.update(parse_clang_record_layouts(got.stdout+'\n'+got.stderr))
        except (subprocess.TimeoutExpired,OSError):
            pass  # Retain the array blocker; never fabricate target offsets.
    retry_pod_record_closure()
    template_destructor_closure={'requested':[],'proven':[],'rejected':{}}
    def retry_template_destructor_closure():
        nonlocal emitted,report
        if not compile_as_cpp:return
        prefix='C++ heap object needs complete original class construction/destruction: '
        pending=[row for row in report if (row.get('required_original_destructor') or
                 row.get('reason','').startswith(prefix)) and
                 row.get('required_original_destructor',row.get('reason','')[len(prefix):]) not in template_destructor_closure['requested']]
        if not pending:return
        recovered=complete_template_destructors(ast,pending,root=root,source=src,
            frontend=frontend,language=language,arguments=args,aliases=recover_type_aliases(ast),
            normalize=normalized_record_name,cache_dir=opt.ast_cache_dir)
        for key in ('requested','proven'):template_destructor_closure[key].extend(recovered[key])
        template_destructor_closure['rejected'].update(recovered['rejected'])
        if recovered['proven']:
            emitted,report=produce_current(ast,src,opt.source,opt.filter,include_header_inlines=opt.header_inlines,
                project_symbols=index,record_layouts=layouts,enum_constants=enum_closure['proven_values'],
                source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
    retry_template_destructor_closure()
    # Automatically recover header-defined friend operators from Clang's
    # original CXXRecordDecl, using the actual operand type rather than a
    # game-specific name. -ast-dump-filter on app_main omits all declarations
    # in its header, including namespace-level friend FunctionDecl bodies.
    friend_closure={'queried':[],'proven':[],'rejected':{}}
    if opt.filter and any(row.get('reason','').startswith((
            'C++ operator missing uniquely emitted source definition:',
            'record copy/move requires Clang-proven trivial semantics:',
            'C++ constructor lacks Clang-selected source body:')) for row in report):
        missing={row.get('reason','') for row in report if row.get('reason','').startswith(
            'C++ operator missing uniquely emitted source definition:')}
        candidates=set()
        for root_node in ast:
            for operation in descendants(root_node):
                if kind(operation) in ('CXXConstructExpr','CXXTemporaryObjectExpr'):
                    cls=normalized_record_name(qual(operation))
                    if cls and re.fullmatch(r'[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*',cls):
                        candidates.add(cls)
                if kind(operation)!='CXXOperatorCallExpr' or not kids(operation):continue
                callee=kids(operation)[0]
                while kind(callee) in WRAPPERS and len(kids(callee))==1:
                    callee=kids(callee)[0]
                decl=callee.get('referencedDecl',{}) if kind(callee)=='DeclRefExpr' else {}
                if decl.get('kind')!='FunctionDecl':continue
                signature=decl.get('name','')+' '+decl.get('type',{}).get('qualType','')
                if not any(reason.endswith(signature) for reason in missing):continue
                for operand in kids(operation)[1:]:
                    candidate=re.sub(r'\b(?:const|volatile|struct|class|union)\b','',qual(operand))
                    candidate=candidate.strip().rstrip('&').strip()
                    if re.fullmatch(r'[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*',candidate):
                        candidates.add(candidate)
        for cls in sorted(candidates)[:4]:
            friend_closure['queried'].append(cls)
            command=[frontend,*language,'-Xclang','-ast-dump=json',
                     '-Xclang','-ast-dump-filter='+cls,'-fsyntax-only',*args,opt.source]
            try:proc=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=90)
            except (subprocess.TimeoutExpired,OSError) as exc:
                friend_closure['rejected'][cls]=type(exc).__name__;continue
            if proc.returncode:
                friend_closure['rejected'][cls]='Clang class query failed';continue
            extra=parse_json_stream(proc.stdout)
            matched=[n for root_node in extra for n in descendants(root_node)
                     if kind(n)=='CXXRecordDecl' and n.get('completeDefinition')
                     and n.get('name')==cls.split('::')[-1]]
            if len(matched)!=1:
                friend_closure['rejected'][cls]='no unique complete Clang record';continue
            ast.extend(extra)
            friend_closure['proven'].append(cls)
        if friend_closure['proven']:
            emitted,report=produce_current(ast,src,opt.source,opt.filter,
                                   include_header_inlines=opt.header_inlines,
                                   project_symbols=index,record_layouts=layouts,source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
    # Clang AST filters omit unrelated record definitions, even when the
    # selected function constructs them across goto edges. Recover only the
    # original complete class definition and its verified destructor traits;
    # fail closed on absent or conflicting definitions. Never assume that a
    # class is trivially destructible based on its name or apparent layout.
    lifetime_closure={'queried':[],'proven':[],'rejected':{}}
    if opt.filter:
        tried=set(filter_names)
        for _ in range(6):
            pending={m.group(1) for row in report
                     for m in [re.fullmatch(
                         r'source control flow: goto C\+\+ lifetime requires Clang-proven trivial destructor: ([A-Za-z_]\w*)',
                         row.get('reason',''))] if m and m.group(1) not in tried}
            if not pending:break
            for name in sorted(pending)[:4]:
                tried.add(name);lifetime_closure['queried'].append(name)
                command=[frontend,*language,'-Xclang','-ast-dump=json',
                         '-Xclang','-ast-dump-filter='+name,'-fsyntax-only',*args,opt.source]
                try:proc=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=45)
                except (subprocess.TimeoutExpired,OSError) as exc:
                    lifetime_closure['rejected'][name]=type(exc).__name__;continue
                if proc.returncode:
                    lifetime_closure['rejected'][name]='Clang class query failed';continue
                extra=parse_json_stream(proc.stdout)
                traits={n.get('definitionData',{}).get('dtor',{}).get('trivial') is True
                        for candidate in extra for n in descendants(candidate)
                        if kind(n)=='CXXRecordDecl' and n.get('completeDefinition') and n.get('name')==name}
                if traits!={True}:
                    lifetime_closure['rejected'][name]='missing or conflicting trivial destructor proof';continue
                ast.extend(extra);lifetime_closure['proven'].append(name)
            emitted,report=produce_current(ast,src,opt.source,opt.filter,include_header_inlines=opt.header_inlines,
                                   project_symbols=index,record_layouts=layouts,source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
    def retry_enum_closure():
        nonlocal emitted, report
        if not enum_closure['enabled']:return
        # For source expressions such as enum flags, filtered ASTs carry the
        # Clang declaration ID but not the EnumDecl. Query *this same TU* for
        # an exact, uniquely named EnumConstantDecl with an evaluated Clang
        # ConstantExpr. Do not guess implicit ordinals or namespace collisions.
        for round_num in range(24):
            names={row.get('reason','').partition(': ')[2] for row in report
                   if row.get('reason','').startswith('enum constant without Clang-verified value: ')}
            pending=sorted(x for x in names if x not in enum_closure['queried']
                           and re.fullmatch(r'[A-Za-z_]\w*',x))[:16]
            if not pending:break
            enum_closure['rounds']+=1
            for name in pending:
                if name in enum_closure['proven_values']:continue
                enum_closure['queried'].append(name)
                prefix=name.rsplit('_',1)[0]+'_' if '_' in name else name
                # Query a family together when the prefix is specific enough.
                # This changes discovery efficiency, not semantic validation:
                # only unique exact EnumConstantDecl names with Clang-evaluated
                # values are accepted; unrelated matches are discarded.
                query=prefix if len(prefix)>=5 else name
                command=[frontend,*language,'-Xclang','-ast-dump=json',
                         '-Xclang','-ast-dump-filter='+query,'-fsyntax-only',*args,opt.source]
                try:proc=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=90)
                except (subprocess.TimeoutExpired,OSError) as exc:
                    enum_closure['rejected'][name]=type(exc).__name__;continue
                if proc.returncode:
                    enum_closure['rejected'][name]='Clang query failed';continue
                candidates={}
                for node in parse_json_stream(proc.stdout):
                    if kind(node)!='EnumConstantDecl':continue
                    candidate=node.get('name')
                    if not candidate or not candidate.startswith(query):continue
                    candidates.setdefault(candidate,[]).append(node)
                for candidate,matches in candidates.items():
                    if len(matches)!=1:
                        enum_closure['rejected'][candidate]='ambiguous enum declaration';continue
                    exprs=[x.get('value') for x in descendants(matches[0])
                           if kind(x)=='ConstantExpr' and x.get('value') is not None]
                    if len(exprs)!=1:
                        enum_closure['rejected'][candidate]='no unique Clang constant expression';continue
                    try:value=int(str(exprs[0]),0)
                    except ValueError:
                        enum_closure['rejected'][candidate]='noninteger Clang constant';continue
                    enum_closure['proven_values'][candidate]=value
                # An implicit enum enumerator has no ConstantExpr of its
                # own. Clang's COMPLETE containing EnumDecl, however,
                # provides the explicit predecessor and ordered successors.
                # Resolve that declaration by the type of the *exact*
                # EnumConstantDecl, never by assuming the suffix's number.
                if name not in enum_closure['proven_values']:
                    matching=[r for rows in candidates.values() for r in rows if r.get('name')==name]
                    if len(matching)==1:
                        enum_type=matching[0].get('type',{}).get('qualType','')
                        if re.fullmatch(r'[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*',enum_type):
                            enum_cmd=[frontend,*language,'-Xclang','-ast-dump=json',
                                      '-Xclang','-ast-dump-filter='+enum_type,
                                      '-fsyntax-only',*args,opt.source]
                            try:enum_proc=subprocess.run(enum_cmd,cwd=root,capture_output=True,text=True,timeout=45)
                            except (subprocess.TimeoutExpired,OSError):enum_proc=None
                            if enum_proc is not None and enum_proc.returncode==0:
                                enum_roots=parse_json_stream(enum_proc.stdout)
                                containers=[e for e in enum_roots if kind(e)=='EnumDecl'
                                            and e.get('name')==enum_type.split('::')[-1]]
                                if not containers:
                                    # `typedef enum { A, B } Alias;` has an
                                    # ANONYMOUS EnumDecl. Clang's typedef root
                                    # contains the exact EnumType declaration
                                    # identity. Match IDs, never enum order by
                                    # name or a guessed numeric suffix.
                                    aliases=[e for e in enum_roots if kind(e)=='TypedefDecl'
                                             and e.get('name')==enum_type]
                                    if len(aliases)==1:
                                        refs={inner.get('decl',{}).get('id')
                                              for inner in descendants(aliases[0])
                                              if kind(inner)=='EnumType' and inner.get('decl',{}).get('kind')=='EnumDecl'}
                                        containers=[e for e in enum_roots if kind(e)=='EnumDecl'
                                                    and not e.get('name') and e.get('id') in refs]
                                if len(containers)==1:
                                    exact=[c for c in kids(containers[0])
                                           if kind(c)=='EnumConstantDecl' and c.get('name')==name]
                                    values=recover_enum_values(containers)
                                    if len(exact)==1 and exact[0].get('id') in values:
                                        enum_closure['proven_values'][name]=values[exact[0]['id']]
                                        enum_closure['rejected'].pop(name,None)
                if name not in enum_closure['proven_values']:
                    enum_closure['rejected'].setdefault(name,'no unique Clang-defined value')
            emitted,report=produce_current(ast,src,opt.source,opt.filter,include_header_inlines=opt.header_inlines,
                                   project_symbols=index,record_layouts=layouts,
                                   enum_constants=enum_closure['proven_values'],source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
    retry_enum_closure()
    closure={'enabled':bool(opt.dependency_closure and opt.filter),
             'additional_ast_filters':[],'additional_ast_roots':0,'rounds':0,
             'query_limit':opt.dependency_query_limit,'budget_exhausted':False,'unqueried_references':[]}
    dependency_tried=set(filter_names)
    def retry_dependency_closure():
        nonlocal emitted, report
        if not closure['enabled']:return
        # Clang --ast-dump-filter is intentionally narrow; a source function
        # can call unfiltered siblings. Follow *actual referenced names* from
        # failed definitions, not a manually maintained list of Duke symbols.
        while True:
            names=set()
            for row in report:
                reason=row.get('reason','')
                if reason.startswith('unlinked identifiers:'):
                    names.update(x.strip() for x in reason.partition(':')[2].split(',') if x.strip())
                if reason.startswith('static pointer initializer requires a proven original source address:'):
                    # A filtered table's callback providers can be absent
                    # before its static relocation is authorized. Query only
                    # Clang-recorded references; normal ownership and exact
                    # signature checks must still prove every initializer.
                    names.update(row.get('source_references',[]))
            unseen=sorted(x for x in names if x not in dependency_tried and re.fullmatch(r'[A-Za-z_]\w*',x))
            remaining=opt.dependency_query_limit-len(closure['additional_ast_filters'])
            closure['budget_exhausted']=bool(unseen and remaining<=0)
            closure['unqueried_references']=unseen if remaining<=0 else []
            pending=unseen[:min(16,max(remaining,0))]
            if not pending:break
            closure['rounds']+=1
            # A Clang AST filter must re-parse the entire translation unit.
            # These queries are independent and source-identical; batch them
            # with a bounded worker pool, then merge results in sorted order.
            # Never change declaration order based on process scheduling.
            # If any query fails, no partial recovered AST is committed.
            def dependency_query(name):
                one=[frontend,*language,'-Xclang','-ast-dump=json',
                     '-Xclang','-ast-dump-filter='+name,'-fsyntax-only',*args,opt.source]
                # Clang's filter is a SUBSTRING match: querying `sector` also
                # dumps draw-sector routines and unrelated similarly named
                # globals. Those introduce false dependencies and duplicate
                # declarations from different parses. Only the exact requested
                # source declaration can extend this dependency frontier.
                roots=allocator_query(name,timeout=90)
                return [node for node in roots if node.get('name')==name]
            # Each configured EDuke32 query reparses a large complete TU.
            # Keep those Clang processes serial on the supported constrained
            # host; standalone bounded fixtures can still query in parallel.
            workers=min(1 if comp is not None else 4,len(pending))
            with ThreadPoolExecutor(max_workers=workers) as executor:
                # Executor.map yields input order, never completion order.
                try: recovered=list(executor.map(dependency_query,pending))
                except (subprocess.TimeoutExpired,OSError,RuntimeError,ValueError) as exc:
                    raise SystemExit('Clang dependency closure rejected: '+str(exc)) from exc
            for name,new in zip(pending,recovered):
                dependency_tried.add(name)
                ast.extend(new)
                closure['additional_ast_filters'].append(name)
                closure['additional_ast_roots']+=len(new)
            emitted,report=produce_current(ast,src,opt.source,opt.filter,include_header_inlines=opt.header_inlines,
                                   project_symbols=index,record_layouts=layouts,
                                   enum_constants=enum_closure['proven_values'],source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
    retry_dependency_closure()
    if any(any(reason in x.get('reason','') for reason in (
            'sizeof/alignof record layout:', 'aggregate copy needs exact Clang layout:',
            'empty aggregate initializer requires layout:',
            'C++ global class address requires exact Clang layout:',
            'external object address requires a verified owner identity ABI',
            'record pointer member requires original byte layout:',
            'record field requires verified native storage:',
            'C aggregate list requires verified storage shape:', 'nonidentifier member',
            'aggregate copy requires verified pointer-free field shape:',
            'anonymous record fields require exact Clang byte layout',
            'global aggregate array requires verified storage shape:',
            'unsupported global array element type ',
            'global initialization needs a C++ type/layout',
            'null-field offset needs Clang ABI:',
            'pointer increment requires bounded element layout',
            'pointer compound assignment requires bounded element layout',
            'pointer arithmetic/comparison requires bounded memory view')) for x in report):
        # Retry ONLY when source declarations actually need the target ABI.
        # No inferred record padding or arbitrary zero-byte approximations.
        layout_cmd=[frontend,*language,'-Xclang','-fdump-record-layouts-complete',
                    '-fsyntax-only',*args,opt.source]
        try:
            layout_result=subprocess.run(layout_cmd,cwd=root,capture_output=True,text=True,timeout=45)
            if layout_result.returncode==0:
                discovered=parse_clang_record_layouts(layout_result.stdout+'\n'+layout_result.stderr)
                if discovered:
                    layouts.update(discovered)
                    # Bounded, source-verified fixed-point ABI recovery.  A
                    # previously blocked function may expose the *next*
                    # missing typedef only after its predecessor is proven.
                    # Recover multiple independent families in one pass, not
                    # one error per compiler invocation.
                    queried_abi=set()
                    for _abi_round in range(12):
                        needed=set()
                        for blocked in report:
                            reason=blocked.get('reason','')
                            m=re.fullmatch(r'sizeof/alignof record layout: (.+)',reason)
                            pointer=re.fullmatch(r'pointer (?:increment requires bounded element layout|compound assignment requires bounded element layout|arithmetic/comparison requires bounded memory view): (.+)',reason)
                            if not (m or pointer):continue
                            typename=(m or pointer).group(1)
                            # A Clang pointer alias can be spelled as `const T *`.
                            # Recover the original TypeAliasDecl instead of
                            # guessing a stride from a similarly named record.
                            if pointer:
                                typename=typename.partition('*')[0]
                            typename=re.sub(r'(?:\s*\[\s*\d+\s*\])+\s*$', '',typename).strip()
                            typename=re.sub(r'\b(?:const|volatile|struct|class|union|restrict)\b','',typename).strip()
                            if re.fullmatch(r'[A-Za-z_]\w*',typename):needed.add(typename)
                        # POD closure may already have recovered the exact
                        # declaration before its ABI offsets became available.
                        # Reuse that evidence rather than add a second Clang
                        # query-local identity for the same named record.
                        proven_bytes=recover_byte_records(ast,layouts,recover_type_aliases(ast),source_root=root,source_rel=opt.source)
                        needed-=set(proven_bytes)
                        newly=[]
                        for typename in sorted(needed-queried_abi)[:16] if opt.filter else []:
                            queried_abi.add(typename)
                            command=[frontend,*language,'-Xclang','-ast-dump=json',
                                     '-Xclang','-ast-dump-filter='+typename,
                                     '-fsyntax-only',*args,opt.source]
                            try:
                                query=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=45)
                                if query.returncode:continue
                                supplemental=parse_json_stream(query.stdout)
                            except (subprocess.TimeoutExpired,OSError,ValueError):
                                continue
                            records=recover_typedef_record_layouts(supplemental,layouts)
                            aliases=recover_type_aliases(supplemental)
                            scalar=target_type_layout(typename,layouts,aliases)
                            alias_source=any(kind(node) in ('TypedefDecl','TypeAliasDecl') and
                                node.get('name')==typename for tree in supplemental for node in descendants(tree))
                            if typename not in records and not scalar and not alias_source:continue
                            # Keep exact declared typedefs and owning records,
                            # never filtered function bodies or unrelated globals.
                            newly.extend(node for node in supplemental if kind(node) in (
                                'TypedefDecl','TypeAliasDecl','RecordDecl','CXXRecordDecl'))
                        if newly:ast.extend(newly)
                        previous=[(x['name'],x.get('reason')) for x in report]
                        emitted,report=produce_current(ast,src,opt.source,opt.filter,include_header_inlines=opt.header_inlines,
                            project_symbols=index,record_layouts=layouts,
                            enum_constants=enum_closure['proven_values'],source_root=root,
                            header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
                        if previous==[(x['name'],x.get('reason')) for x in report] and not newly:
                            break
                    if layout_cache:
                        layout_cache.write_text(json.dumps(layouts,sort_keys=True),encoding='utf-8')
        except (subprocess.TimeoutExpired,OSError):
            pass # Retain exact unresolved blocker; don't fabricate layout.

    # Dependency and ABI closure can expose *new* enum expressions after the
    # first enum pass. Follow them to a fixed point instead of stopping the
    # source compiler one handler too early. Previously queried names are
    # memoized, so this cannot loop on an unresolved declaration.
    # One recovered declaration can expose a different semantic family later
    # in the SAME original function. Alternate the shared closure passes until
    # no declaration/status changes, rather than stranding a POD schema behind
    # an enum expression that happened to be visited first by the AST emitter.
    dependency_layout_closure={'attempted':False,'records_added':0}
    for _semantic_round in range(24):
        previous=[(row['name'],row['status'],row.get('reason')) for row in report]
        retry_enum_closure()
        retry_pod_record_closure()
        retry_template_destructor_closure()
        # A verified layout can reveal calls that were unreachable to the
        # emitter on the first pass. Revisit actual source dependencies too;
        # the shared query set keeps failed/ambiguous declarations bounded.
        retry_dependency_closure()
        # A newly discovered function can be the first to dereference a
        # record, after the earlier ABI pass has already run. Complete the
        # same fixed point over layouts as well as declarations; never strand
        # those dependencies merely because the first requested function did
        # not itself require a byte layout.
        if not layouts and not dependency_layout_closure['attempted'] and any(
                row.get('reason','').startswith(('record pointer member requires original byte layout:',
                    'record field requires verified native storage:', 'sizeof/alignof record layout:'))
                for row in report):
            dependency_layout_closure['attempted']=True
            try:
                query=subprocess.run([frontend,*language,'-Xclang','-fdump-record-layouts-complete',
                    '-fsyntax-only',*args,opt.source],cwd=root,capture_output=True,text=True,timeout=45)
                if query.returncode:raise ValueError(query.stderr[-1500:])
                discovered=parse_clang_record_layouts(query.stdout+'\n'+query.stderr)
                dependency_layout_closure['records_added']=len(discovered)
                layouts.update(discovered)
                if discovered:
                    emitted,report=produce_current(ast,src,opt.source,opt.filter,include_header_inlines=opt.header_inlines,
                        project_symbols=index,record_layouts=layouts,enum_constants=enum_closure['proven_values'],
                        source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
            except (subprocess.TimeoutExpired,OSError,ValueError) as exc:
                dependency_layout_closure['error']=str(exc)
        if retry_implicit_member_closure():
            emitted,report=produce_current(ast,src,opt.source,opt.filter,include_header_inlines=opt.header_inlines,
                project_symbols=index,record_layouts=layouts,enum_constants=enum_closure['proven_values'],
                source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
        if previous==[(row['name'],row['status'],row.get('reason')) for row in report]:
            break
    # Even a register-only header aggregate needs its exact target layout when
    # another TU may own the shared prototype. Do not infer that layout from
    # scalar field names or from whichever methods happened to instantiate.
    known_layouts={**layouts,**specialization_layouts(ast,layouts)}
    prototype_layout_closure={'requested':sorted({row['source_name'] for row in report
        if row.get('header_record_factory') and row['name'] not in known_layouts
        and row.get('source_name') not in known_layouts}),'queried':False,'status':'not-required'}
    # An emitted global array is native contiguous storage even when this
    # particular filtered function uses only named fields. Demand the target
    # layout before choosing a plain register aggregate representation that
    # a later translation unit could never address correctly.
    array_layouts=set();storage_aliases=recover_type_aliases(ast)
    pod_storage=recover_trivial_aggregate_records(ast,static_storage=True,source_root=root)
    for row in report:
        if row.get('kind')!='VarDecl' or row.get('status')!='source-first':continue
        if row.get('object_storage',{}).get('abi')=='source-byte-record-array/1':continue
        element=re.fullmatch(r'(.+?)(?:\s*\[\s*\d+\s*\])+',row.get('original_type',''))
        if not element:
            base=normalized_record_name(row.get('original_type',''),storage_aliases)
            record=pod_storage.get(base,{})
            # A later TU can take &record even if this owner only initializes
            # named fields. Materialize native bytes at the ORIGINAL owner;
            # never replace that storage in the consumer or weaken its audit.
            if (record and not record.get('pointer_aliases') and
                not any(token in row.get('original_type','') for token in ('*','&','(')) and
                not row.get('global_storage',{}).get('byte_record_schema_sha256') and
                not row.get('private_storage',{}).get('byte_record_schema_sha256')):
                array_layouts.add(base)
            continue
        base=resolve_scalar_storage_alias(element.group(1).strip(),storage_aliases)
        if '*' not in base and scalar_size(base) is None:array_layouts.add(base)
    prototype_layout_closure['requested']=sorted(set(prototype_layout_closure['requested'])|array_layouts)
    # A record can be imported entirely through its owner's address cell,
    # without an emitted local class factory. It still needs the consumer's
    # independent Clang byte layout before its storage contract can be linked.
    if opt.import_root:
        missing_storage_layouts=set()
        for row in report:
            if row.get('status')!='source-first':continue
            for dep in row.get('external_storage_imports',[]):
                if dep.get('abi')!=GLOBAL_STORAGE_ABI or dep.get('byte_record_schema_sha256'):continue
                provider=opt.import_root/(index[dep['name']]+'.manifest.json')
                if not provider.is_file():continue
                proven=json.loads(provider.read_text())
                if any(item.get('name')==dep['name'] and item.get('global_storage',{}).get('byte_record_schema_sha256')
                       for item in proven.get('definitions',[])):
                    missing_storage_layouts.add(dep['original_type'])
        prototype_layout_closure['requested']=sorted(set(prototype_layout_closure['requested'])|missing_storage_layouts)
    if prototype_layout_closure['requested']:
        prototype_layout_closure['queried']=True
        try:
            query=subprocess.run([frontend,*language,'-Xclang','-fdump-record-layouts-complete',
                '-fsyntax-only',*args,opt.source],cwd=root,capture_output=True,text=True,timeout=45)
            discovered=parse_clang_record_layouts(query.stdout+'\n'+query.stderr) if query.returncode==0 else {}
            prototype_layout_closure['status']='extracted' if discovered else 'unavailable'
            if discovered:
                layouts.update(discovered)
                if layout_cache:layout_cache.write_text(json.dumps(layouts,sort_keys=True),encoding='utf-8')
                # A layout cannot reconnect a detached namespace declaration.
                # Prove the original type context before replacing a register
                # facade with the owner's native contiguous record storage.
                retry_pod_record_closure(array_layouts)
                emitted,report=produce_current(ast,src,opt.source,opt.filter,include_header_inlines=opt.header_inlines,
                    project_symbols=index,record_layouts=layouts,enum_constants=enum_closure['proven_values'],
                    source_root=root,header_dependency_closure=opt.header_dependency_closure,compile_as_cpp=compile_as_cpp)
        except (subprocess.TimeoutExpired,OSError):
            prototype_layout_closure['status']='unavailable'
    outfile=opt.out_dir/Path(opt.source+'.mjs');outfile.parent.mkdir(parents=True,exist_ok=True)
    body='\n\n'.join(emitted)
    used_imports=sorted({dep for item in report if item['status']=='source-first' for dep in item.get('external_imports',[])})
    module_imports=[]
    storage_imports={item['name']:item for definition in report if definition['status']=='source-first'
                     for item in definition.get('external_storage_imports',[])}
    reference_imports={item['name']:item for definition in report if definition['status']=='source-first'
                       for item in definition.get('external_reference_imports',[])}
    for name in used_imports:
        target=(opt.import_root or opt.out_dir)/(index[name]+'.mjs')
        if opt.import_root:
            from browser_target_closure import active_exports
            binding=storage_imports.get(name,{}).get('binding',js_ident(name))
            if not target.is_file() or binding not in active_exports(target):
                raise SystemExit('Fragment import has no actual implementation: '+name)
            pointer_provider=target.with_suffix('.manifest.json')
            if not pointer_provider.is_file() or json.loads(pointer_provider.read_text()).get('native_pointer_abi')!=NATIVE_POINTER_ABI:
                raise SystemExit('Fragment provider native-pointer ABI differs: '+name)
            if name in storage_imports or name in reference_imports:
                from source_first_global_link import storage_import_error
                provider_manifest=target.with_suffix('.manifest.json')
                if not provider_manifest.is_file():raise SystemExit('Fragment storage provider lacks source proof: '+name)
                dep={**storage_imports.get(name,{}),**reference_imports.get(name,{}),'from':index[name],'native_pointer_abi':NATIVE_POINTER_ABI}
                error=storage_import_error(dep,{index[name]:{'manifest':json.loads(provider_manifest.read_text()),'module':target}})
                if error:
                    provider_doc=json.loads(provider_manifest.read_text())
                    proven=[row.get('global_storage',{}) for row in provider_doc.get('definitions',[]) if row.get('name')==name]
                    raise SystemExit('Fragment storage ABI rejected: '+name+': '+error+'\n'+json.dumps({'consumer':dep,'provider_storage':proven},sort_keys=True))
        spec=os.path.relpath(target, outfile.parent).replace(os.sep,'/')
        if not spec.startswith('.'):spec='./'+spec
        binding=storage_imports.get(name,{}).get('binding',js_ident(name))
        module_imports.append(f'import {{ {binding} }} from {json.dumps(spec)};')
    import_section='\n'.join(module_imports)+('\n\n' if module_imports else '')
    body=simplify_idempotent_casts(body)
    trivial_class_helpers=('''
function cCopyTrivialClass(value, C, fields) {
  if (!(value instanceof C)) throw new TypeError('C++ trivial class copy type mismatch');
  const copy=Object.create(C.prototype);
  for (const field of fields) copy[field]=value[field];
  return copy;
}
'''+'\n') if 'cCopyTrivialClass(' in body else ''
    lifetime_helpers=(HERE/'tools/source_cpp_lifetime_runtime.mjs').read_text(encoding='utf-8')+'\n' if 'cLifetime.' in body else ''
    overflow_helpers=('''
const cUMullOverflow = (left,right,target) => {
  const a=BigInt.asUintN(64,BigInt(left)),b=BigInt.asUintN(64,BigInt(right));
  const product=a*b,wrapped=BigInt.asUintN(64,product);
  if (target && target.__cReference===true) target.value=wrapped;
  else cDeref(target,BigUint64Array).value=wrapped;
  return product>0xffffffffffffffffn;
};
''') if 'cUMullOverflow(' in body else ''
    stack_helpers=('''
const cStackAlloc = amount => {
  if (typeof amount !== 'number' && typeof amount !== 'bigint')
    throw new TypeError('C stack allocation needs an integral byte count');
  const count=Number(amount);
  if (!Number.isSafeInteger(count) || count<0 || count>8388608)
    throw new RangeError('C stack allocation outside bounded byte extent');
  return new Uint8Array(count || 1);
};
''') if 'cStackAlloc(' in body else ''
    heap_helpers=(HERE/'tools/source_cpp_heap_runtime.mjs').read_text(encoding='utf-8')+'\n' if 'cxxHeap.' in body else ''
    atomic_helpers=(HERE/'tools/source_atomic_runtime.mjs').read_text(encoding='utf-8')+'\n' if 'cAtomic(' in body else ''
    pointer_helpers=(HERE/'tools/source_pointer_runtime.mjs').read_text(encoding='utf-8')+'\n' if atomic_helpers or any(x in body for x in ('cTypedPointer(', 'cPointerOffset(', 'cDeref(', 'cPointerCompare(', 'cPointerDiff(', 'cStaticPointer(', 'cPointerElementRef(', 'cUMullOverflow(', 'cRecordPointer(', 'cScalarStorage(', 'cAlignedStorage(')) else ''
    reference_helpers=('const cRecordObject = source => {\n'
                      +'  if (source?.__cDeferredPointer === true || source?.__cDeferredReference === true) return cRecordObject(source.resolve());\n'
                      +'  if (source?.__cReference === true) return source.value;\n'
                      +'  if (Array.isArray(source)) { if (!source.length) throw new RangeError(\"C record pointer dereferences empty array\"); return source[0]; }\n'
                      +'  if (source?.__cRecordPointer === true) return globalThis[Symbol.for("source-first.record-pointer-views/1")].deref(source);\n'
                      +'  if (source?.__cPointer === true) {\n'
                      +'    if (!source.array) throw new TypeError(\"C record pointer requires source-backed object slots\");\n'
                      +'    return cPointerElementRef(source,0).value;\n'
                      +'  }\n'
                      +'  return source;\n'
                      +'};\n'
                      +'const cStaticReference = resolve => ({ __cReference:true, __cDeferredReference:true, resolve, get value() { return resolve().value; }, set value(value) { resolve().value=value; } });\n'
                      +'const cObjectFieldRef = (owner, field) => { const storage=owner?.[Symbol.for("source-first.original-byte-record-storage/1")]; if(storage)return globalThis[Symbol.for("source-first.record-pointer-views/1")].fieldReference(owner,field); const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); };\n'
                      +'const cRef = (read, write) => ({ __cReference:true, get value() { return read(); }, set value(v) { write(v); } });\n'
                      +'const cArrayRef = (array, index) => cRef(() => array[index], v => { array[index] = v; });\n') if any(helper in body for helper in ('cRef(', 'cArrayRef(', 'cRecordObject(', 'cObjectFieldRef(', 'cStaticReference(')) else ''
    span_helpers=(HERE/'tools/source_pointer_span_runtime.mjs').read_text(encoding='utf-8')+'\n' if 'cxxPointerSpan(' in body else ''
    aggregate_helpers=(HERE/'tools/source_aggregate_runtime.mjs').read_text(encoding='utf-8')+'\n' if any(x in body for x in ('cCopyAggregate(', 'cZeroAggregate(', 'cInitByteRecord(', 'cAssignAggregate(', 'cMarkAggregate(', 'cByteRecordArray(', 'cByteRecordNDArray(', 'cRecordPointer(', 'cPointerArray(', 'cNativeArray(')) else ''
    # Embedded helpers have dependencies too: record references call
    # cPointerElementRef, and aggregate record views call cPointer. Selecting
    # helpers from original function bodies alone stranded those bindings.
    if not pointer_helpers and (reference_helpers or aggregate_helpers):
        pointer_helpers=(HERE/'tools/source_pointer_runtime.mjs').read_text(encoding='utf-8')+'\n'
    assignment_helpers=(HERE/'tools/source_aggregate_assignment_runtime.mjs').read_text(encoding='utf-8')+'\n' if 'cAssignAggregate(' in body else ''
    variadic_helpers=(HERE/'tools/source_variadic_runtime.mjs').read_text(encoding='utf-8')+'\n' if 'cVariadic.' in body else ''
    memory_helpers=(HERE/'tools/source_byte_memory_runtime.mjs').read_text(encoding='utf-8')+'\n' if 'cByteMemory.' in body else ''
    c_heap_helpers=''
    if 'cCHeap.' in body:
        # Reuse the canonical JS heap implementation, including stable borrowed
        # views during growth. Every ES module shares one source C heap.
        c_heap_helpers=((HERE/'runtime/abi.mjs').read_text(encoding='utf-8').replace('export class ABIHeap','class ABIHeap',1)
                        +'\n'+(HERE/'tools/source_c_heap_runtime.mjs').read_text(encoding='utf-8')+'\n')
    address_helpers=((HERE/'tools/source_address_runtime.mjs').read_text(encoding='utf-8').replace('export { cSourceAddresses as sourceAddressSpace };','')+'\n'
                     if pointer_helpers or aggregate_helpers or c_heap_helpers or 'cSourceAddresses.' in body else '')
    process_helpers=(HERE/'tools/source_process_runtime.mjs').read_text(encoding='utf-8')+'\n' if 'cProcess.' in body else ''
    casts={'i32':'const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;\n',
           'u32':'const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;\n',
           'i64':'const i64 = value => BigInt.asIntN(64, BigInt(value));\n',
           'u64':'const u64 = value => BigInt.asUintN(64, BigInt(value));\n',
           'i128':'const i128 = value => BigInt.asIntN(128, BigInt(value));\n',
           'u128':'const u128 = value => BigInt.asUintN(128, BigInt(value));\n'}
    casts_text=''.join(src for name,src in casts.items() if name+'(' in body)
    libm_text=''.join(src+'\n' for name,src in LIBM.items() if name+'(' in body)
    if compiler_runtime_revision()!=compiler_revision:
        raise SystemExit('Compiler/runtime inputs changed during source emission; previous output preserved. Retry under one frozen revision.')
    outfile.write_text('// Source-first C/C++ -> JavaScript (original identifiers/structured statements).\n'
                       +'// Original translation unit: '+opt.source+'\n'
                       +'// Status: partial STRICT semantic conversion, not a full engine module.\n'
                       +'// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.\n'
                       +import_section+address_helpers+c_heap_helpers+trivial_class_helpers+lifetime_helpers+heap_helpers+stack_helpers+overflow_helpers+pointer_helpers+reference_helpers+atomic_helpers+span_helpers+aggregate_helpers+assignment_helpers+variadic_helpers+memory_helpers+process_helpers+casts_text+libm_text+'\n'
                       +(BUILTIN_RUNTIME+'\n'+'\n'.join(src for key,src in BUILTIN_JS.items() if key+'(' in body)+'\n' if any(key+'(' in body for key in BUILTIN_JS) else '')+body+'\n',encoding='utf-8')
    result={'source':opt.source,'dependency_closure':closure,'enum_closure':enum_closure,'span_closure':span_closure,'typedef_closure':typedef_closure,'pod_record_closure':pod_record_closure,'friend_closure':friend_closure,'header_ctor_closure':header_ctor_closure,'member_operator_closure':member_operator_closure,'implicit_member_closure':implicit_member_closure,'lifetime_closure':lifetime_closure,'output':str(outfile),'ast_frontend':'Clang pre-optimization JSON AST','found':len(report),'emitted':sum(x['status']=='source-first' for x in report),'blocked':sum(x['status']=='blocked' for x in report),'definitions':report,'imports':[{ 'name':name,'from':index[name]} for name in used_imports],'llvm_fallback_used':False,'control_flow':{'structured_functions':sum(bool(x.get('control_flow')) for x in report if x['status']=='source-first'),'recognized_goto_functions':sum(bool(x.get('control_flow')) for x in report),'recognized_goto_edges':sum(sum(x.get('control_flow',{}).get('detected',{}).get(k,0) for k in ('forward_goto','backward_goto')) for x in report)}}
    result['toolchain']=toolchain
    result['initial_declaration_selection']='exact' if opt.exact_filter else 'clang-substring'
    result['native_pointer_abi']=NATIVE_POINTER_ABI
    if header_definition_contract:result['header_definition_contract']=header_definition_contract
    if atomic_helpers:result['source_atomic_model']='single-isolate-private-storage/1'
    result['c_allocator_declarations']=c_allocator_declarations
    result['template_destructor_closure']=template_destructor_closure
    result['prototype_layout_closure']=prototype_layout_closure
    result['filtered_c_storage_scope']=c_storage_scope_report
    result['compiler_runtime_input_sha256']=compiler_revision
    result['compiler_runtime_inputs_unchanged']=True
    if standard_heap_contract:result['standard_heap_contract']=standard_heap_contract
    result['record_layout_extraction']={'explicitly_required':opt.require_record_layouts,
        'records':len(layouts),'sha256':hashlib.sha256(json.dumps(layouts,sort_keys=True).encode()).hexdigest()}
    if opt.import_root:result['module_fragment']={'import_root':str(opt.import_root.resolve()),'provider_exports_and_storage_abi_verified':True}
    result['full_type_closure']=full_type_closure
    result['dependency_layout_closure']=dependency_layout_closure
    result['ast_cache_inputs']=ast_cache_inputs
    result['ast_decode']=ast_decode
    result['storage_exports']=[{'name':item['name'],**item['global_storage']} for item in report
                               if item['status']=='source-first' and item.get('global_storage')]
    result['private_storage_exports']=[{'name':item['name'],**item['private_storage']} for item in report
                               if item['status']=='source-first' and item.get('private_storage')]
    for dep in result['imports']:
        dep['native_pointer_abi']=NATIVE_POINTER_ABI
        if dep['name'] in storage_imports:dep.update(storage_imports[dep['name']])
        if dep['name'] in reference_imports:dep.update(reference_imports[dep['name']])
    if result['emitted']==0:
        outfile.unlink(missing_ok=True)
        result['output']=None
    mf=outfile.with_suffix('.manifest.json');mf.write_text(json.dumps(result,indent=2))
    print(json.dumps({'file':str(outfile),'found':result['found'],'emitted':result['emitted'],'blocked':result['blocked'],'manifest':str(mf)},indent=2))
if __name__=='__main__':main()
