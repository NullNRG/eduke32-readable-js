"""Source-first C/C++ control-flow recovery (no LLVM or opcode interpreter).

Converts Clang label/goto edges into lexical JavaScript labeled blocks/loops.
Passes fail closed when regions overlap irreducibly or C++ lifetime semantics
cannot be preserved. All transformations are independent of original filenames.
"""
from __future__ import annotations
from dataclasses import dataclass
from collections import Counter
import re
import copy
from source_cpp_types import has_outer_indirection

class ControlFlowUnsupported(Exception):
    def __init__(self,message,*,required_records=()):
        super().__init__(message)
        self.required_records=tuple(required_records)


def kind(node): return node.get('kind','')
def children(node): return [n for n in node.get('inner',[]) if n]
def descendants(node, lambda_boundaries=()):
    yield node
    if kind(node) in ('RecordDecl','CXXRecordDecl'):return
    if kind(node)=='LambdaExpr' and node.get('id') in lambda_boundaries:return
    for child in children(node): yield from descendants(child,lambda_boundaries)

def recover_forward_if_label(body, guard_name):
    """Keep a bare if-branch label reachable without re-evaluating its condition."""
    statements=children(body)
    nodes=list(descendants(body))
    labels=[node for node in nodes if kind(node)=='LabelStmt']
    jumps=[node for node in nodes if kind(node)=='GotoStmt']
    if len(labels)!=1 or not jumps or any(kind(n) in ('AddrLabelExpr','IndirectGotoStmt') for n in nodes):
        return None
    label=labels[0]
    target=label.get('declId')
    if not target or len(children(label))!=1 or kind(children(label)[0])=='DeclStmt':return None
    for index,statement in enumerate(statements):
        branch=children(statement)
        if (kind(statement)=='IfStmt' and len(branch)==2 and branch[1] is label
                and not any(statement.get(key) for key in ('hasInit','hasVar','hasElse','isConstexpr','isConsteval'))):
            break
    else:return None
    before={id(node) for statement in statements[:index] for node in descendants(statement)}
    if any(jump.get('targetLabelDeclId')!=target or id(jump) not in before for jump in jumps):return None
    if any(node.get('name')==guard_name or node.get('referencedDecl',{}).get('name')==guard_name for node in nodes):
        return None
    # Fallthrough saves the condition once. Each proven forward jump skips
    # that expression, so its initialized true value enters the labeled body.
    boolean={'qualType':'bool'}
    variable={'kind':'VarDecl','id':guard_name,'name':guard_name,'type':boolean}
    def ref():return {'kind':'DeclRefExpr','type':boolean,'referencedDecl':variable}
    setup={'kind':'DeclStmt','inner':[{**variable,'init':'c','inner':[
        {'kind':'CXXBoolLiteralExpr','type':boolean,'value':True}]}]}
    condition={'kind':'BinaryOperator','type':boolean,'opcode':'=','inner':[ref(),branch[0]]}
    landing={**label,'inner':[{'kind':'IfStmt','inner':[ref(),children(label)[0]]}]}
    return {**body,'inner':[setup,*statements[:index],condition,landing,*statements[index+1:]]}

def recover_loop_terminal_jumps(body, trivial_destructors=(), canonical_type=lambda value:value):
    """Inline a source cleanup suffix ending in continue to the SAME loop.

    This permits sibling-branch error/visibility exits without a program counter
    or changed lexical storage. No declarations are duplicated. Reject captured
    target locals, shadowed bindings, different loop ownership and any source
    lifetime that would need destruction before the cloned suffix executes.
    Only an entirely proven set of jumps is rewritten; other CFGs stay strict.
    """
    paths={};labels={};jumps=[]
    loops={'ForStmt','WhileStmt','DoStmt','CXXForRangeStmt'}
    def scan(node,path=()):
        paths[id(node)]=path
        if kind(node)=='LambdaExpr':return
        if kind(node)=='GotoStmt':jumps.append(node)
        if kind(node)=='CompoundStmt':
            seq=children(node)
            for i,stmt in enumerate(seq):
                if kind(stmt)=='LabelStmt' and stmt.get('declId'):
                    labels[stmt['declId']]={'kind':'CompoundStmt','inner':[*children(stmt),*seq[i+1:]]}
        for child in children(node):scan(child,(*path,node))
    scan(body)
    if not jumps:return None
    label_nodes={node.get('declId'):node for node in descendants(body) if kind(node)=='LabelStmt'}
    def terminal(node):
        if kind(node)=='ContinueStmt':return True
        seq=children(node)
        return kind(node)=='CompoundStmt' and bool(seq) and terminal(seq[-1])
    def trivial(variable):
        typ=variable.get('type',{}).get('desugaredQualType') or variable.get('type',{}).get('qualType','')
        if has_outer_indirection(typ,'*&'):return True
        typ=re.sub(r'\[[^\]]*\]|\b(?:const|volatile|struct|class|union)\b','',typ).strip()
        return bool(re.fullmatch(r'(?:(?:signed|unsigned) )?(?:bool|char|short|int|long(?: long)?|float|double|[ui]?int(?:8|16|32|64)_t|size_t|ptrdiff_t|intptr_t|uintptr_t)',typ)
                    or canonical_type(typ) in trivial_destructors)
    replacements={};targets=set()
    for jump in jumps:
        target=jump.get('targetLabelDeclId');suffix=labels.get(target);label=label_nodes.get(target)
        if not suffix or not label or not terminal(suffix):return None
        source_path=paths[id(jump)];target_path=paths[id(label)]
        source_loop=next((node for node in reversed(source_path) if kind(node) in loops),None)
        target_loop=next((node for node in reversed(target_path) if kind(node) in loops),None)
        if source_loop is None or source_loop is not target_loop:return None
        # A suffix may contain branches and expressions, but no new storage,
        # nested control destinations, nontrivial temporaries or further jumps.
        forbidden=loops|{'DeclStmt','VarDecl','GotoStmt','LabelStmt','BreakStmt','ReturnStmt',
            'SwitchStmt','LambdaExpr','CXXBindTemporaryExpr','CXXTryStmt','CXXThrowExpr'}
        if any(kind(node) in forbidden for node in descendants(suffix)):return None
        source_ids={id(node) for node in source_path};target_ids={id(node) for node in target_path}
        entered={node.get('id') for scope in target_path if id(scope) not in source_ids
                 for node in descendants(scope) if kind(node)=='VarDecl'}
        uses=[node.get('referencedDecl',{}) for node in descendants(suffix) if kind(node)=='DeclRefExpr']
        if entered.intersection(ref.get('id') for ref in uses):return None
        leaving={node.get('id'):node for scope in source_path if id(scope) not in target_ids
                 for node in descendants(scope) if kind(node)=='VarDecl'}
        if any(not trivial(node) for node in leaving.values()):return None
        # A copied global/outer reference must not bind to a source-branch local
        # with the same spelling in the emitted lexical JavaScript.
        if any(local.get('name')==ref.get('name') and local.get('id')!=ref.get('id')
               for local in leaving.values() for ref in uses):return None
        replacements[id(jump)]=suffix;targets.add(target)
    def rewrite(node):
        if id(node) in replacements:return copy.deepcopy(replacements[id(node)])
        if kind(node)=='LabelStmt' and node.get('declId') in targets:
            return rewrite(children(node)[0])
        result={**node}
        if 'inner' in node:result['inner']=[rewrite(child) if child else child for child in node['inner']]
        return result
    return {'body':rewrite(body),'strategy':'source-same-loop-terminal-continue-suffixes',
            'detected':{'inlined_source_terminal_continue_jumps':len(replacements)}}

@dataclass(frozen=True)
class Region:
    begin:int
    end:int
    label:str
    kind:str  # exit=break to lexical block, loop=continue to lexical loop
    scope:int=0
    def name(self): return f'__source_{self.kind}_{self.label}'

class SourceFlowPlan:
    """An extensible series of recognizers, then a semantics-checked rewriter."""
    def __init__(self, function_body, trivial_destructors=None, canonical_type=None, lambda_plans=None):
        self.body=function_body
        # Source-of-truth: Clang CXXRecordDecl.definitionData.dtor.trivial.
        # An absent/ambiguous record is NEVER presumed trivially destructible.
        self.trivial_destructors=set(trivial_destructors or ())
        self.canonical_type=canonical_type or (lambda name:name)
        # A proved reference closure cannot escape the source function or
        # destroy captured objects. Its parameters, locals and loop exits belong
        # to the separately emitted callable, never to this goto scope.
        closures={identity:proof for identity,proof in (lambda_plans or {}).items()
            if not any(kind(node) in ('GotoStmt','LabelStmt','IndirectGotoStmt','AddrLabelExpr')
                       for node in descendants(proof['body']))}
        self.lambda_boundaries=frozenset(closures)
        self.lambda_constructors={identity for proof in closures.values() for identity in proof['constructor_ids']}
        self.statements=children(function_body)
        self.labels={}
        self.label_at={}
        self.goto_ops={}
        self.tail_return={}
        self.nested_terminal={}
        self.continue_suffixes={}
        self.loop_owners={}
        self.suffix_required_scopes={}
        self.jump_scopes={}
        self.regions=[]
        self.scopes={}
        self.positions={}
        self.label_scopes={}
        self.control_labels={}
        self.control_exits={}
        self.elided_tail_labels=set()
        self.diagnostics=Counter()
        self.passes=('find_nested_terminal_labels','index_labels','resolve_edges','verify_copied_suffixes','validate_lifetimes','detect_tail_returns','form_regions','verify_nesting','bind_control_exits')
        for stage in self.passes: getattr(self,stage)()

    def find_nested_terminal_labels(self):
        """A jump to an error-return suffix can execute that source suffix.

        Require an unconditional return (or a direct Clang noreturn call)
        and no loop exits or further jumps.
        Reject references to locals in the enclosing nested scope: duplicating
        a suffix must not import uninitialized storage from a different path.
        """
        def returns(node):
            if kind(node)=='ReturnStmt':return True
            if kind(node)=='CallExpr':
                seq=children(node)
                callee=seq[0] if seq else {}
                while kind(callee) in ('ParenExpr','ImplicitCastExpr') and len(children(callee))==1:
                    callee=children(callee)[0]
                decl=callee.get('referencedDecl',{})
                typ=decl.get('type',{}).get('qualType','')
                return (kind(callee)=='DeclRefExpr' and decl.get('kind')=='FunctionDecl' and
                        bool(re.search(r'__attribute__\s*\(\(\s*noreturn\s*\)\)'
                                       r'\s*(?:noexcept(?:\((?:true|false)\))?)?\s*$',typ)))
            if kind(node)=='CompoundStmt':
                seq=children(node)
                return bool(seq and returns(seq[-1]))
            if kind(node)=='IfStmt':
                seq=children(node)
                return bool(node.get('hasElse') and len(seq)>=3 and returns(seq[-1]) and returns(seq[-2]))
            return False
        def consider(label,statements,restricted,loop):
            if kind(label)!='LabelStmt' or len(children(label))!=1:return
            suffix={'kind':'CompoundStmt','inner':[children(label)[0],*statements]}
            for index,statement in enumerate(children(suffix)):
                if kind(statement)!='DoStmt' or len(children(statement))!=2:continue
                body,condition=children(statement)
                while kind(condition) in ('ImplicitCastExpr','ParenExpr') and len(children(condition))==1:
                    condition=children(condition)[0]
                zero=(kind(condition)=='IntegerLiteral' and str(condition.get('value'))=='0'
                      or kind(condition)=='CXXBoolLiteralExpr' and condition.get('value') is False)
                if (zero and kind(body)=='CompoundStmt' and not any(kind(part) in loops|{
                        'BreakStmt','ContinueStmt','GotoStmt','IndirectGotoStmt','LabelStmt','CaseStmt','DefaultStmt'}
                        for part in descendants(body))):
                    # A do/while(0) macro without internal control transfers
                    # is exactly its lexical block. Retain that scope while
                    # exposing the original outer-loop terminal continuation.
                    suffix['inner'][index]=body
            nodes=list(descendants(suffix))
            refs=[x.get('referencedDecl',{}) for x in nodes if kind(x)=='DeclRefExpr']
            uses={ref.get('id') for ref in refs}
            bad={'BreakStmt','LabelStmt','CaseStmt','DefaultStmt','LambdaExpr'}
            if any(kind(x) in bad for x in nodes):return
            if returns(suffix) and not any(kind(x) in ('GotoStmt','ContinueStmt','VarDecl') for x in nodes):
                self.nested_terminal[label.get('declId')]=suffix
            if (loop and ends_in_continue(suffix) and not any(
                kind(x) in loops or kind(x) in ('SwitchStmt','CXXBindTemporaryExpr')
                or (kind(x)=='VarDecl' and (x.get('storageClass') or x.get('tls'))) for x in nodes)):
                self.nested_terminal[label.get('declId')]=suffix
                self.continue_suffixes[label.get('declId')]=loop
            if label.get('declId') in self.nested_terminal:
                self.suffix_required_scopes[label['declId']]={restricted[key] for key in uses if key in restricted}

        loops={'ForStmt','WhileStmt','DoStmt','CXXForRangeStmt'}
        def ends_in_continue(node):
            seq=children(node)
            return kind(node)=='ContinueStmt' or kind(node)=='CompoundStmt' and bool(seq) and ends_in_continue(seq[-1])

        def visit(node,restricted=None,loop=None,scopes=()):
            k=kind(node)
            if k in ('LambdaExpr','RecordDecl','CXXRecordDecl'):return
            restricted=dict(restricted or {})
            scopes=(*scopes,id(node))
            if k in loops:loop=id(node)
            if k=='GotoStmt':
                self.loop_owners[id(node)]=loop
                self.jump_scopes[id(node)]=frozenset(scopes)
            if kind(node)=='CompoundStmt':
                seq=children(node)
                for i,stmt in enumerate(seq):
                    if node is not self.body and kind(stmt)=='LabelStmt':
                        consider(stmt,seq[i+1:],restricted,loop)
                    if kind(stmt) in ('CaseStmt','DefaultStmt'):
                        entry=stmt
                        while kind(entry) in ('CaseStmt','DefaultStmt') and children(entry):
                            entry=children(entry)[-1]
                        following=i+1
                        while following<len(seq) and kind(seq[following]) not in ('CaseStmt','DefaultStmt'):
                            following+=1
                        # A label may own only the first statement of a flat
                        # switch arm. Prove its terminating suffix up to the
                        # next dispatch label using the same lifetime and
                        # loop-owner checks as every other copied suffix.
                        consider(entry,seq[i+1:following],restricted,loop)
                    if kind(stmt)=='DeclStmt' and node is not self.body:
                        restricted.update((x.get('id'),id(node)) for x in children(stmt) if kind(x)=='VarDecl')
            # Clang attaches a source label immediately after case/default to
            # that dispatch node. A self-contained terminal body is safe too.
            # Implicit fallthrough and enclosing switch suffixes stay blocked.
            if k in ('CaseStmt','DefaultStmt') and children(node):
                consider(children(node)[-1],[],restricted,loop)
            # A for/if initializer also belongs to its nested lexical scope.
            if node is not self.body and kind(node) in loops|{'IfStmt','SwitchStmt'}:
                restricted.update((x.get('id'),id(node)) for stmt in children(node) if kind(stmt)=='DeclStmt'
                    for x in children(stmt) if kind(x)=='VarDecl')
            for child in children(node):visit(child,restricted,loop,scopes)
        visit(self.body)

    def index_labels(self):
        # Regions belong to the nearest original compound statement. A jump
        # may leave nested statements, but cannot enter a sibling/inner scope.
        # This preserves original loop conditions and initialization without
        # dispatching a synthetic program counter.
        for scope in descendants(self.body,self.lambda_boundaries):
            if kind(scope)!='CompoundStmt':continue
            sid=id(scope);seq=children(scope);self.scopes[sid]=seq
            for i,node in enumerate(seq):
                for child in descendants(node,self.lambda_boundaries):
                    self.positions.setdefault(id(child),{})[sid]=i
                current=node
                while kind(current)=='LabelStmt':
                    name=current.get('name','');key=current.get('declId')
                    if not key or not re.fullmatch(r'[A-Za-z_]\w*',name):
                        raise ControlFlowUnsupported('unidentified/nonidentifier goto label')
                    if key in self.labels:raise ControlFlowUnsupported('duplicate goto label')
                    self.labels[key]=(name,i);self.label_scopes[key]=sid
                    if scope is self.body:self.label_at.setdefault(i,[]).append(current)
                    current=children(current)[0] if children(current) else {}
        for node in descendants(self.body,self.lambda_boundaries):
            if kind(node)=='LabelStmt' and node.get('declId') not in self.labels and node.get('declId') not in self.nested_terminal:
                raise ControlFlowUnsupported('goto target not at an original compound statement boundary')
        self.diagnostics['labels']=len(self.labels)

    def resolve_edges(self):
        if not self.labels and not self.nested_terminal: raise ControlFlowUnsupported('goto without source label')
        self.edges=[]
        for node in descendants(self.body,self.lambda_boundaries):
            if kind(node)!='GotoStmt':continue
            target=node.get('targetLabelDeclId');sid=self.label_scopes.get(target)
            positions=self.positions.get(id(node),{})
            if target in self.nested_terminal and (sid is None or sid not in positions):
                if not self.suffix_required_scopes[target] <= self.jump_scopes[id(node)]:
                    raise ControlFlowUnsupported('copied source suffix reads a local from an entered scope')
                if target in self.continue_suffixes:
                    if self.loop_owners.get(id(node))!=self.continue_suffixes[target]:
                        raise ControlFlowUnsupported('copied source suffix crosses loop ownership')
                    self.diagnostics['same_loop_terminal_jumps']+=1
                self.tail_return[id(node)]=self.nested_terminal[target]
                self.diagnostics['nested_terminal_jumps']+=1
                continue
            if target not in self.labels:raise ControlFlowUnsupported('unresolved computed or external goto target')
            if sid not in positions:
                raise ControlFlowUnsupported('goto enters a different lexical scope')
            name,pos=self.labels[target];i=positions[sid]
            mode='exit' if i<pos else 'loop'
            self.edges.append((node,i,pos,name,mode,sid))
            self.goto_ops[id(node)]=(mode,name)
            self.diagnostics['forward_goto' if mode=='exit' else 'backward_goto']+=1
            if sid!=id(self.body):self.diagnostics['nested_lexical_jumps']+=1
        if not self.edges and not self.tail_return: raise ControlFlowUnsupported('label without any goto')

    def verify_copied_suffixes(self):
        # Only follow acyclic suffix-to-suffix jumps. An inner jump must not
        # rely on a lexical block label absent at the new emission position.
        visiting=set();checked=set()
        required={id(suffix):self.suffix_required_scopes[target]
                  for target,suffix in self.nested_terminal.items()}
        def check(suffix,available):
            identity=id(suffix)
            if identity in visiting:raise ControlFlowUnsupported('recursive copied source suffix')
            if not required[identity] <= available:
                raise ControlFlowUnsupported('copied source suffix reads a local from an entered scope')
            key=identity,available
            if key in checked:return
            visiting.add(identity)
            nodes=list(descendants(suffix))
            in_suffix={id(node) for node in nodes}
            for node in nodes:
                if kind(node)!='GotoStmt':continue
                nested=self.tail_return.get(id(node))
                if nested is None:raise ControlFlowUnsupported('copied source suffix crosses a lexical jump')
                check(nested,available | (self.jump_scopes[id(node)] & in_suffix))
            visiting.remove(identity);checked.add(key)
        for position,suffix in self.tail_return.items():check(suffix,self.jump_scopes[position])

    def validate_lifetimes(self):
        # Lexical wrapping changes JS block boundaries. C locals therefore use
        # function-scoped var in these functions, while duplicate/shadowed C
        # local names and nontrivial C++ lifetime nodes are rejected.
        unsafe={'CXXBindTemporaryExpr',
                'CXXNewExpr','CXXDeleteExpr','CXXThrowExpr','CXXTryStmt',
                'CXXDestructorDecl','CXXCtorInitializer','LambdaExpr',
                'IndirectGotoStmt','AddrLabelExpr','SEHLeaveStmt'}
        locals_seen=set()
        body_nodes=list(descendants(self.body,self.lambda_boundaries))
        local_decls=[n for n in body_nodes if kind(n)=='VarDecl']
        local_ids={n.get('id') for n in local_decls if n.get('id')}
        local_names={n.get('name') for n in local_decls if n.get('name')}
        reference_nodes=descendants(self.body) if self.lambda_boundaries else body_nodes
        refs=[n.get('referencedDecl',{}) for n in reference_nodes if kind(n)=='DeclRefExpr']
        nonlocal_names={ref.get('name') for ref in refs if ref.get('id') not in local_ids}
        self.hoisted_locals=[]
        self.alpha_locals={}
        self.diagnostics['shadowed_locals_renamed']=0
        for node in body_nodes:
            k=kind(node)
            if k=='LambdaExpr' and node.get('id') in self.lambda_boundaries:continue
            if k in ('CXXConstructExpr','CXXTemporaryObjectExpr'):
                if node.get('id') in self.lambda_constructors:continue
                # C++ classes with an explicitly Clang-proven trivial destructor
                # need no exit cleanups. The original AST expression is emitted
                # in its original position, even when a backward goto re-enters
                # the lexical region; the constructor executes on each visit.
                # CXXBindTemporaryExpr/nontrivial destructor scopes still fail.
                t=node.get('type',{}).get('desugaredQualType') or node.get('type',{}).get('qualType','')
                t=re.sub(r'\b(?:const|volatile|struct|class|union)\b','',t).strip()
                # A fixed-size array's destruction is the destruction of its
                # elements. Preserve construction at the original statement
                # and prove the selected element type through the same Clang
                # aliases and destructor evidence as a scalar record.
                t=re.sub(r'(?:\s*\[\s*\d+\s*\])+$','',t).strip()
                if self.canonical_type(t) not in self.trivial_destructors:
                    raise ControlFlowUnsupported('goto C++ lifetime requires Clang-proven trivial destructor: '+t,
                                                 required_records=(t,))
                self.diagnostics['trivial_constructions_checked']+=1
            if k in unsafe: raise ControlFlowUnsupported('goto crosses unsupported C++ lifetime/control flow: '+k)
            if k=='VarDecl' and node.get('name') and node.get('storageClass')!='static':
                name=node['name']
                from_source=name
                if name in locals_seen or name in nonlocal_names:
                    decl_id=node.get('id')
                    if not decl_id:
                        raise ControlFlowUnsupported('shadowed goto local missing Clang declaration identity: '+name)
                    serial=len(self.hoisted_locals)
                    name=f'__cxx_scope_{serial}_{from_source}'
                    # Do not collide with any user-written local or parameter.
                    if name in local_names or name in nonlocal_names:
                        raise ControlFlowUnsupported('generated scoped-local collision: '+name)
                    self.alpha_locals[decl_id]=name
                    self.diagnostics['shadowed_locals_renamed']+=1
                locals_seen.add(from_source)
                self.hoisted_locals.append(name)
            if k=='LabelStmt' and node.get('isSideEntry'):
                raise ControlFlowUnsupported('side entry into cleanup scope')
        self.diagnostics['locals_checked']=len(locals_seen)
        if self.lambda_boundaries:self.diagnostics['separate_reference_closures']=len(self.lambda_boundaries)

    def detect_tail_returns(self):
        """Replace a forward goto-to-final-return with an ordinary early return.

        No C++ object lifetimes are crossed (validated above). This is a real
        source-level transformation rather than a bytecode dispatch scheme.
        """
        for node,i,pos,name,mode,sid in self.edges:
            if mode!='exit': continue
            if any(m=='loop' and n==name for _,_,_,n,m,_ in self.edges):continue
            statements=self.scopes[sid]
            if any(kind(x)!='NullStmt' for x in statements[pos+1:]):continue
            target=statements[pos]
            while kind(target)=='LabelStmt':
                target=children(target)[0] if children(target) else {}
            if kind(target)!='ReturnStmt':continue
            self.goto_ops[id(node)]=('return',name)
            self.tail_return[id(node)]=target
            self.diagnostics['early_returns']+=1

    def form_regions(self):
        regions=[]
        for name,pos,sid in set((name,pos,sid) for _,_,pos,name,_,sid in self.edges):
            forwards=[i for node,i,p,n,m,s in self.edges if s==sid and p==pos and n==name and m=='exit' and id(node) not in self.tail_return]
            backwards=[i for _,i,p,n,m,s in self.edges if s==sid and p==pos and n==name and m=='loop']
            # Begin at the first actual source statement that can jump, not
            # at function entry. Starting all exit blocks at zero falsely
            # makes a forward skip inside a natural loop look irreducible.
            if forwards:regions.append(Region(min(forwards),pos,name,'exit',sid))
            if backwards:regions.append(Region(pos,max(backwards)+1,name,'loop',sid))
        self.regions=regions
        # Remove dead trailing label returns only if all incoming jumps were
        # converted to direct returns and the immediate predecessor returns.
        for label_id,(name,pos) in self.labels.items():
            sid=self.label_scopes[label_id];statements=self.scopes[sid]
            inbound=[node for node,_,_,n,_,_ in self.edges if n==name]
            if (inbound and all(id(node) in self.tail_return for node in inbound)
                and pos>0 and kind(statements[pos-1])=='ReturnStmt'):
                self.elided_tail_labels.add((sid,pos))
                self.diagnostics['dead_tail_returns_removed']+=1
        self.diagnostics['exit_blocks']=sum(x.kind=='exit' for x in regions)
        self.diagnostics['natural_loops']=sum(x.kind=='loop' for x in regions)

    def verify_nesting(self):
        reg=self.regions
        for i,a in enumerate(reg):
            if not (0<=a.begin<a.end<=len(self.scopes[a.scope])):
                raise ControlFlowUnsupported('zero-length/invalid goto region')
            # A lexical block cannot contain switch dispatch labels. Ordinary
            # labels inside a case's own compound scope are safe.
            for stmt in self.scopes[a.scope][a.begin:a.end]:
                if kind(stmt) in ('CaseStmt','DefaultStmt'):
                    raise ControlFlowUnsupported('goto region crosses switch dispatch labels')
            for b in reg[i+1:]:
                if a.scope!=b.scope:continue
                # Intervals must be disjoint or nested. Crossing regions are
                # irreducible and need a separate state-recovery pass.
                if a.begin<b.begin<a.end<b.end or b.begin<a.begin<b.end<a.end:
                    raise ControlFlowUnsupported('irreducible crossing goto regions: '+a.label+'/'+b.label)
                if a.begin==b.begin and a.end==b.end:
                    raise ControlFlowUnsupported('ambiguous coincident goto regions')
        self.diagnostics['reducible']=1

    def bind_control_exits(self):
        # Inserted natural loops must never capture a source break/continue.
        # Resolve each to its original AST loop/switch, including range loops.
        loops={'ForStmt','WhileStmt','DoStmt','CXXForRangeStmt'}
        def visit(node,breaks=(),continues=()):
            k=kind(node)
            if k in ('RecordDecl','CXXRecordDecl'):return
            if k=='LambdaExpr' and node.get('id') in self.lambda_boundaries:return
            if k in loops or k=='SwitchStmt':
                label=f'__source_control_{len(self.control_labels)}'
                self.control_labels[id(node)]=label
                breaks=(*breaks,label)
                if k in loops:continues=(*continues,label)
            if k in ('BreakStmt','ContinueStmt'):
                targets=breaks if k=='BreakStmt' else continues
                if not targets:raise ControlFlowUnsupported('source loop exit without owning control statement')
                self.control_exits[id(node)]=('break' if k=='BreakStmt' else 'continue')+' '+targets[-1]+';'
            for child in children(node):visit(child,breaks,continues)
        visit(self.body)

    def control_prefix(self,node):
        label=self.control_labels.get(id(node))
        return label+': ' if label else ''

    def has_scope_regions(self,node):
        return any(region.scope==id(node) for region in self.regions)

    def target(self,node):
        try: mode,name=self.goto_ops[id(node)]
        except KeyError: raise ControlFlowUnsupported('goto not in planned function')
        if mode=='return':raise ControlFlowUnsupported('tail-return goto must be emitted as a source return')
        return ('break' if mode=='exit' else 'continue')+f' __source_{mode}_{name};'

    def emit(self, emitter, level=1, scope=None):
        """Insert region delimiters around *original* AST statements.

        JS statements are still emitted by the ordinary source AST emitter.
        """
        scope=self.body if scope is None else scope
        sid=id(scope);statements=self.scopes[sid]
        regions=[region for region in self.regions if region.scope==sid]
        lines=[]
        pad=lambda depth:'  '*depth
        stack=[]
        for i in range(len(statements)+1):
            while stack and stack[-1].end==i:
                region=stack.pop()
                if region.kind=='loop':
                    last=statements[i-1]
                    last_kind=kind(last)
                    last_unconditional=(last_kind=='ReturnStmt' or (last_kind=='GotoStmt' and
                        self.goto_ops.get(id(last))==('loop',region.label)))
                    if not last_unconditional:lines.append(pad(level+len(stack)+1)+'break;')
                lines.append(pad(level+len(stack))+'}')
            if i==len(statements):break
            incoming=[r for r in regions if r.begin==i]
            incoming.sort(key=lambda r:(-r.end,r.kind,r.label))
            for region in incoming:
                lines.append(pad(level+len(stack))+region.name()+(': while (true) {' if region.kind=='loop' else ': {'))
                stack.append(region)
            if (sid,i) in self.elided_tail_labels:continue
            stmt=statements[i]
            while kind(stmt)=='LabelStmt':
                stmt=children(stmt)[0] if children(stmt) else {'kind':'NullStmt'}
            depth=level+len(stack)
            out=emitter.statements(stmt,depth+(1 if kind(stmt)=='CompoundStmt' else 0))
            if kind(stmt)=='CompoundStmt':out=pad(depth)+'{\n'+out+'\n'+pad(depth)+'}'
            if out:lines.append(out)
        if stack:raise ControlFlowUnsupported('unclosed goto region')
        return '\n'.join(lines)
