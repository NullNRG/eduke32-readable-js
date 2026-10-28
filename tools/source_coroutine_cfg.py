"""Lower Clang C statement graphs with nested case labels into native JavaScript.

C allows `case` inside a nested while/do/if (e.g. Duff's device or miniz
resumable inflation). JS doesn't. Convert only the affected *original function*
into a source-level continuation switch. Every basic block contains emitted
original C expressions; the state is a lexical control-flow continuation, not
an emulated CPU, an AST interpreter, or a bytecode/LLVM fallback.

Control-flow with unsupported C++ lifetime/ABI semantics fails closed.
"""
from __future__ import annotations
from types import SimpleNamespace
import re

class CoroutineUnsupported(Exception): pass

def kind(node): return (node or {}).get('kind','')
def kids(node): return [x for x in (node or {}).get('inner',[]) if x]
def descendants(node):
    yield node
    for child in kids(node):
        yield from descendants(child)

CASE=('CaseStmt','DefaultStmt')

def needs_cfg(body):
    """Find case labels outside their immediate C switch compound arm."""
    def nested(node, direct=False):
        k=kind(node)
        if k=='SwitchStmt':
            raw=kids(node)
            body=raw[-1] if raw else {}
            if kind(body)!='CompoundStmt':return False
            return any(nested(child,kind(child) in CASE) for child in kids(body))
        if k in CASE:
            if not direct:return True
            return any(nested(x,kind(x) in CASE) for x in kids(node))
        return any(nested(x,False) for x in kids(node))
    return nested(body)

class CoroutineCFG:
    def __init__(self,body,emit):
        self.body,self.emit=body,emit
        self.blocks={};self.next_id=1;self.case_targets={};self.label_targets={}
        self.pending_gotos=[]
        self.locations={}
        self.locals=[]
        self.alpha={}
        self._prepare_lifetimes()

    def _prepare_lifetimes(self):
        # C continuation jumps cannot erase automatic C++ destructor and
        # constructor side effects. Pure C scalar/aggregate locals are scoped
        # by their original assignment blocks and stored function-locally.
        unsafe={'CXXBindTemporaryExpr','CXXTemporaryObjectExpr','CXXNewExpr',
                'CXXDeleteExpr','CXXThrowExpr','CXXTryStmt','CXXCtorInitializer',
                'IndirectGotoStmt','AddrLabelExpr','SEHLeaveStmt','GCCAsmStmt',
                'CXXForRangeStmt','CXXConstructExpr','CXXMemberCallExpr'}
        names=set();params=set(self.emit.local_types)
        for node in descendants(self.body):
            k=kind(node)
            if k in unsafe:
                raise CoroutineUnsupported('C coroutine crosses unproven C++ lifetime/ABI: '+k)
            if k=='VarDecl' and node.get('storageClass')=='static':
                name=node.get('name')
                if not name or not re.fullmatch(r'[A-Za-z_]\w*',name):
                    raise CoroutineUnsupported('unidentified function static')
                # CFG blocks are emitted in reverse topological construction
                # order. References must still resolve to their C lexical
                # declaration BEFORE their initializer block is generated.
                self.emit.static_locals[name]='__static_'+self.emit.current_function+'_'+name
            if k=='VarDecl' and node.get('storageClass')!='static':
                original=node.get('name');identity=node.get('id')
                if not original or not re.fullmatch(r'[A-Za-z_]\w*',original) or not identity:
                    raise CoroutineUnsupported('unnamed or untracked coroutine local')
                name=original
                if name in names or name in params:
                    name=f'__cxx_cfg_local_{len(self.locals)}_{original}'
                    self.alpha[identity]=name
                if name in names or name in params:
                    raise CoroutineUnsupported('C local identity cannot be uniquely renamed')
                names.add(name);self.locals.append(name)
        # Emit.expr and Emit.statements use the same Clang declaration-ID
        # renaming that ordinary goto lowering already proves.
        # This existing lowering owns its control edges itself. The statement
        # emitter still needs the shared lexical-plan interface for expressions
        # and declarations, even when there are no structured goto regions.
        self.emit.goto_plan=SimpleNamespace(alpha_locals=self.alpha,
            control_prefix=lambda node:'',has_scope_regions=lambda node:False)

    def node(self,code):
        i=self.next_id;self.next_id+=1
        if i>16000:raise CoroutineUnsupported('C continuation graph exceeds bounded size')
        self.blocks[i]=code
        return i

    @staticmethod
    def goto(target):return f'__cxx_pc = {target}; continue __cxx_cfg_loop;'

    def straight(self,statement,following):
        code=self.emit.statements(statement,0).strip()
        return self.node((code+'\n' if code else '')+self.goto(following))

    def sequence(self,children,following,break_dest=None,continue_dest=None,switch_cases=None):
        result=following
        for child in reversed(children):
            result=self.compile(child,result,break_dest,continue_dest,switch_cases)
        return result

    def compile(self,n,following,break_dest=None,continue_dest=None,switch_cases=None):
        k=kind(n);a=kids(n)
        if k=='CompoundStmt':
            return self.sequence(a,following,break_dest,continue_dest,switch_cases)
        if k=='DeclStmt':
            return self.sequence(a,following,break_dest,continue_dest,switch_cases)
        if k in CASE:
            if switch_cases is None:raise CoroutineUnsupported('case without parent switch')
            if not a:raise CoroutineUnsupported('case missing body')
            target=self.compile(a[-1],following,break_dest,continue_dest,switch_cases)
            if k=='CaseStmt':
                if len(a)!=2:raise CoroutineUnsupported('GNU case-range or unsupported C case')
                label=self.emit.expr(a[0])
            else:
                if len(a)!=1:raise CoroutineUnsupported('default label shape')
                label=None
            if label in switch_cases:
                raise CoroutineUnsupported('duplicate C switch case/default')
            switch_cases[label]=target
            return target
        if k=='LabelStmt':
            identity=n.get('declId')
            if not identity or not a:raise CoroutineUnsupported('unidentified C goto label')
            target=self.compile(a[0],following,break_dest,continue_dest,switch_cases)
            if identity in self.label_targets:raise CoroutineUnsupported('duplicate goto label')
            self.label_targets[identity]=target
            return target
        if k=='GotoStmt':
            label=n.get('targetLabelDeclId')
            if not label:raise CoroutineUnsupported('computed goto unsupported')
            result=self.node('')
            self.pending_gotos.append((result,label))
            return result
        if k=='BreakStmt':
            if break_dest is None:raise CoroutineUnsupported('break outside breakable C context')
            return self.node(self.goto(break_dest))
        if k=='ContinueStmt':
            if continue_dest is None:raise CoroutineUnsupported('continue outside C loop')
            return self.node(self.goto(continue_dest))
        if k=='ReturnStmt':
            return self.node(self.emit.statements(n,0).strip())
        if k=='IfStmt':
            if n.get('hasVar'):raise CoroutineUnsupported('if condition variable has unproven lifetime')
            has_init=bool(n.get('hasInit'))
            if len(a) not in (2+int(has_init),3+int(has_init)):
                raise CoroutineUnsupported('if shape')
            cond=a[int(has_init)];yes=a[1+int(has_init)]
            no=a[2+int(has_init)] if len(a)>2+int(has_init) else None
            positive=self.compile(yes,following,break_dest,continue_dest,switch_cases)
            negative=self.compile(no,following,break_dest,continue_dest,switch_cases) if no else following
            dispatch=self.node(f'__cxx_pc = ({self.emit.expr(cond)}) ? {positive} : {negative}; continue __cxx_cfg_loop;')
            return self.compile(a[0],dispatch,break_dest,continue_dest,switch_cases) if has_init else dispatch
        if k=='WhileStmt':
            if len(a)!=2:raise CoroutineUnsupported('while shape')
            head=self.node('')
            body=self.compile(a[1],head,following,head,switch_cases)
            self.blocks[head]=f'__cxx_pc = ({self.emit.expr(a[0])}) ? {body} : {following}; continue __cxx_cfg_loop;'
            return head
        if k=='DoStmt':
            if len(a)!=2:raise CoroutineUnsupported('do shape')
            cond=self.node('')
            body=self.compile(a[0],cond,following,cond,switch_cases)
            self.blocks[cond]=f'__cxx_pc = ({self.emit.expr(a[1])}) ? {body} : {following}; continue __cxx_cfg_loop;'
            return body
        if k=='ForStmt':
            raw=n.get('inner',[])
            if len(raw)<5:raise CoroutineUnsupported('for shape')
            init,condvar,cond,inc,body=raw[:5]
            if condvar:raise CoroutineUnsupported('for condition-variable lifetime')
            head=self.node('')
            inc_entry=self.node((self.emit.expr(inc)+';\n' if inc else '')+self.goto(head))
            body_entry=self.compile(body,inc_entry,following,inc_entry,switch_cases)
            self.blocks[head]=(f'__cxx_pc = ({self.emit.expr(cond)}) ? {body_entry} : {following}; '
                               if cond else f'__cxx_pc = {body_entry}; ')+'continue __cxx_cfg_loop;'
            return self.compile(init,head,break_dest,continue_dest,switch_cases) if init else head
        if k=='SwitchStmt':
            if n.get('hasVar'):raise CoroutineUnsupported('switch condition-variable lifetime')
            has_init=bool(n.get('hasInit'))
            if len(a)!=2+int(has_init) or kind(a[-1])!='CompoundStmt':
                raise CoroutineUnsupported('switch shape')
            cases={}
            self.compile(a[-1],following,following,continue_dest,cases)
            # Compile a *native JavaScript* dispatch for original source
            # C labels. Case bodies are separate source-expression blocks and
            # can legally be entered from arbitrary nested coroutine scopes.
            entries=[];default=cases.get(None,following)
            for label,dest in cases.items():
                if label is not None:entries.append(f'case {label}: __cxx_pc = {dest}; break;')
            entries.append(f'default: __cxx_pc = {default}; break;')
            dispatch=self.node('switch ('+self.emit.expr(a[int(has_init)])+') {\n'+'\n'.join(entries)+'\n}\ncontinue __cxx_cfg_loop;')
            return self.compile(a[0],dispatch,break_dest,continue_dest,switch_cases) if has_init else dispatch
        if k=='AttributedStmt':
            executable=[child for child in a if not kind(child).endswith('Attr')]
            attrs=[child for child in a if kind(child).endswith('Attr')]
            if len(executable)!=1 or any(kind(x) not in ('LikelyAttr','UnlikelyAttr','FallThroughAttr') for x in attrs):
                raise CoroutineUnsupported('unproven C statement attribute')
            return self.compile(executable[0],following,break_dest,continue_dest,switch_cases)
        if k=='NullStmt':return following
        # Use the exact existing Clang -> JS expression/assignment lowering
        # only for leaf statements. No source semantics are invented.
        if k in ('VarDecl','CallExpr','BinaryOperator','UnaryOperator','CompoundAssignOperator','DeclRefExpr',
                 'ArraySubscriptExpr','ConditionalOperator','ImplicitCastExpr','ParenExpr',
                 'CStyleCastExpr','ExprWithCleanups','FullExpr','StaticAssertDecl') or k.endswith('Expr'):
            return self.straight(n,following)
        raise CoroutineUnsupported('unproven C coroutine control-flow node: '+k)

    def generate(self):
        previous=self.emit.goto_plan
        try:
            entry=self.compile(self.body,0)
            for block,label in self.pending_gotos:
                target=self.label_targets.get(label)
                if target is None:raise CoroutineUnsupported('goto target not present in original function')
                self.blocks[block]=self.goto(target)
            # Using a dispatch per original C statement is deliberate here:
            # source case labels jump into nested scopes. JS cannot enter a
            # lexical loop body midway without an explicit continuation.
            lines=[]
            for ident,statement in sorted(self.blocks.items()):
                lines.append(f'    case {ident}: {{\n      '+statement.replace('\n','\n      ')+ '\n    }')
            declaration=('  let '+', '.join(self.locals)+';\n') if self.locals else ''
            return (declaration+f'  let __cxx_pc = {entry};\n'
                    +'  __cxx_cfg_loop: while (true) {\n'
                    +'    switch (__cxx_pc) {\n'
                    +'    case 0: return;\n'+'\n'.join(lines)+'\n'
                    +'    default: throw new Error("invalid C source continuation");\n'
                    +'    }\n  }'),len(self.blocks)
        finally:
            self.emit.goto_plan=previous
