"""Audit actual active source fragments for duplicate original global storage.

Source manifests record only selected re-exports. Older fragments can also
contain unselected definitions which capture their own private/global state.
Inspect the actual emitted source declarations, including those hidden copies.
Immutable objects still require one original address within a translation unit.
"""
import json,re
from collections import defaultdict
from pathlib import Path

def header_storage_identity(row, source):
    proof=row.get('header_global_definition',{})
    header=proof.get('source_header')
    offset=proof.get('source_offset')
    if (row.get('kind')=='VarDecl' and row.get('status')=='source-first'
            and proof.get('translation_unit')==source and isinstance(header,str)
            and header and type(offset) is int and offset>=0):
        return source,header,offset
    return None


def audit(root):
    root=Path(root).resolve();conflicts=[]
    for path in sorted(root.rglob('*.manifest.json')):
        document=json.loads(path.read_text());source=document.get('source')
        if not source:continue
        files=[root/(source+'.mjs'),*[root/row['module'] for row in document.get('module_fragments',[])]]
        owners={}
        for module in files:
            if not module.resolve().is_relative_to(root):raise ValueError('Source fragment escapes module root')
            if not module.is_file():raise FileNotFoundError(module)
            for name in re.findall(r'^export (?:let|var|const) ([A-Za-z_$][\w$]*)\s*=',module.read_text(),re.M):
                owners.setdefault(name,[]).append(module.relative_to(root).as_posix())
        duplicates={name:modules for name,modules in owners.items() if len(modules)>1}
        declarations=defaultdict(set)
        for row in document.get('definitions',[]):
            identity=header_storage_identity(row,source)
            if identity and row['name'] in owners:
                declarations[identity].add(row['name'])
        aliases=[{'header':key[1],'offset':key[2],'bindings':sorted(names)}
                 for key,names in sorted(declarations.items()) if len(names)>1]
        if duplicates or aliases:
            conflict={'source':source,'duplicate_storage':duplicates}
            if aliases:conflict['duplicate_header_storage']=aliases
            conflicts.append(conflict)
    return conflicts
