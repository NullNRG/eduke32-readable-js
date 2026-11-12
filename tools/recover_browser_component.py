"""Recover an original unit into the canonical browser graph without duplicating state."""
import argparse,hashlib,json,os,re,subprocess,sys
from pathlib import Path
from source_runtime_helpers import runtime_fingerprints
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
os.environ['EDUKE32_AST_CAPTURE_GZIP']='1'
from browser_target_closure import active_exports,build
from source_ast_stream import _cache_lock
PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
BASE=ROOT/PROFILE['build_root'];OUT=ROOT/PROFILE['boot_module_root']
SOURCE=ROOT/PROFILE['prepared_source_root']
COMMANDS=ROOT/PROFILE['derived_commands']
CACHE=ROOT/'work/ast/f3f73c89e7558265637b0512990774fe2bdcc6ec733701b88b4869ed0334ea68/shard-00'
def component_lock():return _cache_lock(BASE/'component-build-lock')
def stateless_function_owner(module,manifest):
 if manifest.get('module_fragments') or manifest.get('storage_exports') or manifest.get('private_storage_exports'):
  raise ValueError('Owner has composed fragments or original storage; preserve it through verified fragment recovery')
 if any(row.get('kind')!='FunctionDecl' for row in manifest.get('definitions',[]) if row.get('status')=='source-first'):
  raise ValueError('Whole-owner replacement requires function-only source definitions')
 if re.search(r'(?m)^let\s+__static_|^export\s+(?:let|var)\b',module.read_text()):
  raise ValueError('Whole-owner replacement would reset original static storage')
def checkpoint():
 from source_fragment_storage import audit as storage_ownership_audit
 from source_first_global_link import storage_import_error,exported_names
 from browser_target_closure import emitted_owners
 artifacts={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(OUT.rglob('*')) if p.is_file() and (p.suffix=='.mjs' or p.name.endswith('.manifest.json'))}
 units={}
 for p in OUT.rglob('*.manifest.json'):
  d=json.loads(p.read_text());source=d.get('source')
  if source:units[source]={'manifest':d,'module':OUT/(source+'.mjs')}
 # All providers remain immutable during this component-lock-held audit.
 # Read each actual ESM export graph once; retain every storage ABI check.
 verified_export_cache={}
 def verified_exports(path):
  path=path.resolve()
  if path not in verified_export_cache:verified_export_cache[path]=exported_names(path)
  return verified_export_cache[path]
 errors=[];provider_cache={};export_cache={}
 for source,unit in units.items():
  for dep in [*unit['manifest'].get('imports',[]),*[dep for fragment in unit['manifest'].get('module_fragments',[]) for dep in fragment.get('imports',[])]]:
   provider=OUT/(dep['from']+'.mjs');binding=dep.get('binding',dep['name'])
   if provider not in export_cache:export_cache[provider]=active_exports(provider) if provider.is_file() else set()
   if binding not in export_cache[provider]:errors.append({'source':source,'import':dep,'reason':'missing actual export'});continue
   if provider not in provider_cache:provider_cache[provider]=json.loads(provider.with_suffix('.manifest.json').read_text())
   document=provider_cache[provider]
   error=storage_import_error(dep,{dep['from']:{'manifest':document,'module':provider}},export_reader=verified_exports)
   if error:errors.append({'source':source,'import':dep,'reason':error})
 unique,ambiguous,blocked=emitted_owners(OUT)
 proof=ROOT/PROFILE.get('engine_execution_report','reports/oct30-original-browser-component.json')
 execution=json.loads(proof.read_text()) if proof.is_file() else {}
 actual_modules={p:d for p,d in artifacts.items() if p.endswith('.mjs')}
 runtime_artifacts=runtime_fingerprints(ROOT)
 matches=execution.get('artifacts')==actual_modules and execution.get('runtime_artifacts')==runtime_artifacts
 contract=json.loads(COMMANDS.with_suffix('.standard-heap.json').read_text())
 storage_conflicts=storage_ownership_audit(OUT)
 report={'format':'canonical-browser-component-checkpoint/1','profile':PROFILE['name'],'module_root':OUT.relative_to(ROOT).as_posix(),
  'source_inventory':contract['source_inventory'],'commands_sha256':hashlib.sha256(COMMANDS.read_bytes()).hexdigest(),
  'compiler_frontend_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
  'runtime_and_lowering_helpers':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for pattern in ['runtime/*.mjs','tools/source_*.mjs','tools/source_*.py'] for p in sorted(ROOT.glob(pattern))},
  'source_units_with_partial_modules':len(units),'selected_source_units':len(json.loads(COMMANDS.read_text())),
  'whole_selected_program_compiled_under_current_revision':False,'invalid_imports':errors,'ambiguous_export_groups':ambiguous,
  'storage_ownership_conflicts':storage_conflicts,
  'original_storage_ownership_verified':not storage_conflicts,
  'entry_exports':{name:name in unique for name in ('enginePreInit','engineInit','app_main')},'artifacts':artifacts,'runtime_artifacts':runtime_artifacts,
  'execution_report':proof.relative_to(ROOT).as_posix(),'execution_evidence_matches_modules':matches,
  'original_engine_startup_verified':bool(matches and execution.get('original_engine_startup_verified')),
  'original_engine_video_verified':bool(matches and execution.get('component_passed') and execution.get('engine_initialization',{}).get('original_videoSetGameMode_executed')),
  'gameplay_verified':False,'standalone_player_verified':False}
 target=BASE/'component-manifest.json';tmp=target.with_suffix('.partial');tmp.write_text(json.dumps(report,indent=2)+'\n');os.replace(tmp,target)
 print(json.dumps({k:report[k] for k in ('source_units_with_partial_modules','entry_exports','execution_evidence_matches_modules','original_engine_startup_verified','gameplay_verified')},indent=2))
 return report

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',nargs='?');p.add_argument('names',nargs='?');p.add_argument('--full',action='store_true');p.add_argument('--snapshot',action='store_true');p.add_argument('--refresh-fragment-sha256');p.add_argument('--replace-stateless-owner-sha256');p.add_argument('--whole-unit-refresh',action='store_true',help='Read the whole original unit while replacing only one hash-pinned fragment interface');a=p.parse_args()
 if a.whole_unit_refresh and (not a.refresh_fragment_sha256 or a.full or a.replace_stateless_owner_sha256):
  p.error('--whole-unit-refresh requires exactly --refresh-fragment-sha256')
 if a.snapshot:checkpoint();return
 if not a.source or not a.names:p.error('source and exact declaration names are required')
 assert a.source in {row['file'] for row in json.loads(COMMANDS.read_text())},a.source
 requested=a.names.split(',');assert all(re.fullmatch(r'[A-Za-z_$][\w$]*',name) for name in requested)
 module=OUT/(a.source+'.mjs');existing=active_exports(module) if module.is_file() else set()
 previous_manifest=None
 if a.replace_stateless_owner_sha256:
  if a.refresh_fragment_sha256 or a.full:raise ValueError('Choose one explicit owner/fragment replacement mechanism')
  if hashlib.sha256(module.read_bytes()).hexdigest()!=a.replace_stateless_owner_sha256:raise ValueError('Original owner hash changed')
  previous_manifest=module.with_suffix('.manifest.json').read_bytes();owner=json.loads(previous_manifest)
  stateless_function_owner(module,owner)
  requested=sorted(set(requested)|{row.get('source_name',row['name']) for row in owner['definitions'] if row.get('status')=='source-first'})
 if a.refresh_fragment_sha256:
  owner=json.loads(module.with_suffix('.manifest.json').read_text())
  matches=[row for row in owner.get('module_fragments',[]) if row['sha256']==a.refresh_fragment_sha256 and set(row['exports'])==set(requested)]
  if len(matches)!=1:raise ValueError('Refresh must select every export of one exact original source fragment')
 pending=[name for name in requested if name not in existing or a.refresh_fragment_sha256 or a.replace_stateless_owner_sha256]
 if not pending:print('Already linked original exports: '+a.names,flush=True);return
 build(OUT,OUT,BASE/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
 index=OUT/'browser-combined-symbol-owners.json'
 if a.refresh_fragment_sha256 or a.replace_stateless_owner_sha256:
  selected=json.loads(index.read_text());index=BASE/'reports/refresh-symbol-owners.json'
  if a.refresh_fragment_sha256:
   # Preserve the original unit's own exact header factory even when the
   # global inventory correctly leaves several other header owners ambiguous.
   for row in owner.get('definitions',[]):
    if (row.get('status')=='source-first' and row.get('kind')=='CXXRecordDecl'
        and row.get('header_record_factory') and row['name'] in existing
        and row['name'] not in selected
        and row.get('odr_inline',{}).get('prototype_factory_abi')=='source-header-record-factory/1'):
     selected[row['name']]=a.source
  index.write_text(json.dumps({name:owner for name,owner in selected.items() if name not in pending and not (a.replace_stateless_owner_sha256 and name in existing)},indent=2)+'\n')
 epoch=hashlib.sha256(index.read_bytes()+','.join(pending).encode()).hexdigest()[:12]
 stage=BASE/'boot-probes'/a.source.replace('/','_')/epoch
 if a.full and existing:raise ValueError('Existing state requires filtered fragment extension, not replacement')
 stage.mkdir(parents=True,exist_ok=True)
 cmd=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(SOURCE),'--source',a.source,
      '--compile-commands',str(COMMANDS),'--out-dir',str(stage),'--project-symbols',str(index),
      '--import-root',str(OUT),'--dependency-closure','--header-dependency-closure','--header-inlines',
      '--enum-closure','--require-record-layouts','--ast-cache-dir',str(CACHE)]
 if not a.full and not a.whole_unit_refresh:cmd+=['--filter',','.join(pending),'--exact-filter']
 log=BASE/'reports'/('boot-'+a.source.replace('/','_')+'.log')
 print('Compile original '+a.source+' ['+','.join(pending)+']',flush=True)
 with log.open('w') as stream:
  result=subprocess.run(cmd,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,timeout=900)
 if result.returncode:raise RuntimeError('Compiler failed; see '+str(log))
 manifest=stage/(a.source+'.manifest.json');document=json.loads(manifest.read_text())
 if a.refresh_fragment_sha256 and a.whole_unit_refresh:
  # Explicit full-header selection can spell an unchanged header function
  # differently from dependency selection. Retain only source/input-proven
  # aliases to the exact rebuilt callable; never wrap or invent a body.
  from source_owner_aliases import retain_header_aliases
  candidate=stage/(a.source+'.mjs')
  missing=set(requested)-active_exports(candidate)
  document,code=retain_header_aliases(owner,document,missing,candidate.read_text())
  candidate.write_text(code,encoding='utf-8',newline='\n')
  manifest.write_text(json.dumps(document,indent=2)+'\n')
 if (not existing or a.replace_stateless_owner_sha256) and document['emitted']:
  candidate=stage/(a.source+'.mjs')
  def relocate(match):
   target=(candidate.parent/match[2]).resolve()
   if not target.is_relative_to(OUT) or not target.is_file():raise ValueError('Missing original import '+str(target))
   relative=os.path.relpath(target,module.parent).replace('\\','/')
   return 'from '+json.dumps(relative if relative.startswith('.') else './'+relative)
  code=re.sub(r'from ([\'"])(\.{1,2}/[^\'"]+)\1',relocate,candidate.read_text())
  if a.replace_stateless_owner_sha256:
   from source_first_global_link import storage_import_error
   stateless_function_owner(candidate,document)
   if not existing|set(pending)<=active_exports(candidate):raise ValueError('Replacement did not recover every original function and requested dependency')
   for dep in document.get('imports',[]):
    provider=OUT/(dep['from']+'.mjs')
    if not provider.is_file() or dep.get('binding',dep['name']) not in active_exports(provider):raise ValueError('Replacement import is not backed by source/provider')
    error=storage_import_error(dep,{dep['from']:{'manifest':json.loads(provider.with_suffix('.manifest.json').read_text()),'module':provider}})
    if error:raise ValueError(error)
   if hashlib.sha256(module.read_bytes()).hexdigest()!=a.replace_stateless_owner_sha256 or module.with_suffix('.manifest.json').read_bytes()!=previous_manifest:
    raise ValueError('Owner changed during source recompilation')
   history=BASE/'owner-history'/a.replace_stateless_owner_sha256;history.mkdir(parents=True,exist_ok=True)
   (history/'original.mjs').write_bytes(module.read_bytes());(history/'original.manifest.json').write_bytes(previous_manifest)
   document['replaced_stateless_owner_sha256']=a.replace_stateless_owner_sha256
  module.parent.mkdir(parents=True,exist_ok=True)
  temporary=module.with_suffix('.replacement.tmp');temporary.write_text(code,encoding='utf-8',newline='\n');os.replace(temporary,module)
  document['output']=str(module);module.with_suffix('.manifest.json').write_text(json.dumps(document,indent=2)+'\n')
  subprocess.run(['node','--check',str(module)],check=True,capture_output=True,text=True)
 if existing and not a.replace_stateless_owner_sha256 and document['emitted']:
  emitted=active_exports(stage/(a.source+'.mjs'))
  new=sorted({row['name'] for row in document['definitions'] if row['status']=='source-first'
              and (row['name'] not in existing or a.refresh_fragment_sha256 and row['name'] in requested) and row['name'] in emitted})
  # Refresh only the exact prior interface. Dependency/header recovery may
  # emit additional helpers; the installer still audits all emitted code and
  # storage, but must not turn those helpers into new owner re-exports.
  if a.refresh_fragment_sha256:new=[name for name in new if name in requested]
  if new:
   install=[sys.executable,str(ROOT/'tools/install_verified_fragment.py'),'--manifest',str(manifest),
     '--target',str(OUT),'--exports',*new,'--report',str(BASE/'reports'/('fragment-'+epoch+'.json'))]
   if a.refresh_fragment_sha256:
    if set(new)!=set(requested):raise ValueError('Refresh did not recover every original fragment export; owner unchanged')
    install+=['--replace-fragment-sha256',a.refresh_fragment_sha256]
   subprocess.run(install,cwd=ROOT,check=True)
  print('Installed source exports:',new,flush=True)
 resolved=active_exports(module) if module.is_file() else set()
 report={'source':a.source,'requested':requested,'requested_resolved':{name:name in resolved for name in requested},
   'requested_still_unlinked':[name for name in requested if name not in resolved],'manifest':str(manifest.relative_to(ROOT)),
   'blocked':[{'name':row['name'],'reason':row.get('reason'),'dependencies':row.get('unresolved_references',[])}
      for row in document['definitions'] if row['status']=='blocked'],
   'original_gameplay_verified':False}
 (BASE/'reports'/('frontier-'+a.source.replace('/','_')+'.json')).write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report,indent=2),flush=True)
 build(OUT,OUT,BASE/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
 checkpoint()
if __name__=='__main__':
 with component_lock():main()
