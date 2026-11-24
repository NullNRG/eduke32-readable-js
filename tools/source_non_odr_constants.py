"""Original namespace integral constants selected by same-TU Clang callsites.

Only Clang non-ODR constant uses can become values. Address/reference uses
retain their original storage dependency. No lookup by unqualified name.
"""
import hashlib,json,re
from source_field_bindings import body_semantic
from source_scalar_types import scalar_info

BINDING='_source_non_odr_header_constant'

def walk(node):
    yield node
    for child in node.get('inner',[]):
        if child:yield from walk(child)

def typ(node):
    return node.get('type',{}).get('desugaredQualType') or node.get('type',{}).get('qualType','')

def integer_value(node):
    """Typed literal/Clang-evaluated expressions, without evaluating C++ text."""
    info=scalar_info(typ(node))
    if not info or info[0]!='integer':return None
    kind=node.get('kind');children=[v for v in node.get('inner',[]) if v]
    if kind in ('IntegerLiteral','CharacterLiteral','ConstantExpr') and node.get('value') is not None:
        try:number=int(str(node['value']),0)
        except ValueError:return None
    elif len(children)==1 and (kind=='ParenExpr' or kind in (
            'ImplicitCastExpr','CStyleCastExpr','CXXStaticCastExpr','CXXFunctionalCastExpr')
            and node.get('castKind') in ('IntegralCast','NoOp')):
        number=integer_value(children[0])
    elif kind=='UnaryOperator' and len(children)==1 and node.get('opcode') in ('+','-','~'):
        number=integer_value(children[0])
        if number is not None:number={'+':lambda n:n,'-':lambda n:-n,'~':lambda n:~n}[node['opcode']](number)
    else:return None
    if number is None:return None
    bits=8*info[1];number%=1<<bits
    return number-(1<<bits) if not info[2] and number>=1<<(bits-1) else number

def sites(ast):
    for tree in ast:
        for owner in walk(tree):
            if owner.get('kind') not in ('FunctionDecl','CXXMethodDecl'):continue
            loc=owner.get('loc',{});loc=loc.get('expansionLoc',loc)
            offset=loc.get('offset');mangled=owner.get('mangledName')
            bodies=[v for v in owner.get('inner',[]) if v.get('kind')=='CompoundStmt']
            if not mangled or not isinstance(offset,int) or len(bodies)!=1:continue
            refs=[v for v in walk(bodies[0]) if v.get('kind')=='DeclRefExpr'
                  and v.get('nonOdrUseReason')=='constant' and v.get('referencedDecl',{}).get('kind')=='VarDecl']
            if not refs:continue
            digest=hashlib.sha256(json.dumps(body_semantic(bodies[0]),sort_keys=True,separators=(',',':')).encode()).hexdigest()
            for ordinal,ref in enumerate(refs):
                yield (mangled,owner.get('type',{}).get('qualType'),offset,digest,ordinal),ref

def index(complete,globals,origins):
    definitions={}
    for node in globals:
        spelling=typ(node);children=[v for v in node.get('inner',[]) if v and not v.get('kind','').endswith('Attr')]
        if (node.get('kind')!='VarDecl' or not node.get('mangledName') or not re.search(r'\bconst\b',spelling)
                or re.search(r'\bvolatile\b|[*&\[]',spelling) or len(children)!=1):continue
        value=integer_value(children[0]);info=scalar_info(spelling);origin=origins.get(id(node))
        if value is None or not info or info[0]!='integer' or not origin:continue
        bits=8*info[1];value%=1<<bits
        if not info[2] and value>=1<<(bits-1):value-=1<<bits
        definitions[node['id']]={'abi':'source-clang-non-odr-header-integer/1','value':value,'type':spelling,
            'name':node['name'],'original_type':node.get('type',{}).get('qualType'),
            'mangled_name':node['mangledName'],'source_header':origin['source_header'],
            'source_offset':origin['source_offset'],'translation_unit':origin['translation_unit'],
            'initializer_sha256':hashlib.sha256(json.dumps(body_semantic(children[0]),sort_keys=True,separators=(',',':')).encode()).hexdigest()}
    result={}
    for key,reference in sites(complete):
        decl=reference['referencedDecl'];proof=definitions.get(decl.get('id'))
        if (proof and proof['name']==decl.get('name') and proof['original_type']==decl.get('type',{}).get('qualType')):
            result.setdefault(key,{})[json.dumps(proof,sort_keys=True)]=proof
    return result

def rebind(ast,proofs):
    for key,reference in sites(ast):
        choices=proofs.get(key,{})
        if len(choices)!=1:continue
        proof=next(iter(choices.values()));decl=reference['referencedDecl']
        if proof['name']==decl.get('name') and proof['original_type']==decl.get('type',{}).get('qualType'):
            reference[BINDING]=proof
