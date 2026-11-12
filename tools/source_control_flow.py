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

class ControlFlowUnsupported(Exception):
    pass


def kind(node): return node.get('kind','')
def children(node): return [n for n in node.get('inner',[]) if n]
def descendants(node):
    yield node
    for child in children(node): yield from descendants(child)

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
        if '*' in typ or typ.rstrip().endswith('&'):return True
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
    def __init__(self, function_body, trivial_destructors=None, canonical_type=None):
        self.body=function_body
        # Source-of-truth: Clang CXXRecordDecl.definitionData.dtor.trivial.
        # An absent/ambiguous record is NEVER presumed trivially destructible.
        self.trivial_destructors=set(trivial_destructors or ())
        self.canonical_type=canonical_type or (lambda name:name)
        self.statements=children(function_body)
        self.labels={}
        self.label_at={}
        self.goto_ops={}
        self.tail_return={}
        self.nested_terminal={}
        self.regions=[]
        self.scopes={}
        self.positions={}
        self.label_scopes={}
        self.control_labels={}
        self.control_exits={}
        self.elided_tail_labels=set()
        self.diagnostics=Counter()
        self.passes=('find_nested_terminal_labels','index_labels','resolve_edges','validate_lifetimes','detect_tail_returns','form_regions','verify_nesting','bind_control_exits')
        for stage in self.passes: getattr(self,stage)()

    def find_nested_terminal_labels(self):
        """A jump to an error-return suffix can execute that source suffix.

        Require an unconditional return and no loop exits or further jumps.
        Reject references to locals in the enclosing nested scope: duplicating
        a suffix must not import uninitialized storage from a different path.
        """
        def returns(node):
            if kind(node)=='ReturnStmt':return True
            if kind(node)=='CompoundStmt':
                seq=children(node)
                return bool(seq and returns(seq[-1]))
            if kind(node)=='IfStmt':
                seq=children(node)
                return bool(node.get('hasElse') and len(seq)>=3 and returns(seq[-1]) and returns(seq[-2]))
            return False
        def visit(node,restricted=frozenset()):
            if kind(node)=='CompoundStmt':
                seq=children(node)
                local={x.get('id') for stmt in seq for x in children(stmt)
                       if kind(stmt)=='DeclStmt' and kind(x)=='VarDecl'} if node is not self.body else set()
                restricted=restricted|local
                for i,stmt in enumerate(seq):
                    if node is not self.body and kind(stmt)=='LabelStmt':
                        suffix={'kind':'CompoundStmt','inner':[children(stmt)[0],*seq[i+1:]]}
                        uses={x.get('referencedDecl',{}).get('id') for x in descendants(suffix) if kind(x)=='DeclRefExpr'}
                        if (returns(suffix) and not uses.intersection(restricted) and not any(
                            kind(x) in ('GotoStmt','BreakStmt','ContinueStmt','LabelStmt') for x in descendants(suffix))):
                            self.nested_terminal[stmt.get('declId')]=suffix
            # A for/if initializer also belongs to its nested lexical scope.
            if node is not self.body and kind(node) in ('ForStmt','IfStmt','SwitchStmt'):
                restricted=restricted|{x.get('id') for stmt in children(node) if kind(stmt)=='DeclStmt'
                    for x in children(stmt) if kind(x)=='VarDecl'}
            for child in children(node):visit(child,restricted)
        visit(self.body)

    def index_labels(self):
        # Regions belong to the nearest original compound statement. A jump
        # may leave nested statements, but cannot enter a sibling/inner scope.
        # This preserves original loop conditions and initialization without
        # dispatching a synthetic program counter.
        for scope in descendants(self.body):
            if kind(scope)!='CompoundStmt':continue
            sid=id(scope);seq=children(scope);self.scopes[sid]=seq
            for i,node in enumerate(seq):
                for child in descendants(node):
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
        for node in descendants(self.body):
            if kind(node)=='LabelStmt' and node.get('declId') not in self.labels and node.get('declId') not in self.nested_terminal:
                raise ControlFlowUnsupported('goto target not at an original compound statement boundary')
        self.diagnostics['labels']=len(self.labels)

    def resolve_edges(self):
        if not self.labels and not self.nested_terminal: raise ControlFlowUnsupported('goto without source label')
        self.edges=[]
        for node in descendants(self.body):
            if kind(node)!='GotoStmt':continue
            target=node.get('targetLabelDeclId');sid=self.label_scopes.get(target)
            positions=self.positions.get(id(node),{})
            if target in self.nested_terminal and (sid is None or sid not in positions):
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

    def validate_lifetimes(self):
        # Lexical wrapping changes JS block boundaries. C locals therefore use
        # function-scoped var in these functions, while duplicate/shadowed C
        # local names and nontrivial C++ lifetime nodes are rejected.
        unsafe={'CXXBindTemporaryExpr',
                'CXXNewExpr','CXXDeleteExpr','CXXThrowExpr','CXXTryStmt',
                'CXXDestructorDecl','CXXCtorInitializer','LambdaExpr',
                'IndirectGotoStmt','AddrLabelExpr','SEHLeaveStmt'}
        locals_seen=set()
        self.hoisted_locals=[]
        self.alpha_locals={}
        self.diagnostics['shadowed_locals_renamed']=0
        for node in descendants(self.body):
            k=kind(node)
            if k in ('CXXConstructExpr','CXXTemporaryObjectExpr'):
                # C++ classes with an explicitly Clang-proven trivial destructor
                # need no exit cleanups. The original AST expression is emitted
                # in its original position, even when a backward goto re-enters
                # the lexical region; the constructor executes on each visit.
                # CXXBindTemporaryExpr/nontrivial destructor scopes still fail.
                t=node.get('type',{}).get('desugaredQualType') or node.get('type',{}).get('qualType','')
                t=re.sub(r'\b(?:const|volatile|struct|class|union)\b','',t).strip()
                if self.canonical_type(t) not in self.trivial_destructors:
                    raise ControlFlowUnsupported('goto C++ lifetime requires Clang-proven trivial destructor: '+t)
                self.diagnostics['trivial_constructions_checked']+=1
            if k in unsafe: raise ControlFlowUnsupported('goto crosses unsupported C++ lifetime/control flow: '+k)
            if k=='VarDecl' and node.get('name') and node.get('storageClass')!='static':
                name=node['name']
                from_source=name
                if name in locals_seen:
                    decl_id=node.get('id')
                    if not decl_id:
                        raise ControlFlowUnsupported('shadowed goto local missing Clang declaration identity: '+name)
                    serial=len(self.hoisted_locals)
                    name=f'__cxx_scope_{serial}_{from_source}'
                    # Do not collide with any user-written local or parameter.
                    existing={v.get('name') for v in descendants(self.body) if kind(v)=='VarDecl'}
                    if name in existing:
                        raise ControlFlowUnsupported('generated scoped-local collision: '+name)
                    self.alpha_locals[decl_id]=name
                    self.diagnostics['shadowed_locals_renamed']+=1
                locals_seen.add(from_source)
                self.hoisted_locals.append(name)
            if k=='LabelStmt' and node.get('isSideEntry'):
                raise ControlFlowUnsupported('side entry into cleanup scope')
        self.diagnostics['locals_checked']=len(locals_seen)

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
