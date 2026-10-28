"""Explicit fragment refresh preserves existing storage and rejects stale proof."""
import hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,success=True):
    r=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=90)
    assert (r.returncode==0)==success,(args,r.stdout[-1000:],r.stderr[-1800:])
    return r.stdout
with tempfile.TemporaryDirectory(prefix='fragment-refresh-',dir=ROOT/'work') as directory:
    p=Path(directory);target=p/'target'
    source='static int stored=9;extern "C" int entry(int x){stored+=x;return stored;}\n'
    (p/'unit.cpp').write_text(source)
    compiler=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(p),'--source','unit.cpp']
    run([*compiler,'--filter','stored','--out-dir',str(target)])
    (p/'symbols.json').write_text(json.dumps({'stored':'unit.cpp'}))
    def compile_epoch(name):
        epoch=p/name
        run([*compiler,'--filter','entry','--out-dir',str(epoch),'--project-symbols',str(p/'symbols.json'),'--import-root',str(target)])
        return epoch/'unit.cpp.manifest.json'
    install=[sys.executable,str(ROOT/'tools/install_verified_fragment.py'),'--target',str(target),'--exports','entry']
    first=compile_epoch('first');report=p/'first.json'
    run([*install,'--manifest',str(first),'--report',str(report)])
    original=(target/'unit.cpp.mjs').read_text();proof=json.loads(report.read_text());old_sha=proof['fragment_sha256']
    (p/'unit.cpp').write_text(source.replace('stored+=x','stored+=x*2'))
    second=compile_epoch('second')
    run([*install,'--manifest',str(second),'--replace-fragment-sha256','0'*64,'--report',str(p/'invalid.json')],False)
    assert (target/'unit.cpp.mjs').read_text()==original
    replacement=p/'replacement.json'
    run([*install,'--manifest',str(second),'--replace-fragment-sha256',old_sha,'--report',str(replacement)])
    result=json.loads(replacement.read_text());assert result['original_owner_only_reexport_changed']
    old_name=Path(proof['fragment']).name;new_name=Path(result['fragment']).name
    assert (target/'unit.cpp.mjs').read_text()==original.replace(old_name,new_name)
    assert hashlib.sha256((target/old_name).read_bytes()).hexdigest()==old_sha
    owner=json.loads((target/'unit.cpp.manifest.json').read_text())
    assert len(owner['module_fragments'])==1 and owner['superseded_module_fragments'][0]['sha256']==old_sha
    run([*install,'--manifest',str(first),'--replace-fragment-sha256',old_sha,'--report',str(p/'stale.json')],False)
    js='import {entry} from '+json.dumps((target/'unit.cpp.mjs').as_uri())+';console.log(JSON.stringify([entry(3),entry(5)]));'
    (p/'check.mjs').write_text(js)
    assert json.loads(run(['node',str(p/'check.mjs')]))==[15,25]
    print('PASS: explicit fragment replacement preserves original storage; stale owner/hash proofs rejected')
