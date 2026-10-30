"""Clang-proven numeric POD object representations, including overlapping unions.

No offset is computed here: every subobject offset and total extent must be
present in the same target's Clang record-layout dump. Borrowed pointer slots
retain identity in the checked LP64 representation. Reference,
inheritance, and nontrivial-lifetime records remain unsupported.
"""
import re
from pathlib import Path
from source_scalar_types import scalar_info


def children(node):
    return [item for item in node.get('inner', []) if item]


def descendants(node):
    yield node
    for item in children(node):
        yield from descendants(item)


def clean_type(spelling):
    spelling = re.sub(r'\b(?:const|volatile|restrict|__restrict)\b', '', spelling)
    spelling = re.sub(r'^(?:struct|class|union)\s+', '', spelling.strip())
    spelling = re.sub(r'\b_Bool\b','bool',spelling)
    return re.sub(r'\s*\[\s*(\d+)\s*\]', r'[\1]', spelling)


def cpp_layout_type(spelling):
    """Normalize Clang's two spellings of an empty C++ parameter list.

    The AST spells an original ``int (*)(void)`` as ``int (*)()`` while its
    record-layout printer retains ``(void)``. Both denote the same function
    prototype in C++. This extractor accepts CXXRecordDecls only; do not use
    this equivalence for old-style C function declarations. No parameter or
    return type, calling convention, pointer layer or qualifier is inferred.
    """
    return re.sub(r'\(\s*void\s*\)', '()', clean_type(spelling))


def anonymous_location(spelling):
    found = re.search(r'\((?:anonymous|unnamed)(?: (?:struct|class|union))? at (.+)\)', spelling)
    return found.group(1).replace('\\', '/') if found else None

def typedef_record_layouts(ast,layouts,source_root):
    """Prove sizeof/alignof aliases independently of object-storage support.

    Nontrivial members do not make an enclosing sizeof unknown. Join only a
    direct Clang-owned anonymous tag, its original physical tokens, and an
    actual target layout. This never fabricates a constructor or field schema.
    """
    if not source_root:return {}
    root=Path(source_root).resolve();records={};typedefs=[];files={};locations=[]
    def visit(node,scope=()):
        if node.get('kind')=='NamespaceDecl' and node.get('name'):scope=(*scope,node['name'])
        if node.get('kind') in ('RecordDecl','CXXRecordDecl') and node.get('completeDefinition'):
            records[node.get('id')]=node
        if node.get('kind')=='TypedefDecl' and node.get('name'):
            for child in children(node):
                owner=child.get('ownedTagDecl',{})
                if not owner and child.get('kind')=='RecordType' and child.get('isTagOwned') is True:owner=child.get('decl',{})
                if owner.get('id'):typedefs.append((node,owner['id'],scope))
        for child in children(node):visit(child,scope)
    for tree in ast:visit(tree)
    for name,layout in layouts.items():
        physical=anonymous_location(name);match=re.fullmatch(r'(.+):(\d+):(\d+)',physical or '')
        if not match:continue
        path=Path(match[1]);path=(path if path.is_absolute() else root/path).resolve()
        if not path.is_relative_to(root) or not path.is_file():continue
        if path not in files:files[path]=path.read_bytes()
        lines=files[path].splitlines(keepends=True);line,col=int(match[2]),int(match[3])
        if 1<=line<=len(lines) and 1<=col<=len(lines[line-1]):
            locations.append((path,sum(map(len,lines[:line-1]))+col-1,layout))
    aliases={};alias_owners={};ambiguous=set()
    for declaration,identity,scope in typedefs:
        record=records.get(identity)
        if not record or record.get('name'):continue
        tag_location=record.get('loc',{});alias_location=declaration.get('loc',{})
        offset=tag_location.get('offset');alias_offset=alias_location.get('offset');name=declaration['name']
        token=record.get('tagUsed','').encode()
        if not isinstance(offset,int) or not isinstance(alias_offset,int) or not token:continue
        matches={}
        for path,position,layout in locations:
            if position!=offset:continue
            data=files[path]
            if data[offset:offset+len(token)]!=token or data[alias_offset:alias_offset+len(name)]!=name.encode():continue
            physical=tag_location.get('file') or alias_location.get('file')
            if physical:
                actual=Path(physical);actual=(actual if actual.is_absolute() else root/actual).resolve()
                if actual!=path:continue
            key=(path,position)
            if key in matches and matches[key]!=layout:matches[key]=None
            else:matches[key]=layout
        if len(matches)!=1 or next(iter(matches.values())) is None:continue
        layout=next(iter(matches.values()))
        physical_owner=(*next(iter(matches)),alias_offset)
        for alias in {name,'::'.join((*scope,name))}:
            if alias in alias_owners and alias_owners[alias]!=physical_owner:ambiguous.add(alias)
            elif alias in aliases and aliases[alias]!=layout:ambiguous.add(alias)
            elif alias in layouts and layouts[alias]!=layout:ambiguous.add(alias)
            else:aliases[alias]=layout;alias_owners[alias]=physical_owner
    return {name:layout for name,layout in aliases.items() if name not in ambiguous}


def owned_anonymous_record_members(node,source_root=None):
    """Join a member's exact anonymous type location to its lexical child tag."""
    fields=[item for item in children(node) if item.get('kind')=='FieldDecl']
    nested=[item for item in children(node) if item.get('kind')=='CXXRecordDecl'
            and item.get('completeDefinition') and not item.get('name')]
    result={}
    source=Path(source_root).resolve() if source_root else None
    for field in fields:
        physical=anonymous_location(field.get('type',{}).get('qualType',''))
        location=re.fullmatch(r'(.+):(\d+):(\d+)',physical or '')
        if not location:continue
        matches=[]
        for record in nested:
            loc=record.get('loc',{})
            same_offset=(isinstance(loc.get('offset'),int) and
                         loc['offset']==field.get('loc',{}).get('offset'))
            same_location=(loc.get('line')==int(location[2]) and loc.get('col')==int(location[3]))
            if not same_offset and not same_location and source and isinstance(loc.get('offset'),int):
                path=Path(location[1]);path=(path if path.is_absolute() else source/path).resolve()
                if path.is_relative_to(source) and path.is_file():
                    lines=path.read_bytes().splitlines(keepends=True)
                    line,col=int(location[2]),int(location[3])
                    if 1<=line<=len(lines) and 1<=col<=len(lines[line-1]):
                        physical_offset=sum(map(len,lines[:line-1]))+col-1
                        token=record.get('tagUsed','').encode()
                        same_location=(physical_offset==loc['offset'] and bool(token)
                            and lines[line-1][col-1:col-1+len(token)]==token)
            if not same_offset and not same_location:continue
            if loc.get('file') and loc['file'].replace('\\','/')!=location[1]:continue
            matches.append(record)
        if len(matches)==1:result[field.get('id')]=matches[0]
    return result


def recover_byte_records(ast, layouts, aliases, source_root=None, layout_aliases=None):
    """Return records and exact anonymous FieldDecl-ID -> JS-property bindings.

    Spellings are accepted only when they identify one physical declaration.
    Anonymous child record spellings come from their enclosing FieldDecl;
    they are never reconstructed from a guessed size or a source type name.
    """
    records = {}
    names = {}
    record_spellings = {}
    field_names = {}
    field_records = {}
    template_scopes = {}

    def register(record, spellings):
        identity = record.get('id')
        if not identity:
            return
        records[identity] = record
        for spelling in spellings:
            if spelling:
                names.setdefault(clean_type(spelling), set()).add(identity)
                record_spellings.setdefault(identity,set()).add(clean_type(spelling))

    def visit(node, parents=(), template_scope=None):
        if node.get('kind')=='NamespaceDecl' and node.get('name'):
            parents=(*parents,node['name'])
        if node.get('kind') == 'CXXRecordDecl' and node.get('completeDefinition'):
            name = node.get('name')
            own_names = [name, '::'.join((*parents, name))] if name else []
            # Concrete template records are normalized to stable JS names by
            # source_header_records. The SAME Clang declaration retains its
            # exact source specialization spelling; layout dumps use that
            # spelling, not the generated JS identifier.
            if node.get('_source_record_name'):
                own_names.append(node['_source_record_name'])
                template_scope='::'.join((*parents,node['_source_record_name']))
            template_scopes[node.get('id')]=template_scope
            register(node, own_names)
            fields = [x for x in children(node) if x.get('kind') == 'FieldDecl']
            nested = [x for x in children(node) if x.get('kind') == 'CXXRecordDecl'
                      and x.get('completeDefinition') and not x.get('name')]
            members=owned_anonymous_record_members(node,source_root)
            for field in fields:
                child=members.get(field.get('id'))
                if child is not None:
                    field_records[field.get('id')]=child.get('id')
                    register(child,[field.get('type',{}).get('qualType','')])
            for index, field in enumerate(fields):
                if not field.get('name') and field.get('isImplicit') and anonymous_location(
                        field.get('type', {}).get('qualType', '')):
                    field_names[field['id']] = '__cxx_anonymous_' + str(index)
            if name:
                parents = (*parents, node.get('_source_record_name',name))
        for child in children(node):
            visit(child, parents,template_scope)

    for root in ast:
        visit(root)
    # A typedef's owned tag is an additional exact declaration spelling.
    for root in ast:
        for node in descendants(root):
            if node.get('kind') not in ('TypedefDecl', 'TypeAliasDecl') or not node.get('name'):
                continue
            spelling=clean_type(node.get('type',{}).get('desugaredQualType') or node.get('type',{}).get('qualType',''))
            visited=set()
            while spelling in aliases and spelling not in visited:
                visited.add(spelling);spelling=clean_type(aliases[spelling])
            if any(token in spelling for token in ('*','&','[','(')):
                continue  # A pointer/array typedef does not own its pointee tag.
            for item in descendants(node):
                tag = item.get('ownedTagDecl', {}) or item.get('decl', {})
                if tag.get('id') in records:
                    names.setdefault(node['name'], set()).add(tag['id'])

    # Clang may omit an anonymous typedef tag's repeated filename. Its exact
    # layout still records physical file:line:column. Join only original
    # source files whose bytes prove the SAME AST offset and tag token; do
    # not infer a layout from the typedef name or from its fields.
    physical_layouts={}
    physical_proofs={}
    source=Path(source_root).resolve() if source_root else None
    source_bytes={}
    if source:
        for spelling,layout in layouts.items():
            physical=anonymous_location(spelling)
            match=re.fullmatch(r'(.+):(\d+):(\d+)',physical or '')
            if not match:continue
            path=Path(match[1]);path=(path if path.is_absolute() else source/path).resolve()
            if not path.is_relative_to(source) or not path.is_file():continue
            if path not in source_bytes:source_bytes[path]=path.read_bytes().splitlines(keepends=True)
            lines=source_bytes[path];line,col=int(match[2]),int(match[3])
            if not (1<=line<=len(lines) and 1<=col<=len(lines[line-1])):continue
            offset=sum(map(len,lines[:line-1]))+col-1
            token=re.match(rb'(struct|class|union)\b',lines[line-1][col-1:])
            if not token:continue
            physical_layouts.setdefault(offset,[]).append((path,line,col,token[1].decode(),spelling))
        for identity,record in records.items():
            if record.get('name'):continue
            loc=record.get('loc',{});scope=template_scopes.get(identity)
            explicit=loc.get('file')
            if explicit:
                explicit=Path(explicit);explicit=(explicit if explicit.is_absolute() else source/explicit).resolve()
            matched=[]
            for path,line,col,tag,spelling in physical_layouts.get(loc.get('offset'),[]):
                if tag!=record.get('tagUsed') or explicit and path!=explicit:continue
                if loc.get('line') and loc['line']!=line or loc.get('col') and loc['col']!=col:continue
                if scope and not clean_type(spelling).startswith(scope+'::'):continue
                matched.append(spelling)
            # Multiple spelling aliases of one exact layout are acceptable;
            # different original layouts or physical declarations are not.
            physicals={anonymous_location(value) for value in matched}
            schemas={repr(layouts[value]) for value in matched}
            if len(physicals)==1 and len(schemas)==1:
                physical_proofs[identity]=next(iter(physicals))
                for spelling in matched:register(record,[spelling])

    def declaration_shape(value):
        # Clang query-local IDs and use markers differ between independent
        # dumps of the SAME declaration. Keep every semantic field, attribute,
        # constructor, initializer and trait; never deduplicate by field names.
        if isinstance(value,dict):
            return {key:declaration_shape(item) for key,item in value.items()
                    if key not in ('id','loc','range','typeAliasDeclId','previousDecl',
                                   'parentDeclContextId','isReferenced','isUsed')}
        if isinstance(value,list):return [declaration_shape(item) for item in value]
        return value

    unique = {}
    for name,ids in names.items():
        ordered=sorted(ids)
        if len(ordered)==1:
            unique[name]=ordered[0];continue
        # Only anonymous tags with a source-byte-verified physical layout can
        # be reconciled here. An ambiguous tag in another header, an unknown
        # location, or a changed declaration remains unresolved.
        if (all(not records[identity].get('name') for identity in ordered)
                and all(identity in physical_proofs for identity in ordered)
                and len({physical_proofs[identity] for identity in ordered})==1
                and all(declaration_shape(records[identity])==declaration_shape(records[ordered[0]])
                        for identity in ordered[1:])):
            unique[name]=ordered[0]
    by_id_names = {}
    for name, identity in unique.items():
        by_id_names.setdefault(identity, []).append(name)
    native = {
        'char': ('Uint8Array', 1), 'unsigned char': ('Uint8Array', 1),
        'signed char': ('Int8Array', 1), 'short': ('Int16Array', 2),
        'unsigned short': ('Uint16Array', 2), 'int': ('Int32Array', 4),
        'unsigned int': ('Uint32Array', 4), 'float': ('Float32Array', 4),
        'double': ('Float64Array', 8), 'long long': ('BigInt64Array', 8),
        'unsigned long long': ('BigUint64Array', 8),
        # The source compiler's checked target contract is x86-64 LP64.
        'long': ('BigInt64Array', 8), 'unsigned long': ('BigUint64Array', 8),
        # stdint fixed-width types are ABI-guaranteed widths, not guesses
        # about host C `int` or `long`. Clang's source header provides the
        # exact underlying type; the spelling preserves sign and width.
        'int8_t': ('Int8Array', 1), 'uint8_t': ('Uint8Array', 1),
        'int16_t': ('Int16Array', 2), 'uint16_t': ('Uint16Array', 2),
        'int32_t': ('Int32Array', 4), 'uint32_t': ('Uint32Array', 4),
        'int64_t': ('BigInt64Array', 8), 'uint64_t': ('BigUint64Array', 8),
    }
    active = set()
    cached = {}

    def build(identity):
        if identity in cached:
            return cached[identity]
        if identity in active:
            return None
        active.add(identity)
        record = records[identity]
        traits = record.get('definitionData', {})
        valid = (traits.get('isStandardLayout') is True and
                 traits.get('isTriviallyCopyable') is True and
                 traits.get('isAggregate') is True and not record.get('bases') and
                 traits.get('defaultCtor', {}).get('trivial') is True and
                 traits.get('dtor', {}).get('trivial') is True)
        methods = [child for child in children(record)
                   if child.get('kind') in ('CXXMethodDecl','CXXConversionDecl')
                   and not child.get('isImplicit') and
                   any(item.get('kind')=='CompoundStmt' for item in children(child))]
        # Authored nonvirtual methods do not change trivial object storage.
        # Preserve their ORIGINAL class provider in the schema; emission must
        # link and install that prototype on every byte-backed view, including
        # nested vector alternatives. Never recover storage by dropping methods.
        if methods and (not record.get('name') or
                        any(child.get('virtual') or child.get('pure') for child in methods)):
            valid = False
        evidence = [layouts[name] for name in by_id_names.get(identity, [])
                    if name in layouts and 'fields' in layouts[name]]
        # Anonymous physical names have a different enclosing scope spelling
        # in the AST and layout dump, but the exact file:line:column is shared.
        physical = {anonymous_location(name) for name in record_spellings.get(identity, [])}
        physical.discard(None)
        if physical:
            evidence += [layout for name, layout in layouts.items()
                         if anonymous_location(name) in physical and 'fields' in layout
                         and (not template_scopes.get(identity) or
                              clean_type(name).startswith(template_scopes[identity]+'::'))]
        unique_layouts = {repr(layout): layout for layout in evidence}
        layout = next(iter(unique_layouts.values())) if len(unique_layouts) == 1 else None
        fields = [x for x in children(record) if x.get('kind') == 'FieldDecl']
        if record.get('tagUsed')=='union':
            pointer_members=[]
            for field in fields:
                spelling=clean_type(field.get('type',{}).get('desugaredQualType') or field.get('type',{}).get('qualType',''))
                seen=set()
                while spelling in aliases and spelling not in seen:
                    seen.add(spelling);spelling=clean_type(aliases[spelling])
                pointer_members.append('*' in spelling)
            # Reinterpreting integers as pointers needs a complete integer
            # address-space model. Identity-preserving borrowed pointer slots
            # authorize pointer-only alternatives, never mixed numeric unions.
            if any(pointer_members) and not all(pointer_members):valid=False
        if not valid or not layout or not fields or not (0 < layout['size'] <= 1048576):
            active.remove(identity)
            cached[identity] = None
            return None
        if len(fields) != len(layout['fields']):
            active.remove(identity)
            cached[identity] = None
            return None
        result = {'size': layout['size'], 'align': layout['align'],
                  'union': record.get('tagUsed') == 'union', 'fields': {},
                  'arrayAlign': 1}
        if methods:result['prototype']=record['name']
        overlaps = result['union']
        for field, offset in zip(fields, layout['fields']):
            name = field.get('name') or field_names.get(field.get('id'))
            typ = field.get('type', {}).get('desugaredQualType') or field.get('type', {}).get('qualType', '')
            # The physical name and declared field type must also agree with
            # the corresponding direct field in Clang's layout, in AST order.
            declared = clean_type(field.get('type', {}).get('qualType', ''))
            layout_field = offset['declaration']
            if name and field.get('name'):
                if not layout_field.endswith(' ' + field['name']):
                    valid = False
                    break
                layout_field = layout_field[:-(len(field['name']) + 1)]
            elif not name and not field.get('isBitfield'):
                valid = False
                break
            same_anonymous = (anonymous_location(layout_field) is not None and
                              anonymous_location(layout_field) == anonymous_location(declared))
            if cpp_layout_type(layout_field) != cpp_layout_type(declared) and not same_anonymous:
                # Clang's layout dump desugars integral typedefs.
                resolved = declared
                seen = set()
                while resolved in aliases and resolved not in seen:
                    seen.add(resolved)
                    resolved = clean_type(aliases[resolved])
                if (cpp_layout_type(layout_field) != cpp_layout_type(typ) and
                        cpp_layout_type(layout_field) != cpp_layout_type(resolved)):
                    valid = False
                    break
            if field.get('mutable') or field.get('hasInClassInitializer'):
                valid = False
                break
            typ = clean_type(typ)
            dims = [int(x) for x in re.findall(r'\[(\d+)\]', typ)]
            base = re.sub(r'\[\d+\]', '', typ).strip()
            seen = set()
            while base in aliases and base not in seen:
                seen.add(base)
                base = clean_type(aliases[base])
            if field.get('isBitfield'):
                width=offset.get('bit_width');start=offset.get('bit_start');primitive=scalar_info(base)
                constants=[child for child in children(field) if child.get('kind')=='ConstantExpr' and child.get('value') is not None]
                if (len(constants)!=1 or not isinstance(width,int) or not isinstance(start,int)
                    or int(constants[0]['value'])!=width or start<0 or start>7 or width<0
                    or not primitive or primitive[0] not in ('integer','boolean')
                    or primitive[1]>8 or width>primitive[1]*8 or primitive[0]=='boolean' and width>1):
                    valid=False;break
                # Unnamed fields reserve original padding but expose no lvalue.
                if not name:continue
                if width==0:valid=False;break
                size=(start+width+7)//8
                item={'bitfield':{'start':start,'width':width,
                    'signed':primitive[0]=='integer' and not primitive[2],
                    'wide':primitive[0]=='integer' and primitive[1]==8,
                    'boolean':primitive[0]=='boolean'},'size':size}
            elif dims and len(dims)<=8 and '*' in base and '&' not in base:
                count=1
                for dimension in dims:count*=dimension
                size=count*8
                if any(d<1 for d in dims) or size>1048576 or offset['offset']%8:
                    valid=False;break
                item={'pointerArray':True,'dims':dims,'size':size}
                result['arrayAlign']=max(result['arrayAlign'],8)
            elif not dims and '*' in base and '&' not in base:
                # This extractor shares the compiler's verified x86-64 LP64
                # target contract. The runtime stores an owned pointer identity
                # in these eight bytes; it never serializes a JS object string.
                item={'pointer':True,'size':8}
                size=8
            elif base in native and len(dims) <= 8:
                ctor, width = native[base]
                length = 1
                for dimension in dims:length*=dimension
                size = length * width
                if length < 1 or any(d<1 for d in dims) or size > 1048576 or (dims and offset['offset'] % width):
                    valid = False
                    break
                item = {'native': ctor, 'size': size}
                if dims:
                    if len(dims)==1:item['length'] = length
                    else:item['nativeArray']=ctor;item['dims']=dims
                    result['arrayAlign'] = max(result['arrayAlign'],width)
            elif len(dims)<=8 and (field.get('id') in field_records or base in unique):
                # A template's anonymous type text can be identical across
                # specializations. Its direct lexical AST owner is exact and
                # wins over an intentionally ambiguous global name lookup.
                child_schema = build(field_records.get(field.get('id')) or unique[base])
                if not child_schema:
                    valid = False
                    break
                item = {'recordArray':child_schema,'dims':dims} if dims else {'byteRecord':child_schema}
                size=child_schema['size']
                for dimension in dims:size*=dimension
                if dims:item['size']=size
                if any(d<1 for d in dims) or size>1048576:
                    valid=False;break
                # A packed parent can place an otherwise aligned child at an
                # unaligned address. DataView scalars support that layout;
                # TypedArray subobjects cannot, so retain the blocker.
                if offset['offset'] % child_schema['arrayAlign']:
                    valid = False
                    break
                result['arrayAlign'] = max(result['arrayAlign'],child_schema['arrayAlign'])
                overlaps = overlaps or child_schema['overlaps']
            else:
                valid = False
                break
            if offset['offset'] < 0 or offset['offset'] + size > layout['size']:
                valid = False
                break
            result['fields'][name] = {'offset': offset['offset'], **item}
        def storage_kinds(schema):
            kinds=set()
            for field in schema['fields'].values():
                if field.get('pointer') or field.get('pointerArray'):kinds.add('pointer')
                elif field.get('byteRecord') or field.get('recordArray'):
                    kinds.update(storage_kinds(field.get('byteRecord') or field['recordArray']))
                else:kinds.add('numeric')
            return kinds
        # A pointer hidden in a nested aggregate/array is still a pointer
        # object representation. Do not let that nesting bypass the existing
        # rejection of unions that reinterpret pointers as integer bits.
        if result['union'] and storage_kinds(result)=={'pointer','numeric'}:valid=False
        result['overlaps'] = overlaps
        active.remove(identity)
        cached[identity] = result if valid else None
        return cached[identity]

    recovered = {}
    anonymous_types={}
    conflicting_types=set()
    for record in records.values():
        for field in children(record):
            if field.get('id') not in field_names:continue
            spelling=clean_type(field.get('type',{}).get('qualType',''))
            target=field_names[field['id']]
            if spelling in anonymous_types and anonymous_types[spelling]!=target:conflicting_types.add(spelling)
            anonymous_types[spelling]=target
    for spelling in conflicting_types:anonymous_types.pop(spelling,None)
    for name, identity in unique.items():
        schema = build(identity)
        if schema and layout_aliases is not None:
            # Owned typedefs use the same verified extent as their actual tag.
            layout_aliases.setdefault(name,{'size':schema['size'],'align':schema['align']})
        if schema:
            original=records[identity]
            traits=original.get('definitionData',{})
            recovered[name] = {'byte_schema': schema, 'copyable': True,
                               'moveable': True, 'union': schema['union'],
                               'anonymous_typedef':not original.get('name'),
                               'trivial_default_constructor':traits.get('defaultCtor',{}).get('trivial') is True,
                               'trivial_destructor':traits.get('dtor',{}).get('trivial') is True,
                               'anonymous_members': field_names,
                               'anonymous_member_types':anonymous_types}
    return recovered
