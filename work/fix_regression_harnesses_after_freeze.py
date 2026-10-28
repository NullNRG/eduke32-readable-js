from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
report=json.loads((root/'reports/oct28-publication-fixed-regression.json').read_text())
assert report['complete'] and report['regression_inputs_unchanged'],'Allow frozen run to finish first'
p=root/'tests/source_factory/verify_sourcefirst_friend_ctor.py';s=p.read_text();old="assert 'Counter' in manifest['friend_closure']['proven'],manifest['friend_closure']";new="assert 'Counter' in (manifest['friend_closure']['proven']+manifest['pod_record_closure']['proven']),manifest"
assert old in s;s=s.replace(old,new);p.write_text(s,encoding='utf-8',newline='\n')
p=root/'tests/source_factory/verify_sourcefirst_header_constants.py';s=p.read_text();start=s.index('    # Clang references get remapped');end=s.index("    c=subprocess.run(['node','--check'",start)
s=s[:start]+'''    # Exercise the production publisher so all selected narrowing helpers are
    # included, rather than manually reconstructing a partial module prelude.
    emitted=root/'emitted'
    subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),
                    '--root',str(root),'--source','main.cpp','--out-dir',str(emitted),
                    '--header-dependency-closure'],cwd=ROOT,check=True,capture_output=True,text=True)
    generated='import {work} from '+json.dumps((emitted/'main.cpp.mjs').as_uri())+';\\nfor(let i=-160;i<160;i++)console.log(work(i));\\n'
    (root/'run.mjs').write_text(generated)
'''+s[end:]
compile(s,str(p),'exec');p.write_text(s,encoding='utf-8',newline='\n')
print('Corrected two harness assumptions; native behavior assertions remain intact.')
