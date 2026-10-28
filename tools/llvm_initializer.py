"""Strict, layout-aware lowering of LLVM aggregate constants to bytes and relocations.

Unlike a regex substitution this validates element counts, layouts, typed fields,
and symbol references. Unsupported constant expressions remain build blockers.
"""
from __future__ import annotations
import re,struct
from llvm_linked_backend import Blocked, symbol

SYM=r'(?:"[^"\n]+"|[-\w.$]+)'

def split_top(text):
    pieces=[];start=0;stack=[];quote=False;escape=False
    openers={'(':')','[':']','{':'}'}
    for i,c in enumerate(text):
        if quote:
            if escape:escape=False
            elif c=='\\':escape=True
            elif c=='"':quote=False
            continue
        if c=='"':quote=True;continue
        if c in openers:stack.append(openers[c])
        elif c in ')]}':
            if not stack or stack.pop()!=c:raise Blocked('unbalanced aggregate literal')
        elif c==',' and not stack:
            pieces.append(text[start:i].strip());start=i+1
    if quote or stack:raise Blocked('unclosed aggregate constant')
    pieces.append(text[start:].strip())
    return pieces

def split_type(item):
    item=item.strip()
    if item.startswith('<{'):head='{';end='}>';prefix=2
    elif item[:1] in '[{':head=item[0];end=']' if head=='[' else '}';prefix=1
    else:
        m=re.match(r'(?:%"[^"]+"|%[-\w.$]+|i\d+|ptr|float|double)',item)
        if not m:
            # Quoted LLVM type names end in a quote, without word boundary.
            m=re.match(r'%"[^"]+"',item)
        if not m:raise Blocked('unsupported initializer type '+item[:140])
        return m[0],item[m.end():].strip()
    stack=[];quoted=False;escape=False
    for i,c in enumerate(item):
        if quoted:
            if escape:escape=False
            elif c=='\\':escape=True
            elif c=='"':quoted=False
            continue
        if c=='"':quoted=True;continue
        if c in '([{':stack.append({'(':')','[':']','{':'}'}[c])
        elif c in ')]}':
            if not stack or stack.pop()!=c:raise Blocked('malformed LLVM initializer type')
            if not stack:
                stop=i+1
                if item.startswith('<{'):
                    if item[stop:stop+1]!='>':raise Blocked('unterminated packed LLVM type')
                    stop+=1
                return item[:stop],item[stop:].strip()
    raise Blocked('unterminated LLVM initializer type')

def decode_c_string(value):
    assert value.startswith('c"') and value.endswith('"')
    result=bytearray();s=value[2:-1];i=0
    while i<len(s):
        if s[i]=='\\':
            # LLVM emits literal backslash as \\ in byte arrays, as well as
            # canonical two-digit hexadecimal escapes such as \00 and \8F.
            # Escape-aware scanning must not consume the next literal byte.
            if i+1<len(s) and s[i+1]=='\\':
                result.append(92);i+=2;continue
            if i+2>=len(s) or not re.fullmatch('[0-9A-Fa-f]{2}',s[i+1:i+3]):
                raise Blocked('unknown LLVM string escape')
            result.append(int(s[i+1:i+3],16));i+=3
        else:
            n=ord(s[i]);
            if n>127:raise Blocked('non-ASCII LLVM byte initializer')
            result.append(n);i+=1
    return bytes(result)

def lower_initializer(line,layout):
    m=re.search(r'\b(?:global|constant)\s+(.+)',line)
    if not m:raise Blocked('no global/constant definition')
    typ,value=split_type(m[1]);size,_=layout.size_align(typ)
    if size>64*1024*1024:raise Blocked('aggregate initial value exceeds 64MB')
    # Remove LLVM global attributes only at top nesting level.
    value=re.split(r',\s*(?:align\s+\d+|section\s+"|comdat\b|![-\w.]+\b|unnamed_addr\b)',value,maxsplit=1)[0].strip()
    buf=bytearray(size);relocs=[]
    def parse(t,value,off):
        value=value.strip();total,_=layout.size_align(t)
        if value in ('zeroinitializer','undef'):
            # Zero is a permitted concrete choice for undef; poison is not.
            return
        if t.startswith('%'):
            actual=layout.definitions.get(t)
            if actual is None:raise Blocked('unknown named aggregate '+t)
            return parse(actual,value,off)
        if t=='ptr':
            if value=='null':return
            # GNU C labels-as-values compile to LLVM blockaddress constants.
            # A label address belongs to exactly one function; it is neither
            # a plain function pointer nor a synthetic numeric switch case.
            block=re.fullmatch(r'blockaddress\(@('+SYM+r'), %([-\w.$]+)\)',value)
            if block:
                relocs.append({'offset':off,'blockaddress':{'function':symbol(block[1]),'label':block[2]}})
                return
            m=re.fullmatch(r'@('+SYM+r')',value)
            offset=0
            if not m:
                gp=re.fullmatch(r'getelementptr(?: inbounds)?(?: inrange\([^)]*\))? \(i8, ptr @('+SYM+r'), i64 (-?\d+)\)',value)
                if gp:m=gp;offset=int(gp[2])
            if m:
                relocs.append({'offset':off,'symbol':symbol(m[1]),'addend':offset});return
            raise Blocked('unsupported pointer initializer '+value[:100])
        # Clang -O1 position-independent pointer tables encode *signed i32*
        # differences relative to a symbol (usually the table's base).  These
        # require LINK-TIME relocation, not a bogus zero initializer.
        if t=='i32':
            delta=re.fullmatch(r'trunc \(i64 sub \(i64 ptrtoint \(ptr @('+SYM+r') to i64\), i64 ptrtoint \(ptr @('+SYM+r') to i64\)\) to i32\)',value)
            if delta:
                relocs.append({'offset':off,'symbol':symbol(delta[1]),'relativeBase':symbol(delta[2]),'width':32})
                return
        if t=='i64':
            # LLVM ptrtoint constant expressions are absolute relocations.
            # The value is an integer, not a pointer-typed field: emit all
            # eight bytes using the real linked address without truncation.
            ptr_to_int=re.fullmatch(r'ptrtoint \(ptr @('+SYM+r') to i64\)',value)
            if ptr_to_int:
                relocs.append({'offset':off,'symbol':symbol(ptr_to_int[1]),
                               'width':64,'integerAddress':True})
                return
        if t.startswith('i') and t[1:].isdigit():
            bits=int(t[1:]);v={'true':1,'false':0}.get(value)
            if v is None:
                try:v=int(value,0)
                except ValueError:raise Blocked('unsupported integer constant '+value[:100])
            if bits>64:raise Blocked('unsupported integer width '+str(bits))
            buf[off:off+total]=(v%(1<<bits)).to_bytes(total,'little');return
        if t in ('float','double'):
            if value.startswith('0x'):
                bits=int(value,16)
                if len(value)==18:
                    raw=bits.to_bytes(8,'big');num=struct.unpack('>d',raw)[0]
                elif len(value)==10:
                    raw=bits.to_bytes(4,'big');num=struct.unpack('>f',raw)[0]
                else:raise Blocked('unsupported LLVM hex float')
            else:
                try:num=float(value)
                except ValueError:raise Blocked('unsupported float initializer '+value[:100])
            try:struct.pack_into('<f' if t=='float' else '<d',buf,off,num)
            except (OverflowError,struct.error) as e:raise Blocked('float initializer out of range '+str(e))
            return
        arr=re.fullmatch(r'\[(\d+) x (.+)\]',t)
        if arr:
            n=int(arr[1]);member=arr[2];stride,alignment=layout.size_align(member)
            stride=layout.aligned(stride,alignment)
            if member=='i8' and value.startswith('c"') and value.endswith('"'):
                data=decode_c_string(value)
                if len(data)!=n:raise Blocked('LLVM C array initializer length mismatch')
                buf[off:off+n]=data;return
            if not value.startswith('[') or not value.endswith(']'):
                raise Blocked('unsupported array initializer '+value[:100])
            entries=split_top(value[1:-1]) if value[1:-1].strip() else []
            if len(entries)!=n:raise Blocked('array element count mismatch '+str(len(entries))+' / '+str(n))
            for i,entry in enumerate(entries):
                sub,expr=split_type(entry)
                if sub!=member:raise Blocked('array element type mismatch '+sub+' expected '+member)
                parse(member,expr,off+i*stride)
            return
        if t.startswith('{') or t.startswith('<{'):
            begin,end=('<{','}>') if t.startswith('<{') else ('{','}')
            if not value.startswith(begin) or not value.endswith(end):raise Blocked('unsupported struct initializer '+value[:120])
            fields,_,_=layout.fields(t)
            entries=split_top(value[len(begin):-len(end)])
            if len(entries)!=len(fields):raise Blocked('struct initializer field count mismatch')
            for entry,(delta,expected) in zip(entries,fields):
                actual,expr=split_type(entry)
                if expected.strip()!=actual:raise Blocked('struct field type mismatch '+actual+' expected '+expected)
                parse(expected.strip(),expr,off+delta)
            return
        raise Blocked('unsupported global initializer type '+t[:100])
    parse(typ,value,0)
    return {'kind':'relocations' if relocs else 'bytes','size':size,'value':list(buf),'references':relocs} if relocs else {'kind':'bytes','size':size,'value':list(buf)}
