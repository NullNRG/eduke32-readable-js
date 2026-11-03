"""Map the bounded game frontier to fresh semantic declaration candidates.

Header definition locations are not translation-unit ownership proofs. This
report never invents an owner or changes the compiler's strict symbol index.
"""
import collections,csv,json,sqlite3,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import compiler_runtime_revision

profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
base=ROOT/profile['build_root'];frontier_path=base/'reports/frontier-source_duke3d_src_game.cpp.json'
frontier=json.loads(frontier_path.read_text());manifest=json.loads((ROOT/frontier['manifest']).read_text())
selected={row['file'] for row in json.loads((ROOT/profile['derived_commands']).read_text())}
connection=sqlite3.connect((base/'reports/semantic-index.sqlite').resolve().as_uri()+'?mode=ro',uri=True)
fingerprint=dict(connection.execute('select key,value from meta'))['fingerprint']
callers=collections.defaultdict(list);semantic=[]
for row in manifest['definitions']:
    if row.get('status')!='blocked':continue
    caller={'name':row['name'],'file':row.get('physical_source',manifest['source']),'line':row.get('line')}
    declarations=connection.execute('select usr from declarations where name=? and file=? and line=? and definition=1',
        (row.get('source_name',row['name']),caller['file'],caller['line'])).fetchall()
    caller['semantic_usrs']=sorted({usr for usr, in declarations if usr})
    if not row.get('reason','').startswith('unlinked identifiers:'):
        semantic.append({**caller,'reason':row.get('reason')})
    for name in row.get('unresolved_references',[]):callers[name].append(caller)
direct=next(row.get('unresolved_references',[]) for row in manifest['definitions'] if row['name']=='app_main')
rows=[];rank=collections.Counter()
for name,affected in sorted(callers.items(),key=lambda pair:(-len(pair[1]),pair[0])):
    candidates=[]
    for raw, in connection.execute("select record from declarations where name=? and definition=1 and linkage in ('EXTERNAL','INTERNAL')",(name,)):
        record=json.loads(raw);location=record['file']
        if record.get('kind') not in ('FUNCTION_DECL','VAR_DECL'):continue
        candidate={key:record.get(key) for key in ('id','usr','kind','name','file','line','offset','type','linkage','storage_class')}
        candidate['location_is_selected_translation_unit']=location in selected
        candidate['header_owner_not_attested']=location not in selected
        candidates.append(candidate)
        if location in selected:rank[location]+=len(affected)
    rows.append({'name':name,'direct_app_main_dependency':name in direct,'affected_callers':affected,
        'observed_affected_definitions':len(affected),'definition_candidates':candidates,
        'provider_status':'no exact-name original definition observed' if not candidates else
            'original definition candidates; compiler/ABI/link verification still required'})
connection.close()
report={'format':'bounded-original-game-provider-frontier/1','gameplay_verified':False,
    'frontier':frontier_path.relative_to(ROOT).as_posix(),'manifest':frontier['manifest'],
    'semantic_fingerprint':fingerprint,'selected_translation_units':len(selected),
    'manifest_compiler_revision':manifest.get('compiler_runtime_input_sha256'),
    'current_compiler_revision':compiler_runtime_revision(),
    'manifest_matches_current_compiler':manifest.get('compiler_runtime_input_sha256')==compiler_runtime_revision(),
    'whole_game_inventory':False,'whole_program_fanout_measured':False,
    'header_definition_locations_do_not_prove_owner':True,
    'entry_linked':False,'direct_unresolved_count':len(direct),'deduplicated_observed_unresolved':len(rows),
    'bounded_dependency_closure':manifest.get('dependency_closure'),
    'non_link_semantic_blockers_at_this_revision':semantic,
    'candidate_source_priority':[{'source':name,'observed_caller_weight':weight} for name,weight in rank.most_common()],
    'blockers':rows}
output=ROOT/'reports/nov02-game-provider-frontier.json';output.write_bytes((json.dumps(report,indent=2)+'\n').encode())
with output.with_suffix('.csv').open('w',encoding='utf-8',newline='') as stream:
    writer=csv.writer(stream);writer.writerow(['symbol','direct_app_main','observed_callers','candidate_usr','candidate_file','line','kind','selected_unit_location','header_owner_not_attested'])
    for row in rows:
        for candidate in row['definition_candidates'] or [{}]:
            writer.writerow([row['name'],row['direct_app_main_dependency'],row['observed_affected_definitions'],
                *(candidate.get(key) for key in ('usr','file','line','kind','location_is_selected_translation_unit','header_owner_not_attested'))])
print(json.dumps({'report':str(output),'direct_app_main_dependencies':len(direct),'deduplicated_observed_unresolved':len(rows),
    'candidate_source_priority':report['candidate_source_priority'][:8],'whole_game_inventory':False},indent=2))
