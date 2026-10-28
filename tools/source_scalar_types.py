"""Exact Linux LP64 scalar spellings; template arguments are not scalars.

Clang desugared types are preferred by the caller. This module recognizes
only complete primitive/fixed-width spellings, never tokens inside records,
templates, function signatures or pointer declarators.
"""
import re


def scalar_info(spelling):
    spelling=re.sub(r'\b(?:const|volatile|restrict|__restrict|__restrict__)\b',' ',spelling)
    spelling=' '.join(spelling.split())
    aliases={
        'int8_t':('integer',1,False),'uint8_t':('integer',1,True),
        'int16_t':('integer',2,False),'uint16_t':('integer',2,True),
        'int32_t':('integer',4,False),'uint32_t':('integer',4,True),
        'int64_t':('integer',8,False),'uint64_t':('integer',8,True),
        'fix16_t':('integer',4,False),'size_t':('integer',8,True),
        'ptrdiff_t':('integer',8,False),'intptr_t':('integer',8,False),
        'uintptr_t':('integer',8,True),
        '__int128':('integer',16,False),'signed __int128':('integer',16,False),
        'unsigned __int128':('integer',16,True),
        '__int128_t':('integer',16,False),'__uint128_t':('integer',16,True),
        'bool':('boolean',1,False),'_Bool':('boolean',1,False),
        'float':('floating',4,False),'double':('floating',8,False),
        'long double':('extended-floating',16,False),
    }
    if spelling in aliases:return aliases[spelling]
    words=spelling.split()
    if not words or any(w not in ('signed','unsigned','char','short','int','long') for w in words):return None
    if words.count('signed')+words.count('unsigned')>1:return None
    unsigned='unsigned' in words
    tokens=[w for w in words if w not in ('signed','unsigned')]
    if tokens==['char']:
        # The captured Make build uses -funsigned-char. An explicitly signed
        # char remains signed; both cases have exactly one byte of storage.
        return ('integer',1,unsigned or 'signed' not in words)
    if any(tokens.count(w)>1 for w in ('char','short','int')) or tokens.count('long')>2:return None
    if 'char' in tokens or ('short' in tokens and 'long' in tokens):return None
    return ('integer',2 if 'short' in tokens else 8 if 'long' in tokens else 4,unsigned)


def is_integer(spelling,width=None,unsigned=None):
    info=scalar_info(spelling)
    return bool(info and info[0]=='integer' and (width is None or info[1]==width)
                and (unsigned is None or info[2] is unsigned))
