"""Attach real saved Clang USRs to linked blockers; preserve unmatched observations."""
import argparse,collections,csv,gzip,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];linked=ROOT/'factory-output/source-first/oct16-array-members-linked';REPORTS=ROOT/'reports'
def read(p):return json.loads(p.read_text())
def write(name,data):
 p=REPORTS/name;t=p.with_suffix('.partial');t.write_text(json.dumps(data,indent=2,sort_keys=True)+'\n');t.replace(p)
def main():
 global linked
 parser=argparse.ArgumentParser();parser.add_argument('--linked',type=Path,default=linked)
 parser.add_argument('--catalog',type=Path,default=REPORTS/'oct16-blockers/complete-blocker-catalog.json')
 parser.add_argument('--boot-audit',type=Path,default=REPORTS/'oct16-original-boot-audit.json');args=parser.parse_args();linked=args.linked.resolve()
 cat=read(args.catalog);index=collections.defaultdict(list);header_index=collections.defaultdict(list)
 with gzip.open(REPORTS/'semantic-continuation/declarations.jsonl.gz','rt',encoding='utf-8') as stream:
  for line in stream:
   row=json.loads(line);index[(row['file'],row['name'],row['line'])].append(row)
   if row['file'].endswith(('.h','.hpp','.inl','.inc')):header_index[(row['name'],row['line'],''.join(row['type'].split()))].append(row)
 manifests={}
 for p in linked.rglob('*.manifest.json'):
  d=read(p)
  if d.get('source'):manifests[d['source']]=d
 groups={};usr_matched=0
 for blocked in cat['all_blocked_definitions']:
  manifest=manifests.get(blocked['source'],{})
  candidates=[r for r in manifest.get('definitions',[]) if r.get('name')==blocked['name'] and r.get('line')==blocked.get('line') and r.get('original_type')==blocked.get('original_type')]
  definition=candidates[0] if len(candidates)==1 else {}
  physical=definition.get('physical_source',blocked['source']);name=definition.get('source_name',blocked['name'])
  proof=definition.get('header_global_definition') or definition.get('header_definition') or {}
  physical=proof.get('source_header',physical);line=proof.get('source_line',blocked.get('line'))
  matches=index.get((physical,name,line),[])
  if not matches and 'physical_source' not in definition and not proof:
   header_matches=header_index.get((name,line,''.join((blocked.get('original_type') or '').split())),[])
   origins={(r['file'],r.get('usr')) for r in header_matches}
   if len(origins)==1 and header_matches:
    physical=header_matches[0]['file'];matches=header_matches
  if definition.get('linkage')=='internal':
   scoped=[]
   for candidate in matches:
    if not candidate.get('usr'):continue
    identity=hashlib.sha256(json.dumps([candidate['usr'],blocked['source']],separators=(',',':')).encode()).hexdigest()
    if candidate['id']==identity:scoped.append(candidate)
   if scoped:matches=scoped
  usrs=sorted({r['usr'] for r in matches if r.get('usr')})
  usr=usrs[0] if len(usrs)==1 else None
  if usr:usr_matched+=1
  internal=definition.get('linkage')=='internal'
  identity=('usr',usr,blocked['source'] if internal else None) if usr else ('source-location',physical,line,name,blocked.get('original_type'),blocked['source'])
  key=hashlib.sha256(json.dumps(identity,separators=(',',':')).encode()).hexdigest()
  row=groups.setdefault(key,{'id':key,'identity_kind':'saved-clang-usr' if usr else 'explicit-source-location-fallback','clang_usr':usr,'file':physical,'line':line,'definition':name,'original_type':blocked.get('original_type'),'definition_ast_kind':definition.get('kind'),'failure_ast_node':None,'family':blocked['family'],'observations':[],'affected_callers':[]})
  row['observations'].append({**blocked,'translation_unit':blocked['source'],'clang_declaration_candidates':[{'id':r['id'],'usr':r.get('usr'),'kind':r['kind'],'type':r['type']} for r in matches]})
 link_state=read(linked/'global-recovery.json')
 rows=list(groups.values())
 for symbol,providers in link_state.get('ambiguous_export_names',{}).items():
  observations=[];origin=None
  for source in providers:
   definition=next((r for r in manifests.get(source,{}).get('definitions',[]) if r.get('name')==symbol),{})
   proof=definition.get('odr_inline',{});physical=definition.get('physical_source',proof.get('source_header',source))
   original=definition.get('source_name',symbol);line=definition.get('line')
   if origin is None:origin=(physical,original,line,proof.get('type',definition.get('original_type')))
   observations.append({'source':source,'translation_unit':source,'name':symbol,'line':line,
    'reason':'multiple emitted source-type factories lack a verified canonical ODR provider','family':'linkage/ambiguous-external-export',
    'source_references':definition.get('source_references',[]),'original_type':proof.get('type',definition.get('original_type')),
    'odr_proof':proof,'unresolved':[{'name':symbol,'resolution':'ambiguous-provider','providers':[{'source':s,'name':symbol,'status':'source-first-but-globally-ambiguous'} for s in providers]}]})
  physical,original,line,typ=origin
  candidates=[d for entries in index.values() for d in entries if d['file']==physical and d['line']==line and ''.join(d['type'].split())==''.join((typ or '').split()) and d['kind'] in ('STRUCT_DECL','CLASS_DECL')]
  usrs=sorted({d['usr'] for d in candidates if d.get('usr')});usr=usrs[0] if len(usrs)==1 else None
  identity=hashlib.sha256(json.dumps(['global-ambiguity',symbol]).encode()).hexdigest()
  affected=[]
  for source,manifest in manifests.items():
   for declaration in manifest.get('definitions',[]):
    if declaration.get('name')!=symbol and symbol in declaration.get('source_references',[]):
     item={'definition':declaration.get('source_name',declaration['name']),'file':declaration.get('physical_source',source),'line':declaration.get('line'),'translation_unit':source}
     if item not in affected:affected.append(item)
  rows.append({'id':identity,'identity_kind':'ambiguous-original-source-type-factory','clang_usr':usr,'file':physical,'line':line,'definition':original,'original_type':typ,'definition_ast_kind':'CXXRecordDecl','failure_ast_node':None,'family':'linkage/ambiguous-external-export','observations':observations,'affected_callers':affected})
 by_symbol=collections.defaultdict(list)
 for row in rows:
  for observation in row['observations']:by_symbol[observation['name']].append(row)
 for caller in rows:
  for observation in caller['observations']:
   for reference in observation['unresolved']:
    for provider in by_symbol.get(reference['name'],[]):
     item={'id':caller['id'],'definition':caller['definition'],'file':caller['file'],'line':caller['line']}
     if item not in provider['affected_callers']:provider['affected_callers'].append(item)
 summary={'format':'declaration-deduplicated-source-blockers/1','scope':'156-unit mixed-revision incremental linked inventory, not uniform current compilation','observations':len(cat['all_blocked_definitions']),'deduplicated_blockers':len(rows),'deduplicated_blocked_definitions':len(groups),'ambiguous_source_type_factories':len(link_state.get('ambiguous_export_names',{})),'observations_with_saved_clang_usr':usr_matched,'fresh_usr_extraction':False,'global_link_ambiguities':link_state.get('ambiguous_export_names',{}),'invalid_global_imports_or_syntax':link_state.get('invalid_imports_or_syntax',[]),'all_selected_units_current_revision':False,'gameplay_verified':False,'limitations':['Unknown offending child AST nodes stay null; definition AST kinds retained','Unmatched or ambiguous USRs retain explicit source-location identity','Existing Clang semantic epoch does not prove new JS semantics or complete indirect-call dataflow'],'blockers':rows}
 write('all-blockers.json',summary)
 with (REPORTS/'all-blockers.csv').open('w',newline='',encoding='utf-8') as stream:
  fields=['id','identity_kind','clang_usr','file','line','definition','original_type','definition_ast_kind','family','affected_callers','observations'];w=csv.DictWriter(stream,fieldnames=fields);w.writeheader()
  for row in rows:w.writerow({k:json.dumps(row[k],separators=(',',':')) if isinstance(row[k],(dict,list)) else row[k] for k in fields})
 families=collections.defaultdict(list)
 for row in rows:families[row['family']].append(row)
 write('root-causes.json',{'measurement':'Shared failure families and direct caller impact; recoverability is not predicted','scope':summary['scope'],'groups':sorted([{'family':fam,'blocked_declarations':len(items),'direct_affected_callers':len({c.get('id') or json.dumps(c,sort_keys=True) for r in items for c in r['affected_callers']}),'definitions':[r['id'] for r in items]} for fam,items in families.items()],key=lambda x:(-x['direct_affected_callers'],-x['blocked_declarations'])),'high_fanout_missing_providers':cat['high_fanout_missing_providers'],'ambiguous_export_names':link_state.get('ambiguous_export_names',{}),'invalid_imports_or_syntax':link_state.get('invalid_imports_or_syntax',[])})
 write('dependency-graph.json',{'scope':summary['scope'],'nodes':[{'id':r['id'],'definition':r['definition'],'file':r['file']} for r in rows],'dependencies':[{'source':r['id'],'unresolved':o['unresolved']} for r in rows for o in r['observations']],'cyclic_components':cat['cyclic_components'],'complete_indirect_call_dataflow':False})
 write('boot-blockers.json',read(args.boot_audit))
 print(json.dumps({k:v for k,v in summary.items() if k!='blockers'},indent=2))
if __name__=='__main__':main()
