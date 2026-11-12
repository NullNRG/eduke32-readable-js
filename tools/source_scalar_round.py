"""Prove a scalar SSE load/convert idiom from original same-parse Clang bodies.

Only a float parameter loaded into an otherwise unobserved local vector and
converted back to int is folded. No vector ABI/storage is invented. Unknown
wrappers, memory accesses and rounding-control operations remain unsupported.
"""
import hashlib,json,re

ABI='source-scalar-f32-nearest-even-i32/1'
def kids(node):return [child for child in node.get('inner',[]) if child]
def walk(node):
    yield node
    for child in kids(node):yield from walk(child)
def typ(node):return node.get('type',{}).get('qualType','')
def strip(node):
    while (node.get('kind') in ('ParenExpr','ImplicitCastExpr','CStyleCastExpr','CompoundLiteralExpr')
           or node.get('kind')=='UnaryOperator' and node.get('opcode')=='__extension__') and len(kids(node))==1:
        if node.get('kind')=='CStyleCastExpr' and node.get('castKind') not in ('NoOp','BitCast'):break
        node=kids(node)[0]
    return node
def ref(node,identity):
    node=strip(node)
    return node.get('kind')=='DeclRefExpr' and node.get('referencedDecl',{}).get('id')==identity
def vector(node):
    value=node.get('type',{}).get('desugaredQualType','')
    return re.sub(r'\s+','',value)=='__attribute__((__vector_size__(4*sizeof(float))))float'
def call(node,name,declarations):
    node=strip(node);parts=kids(node)
    if node.get('kind')!='CallExpr' or len(parts)!=2:return None
    callee=strip(parts[0]);decl=callee.get('referencedDecl',{})
    original=declarations.get(decl.get('id'))
    if callee.get('kind')!='DeclRefExpr' or decl.get('name')!=name or not original:return None
    if original.get('kind')!='FunctionDecl' or original.get('name')!=name or typ(decl)!=typ(original):return None
    return original,parts[1]
def body(decl):
    parts=[node for node in kids(decl) if node.get('kind')=='CompoundStmt']
    return parts[0] if len(parts)==1 else None
def wrapper_convert(decl):
    parameters=[node for node in kids(decl) if node.get('kind')=='ParmVarDecl'];block=body(decl)
    if typ(decl)!='int (__m128)' or len(parameters)!=1 or not vector(parameters[0]) or not block:return False
    seq=kids(block)
    if len(seq)!=1 or seq[0].get('kind')!='ReturnStmt' or len(kids(seq[0]))!=1:return False
    expression=kids(seq[0])[0];parts=kids(expression)
    if expression.get('kind')!='CallExpr' or len(parts)!=2:return False
    callee=strip(parts[0]);declref=callee.get('referencedDecl',{})
    return (callee.get('kind')=='DeclRefExpr' and typ(callee)=='<builtin fn type>'
        and declref.get('name')=='__builtin_ia32_cvtss2si' and vector(parts[1])
        and ref(parts[1],parameters[0].get('id')))
def wrapper_load(decl):
    parameters=[node for node in kids(decl) if node.get('kind')=='ParmVarDecl'];block=body(decl)
    if typ(decl)!='__m128 (const float *)' or len(parameters)!=1 or not block:return False
    parameter=parameters[0].get('id');seq=kids(block);locals={};records={}
    for statement in seq[:-1]:
        if statement.get('kind')!='DeclStmt':return False
        for node in kids(statement):
            if node.get('kind')=='CXXRecordDecl':
                fields=[field for field in kids(node) if field.get('kind')=='FieldDecl']
                if len(fields)!=1 or typ(fields[0])!='float' or node.get('bases'):return False
                records[fields[0].get('id')]=node
            elif node.get('kind')=='VarDecl' and typ(node)=='float' and len(kids(node))==1:
                value=strip(kids(node)[0])
                if (value.get('kind')!='MemberExpr' or not value.get('isArrow')
                        or value.get('referencedMemberDecl') not in records or len(kids(value))!=1
                        or not ref(kids(value)[0],parameter)):return False
                locals[node.get('id')]='loaded-parameter'
            else:return False
    if not seq or seq[-1].get('kind')!='ReturnStmt' or len(kids(seq[-1]))!=1:return False
    result=strip(kids(seq[-1])[0])
    if result.get('kind')!='InitListExpr' or not vector(result) or len(kids(result))!=4:return False
    first,*zeros=kids(result);first=strip(first)
    loaded=(first.get('kind')=='DeclRefExpr' and locals.get(first.get('referencedDecl',{}).get('id'))=='loaded-parameter')
    # Earlier Clang headers express the same scalar load directly.
    loaded=loaded or (first.get('kind')=='UnaryOperator' and first.get('opcode')=='*'
                      and len(kids(first))==1 and ref(kids(first)[0],parameter))
    return bool(loaded and all(strip(zero).get('kind') in ('IntegerLiteral','FloatingLiteral')
                              and float(strip(zero).get('value','nan'))==0 for zero in zeros))
def recover(function,declarations):
    parameters=[node for node in kids(function) if node.get('kind')=='ParmVarDecl'];block=body(function)
    if len(parameters)!=1 or typ(parameters[0])!='const float' and typ(parameters[0])!='float' or not block:return None
    if typ(function).split('(')[0].strip() not in ('int','int32_t'):return None
    seq=kids(block)
    if len(seq)!=2 or seq[0].get('kind')!='DeclStmt' or seq[1].get('kind')!='ReturnStmt':return None
    variables=kids(seq[0])
    if len(variables)!=1 or variables[0].get('kind')!='VarDecl' or not vector(variables[0]):return None
    variable=variables[0]
    if len(kids(variable))!=1 or len(kids(seq[1]))!=1:return None
    result_type=kids(seq[1])[0].get('type',{})
    if result_type.get('desugaredQualType',result_type.get('qualType'))!='int':return None
    load=call(kids(variable)[0],'_mm_load_ss',declarations)
    convert=call(kids(seq[1])[0],'_mm_cvtss_si32',declarations)
    if not load or not convert:return None
    address=strip(load[1])
    if (address.get('kind')!='UnaryOperator' or address.get('opcode')!='&' or len(kids(address))!=1
            or not ref(kids(address)[0],parameters[0].get('id')) or not ref(convert[1],variable.get('id'))
            or not wrapper_load(load[0]) or not wrapper_convert(convert[0])):return None
    def digest(node):
        # Evidence binds the actual selected original AST including bodies.
        return hashlib.sha256(json.dumps(node,sort_keys=True).encode()).hexdigest()
    return {'abi':ABI,'parameter':parameters[0].get('name'),'parameter_id':parameters[0].get('id'),
            'native_wrappers':[{'name':original['name'],'clang_id':original['id'],'ast_sha256':digest(original)}
                               for original in (load[0],convert[0])],
            'rounding':'default MXCSR: nearest, ties to even; masked invalid => INT32_MIN',
            'vector_storage_elided':True,'original_parameter_address_does_not_escape':True}

RUNTIME='''
// Scalar semantics of a proven original load-float/convert-to-int intrinsic
// pair. This is readable arithmetic, with no CPU/ISA execution machinery.
const cSSEFloat32ToInt32 = value => {
  const number = Math.fround(value);
  if (!Number.isFinite(number)) return -2147483648;
  const lower = Math.floor(number), fraction = number - lower;
  const rounded = fraction < .5 ? lower : fraction > .5 ? lower + 1
    : lower % 2 === 0 ? lower : lower + 1;
  return rounded < -2147483648 || rounded > 2147483647 ? -2147483648 : rounded | 0;
};
'''
