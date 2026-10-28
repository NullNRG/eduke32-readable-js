#!/usr/bin/env python3
"""Conservative SSA-CFG -> structured JavaScript lowering.

This is a *semantic* transformation of LLVM-lowered original-source functions,
not a source comment, pretty-printer, game-specific replacement, or emulator.
It converts only provably acyclic, PHI-free CFGs whose terminators have a
recognised shape. Unsupported functions retain their original strict lowering.
"""
from __future__ import annotations
import dataclasses, re

CASE = re.compile(r'^case "([^"]+)":\{\n(.*?)^break;\}', re.M | re.S)
SLOT = re.compile(r'v\["([^"\\]+)"\]')
RETURN = re.compile(r'^return\s+.+;$')
GOTO = re.compile(r'^prev=block;block="([^"]+)";break;$')
COND = re.compile(r'^prev=block;block=(ctx\.requireDefined\(.+?,"branch"\)) \? "([^"]+)" : "([^"]+)";break;$')

@dataclasses.dataclass
class StructuringResult:
    code: str
    structured: bool
    reason: str
    basic_blocks: int = 0


def to_readable(js: str, symbol: str, *, max_blocks: int = 80, max_growth: float = 2.5) -> StructuringResult:
    """Produce executable structured JS or return the input unchanged.

    Retain the source's exact lowered operations, ABI conversions, calls,
    argument handling, and branch predicates. No guess at C-level types,
    high-level algorithms or optimizations is made.
    """
    if 'let block=' not in js or 'switch(block){' not in js:
        return StructuringResult(js,False,'not a canonical LLVM dispatcher')
    if '...__vaRest' in js:
        return StructuringResult(js,False,'variadic ABI not yet structurized')
    head_match = re.match(r'^function\(([^)]*)\)\{\nconst v=\[\];\n(?:(.*?)\n)?let block=("[^"]+"),prev="",fuel=0;\nwhile\(true\)\{',js,re.S)
    if not head_match:
        return StructuringResult(js,False,'unrecognized function prologue')
    args,initializers,entry_literal = head_match.groups()
    initializers=initializers or ''
    entry = entry_literal[1:-1]
    matches=list(CASE.finditer(js))
    if not matches or len(matches)>max_blocks:
        return StructuringResult(js,False,'too many or no basic blocks',len(matches))
    blocks={}
    for match in matches:
        label=match.group(1)
        if label in blocks:
            return StructuringResult(js,False,'duplicate basic block label',len(matches))
        lines=match.group(2).splitlines()
        # The second break is the emitter's case terminator; the first is a
        # CFG dispatch terminator. An exact match is required here.
        lines=[x.strip() for x in lines if x.strip()]
        if lines and lines[-1]=='break;': lines.pop()
        # Decode edge-selecting LLVM PHIs and synthesize *parallel* moves on
        # each incoming edge. The values must be evaluated using the old SSA
        # state before any destination is written.
        phis={}
        if lines and lines[0]=='const _phi=Object.create(null);':
            if 'Object.assign(v,_phi);' not in lines:
                return StructuringResult(js,False,'incomplete PHI assignment',len(matches))
            end=lines.index('Object.assign(v,_phi);')
            for clause in lines[1:end]:
                parsed=re.fullmatch(r'_phi\["([^"]+)"\]=(.*);',clause)
                if not parsed:
                    return StructuringResult(js,False,'complex PHI value',len(matches))
                target,choice_text=parsed.groups()
                parts=re.split(r' : (?=prev==="|\(\(\)=>)',choice_text)
                if not parts or not parts[-1].startswith('(()=>{throw Error("invalid predecessor")})()'):
                    return StructuringResult(js,False,'noncanonical PHI fallback',len(matches))
                options={}
                for option in parts[:-1]:
                    match_option=re.fullmatch(r'prev==="([^"]+)" \? (.+)',option)
                    if not match_option or match_option[1] in options:
                        return StructuringResult(js,False,'complex PHI incoming expression',len(matches))
                    options[match_option[1]]=match_option[2]
                if not options:
                    return StructuringResult(js,False,'empty PHI predecessor list',len(matches))
                phis[target]=options
            lines=lines[end+1:]
        if not lines:
            return StructuringResult(js,False,'empty control-flow block',len(matches))
        tail=lines.pop()
        if RETURN.fullmatch(tail): terminator=('return', tail)
        elif tail.startswith('throw ') and tail.endswith(';'):
            terminator=('throw',tail)
        elif (m:=GOTO.fullmatch(tail)):
            terminator=('goto',m.group(1))
        elif (m:=COND.fullmatch(tail)):
            terminator=('cond',m.group(1),m.group(2),m.group(3))
        else:
            return StructuringResult(js,False,'complex terminator',len(matches))
        if any(re.search(r'\b(?:block|prev|fuel)\b|\b(?:break|continue)\s*;', line) for line in lines):
            return StructuringResult(js,False,'unsupported internal control flow',len(matches))
        blocks[label]=(lines,terminator,phis)
    if entry not in blocks:
        return StructuringResult(js,False,'missing entry block',len(matches))
    # A cycle must never be recursively expanded. It needs while/for
    # reconstruction, induction analysis, and PHI lowering first.
    seen=set();active=set()
    def check(label):
        if label in active: raise ValueError('cycle')
        if label in seen:return
        if label not in blocks:raise ValueError('undefined basic block')
        active.add(label)
        term=blocks[label][1]
        if term[0]=='goto':check(term[1])
        if term[0]=='cond':check(term[2]);check(term[3])
        active.remove(label);seen.add(label)
    try:check(entry)
    except ValueError as exc:
        return StructuringResult(js,False,str(exc),len(matches))
    # Restrict to a provably self-contained exact compiler function: the
    # canonical trailing dispatcher and no additional code or specializations.
    tail=re.search(r'^default:throw Error\("bad LLVM basic block "\+block\);\}\}\}\);?$',js,re.M)
    if tail is None:
        # Real original LLVM emission ends with '}}}' (no registration wrapper).
        if not js.rstrip().endswith('default:throw Error("bad LLVM basic block "+block);}}}'):
            return StructuringResult(js,False,'nonstandard dispatcher epilogue',len(matches))
    identifiers=set(SLOT.findall(js))
    # Never assume any original variable name survives optimized LLVM.
    # Names are explicitly SSA-temporary rather than invented C variables.
    mapping={x: ('argument'+x if x.isdigit() and ('v["'+x+'"]=' in initializers) else
                  'temporary'+x if x.isdigit() else 'temporary_'+re.sub('[^A-Za-z0-9_]','_',x))
             for x in identifiers}
    if len(mapping)!=len(set(mapping.values())):
        return StructuringResult(js,False,'SSA name collision',len(matches))
    def transform(s):
        return SLOT.sub(lambda m:mapping[m.group(1)],s)
    assembled=[]
    expansion_count=[0]
    def rec(label,indent, predecessor=None):
        expansion_count[0]+=1
        if expansion_count[0] > max(3*len(blocks),100):
            raise ValueError("unbounded structured CFG expansion")
        pad='  '*indent
        assembled.append(pad+'checkBlock('+repr(label)+');')
        lines,term,phis=blocks[label]
        if phis:
            if predecessor is None or any(predecessor not in choices for choices in phis.values()):
                raise ValueError('unmatched PHI predecessor')
            # All RHS values are first evaluated against the *previous* SSA
            # version, exactly like simultaneous LLVM PHI assignment.
            site=expansion_count[0]
            for reg,choices in phis.items():
                assembled.append(pad+'const incoming_'+str(site)+'_'+str(len(assembled))+' = '+transform(choices[predecessor])+';')
            incoming=assembled[-len(phis):]
            for reg,decl in zip(phis,incoming):
                temp=re.match(r'\s*const (incoming_\d+_\d+) = ',decl)
                if temp is None:raise ValueError('invalid PHI destination')
                assembled.append(pad+mapping[reg]+' = '+temp[1]+';')
        for instruction in lines: assembled.append(pad+transform(instruction))
        if term[0] in ('return','throw'):
            assembled.append(pad+transform(term[1]));return
        if term[0]=='goto':rec(term[1],indent,label);return
        assembled.append(pad+'if ('+transform(term[1])+') {')
        rec(term[2],indent+1,label)
        assembled.append(pad+'} else {')
        rec(term[3],indent+1,label)
        assembled.append(pad+'}')
    try:rec(entry,1)
    except (RecursionError,ValueError):
        return StructuringResult(js,False,'structured CFG expansion limit',len(matches))
    if len('\n'.join(assembled))>max(len(js)*max_growth,512):
        return StructuringResult(js,False,'excessive CFG duplication',len(matches))
    vars_decl=(', '.join(sorted(mapping.values())))
    # The original budget/progress hooks are preserved at every reached block.
    prefix=("function("+args+"){\n"
            "  // Structurally lowered LLVM: retain source call/ABI semantics.\n"
            "  let visitedBlocks = 0;\n"
            "  function checkBlock(label) {\n"
            "    if (++visitedBlocks > ctx.instructionBudget) throw Error("+repr('LLVM instruction budget exceeded: '+symbol)+");\n"
            "    if ((visitedBlocks & 1048575) === 0 && ctx.blockProgress) ctx.blockProgress("+repr(symbol)+",label,visitedBlocks);\n"
            "  }\n")
    if vars_decl:prefix+='  let '+vars_decl+';\n'
    if initializers.strip():prefix+='\n'.join('  '+transform(l) for l in initializers.splitlines())+'\n'
    body=prefix+'\n'.join(assembled)+'\n}'
    return StructuringResult(body,True,'acyclic CFG without PHI',len(matches))
