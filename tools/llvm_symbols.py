"""LLVM module linkage rules: keep file-local symbols separate and coalesce ODR.

Names marked `internal` or `private` belong to one translation unit and must be
renamed before JS code generation. Weak/linkonce ODR external definitions may be
coalesced; conflicting strong definitions are an error.
"""
import hashlib,re
from llvm_linked_backend import SYMBOL, symbol

LOCAL = {'internal','private'}
WEAK = {'weak','weak_odr','linkonce','linkonce_odr','available_externally','extern_weak'}

def function_linkages(ir):
    result={}
    for attrs,name in re.findall(r'^define\s+([^\n]*?)@('+SYMBOL+r')\(',ir,re.M):
        words=attrs.split()
        result[symbol(name)]=next((x for x in words if x in LOCAL|WEAK),'strong')
    return result

def global_linkages(ir):
    result={}
    for name,attrs in re.findall(r'^@('+SYMBOL+r')\s*=\s*([^\n]+)',ir,re.M):
        result[symbol(name)]=next((x for x in attrs.split() if x in LOCAL|WEAK),'strong')
    return result

def resolve_locals(ir,source):
    metadata={**global_linkages(ir),**function_linkages(ir)}
    local={name for name,linkage in metadata.items() if linkage in LOCAL}
    prefix='__tu'+hashlib.sha256(source.encode()).hexdigest()[:12]+'_'
    replacement={name:prefix+re.sub('[^A-Za-z0-9_$.-]','_',name)+'_'+hashlib.sha256(name.encode()).hexdigest()[:7] for name in local}
    def substitute(m):
        quoted=m[1];name=symbol(quoted)
        return '@'+replacement.get(name,quoted)
    ir=re.sub(r'@('+SYMBOL+r')',substitute,ir)
    metadata={replacement.get(name,name):kind for name,kind in metadata.items()}
    return ir,metadata,{'private_or_internal_definitions':len(local), 'renamed':replacement}
