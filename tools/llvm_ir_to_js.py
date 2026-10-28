#!/usr/bin/env python3
"""Strict experimental LLVM textual IR -> JavaScript lowering.

All unrecognized IR instructions cause an error, never silent output.
Proven subset: the actual source/build/src/crc32.cpp as compiled with Clang 17 -O1.
Supports pure integer CFG/phi, a linear memory region, load/store and GEP.
Supports LLVM i64 arithmetic and comparisons using exact JS BigInt.
This is NOT a complete LLVM/Emscripten replacement or entire EDuke32 converter.
"""
import argparse,re,json,pathlib,subprocess,shutil,sys

REG=r'[%@][-\w.$]+'
TOK=r'(?:'+REG+r'|-?\d+|true|false|null)'

def fail(line):raise ValueError('Unsupported LLVM IR: '+line)

def val(x):
    x=x.strip()
    if x.startswith('%'):return "v["+json.dumps(x[1:])+"]"
    if x=='@crc32table':return '0'
    if x=='true':return '1'
    if x=='false':return '0'
    if re.fullmatch(r'-?\d+',x):return x
    fail('operand '+x)

def typed(x, width):
    """Convert an SSA value/constant into the representation of its LLVM width."""
    expression=val(x)
    return 'BigInt('+expression+')' if width == 64 else expression

def cast64(expression, signed=True):
    return ('BigInt.asIntN' if signed else 'BigInt.asUintN')+'(64,'+expression+')'

def mask32(expression, width):
    return ('('+expression+'|0)' if width==32 else
            '('+expression+'&'+str((1<<width)-1)+')' if width in (1,8,16) else expression)

def translate(ir, selected=None):
    parts=re.findall(r'^define\s+[^\n]*?@([\w.$]+)\(([^\n]*)\)[^\n]*\{\n(.*?)^\}',ir,re.M|re.S)
    if not parts:fail('No function definitions')
    out=['"use strict";','/* Generated from genuine Clang LLVM IR, not a handwritten JavaScript reimplementation. */','const EDukeSourceIR=(()=>{','const memory=new ArrayBuffer(8*256*4+2*1024*1024);','const mem=new DataView(memory);','const buf=new Uint8Array(memory);','let initialized=false;']
    funnames=[]
    for name,args,body in parts:
        if selected is not None and name not in selected:continue
        argument_ids=re.findall(r'(?:ptr|i\d+)\s+(?:[^,%]*?\s+)?(%\d+)(?=,|\))',args+')')
        if not argument_ids:
            argument_ids=re.findall(r'%\d+',args)
        arglist=[f'p{i}' for i in range(len(argument_ids))]
        argument_types=[(re.match(r'\s*(?:ptr|i(\d+))\b',part).group(1) if re.match(r'\s*(?:ptr|i(\d+))\b',part) else None) for part in args.split(',')][:len(argument_ids)]
        # Labels use an implicit entry block numbered one after the last parameter.
        entry=str(len(argument_ids))
        blocks={entry:[]}
        for line in body.splitlines():
            line=line.strip();line=re.sub(r', ![\w.]+ !\d+.*$','',line)
            if not line or line.startswith(';'):continue
            mat=re.match(r'([\w.$-]+):',line)
            if mat:entry=mat[1];blocks[entry]=[];continue
            blocks[entry].append(line)
        keys=list(blocks)
        funct=f'ir_{name}'
        funnames.append(name)
        out.append(f'function {funct}({", ".join(arglist)})'+'{')
        out.append('const v=[];')
        for i,arg in enumerate(argument_ids):
            width=argument_types[i] if i<len(argument_types) else None
            init=mask32(f'p{i}',int(width)) if width in ('1','8','16','32') else f'BigInt(p{i})' if width=='64' else f'p{i}'
            out.append(f'v[{json.dumps(arg[1:])}]={init};')
        out.append(f'let block={json.dumps(keys[0])},prev="",fuel=0;')
        out.append('while(true){if(++fuel>ctx.instructionBudget)throw Error("LLVM CFG fuel exceeded");switch(block){')
        for key,lines in blocks.items():
            out.append('case '+json.dumps(key)+':{')
            phis=[]
            for line in lines:
                m=re.fullmatch(r'(%[-\w.$]+) = phi (i\d+|ptr) (.+)',line)
                if m:
                    choices=re.findall(r'\[\s*('+TOK+r')\s*,\s*%([\w.$-]+)\s*\]',m[3])
                    if not choices:fail(line)
                    expr=' : '.join(f'prev === {json.dumps(lab)} ? {typed(reg,64) if m[2]=="i64" else val(reg)}' for reg,lab in choices)+' : (()=>{throw Error("bad predecessor")})()'
                    phis.append(f'_phi[{json.dumps(m[1][1:])}]={expr};')
            if phis:out.extend(['const _phi=Object.create(null);',*phis,'Object.assign(v,_phi);'])
            for line in lines:
                if ' = phi ' in line:continue
                if line.startswith('br '):
                    m=re.fullmatch(r'br label %([\w.$-]+)',line)
                    if m:out.append(f'prev=block;block={json.dumps(m[1])};break;');continue
                    m=re.fullmatch(r'br i1 ('+TOK+r'), label %([\w.$-]+), label %([\w.$-]+)',line)
                    if m:out.append(f'prev=block;block={val(m[1])} ? {json.dumps(m[2])} : {json.dumps(m[3])};break;');continue
                    fail(line)
                if line.startswith('ret '):
                    m=re.fullmatch(r'ret i(\d+) ('+TOK+r')',line)
                    if m:out.append(f'return {typed(m[2],int(m[1])) if m[1]=="64" else mask32(val(m[2]),int(m[1]))};');continue
                    if line=='ret void':out.append('return;');continue
                    fail(line)
                if line.startswith('store '):
                    m=re.match(r'store i(8|16|32) ('+TOK+r'), ptr ('+TOK+r')\b',line)
                    if not m:fail(line)
                    out.append(f'mem.setUint{m[1]}({val(m[3])},{val(m[2])},true);');continue
                m=re.match(r'(%[-\w.$]+) = (.+)',line)
                if not m:fail(line)
                target='v['+json.dumps(m[1][1:])+']';op=m[2]
                a=re.match(r'load i(8|16|32), ptr ('+TOK+r')\b',op)
                if a:out.append(f'{target}=mem.getUint{a[1]}({val(a[2])},true);');continue
                a=re.match(r'(add|sub|mul|xor|and|or|lshr|ashr|shl)(?: [\w]+)* i(\d+) ('+TOK+r'), ('+TOK+r')$',op)
                if a:
                    operation,width,x,y=a[1],int(a[2]),a[3],a[4]
                    if width not in (1,8,16,32,64):fail('unsupported integer bit width '+line)
                    left,right=typed(x,width),typed(y,width)
                    ops={'add':'+','sub':'-','mul':'*','xor':'^','and':'&','or':'|','lshr':'>>>','ashr':'>>','shl':'<<'}
                    if width==64:
                        expression=f'({left} {" >> " if operation=="lshr" else " >> " if operation=="ashr" else ops[operation]} {right})'
                        if operation=='lshr':expression=f'({cast64(left,False)} >> {right})'
                        expression=cast64(expression)
                    elif operation=='mul':expression=f'Math.imul({left},{right})'
                    elif operation=='lshr':expression=f'({left} >>> {right})'
                    else: expression=f'({left} {ops[operation]} {right})'
                    if width!=64:expression=mask32(expression,width)
                    out.append(f'{target}={expression};');continue
                a=re.match(r'icmp (eq|ne|sgt|sge|slt|sle|ugt|uge|ult|ule) i(\d+) ('+TOK+r'), ('+TOK+r')$',op)
                if a:
                    cmps={'eq':'===','ne':'!==','sgt':'>','sge':'>=','slt':'<','sle':'<=','ugt':'>','uge':'>=','ult':'<','ule':'<='}
                    condition,width,x,y=a[1],int(a[2]),a[3],a[4]
                    if width==64:
                        x,y=typed(x,64),typed(y,64)
                        x,y=(cast64(x,False),cast64(y,False)) if condition.startswith('u') else (cast64(x),cast64(y))
                    else:
                        x,y=val(x),val(y)
                        x,y=(f'({x}>>>0)',f'({y}>>>0)') if condition.startswith('u') else (f'({x}|0)',f'({y}|0)')
                    out.append(f'{target}=+({x} {cmps[condition]} {y});');continue
                a=re.match(r'(zext|sext|trunc)(?: [\w]+)* i(\d+) ('+TOK+r') to i(\d+)$',op)
                if a:
                    operation,src_width,raw,dst_width=a[1],int(a[2]),a[3],int(a[4]); src=typed(raw,src_width)
                    if src_width not in (1,8,16,32,64) or dst_width not in (1,8,16,32,64):fail(line)
                    if dst_width==64:
                        if operation=='zext':expr= 'BigInt.asUintN('+str(src_width)+', '+('BigInt('+src+')' if src_width<64 else src)+')'
                        else:expr= ('BigInt.asIntN('+str(src_width)+', '+src+')' if src_width==64 else 'BigInt('+('('+src+'<<'+str(32-src_width)+'>>'+str(32-src_width)+')' if src_width<32 else '('+src+'|0)')+')')
                    elif src_width==64:
                        expr=mask32('Number(BigInt.asIntN(32,'+src+'))',dst_width)
                    elif operation=='sext' and src_width<32:
                        expr=mask32('('+src+'<<'+str(32-src_width)+'>>'+str(32-src_width)+')',dst_width)
                    else:expr=mask32(src,min(src_width,dst_width) if operation=='zext' else dst_width)
                    out.append(f'{target}={expr};');continue
                a=re.match(r'select i1 ('+TOK+r'), i\d+ ('+TOK+r'), i\d+ ('+TOK+r')$',op)
                if a:out.append(f'{target}={val(a[1])} ? {val(a[2])} : {val(a[3])};');continue
                if op.startswith('getelementptr inbounds '):
                    a=re.match(r'getelementptr inbounds (\[256 x i32\]|i8), ptr (.*)',op)
                    if not a:fail(line)
                    spec,other=a.groups();unit=4 if spec!='i8' else 1
                    # Constant GEP as a pointer operand supported for global offset only.
                    if other.startswith('getelementptr '):
                        base_off=re.search(r'ptr @crc32table, i64 (\d+)\)',other)
                        if not base_off:fail(line)
                        base=str(int(base_off[1]))
                        other=other[base_off.end():]
                    else:
                        p=re.match(r'('+TOK+r')',other)
                        if not p:fail(line)
                        base=val(p[1]);other=other[p.end():]
                    indices=re.findall(r', i64 ('+TOK+r')',other)
                    if not indices:fail(line)
                    idx=val(indices[-1]);expr=f'(Number({base}) + Number({idx})*{unit})'
                    out.append(f'{target}={expr};');continue
                fail(line)
            out.append('break;}')
        out.append('default:throw Error("Invalid LLVM basic block "+block);}}}')
    if selected is not None and (set(funnames)!=set(selected)):
        fail('requested functions missing: '+', '.join(sorted(set(selected)-set(funnames))))
    if not funnames:fail('No selected function definitions')
    if {'Bcrc32','initcrc32table'}.issubset(funnames):
        out.append('function crc32(bytes,seed=0){if(!initialized){ir_initcrc32table();initialized=true;}if(bytes.length>2097152)throw Error("CRC32 input too large; chunk it");buf.set(bytes,8192);return ir_Bcrc32(8192,bytes.length,seed)>>>0;}')
        out.append('return {crc32,functions:'+json.dumps(funnames)+','+','.join(json.dumps(n)+':ir_'+n for n in funnames)+'};})();')
    else:
        out.append('return {'+', '.join(json.dumps(n)+':ir_'+n for n in funnames)+'};})();')
    return '\n'.join(out)+'\n'

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input',type=pathlib.Path,action='append',required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--functions',help='Comma-separated allowlist of compiled symbols; reject unsupported IR in chosen symbols')
    args=p.parse_args();args.output.parent.mkdir(parents=True,exist_ok=True)
    js=translate('\n'.join(x.read_text() for x in args.input),set(args.functions.split(',')) if args.functions else None);args.output.write_text(js)
    if shutil.which('node'):
        res=subprocess.run(['node','--check',str(args.output)],capture_output=True,text=True)
        if res.returncode:sys.exit(res.stderr)
    print('Generated',args.output,'bytes',len(js))
if __name__=='__main__':main()
