"""Different Clang anonymous-type spellings join only a proven source token."""
import copy,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import parse_json_stream,parse_clang_record_layouts,recover_type_aliases,descendants
from source_byte_records import recover_byte_records,anonymous_location
from source_first_toolchain import frontend_config
from source_record_layout_extraction import extract
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder);(root/'unit.cpp').write_text('int bits(int n){union{int i;float f;}x;x.f=float(n);return x.i;}\n')
    frontend,target=frontend_config(True)
    result=subprocess.run([frontend,*target,'-Xclang','-ast-dump=json','-fsyntax-only','unit.cpp'],cwd=root,capture_output=True,text=True,timeout=90)
    assert result.returncode==0,result.stderr
    ast=parse_json_stream(result.stdout)
    result=extract(frontend,['-x','c++'],target,'unit.cpp',root);assert result.returncode==0,result.stderr
    layouts=parse_clang_record_layouts(result.stdout+'\n'+result.stderr)
    changed=copy.deepcopy(ast);names=set()
    for tree in changed:
        for node in descendants(tree):
            typ=node.get('type',{})
            for key in ('qualType','desugaredQualType'):
                spelling=typ.get(key,'');physical=anonymous_location(spelling)
                if physical and ('union (' in spelling or spelling.startswith('(unnamed union')):
                    typ[key]='(unnamed union at '+physical+')';names.add(typ[key])
    assert names,'Fixture must contain an anonymous union type'
    records=recover_byte_records(changed,layouts,recover_type_aliases(changed),source_root=root,source_rel='unit.cpp')
    for name in names:assert name in records and records[name]['byte_schema']['size']==4 and records[name]['union'],(name,records)
    # Wrong tag/location must not gain an ABI merely from a similar shape.
    original=next(iter(names));physical=anonymous_location(original);path,line,col=physical.rsplit(':',2)
    for wrong in ['(unnamed struct at '+physical+')','(unnamed union at '+path+':'+line+':'+str(int(col)+1)+')']:
        bad=copy.deepcopy(changed)
        for tree in bad:
            for node in descendants(tree):
                typ=node.get('type',{})
                for key in ('qualType','desugaredQualType'):
                    if typ.get(key) in names:typ[key]=wrong
        rejected=recover_byte_records(bad,layouts,recover_type_aliases(bad),source_root=root,source_rel='unit.cpp')
        assert wrong not in rejected,(wrong,rejected)
print('PASS alternate Clang local-union spelling joins one exact source token and native layout; changed tag and source location rejected')
