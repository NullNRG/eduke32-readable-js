"""Expose existing private address factories after exact fresh-source comparison.

No global, initializer or original function is replaced or reexecuted. This is
an ABI export upgrade for saved source modules, not a recovered definition.
"""
import argparse,hashlib,json,re,subprocess
from pathlib import Path
from source_ast_to_js import PRIVATE_STORAGE_ABI,private_storage_binding,private_address_binding
from source_private_record_schema import private_record_schema_compatible

def normalized(text):
    # Some historical modules were saved with doubled Windows newlines.
    # Keep nonempty lines byte-for-byte; never strip spaces from string data.
    return '\n'.join(line for line in text.splitlines() if line.strip())

def expose(manifest_path,target,names,report_path):
    manifest_path=Path(manifest_path);target=Path(target).resolve()
    fresh=json.loads(manifest_path.read_text());source=fresh['source']
    module=(target/(source+'.mjs')).resolve();mf=module.with_suffix('.manifest.json')
    if not module.is_relative_to(target):raise ValueError('Source owner escapes target')
    before=module.read_bytes();before_mf=mf.read_bytes();owner=json.loads(before_mf)
    candidate=Path(fresh['output'])
    if not candidate.is_absolute():candidate=Path.cwd()/candidate
    generated=normalized(candidate.read_text());existing=normalized(before.decode('utf-8'))
    if owner.get('source')!=source or fresh.get('imports'):raise ValueError('Not an independent original owner declaration')
    additions=[];proofs=[]
    for name in names:
        if not re.fullmatch(r'[A-Za-z_$][\w$]*',name):raise ValueError('Invalid source binding')
        rows=[r for r in fresh['definitions'] if r['name']==name and r['status']=='source-first']
        old_rows=[r for r in owner['definitions'] if r['name']==name and r['status']=='source-first']
        if len(rows)!=1 or len(old_rows)!=1:raise ValueError('Original definition is not unique')
        row=rows[0];old=old_rows[0];contract=row.get('private_storage',{})
        binding=private_storage_binding(source,name)
        address=private_address_binding(source,name)
        if (row.get('kind')!='VarDecl' or row.get('linkage')!='internal' or old.get('linkage')!='internal'
                or old.get('original_type')!=row.get('original_type') or contract.get('abi')!=PRIVATE_STORAGE_ABI
                or contract.get('binding')!=binding or contract.get('owner_source')!=source):
            raise ValueError('Private original storage contract unproven')
        if old.get('private_storage'):raise ValueError('Storage already exposed')
        # The compiler emits this declaration and its lazy factory together.
        pattern=r'export (?:let|const) '+re.escape(name)+r' = [^\n]+;\nfunction '+re.escape(address)+r'\(\) \{\n.*?\n\}'
        matches=re.findall(pattern,generated,re.S)
        if len(matches)!=1:raise ValueError('Fresh declaration/factory shape unproven')
        original=matches[0]
        if existing.count(original)!=1:raise ValueError('Fresh original initializer/address factory differs: '+name)
        if contract.get('byte_record'):
            if not private_record_schema_compatible(contract['byte_record']):
                raise ValueError('Unsupported private record storage schema: '+name)
            helpers=normalized((Path(__file__).parent/'source_aggregate_runtime.mjs').read_text())
            # Scalar/pointer records and nested numeric unions execute the same
            # recursive constructor. Arrays, bitfields and overlapping pointer
            # alternatives are rejected by the shared eligibility gate above.
            # Verify the exact constructor, byte store and pointer registry.
            blocks=(helpers[:helpers.index('const cPointerArray =')].strip(),
                    helpers[helpers.index('const cByteArrayMember ='):helpers.index('const cByteRecordArrayStorage =')].strip(),
                    helpers[helpers.index('const cZeroAggregate ='):].strip())
            if any(block not in existing or block not in generated for block in blocks):
                raise ValueError('Original record storage runtime differs: '+name)
        # Verify the scalar narrowing helper too, when the factory uses one.
        for helper in ('i32','u32','i64','u64','f32'):
            if re.search(r'\b'+helper+r'\(',matches[0]):
                helpers=re.findall(r'^const '+helper+r' = [^\n]+;',generated,re.M)
                if len(helpers)!=1 or existing.count(helpers[0])!=1:raise ValueError('Scalar storage helper differs: '+helper)
        if re.search(r'export\s+(?:function\s+'+re.escape(binding)+r'\b|\{[^}]*\b'+re.escape(binding)+r'\b)',existing):
            raise ValueError('Storage already exported')
        old['private_storage']=contract
        owner.setdefault('private_storage_exports',[]).append({'name':name,**contract})
        wrapper='export function '+binding+'() { return '+address+'(); }'
        if generated.count(wrapper)!=1:raise ValueError('Fresh address forwarder differs')
        additions.append(wrapper);proofs.append({'name':name,'binding':binding,
            'declaration_and_factory_sha256':hashlib.sha256(original.encode()).hexdigest()})
    rendered=before+b'\n// Verified same-original-unit fragment storage exports.\n'+('\n'.join(additions)+'\n').encode()
    temp=module.with_suffix('.candidate.mjs');temp.write_bytes(rendered)
    try:subprocess.run(['node','--check',str(temp)],check=True,capture_output=True)
    finally:temp.unlink(missing_ok=True)
    backup=target.parent/'private-storage-backup'/hashlib.sha256(before).hexdigest()[:16]
    backup.mkdir(parents=True,exist_ok=True)
    (backup/module.name).write_bytes(before);(backup/mf.name).write_bytes(before_mf)
    if module.read_bytes()!=before or mf.read_bytes()!=before_mf:raise RuntimeError('Original owner changed during upgrade')
    report={'format':'verified-private-storage-export/1','source':source,'proofs':proofs,
        'original_bytes_retained':len(before),'original_definitions_recovered':0,'global_initializers_changed':False,
        'fresh_manifest_sha256':hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
        'before_module_sha256':hashlib.sha256(before).hexdigest(),'after_module_sha256':hashlib.sha256(rendered).hexdigest(),
        'gameplay_verified':False}
    owner.setdefault('private_storage_upgrades',[]).append(report)
    try:
        module.write_bytes(rendered);mf.write_text(json.dumps(owner,indent=2)+'\n')
    except Exception:
        module.write_bytes(before);mf.write_bytes(before_mf);raise
    report_path=Path(report_path);report_path.parent.mkdir(parents=True,exist_ok=True)
    report_path.write_text(json.dumps(report,indent=2)+'\n')
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--manifest',type=Path,required=True)
    parser.add_argument('--target',type=Path,required=True);parser.add_argument('--names',nargs='+',required=True)
    parser.add_argument('--report',type=Path,required=True);a=parser.parse_args()
    print(json.dumps(expose(a.manifest,a.target,a.names,a.report),indent=2))
