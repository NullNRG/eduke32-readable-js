#!/usr/bin/env python3
"""Build Clang-source AST modules with deterministic, verified cross-unit ES linking.

No LLVM/opcode fallback, no implicit runtime stubs, no partial-success claims.
This builder compiles the exact user-selected source units; it is not a game
boot target until their dependencies and platform implementation are complete.
"""
import argparse, json, subprocess, sys, tempfile, atexit, shutil, hashlib
from collections import defaultdict
from pathlib import Path
from source_first_global_link import internal_definition, storage_import_error, canonical_header_inline_owner

ROOT=Path(__file__).resolve().parents[1]
FRONT=ROOT/'tools/source_ast_to_js.py'

def run_emit(root,out,unit,index=None,cache=None):
 args=[sys.executable,str(FRONT),'--root',str(root),'--source',unit['source'],
       '--out-dir',str(out)]
 if unit.get('filter'):args+=['--filter',unit['filter']]
 if unit.get('header_inlines'):args+=['--header-inlines']
 if unit.get('header_dependency_closure'):args+=['--header-dependency-closure']
 if unit.get('dependency_closure'):args+=['--dependency-closure']
 if index:args+=['--project-symbols',str(index)]
 if cache:args+=['--ast-cache-dir',str(cache)]
 p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=180)
 if p.returncode:raise RuntimeError(f'AST compile {unit["source"]}: {p.stderr[-2500:]} {p.stdout[-800:]}')
 return json.loads(p.stdout)

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--plan',type=Path,required=True)
 ap.add_argument('--out-dir',type=Path,required=True)
 ap.add_argument('--strict',action='store_true',help='reject unresolved or unsupported definitions')
 ap.add_argument('--ast-cache-dir',type=Path,help='attested persistent AST cache epoch, independent of JS emitter edits')
 ap.add_argument('--ast-cache-shards',type=int,default=8,help='lock-isolation shards; cache policy applies per shard')
 args=ap.parse_args()
 plan=json.loads(args.plan.read_text());src_root=Path(plan['root']).resolve()
 out=args.out_dir.resolve();out.mkdir(parents=True,exist_ok=True)
 units=plan['units'];files=[x['source'] for x in units]
 if args.ast_cache_shards < 1 or args.ast_cache_shards > 64:
  ap.error('ast-cache-shards must be between 1 and 64')
 if args.ast_cache_dir:
  ast_cache=args.ast_cache_dir.resolve()
  # Lock and LRU budget are per shard; independent Clang workers should not
  # block each other while their AST streams are being decoded.
  def cache_for(source):
   digest=hashlib.sha256(source.encode('utf-8')).digest()
   return ast_cache/('shard-%02d' % (int.from_bytes(digest[:4],'big')%args.ast_cache_shards))
 else:
  ast_cache=Path(tempfile.mkdtemp(prefix='eduke_ast_build_'))
  atexit.register(lambda:shutil.rmtree(ast_cache,ignore_errors=True))
  def cache_for(source):return ast_cache
 if len(set(files))!=len(files):raise SystemExit('duplicate source translation unit in plan')
 for u in units:
  if (not (src_root/u['source']).is_file() or Path(u['source']).is_absolute() or '..' in Path(u['source']).parts):
   raise SystemExit('bad source path '+u['source'])
 # Initial pass: recover available AST-declared code without assuming imports.
 probes={u['source']:run_emit(src_root,out,u,cache=cache_for(u['source'])) for u in units}
 declarations=defaultdict(set)
 probe_units={}
 for u in units:
  manifest=json.loads((out/(u['source']+'.mjs')).with_suffix('.manifest.json').read_text())
  probe_units[u['source']]={'manifest':manifest,'module':out/(u['source']+'.mjs')}
  for item in manifest['definitions']:
   if (not internal_definition(None,item,src_root,u['source']) and
       (item['status']=='source-first' or item.get('reason','').startswith('unlinked identifiers:'))):
    # These two categories already passed AST syntax/semantic lowering.
    declarations[item['name']].add(u['source'])
 canonical_header_odr_owners={}
 for name,owners in list(declarations.items()):
  if len(owners)<2:continue
  owner=canonical_header_inline_owner(probe_units,name,owners)
  if owner:
   declarations[name]={owner};canonical_header_odr_owners[name]=owner
 ambiguities={name:sorted(owners) for name,owners in declarations.items() if len(owners)>1}
 if ambiguities:
  (out/'ambiguous-symbols.json').write_text(json.dumps(ambiguities,indent=2))
  raise SystemExit(f'{len(ambiguities)} ambiguous global JavaScript symbols; see ambiguous-symbols.json')
 index={name:next(iter(owners)) for name,owners in declarations.items()}
 # Each compiler invocation gets only the other units' known names. Neither
 # a self-import nor a guessed external linker declaration can slip in.
 def has_recoverable_external_frontier(manifest, owners):
  # Canonical header ownership changes an already emitted probe too: its
  # local factory/inline definition must become the other TU's import. Keep
  # unrelated providers fast, but never retain a duplicate proven ODR owner.
  for definition in manifest.get('definitions',[]):
   name=definition.get('name')
   if (definition.get('status')=='source-first' and name in owners and
       canonical_header_odr_owners.get(name)==owners[name]):return True
   if definition.get('status')!='blocked' or not definition.get('reason','').startswith('unlinked identifiers:'):
    continue
   refs=definition.get('unresolved_references')
   if not isinstance(refs,list):
    # Legacy / incomplete evidence: do not risk missing a required re-lower.
    return True
   if any(name in owners for name in refs):return True
  return False
 results=[];reused_probes=[];reused_unaffected=[];relowered=[]
 for u in units:
  module_index={k:v for k,v in index.items() if v!=u['source']}
  if not module_index or not has_recoverable_external_frontier(probe_units[u['source']]['manifest'],module_index):
   if module_index:reused_unaffected.append(u['source'])
   # The initial pass already lowered this exact source without external
   # providers. An empty owner file would give the identical semantic input.
   # Keep its real artifacts and still run every final verification below.
   results.append(probes[u['source']]);reused_probes.append(u['source']);continue
  owner_file=out/('.symbols-'+str(len(results))+'.json')
  owner_file.write_text(json.dumps(module_index,sort_keys=True))
  try:
   results.append(run_emit(src_root,out,u,owner_file,cache=cache_for(u['source'])));relowered.append(u['source'])
  finally:owner_file.unlink(missing_ok=True)
 reports={}
 for u in units:
  mf=(out/(u['source']+'.mjs')).with_suffix('.manifest.json')
  reports[u['source']]=json.loads(mf.read_text())
 # Verify *all* imported definitions are truly emitted in their owner module.
 emitted={src:{i['name'] for i in doc['definitions'] if i['status']=='source-first'} for src,doc in reports.items()}
 linked_units={src:{'manifest':doc,'module':out/(src+'.mjs')} for src,doc in reports.items()}
 invalid=[]
 for src,doc in reports.items():
  for dep in doc.get('imports',[]):
   if (dep['name'] not in emitted.get(dep['from'],set()) or
       dep['name'] not in index or index[dep['name']]!=dep['from']):
    invalid.append({'source':src,'name':dep['name'],'expected_owner':dep['from']})
   storage_error=storage_import_error(dep,linked_units)
   if storage_error:invalid.append({'source':src,'name':dep['name'],'reason':storage_error})
  for definition in doc.get('definitions',[]):
   owner=canonical_header_odr_owners.get(definition.get('name'))
   if definition.get('status')=='source-first' and owner is not None and owner!=src:
    invalid.append({'source':src,'name':definition['name'],'expected_owner':owner,
                    'reason':'emitted header definition differs from proven canonical owner'})
  if doc['output']:
   p=subprocess.run(['node','--check',str(out/(src+'.mjs'))],capture_output=True,text=True)
   if p.returncode:invalid.append({'source':src,'invalid_javascript':p.stderr[-1000:]})
 summary={'format':'source-first-project/1','source_root':str(src_root),
   'canonical_header_odr_owners':canonical_header_odr_owners,
   'selected_units':len(units),'attempted_units':len(reports),
   'compiler_passes':len(probes)+len(relowered),
   'reused_empty_external_index_probes':reused_probes,
   'reused_unaffected_external_index_probes':reused_unaffected,
   'relowered_with_external_index':relowered,
   'source_definitions_emitted':sum(j['emitted'] for j in reports.values()),
   'source_definitions_blocked':sum(j['blocked'] for j in reports.values()),
   'linked_imports':sum(len(j.get('imports',[])) for j in reports.values()),
   'structured_goto_definitions_recognized':sum(j.get('control_flow',{}).get('recognized_goto_functions',0) for j in reports.values()),
   'structured_goto_edges_recognized':sum(j.get('control_flow',{}).get('recognized_goto_edges',0) for j in reports.values()),
   'invalid_imports':invalid,
   'units':[{'source':s,'emitted':j['emitted'],'blocked':j['blocked'],'imports':j.get('imports',[]),'blocked_reasons':[{'name':z['name'],'reason':z.get('reason')} for z in j['definitions'] if z['status']=='blocked']} for s,j in reports.items()],
   'generated_from':'Clang source AST', 'llvm_fallback':False,
   'playable_game':False}
 (out/'project-build.json').write_text(json.dumps(summary,indent=2))
 print(json.dumps({k:v for k,v in summary.items() if k!='units'},indent=2))
 if invalid:return 2
 if args.strict and summary['source_definitions_blocked']:return 2
 return 0

if __name__=='__main__':sys.exit(main())
