"""Installing a real source fragment records the bytes actually written."""
import hashlib,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory(prefix='fragment-proof-',dir=ROOT/'work') as temp:
    root=Path(temp);target=root/'target';target.mkdir();stage=root/'stage';stage.mkdir()
    (target/'unit.cpp.mjs').write_text('export let state=7;\n')
    (target/'unit.cpp.manifest.json').write_text(json.dumps({'source':'unit.cpp','definitions':[{'name':'state','status':'source-first'}]}))
    module=stage/'unit.cpp.mjs';module.write_text('export function original() {\n  return 37;\n}\n')
    manifest=stage/'unit.cpp.manifest.json';manifest.write_text(json.dumps({'source':'unit.cpp','output':str(module),
        'module_fragment':{'import_root':str(target)},'definitions':[{'name':'original','status':'source-first'}],'imports':[]}))
    report=root/'proof.json'
    p=subprocess.run([sys.executable,str(ROOT/'tools/install_verified_fragment.py'),'--manifest',str(manifest),
        '--target',str(target),'--exports','original','--report',str(report)],cwd=ROOT,capture_output=True,text=True)
    assert p.returncode==0,(p.stdout,p.stderr)
    proof=json.loads(report.read_text());fragment=ROOT/proof['fragment']
    assert hashlib.sha256(fragment.read_bytes()).hexdigest()==proof['fragment_sha256']
    owner=json.loads((target/'unit.cpp.manifest.json').read_text())
    assert owner['module_fragments'][0]['sha256']==proof['fragment_sha256']
    p=subprocess.run(['node','--input-type=module','-e','const m=await import('+json.dumps((target/'unit.cpp.mjs').as_uri())+');if(m.original()!==37||m.state!==7)process.exit(1);'],capture_output=True,text=True)
    assert p.returncode==0,p.stderr
    before=(target/'unit.cpp.mjs').read_bytes()
    incompatible=json.loads(manifest.read_text());incompatible['native_pointer_abi']='source-lp64-addresses/2'
    manifest.write_text(json.dumps(incompatible))
    p=subprocess.run([sys.executable,str(ROOT/'tools/install_verified_fragment.py'),'--manifest',str(manifest),
        '--target',str(target),'--exports','original','--report',str(report)],cwd=ROOT,capture_output=True,text=True)
    assert p.returncode!=0 and 'native-pointer ABI differs' in p.stderr,p.stderr
    assert (target/'unit.cpp.mjs').read_bytes()==before
    print('Installed fragment bytes match both proofs; original owner state and new export execute')
