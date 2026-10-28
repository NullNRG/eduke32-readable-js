"""Conservative proof of the global standard C++ allocation operator selection.

User replacements, class-specific operators, placement/nothrow/aligned forms
remain explicit blockers. The runtime is a source-language allocation service,
not a game function or an instruction interpreter.
"""
import re

def standard_allocation_operators(ast, source_root=None):
    records={};rejected=set()
    def walk(node,physical=None):
        physical=node.get('loc',{}).get('file') or physical
        name=node.get('name')
        if node.get('kind')=='FunctionDecl' and name in ('operator new','operator new[]','operator delete','operator delete[]'):
            typ=node.get('type',{}).get('qualType','')
            key=(name,typ)
            children=node.get('inner',[])
            params=[n for n in children if n.get('kind')=='ParmVarDecl']
            size=lambda n: n.get('type',{}).get('desugaredQualType',n.get('type',{}).get('qualType'))=='unsigned long'
            signature=(len(params)==1 and size(params[0]) if name.startswith('operator new') else
                       len(params) in (1,2) and params[0].get('type',{}).get('qualType')=='void *' and
                       (len(params)==1 or size(params[1])))
            system_new=bool(physical and re.search(r'/include/c\+\+/[^/]+/new$',physical.replace('\\','/')))
            body=any(n.get('kind')=='CompoundStmt' for n in children)
            if signature and not body and (node.get('isImplicit') is True or system_new):records[key]=node.get('id')
            else:rejected.add(key)
        for child in node.get('inner',[]):
            if child:walk(child,physical)
    for root in ast:walk(root)
    return {key:identity for key,identity in records.items() if key not in rejected}


import hashlib,re
from functools import lru_cache
from pathlib import Path
OPERATORS={'operator new','operator new[]','operator delete','operator delete[]'}
def allocation_symbol(node):
    name=node.get('name');mangled=node.get('mangledName','')
    if node.get('kind')!='FunctionDecl' or name not in OPERATORS or not re.fullmatch(r'_Z[A-Za-z0-9_]+',mangled):return None
    return name.replace(' ','_').replace('[]','_array')+'__'+mangled
@lru_cache(maxsize=2)
def headers(root):
    return [(p,p.read_bytes()) for p in Path(root).rglob('*') if p.is_file() and p.suffix in ('.h','.hpp','.hh','.hxx')]
def original_allocator_definitions(ast,source_root,source_rel):
    if not source_root:return []
    root=Path(source_root).resolve();found=[];seen=set()
    def walk(node):
        if node.get('kind') in ('TranslationUnitDecl','NamespaceDecl','LinkageSpecDecl'):
            for child in node.get('inner',[]):
                if child:walk(child)
            return
        if (node.get('kind')!='FunctionDecl' or node.get('name') not in OPERATORS or
                node.get('isImplicit') or node.get('inline') or node.get('storageClass')=='static'):return
        bodies=[c for c in node.get('inner',[]) if c.get('kind')=='CompoundStmt']
        loc=node.get('loc',{});offset=loc.get('offset');name=node['name']
        if len(bodies)!=1 or not isinstance(offset,int) or not allocation_symbol(node):return
        physical=loc.get('file')
        if physical:
            path=Path(physical);path=(path if path.is_absolute() else root/path).resolve()
            candidates=[(path,path.read_bytes())] if path.is_file() and path.is_relative_to(root) else []
        elif loc.get('includedFrom'):candidates=headers(str(root))
        else:return
        body=bodies[0].get('range',{});begin=body.get('begin',{}).get('offset');end=body.get('end',{}).get('offset')
        matches=[]
        for path,data in candidates:
            if path.suffix not in ('.h','.hpp','.hh','.hxx') or data[offset:offset+len(name)]!=name.encode():continue
            if not isinstance(begin,int) or not isinstance(end,int) or not (offset<begin<end<len(data)):continue
            if data[begin:begin+1]!=b'{' or data[end:end+1]!=b'}':continue
            matches.append((path,data))
        if len(matches)!=1:return
        path,data=matches[0];key=(str(path),offset,node['mangledName'])
        if key in seen:return
        seen.add(key)
        found.append((node,{'source_header':path.relative_to(root).as_posix(),'source_line':data[:offset].count(b'\n')+1,
            'source_offset':offset,'header_sha256':hashlib.sha256(data).hexdigest(),
            'body_sha256':hashlib.sha256(data[begin:end+1]).hexdigest(),
            'mangled_name':node['mangledName'],'owner_translation_unit':source_rel,'linkage':'strong-external'}))
    for tree in ast:walk(tree)
    return found
