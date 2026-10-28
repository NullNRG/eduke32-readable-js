"""Replace one compiler-generated global without changing other source storage.

The full palette refresh changes curpalette's historical ABI and cannot be
installed without refreshing consumers. Keep it for that work; integrate only
the compatible, recompiled basepaltable binding here.
"""
import hashlib,json,os,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from browser_target_closure import active_exports
from source_first_global_link import storage_import_error
TARGET=ROOT/'factory-output/source-first/oct20-engine-preinit-browser'
FRESH=ROOT/'factory-output/source-first/oct20-palette-storage-probe'
source='source/build/src/palette.cpp';old=TARGET/(source+'.mjs');new=FRESH/(source+'.mjs')
old_manifest=old.with_suffix('.manifest.json');new_manifest=new.with_suffix('.manifest.json')
before=old.read_bytes();before_doc=old_manifest.read_bytes();doc=json.loads(new_manifest.read_text());old_doc=json.loads(before_doc)
old_exports=active_exports(old)
assert active_exports(new)=={'basepaltable'},'Expected exactly the original selected global'
new_rows={r['name']:r for r in doc['definitions'] if r['status']=='source-first'}
for row in old_doc['definitions']:
    if row['name']!='basepaltable':continue
    assert row['status']=='source-first'
    for key in ('object_storage','global_storage','reference_contract'):
        assert row.get(key)==new_rows[row['name']].get(key),(row['name'],key)
for dep in doc['imports']:
    provider=TARGET/(dep['from']+'.mjs');assert dep.get('binding',dep['name']) in active_exports(provider)
    if dep.get('abi') or dep.get('binding'):
        error=storage_import_error(dep,{dep['from']:{'manifest':json.loads(provider.with_suffix('.manifest.json').read_text()),'module':provider}})
        assert not error,error
def relocate(match):
    resolved=(new.parent/match[2]).resolve();assert resolved.is_relative_to(TARGET) and resolved.is_file()
    relative=os.path.relpath(resolved,old.parent).replace('\\','/')
    return 'from '+json.dumps(relative if relative.startswith('.') else './'+relative)
code=re.sub(r'from ([\'"])(\.{1,2}/[^\'"]+)\1',relocate,new.read_text())
digest=hashlib.sha256(code.encode()).hexdigest()
fragment=old.parent/('_source_legacy_palette_global_'+digest[:12]+'.mjs')
assert not fragment.exists(),'Already integrated'
replacement='import { basepaltable } from '+json.dumps('./'+fragment.name)+';\nexport { basepaltable } from '+json.dumps('./'+fragment.name)+';'
rendered,count=re.subn(r'^export let basepaltable = [^\r\n]+;\r?$',lambda _:replacement,before.decode(),flags=re.M)
assert count==1,'Original global definition is not uniquely replaceable'
fragment.write_text(code,encoding='utf-8',newline='\n')
temp=old.with_suffix('.candidate.mjs');temp.write_text(rendered)
try:
    for file in (fragment,temp):subprocess.run(['node','--check',str(file)],check=True,capture_output=True)
    assert active_exports(temp)==old_exports,'Global replacement altered original exports'
except Exception:fragment.unlink();raise
finally:temp.unlink(missing_ok=True)
backup=ROOT/'work/palette-storage-backup';backup.mkdir(exist_ok=True)
(backup/old.name).write_bytes(before);(backup/old_manifest.name).write_bytes(before_doc)
assert old.read_bytes()==before and old_manifest.read_bytes()==before_doc
old.write_text(rendered)
old_doc['definitions']=[new_rows['basepaltable'] if r['name']=='basepaltable' else r for r in old_doc['definitions']]
old_doc.setdefault('module_fragments',[]).append({'module':fragment.relative_to(TARGET).as_posix(),'sha256':digest,
    'original_source':source,'exports':['basepaltable'],'imports':doc['imports'],'source_manifest_sha256':hashlib.sha256(new_manifest.read_bytes()).hexdigest()})
old_manifest.write_text(json.dumps(old_doc,indent=2)+'\n')
report={'source':source,'all_previous_exports_preserved':True,'storage_ABIs_preserved':True,'imports_verified':True,
    'before_sha256':hashlib.sha256(before).hexdigest(),'after_sha256':hashlib.sha256(old.read_bytes()).hexdigest(),
    'fresh_compiler_output_sha256':hashlib.sha256(new.read_bytes()).hexdigest(),
    'recompiled_global':'basepaltable','fragment':fragment.relative_to(TARGET).as_posix(),
    'full_refresh_deferred_for_ABI_changes':['curpalette','curpalettefaded'],
    'original_palette_dependency_recorded':new_rows['basepaltable']['source_references'],'gameplay_verified':False}
(ROOT/'reports/oct20-palette-storage-integration.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
