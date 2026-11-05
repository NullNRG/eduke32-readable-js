"""Clang-observed implementation includes remain owned by their including TU."""
from pathlib import Path

IMPLEMENTATION_SUFFIXES={'.c','.cc','.cpp','.cxx','.c++','.cp'}

def included_implementation_bytes(ast,source_root):
    root=Path(source_root).resolve();paths=set();seen=set()
    pending=list(ast)
    while pending:
        node=pending.pop();pending.extend(node.get('inner',[]))
        locations=[node.get('loc',{}),*node.get('range',{}).values()]
        while locations:
            loc=locations.pop()
            if not isinstance(loc,dict):continue
            locations.extend(loc[k] for k in ('spellingLoc','expansionLoc') if k in loc)
            physical=loc.get('file')
            if not physical or not loc.get('includedFrom') or physical in seen:continue
            seen.add(physical)
            if Path(physical).suffix.lower() not in IMPLEMENTATION_SUFFIXES:continue
            path=Path(physical);path=(path if path.is_absolute() else root/path).resolve()
            if path.is_relative_to(root) and path.suffix.lower() in IMPLEMENTATION_SUFFIXES and path.is_file():
                paths.add(path)
    return tuple((path,path.read_bytes()) for path in sorted(paths))
