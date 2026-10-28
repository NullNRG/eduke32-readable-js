import hashlib,json
from pathlib import Path
root=Path('factory-output/source-first/oct15-world-linked')
c=json.loads((root/'link-checkpoint.json').read_text());good=[];bad=[]
for source,proof in c['verified'].items():
 module=root/(source+'.mjs');manifest=module.with_suffix('.manifest.json')
 actual={'module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),'manifest_sha256':hashlib.sha256(manifest.read_bytes()).hexdigest()}
 (good if actual==proof else bad).append(source)
print('Saved link verified:',len(good),'rejected:',bad)
