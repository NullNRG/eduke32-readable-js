"""Prove empty read/write-register optimization barriers from original bytes.

Clang JSON omits the assembly template and constraints. AST operands alone
cannot authorize lowering assembly. Accept only the exact empty +r form with
one simple, nonvolatile declaration reference; all real instructions, outputs
without inputs, memory clobbers, goto and side-effecting operands stay blocked.
"""
import hashlib,re
from pathlib import Path

FORM=re.compile(rb'(?:__asm__|__asm|asm)\s*\(\s*""\s*:\s*"\+r"\s*\(\s*[A-Za-z_]\w*\s*\)\s*\)')

def prove_empty_asm(node,root,source_rel,headers):
    operands=[n for n in node.get('inner',[]) if n]
    if len(operands)!=1 or operands[0].get('kind')!='DeclRefExpr':return None
    if re.search(r'\bvolatile\b',operands[0].get('type',{}).get('qualType','')):return None
    bounds=node.get('range',{});begin=bounds.get('begin',{});end=bounds.get('end',{})
    begin=begin.get('spellingLoc',begin);end=end.get('spellingLoc',end)
    lo=begin.get('offset');hi=end.get('offset');length=end.get('tokLen')
    if not all(type(v) is int for v in (lo,hi,length)) or not 0<=lo<=hi or length<1:return None
    if begin.get('file') and end.get('file') and begin['file']!=end['file']:return None
    physical=begin.get('file') or end.get('file');root=Path(root).resolve()
    if physical:
        path=Path(physical);path=(path if path.is_absolute() else root/path).resolve()
        if not path.is_relative_to(root) or not path.is_file():return None
        choices=[(path,path.read_bytes())]
    else:
        primary=(root/source_rel).resolve()
        if not primary.is_relative_to(root) or not primary.is_file():return None
        choices=[(primary,primary.read_bytes()),*headers]
    matches={}
    for path,data in choices:
        statement=data[lo:hi+length]
        if not FORM.fullmatch(statement):continue
        if 'line' in begin and data[:lo].count(b'\n')+1!=begin['line']:continue
        if 'col' in begin and lo-data.rfind(b'\n',0,lo)!=begin['col']:continue
        matches[path.resolve()]={'source':path.relative_to(root).as_posix(),'offset':lo,
            'source_sha256':hashlib.sha256(data).hexdigest(),'statement':statement.decode('ascii'),
            'proof':'original-empty-readwrite-register-barrier'}
    return next(iter(matches.values())) if len(matches)==1 else None
