"""Minimal LLVM aggregate layout model for Clang x86_64 (LP64).

Computes explicit padding for simple structs/arrays. No vtable or member
function ABI invention. Rejects opaque, packed-bit and unsized types.
"""
import re
from llvm_linked_backend import Blocked, split_args

class Layout:
    def __init__(self, ir):
        self.pointer_size=8 if re.search(r'target triple = "(?:x86_64|aarch64)',ir) else 4
        self.definitions={}
        for name,defn in re.findall(r'^(%(?:"[^"\n]+"|[-\w.$]+))\s*=\s*type\s+([^\n]+)',ir,re.M):
            self.definitions[name]=defn.strip()
        self.cache={}

    @staticmethod
    def aligned(size,alignment):return (size+alignment-1)//alignment*alignment

    def size_align(self,t,ancestors=()):
        t=t.strip()
        if t=='ptr':return self.pointer_size,self.pointer_size
        if t in ('float','double'):return (4,4) if t=='float' else (8,8)
        if t.startswith('i') and t[1:].isdigit():
            n=max(1,(int(t[1:])+7)//8);return n,min(n,8)
        vector=re.fullmatch(r'<(\d+) x (i\d+|float|double)>',t)
        if vector:
            n=int(vector[1]); lane,_=self.size_align(vector[2],ancestors)
            size=n*lane
            if n<1 or size>256:raise Blocked('unsupported LLVM vector layout '+t)
            # Clang x86_64 commonly lays out <=16 byte fixed vectors at
            # vector-size alignment (e.g. <2 x i64> = 16-byte alignment).
            align=1 << (size-1).bit_length()
            return size,min(align,32)
        m=re.fullmatch(r'\[(\d+) x (.*)\]',t)
        if m:
            s,a=self.size_align(m[2],ancestors);return int(m[1])*self.aligned(s,a),a
        if t.startswith('%'):
            if t in ancestors:raise Blocked('recursive unsized aggregate '+t)
            if t not in self.definitions:raise Blocked('missing IR type layout '+t)
            return self.size_align(self.definitions[t],(*ancestors,t))
        if t.startswith('{') and t.endswith('}'):
            _,size,align=self.fields(t,ancestors);return size,align
        if t.startswith('<{') and t.endswith('}>'):
            types=split_args(t[2:-2]);size=0
            for typ in types:s,_=self.size_align(typ,ancestors);size+=s
            return size,1
        raise Blocked('unsupported IR type layout '+t[:120])

    def fields(self,t,ancestors=()):
        if t.startswith('%'):return self.fields(self.definitions[t],(*ancestors,t))
        packed=t.startswith('<{')
        if packed:types=split_args(t[2:-2])
        elif t.startswith('{'):types=split_args(t[1:-1])
        else:raise Blocked('not a struct: '+t)
        offsets=[];size=0;maxalign=1
        for subtype in types:
            subsize,subalign=self.size_align(subtype,ancestors)
            if packed:subalign=1
            size=self.aligned(size,subalign);offsets.append((size,subtype))
            size+=subsize;maxalign=max(maxalign,subalign)
        return offsets,self.aligned(size,maxalign),maxalign

    def gep(self,t,indices):
        size,_=self.size_align(t)
        offsets=[]
        cur=t
        for ix,(kind,val) in enumerate(indices):
            if ix==0:
                offsets.append((val,size));continue
            resolved=self.definitions.get(cur,cur)
            if resolved.startswith('{') or resolved.startswith('<{'):
                if not re.fullmatch(r'\d+',val):raise Blocked('dynamic struct member selection')
                fields,_,_=self.fields(resolved)
                n=int(val)
                if n>=len(fields):raise Blocked('struct member out of range')
                offset,cur=fields[n];offsets.append((str(offset),1))
            else:
                array=re.fullmatch(r'\[(\d+) x (.*)\]',resolved)
                if array:cur=array[2]
                sz,_=self.size_align(cur)
                offsets.append((val,sz))
        return offsets
