"""Attach original source functions to their existing provider-owned state.

No source global is duplicated. Every import and supplementary storage ABI is
verified before the existing source module re-exports the compiled fragment.
"""
import argparse,hashlib,json,os,re,subprocess
from pathlib import Path
from browser_target_closure import active_exports
from source_first_global_link import storage_import_error
ROOT=Path(__file__).resolve().parents[1]
def main():
    p=argparse.ArgumentParser();p.add_argument('--manifest',type=Path,required=True)
    p.add_argument('--target',type=Path,default=ROOT/'factory-output/source-first/browser-target')
    p.add_argument('--exports',nargs='+',required=True)
    p.add_argument('--replace-fragment-sha256',help='Explicit expected SHA-256 of an existing exclusive source fragment')
    p.add_argument('--report',type=Path,default=ROOT/'reports/oct15-verbosity-fragment-integration.json')
    a=p.parse_args()
    target=a.target.resolve();manifest=json.loads(a.manifest.read_text());source=manifest['source']
    if Path(manifest.get('module_fragment',{}).get('import_root','')).resolve()!=target:
        raise ValueError('Fragment lacks this exact verified provider root')
    original=target/(source+'.mjs');owner_manifest=original.with_suffix('.manifest.json')
    if not original.resolve().is_relative_to(target):raise ValueError('Original source owner escapes target')
    before=original.read_bytes();before_manifest=owner_manifest.read_bytes();owner=json.loads(before_manifest)
    if owner.get('native_pointer_abi')!=manifest.get('native_pointer_abi'):
        raise ValueError('Fragment native-pointer ABI differs from original owner; recompile the owner and consumers')
    code_path=Path(manifest['output']).resolve();code=code_path.read_text()
    names=active_exports(code_path);active=active_exports(original)
    # Audit EVERY emitted definition, not only the requested re-exports.
    # An unexported duplicate global still captures separate state in the
    # fragment's original functions and cannot pass an ownership proof.
    owned_storage={row['name']:row for row in owner.get('definitions',[])
        if row.get('status')=='source-first' and row.get('kind')=='VarDecl'}
    for row in manifest.get('definitions',[]):
        if row.get('status')=='source-first' and row.get('kind')=='VarDecl' and row['name'] in owned_storage:
            raise ValueError('Fragment duplicates existing original storage: '+row['name'])
    replacing=None;old_export=None
    if a.replace_fragment_sha256:
        if not re.fullmatch(r'[a-f0-9]{64}',a.replace_fragment_sha256):raise ValueError('Invalid expected fragment hash')
        matches=[row for row in owner.get('module_fragments',[]) if row.get('sha256')==a.replace_fragment_sha256
                 and set(row.get('exports',[]))==set(a.exports) and row.get('original_source')==source]
        if len(matches)!=1:raise ValueError('No unique exact original fragment to replace')
        replacing=matches[0];old_path=(target/replacing['module']).resolve()
        if old_path.parent!=original.parent or hashlib.sha256(old_path.read_bytes()).hexdigest()!=a.replace_fragment_sha256:
            raise ValueError('Existing fragment path/content no longer matches expected original provider')
        previous_names=replacing.get('reexports',replacing['exports'])
        pattern=r'export\s*\{\s*'+r'\s*,\s*'.join(re.escape(name) for name in previous_names)+r'\s*\}\s*from\s*["\']\./'+re.escape(old_path.name)+r'["\'];'
        occurrences=list(re.finditer(pattern,before.decode()))
        if len(occurrences)!=1:raise ValueError('Existing source fragment has no unique owner re-export')
        old_export=occurrences[0].group(0)
    selected=[]
    for name in a.exports:
        rows=[r for r in manifest['definitions'] if r['name']==name and r['status']=='source-first']
        if len(rows)!=1 or name not in names:raise ValueError('No original compiled export '+name)
        if name in active and not replacing:raise ValueError('Original export already exists; no silent replacement '+name)
        if replacing and name not in active:raise ValueError('Expected original fragment is not active '+name)
        selected.append(rows[0])
    # Newly recovered globals must expose their exact address-cell bindings
    # through the owning facade too. Exporting just their values strands later
    # source fragments or encourages a second copy of the same C++ storage.
    storage_bindings=[]
    for row in selected:
        for key in ('global_storage','private_storage'):
            binding=row.get(key,{}).get('binding')
            if not binding:continue
            if binding not in names:raise ValueError('Missing original storage binding '+binding)
            if binding in active and not replacing:raise ValueError('Storage binding already owned '+binding)
            if binding not in storage_bindings:storage_bindings.append(binding)
    reexports=list(dict.fromkeys([*a.exports,*storage_bindings]))
    for dep in manifest['imports']:
        provider=target/(dep['from']+'.mjs');binding=dep.get('binding',dep['name'])
        if not provider.resolve().is_relative_to(target) or binding not in active_exports(provider):
            raise ValueError('Missing fragment provider '+binding)
        if dep.get('native_pointer_abi') or dep.get('binding') or dep.get('abi') in ('source-pointer-array/1','source-byte-record-array/1','source-native-array/1'):
            doc=json.loads(provider.with_suffix('.manifest.json').read_text())
            error=storage_import_error(dep,{dep['from']:{'manifest':doc,'module':provider}})
            if error:raise ValueError('Fragment storage ABI rejected: '+error)
    def relocate(match):
        resolved=(code_path.parent/match[2]).resolve()
        if not resolved.is_relative_to(target) or not resolved.is_file():raise ValueError('Unverified fragment import path')
        relative=os.path.relpath(resolved,original.parent).replace('\\','/')
        return 'from '+json.dumps(relative if relative.startswith('.') else './'+relative)
    code=re.sub(r'from ([\'"])(\.{1,2}/[^\'"]+)\1',relocate,code)
    digest=hashlib.sha256(code.encode()).hexdigest()
    fragment=original.parent/('_source_legacy_'+original.stem.replace('.','_')+'_'+digest[:12]+'.mjs')
    if fragment.exists():raise ValueError('Fragment path already exists')
    declaration='export { '+', '.join(reexports)+' } from '+json.dumps('./'+fragment.name)+';'
    rendered=(before.decode().replace(old_export,declaration,1) if replacing else
        before.decode()+'\n// Original Clang-generated fragment; imports existing owner storage.\n'+declaration+'\n')
    backup=ROOT/'work/fragment-integration-backup'/hashlib.sha256(before).hexdigest()[:16]
    backup.mkdir(parents=True,exist_ok=True)
    (backup/original.name).write_bytes(before);(backup/owner_manifest.name).write_bytes(before_manifest)
    # The recorded SHA-256 is over these exact UTF-8 bytes on every host.
    # Windows text newline conversion previously invalidated fragment proofs.
    fragment.write_text(code,encoding='utf-8',newline='\n')
    temporary=original.with_suffix('.candidate.mjs');temporary.write_bytes(rendered.encode('utf-8'))
    try:
        for file in (fragment,temporary):subprocess.run(['node','--check',str(file)],check=True,capture_output=True,text=True)
        if original.read_bytes()!=before or owner_manifest.read_bytes()!=before_manifest:raise RuntimeError('Owner changed during integration')
        for row in selected:
            owner['definitions']=[d for d in owner['definitions'] if d['name']!=row['name']]+[row]
        for key in ('storage_exports','private_storage_exports'):
            recovered=[row for row in manifest.get(key,[]) if row.get('name') in a.exports]
            for row in recovered:
                previous=[item for item in owner.get(key,[]) if item.get('name')==row['name']]
                if previous and previous!=[row]:raise ValueError('Conflicting original storage metadata '+row['name'])
                owner[key]=[item for item in owner.get(key,[]) if item.get('name')!=row['name']]+[row]
        owner['found']=len(owner['definitions']);owner['emitted']=sum(d['status']=='source-first' for d in owner['definitions'])
        owner['blocked']=sum(d['status']=='blocked' for d in owner['definitions'])
        if replacing:
            owner.setdefault('superseded_module_fragments',[]).append(replacing)
            owner['module_fragments'].remove(replacing)
        owner.setdefault('module_fragments',[]).append({'module':fragment.relative_to(target).as_posix(),
            'sha256':digest,'original_source':source,'exports':a.exports,'reexports':reexports,'imports':manifest['imports'],
            'native_pointer_abi':manifest.get('native_pointer_abi'),
            'source_manifest_sha256':hashlib.sha256(a.manifest.read_bytes()).hexdigest()})
        original.write_bytes(rendered.encode('utf-8'));owner_manifest.write_text(json.dumps(owner,indent=2)+'\n')
    except Exception:
        original.write_bytes(before);owner_manifest.write_bytes(before_manifest);fragment.unlink(missing_ok=True);raise
    finally:temporary.unlink(missing_ok=True)
    report={'format':'verified-original-source-fragment-integration/1','source':source,
        'fragment':str(fragment.relative_to(ROOT)),'fragment_sha256':digest,'exports':a.exports,
        'duplicated_source_globals':False,'storage_imports_verified':True,'gameplay_verified':False,
        'replaced_fragment_sha256':a.replace_fragment_sha256,
        'owner_before_sha256':hashlib.sha256(before).hexdigest(),
        'owner_after_sha256':hashlib.sha256(original.read_bytes()).hexdigest(),
        'original_owner_only_reexport_changed':bool(replacing)}
    a.report.parent.mkdir(parents=True,exist_ok=True)
    a.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':main()
