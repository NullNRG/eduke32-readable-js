"""Clang-proven numeric POD object representations, including overlapping unions.

No offset is computed here: every subobject offset and total extent must be
present in the same target's Clang record-layout dump. Borrowed pointer slots
retain identity in the checked LP64 representation. Scalar lvalue reference
members retain original cells in Clang-proven address slots. Inheritance and
nontrivial-lifetime C++ value operations remain unsupported.
Separate field-only projections can borrow existing nonvirtual objects with
Clang-proven subobjects. One nonvirtual base at offset zero is supported for
these views only; construction, assignment, copying and destruction stay separate.
C records have no constructors or destructors; fields still need Clang layouts.
"""
import re
from functools import lru_cache
from pathlib import Path
from source_scalar_types import scalar_info
from source_cpp_types import has_outer_indirection


def children(node):
    return [item for item in node.get('inner', []) if item]


def descendants(node):
    yield node
    for item in children(node):
        yield from descendants(item)


@lru_cache(maxsize=8192)
def clean_type(spelling):
    spelling = re.sub(r'\b(?:const|volatile|restrict|__restrict)\b', '', spelling)
    spelling = re.sub(r'^(?:struct|class|union)\s+', '', spelling.strip())
    spelling = re.sub(r'\b_Bool\b','bool',spelling)
    return re.sub(r'\s*\[\s*(\d+)\s*\]', r'[\1]', spelling)


@lru_cache(maxsize=8192)
def cpp_layout_type(spelling):
    """Normalize Clang's two spellings of an empty C++ parameter list.

    The AST spells an original ``int (*)(void)`` as ``int (*)()`` while its
    record-layout printer retains ``(void)``. Both denote the same function
    prototype in C++. This extractor accepts CXXRecordDecls only; do not use
    this equivalence for old-style C function declarations. No parameter or
    return type, calling convention, pointer layer or qualifier is inferred.
    """
    spelling=clean_type(spelling)
    # Layout dumps retain elaborated tags inside template arguments while
    # the C++ AST omits them. These are the same C++ type spelling; preserve
    # all namespace, specialization arguments and pointer/reference layers.
    spelling=re.sub(r'([<,]\s*)(?:struct|class|union|enum)\s+',r'\1',spelling)
    return re.sub(r'\(\s*void\s*\)', '()', spelling)


def anonymous_location(spelling):
    found = re.search(r'\((?:anonymous|unnamed)(?: (?:struct|class|union))? at (.+)\)', spelling)
    return found.group(1).replace('\\', '/') if found else None


def anonymous_layout_spelling(spelling):
    """Keep the native enclosing owner while normalizing Clang's tag printer.

    A multiply included header can declare several anonymous tags at the SAME
    physical location. The complete enclosing typedef/template scope remains
    part of their identity; a location-only join must not mix those layouts.
    """
    spelling=cpp_layout_type(spelling)
    return re.sub(r'\((?:anonymous|unnamed)(?: (?:struct|class|union))? at ',
                  '(anonymous at ',spelling)


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
        expansion=tag_location.get('expansionLoc',{})
        spelling=tag_location.get('spellingLoc',{})
        macro=(offset is None and expansion.get('isMacroArgExpansion') is True)
        layout_offset=expansion.get('offset') if macro else offset
        if macro:offset=spelling.get('offset')
        if not all(isinstance(value,int) for value in (offset,layout_offset,alias_offset)) or not token:continue
        matches={}
        for path,position,layout in locations:
            if position!=layout_offset:continue
            data=files[path]
            if data[offset:offset+len(token)]!=token or data[alias_offset:alias_offset+len(name)]!=name.encode():continue
            if macro:
                # Clang prints the macro expansion's location for this tag,
                # while the actual struct token is a spelled macro argument.
                # Prove both original tokens in one physical source file;
                # generated tags, scratch buffers and object-like macros stay
                # outside this source-byte join.
                length=expansion.get('tokLen')
                if (not isinstance(length,int) or not 0<=layout_offset<offset<alias_offset or
                        not re.fullmatch(rb'[A-Za-z_]\w*',data[layout_offset:layout_offset+length]) or
                        not re.match(rb'\s*\(',data[layout_offset+length:])):continue
                explicit=[location.get('file') for location in (spelling,expansion,alias_location) if location.get('file')]
                if any((Path(value) if Path(value).is_absolute() else root/value).resolve()!=path for value in explicit):continue
            physical=tag_location.get('file') or spelling.get('file') or alias_location.get('file')
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
    nested=[item for item in children(node) if item.get('kind') in ('RecordDecl','CXXRecordDecl')
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


def recover_byte_records(ast, layouts, aliases, source_root=None, layout_aliases=None, *, storage_views=False, source_rel=None):
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
        if node.get('kind') in ('RecordDecl','CXXRecordDecl') and node.get('completeDefinition'):
            name = node.get('name')
            own_names = [name, '::'.join((*parents, name))] if name else []
            # Concrete template records are normalized to stable JS names by
            # source_header_records. The SAME Clang declaration retains its
            # exact source specialization spelling; layout dumps use that
            # spelling, not the generated JS identifier.
            if node.get('_source_record_name'):
                own_names.append(node['_source_record_name'])
                own_names.append(node.get('_source_record_qualified_name'))
                own_names.extend(node.get('_source_self_type_spellings',[]))
                template_scope='::'.join((*parents,node['_source_record_name']))
            template_scopes[node.get('id')]=template_scope
            register(node, own_names)
            fields = [x for x in children(node) if x.get('kind') == 'FieldDecl']
            nested = [x for x in children(node) if x.get('kind') in ('RecordDecl','CXXRecordDecl')
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

    # Macro-argument typedefs can acquire a typedef name in finalized layout
    # dumps. Reconcile repeated AST tags only when BOTH the spelled tag and
    # its invoking macro, plus the original typedef token, agree in one file.
    macro_typedef_proofs={}
    if source_root:
        root=Path(source_root).resolve()
        # One immutable invocation snapshot. Hundreds of elided typedef paths
        # must not reread every original header on every declaration. This is
        # deliberately local, so the next compile observes changed source.
        header_candidates=None
        source_bytes={}
        def original_bytes(path):
            if path not in source_bytes:source_bytes[path]=path.read_bytes()
            return source_bytes[path]
        for tree in ast:
            for declaration in descendants(tree):
                if declaration.get('kind')!='TypedefDecl' or not declaration.get('name'):continue
                name=declaration['name'];alias_loc=declaration.get('loc',{});alias_offset=alias_loc.get('offset')
                ids={part.get('ownedTagDecl',{}).get('id') or part.get('decl',{}).get('id')
                     for part in descendants(declaration) if part.get('ownedTagDecl') or
                     part.get('kind')=='RecordType' and part.get('isTagOwned') is True}
                ids.discard(None)
                if len(ids)!=1:continue
                identity=next(iter(ids));record=records.get(identity,{})
                loc=record.get('loc',{});expanded=loc.get('expansionLoc',{})
                macro=expanded.get('isMacroArgExpansion') is True
                spelled=loc.get('spellingLoc',{}) if macro else loc
                offset=spelled.get('offset');start=expanded.get('offset') if macro else offset
                length=expanded.get('tokLen') if macro else spelled.get('tokLen')
                if (record.get('name') or not all(isinstance(value,int) for value in (offset,start,length,alias_offset)) or
                        not 0<=offset<alias_offset or macro and not 0<=start<offset):continue
                physical=spelled.get('file') or expanded.get('file') or alias_loc.get('file')
                if not physical and source_rel and not any(value.get('includedFrom') for value in (spelled,expanded,alias_loc)):
                    physical=source_rel
                tag=record.get('tagUsed','').encode()
                if not tag:continue
                if not physical:
                    # Elided header filenames require a unique pair of exact
                    # original tag/alias tokens. Never use includedFrom as the
                    # physical declaration's path.
                    matches=[]
                    if header_candidates is None:
                        header_candidates=[candidate for candidate in root.rglob('*')
                            if candidate.suffix.lower() in ('.h','.hpp','.hh','.hxx') and candidate.is_file()]
                    for candidate in header_candidates:
                        raw=original_bytes(candidate)
                        if raw[offset:offset+len(tag)]==tag and raw[alias_offset:alias_offset+len(name)]==name.encode():matches.append(candidate)
                        if len(matches)>1:break
                    if len(matches)!=1:continue
                    physical=matches[0]
                path=Path(physical);path=(path if path.is_absolute() else root/path).resolve()
                if not path.is_relative_to(root) or not path.is_file():continue
                raw=original_bytes(path)
                if raw[offset:offset+len(tag)]!=tag or raw[alias_offset:alias_offset+len(name)]!=name.encode():continue
                if macro and (not re.fullmatch(rb'[A-Za-z_]\w*',raw[start:start+length]) or not re.match(rb'\s*\(',raw[start+length:])):continue
                explicit=[value.get('file') for value in (spelled,expanded,alias_loc) if value.get('file')]
                if any((Path(value) if Path(value).is_absolute() else root/value).resolve()!=path for value in explicit):continue
                proof=(path,offset,start)
                if identity in macro_typedef_proofs and macro_typedef_proofs[identity]!=proof:
                    macro_typedef_proofs[identity]=None
                else:macro_typedef_proofs[identity]=proof

    # Clang may omit an anonymous typedef tag's repeated filename. Its exact
    # layout still records physical file:line:column. Join only original
    # source files whose bytes prove the SAME AST offset and tag token; do
    # not infer a layout from the typedef name or from its fields.
    physical_layouts={}
    physical_proofs={identity:proof for identity,proof in macro_typedef_proofs.items() if proof is not None}
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
            # An anonymous macro-argument tag is printed at its invocation.
            # Keep that candidate, but accept it only through the explicit
            # spelled/expanded source-byte proof below.
            physical_layouts.setdefault(offset,[]).append((path,line,col,token[1].decode() if token else None,spelling))
        for identity,record in records.items():
            if record.get('name'):continue
            loc=record.get('loc',{});scope=template_scopes.get(identity)
            explicit=loc.get('file')
            if explicit:
                explicit=Path(explicit);explicit=(explicit if explicit.is_absolute() else source/explicit).resolve()
            expansion=loc.get('expansionLoc',{});spelled=loc.get('spellingLoc',{})
            macro=loc.get('offset') is None and expansion.get('isMacroArgExpansion') is True
            position=expansion if macro else loc
            matched=[]
            for path,line,col,tag,spelling in physical_layouts.get(position.get('offset'),[]):
                if explicit and path!=explicit:continue
                if macro:
                    raw=path.read_bytes();start=expansion.get('offset');offset=spelled.get('offset');length=expansion.get('tokLen')
                    original_tag=record.get('tagUsed','').encode()
                    if (not all(isinstance(value,int) for value in (start,offset,length)) or not 0<=start<offset or
                            not original_tag or raw[offset:offset+len(original_tag)]!=original_tag or
                            not re.fullmatch(rb'[A-Za-z_]\w*',raw[start:start+length]) or
                            not re.match(rb'\s*\(',raw[start+length:])):continue
                    files=[value.get('file') for value in (spelled,expansion) if value.get('file')]
                    if any((Path(value) if Path(value).is_absolute() else source/value).resolve()!=path for value in files):continue
                elif tag!=record.get('tagUsed'):continue
                if position.get('line') and position['line']!=line or position.get('col') and position['col']!=col:continue
                if scope and not clean_type(spelling).startswith(scope+'::'):continue
                matched.append(spelling)
            # Multiple spelling aliases of one exact layout are acceptable;
            # different original layouts or physical declarations are not.
            physicals={anonymous_location(value) for value in matched}
            schemas={repr(layouts[value]) for value in matched}
            if len(physicals)==1 and len(schemas)==1:
                physical_proofs[identity]=next(iter(physicals))
                for spelling in matched:register(record,[spelling])

    # Clang versions spell local anonymous types differently in AST and
    # layout dumps ("(unnamed union at ...)" versus "union (unnamed at ...)").
    # Join only a single token/offset-proven original declaration. Multiple
    # template specializations at the same source location remain ambiguous.
    if source:
        proven_locations={}
        def physical_key(spelling):
            match=re.fullmatch(r'(.+):(\d+):(\d+)',anonymous_location(spelling) or '')
            if not match:return None
            path=Path(match[1]);path=(path if path.is_absolute() else source/path).resolve()
            if not path.is_relative_to(source):return None
            return (path,int(match[2]),int(match[3]))
        for identity,proof in physical_proofs.items():
            if not isinstance(proof,str):continue
            key=physical_key('(unnamed at '+proof+')')
            if key:proven_locations.setdefault(key,set()).add(identity)
        for tree in ast:
            for node in descendants(tree):
                spelling=clean_type(node.get('type',{}).get('desugaredQualType') or node.get('type',{}).get('qualType',''))
                if has_outer_indirection(spelling) or not spelling.endswith(')'):continue
                owners=proven_locations.get(physical_key(spelling),set())
                if len(owners)!=1:continue
                identity=next(iter(owners))
                tag=re.search(r'\((?:anonymous|unnamed) (struct|class|union) at ',spelling)
                if tag and tag[1]!=records[identity].get('tagUsed'):continue
                register(records[identity],[spelling])

    field_bindings={}
    def declaration_shape(value):
        # Clang query-local IDs and use markers differ between independent
        # dumps of the SAME declaration. Keep every semantic field, attribute,
        # constructor, initializer and trait; never deduplicate by field names.
        # TemplateInstantiationPattern is another query-local declaration ID.
        # Physical template ownership, arguments and complete semantic shape
        # below still have to match before any declarations can be joined.
        if isinstance(value,dict):
            return {key:(field_bindings[item] if key=='referencedMemberDecl' and isinstance(item,str) and item in field_bindings else declaration_shape(item)) for key,item in value.items()
                    if key not in ('id','loc','range','typeAliasDeclId','previousDecl','TemplateInstantiationPattern','_source_field_declaration',
                                   '_source_member_declaration','_source_byte_method_call','_source_cpp_function_selection','_source_cpp_function_binding',
                                   '_source_trivial_assignment_typedefs',
                                   'parentDeclContextId','isReferenced','isUsed')}
        if isinstance(value,list):return [declaration_shape(item) for item in value]
        return value

    # Reconcile named clones only through the original name token and exact
    # declaration location, followed by the complete semantic-shape check.
    # Omitted repeated filenames require a positively proven occurrence of
    # that very declaration; similar fields alone never establish identity.
    named_origins={};raw_contents={}
    if source:
        for identity,record in records.items():
            name=record.get('_source_template_name') or record.get('name')
            loc=record.get('loc',{});offset=loc.get('offset');filename=loc.get('file')
            # Clang elides the primary input's filename between declarations.
            # A header retains includedFrom. The caller's exact primary input
            # plus the original name token proves this source-owned location;
            # never search other files for a similar record.
            if not filename and not loc.get('includedFrom') and source_rel:
                filename=source_rel
            if not name or not isinstance(offset,int) or not filename:continue
            path=Path(filename);path=(path if path.is_absolute() else source/path).resolve()
            if not path.is_relative_to(source) or not path.is_file():continue
            if path not in raw_contents:raw_contents[path]=path.read_bytes()
            if raw_contents[path][offset:offset+len(name)]!=name.encode():continue
            proof=(path,offset,record.get('tagUsed'));physical_proofs[identity]=proof
            named_origins.setdefault((name,offset,record.get('tagUsed')),set()).add(proof)
        for identity,record in records.items():
            if identity in physical_proofs:continue
            name=record.get('_source_template_name') or record.get('name')
            origins=named_origins.get((name,record.get('loc',{}).get('offset'),record.get('tagUsed')),set())
            if len(origins)==1:physical_proofs[identity]=next(iter(origins))
    # MemberExpr stores its field ID as a string, rather than a nested `id`.
    # Join it only to an actual field token within the proven original record.
    # This preserves authored member bindings while removing query-local IDs
    # from implicit copy bodies and ordinary original header methods alike.
    ambiguous_fields=set()
    for identity,record in records.items():
        proof=physical_proofs.get(identity)
        if isinstance(proof,tuple) and isinstance(proof[0],Path):path=proof[0]
        elif isinstance(proof,str) and (location:=re.fullmatch(r'(.+):(\d+):(\d+)',proof)):
            path=Path(location[1]);path=(path if path.is_absolute() else source/path).resolve()
            if not source or not path.is_relative_to(source) or not path.is_file():continue
        else:continue
        if path not in raw_contents:raw_contents[path]=path.read_bytes()
        for field in children(record):
            name=field.get('name');offset=field.get('loc',{}).get('offset');key=field.get('id')
            if field.get('kind')!='FieldDecl' or not isinstance(offset,int) or not key:continue
            selected=name
            if name:
                if raw_contents[path][offset:offset+len(name)]!=name.encode():continue
            else:
                # Compiler-generated assignment bodies address anonymous
                # union/struct subobjects by FieldDecl ID too. Reconcile that
                # ID only through its exact lexical child and original tag
                # token, never by assuming an anonymous field's position.
                child_id=field_records.get(key);child=records.get(child_id,{})
                child_proof=physical_proofs.get(child_id);token=child.get('tagUsed','').encode()
                if (not field.get('isImplicit') or not child_proof or not token
                        or child.get('loc',{}).get('offset')!=offset
                        or raw_contents[path][offset:offset+len(token)]!=token):continue
                selected={'anonymous_child':repr(child_proof)}
            binding={'original_record':repr(proof),'field':selected,'source_offset':offset,
                     'type':declaration_shape(field.get('type',{}))}
            if key in field_bindings and field_bindings[key]!=binding:ambiguous_fields.add(key)
            else:field_bindings[key]=binding
    for identity in ambiguous_fields:field_bindings.pop(identity,None)
    unique = {}
    for name,ids in names.items():
        ordered=sorted(ids)
        if len(ordered)==1:
            unique[name]=ordered[0];continue
        # A different physical declaration, an unknown location, or changed
        # semantic shape remains ambiguous, including across namespaces.
        if (all(identity in physical_proofs for identity in ordered)
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
    normalized_layouts={}
    for name,layout in layouts.items():
        normalized_layouts.setdefault(cpp_layout_type(name),{})[repr(layout)]=layout

    anonymous_layouts={}
    for name,layout in layouts.items():
        if anonymous_location(name):
            anonymous_layouts.setdefault(anonymous_layout_spelling(name),{})[repr(layout)]=layout

    def build(identity):
        if identity in cached:
            return cached[identity]
        if identity in active:
            return None
        active.add(identity)
        record = records[identity]
        traits = record.get('definitionData', {})
        c_record=record.get('kind')=='RecordDecl'
        # RecordDecl is Clang's C tag, not an incomplete C++ traits report.
        # C has no class lifetime hooks or inheritance. This authorizes only
        # the language's trivial storage; field offsets/types remain checked.
        # Reference members make an otherwise trivial aggregate non-standard-
        # layout. Its representation still comes exclusively from this target's
        # Clang field dump. Admit only scalar lvalue references below; no bases,
        # virtual dispatch, authored construction or nontrivial lifetime.
        has_reference_member=any(has_outer_indirection(
            child.get('type',{}).get('qualType',''),'&')
            for child in children(record) if child.get('kind')=='FieldDecl')
        valid = ((c_record or ((traits.get('isStandardLayout') is True or has_reference_member) and
                 traits.get('isTriviallyCopyable') is True and
                 traits.get('isAggregate') is True and
                 traits.get('defaultCtor', {}).get('trivial') is True and
                 traits.get('dtor', {}).get('trivial') is True)) and not record.get('bases'))
        if storage_views:
            # Reading an existing object's proven fields does not construct,
            # copy, assign or destroy that C++ object. Keep this separate from
            # the trivial aggregate schemas consumed by value lowering.
            # A non-standard-layout class can still expose existing fields
            # when target Clang proves every subobject offset. This does not
            # authorize construction, copying, destruction or virtual dispatch.
            valid=not traits.get('isPolymorphic')
            bases=record.get('bases',[])
            if len(bases)>1 or any(base.get('isVirtual') for base in bases):valid=False
            if record.get('tagUsed')=='union' and not c_record and not traits.get('isTriviallyCopyable'):valid=False
            if any(member.get('virtual') or member.get('pure') for member in children(record)):valid=False
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
        evidence=[]
        for name in by_id_names.get(identity,[]):
            candidates=({repr(layouts[name]):layouts[name]} if name in layouts else
                        normalized_layouts.get(cpp_layout_type(name),{}) if not c_record else {})
            if len(candidates)==1:
                candidate=next(iter(candidates.values()))
                if 'fields' in candidate:evidence.append(candidate)
        # Anonymous physical names have a different enclosing scope spelling
        # in the AST and layout dump, but the exact file:line:column is shared.
        physical = {anonymous_location(name) for name in record_spellings.get(identity, [])}
        physical.discard(None)
        # Prefer the complete Clang-owned spelling. An anonymous union in
        # Wall and UWall may have the same source location but different
        # native child declarations. Only a genuinely unique physical layout
        # can supply the fallback when Clang elides its enclosing scope.
        exact={}
        for spelling in record_spellings.get(identity,()):
            for key,candidate in anonymous_layouts.get(anonymous_layout_spelling(spelling),{}).items():
                if 'fields' in candidate:exact[key]=candidate
        if exact:evidence=list(exact.values())
        if physical and not exact:
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
                pointer_members.append(has_outer_indirection(spelling,'*'))
            # Overlapping pointer bytes use the same checked 64-bit address
            # representation as all other native pointer slots. The schema
            # below attests that representation; unknown addresses still fail
            # when decoded/dereferenced rather than inventing an allocation.
        if not valid or not layout or not (fields or storage_views and record.get('bases')) or not (0 < layout['size'] <= 1048576):
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
        if storage_views:result['projection']=True
        elif methods:result['prototype']=record['name']
        overlaps = result['union']
        if record.get('bases'):
            # The current source pointer casts preserve address identity.
            # Accept only one nonvirtual base at a Clang-proven offset zero;
            # nonzero and virtual adjustments remain explicit blockers.
            native_bases=layout.get('bases',[])
            declared_bases=record['bases']
            if (not storage_views or len(native_bases)!=1 or len(declared_bases)!=1
                    or native_bases[0].get('virtual') or native_bases[0]['offset']!=0):
                active.remove(identity);cached[identity]=None;return None
            declared_base=declared_bases[0].get('type',{})
            spelling=clean_type(declared_base.get('desugaredQualType') or declared_base.get('qualType',''))
            original_spelling=spelling
            seen=set()
            while spelling in aliases and spelling not in seen:
                seen.add(spelling);spelling=clean_type(aliases[spelling])
            base_identity=unique.get(spelling)
            known_spellings={original_spelling,*record_spellings.get(base_identity,())}
            if cpp_layout_type(native_bases[0]['type']) not in {cpp_layout_type(name) for name in known_spellings}:
                active.remove(identity);cached[identity]=None;return None
            base_schema=build(base_identity) if base_identity else None
            if (not base_schema or base_schema['size']>layout['size']
                    or any(field.get('name') in base_schema['fields'] for field in fields)):
                active.remove(identity);cached[identity]=None;return None
            result['fields'].update(base_schema['fields'])
            result['arrayAlign']=base_schema['arrayAlign']
            result['bases']=[{'type':spelling,'offset':0,'size':base_schema['size']}]
            overlaps=overlaps or base_schema['overlaps']
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
            layout_type=clean_type if c_record else cpp_layout_type
            if layout_type(layout_field) != layout_type(declared) and not same_anonymous:
                # Clang's layout dump desugars integral typedefs.
                resolved = declared
                seen = set()
                while resolved in aliases and resolved not in seen:
                    seen.add(resolved)
                    resolved = clean_type(aliases[resolved])
                if (layout_type(layout_field) != layout_type(typ) and
                        layout_type(layout_field) != layout_type(resolved)):
                    valid = False
                    break
            if not storage_views and (field.get('mutable') or field.get('hasInClassInitializer')):
                valid = False
                break
            typ = clean_type(typ)
            dims=[];base=typ
            while match:=re.search(r'\[(\d+)\]$',base):
                dims.insert(0,int(match[1]));base=base[:match.start()].strip()
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
            elif dims and len(dims)<=8 and has_outer_indirection(base,'*') and not has_outer_indirection(base,'&'):
                count=1
                for dimension in dims:count*=dimension
                size=count*8
                if any(d<1 for d in dims) or size>1048576 or offset['offset']%8:
                    valid=False;break
                item={'pointerArray':True,'dims':dims,'size':size}
                result['arrayAlign']=max(result['arrayAlign'],8)
            elif not dims and has_outer_indirection(base,'&'):
                # The native ABI stores an address, not a copied scalar. Keep
                # the original reference type for initializer/lvalue lowering.
                referent=base[:-1].strip() if base.endswith('&') and not base.endswith('&&') else ''
                seen=set()
                while referent in aliases and referent not in seen:
                    seen.add(referent);referent=clean_type(aliases[referent])
                if referent not in native or record.get('tagUsed')=='union':
                    valid=False;break
                item={'reference':True,'referenceType':field['type']['qualType'],'size':8}
                size=8
            elif not dims and has_outer_indirection(base,'*') and not has_outer_indirection(base,'&'):
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
                    if (dims==[1] and width==1 and field is fields[-1]
                            and not result['union'] and record.get('_source_one_byte_tail_arrays')):
                        item['oneByteTailArray']='clang-flex-arrays-0-or-1/1'
                    result['arrayAlign'] = max(result['arrayAlign'],width)
            elif len(dims)<=8 and (field.get('id') in field_records or base in unique):
                # A template's anonymous type text can be identical across
                # specializations. Its direct lexical AST owner is exact and
                # wins over an intentionally ambiguous global name lookup.
                child_schema = build(field_records.get(field.get('id')) or unique[base])
                if not child_schema:
                    if storage_views:continue
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
                if storage_views:continue
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
        # This includes pointer slots inside nested structs/arrays, as used
        # by original native codec contexts overlaid with raw byte storage.
        if result['union'] and storage_kinds(result)=={'pointer','numeric'}:
            result['pointerEncoding']='source-lp64-addresses/2'
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
            recovered[name] = {'byte_schema': schema, 'copyable': not storage_views,
                               'moveable': not storage_views, 'storage_view_only':storage_views,'union': schema['union'],
                               'anonymous_typedef':not original.get('name'),
                               'trivial_default_constructor':original.get('kind')=='RecordDecl' or traits.get('defaultCtor',{}).get('trivial') is True,
                               'trivial_destructor':original.get('kind')=='RecordDecl' or traits.get('dtor',{}).get('trivial') is True,
                               'anonymous_members': field_names,
                               'anonymous_member_types':anonymous_types}
    return recovered
