"""Upgrade verified zero-initialized byte-field record arrays in their source owner.

The fresh canonical compiler must prove the layout. Only one-dimensional,
zero-initialized unsigned-byte records are accepted here. Existing functions,
source global names and address factories remain in the original owner. A
fresh generated storage shard performs the one original initialization.
"""
import hashlib,json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from browser_target_closure import active_exports

def upgrade(manifest_path,target,report_path):
    fresh=json.loads(Path(manifest_path).read_text());target=Path(target).resolve();source=fresh['source']
    assert fresh['toolchain']['abi_verified'] and fresh['record_layout_extraction']['explicitly_required']
    assert not fresh['imports'] and fresh['blocked']==0
    owner=(target/(source+'.mjs')).resolve();assert owner.is_relative_to(target)
    mf=owner.with_suffix('.manifest.json');before=owner.read_bytes();before_mf=mf.read_bytes();old=json.loads(before_mf)
    candidate=Path(fresh['output']);generated=candidate.read_text();original=before.decode();replacements=[];proofs=[]
    sourcefile=ROOT/'factory-output/source-tree/eduke32-master'/source
    lines=sourcefile.read_text().splitlines()
    for row in fresh['definitions']:
        name=row['name'];assert re.fullmatch(r'[A-Za-z_]\w*',name)
        previous=[r for r in old['definitions'] if r['name']==name]
        assert len(previous)==1 and row['status']==previous[0]['status']=='source-first'
        assert row['kind']==previous[0]['kind']=='VarDecl' and row['linkage']==previous[0]['linkage']=='external'
        assert row['original_type']==previous[0]['original_type'] and row['line']==previous[0]['line']
        assert not previous[0].get('object_storage'),'Already upgraded'
        typ=re.fullmatch(r'(?:struct )?([A-Za-z_]\w*)(?:\[(\d+)\])?',row['original_type']);assert typ
        array=typ[2] is not None;count=int(typ[2]) if array else 1;assert 0<count<=1048576
        if array:
            assert re.fullmatch(r'\s*'+typ[1]+r'\s+'+name+r'\s*\[\s*'+str(count)+r'\s*\]\s*;\s*(?://.*)?',lines[row['line']-1]),'Original zero storage declaration differs'
            emitted=re.search(r'^export let '+name+r' = cByteRecordNDArray\((\{[^\n]+\}), \['+str(count)+r'\], \{\}, \[\]\);$',generated,re.M)
        else:
            assert re.fullmatch(r'\s*'+typ[1]+r'\s+'+name+r'\s*=\s*\{\s*0(?:\s*,\s*0)*\s*\}\s*;\s*(?://.*)?',lines[row['line']-1]),'Original record is not an all-zero initializer'
            emitted=re.search(r'^export let '+name+r' = cInitByteRecord\((\{[^\n]+\}), (\{[^\n]+\}), null, \{\}\);$',generated,re.M)
        assert emitted
        schema=json.loads(emitted[1]);assert not schema['union'] and not schema['overlaps'] and schema['align']==schema['arrayAlign']==1
        fields=schema['fields'];assert fields and all(set(v)=={'offset','size','native'} and v['size']==1 and v['native']=='Uint8Array' for v in fields.values())
        assert sorted(v['offset'] for v in fields.values())==list(range(schema['size']))
        if array:
            metadata=row['object_storage'];assert metadata['abi']=='source-byte-record-array/1' and metadata['dimensions']==[count] and metadata['stride']==schema['size']
            assert hashlib.sha256(json.dumps(schema,sort_keys=True).encode()).hexdigest()==metadata['schema_sha256']
            pattern=r'export let '+name+r' = Array\.from\(\{length:'+str(count)+r'\}, \(\) => cZeroAggregate\((\{[^\n]+\})\)\);'
        else:
            metadata=row['global_storage'];assert metadata['abi']=='source-global-cell/2'
            assert previous[0]['global_storage']['binding']==metadata['binding']
            assert hashlib.sha256(json.dumps(schema,sort_keys=True).encode()).hexdigest()==metadata['byte_record_schema_sha256']
            initializer=json.loads(emitted[2].replace('((0) & 255)','0'))
            assert initializer=={key:0 for key in fields}
            pattern=r'export let '+name+r' = cMarkAggregate\(\(('+re.escape(emitted[2])+r')\)\);'
        matches=list(re.finditer(pattern,original));assert len(matches)==1
        if array:assert json.loads(matches[0][1])=={'record':{key:{'scalar':'char'} for key in fields}},'Previous initializer is not the same all-zero byte-field record'
        alias='__cxx_source_storage_'+hashlib.sha256((source+'\0'+name).encode()).hexdigest()[:20]
        assert alias not in original
        replacements.append((matches[0][0],'export let '+name+' = '+alias+';',name,alias))
        proofs.append({'name':name,'original_type':row['original_type'],'source_line':row['line'],'schema':schema,'old_initializer_sha256':hashlib.sha256(matches[0][0].encode()).hexdigest()})
    assert set(active_exports(candidate))=={r['name'] for r in fresh['definitions']}|{r['binding'] for r in fresh.get('storage_exports',[])}
    digest=hashlib.sha256(generated.encode()).hexdigest();shard=owner.parent/('_source_storage_'+digest[:16]+'.mjs')
    assert not shard.exists()
    rendered=original
    for oldinit,newinit,name,alias in replacements:rendered=rendered.replace(oldinit,newinit,1)
    rendered='import { '+', '.join(name+' as '+alias for _,_,name,alias in replacements)+' } from '+json.dumps('./'+shard.name)+';\n'+rendered
    backup=ROOT/'work/storage-upgrade-backup'/hashlib.sha256(before).hexdigest()[:16];backup.mkdir(parents=True,exist_ok=True)
    (backup/owner.name).write_bytes(before);(backup/mf.name).write_bytes(before_mf)
    shard.write_bytes(generated.encode());staged=owner.with_suffix('.storage-candidate.mjs');staged.write_bytes(rendered.encode())
    try:
        subprocess.run(['node','--check',str(shard)],check=True,capture_output=True)
        subprocess.run(['node','--check',str(staged)],check=True,capture_output=True)
        assert owner.read_bytes()==before and mf.read_bytes()==before_mf
        byname={r['name']:r for r in fresh['definitions']}
        # Preserve existing address-cell metadata; only the array representation
        # and its verified storage contract change.
        for row in old['definitions']:
            if row['name'] in byname:
                current=byname[row['name']]
                if 'object_storage' in current:row['object_storage']=current['object_storage']
                if 'global_storage' in current:
                    row['global_storage']=current['global_storage']
                    old['storage_exports']=[r for r in old.get('storage_exports',[]) if r['name']!=row['name']]+[{'name':row['name'],**current['global_storage']}]
        report={'format':'verified-zero-byte-record-array-upgrade/1','source':source,
            'source_sha256':hashlib.sha256(sourcefile.read_bytes()).hexdigest(),'proofs':proofs,
            'storage_shard':shard.relative_to(target).as_posix(),'storage_shard_sha256':digest,
            'before_owner_sha256':hashlib.sha256(before).hexdigest(),'after_owner_sha256':hashlib.sha256(rendered.encode()).hexdigest(),
            'fresh_manifest_sha256':hashlib.sha256(Path(manifest_path).read_bytes()).hexdigest(),
            'source_globals_duplicated':False,'source_initializers_executed_once':True,'gameplay_verified':False}
        old.setdefault('storage_upgrades',[]).append(report)
        owner.write_bytes(rendered.encode());mf.write_text(json.dumps(old,indent=2)+'\n')
    except Exception:
        owner.write_bytes(before);mf.write_bytes(before_mf);shard.unlink(missing_ok=True);raise
    finally:staged.unlink(missing_ok=True)
    Path(report_path).write_text(json.dumps(report,indent=2)+'\n');return report
if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--manifest',type=Path,required=True);p.add_argument('--report',type=Path,required=True);a=p.parse_args()
    print(json.dumps(upgrade(a.manifest,ROOT/'factory-output/source-first/oct20-engine-preinit-browser',a.report),indent=2))
