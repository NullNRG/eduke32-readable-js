"""Typed opaque standard-library service selection; never a game-function shim.

Only integral default-hash/default-equality/default-allocator maps and their
native GNU iterators are admitted. Native STL fields/layout are not fabricated.
Selected methods must originate in the configured target C++ standard headers.
"""
import hashlib,json,os,re,sys
from pathlib import Path
from source_field_bindings import body_semantic
ABI='source-opaque-std-unordered-map/1'
SELECTED='_source_std_unordered_selection'
def walk(node):
 yield node
 for child in node.get('inner',[]):
  if child:yield from walk(child)
def spelling(node):
 t=node.get('type',{});return t.get('desugaredQualType') or t.get('qualType','')
def compact(t):return re.sub(r'\s+','',t)
def arguments(t,head):
 t=t.strip()
 if not t.startswith(head+'<') or not t.endswith('>'):return None
 values=[];start=len(head)+1;depth=0
 for i in range(start,len(t)-1):
  if t[i]=='<':depth+=1
  elif t[i]=='>':depth-=1
  elif t[i]==',' and depth==0:values.append(t[start:i].strip());start=i+1
 values.append(t[start:-1].strip());return values
def scalar(t):return {'unsigned char':8,'unsigned short':16,'unsigned int':32}.get(t.strip())
def map_schema(t):
 a=arguments(t,'std::unordered_map')
 if not a or len(a) not in (2,5) or scalar(a[0]) is None:return None
 key,value=a[:2];v=scalar(value) or map_schema(value)
 if not v:return None
 if len(a)==5:
  expected=['std::hash<'+key+'>','std::equal_to<'+key+'>','std::allocator<std::pair<const '+key+', '+value+'>>']
  if any(compact(x)!=compact(y) for x,y in zip(a[2:],expected)):return None
 return {'key':scalar(key),'value':v}
def iterator_schema(t):
 t=t.removeprefix('const ').rstrip(' &')
 for head in ('std::__detail::_Node_iterator','std::__detail::_Node_iterator_base','_Node_iterator','_Node_iterator_base'):
  a=arguments(t,head)
  if not a:continue
  pair=arguments(a[0],'std::pair') or arguments(a[0],'pair')
  if pair and len(pair)==2 and scalar(pair[0].removeprefix('const ')) and (scalar(pair[1]) or map_schema(pair[1])) and all(flag in ('false','0') for flag in a[1:]):
   return {'key':scalar(pair[0].removeprefix('const ')),'value':scalar(pair[1]) or map_schema(pair[1])}
 return None
def header(path):
 root=os.environ.get('EDUKE32_SYSROOT')
 if not path or not root and not sys.platform.startswith('linux'):return False
 path=Path(path).resolve();allowed=((Path(root)/'usr/include/c++') if root else Path('/usr/include/c++')).resolve()
 return path.is_relative_to(allowed) and path.name in ('unordered_map.h','hashtable_policy.h','stl_pair.h') and path.is_file()
def recover(ast):
 types={};methods={};declarations={}
 def visit(node,physical=None):
  physical=node.get('loc',{}).get('file') or physical
  if node.get('id'):declarations[node['id']]=(node,physical)
  original=node.get('_source_record_qualified_name','')
  if node.get('kind')=='CXXRecordDecl' and node.get('completeDefinition') and header(physical):
   aliases={node.get('name'),original,*node.get('_source_self_type_spellings',[])}
   spec=map_schema(original)
   kind='map' if spec else None
   if not spec:
    a=arguments(original,'std::__detail::_Node_iterator') or arguments(original,'std::__detail::_Node_iterator_base')
    if a:
     pair=arguments(a[0],'std::pair')
     if pair and len(pair)==2 and scalar(pair[0].removeprefix('const ')) and (scalar(pair[1]) or map_schema(pair[1])):
      if all(flag in ('false','0') for flag in a[1:]):spec={'key':scalar(pair[0].removeprefix('const ')),'value':scalar(pair[1]) or map_schema(pair[1])};kind='iterator'
   if spec:
    proof={'abi':ABI,'kind':kind,'schema':spec,'header':str(Path(physical).resolve())}
    for alias in aliases:
     if alias:types[alias]=proof
    if kind=='map':
     values=arguments(original,'std::unordered_map')
     types['std::unordered_map<'+', '.join(values[:2])+'>']=proof
    for child in walk(node):
     if child.get('kind') in ('CXXMethodDecl','FunctionDecl') and child.get('mangledName'):
      methods[child.get('id')]={**proof,'name':child.get('name'),'mangled_name':child['mangledName'],'original_type':spelling(child),
       'parameters':[spelling(p) for p in child.get('inner',[]) if p.get('kind')=='ParmVarDecl']}
  for child in node.get('inner',[]):
   if child:visit(child,physical)
 for tree in ast:visit(tree)
 # Free iterator comparisons are friends of the exact standard base record.
 for identity,(node,path) in declarations.items():
  if identity in methods:continue
  if node.get('kind')=='FunctionDecl' and node.get('name') in ('operator==','operator!=') and header(path) and node.get('mangledName','').startswith('_ZNSt8__detail'):
   methods[identity]={'abi':ABI,'kind':'iterator','name':node['name'],'mangled_name':node['mangledName'],'original_type':spelling(node),'header':str(Path(path).resolve())}
 return types,methods
def sites(ast):
 for tree in ast:
  for owner in walk(tree):
   if owner.get('kind') not in ('FunctionDecl','CXXMethodDecl'):continue
   bodies=[n for n in owner.get('inner',[]) if n.get('kind')=='CompoundStmt'];offset=owner.get('loc',{}).get('offset')
   if len(bodies)!=1 or not isinstance(offset,int) or not owner.get('mangledName'):continue
   refs=[n for n in walk(bodies[0]) if n.get('kind')=='CXXOperatorCallExpr']
   if not refs:continue
   digest=hashlib.sha256(json.dumps(body_semantic(bodies[0]),sort_keys=True,separators=(',',':')).encode()).hexdigest()
   for ordinal,node in enumerate(refs):yield (owner['mangledName'],spelling(owner),offset,digest,ordinal),node
def index(ast):
 _,methods=recover(ast);proofs={}
 for key,node in sites(ast):
  callee=node.get('inner',[{}])[0]
  while callee.get('kind') in ('ImplicitCastExpr','ParenExpr') and callee.get('inner'):callee=callee['inner'][0]
  selected=methods.get(callee.get('referencedDecl',{}).get('id'))
  if selected:proofs.setdefault(key,{})[json.dumps(selected,sort_keys=True)]=selected
 return proofs
def rebind(ast,proofs):
 for key,node in sites(ast):
  choices=proofs.get(key,{})
  if len(choices)==1:node[SELECTED]=next(iter(choices.values()))

def lookup(types,t,aliases,normalize):
 raw=re.sub(r'^(?:const\s+|volatile\s+)+','',t.strip());raw=re.sub(r'\s*[&*]+\s*$','',raw)
 for name in (raw,normalize(raw,aliases)):
  if name in types:return types[name]
 spec=map_schema(raw)
 if spec:
  choices=[p for p in types.values() if p['kind']=='map' and p['schema']==spec]
  if choices:return choices[0]
 return None

def use(em,node,proof):
 em.used_std_unordered=getattr(em,'used_std_unordered',{})
 em.used_std_unordered[json.dumps(proof,sort_keys=True)]=proof
 em.library_service_nodes=getattr(em,'library_service_nodes',set())|{id(node)}

def expression(em,node):
 k=node.get('kind');a=[c for c in node.get('inner',[]) if c]
 types=getattr(em,'std_unordered_types',{});methods=getattr(em,'std_unordered_methods',{})
 if not types:return None
 def typ(n):return lookup(types,spelling(n),em.type_aliases,em.std_normalize)
 def mark(proof):use(em,node,proof)
 def target(n):
  ref=n.get('_source_member_declaration',{})
  return methods.get(n.get('referencedMemberDecl')) or methods.get(ref.get('id'))
 def chosen(n):return n.get(SELECTED)
 if k=='UnaryOperator' and len(a)==1:
  proof=typ(a[0])
  if proof and proof['kind']=='map' and node.get('opcode') in ('&','*'):
   mark(proof);return 'cStdUnordered.'+('address' if node['opcode']=='&' else 'deref')+'('+em.expr(a[0])+')'
 if k in ('ImplicitCastExpr','CXXStaticCastExpr') and node.get('castKind') in ('DerivedToBase','UncheckedDerivedToBase') and len(a)==1:
  left,right=typ(a[0]),typ(node)
  if left and right and left['kind']==right['kind']=='iterator' and left['schema']==right['schema']:
   mark(left);return em.expr(a[0])
 if k in ('CXXConstructExpr','CXXTemporaryObjectExpr'):
  proof=typ(node)
  if proof:
   ctor=node.get('ctorType',{}).get('qualType','');mark(proof)
   if proof['kind']=='map':
    argument_type=typ(a[0]) if len(a)==1 else None
    if len(a)==1 and argument_type is None:
     # Clang prints the standard copy constructor's own namespace-relative
     # parameter as unordered_map<...>. This is admitted only inside the
     # already-proven standard container construction, never as a global
     # alias for a same-spelled application class.
     local=spelling(a[0]).removeprefix('const ')
     local=re.sub(r'(?<![:\w])unordered_map<','std::unordered_map<',local)
     schema=map_schema(local)
     if schema==proof['schema']:argument_type=proof
    if not a and ctor in ('void ()','void () noexcept'):
     value='cStdUnordered.create('+json.dumps(proof['schema'],sort_keys=True)+')'
    elif len(a)==1 and 'const ' in ctor and '&' in ctor and '&&' not in ctor and argument_type and argument_type['schema']==proof['schema']:
     value='cStdUnordered.copy('+em.expr(a[0])+')'
    else:raise em.std_unsupported('unordered_map construction requires supported original default/copy ABI: '+ctor+' args '+str([spelling(v) for v in a]))
    return value if em.current_function else 'cStdUnordered.global('+value+')'
   if proof['kind']=='iterator' and len(a)==1 and '&' in ctor and (typ(a[0]) and typ(a[0])['schema']==proof['schema'] or iterator_schema(spelling(a[0]))==proof['schema']):
    return 'cStdUnordered.iteratorCopy('+em.expr(a[0])+')'
   raise em.std_unsupported('unordered_map iterator construction requires original copy/move selection')
 if k=='CXXMemberCallExpr' and a and a[0].get('kind')=='MemberExpr':
  member=a[0];receiver=[c for c in member.get('inner',[]) if c]
  proof=target(member)
  if proof and len(receiver)==1:
   mark(proof);name=proof['name'];args=a[1:];owner=em.expr(receiver[0])
   if member.get('isArrow'):owner='cStdUnordered.deref('+owner+')'
   if proof['kind']=='map' and name in ('find','end','begin','emplace','clear','size','erase'):
    arities={'find':1,'end':0,'begin':0,'emplace':2,'clear':0,'size':0,'erase':1}
    if len(args)!=arities[name]:raise em.std_unsupported('unordered_map method overload is outside verified service ABI: '+name)
    if name=='erase' and not any('key_type' in p for p in proof.get('parameters',[])):
     raise em.std_unsupported('unordered_map erase requires the original key overload')
    if name=='emplace':
     for value in args:
      original=spelling(value).rstrip(' &')
      if not re.fullmatch(r'(?:const )?(?:(?:signed|unsigned) )?(?:bool|char|short|int|long(?: long)?)',original) and not typ(value):
       raise em.std_unsupported('unordered_map emplace requires verified integral/container arguments')
    return 'cStdUnordered.'+name+'('+', '.join([owner,*[em.expr(v) for v in args]])+')'
   raise em.std_unsupported('unordered_map member needs supported exact library operation: '+name)
 if k=='CXXOperatorCallExpr' and len(a)>=2:
  proof=chosen(node)
  if proof:
   mark(proof);name=proof['name'];args=a[1:]
   if proof['kind']=='map' and name=='operator[]' and len(args)==2:
    return 'cStdUnordered.slot('+em.expr(args[0])+', '+em.expr(args[1])+').value'
   if proof['kind']=='map' and name=='operator=' and len(args)==2:
    if '&&' in proof['original_type']:raise em.std_unsupported('unordered_map move assignment is outside verified service ABI')
    return 'cStdUnordered.assign('+em.expr(args[0])+', '+em.expr(args[1])+')'
   if proof['kind']=='iterator':
    if name in ('operator==','operator!=') and len(args)==2:
     return ('!' if name=='operator!=' else '')+'cStdUnordered.iteratorEqual('+', '.join(em.expr(v) for v in args)+')'
    if name in ('operator->','operator*') and len(args)==1:return 'cStdUnordered.iteratorPair('+em.expr(args[0])+')'
    if name=='operator++' and len(args)==1:return 'cStdUnordered.iteratorNext('+em.expr(args[0])+')'
   raise em.std_unsupported('unordered_map operator needs supported exact library operation: '+name)
 if k=='MemberExpr' and a and node.get('name') in ('first','second'):
  base=a[0]
  while base.get('kind') in ('ImplicitCastExpr','ParenExpr','MaterializeTemporaryExpr') and base.get('inner'):base=base['inner'][0]
  selected=chosen(base)
  if selected and selected['kind']=='iterator' and selected['name'] in ('operator->','operator*'):
   mark(selected);return '('+em.expr(a[0])+').'+node['name']
 return None
