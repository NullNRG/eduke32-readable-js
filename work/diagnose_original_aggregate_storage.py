from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import source_ast_to_js as compiler
report={'source':'source/duke3d/src/global.cpp','record_runs':[],'schema_failures':{}}
original=compiler.recover_trivial_aggregate_records
def recover(ast,static_storage=False):
 result=original(ast,static_storage)
 aliases=compiler.recover_type_aliases(ast)
 wanted={'actor_t','projectile_t','playerspawn_t','user_defs','vec2_t','vec3_t','vec2<int>','vec3<int>','vec3'}
 row={'static_storage':static_storage,'record_entries':{},'ast_records':[],'aliases':{k:v for k,v in aliases.items() if k in wanted}}
 for name in wanted:
  actual=compiler.normalized_record_name(name,aliases)
  row['record_entries'][name]={'resolved_name':actual,'shape':result.get(actual)}
 complete={n.get('id'):n for top in ast for n in compiler.descendants(top)
           if compiler.kind(n)=='CXXRecordDecl' and n.get('completeDefinition')}
 row['typedef_records']={}
 for top in ast:
  for alias in compiler.descendants(top):
   if compiler.kind(alias) not in ('TypedefDecl','TypeAliasDecl') or alias.get('name') not in wanted:continue
   tags={item.get('ownedTagDecl',{}).get('id') or item.get('decl',{}).get('id') for item in compiler.descendants(alias)}
   row['typedef_records'][alias['name']]=[{'id':identity,'loc':complete[identity].get('loc'),
    'traits':complete[identity].get('definitionData'),
    'fields':[(compiler.kind(f),f.get('name'),compiler.qual(f)) for f in compiler.kids(complete[identity])
              if compiler.kind(f) in ('FieldDecl','CXXRecordDecl')]}
    for identity in tags if identity in complete]
 for top in ast:
  for node in compiler.descendants(top):
   if compiler.kind(node) not in ('CXXRecordDecl','ClassTemplateSpecializationDecl') or not node.get('completeDefinition'):continue
   if node.get('name') not in wanted and node.get('_source_record_name') not in wanted:continue
   row['ast_records'].append({key:node[key] for key in ['kind','name','_source_record_name','id','loc','definitionData'] if key in node})
 report['record_runs'].append(row)
 return result
compiler.recover_trivial_aggregate_records=recover
schema=compiler.aggregate_type_schema
def inspect(t,*args,**kwargs):
 result=schema(t,*args,**kwargs)
 if result is None and any(name in t for name in ('actor_t','projectile_t','playerspawn_t','vec2','vec3','user_defs')):
  report['schema_failures'][t]={'depth':kwargs.get('depth',args[3] if len(args)>3 else 0)}
 return result
compiler.aggregate_type_schema=inspect
sys.argv=[str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT/'factory-output/source-tree/eduke32-master'),
 '--source','source/duke3d/src/global.cpp','--header-dependency-closure',
 '--ast-cache-dir',str(ROOT/'work/original-aggregate-storage-cache'),
 '--out-dir',str(ROOT/'work/original-aggregate-storage-probe')]
try:compiler.main()
finally:
 target=ROOT/'reports/original-aggregate-storage-diagnosis.json'
 target.write_text(json.dumps(report,indent=2)+'\n')
 print('DIAGNOSIS',str(target),file=sys.stderr)
