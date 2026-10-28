"""Export the existing Clang declaration identities without the 2.6 GB database."""
import collections,gzip,hashlib,json,sqlite3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];db=ROOT/'reports/semantic-index.sqlite';source=ROOT/'factory-output/source-tree/eduke32-master';out=ROOT/'reports/semantic-continuation';out.mkdir(exist_ok=True)
c=sqlite3.connect(db.resolve().as_uri()+'?mode=ro',uri=True)
meta=dict(c.execute('select key,value from meta'));statuses=dict(c.execute('select status,count(*) from units group by status'))
allowed={'FUNCTION_DECL','CXX_METHOD','CONSTRUCTOR','DESTRUCTOR','CONVERSION_FUNCTION','STRUCT_DECL','CLASS_DECL','UNION_DECL','CLASS_TEMPLATE','CLASS_TEMPLATE_PARTIAL_SPECIALIZATION','TYPEDEF_DECL','TYPE_ALIAS_DECL','ENUM_DECL','ENUM_CONSTANT_DECL','FIELD_DECL','VAR_DECL'}
counts=collections.Counter();files={};total=0
stage=out/'declarations.jsonl.gz.partial';final=out/'declarations.jsonl.gz'
with gzip.open(stage,'wt',encoding='utf-8',compresslevel=6) as stream:
 for file,text in c.execute('select file,record from declarations order by file,name,line'):
  d=json.loads(text)
  if d['kind'] not in allowed or (d['kind']=='VAR_DECL' and d['linkage'] not in ('INTERNAL','EXTERNAL')):continue
  path=(source/file).resolve() if file else None
  if not path or not path.is_relative_to(source) or not path.is_file():continue
  if file not in files:files[file]=hashlib.sha256(path.read_bytes()).hexdigest()
  stream.write(json.dumps(d,separators=(',',':'))+'\n');counts[d['kind']]+=1;total+=1
stage.replace(final);c.close()
(out/'source-hashes.json').write_text(json.dumps(files,sort_keys=True,indent=2)+'\n')
summary={'format':'compact-source-clang-declaration-handoff/1','source_database_fingerprint':meta.get('fingerprint'),'database_unit_statuses':statuses,'source_files':len(files),'declaration_records':total,'kinds':dict(counts),
 'compressed_bytes':final.stat().st_size,'declarations_sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'exported_from_existing_database':True,
 'fresh_semantic_extraction_performed':False,'semantic_extraction_complete':False,'gameplay_verified':False,
 'limitations':['Independent libclang semantic epoch; does not attest current JS emission','No complete callback/indirect-call dataflow or global reads/writes','Translation-unit observations and reference-edge tables remain rebuildable in the omitted large database','Each preserved record retains actual Clang USR/identity, physical source, type and available ABI layout evidence']}
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2))
