#!/usr/bin/env python3
"""Experimental LLVM IR to linked ES modules backend.

Strict lowering of a subset of LLVM typed integer/floating-point CFG IR. It
keeps global storage and cross-translation-unit functions in one ABI context.
Unsupported IR is reported, never fabricated. This is not an ABI-complete C++
compiler or a replacement for Emscripten.
"""
import json, re, struct

SYMBOL = r'(?:"[^"\n]+"|[-\w.$]+)'
OPERAND = r'(?:%[-\w.$]+|@'+SYMBOL+r'|-?\d+|true|false|null|undef|poison)'
INTTYPE = r'i(1|8|16|32|64)'
FUNCTION = re.compile(r'^define\s+[^\n]*?@('+SYMBOL+r')\(([^\n]*)\)[^{\n]*\{\s*\n(.*?)^}',re.M|re.S)
GLOBAL = re.compile(r'^@('+SYMBOL+r')\s*=\s*([^\n]+)',re.M)
CALLNAME = re.compile(r'@('+SYMBOL+r')\(')

class Blocked(Exception):pass

def symbol(s):return s[1:-1] if s.startswith('"') else s

def definitions(ir):
    return [(symbol(n),a,b) for n,a,b in FUNCTION.findall(ir)]

def global_defs(ir,layout=None):
    out={}
    for n,line in GLOBAL.findall(ir):
        n=symbol(n)
        if n in ('llvm.global_ctors','llvm.global_dtors','llvm.compiler.used','llvm.used'):continue  # appending tables handled by linker
        # Ignore true declarations, aliases, LLVM runtime metadata, constant expressions
        if re.match(r'\s*(?:external|extern_weak)\b',line):continue
        alias=re.search(r'\balias\s+.*?,\s*ptr\s+@('+SYMBOL+r')(?:,|$)',line)
        if alias:
            target=symbol(alias[1])
            out[n]={'kind':'alias','size':0,'target':target,
                    'references':[{'offset':0,'symbol':target}]}
            continue
        # Scalar C booleans use LLVM `i1 true/false` and occupy one byte.
        m=re.search(r'\b(?:global|constant)\s+i1\s+(true|false|0|1)(?:,|$)',line)
        if m:
            out[n]={'kind':'scalar','type':'i8','value':1 if m[1] in ('true','1') else 0,'size':1};continue
        # A null pointer is not the same as an unsupported global initializer.
        m=re.search(r'\b(?:global|constant)\s+ptr\s+(null|@'+SYMBOL+r')(?:,|$)',line)
        if m:
            target=m[1]
            if target=='null':out[n]={'kind':'zeroed','size':layout.pointer_size if layout else 8,'type':'ptr'}
            else:out[n]={'kind':'relocations','size':layout.pointer_size if layout else 8,'references':[{'offset':0,'symbol':symbol(target[1:])}]}
            continue
        # Dense integer arrays / pointer tables are common in game engines.
        m=re.search(r'\b(?:global|constant)\s+\[(\d+) x (i(?:8|16|32|64)|ptr)\]\s+(\[(.*?)\])(?:,|$)',line)
        if m:
            count=int(m[1]);typ=m[2];elements=split_args(m[4])
            unit=(layout.pointer_size if layout else 8) if typ=='ptr' else int(typ[1:])//8
            if count==len(elements) and count*unit<=128*1024*1024:
                buf=bytearray(count*unit);relocs=[];okay=True
                for i,item in enumerate(elements):
                    item=item.strip()
                    match=re.fullmatch(re.escape(typ)+r'\s+(@'+SYMBOL+r'|null|true|false|-?\d+)',item)
                    if not match:okay=False;break
                    value=match[1]
                    if value.startswith('@'):
                        if typ!='ptr':okay=False;break
                        relocs.append({'offset':i*unit,'symbol':symbol(value[1:])})
                    elif value!='null':
                        num=1 if value=='true' else 0 if value=='false' else int(value)
                        buf[i*unit:(i+1)*unit]=(num% (1 << (unit*8))).to_bytes(unit,'little')
                if okay:
                    if relocs:out[n]={'kind':'relocations','size':len(buf),'value':list(buf),'references':relocs}
                    else:out[n]={'kind':'bytes','size':len(buf),'value':list(buf)}
                    continue
        m=re.search(r'\b(global|constant)\s+(i(?:8|16|32|64)|float|double)\s+(-?\d+(?:\.\d+)?)(?:,|$)',line)
        if m:
            typ=m[2];out[n]={'kind':'scalar','type':typ,'value':m[3],'size':{'i8':1,'i16':2,'i32':4,'i64':8,'float':4,'double':8}[typ]};continue
        m=re.search(r'\b(?:global|constant)\s+\[(\d+) x i8\]\s+c"((?:\\.|[^"\\])*)"',line)
        if m:
            octets=[]; raw=m[2];i=0
            while i<len(raw):
                if raw[i]=='\\' and len(raw)>=i+3 and re.fullmatch('[0-9A-Fa-f]{2}',raw[i+1:i+3]):octets.append(int(raw[i+1:i+3],16));i+=3
                elif raw[i]=='\\' and i+1<len(raw):octets.append(ord(raw[i+1]));i+=2
                else:octets.append(ord(raw[i]));i+=1
            if len(octets)>int(m[1]):out[n]={'kind':'unsupported','declaration':'String initializer larger than array '+line[:200]};continue
            octets.extend([0]*(int(m[1])-len(octets)))
            out[n]={'kind':'bytes','value':octets,'size':len(octets)};continue
        m=re.search(r'\b(?:global|constant)\s+(.*)\s+zeroinitializer(?:,|$)',line)
        if m and layout:
            try:
                size,_=layout.size_align(m[1]);out[n]={'kind':'zeroed','size':size,'type':m[1]};continue
            except Blocked:pass
        if layout is not None:
            try:
                from llvm_initializer import lower_initializer
                out[n]=lower_initializer(line,layout)
                continue
            except (Blocked,ValueError,OverflowError):pass
        out[n]={'kind':'unsupported','declaration':line[:400]}
    return out

def top_level_symbol_references(body):
    return sorted({symbol(x) for x in re.findall(r'@('+SYMBOL+r')',body)})

def llvm_dependencies(ir):
    funs=definitions(ir);globs=global_defs(ir)
    symbols={n for n,_,_ in funs}|set(globs)
    used={s for _,_,b in funs for s in top_level_symbol_references(b)}
    return {'functions':[n for n,_,_ in funs],'globals':globs,'references':sorted(used),
            'undefined_references':sorted(used-symbols)}

def clean(s):
    return re.sub(r', ![-\w.]+ !\d+.*$','',s.strip())

def decode_type_width(typ):
    t={'ptr':32,'float':32,'double':64}.get(typ)
    if t:return t
    if typ.startswith('i') and typ[1:].isdigit():return int(typ[1:])
    raise Blocked('unsupported LLVM type: '+typ)

def parse_args(args):
    # IR function arguments, excluding LLVM attributes (nonnull/noundef etc.)
    result=[]
    for item in split_llvm_args(args):
        item=item.strip()
        if not item:continue
        if item=='...':continue  # variadic suffix is handled by Emitter.lower
        typ=re.match(r'(<\d+ x (?:float|double|i(?:8|16|32|64))>|x86_fp80|i\d+|ptr|float|double)(?:\b|\s)',item)
        ident=re.search(r'(%[-\w.$]+)\s*$',item)
        if not typ or not ident:raise Blocked('argument ABI: '+item)
        result.append((typ[1],ident[1][1:]))
    return result

class Emitter:
    def __init__(self, layout=None):self.dependencies=set();self.layout=layout
    @staticmethod
    def js(x):return json.dumps(x)
    def operand(self,x):
        x=x.strip()
        if x.startswith('%'):return 'v['+self.js(x[1:])+']'
        if x.startswith('@'):
            sym=symbol(x[1:]);self.dependencies.add(sym)
            return 'ctx.ptr('+self.js(sym)+')'
        if x in ('true','false'):return '1' if x=='true' else '0'
        if x=='null':return '0'
        if x=='undef':return '0'  # LLVM undef permits a concrete zero refinement; poison does not
        if x=='poison':return 'ctx.poisonValue'  # tag poison; do NOT refine to a numeric zero
        constptr=re.fullmatch(r'inttoptr \(i\d+ (-?\d+) to ptr\)',x)
        if constptr:return constptr[1]
        if re.fullmatch(r'-?\d+',x):return x
        if re.fullmatch(r'-?(?:\d+\.\d+|\d+)(?:e[+-]?\d+)?',x,re.I):return x
        if re.fullmatch(r'0x[0-9A-Fa-f]{16}',x):
            try:return repr(struct.unpack('>d',bytes.fromhex(x[2:]))[0])
            except Exception:raise Blocked('unknown LLVM float encoding '+x)
        if re.fullmatch(r'0x[0-9A-Fa-f]{8}',x):
            try:return repr(struct.unpack('>f',bytes.fromhex(x[2:]))[0])
            except Exception:raise Blocked('unknown LLVM float encoding '+x)
        m=re.fullmatch(r'getelementptr(?: inbounds)?(?: inrange\([^)]*\))? \(i8, ptr (@'+SYMBOL+r'|%[-\w.$]+), i64 (-?\d+)\)',x)
        if m:
            return '('+self.operand(m[1])+'+'+m[2]+')'
        m=re.fullmatch(r'ptrtoint \(ptr (getelementptr(?: inbounds)?(?: inrange\([^)]*\))? \(i8, ptr @'+SYMBOL+r', i64 -?\d+\)|@'+SYMBOL+r') to i(32|64)\)',x)
        if m:
            val=self.operand(m[1]);return 'BigInt('+val+')' if m[2]=='64' else '('+val+'>>>0)'
        raise Blocked('unsupported operand '+x)
    def vector_operand(self, text, count, lane_type):
        """Parse small LLVM fixed-vector values; poison stays uninitialized.

        Array-based vectors are deliberately *values*: insertelement clones its
        input so LLVM SSA values never alias. A poison lane cannot be observed.
        """
        text=text.strip()
        if text in ('poison','undef'):
            return 'Array('+str(count)+').fill(undefined)'
        if text=='zeroinitializer':
            return 'Array('+str(count)+').fill('+('0n' if lane_type=='i64' else '0')+')'
        if text.startswith('%'):
            return self.operand(text)
        if text.startswith('<') and text.endswith('>'):
            parts=split_args(text[1:-1])
            if len(parts)!=count:raise Blocked('vector constant lane count mismatch: '+text[:100])
            lanes=[]
            for part in parts:
                m=re.fullmatch(re.escape(lane_type)+r'\s+(.+)',part.strip())
                if not m:raise Blocked('vector constant lane type mismatch: '+part[:90])
                lane=m[1].strip()
                if lane in ('poison','undef'):lanes.append('undefined')
                elif lane_type=='i64':
                    lanes.append((str(int(lane))+'n') if re.fullmatch(r'-?\d+',lane) else 'BigInt('+self.operand(lane)+')')
                else:lanes.append(self.operand(lane))
            return '['+','.join(lanes)+']'
        raise Blocked('unsupported vector value: '+text[:150])

    def aggregate_operand(self,text,type_name):
        members=split_args(type_name.strip()[1:-1])
        text=text.strip()
        if text in ('poison','undef'):
            return 'Array('+str(len(members))+').fill(undefined)'
        if text=='zeroinitializer':
            return '['+','.join('0n' if x.strip()=='i64' else '0' for x in members)+']'
        if text.startswith('%'):
            return self.operand(text)
        raise Blocked('unsupported aggregate operand '+text[:100])

    def numeric(self,x,width):
        val=self.operand(x)
        return 'BigInt('+val+')' if width>32 else val
    @staticmethod
    def signed(expr,width):
        if width>32:return 'BigInt.asIntN('+str(width)+','+expr+')'
        if width==32:return '('+expr+'|0)'
        return '(('+expr+'<<'+str(32-width)+')>>'+str(32-width)+')'
    @staticmethod
    def unsigned(expr,width):
        if width>32:return 'BigInt.asUintN('+str(width)+','+expr+')'
        if width==32:return '('+expr+'>>>0)'
        return '(('+expr+')&'+str((1<<width)-1)+')'
    def lower(self,name,args,body):
        a=parse_args(args);self.variadic=bool(re.search(r'(?:^|,)\s*\.\.\.\s*$',args));blocks={};key='entry';blocks[key]=[]
        switch_lines=[]
        for raw in body.splitlines():
            line=clean(raw)
            if not line or line.startswith(';'):continue
            if switch_lines:
                switch_lines.append(line)
                if line == ']':
                    blocks[key].append(' '.join(switch_lines));switch_lines=[]
                continue
            m=re.match(r'^([-\w.$]+):',line)
            if m:key=m[1];blocks.setdefault(key,[]);continue
            if re.match(r'^switch\s+',line) and '[' in line and not line.rstrip().endswith(']'):
                switch_lines=[line];continue
            blocks[key].append(line)
        if switch_lines:raise Blocked('unterminated LLVM switch')
        if not any(blocks.values()):raise Blocked('empty IR function '+name)
        # LLVM's first basic block may be implicit and named %N, not `entry`.
        # Its assigned slot follows the numbered parameters; PHI predecessor
        # references are authoritative for identifying that hidden block.
        phi_sources={label for lines in blocks.values() for text in lines if ' = phi ' in text
                     for label in re.findall(r'\[\s*.*?\s*,\s*%([-\w.$]+)\s*\]',text)}
        implicit=phi_sources-set(blocks)
        if len(implicit)>1:raise Blocked('multiple implicit LLVM entry predecessors: '+str(sorted(implicit)))
        entry=next(iter(implicit)) if implicit else 'entry'
        if entry!='entry':
            blocks={entry:blocks.pop('entry'),**blocks}
        arglist=['p'+str(i) for i in range(len(a))]
        if self.variadic:arglist.append('...__vaRest')
        out=['function('+','.join(arglist)+'){','const v=[];']
        if self.variadic:
            out.append('const __vaMeta=__vaRest.pop();')
            out.append('if(!__vaMeta||__vaMeta.__llvmVaTypes!==true)throw Error("Missing typed variadic call ABI");')
            out.append('const __vaFrame=ctx.createVaFrame('+json.dumps([t for t,_ in a])+',['+','.join('p'+str(i) for i in range(len(a)))+'],__vaRest,__vaMeta.types);')
        for i,(typ,reg) in enumerate(a):
            arg='p'+str(i)
            if typ.startswith('<'):arg='('+arg+').slice()'
            if typ.startswith('i') and int(typ[1:])>32:arg='BigInt('+arg+')'
            elif typ=='i32':arg='('+arg+'|0)'
            elif typ=='x86_fp80':arg='ctx.requireX87('+arg+')'
            out.append('v['+self.js(reg)+']='+arg+';')
        out.append('let block='+self.js(entry)+',prev="",fuel=0;')
        out.append('while(true){if(++fuel>ctx.instructionBudget)throw Error("LLVM instruction budget exceeded: '+name.replace('"','')+'");if((fuel&1048575)===0 && ctx.blockProgress)ctx.blockProgress('+self.js(name)+',block,fuel);switch(block){')
        for block,lines in blocks.items():
            out.append('case '+self.js(block)+':{')
            phis=[]
            for line in lines:
                m=re.fullmatch(r'(%[-\w.$]+) = phi (i\d+|ptr|float|double) (.+)',line)
                if m:
                    # LLVM PHI values may be constant GEP expressions or float
                    # literals, not only plain registers.
                    pairs=re.findall(r'\[\s*(.*?)\s*,\s*%([-\w.$]+)\s*\]',m[3])
                    if not pairs:raise Blocked('phi operands: '+line)
                    # A PHI picks only the actual incoming value. A poison
                    # incoming edge stays tagged until an actual UB-triggering
                    # use; it must not cause a compile-time error or become 0.
                    def phi_value(op):
                        if op=='undef':return '0n' if m[2].startswith('i') and int(m[2][1:])>32 else '0'
                        if op=='poison':return 'ctx.poisonValue'
                        val=self.operand(op)
                        return 'ctx.coerceBigIntOrPoison('+val+')' if m[2].startswith('i') and int(m[2][1:])>32 else val
                    pieces=['prev==='+self.js(pre)+' ? '+phi_value(op) for op,pre in pairs]
                    phis.append('_phi['+self.js(m[1][1:])+']='+' : '.join(pieces)+' : (()=>{throw Error("invalid predecessor")})();')
            if phis:out.extend(['const _phi=Object.create(null);',*phis,'Object.assign(v,_phi);'])
            for line in lines:
                if ' = phi ' in line:continue
                if line=='unreachable':out.append('throw Error("LLVM unreachable executed");');continue
                if line.startswith('indirectbr '):
                    indirect=re.fullmatch(r'indirectbr ptr ('+OPERAND+r'), \[(.*?)\]',line)
                    if not indirect:raise Blocked('unsupported LLVM indirectbr: '+line[:200])
                    targets=split_args(indirect[2]);labels=[]
                    for part in targets:
                        destination=re.fullmatch(r'\s*label %([-\w.$]+)\s*',part)
                        if not destination:raise Blocked('invalid indirectbr target: '+part[:100])
                        if destination[1] not in blocks:raise Blocked('undefined indirectbr destination: '+destination[1])
                        labels.append(destination[1])
                    if not labels or len(set(labels))!=len(labels):raise Blocked('empty/duplicate indirectbr destinations')
                    out.append('prev=block;block=ctx.resolveBlockAddress('+self.operand(indirect[1])+','+self.js(name)+','+self.js(labels)+');break;')
                    continue
                # LLVM fences are only representable with the explicitly
                # single-threaded browser ABI. The runtime refuses concurrency.
                fm=re.fullmatch(r'fence (?:syncscope\("[^"]+"\) )?(acquire|release|acq_rel|seq_cst)',line)
                if fm:
                    out.append('ctx.atomicFence('+self.js(fm[1])+');');continue
                if line.startswith('ret '):
                    vm=re.fullmatch(r'ret <(\d+) x (float|double|i(?:8|16|32|64))> (.+)',line)
                    if vm:
                        count=int(vm[1]);typ=vm[2]
                        if count<1 or count>16:raise Blocked('unsupported vector return size: '+line[:150])
                        out.append('return '+self.vector_operand(vm[3],count,typ)+';');continue
                    if line=='ret void':out.append('return undefined;');continue
                    am=re.fullmatch(r'ret (\{.+\})\s+(.+)',line)
                    if am:
                        # Aggregate returns remain arrays of SSA lanes and must
                        # not be confused with packed C memory structures.
                        out.append('return '+self.aggregate_operand(am[2],am[1])+';');continue
                    m=re.fullmatch(r'ret (i\d+|ptr|float|double) ('+OPERAND+r')',line)
                    if not m:raise Blocked('return: '+line)
                    w=decode_type_width(m[1]);val=self.operand(m[2]);val=self.signed('BigInt('+val+')' if w>32 else val,w) if m[1].startswith('i') else val
                    out.append('return ctx.requireDefined('+val+',"return");');continue
                if line.startswith('br '):
                    m=re.fullmatch(r'br label %([-\w.$]+)',line)
                    if m:out.append('prev=block;block='+self.js(m[1])+';break;');continue
                    m=re.fullmatch(r'br i1 ('+OPERAND+r'), label %([-\w.$]+), label %([-\w.$]+)',line)
                    if m:out.append('prev=block;block=ctx.requireDefined('+self.operand(m[1])+',"branch") ? '+self.js(m[2])+' : '+self.js(m[3])+';break;');continue
                    raise Blocked('branch: '+line)
                if line.startswith('switch '):
                    m=re.fullmatch(r'switch i(1|8|16|32|64) ('+OPERAND+r'), label %([-\w.$]+) \[\s*(.*?)\s*\]',line)
                    if not m:raise Blocked('switch: '+line[:240])
                    width=int(m[1]);dispatch='ctx.requireDefined('+self.numeric(m[2],width)+',"switch")'
                    cases=re.findall(r'i\d+ (-?\d+), label %([-\w.$]+)',m[4])
                    # Refuse malformed switch case lists rather than dropping cases.
                    residue=re.sub(r'i\d+ -?\d+, label %[-\w.$]+','',m[4]).strip()
                    if residue:raise Blocked('switch cases: '+residue[:160])
                    expr=self.unsigned(dispatch,width)
                    out.append('prev=block;switch('+expr+'){')
                    for number,dest in cases:
                        constant=('BigInt.asUintN(64,'+number+'n)') if width==64 else str(int(number)%(1<<width))
                        out.append('case '+constant+':block='+self.js(dest)+';break;')
                    out.append('default:block='+self.js(m[3])+';break;}break;')
                    continue
                if line.startswith('store atomic ') or line.startswith('store volatile atomic '):
                    m=re.fullmatch(r'store (?:volatile )?atomic (i8|i16|i32|i64|ptr) ('+OPERAND+r'), ptr ('+OPERAND+r') (unordered|monotonic|release|seq_cst)(?:, align (\d+))?',line)
                    if not m:raise Blocked('unsupported atomic store: '+line)
                    out.append('ctx.atomicStore('+self.operand(m[3])+','+self.js(m[1])+','+self.operand(m[2])+','+self.js(m[4])+','+(m[5] or '0')+');')
                    continue
                if line.startswith('store '):
                    vm=re.fullmatch(r'store <(\d+) x (float|double|i(?:8|16|32|64))> (.+?), ptr ('+OPERAND+r')(?:, align (\d+))?',line)
                    if vm:
                        count=int(vm[1]);typ=vm[2]
                        if count<1 or count>16:raise Blocked('unsupported vector store size: '+line[:150])
                        out.append('ctx.vectorStore('+self.operand(vm[4])+','+self.vector_operand(vm[3],count,typ)+','+str(count)+','+self.js(typ)+');')
                        continue
                    # A constant GEP can contain `, ptr` internally; split
                    # LLVM comma groups with balanced parentheses, NOT a
                    # non-greedy regex that truncates its operand.
                    m=re.match(r'store (?:volatile )?(i\d+|ptr|float|double) (.+)$',line)
                    if not m:raise Blocked('store: '+line)
                    typ=m[1];w=decode_type_width(typ)
                    parts=split_args(m[2]);
                    if len(parts) not in (2,3) or not parts[1].lstrip().startswith('ptr '):
                        raise Blocked('complex LLVM store: '+line[:200])
                    if len(parts)==3 and not re.fullmatch(r'align \d+',parts[2].strip()):
                        raise Blocked('unknown LLVM store metadata: '+line[:180])
                    val=self.operand(parts[0].strip());ptr=self.operand(parts[1].strip()[4:]);
                    out.append('ctx.store('+ptr+','+self.js(typ)+','+val+');');continue
                if line.startswith('call ') or line.startswith('tail call ') or line.startswith('musttail call '):
                    out.append(self.call_expr(line)+';');continue
                m=re.fullmatch(r'(%[-\w.$]+) = (.+)',line)
                if not m:raise Blocked('instruction: '+line)
                target='v['+self.js(m[1][1:])+']';rhs=m[2]
                if re.match(r'(?:tail |musttail )?call\b',rhs):out.append(target+'='+self.call_expr(rhs)+';');continue
                # Parse aggregate operands from LLVM comma-balanced fields.
                # Regex-only parsing splits vector type tokens incorrectly.
                am=re.fullmatch(r'insertvalue (\{.+?\}) (.+)',rhs)
                if am:
                    fields=split_args(am[1][1:-1]);items=split_args(am[2])
                    if len(items)!=3:raise Blocked('unsupported aggregate insertvalue '+rhs[:130])
                    index=int(items[2]) if items[2].strip().isdigit() else -1
                    value=items[1].strip();fieldtype=fields[index].strip() if index in range(len(fields)) else None
                    if not fieldtype or not value.startswith(fieldtype+' '):
                        raise Blocked('aggregate insertvalue type/index mismatch: '+rhs[:160])
                    src=self.aggregate_operand(items[0],am[1]);rawval=value[len(fieldtype)+1:].strip()
                    vector=re.fullmatch(r'<(\d+) x (float|double|i(?:8|16|32|64))>',fieldtype)
                    newval=(self.vector_operand(rawval,int(vector[1]),vector[2]) if vector else self.operand(rawval))
                    out.append(target+'=ctx.aggregateInsert('+src+','+newval+','+str(index)+','+str(len(fields))+');')
                    continue
                am=re.fullmatch(r'extractvalue (\{.+?\}) (.+), (\d+)',rhs)
                if am:
                    fields=split_args(am[1][1:-1]);idx=int(am[3])
                    if idx>=len(fields):raise Blocked('aggregate extractvalue index: '+rhs)
                    out.append(target+'=ctx.aggregateExtract('+self.aggregate_operand(am[2],am[1])+','+str(idx)+','+str(len(fields))+');')
                    continue
                vm=re.fullmatch(r'load <(\d+) x (float|double|i(?:8|16|32|64))>, ptr ('+OPERAND+r')(?:, align (\d+))?',rhs)
                if vm:
                    count=int(vm[1]);typ=vm[2]
                    if count<1 or count>16:raise Blocked('unsupported vector load size: '+rhs[:150])
                    out.append(target+'=ctx.vectorLoad('+self.operand(vm[3])+','+str(count)+','+self.js(typ)+');')
                    continue
                m=re.fullmatch(r'freeze (i\d+|ptr|float|double) ('+OPERAND+r')',rhs)
                if m:out.append(target+'=ctx.freezeValue('+self.operand(m[2])+','+self.js(m[1])+');');continue
                m=re.fullmatch(r'load (?:volatile )?atomic (i8|i16|i32|i64|ptr), ptr ('+r'(?:'+OPERAND+r'|getelementptr(?: inbounds)? \(i8, ptr @'+SYMBOL+r', i64 -?\d+\))'+r') (unordered|monotonic|acquire|seq_cst)(?:, align (\d+))?',rhs)
                if m:
                    out.append(target+'=ctx.atomicLoad('+self.operand(m[2])+','+self.js(m[1])+','+self.js(m[3])+','+(m[4] or '0')+');');continue
                # LLVM promotes static global offsets into pointer constant expressions.
                gepptr=r'(?:'+OPERAND+r'|getelementptr(?: inbounds)? \(i8, ptr @'+SYMBOL+r', i64 -?\d+\))'
                m=re.fullmatch(r'atomicrmw (?:volatile )?(xchg|add|sub|and|nand|or|xor|max|min|umax|umin) ptr ('+gepptr+r'), (i8|i16|i32|i64) ('+OPERAND+r') (monotonic|acquire|release|acq_rel|seq_cst)(?:, align (\d+))?',rhs)
                if m:
                    out.append(target+'=ctx.atomicRMW('+self.operand(m[2])+','+self.js(m[3])+','+self.js(m[1])+','+self.operand(m[4])+','+self.js(m[5])+','+(m[6] or '0')+');');continue
                m=re.fullmatch(r'cmpxchg (?:weak )?(?:volatile )?ptr ('+OPERAND+r'), (i8|i16|i32|i64|ptr) ('+OPERAND+r'), (?:i8|i16|i32|i64|ptr) ('+OPERAND+r') (monotonic|acquire|release|acq_rel|seq_cst) (monotonic|acquire|seq_cst)(?:, align (\d+))?',rhs)
                if m:
                    # LLVM returns { old_value, comparison_succeeded }. Weak
                    # exchange is permitted to succeed without spurious failure.
                    out.append(target+'=ctx.atomicCmpXchg('+self.operand(m[1])+','+self.js(m[2])+','+self.operand(m[3])+','+self.operand(m[4])+','+self.js(m[5])+','+self.js(m[6])+','+(m[7] or '0')+');');continue
                # LLVM fixed vectors are SSA aggregate values. Require actual
                # valid lane indices; a poison/undef lane may not be read.
                m=re.fullmatch(r'insertelement <(\d+) x (float|double|i(?:8|16|32|64))> (.+), (float|double|i(?:8|16|32|64)) (.+), i(?:32|64) ('+OPERAND+r')',rhs)
                if m:
                    count=int(m[1]);lane_type=m[2]
                    if count<1 or count>16 or m[4]!=lane_type:
                        raise Blocked('unsupported insertelement lane type/count: '+rhs[:160])
                    expr=self.vector_operand(m[3],count,lane_type)
                    lane=self.operand(m[5])
                    out.append(target+'=ctx.vectorInsert('+expr+','+lane+','+self.operand(m[6])+','+str(count)+','+self.js(lane_type)+');')
                    continue
                if rhs.startswith('shufflevector '):
                    # LLVM vector literals contain comma-separated lanes in
                    # angle brackets, so ordinary aggregate splitting is not
                    # sufficient for a shuffle instruction.
                    pieces=[];buf='';depth=0;angle=0
                    for ch in rhs[len('shufflevector '):]:
                        if ch==',' and depth==0 and angle==0:
                            pieces.append(buf);buf='';continue
                        if ch in '([{':depth+=1
                        elif ch in ')]}':depth-=1
                        elif ch=='<':angle+=1
                        elif ch=='>':angle-=1
                        buf+=ch
                    if buf:pieces.append(buf)

                    if len(pieces)==3:
                        source=[]
                        for term in pieces[:2]:
                            sm=re.fullmatch(r'<(\d+) x (float|double|i(?:8|16|32|64))>\s+(.+)',term.strip())
                            if not sm:raise Blocked('shufflevector source: '+term[:150])
                            n=int(sm[1]);typ=sm[2]
                            if n<1 or n>16:raise Blocked('unsupported shuffle input size: '+term[:120])
                            source.append((n,typ,self.vector_operand(sm[3],n,typ)))
                        if source[0][1]!=source[1][1]:raise Blocked('shufflevector source lane mismatch')
                        mm=re.fullmatch(r'<(\d+) x i32>\s+(<(.+)>|zeroinitializer)',pieces[2].strip())
                        if not mm:raise Blocked('dynamic shufflevector mask')
                        output_count=int(mm[1]);raw_indices=(split_args(mm[3]) if mm[3] is not None else ['i32 0']*output_count)
                        if not 1<=output_count<=16 or len(raw_indices)!=output_count:raise Blocked('shufflevector mask count')
                        indices=[]
                        for item in raw_indices:
                            entry=re.fullmatch(r'i32\s+(poison|undef|\d+)',item.strip())
                            if not entry:raise Blocked('unsupported shuffle mask: '+item[:100])
                            indices.append(None if entry[1] in ('poison','undef') else int(entry[1]))
                        if any(x is not None and x>=source[0][0]+source[1][0] for x in indices):raise Blocked('shuffle lane out of range')
                        out.append(target+'=ctx.vectorShuffle('+source[0][2]+','+source[1][2]+','+json.dumps(indices)+','+str(source[0][0])+','+str(source[1][0])+');')
                        continue
                vb=re.fullmatch(r'(fadd|fsub|fmul|fdiv|add|sub|mul|and|or|xor|shl|ashr|lshr)(?: (?:fast|nsw|nuw|exact))* <(\d+) x (float|double|i(?:8|16|32|64))> (.+)',rhs)
                if vb:
                    op,n,typ=vb[1],int(vb[2]),vb[3]
                    if n<1 or n>16 or (op.startswith('f') != (typ in ('float','double'))):raise Blocked('invalid vector binary operation: '+rhs[:150])
                    operands=split_llvm_args(vb[4]);
                    if len(operands)!=2:raise Blocked('vector binary operands: '+rhs[:150])
                    left=self.vector_operand(operands[0].strip(),n,typ)
                    right=self.vector_operand(operands[1].strip(),n,typ)
                    out.append(target+'=ctx.vectorBinary('+self.js(op)+','+left+','+right+','+str(n)+','+self.js(typ)+');')
                    continue
                m=re.fullmatch(r'extractelement <(\d+) x (float|double|i(?:8|16|32|64))> (.+), i(?:32|64) ('+OPERAND+r')',rhs)
                if m:
                    count=int(m[1]);lane_type=m[2]
                    if count<1 or count>16:raise Blocked('unsupported extractelement vector size: '+rhs[:160])
                    expr=self.vector_operand(m[3],count,lane_type)
                    out.append(target+'=ctx.vectorExtract('+expr+','+self.operand(m[4])+','+str(count)+','+self.js(lane_type)+');')
                    continue
                m=re.fullmatch(r'extractvalue \{\s*(i8|i16|i32|i64|ptr)\s*,\s*(i1|i8|i16|i32|i64|ptr)\s*\} ('+OPERAND+r'), ([01])',rhs)
                if m:
                    out.append(target+'='+self.operand(m[3])+'['+m[4]+'];');continue
                m=re.fullmatch(r'fneg(?: (?:fast|nnan|ninf|nsz|arcp|contract|afn|reassoc))* (float|double) ('+OPERAND+r'|0x[0-9A-Fa-f]{8,16})',rhs)
                if m:
                    expr='(-'+self.operand(m[2])+')'
                    out.append(target+'='+('Math.fround('+expr+')' if m[1]=='float' else expr)+';');continue
                m=re.match(r'load (?:volatile )?(i\d+|ptr|float|double), ptr ('+OPERAND+r'|getelementptr(?: inbounds)? \(i8, ptr @'+SYMBOL+r', i64 -?\d+\))',rhs)
                if m:out.append(target+'=ctx.load('+self.operand(m[2])+','+self.js(m[1])+');');continue
                # Addresses of global string tables appear in arithmetic as
                # constant ptrtoint(GEP) operands (e.g. menu item indices).
                # Preserve the actual byte pointer subtraction rather than
                # discarding or approximating the relocation.
                pe=re.fullmatch(r'(add|sub) i(32|64) ('+OPERAND+r'), (ptrtoint \(ptr .+ to i(?:32|64)\))',rhs)
                if pe:
                    w=int(pe[2]);left=self.numeric(pe[3],w);right=self.operand(pe[4]);op='+' if pe[1]=='add' else '-'
                    val='('+left+op+('BigInt('+right+')' if w==64 else right)+')'
                    out.append(target+'='+self.signed(val,w)+';');continue
                # LLVM constant expressions are valid integer operands too.
                # Keep the actual address dependency rather than replacing it with zero.
                constptr=re.fullmatch(r'(add|sub|xor|or|and) i(32|64) ('+OPERAND+r'), (ptrtoint \(ptr @'+SYMBOL+r' to i(?:32|64)\))',rhs)
                if constptr:
                    width=int(constptr[2]);left=self.numeric(constptr[3],width)
                    right=self.operand(constptr[4]);right='BigInt('+right+')' if width==64 else right
                    op={'add':'+','sub':'-','xor':'^','or':'|','and':'&'}[constptr[1]]
                    out.append(target+'='+self.signed('('+left+op+right+')',width)+';');continue
                m=re.fullmatch(r'(add|sub|mul|and|or|xor|shl|ashr|lshr|sdiv|udiv|srem|urem)(?: (?:nsw|nuw|exact|disjoint))* i(\d+) ('+OPERAND+r'), ('+OPERAND+r')',rhs)
                if m:
                    op,w=int_or(m[1]),int(m[2]);x=self.numeric(m[3],w);y=self.numeric(m[4],w)
                    if w<1 or w>128:raise Blocked('bit width '+str(w))
                    tokens={'add':'+','sub':'-','mul':'*','and':'&','or':'|','xor':'^','shl':'<<','ashr':'>>','lshr':'>>>','sdiv':'/','udiv':'/','srem':'%','urem':'%'}
                    if op=='mul' and w==32:expr='Math.imul('+x+','+y+')'
                    elif op=='lshr' and w>32:expr='('+self.unsigned(x,w)+' >> '+y+')'
                    elif op=='lshr':expr='('+x+' >>> '+y+')'
                    elif op in ('udiv','urem'):
                        if w<=32:x=self.unsigned(x,w);y=self.unsigned(y,w)
                        else:x=self.unsigned(x,w);y=self.unsigned(y,w)
                        expr='('+x+tokens[op]+y+')'
                    elif op in ('sdiv','srem'):
                        x=self.signed(x,w);y=self.signed(y,w)
                        expr='('+x+tokens[op]+y+')'
                        if w<=32 and op=='sdiv':expr='Math.trunc'+expr
                    else:expr='('+x+tokens[op]+y+')'
                    out.append(target+'='+self.signed(expr,w)+';');continue
                if rhs.startswith('icmp eq ptr ') or rhs.startswith('icmp ne ptr '):
                    eq='eq' if rhs.startswith('icmp eq ptr ') else 'ne'
                    pair=split_args(rhs[12:])
                    if len(pair)==2:
                        val1=self.operand(pair[0].strip());val2=self.operand(pair[1].strip())
                        out.append(target+'=+('+val1+('===' if eq=='eq' else '!==')+val2+');');continue
                ptrcmp=re.fullmatch(r'icmp (eq|ne|ult|ule|ugt|uge|slt|sle|sgt|sge) ptr ('+OPERAND+r'), (getelementptr(?: inbounds)? \(i8, ptr @'+SYMBOL+r', i64 -?\d+\))',rhs)
                if ptrcmp:
                    comparisons={'eq':'===','ne':'!==','slt':'<','sle':'<=','sgt':'>','sge':'>=','ult':'<','ule':'<=','ugt':'>','uge':'>='}
                    out.append(target+'=+('+self.operand(ptrcmp[2])+comparisons[ptrcmp[1]]+self.operand(ptrcmp[3])+');');continue
                m=re.fullmatch(r'icmp (eq|ne|slt|sle|sgt|sge|ult|ule|ugt|uge) (i\d+|ptr) ('+OPERAND+r'), ('+OPERAND+r'|inttoptr \(i64 \d+ to ptr\))',rhs)
                if m:
                    cmps={'eq':'===','ne':'!==','slt':'<','sle':'<=','sgt':'>','sge':'>=','ult':'<','ule':'<=','ugt':'>','uge':'>='}
                    cond,w=m[1],decode_type_width(m[2]);x=self.numeric(m[3],w) if m[2]!='ptr' else self.operand(m[3]);y=self.numeric(m[4],w) if m[2]!='ptr' else self.operand(m[4])
                    cast=self.unsigned if cond.startswith('u') else self.signed
                    x,y=(x,y) if m[2]=='ptr' else (cast(x,w),cast(y,w))
                    out.append(target+'=+('+x+cmps[cond]+y+');');continue
                m=re.fullmatch(r'(zext|sext|trunc)(?: (?:nneg|nuw|nsw))* i(\d+) ('+OPERAND+r') to i(\d+)',rhs)
                if m:
                    op,srcw,dstw=m[1],int(m[2]),int(m[4]);v=self.numeric(m[3],srcw)
                    if op=='sext':v=self.signed(v,srcw)
                    elif op=='zext':v=self.unsigned(v,srcw)
                    v='BigInt('+v+')' if dstw>32 and srcw<=32 else 'Number('+v+')' if srcw>32 and dstw<=32 else v
                    v=self.unsigned(v,dstw) if op=='zext' else self.signed(v,dstw)
                    out.append(target+'='+v+';');continue
                float_op=r'(?:'+OPERAND+r'|-?(?:\d+\.\d*|\d+)(?:[eE][+-]?\d+)?|0x[0-9A-Fa-f]{8,16})'
                vm=re.fullmatch(r'select i1 ('+OPERAND+r'), <(\d+) x (float|double|i(?:8|16|32|64))> (.+), <\d+ x (?:float|double|i(?:8|16|32|64))> (.+)',rhs)
                if vm:
                    count=int(vm[2]);lane=vm[3]
                    lhs=self.vector_operand(vm[4],count,lane);rr=self.vector_operand(vm[5],count,lane)
                    out.append(target+'=('+self.operand(vm[1])+'?'+lhs+':'+rr+').slice();');continue
                if rhs.startswith('select i1 '):
                    pieces=split_args(rhs[10:])
                    if len(pieces)==3:
                        cond=pieces[0].strip()
                        left=re.fullmatch(r'(i\d+|ptr|float|double)\s+(.+)',pieces[1].strip())
                        right=re.fullmatch(r'(i\d+|ptr|float|double)\s+(.+)',pieces[2].strip())
                        if re.fullmatch(OPERAND,cond) and left and right and left[1]==right[1]:
                            # Preserve laziness: an unchosen constant pointer
                            # may never need evaluation/relocation at runtime.
                            x=self.operand(left[2].strip());y=self.operand(right[2].strip())
                            out.append(target+'='+self.operand(cond)+' ? '+x+' : '+y+';');continue
                m=re.fullmatch(r'select i1 ('+OPERAND+r'), (i\d+|ptr|float|double) ('+float_op+r'), (?:i\d+|ptr|float|double) ('+float_op+r')',rhs)
                if m:out.append(target+'='+self.operand(m[1])+' ? '+self.operand(m[3])+' : '+self.operand(m[4])+';');continue
                m=re.fullmatch(r'(fadd|fsub|fmul|fdiv)(?: fast)? (float|double) (\S+), (\S+)',rhs)
                if m:
                    op={'fadd':'+','fsub':'-','fmul':'*','fdiv':'/'}[m[1]]
                    expr='('+self.operand(m[3])+op+self.operand(m[4])+')'
                    out.append(target+'=' + ('Math.fround('+expr+')' if m[2]=='float' else expr)+';');continue
                m=re.fullmatch(r'fcmp (oeq|one|olt|ole|ogt|oge|ueq|une|ult|ule|ugt|uge|ord|uno) (float|double) (\S+), (\S+)',rhs)
                if m:
                    op,_,a,b=m.groups();x=self.operand(a);y=self.operand(b)
                    cmp={'eq':'===','ne':'!==','lt':'<','le':'<=','gt':'>','ge':'>='}
                    isnan='(Number.isNaN('+x+')||Number.isNaN('+y+'))'
                    expr=cmp.get(op[1:])
                    if op=='ord':expr='!'+isnan
                    elif op=='uno':expr=isnan
                    elif expr:
                        expr='('+x+expr+y+')'
                        expr='('+isnan+'||'+expr+')' if op[0]=='u' else '(!'+isnan+'&&'+expr+')'
                    else:raise Blocked('unknown fcmp '+op)
                    out.append(target+'=+('+expr+');');continue
                m=re.fullmatch(r'(sitofp|uitofp|fptosi|fptoui|fptrunc|fpext)(?: nneg)? (i\d+|float|double) ('+OPERAND+r') to (i\d+|float|double)',rhs)
                if m:
                    v=self.operand(m[3]);cast='Math.trunc('+v+')' if m[1].startswith('fpto') else 'Number('+v+')'
                    out.append(target+'='+cast+';');continue
                # LLVM vector bitcasts reinterpret raw little-endian bits, never lane-wise casts.
                # Supports XXHash's <2 x i64> -> <4 x i32> and other equal-width vectors.
                vector_type=r'<(?:[1-9]|1[0-6]) x (?:float|double|i(?:8|16|32|64))>'
                vecbits=re.fullmatch(r'bitcast ('+vector_type+r'|i(?:8|16|32|64)|float|double) ('+OPERAND+r') to ('+vector_type+r'|i(?:8|16|32|64)|float|double)',rhs)
                if vecbits and (vecbits[1].startswith('<') or vecbits[3].startswith('<')):
                    out.append(target+'=ctx.reinterpretVectorBits('+self.js(vecbits[1])+','+self.operand(vecbits[2])+','+self.js(vecbits[3])+');')
                    continue
                bitcast=re.fullmatch(r'bitcast (i32|i64|float|double) ('+OPERAND+r') to (i32|i64|float|double)',rhs)
                if bitcast and (bitcast[1],bitcast[3]) in [('i32','float'),('float','i32'),('i64','double'),('double','i64')]:
                    out.append(target+'=ctx.reinterpretBits('+self.js(bitcast[1])+','+self.operand(bitcast[2])+','+self.js(bitcast[3])+');')
                    continue
                m=re.fullmatch(r'(ptrtoint|inttoptr|bitcast) (i\d+|ptr) ('+OPERAND+r') to (i\d+|ptr)',rhs)
                if m:
                    op,source_type,value_type,target_type=m[1],m[2],self.operand(m[3]),m[4]
                    if op=='ptrtoint':
                        if target_type=='i64':expr='BigInt.asIntN(64,BigInt(ctx.offset('+value_type+')))'
                        elif target_type=='i32':expr='(ctx.offset('+value_type+')|0)'
                        elif target_type.startswith('i'):
                            bits=int(target_type[1:])
                            expr='BigInt.asIntN('+str(bits)+',BigInt(ctx.offset('+value_type+')))'
                        else:raise Blocked('ptrtoint target is not integer')
                    elif op=='inttoptr':expr='ctx.offset('+value_type+')'
                    else:expr=value_type
                    out.append(target+'='+expr+';');continue
                if rhs.startswith('alloca '):
                    if self.layout is None:raise Blocked('alloca requires target type layout')
                    fields=split_args(rhs[7:]);typ=fields[0].strip()
                    size,default_align=self.layout.size_align(typ)
                    amount='1';alignment=default_align
                    for extra in fields[1:]:
                        token=extra.strip()
                        count=re.fullmatch(r'i(?:32|64) ('+OPERAND+r')',token)
                        declared_align=re.fullmatch(r'align (\d+)',token)
                        if count:amount='ctx.offset('+self.operand(count[1])+')'
                        elif declared_align:alignment=int(declared_align[1])
                        else:raise Blocked('unsupported alloca argument '+token[:150])
                    if alignment<1 or alignment>4096 or alignment & (alignment-1):raise Blocked('unsupported alloca alignment '+str(alignment))
                    out.append(target+'=ctx.alloca(('+amount+')*'+str(size)+','+str(alignment)+');')
                    continue
                if rhs.startswith('getelementptr '):
                    # Parse commas with nested constant-expressions intact.
                    # LLVM uses `ptr getelementptr (i8, ptr @g, i64 16)`
                    # as a GEP base; splitting on the first comma corrupts it.
                    tail=re.sub(r'^getelementptr(?: inbounds)?(?: inrange\([^)]*\))?\s+', '',rhs,count=1)
                    terms=split_args(tail)
                    if len(terms)<3:raise Blocked('complex GEP: '+rhs)
                    typ=terms[0].strip()
                    base_term=terms[1].strip()
                    if not base_term.startswith('ptr '):raise Blocked('GEP base is not a pointer: '+rhs[:200])
                    base=self.operand(base_term[4:].strip())
                    indices=[]
                    for arg in terms[2:]:
                        ix=re.fullmatch(r'\s*i\d+\s+('+OPERAND+r')\s*',arg)
                        if not ix:raise Blocked('complex GEP index: '+arg)
                        indices.append(('int',ix[1]))
                    if self.layout is not None:
                        parts=self.layout.gep(typ,indices)
                        offset=' + '.join('(ctx.offset('+self.operand(value)+') * '+str(unit)+')' for value,unit in parts)
                        out.append(target+'=('+base+'+'+offset+');');continue
                    raise Blocked('GEP lacks LLVM module type layout: '+rhs)
                raise Blocked('unsupported opcode: '+rhs[:240])
            out.append('break;}')
        out.append('default:throw Error("bad LLVM basic block "+block);}}}')
        return '\n'.join(out)
    def call_expr(self,rhs):
        va_start=re.fullmatch(r'(?:tail )?call void @llvm\.va_start\.p0\(ptr(?: [a-z]+| align \d+)* ('+OPERAND+r')\)(?: #\d+)?',rhs)
        if va_start:
            if not getattr(self,'variadic',False):raise Blocked('llvm.va_start outside variadic function')
            return 'ctx.vaStart('+self.operand(va_start[1])+',__vaFrame)'
        # Compile-time-only alias-scope declaration; it does not change any
        # executable C++ behavior. Do not interpret arbitrary metadata as data.
        if re.fullmatch(r'(?:tail )?call void @llvm\.experimental\.noalias\.scope\.decl\(metadata !\d+\)(?: #\d+)?',rhs):
            return 'undefined'
        # CPUID is a host-query instruction, not a CPU operation that can be
        # simulated from browser heuristics. Preserve all four output registers
        # using an explicitly supplied CPUID provider. Never fabricate features.
        cpuid=re.fullmatch(
            r'(?:tail )?call \{ i32, i32, i32, i32 \} asm '
            r'"  xchgq  %rbx,\$\{1:q\}\\0A  cpuid\\0A  xchgq  %rbx,\$\{1:q\}", '
            r'"=\{ax\},=r,=\{cx\},=\{dx\},0,~\{dirflag\},~\{fpsr\},~\{flags\}"'
            r'\(i32 ('+OPERAND+r')\)(?: #\d+)?',rhs)
        if cpuid:return 'ctx.x86CPUID('+self.operand(cpuid[1])+')'
        # Browser/native JS has no rdtsc instruction. Adapt this precise
        # register-pair ABI to a monotonic nanosecond performance counter;
        # the original timer calibration derives the frequency dynamically.
        # It is *not* a host CPU cycle counter or x86 emulator.
        ticks=re.fullmatch(r'(?:tail )?call \{ i32, i32 \} asm sideeffect "rdtsc", '
                           r'"=\{ax\},=\{dx\},~\{dirflag\},~\{fpsr\},~\{flags\}"\(\)(?: #\d+)?',rhs)
        if ticks:return 'ctx.monotonicTickPair()'
        # GCC x86 reverse-buffer copy inline assembly. Recognize the *exact*
        # instruction and constraint sequence, not a function/game name. The
        # host implementation preserves 1/2/4-byte access grouping, which
        # matters when source/destination spans overlap.
        reverse_asm=re.fullmatch(
            r'(?:tail )?call \{ ptr, ptr, i32 \} asm sideeffect "(.*?)", '
            r'"=\{si\},=\{di\},=\{cx\},0,1,2,~\{eax\},~\{memory\},~\{cc\},'
            r'~\{dirflag\},~\{fpsr\},~\{flags\}"'
            r'\(ptr (.+?), ptr (.+?), i32 (.+?)\)(?: #\d+)?',rhs)
        if reverse_asm:
            expected=(
                'shrl $$1, %ecx', 'jnc 0f', 'movb (%rsi), %al', 'dec %rsi',
                'movb %al, (%rdi)', 'inc %rdi', '0:', 'shrl $$1, %ecx',
                'jnc 1f', 'movw -1(%rsi), %ax', 'sub $$2, %rsi',
                'rorw $$8, %ax', 'movw %ax, (%rdi)', 'add $$2, %rdi',
                '1:', 'testl %ecx, %ecx', 'jz 3f', '2:',
                'movl -3(%rsi), %eax', 'sub $$4, %rsi', 'bswapl %eax',
                'movl %eax, (%rdi)', 'add $$4, %rdi', 'decl %ecx',
                'jnz 2b', '3:'
            )
            observed=tuple(x.strip() for x in reverse_asm[1].replace('\\0A','\n').replace('\\09','\t').splitlines())
            if observed != expected:
                raise Blocked('unrecognized reverse-copy assembly variant')
            return 'ctx.x86ReverseCopy('+','.join(self.operand(x) for x in reverse_asm.groups()[1:])+')'
        # The two x86 DIV inline-assembly templates observed in EDuke32 each
        # return quotient and remainder in a fixed register-pair ABI.
        asm=re.fullmatch(r'(?:tail )?call \{ i(32|64), i(?:32|64) \} asm "div([lq]) \$2", "[^"]+"\(i(?:32|64) (.+?), i(?:32|64) (.+?), i(?:32|64) (.+?)\)(?: #\d+)?',rhs)
        if asm:
            bits=int(asm[1]);
            if (asm[2]=='q')!=(bits==64):raise Blocked('x86 div return width mismatch')
            # x86 inline-assembly constraint order is divisor (r), EAX low,
            # EDX high. Passing these as low/high/divisor corrupted
            # libdivide reciprocal constants, causing huge hash-table offsets.
            return 'ctx.x86DivRem('+str(bits)+','+self.operand(asm[4])+','+self.operand(asm[5])+','+self.operand(asm[3])+')'
        # Alignment operand bundles refine LLVM optimization assumptions.
        # Validate them against the emulated C pointer ABI at runtime.
        alignment=re.fullmatch(r'(?:tail )?call void @llvm\.assume\(i1 (true|false|%[-\w.$]+)\) \[ "align"\(ptr ('+OPERAND+r'|getelementptr(?: inbounds)? \(i8, ptr @'+SYMBOL+r', i64 -?\d+\)), i(?:32|64) (\d+)\) \]',rhs)
        if alignment:
            return '(ctx.call("llvm.assume",['+self.operand(alignment[1])+']),ctx.assumeAlignment('+self.operand(alignment[2])+','+alignment[3]+'))'
        # Pure identity inline assembly used as a compiler optimization barrier.
        # No observable machine state is changed by this empty template.
        identity=re.fullmatch(r'(?:tail )?call (ptr|i32|i64) asm "", "=r,0,~\{dirflag\},~\{fpsr\},~\{flags\}"\((?:ptr|i32|i64)(?: [a-z]+)* ('+OPERAND+r')\)(?: #\d+)?',rhs)
        if identity:return self.operand(identity[2])
        # LLVM permits return-parameter attributes before the result type.
        attrs=r'(?:fastcc|coldcc|tailcc|noundef|nonnull|noalias|zeroext|signext|align \d+|dereferenceable\(\d+\)|dereferenceable_or_null\(\d+\)|range\([^)]*\))'
        m=re.search(r'\bcall\s+(?:'+attrs+r'\s+)*(\{[^}]+\}|<\d+ x (?:float|double|i(?:8|16|32|64))>|i\d+|void|ptr|float|double)(?: \([^)]*\))?\s+(?:'+attrs+r'\s+)*(@'+SYMBOL+r'|%[-\w.$]+)\((.*)\)\s*(?:#\d+)?$',rhs)
        if not m:raise Blocked('indirect/unsupported call: '+rhs[:250])
        direct=m[2].startswith('@')
        if direct:
            sym=symbol(m[2][1:]);self.dependencies.add(sym)
        args=[];argtypes=[]
        for raw in split_llvm_args(m[3]):
            if not raw.strip():continue
            vector_arg=re.fullmatch(r'\s*<(\d+) x (float|double|i(?:8|16|32|64))>\s+(.+?)\s*',raw)
            if vector_arg:
                lane_count=int(vector_arg[1]);lane_type=vector_arg[2]
                if not 1<=lane_count<=16:raise Blocked('invalid vector call argument size: '+raw[:150])
                args.append(self.vector_operand(vector_arg[3],lane_count,lane_type));argtypes.append('<'+vector_arg[1]+' x '+lane_type+'>');continue
            arg=re.match(r'\s*(i\d+|ptr|float|double|x86_fp80)\s+(.+?)\s*$',raw)
            if not arg:raise Blocked('unsupported call argument: '+raw[:150])
            argtypes.append(arg[1]);value=arg[2].strip()
            known=r'(?:noundef|nonnull|noalias|zeroext|signext|readonly|writeonly|readnone|nocapture|returned|immarg|dead_on_unwind|writable|readnone|align \d+|dereferenceable\(\d+\)|dereferenceable_or_null\(\d+\)|sret\([^)]*\)|byval\([^)]*\))'
            while True:
                token=re.match(r'^'+known+r'\s+',value)
                if not token:break
                value=value[token.end():]
            expr='ctx.requireX87('+self.operand(value)+')' if arg[1]=='x86_fp80' else self.operand(value)
            if re.search(r'\bnoundef\b',raw):
                expr='ctx.requireDefined('+expr+',"noundef call argument")'
            args.append(expr)
        return ('ctx.call('+self.js(sym)+',['+','.join(args)+'],'+json.dumps(argtypes)+')') if direct else ('ctx.callIndirect('+self.operand(m[2])+',['+','.join(args)+'],'+json.dumps(argtypes)+')')

def int_or(x):return x

def split_llvm_args(s):
    """Split LLVM operand lists on top-level commas (including vector literals).

    Keep quoted LLVM symbol/type names opaque, and preserve C aggregate nesting.
    """
    fields=[];begin=0;stack=[];quoted=False;escape=False
    pairs={')':'(',']':'[','}':'{','>':'<'}
    for i,c in enumerate(s):
        if quoted:
            if escape: escape=False
            elif c=='\\':escape=True
            elif c=='"':quoted=False
            continue
        if c=='"':quoted=True;continue
        if c in '([{<':stack.append(c);continue
        if c in ')]}>':
            if stack and stack[-1]==pairs[c]:stack.pop()
            continue
        if c==',' and not stack:
            fields.append(s[begin:i]);begin=i+1
    if begin<len(s):fields.append(s[begin:])
    return fields

def split_args(s):
    # C++ named LLVM types contain commas *inside quotes*; splitting these
    # corrupts type names and fabricates missing-type errors downstream.
    return split_llvm_args(s)
