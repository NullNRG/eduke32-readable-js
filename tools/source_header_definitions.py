"""Prove selected-unit ownership of external C implementations in headers."""
import argparse,gc,hashlib,json,os,sqlite3,time
from pathlib import Path
from source_standard_heap_contract import validate as validate_program,source_digest
FORMAT='source-header-definition-owners/1'

def candidates(database):
 c=sqlite3.connect(Path(database).resolve().as_uri()+'?mode=ro',uri=True)
 try:return [json.loads(encoded) for (encoded,) in c.execute("SELECT record FROM declarations WHERE definition=1 AND linkage='EXTERNAL' AND file LIKE '%.h' AND json_extract(record,'$.kind')='FUNCTION_DECL' AND json_extract(record,'$.mangled_name')=name")]
 finally:c.close()

def witness(root,commands,program,rows,path):
 # The historical index merges declarations and definitions by USR. Its
 # observations do not retain is_definition; observing a prototype cannot
 # prove implementation ownership. Revisit declaration cursors (not emission)
 # and persist the exact body-bearing observations in a compact checkpoint.
 from clang import cindex
 import source_semantic_index as extractor
 resources=extractor.extraction_resource_config(cindex)
 stamp={'semantic_fingerprint':program['semantic_fingerprint'],
        'extractor_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'commands_sha256':hashlib.sha256(Path(commands).read_bytes()).hexdigest(),
        'resources':resources}
 saved=json.loads(path.read_text()) if path.is_file() else {}
 units=saved.get('units',{}) if saved.get('inputs')==stamp else {}
 names={row['name'] for row in rows};index=cindex.Index.create()
 for command in json.loads(Path(commands).read_text()):
  source=command['file']
  if units.get(source,{}).get('status')=='parsed':continue
  started=time.monotonic();previous=Path.cwd()
  try:
   os.chdir(root)
   unit=index.parse(source,args=extractor.captured_args(command)+['-resource-dir',resources['resource_dir']])
  finally:os.chdir(previous)
  errors=[str(d) for d in unit.diagnostics if d.severity>=3]
  definitions=[];stack=[unit.cursor]
  if not errors:
   while stack:
    cursor=stack.pop();kind=cursor.kind.name
    physical=extractor.relative_file(cursor.location.file,root)
    if kind!='TRANSLATION_UNIT' and physical is None:continue
    if kind=='FUNCTION_DECL':
     if cursor.spelling in names and cursor.linkage.name=='EXTERNAL' and cursor.is_definition() and cursor.mangled_name==cursor.spelling:
      definitions.append({'usr':cursor.get_usr(),'name':cursor.spelling,'file':physical,
                          'offset':cursor.location.offset,'canonical_type':cursor.type.get_canonical().spelling})
     continue
    if kind in ('TRANSLATION_UNIT','NAMESPACE','LINKAGE_SPEC'):
     stack.extend(cursor.get_children())
  units[source]={'status':'failed' if errors else 'parsed','errors':errors,'definitions':sorted(definitions,key=lambda r:(r['name'],r['file'],r['offset'])),
                 'elapsed_seconds':round(time.monotonic()-started,3)}
  data={'format':'source-header-definition-witness/1','inputs':stamp,'units':units}
  temporary=path.with_suffix('.partial');temporary.write_text(json.dumps(data,indent=2)+'\n');os.replace(temporary,path)
  print(source+': '+units[source]['status']+' '+str(len(definitions))+' header-library body observations',flush=True)
  cursor=None
  del stack,unit;gc.collect()
 return units

def index_facts(database,commands,fingerprint,witness_units):
 selected={row['file'] for row in json.loads(Path(commands).read_text())}
 c=sqlite3.connect(Path(database).resolve().as_uri()+'?mode=ro',uri=True)
 try:
  saved=c.execute("SELECT value FROM meta WHERE key='fingerprint'").fetchone()
  if not saved or saved[0]!=fingerprint:raise ValueError('Header definition semantic fingerprint mismatch')
  units=dict(c.execute('SELECT source,status FROM units'))
  if set(units)!=selected or set(units.values())!={'parsed'}:raise ValueError('Header ownership needs all selected units parsed')
  if set(witness_units)!=selected or any(row['status']!='parsed' for row in witness_units.values()):
   raise ValueError('Header ownership needs complete definition observations')
  records={row['id']:row for row in candidates(database)}
  groups={}
  for identity,row in records.items():groups.setdefault(row['mangled_name'],[]).append(row)
  accepted=[];rejected=[]
  for name,rows in sorted(groups.items()):
   observed=[(source,row) for source,unit in witness_units.items() for row in unit['definitions'] if row['name']==name]
   owners={source for source,_ in observed}
   origins={(row['file'],row['offset'],row['canonical_type']) for _,row in observed}
   indexed={(row['file'],row['offset'],row['canonical_type']) for row in rows}
   if len(owners)!=1 or len(origins)!=1 or origins!=indexed:
    rejected.append({'name':name,'owners':sorted(owners),'reason':'ambiguous implementation ownership or physical definition'});continue
   row=rows[0]
   accepted.append({key:row.get(key) for key in ('id','usr','name','file','line','offset','type','canonical_type','mangled_name','definition_extent')}|{'owner':next(iter(owners))})
  return {'selected_units':sorted(selected),'definitions':accepted,'rejected':rejected}
 finally:c.close()

def create(root,commands,database,out=None):
 root,commands,database=map(lambda p:Path(p).resolve(),(root,commands,database))
 program=validate_program(root,commands)
 if not program:raise ValueError('Header ownership requires the verified whole-program semantic contract')
 out=Path(out or commands.with_suffix('.header-definitions.json')).resolve()
 witness_path=out.with_name(out.stem+'.witness.json')
 units=witness(root,commands,program,candidates(database),witness_path)
 facts=index_facts(database,commands,program['semantic_fingerprint'],units)
 data={'format':FORMAT,'source_inventory':source_digest(root),'commands_sha256':hashlib.sha256(commands.read_bytes()).hexdigest(),
       'semantic_fingerprint':program['semantic_fingerprint'],'semantic_database':os.path.relpath(database,out.parent),
       'definition_witness':witness_path.name,'definition_witness_sha256':hashlib.sha256(witness_path.read_bytes()).hexdigest(),
       'extractor_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'evidence':facts,'gameplay_verified':False}
 out.parent.mkdir(parents=True,exist_ok=True);temporary=out.with_suffix('.partial')
 temporary.write_text(json.dumps(data,indent=2)+'\n');os.replace(temporary,out);return data

def load(root,commands,program):
 path=Path(commands).with_suffix('.header-definitions.json')
 if not path.is_file():return {},None
 data=json.loads(path.read_text())
 if (not program or data.get('format')!=FORMAT or data.get('semantic_fingerprint')!=program['semantic_fingerprint']
     or data.get('commands_sha256')!=hashlib.sha256(Path(commands).read_bytes()).hexdigest()
     or data.get('source_inventory')!=source_digest(root)):
  raise ValueError('Header definition source/configuration contract changed')
 witness_path=path.parent/data['definition_witness'];body=json.loads(witness_path.read_text())
 if (data.get('extractor_sha256')!=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
     or data.get('definition_witness_sha256')!=hashlib.sha256(witness_path.read_bytes()).hexdigest()
     or body.get('inputs',{}).get('semantic_fingerprint')!=program['semantic_fingerprint']):
  raise ValueError('Header definition witness changed')
 actual=index_facts(path.parent/data['semantic_database'],commands,program['semantic_fingerprint'],body['units'])
 if actual!=data['evidence']:raise ValueError('Header implementation ownership evidence changed')
 return {row['mangled_name']:row for row in actual['definitions']},{'contract_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'semantic_fingerprint':program['semantic_fingerprint']}

def match(node,source,root,owners):
 proof=owners.get(node.get('mangledName'))
 if not proof or proof['owner']!=source or node.get('name')!=proof['name']:return None
 loc=node.get('loc',{})
 if loc.get('offset')!=proof['offset'] or node.get('type',{}).get('qualType')!=proof['type']:return None
 header=Path(root)/proof['file']
 if not header.is_file() or header.read_bytes()[proof['offset']:proof['offset']+len(proof['name'])]!=proof['name'].encode():return None
 if loc.get('file'):
  physical=Path(loc['file']);physical=physical if physical.is_absolute() else Path(root)/physical
  if physical.resolve()!=header.resolve():return None
 return proof

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',type=Path,required=True);p.add_argument('--commands',type=Path,required=True);p.add_argument('--database',type=Path,required=True);p.add_argument('--out',type=Path)
 a=p.parse_args();d=create(a.root,a.commands,a.database,a.out)
 print(json.dumps({'definitions':len(d['evidence']['definitions']),'rejected_groups':len(d['evidence']['rejected']),'gameplay_verified':False},indent=2))
