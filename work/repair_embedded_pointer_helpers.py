"""Apply the compiler's transitive pointer-helper fix to saved source modules.

Only prepend the canonical compiler helper bundle when its complete set of
top-level bindings is absent. Existing generated source bytes remain intact.
No original function is added, removed, replaced, or counted as recovered.
"""
import hashlib,json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from browser_target_closure import active_exports
TARGET=ROOT/'factory-output/source-first/oct20-engine-preinit-browser'
helper=ROOT/'tools/source_pointer_runtime.mjs';payload=helper.read_bytes()
sha=lambda value:hashlib.sha256(value).hexdigest()
audit=json.loads((ROOT/'reports/oct21-browser-free-identifiers.json').read_text())
paths=sorted({r['file'] for r in audit['rows'] if r['message'] in ("'cPointerElementRef' is not defined.","'cPointer' is not defined.")})
bindings=set(re.findall(rb'^(?:const|let|var|function|class)\s+(\w+)',payload,re.M))
report={'format':'original-module-helper-closure-repair/1','helper_sha256':sha(payload),
    'compiler_frontend_sha256':sha((ROOT/'tools/source_ast_to_js.py').read_bytes()),
    'original_definitions_recovered':0,'gameplay_verified':False,'modules':[]}
for relative in paths:
    path=(TARGET/relative).resolve();assert path.is_relative_to(TARGET)
    before=path.read_bytes();mf=path.with_suffix('.manifest.json');before_manifest=mf.read_bytes()
    assert before.startswith(b'// Source-first C/C++ -> JavaScript')
    present=set(re.findall(rb'^(?:export\s+)?(?:const|let|var|function|class)\s+(\w+)',before,re.M))
    assert not bindings&present,('Partial helper bundle requires source recompile',relative)
    # Verify the unresolved name is the actual known compiler helper call.
    assert (b'return cPointerElementRef(source,0).value;' in before or b'const pointer=cPointer(bytes||source);' in before),relative
    prefix=payload+b'\n// Original emitted module follows unchanged.\n'
    rendered=prefix+before
    candidate=path.with_suffix('.helper-candidate.mjs');candidate.write_bytes(rendered)
    try:
        subprocess.run(['node','--check',str(candidate)],check=True,capture_output=True)
        assert active_exports(candidate)==active_exports(path)
        assert candidate.read_bytes()[len(prefix):]==before
    finally:candidate.unlink(missing_ok=True)
    backup=ROOT/'work/helper-closure-backup'/sha(before)[:16];backup.mkdir(parents=True,exist_ok=True)
    (backup/path.name).write_bytes(before);(backup/mf.name).write_bytes(before_manifest)
    doc=json.loads(before_manifest)
    proof={'before_module_sha256':sha(before),'after_module_sha256':sha(rendered),'prefix_bytes':len(prefix),
        'helper':'tools/source_pointer_runtime.mjs','helper_sha256':sha(payload),'original_module_bytes_preserved':True}
    doc.setdefault('runtime_helper_repairs',[]).append(proof)
    assert path.read_bytes()==before and mf.read_bytes()==before_manifest
    path.write_bytes(rendered);mf.write_text(json.dumps(doc,indent=2)+'\n',encoding='utf-8')
    report['modules'].append({'module':relative,**proof})
(ROOT/'reports/oct21-embedded-helper-repair.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'modules_repaired':len(report['modules']),'original_definitions_recovered':0,'gameplay_verified':False},indent=2))
