"""Read-only diagnostic of record metadata visible to the normal emitter."""
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import source_ast_to_js as compiler
original=compiler.Emit.expr
seen=[]
def inspect(self,node):
    if compiler.kind(node)=='CXXConstructExpr' and 'SDL_DisplayMode' in compiler.qual(node):
        name=compiler.normalized_record_name(compiler.qual(node),self.type_aliases)
        row={'name':name,'constructor':node.get('ctorType'),'record':self.aggregate_records.get(name),
            'storage':self.global_storage_records.get(name),'layout':self.record_layouts.get(name),
            'lifetime':self.lifetime_class(compiler.qual(node)), 'children':compiler.kids(node)}
        if not seen or seen[-1]!=row:
            seen.append(row);(ROOT/'reports/oct24-sdl-record-diagnostic.json').write_text(json.dumps(seen,indent=2)+'\n')
    return original(self,node)
compiler.Emit.expr=inspect
byte_original=compiler.recover_byte_records
def inspect_records(ast,*args,**kwargs):
    result=byte_original(ast,*args,**kwargs)
    typedefs=[node for tree in ast for node in compiler.descendants(tree)
        if node.get('name')=='SDL_DisplayMode' and compiler.kind(node)=='TypedefDecl']
    ids={item.get('ownedTagDecl',{}).get('id') or item.get('decl',{}).get('id')
        for node in typedefs for item in compiler.descendants(node)}-{None}
    records=[node for tree in ast for node in compiler.descendants(tree)
        if node.get('id') in ids and node.get('completeDefinition')]
    (ROOT/'reports/oct24-sdl-tag-diagnostic.json').write_text(json.dumps(
        {'typedefs':typedefs,'records':records,'recovered':result.get('SDL_DisplayMode')},indent=2)+'\n')
    return result
compiler.recover_byte_records=inspect_records
compiler.main()
