"""Refresh one changed primary source without replaying unchanged translation units.

Reproduce the verified whole-input fingerprint using the saved primary file,
then compare old/new libclang header declarations and references exactly.
Only a primary-source-only semantic delta can reuse the other selected units.
SQLite changes commit together; all allocator and header ownership contracts
are regenerated from the resulting verified index, never bypassed.
"""
import argparse,hashlib,json,os,sqlite3,sys,time
from pathlib import Path
import source_semantic_index as extractor
import source_standard_heap_contract as heap_contract
import source_header_definitions as header_contract
ROOT=Path(__file__).resolve().parents[1]
def sha(data):return hashlib.sha256(data).hexdigest()
def atomic(path,data):
    stage=path.with_suffix(path.suffix+'.partial');stage.write_bytes((json.dumps(data,indent=2)+'\n').encode());os.replace(stage,path)
def fingerprints(root,commands,source,before,cindex,resources,before_commands=None):
    base=hashlib.sha256(Path(extractor.__file__).read_bytes());extractor.fingerprint_toolchain(base)
    old,new=base.copy(),base.copy()
    old.update((before_commands or commands).read_bytes());new.update(commands.read_bytes())
    library=Path(cindex.conf.lib._name)
    for hasher in (old,new):
        hasher.update(Path(cindex.__file__).read_bytes())
        if library.is_file():hasher.update(library.read_bytes())
        hasher.update(json.dumps(resources,sort_keys=True).encode())
    for path in sorted(root.rglob('*')):
        if path.is_file() and path.suffix.lower() in ('.c','.cpp','.cc','.cxx','.h','.hpp','.inc','.inl'):
            relative=path.relative_to(root).as_posix();data=path.read_bytes()
            old.update(relative.encode());old.update(before if relative==source else data)
            new.update(relative.encode());new.update(data)
    return old.hexdigest(),new.hexdigest()
def verify_command_delta(before,current,source):
    def inventory(rows):
        if not rows or any(not isinstance(row,dict) or not isinstance(row.get('file'),str) or not isinstance(row.get('arguments'),list) for row in rows):
            raise ValueError('Invalid selected command inventory')
        result={row['file']:row for row in rows}
        if len(result)!=len(rows):raise ValueError('Duplicate selected source command')
        return result
    old,new=inventory(before),inventory(current)
    if set(old)!=set(new) or source not in old:raise ValueError('Selected sources changed')
    if any(old[name]!=new[name] for name in old if name!=source):raise ValueError('An unchanged unit command differs')
    def without_defines(arguments):
        kept=[];i=0
        while i<len(arguments):
            value=arguments[i]
            if value=='-D':
                if i+1>=len(arguments):raise ValueError('Dangling macro definition')
                i+=2;continue
            if value.startswith('-D') and len(value)>2:i+=1;continue
            kept.append(value);i+=1
        return kept
    if ({k:v for k,v in old[source].items() if k!='arguments'}!={k:v for k,v in new[source].items() if k!='arguments'}
            or without_defines(old[source]['arguments'])!=without_defines(new[source]['arguments'])):
        raise ValueError('Only primary-unit macro options may change')
    return old[source],new[source]

class ObservationSink:
    def __init__(self):self.declarations={};self.references={}
    def execute(self,sql,parameters=()):
        if sql.startswith('INSERT INTO declarations VALUES'):
            row=json.loads(parameters[-1]);old=self.declarations.get(row['id'])
            if old is None or row['definition']>old['definition']:self.declarations[row['id']]=row
        elif sql.startswith('INSERT OR IGNORE INTO refs VALUES'):
            self.references[parameters[0]]=json.loads(parameters[-1])
    def commit(self):pass
    def headers(self,source):
        return ({k:v for k,v in self.declarations.items() if v['file']!=source},
                {k:v for k,v in self.references.items() if v['file']!=source})
class TransactionSink(ObservationSink):
    def __init__(self,connection):super().__init__();self.connection=connection
    def execute(self,sql,parameters=()):
        super().execute(sql,parameters);return self.connection.execute(sql,parameters)
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('source');parser.add_argument('--before',type=Path,required=True);parser.add_argument('--report',type=Path,required=True);parser.add_argument('--before-commands',type=Path,help='Verified previous database; only macro options in the selected primary unit may differ');args=parser.parse_args()
    import recover_browser_component as component
    from clang import cindex
    with component.component_lock():
        root=component.SOURCE;commands=component.COMMANDS;database=component.BASE/'reports/semantic-index.sqlite'
        current_commands=json.loads(commands.read_text())
        previous_commands=json.loads(args.before_commands.read_text()) if args.before_commands else current_commands
        previous_command,command=verify_command_delta(previous_commands,current_commands,args.source)
        current_path=root/args.source;current=current_path.read_bytes();before=args.before.read_bytes()
        resources=extractor.extraction_resource_config(cindex)
        previous_fingerprint,current_fingerprint=fingerprints(root,commands,args.source,before,cindex,resources,args.before_commands)
        connection=sqlite3.connect(database);connection.execute('PRAGMA cache_size=-65536');connection.execute('PRAGMA temp_store=FILE')
        saved=connection.execute("SELECT value FROM meta WHERE key='fingerprint'").fetchone();assert saved and saved[0]==previous_fingerprint,'Before file does not reproduce the verified whole-program inputs'
        selected={r['file'] for r in json.loads(commands.read_text())};units=list(connection.execute('SELECT * FROM units'))
        assert {r[0] for r in units}==selected and all(r[1]=='parsed' for r in units),'A complete successful source index is required'
        witness_path=commands.with_suffix('.header-definitions.witness.json');witness=json.loads(witness_path.read_text())
        expected_stamp={'semantic_fingerprint':previous_fingerprint,'extractor_sha256':sha(Path(header_contract.__file__).read_bytes()),'commands_sha256':sha((args.before_commands or commands).read_bytes()),'resources':resources}
        assert witness['inputs']==expected_stamp and set(witness['units'])==selected and all(r['status']=='parsed' for r in witness['units'].values()),'Original definition witness does not match the verified inputs'
        history=component.BASE/'reports/semantic-deltas'/current_fingerprint;history.mkdir(parents=True,exist_ok=True)
        for path in (database.with_suffix('.summary.json'),commands.with_suffix('.standard-heap.json'),commands.with_suffix('.header-definitions.json'),witness_path):
            (history/path.name).write_bytes(path.read_bytes())
        index=cindex.Index.create();old=ObservationSink();started=time.monotonic()
        print('Verifying original primary source and native header observations: '+args.source,flush=True)
        try:
            assert current_path.read_bytes()==current
            if before!=current:current_path.write_bytes(before)
            errors,_,_=extractor.extract(index,old,previous_command,root,resources['resource_dir'])
            assert errors==0,'Original primary source no longer parses under the verified extractor'
        finally:
            if before!=current:current_path.write_bytes(current)
        try:
            connection.execute('BEGIN IMMEDIATE')
            connection.execute('CREATE INDEX IF NOT EXISTS observation_decl_id ON observations(id)')
            connection.execute('CREATE INDEX IF NOT EXISTS observation_ref_id ON reference_observations(id)')
            connection.execute('CREATE TEMP TABLE affected_declarations AS SELECT DISTINCT id FROM observations WHERE tu=?',(args.source,))
            connection.execute('CREATE TEMP TABLE affected_references AS SELECT id FROM reference_observations WHERE tu=?',(args.source,))
            connection.execute('DELETE FROM observations WHERE tu=?',(args.source,));connection.execute('DELETE FROM reference_observations WHERE tu=?',(args.source,))
            connection.execute('DELETE FROM refs WHERE id IN (SELECT id FROM affected_references) AND NOT EXISTS(SELECT 1 FROM reference_observations o WHERE o.id=refs.id)')
            connection.execute('DELETE FROM declarations WHERE file=? OR (id IN (SELECT id FROM affected_declarations) AND NOT EXISTS(SELECT 1 FROM observations o WHERE o.id=declarations.id))',(args.source,))
            connection.execute('DELETE FROM units WHERE source=?',(args.source,))
            new=TransactionSink(connection)
            print('Extracting changed primary source, retaining the other selected units',flush=True)
            errors,declarations,references=extractor.extract(index,new,command,root,resources['resource_dir'])
            assert errors==0,'Changed primary source has semantic errors'
            old_headers,new_headers=old.headers(args.source),new.headers(args.source)
            assert old_headers==new_headers,'Header declarations/references changed; this refresh requires a wider dependency analysis'
            assert [r for r in connection.execute('SELECT * FROM units') if r[0]!=args.source]==[r for r in units if r[0]!=args.source],'An unchanged unit checkpoint was modified'
            # A shared header edge may have kept its first observer's TU.
            for identity,record in connection.execute('SELECT id,record FROM refs WHERE tu=? AND id IN(SELECT id FROM affected_references) AND NOT EXISTS(SELECT 1 FROM reference_observations o WHERE o.id=refs.id AND o.tu=?)',(args.source,args.source)).fetchall():
                observer=connection.execute('SELECT min(tu) FROM reference_observations WHERE id=?',(identity,)).fetchone()[0];assert observer
                row=json.loads(record);row['translation_unit']=observer
                connection.execute('UPDATE refs SET tu=?,record=? WHERE id=?',(observer,json.dumps(row),identity))
            expected_after=heap_contract.semantic_fingerprint(root,commands);assert expected_after==current_fingerprint,'Source inputs changed during semantic refresh'
            evidence={'format':'source-primary-semantic-delta/1','source':args.source,'previous_fingerprint':previous_fingerprint,'fingerprint':current_fingerprint,'before_sha256':sha(before),'after_sha256':sha(current),'unchanged_units_reused':len(selected)-1,'primary_source_parse_errors':errors,'before_commands_sha256':sha((args.before_commands or commands).read_bytes()),'commands_sha256':sha(commands.read_bytes()),'unchanged_unit_commands_identical':True,'declaration_observations':declarations,'reference_observations':references,'native_header_declarations_and_references_identical':True,'unchanged_unit_checkpoints_identical':True,'extractor_unchanged':True,'elapsed_seconds':round(time.monotonic()-started,3),'gameplay_verified':False}
            connection.execute("UPDATE meta SET value=? WHERE key='fingerprint'",(current_fingerprint,))
            connection.execute('INSERT OR REPLACE INTO meta VALUES(?,?)',('primary_delta:'+current_fingerprint,json.dumps(evidence)))
            connection.commit()
        except BaseException:connection.rollback();raise
        finally:connection.close()
        # Refresh only the changed unit's actual definition observations.
        candidate_names={r['name'] for r in header_contract.candidates(database)}
        definitions=[{'usr':r['usr'],'name':r['name'],'file':r['file'],'offset':r['offset'],'canonical_type':r['canonical_type']} for r in new.declarations.values() if r['kind']=='FUNCTION_DECL' and r['definition'] and r['linkage']=='EXTERNAL' and r['file'].endswith('.h') and r['mangled_name']==r['name'] and r['name'] in candidate_names]
        witness['inputs']['semantic_fingerprint']=current_fingerprint
        witness['inputs']['commands_sha256']=sha(commands.read_bytes())
        witness['units'][args.source]={'status':'parsed','errors':[],'definitions':sorted(definitions,key=lambda r:(r['name'],r['file'],r['offset'])),'elapsed_seconds':evidence['elapsed_seconds']}
        atomic(witness_path,witness)
        heap_contract.create(root,commands,database)
        header_contract.create(root,commands,database)
        summary=json.loads((history/database.with_suffix('.summary.json').name).read_text())
        check=sqlite3.connect(database);summary.update(fingerprint=current_fingerprint,attempted_units=check.execute('SELECT count(*) FROM units').fetchone()[0],unit_statuses=dict(check.execute('SELECT status,count(*) FROM units GROUP BY status')),incremental_refresh=evidence)
        for field,table in [('declarations','declarations'),('declaration_observations','observations'),('reference_observations','reference_observations'),('unique_reference_edges','refs')]:summary[field]=check.execute('SELECT count(*) FROM '+table).fetchone()[0]
        check.close();atomic(database.with_suffix('.summary.json'),summary);atomic(args.report,evidence)
        print(json.dumps(evidence,indent=2),flush=True)
if __name__=='__main__':main()
