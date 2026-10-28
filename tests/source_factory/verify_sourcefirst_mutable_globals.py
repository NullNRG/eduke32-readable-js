"""Execute cross-unit native scalar/pointer writers and validate storage ABI."""
from pathlib import Path
import copy, json, subprocess, sys, tempfile
ROOT=Path(__file__).resolve().parents[2]
TEST=ROOT/'tests/source_factory'
sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import relink, storage_import_error, settle_proposals
from source_ast_to_js import immutable_global

for spelling,constant in [('const int *',False),('int *const',True),('int *const *',False),
    ('void (*)(const char *)',False),('void (*const)(const char *)',True)]:
    assert immutable_global({'type':{'qualType':spelling}})==constant,spelling

def run(command, timeout=150):
    result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True,timeout=timeout)
    assert result.returncode==0,(command,result.stderr,result.stdout)
    return result.stdout

names=['source_first_mutable_global_provider.cpp','source_first_mutable_global_consumer.cpp']
operations=[['set_scalar',[7]],['compound_scalar',[4]],['post_scalar',[]],['pre_scalar',[]],
    ['set_gain',[0.1]],['compound_gain',[3]],['post_serial',[]],['post_serial',[]],
    ['set_narrow',[65537]],['compound_narrow',[65535]],['alias_shared',[81]],['alias_owner',[92]],
    ['retarget_cursor',[0]],['step_cursor',[]],['post_cursor',[]],['pre_cursor',[]],
    ['alias_cursor_slot',[]],['retarget_const_pointee',[]],['local_shadow',[]],['cycle_write',[]],
    ['compare_addresses',[]],['validate_global_address',[]],['write_via_call',[12]],['static_cycle_alias',[42]],
    ['narrow_alias',[65538]],['gain_alias',[0.2]],['assign_schar_expression',[260]],
    ['assign_schar_expression',[-129]],['assign_uchar_expression',[260]],['assign_short_expression',[65535]],
    ['assign_ushort_expression',[65539]],['assign_bool_expression',[2]],['assign_bool_expression',[0]],
    ['assign_gain_expression',[1/3]],['alias_byte_expression',[258]],['read_constants',[]],
    ['mutate_array_element',[67]],['retarget_cursor',[2]],['compound_counted',[]],
    ['assign_uchar_expression',[255]],['pre_counted_byte',[]],['post_counted_byte',[]],
    ['local_next_alias',[]],['global_next_write',[8]]]

with tempfile.TemporaryDirectory(prefix='source_mutable_globals_') as scratch:
    temp=Path(scratch);out=temp/'project';plan=temp/'plan.json'
    plan.write_text(json.dumps({'root':str(TEST),'units':[{'source':name} for name in names]}))
    build=json.loads(run([sys.executable,str(ROOT/'tools/source_first_project.py'),'--plan',str(plan),'--out-dir',str(out),'--strict']))
    assert build['source_definitions_blocked']==0 and not build['invalid_imports'],build
    native=temp/('native.exe' if sys.platform=='win32' else 'native')
    run(['clang++','-std=c++14',*[str(TEST/name) for name in names],str(TEST/'source_first_mutable_global_native.cpp'),'-o',str(native)])
    expected=[json.loads(line) for line in run([str(native)]).splitlines()]
    def compare(directory):
        runner=temp/'compare.mjs'
        runner.write_text('import * as p from '+json.dumps((directory/(names[0]+'.mjs')).as_uri())+';\n'
            +'import * as c from '+json.dumps((directory/(names[1]+'.mjs')).as_uri())+';\n'
            +'const operations='+json.dumps(operations)+';\n'
            +'for(const [name,args] of operations){const value=c[name](...args);console.log(JSON.stringify([value,p.scalar,c.consumer_count,p.pointer_index(),p.gain,p.narrow,p.serial,p.small_signed,p.small_unsigned,p.signed_short,Number(p.gate),p.effect_calls,p.next]));}\n')
        observed=[json.loads(line) for line in run(['node',str(runner)]).splitlines()]
        assert observed==expected,(observed,expected)
        return len(observed)
    direct_checks=compare(out)
    units={name:{'manifest':json.loads((out/(name+'.manifest.json')).read_text()),'module':out/(name+'.mjs')} for name in names}
    metadata=units[names[0]]['manifest']
    assert any(d['name']=='const_pointee' for d in metadata['storage_exports'])
    assert not any(d['name']=='fixed_pointer' for d in metadata['storage_exports'])
    assert not any(d['name']=='frozen' for d in metadata['storage_exports'])
    assert not any(d['name']=='samples' for d in metadata['storage_exports'])
    assert all(not d['name'].startswith('__cxx_global_cell_') for unit in units.values() for d in unit['manifest']['definitions'])
    scalar_dep=next(dep for dep in units[names[1]]['manifest']['imports'] if dep['name']=='scalar')
    assert storage_import_error(scalar_dep,units) is None
    bad=copy.deepcopy(units);bad[names[0]]['manifest']['storage_exports']=[]
    assert storage_import_error(scalar_dep,bad)
    accepted,rejected=settle_proposals(bad,{names[1]:bad[names[1]]},TEST)
    assert names[1] in rejected and names[1] not in accepted
    # A manifest promise without an actual emitted storage export is rejected.
    no_storage=temp/'no-storage.mjs';no_storage.write_text('export let scalar=3;')
    bad=copy.deepcopy(units);bad[names[0]]['module']=no_storage
    assert storage_import_error(scalar_dep,bad)
    bad_dep={**scalar_dep,'original_type':'double'}
    assert storage_import_error(bad_dep,units)
    # Independent initial compilation, followed by the production fixed-point
    # linker, must resolve the cyclic original/global ownership graph.
    batches=temp/'batches';batches.mkdir();rows=[]
    for i,name in enumerate(names):
        dest=batches/f'batch{i}'
        run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(TEST),'--source',name,'--out-dir',str(dest)])
        (dest/'project-build.json').write_text(json.dumps({'units':[{'source':name}]}))
        rows.append({'status':'ok','sources':[name],'manifest':f'batch{i}/project-build.json'})
    (batches/'recovery-report.json').write_text(json.dumps({'original_selected_units':2,'batch_results':rows}))
    linked=temp/'linked';report=relink(batches,linked,TEST,timeout=120,jobs=1)
    assert not report['invalid_imports_or_syntax'] and report['total_blocked_definitions']==0,report
    linked_checks=compare(linked)
    # A direct record assignment cannot inherit scalar cell semantics. Preserve
    # independent reads, and reject unverified whole-record replacement.
    aggregate=temp/'aggregate';aggregate.mkdir()
    (aggregate/'provider.cpp').write_text('struct Packet { int field; }; struct Packet packet={3};')
    (aggregate/'consumer.c').write_text('struct Packet { int field; }; extern struct Packet packet; '
        'int read_packet(void){return packet.field;} '
        'int replace_packet(struct Packet other){packet=other;return packet.field;}')
    aggregate_plan=temp/'aggregate-plan.json'
    aggregate_plan.write_text(json.dumps({'root':str(aggregate),'units':[{'source':'provider.cpp'},{'source':'consumer.c'}]}))
    aggregate_out=temp/'aggregate-out'
    aggregate_report=json.loads(run([sys.executable,str(ROOT/'tools/source_first_project.py'),
        '--plan',str(aggregate_plan),'--out-dir',str(aggregate_out)]))
    aggregate_manifest=json.loads((aggregate_out/'consumer.c.manifest.json').read_text())
    replace=next(d for d in aggregate_manifest['definitions'] if d['name']=='replace_packet')
    assert replace['status']=='blocked' and replace['reason']=='external aggregate assignment requires verified copy/storage ABI',replace
    assert not aggregate_report['invalid_imports']
    result={'native_state_comparisons':direct_checks+linked_checks,'direct_project_cases':direct_checks,
        'fixed_point_linked_cases':linked_checks,'storage_manifest_tamper_rejected':True,
        'storage_actual_export_absence_rejected':True,'storage_type_mismatch_rejected':True,
        'cyclic_owner_writes_verified':True,'original_exports_preserved':True,'original_definition_entries':build['source_definitions_emitted'],
        'stable_global_addresses_verified':True,'cyclic_static_address_initializers_verified':True,
        'callee_alias_writes_and_owner_narrowing_verified':True,
        'assignment_expression_result_narrowing_verified':['signed char','unsigned char','short','unsigned short','bool','float'],
        'constant_imports_and_array_element_mutations_verified':True,'unverified_aggregate_assignment_rejected':True,
        'effectful_lvalues_evaluated_once_verified':True,'setter_parameter_shadowing_rejected_by_construction':True,
        'source_abi':'Linux LP64 extraction','native_abi_note':'Host executable; int/float/short/pointer operations avoid long-width ambiguity',
        'gameplay_verified':False}
    (ROOT/'reports/mutable-global-verification.json').write_text(json.dumps(result,indent=2))
    print(json.dumps(result,indent=2))
