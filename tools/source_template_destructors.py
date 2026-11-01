"""Demand missing original template destructor bodies from Clang itself.

The auxiliary TU includes the original source, then explicitly instantiates
only the selected destructor. Its declaration is never emitted. The original
template pattern, specialization, member locations and existing call bindings
must agree before the authored destructor body can enter the original AST.
"""
import copy
import hashlib
import json
from pathlib import Path
import re
import tempfile
import subprocess

from source_ast_stream import run_clang_ast
from source_first_toolchain import fingerprint_toolchain
from source_header_records import normalize_specializations,header_proof


def walk(node):
    yield node
    children=list(node.get('inner',[]))
    filler=node.get('array_filler',[])
    children.extend([filler] if isinstance(filler,dict) else filler)
    for child in children:
        if child:yield from walk(child)


def typ(node):
    value=node.get('type',{})
    return value.get('desugaredQualType') or value.get('qualType','')


def identity(proof):
    return tuple(proof.get(key) for key in ('source_header','source_offset','enclosing_record','type'))


def pattern_proof(pattern,root):
    # Instantiating an implicit exception specification can refine void () to
    # void () noexcept. Compare every authored expression and macro expansion,
    # ignoring only that Clang refinement; noexcept(false) stays distinct.
    normalized=copy.deepcopy(pattern)
    for node in walk(normalized):
        if node.get('kind')!='CXXDestructorDecl':continue
        for key,value in node.get('type',{}).items():
            if isinstance(value,str) and value in ('void ()','void () noexcept'):
                node['type'][key]='void ()'
    return header_proof(normalized,root)


def primary(ast,record,root):
    target=header_proof(record,root)
    if not target:return None
    found=[]
    for top in ast:
        for template in walk(top):
            if template.get('kind')!='ClassTemplateDecl' or template.get('name')!=record['_source_template_name']:continue
            for pattern in template.get('inner',[]):
                if (pattern.get('kind')!='CXXRecordDecl' or not pattern.get('completeDefinition')
                        or pattern.get('name')!=template['name'] or pattern.get('_source_record_name')):continue
                proof=pattern_proof(pattern,root)
                if proof and (proof['source_header'],proof['source_offset'])==(target['source_header'],target['source_offset']):
                    found.append((pattern,proof))
    distinct={item[1]['semantic_sha256'] for item in found}
    return found[0] if len(distinct)==1 and found else None


def bind_body(old_record,new_record,old_pattern,new_destructor,ast):
    """Keep old declaration identities; reject new or ambiguous bindings."""
    def key(node):return node.get('kind'),node.get('name'),typ(node),node.get('loc',{}).get('offset')
    members={}
    for node in old_record.get('inner',[]):members.setdefault(key(node),[]).append(node)
    mapping={}
    for node in new_record.get('inner',[]):
        choices=members.get(key(node),[])
        if len(choices)==1 and node.get('id') and choices[0].get('id'):
            mapping[node['id']]=choices[0]['id']
    refs={}
    pattern_destructors=[node for node in old_pattern.get('inner',[]) if node.get('kind')=='CXXDestructorDecl']
    if len(pattern_destructors)!=1:return None
    for node in walk(pattern_destructors[0]):
        if node.get('kind')=='DeclRefExpr':
            ref=node.get('referencedDecl',{})
            refs.setdefault((ref.get('kind'),ref.get('name'),typ(ref)),set()).add(ref.get('id'))
    declarations={node.get('id'):node for top in ast for node in walk(top)
                  if node.get('id') and node.get('kind') in ('VarDecl','FunctionDecl','EnumConstantDecl')}
    body=copy.deepcopy(new_destructor.get('inner',[]))
    local_ids={node.get('id') for top in body for node in walk(top)
               if node.get('kind') in ('VarDecl','ParmVarDecl')}
    for top in body:
        for node in walk(top):
            if node.get('kind')=='MemberExpr':
                member=node.get('referencedMemberDecl')
                if member not in mapping:return None
                node['referencedMemberDecl']=mapping[member]
            if node.get('kind')!='DeclRefExpr':continue
            ref=node.get('referencedDecl',{});identifier=ref.get('id')
            if identifier in local_ids:continue
            if identifier in mapping:
                ref['id']=mapping[identifier];continue
            choices=refs.get((ref.get('kind'),ref.get('name'),typ(ref)),set())-{None}
            if len(choices)!=1:return None
            original=next(iter(choices))
            # A filtered type-only AST cannot prove a new runtime global's
            # storage owner. Do not turn a same-named variable into a provider.
            if ref.get('kind')=='VarDecl' and original not in declarations:return None
            ref['id']=original
    return body


def complete(ast,report,*,root,source,frontend,language,arguments,aliases,normalize,cache_dir=None):
    evidence={'requested':[],'proven':[],'rejected':{}}
    prefix='C++ heap object needs complete original class construction/destruction: '
    demanded={row['reason'][len(prefix):] for row in report if row.get('reason','').startswith(prefix)}
    demanded.update(row['required_original_destructor'] for row in report if row.get('required_original_destructor'))
    root=Path(root).resolve();source=Path(source).resolve()
    for spelling in sorted(demanded)[:4]:
        name=normalize(spelling,aliases)
        records=[node for top in ast for node in walk(top) if node.get('name')==name
                 and node.get('kind')=='CXXRecordDecl' and node.get('_source_template_name')]
        if len(records)!=1:continue
        record=records[0];short=record['_source_template_name']
        destructors=[node for node in record.get('inner',[]) if node.get('kind')=='CXXDestructorDecl'
                     and not node.get('isImplicit') and node.get('explicitlyDefaulted') is None]
        if len(destructors)!=1:continue
        destructor=destructors[0]
        if any(node.get('kind')=='CompoundStmt' for node in destructor.get('inner',[])):continue
        if typ(destructor) not in ('void ()','void () noexcept') or destructor.get('name')!='~'+short:continue
        pattern=primary(ast,record,root)
        original_proof=header_proof(record,root)
        if not pattern or not original_proof:continue
        if not re.fullmatch(r'[A-Za-z_]\w*',short):continue
        # No arbitrary C++ statements, macros, pragmas or function-pointer
        # declarators can enter the auxiliary instantiation directive.
        if not re.fullmatch(r'[A-Za-z_][A-Za-z_0-9 :*,<>+\-]*',spelling):continue
        selected=spelling
        # Clang's TemplateArgument stores an enum argument as the integer 3,
        # but `Queue<T, 3>` is ill-formed when that parameter is an enum.
        # The specialization's actual CXXThisExpr carries its native typed
        # spelling (e.g. RF_INIT_AND_FREE). Use only an alias already proven
        # to denote this exact same Clang specialization, never infer a cast.
        self_spellings=[value for value in record.get('_source_self_type_spellings',[])
            if re.fullmatch(r'[A-Za-z_][A-Za-z_0-9 :*,<>+\-]*',value)
            and normalize(value,aliases)==name]
        if self_spellings:selected=sorted(self_spellings)[0]
        namespace=record.get('_source_namespace','')
        if namespace and not selected.startswith(namespace+'::'):selected=namespace+'::'+selected
        directive='template '+selected+'::~'+short+'();'
        evidence['requested'].append(spelling)
        try:
            with tempfile.TemporaryDirectory(prefix='eduke-source-destructor-') as temporary:
                wrapper=Path(temporary)/'instantiate.cpp'
                wrapper.write_text('#include '+json.dumps(source.as_posix(),ensure_ascii=False)+'\n'+directive+'\n',encoding='utf-8')
                command=[frontend,*language,'-Xclang','-ast-dump=json','-Xclang','-ast-dump-filter='+short,
                         '-fsyntax-only',*arguments,str(wrapper)]
                cache=None
                if cache_dir:
                    digest=hashlib.sha256(json.dumps([str(root),str(source),frontend,language,arguments,directive,
                         pattern[1]],sort_keys=True).encode())
                    fingerprint_toolchain(digest)
                    for path in sorted(root.rglob('*')):
                        if path.is_file() and path.suffix.lower() in ('.c','.cc','.cpp','.cxx','.h','.hpp','.hh','.hxx','.inc','.inl','.def'):
                            digest.update(path.relative_to(root).as_posix().encode());digest.update(path.read_bytes())
                    cache=Path(cache_dir)/('destructor-'+digest.hexdigest()+'.json')
                supplementary,decode=run_clang_ast(command,cwd=root,cache_path=cache,timeout=90)
            normalize_specializations(supplementary)
            candidates=[node for top in supplementary for node in walk(top)
                if node.get('_source_record_qualified_name')==record.get('_source_record_qualified_name')
                and node.get('_source_record_name')==record.get('_source_record_name')]
            candidates=[node for node in candidates if (proof:=header_proof(node,root))
                        and identity(proof)==identity(original_proof)]
            if len(candidates)!=1:raise ValueError('missing or ambiguous original specialization')
            replacement=candidates[0];new_pattern=primary(supplementary,replacement,root)
            if not new_pattern or new_pattern[1]!=pattern[1]:
                raise ValueError('auxiliary parse changed the authored template pattern or macro context')
            selected_destructors=[node for node in replacement.get('inner',[])
                if node.get('kind')=='CXXDestructorDecl' and node.get('name')==destructor['name']
                and typ(node)=='void () noexcept' and node.get('loc',{}).get('offset')==destructor.get('loc',{}).get('offset')
                and any(child.get('kind')=='CompoundStmt' for child in node.get('inner',[]))]
            if len(selected_destructors)!=1:raise ValueError('original destructor body was not instantiated')
            body=bind_body(record,replacement,pattern[0],selected_destructors[0],ast)
            if body is None:raise ValueError('destructor introduces an unproven declaration binding')
            destructor['inner']=body
            destructor['type']=selected_destructors[0]['type']
            evidence['proven'].append({'type':spelling,'source_header':original_proof['source_header'],
                'source_offset':original_proof['source_offset'],'template_pattern_sha256':pattern[1]['semantic_sha256'],
                'directive':directive,'ast_decode':decode,'runtime_provider_fabricated':False})
        except (OSError,RuntimeError,ValueError,TimeoutError,subprocess.TimeoutExpired) as error:
            evidence['rejected'][spelling]=str(error)
    return evidence
