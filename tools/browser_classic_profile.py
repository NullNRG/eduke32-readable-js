"""Derive a provisional browser-classic command database without altering inputs.

Macro changes invalidate prior compiler outputs. A captured desktop inventory is
not a Make-verified classic inventory; the report explicitly refuses that claim.
"""
import argparse,hashlib,json,os,re,tempfile,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PROFILE=ROOT/'tools/browser_classic_profile.json'
def sha(data):return hashlib.sha256(data).hexdigest()

def selected_commands(root,build):
    """One command database for compilation, recovery and acceptance."""
    metadata=Path(build)/'build-profile.json'
    if not metadata.is_file():return Path(root)/'factory-output/compile_commands.json'
    record=json.loads(metadata.read_text());root=Path(root).resolve()
    path=(root/record['command_database']).resolve()
    if not path.is_relative_to(root) or sha(path.read_bytes())!=record['commands_sha256']:
        raise ValueError('Browser build profile command database changed')
    commands=json.loads(path.read_text());names=[r['file'] for r in commands]
    if len(names)!=len(set(names)) or len(names)!=record['selected_units']:
        raise ValueError('Browser build selection does not match its manifest')
    return path
def derive(profile,commands):
    if profile.get('format')!='sourcefactory-browser-profile/1':raise ValueError('Unknown build profile')
    removed=set(profile['remove_defines']);added=profile['add_defines']
    if any(not re.fullmatch(r'[A-Za-z_]\w*',v) for v in removed|set(added)):
        raise ValueError('Invalid preprocessor definition')
    units=[];seen=set();changes=[]
    for command in commands:
        name=command.get('file');args=command.get('arguments')
        if not isinstance(name,str) or not isinstance(args,list) or not args or not all(isinstance(v,str) for v in args):
            raise ValueError('Only argument-array compile commands are supported')
        if name in seen:raise ValueError('Duplicate translation-unit command: '+name)
        seen.add(name);out=[];removed_here=[];existing=set();i=0
        while i<len(args):
            arg=args[i];part=None;count=1
            if arg=='-D':
                if i+1>=len(args):raise ValueError('Dangling -D')
                part=args[i+1];count=2
            elif arg.startswith('-D') and len(arg)>2:part=arg[2:]
            if part is not None:
                key=part.split('=',1)[0]
                if key in removed:removed_here.append(part);i+=count;continue
                existing.add(key)
            out.extend(args[i:i+count]);i+=count
        inserted=[]
        for key in added:
            if key not in existing:out.append('-D'+key);inserted.append(key)
        units.append({**command,'arguments':out})
        changes.append({'file':name,'removed_defines':removed_here,'added_defines':inserted})
    return units,changes
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--profile',type=Path,default=PROFILE)
    p.add_argument('--out',type=Path);p.add_argument('--report',type=Path);args=p.parse_args()
    profile=json.loads(args.profile.read_text(encoding='utf-8'))
    if profile.get('preparation_tool') and not args.out and not args.report:
        subprocess.run([sys.executable,str(ROOT/profile['preparation_tool'])],cwd=ROOT,check=True)
        return
    source=(ROOT/profile['source_commands']).resolve()
    if not source.is_relative_to(ROOT):raise SystemExit('Source database escapes project')
    original=source.read_bytes();commands=json.loads(original);derived,changes=derive(profile,commands)
    output=(args.out or ROOT/profile['derived_commands']).resolve();report=(args.report or output.with_name('profile-inventory.json')).resolve()
    if output==source or report==source or output==report:raise SystemExit('Refuse to overwrite source database or output')
    payload=(json.dumps(derived,indent=2)+'\n').encode();profile_data=args.profile.read_bytes()
    evidence={'format':'sourcefactory-browser-profile-inventory/1','profile':profile['name'],
        'profile_sha256':sha(profile_data),'captured_commands_sha256':sha(original),
        'derived_commands_sha256':sha(payload),'translation_units':len(derived),'changes':changes,
        'make_selected_classic_inventory_verified':False,'source_semantics_verified':False,
        'emitted_artifacts_reused':False,'gameplay_verified':False,
        'limitation':profile['inventory_policy']}
    for path,data in ((output,payload),(report,(json.dumps(evidence,indent=2)+'\n').encode())):
        path.parent.mkdir(parents=True,exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=path.parent,delete=False) as f:
            f.write(data);temporary=f.name
        os.replace(temporary,path)
    print(json.dumps({k:v for k,v in evidence.items() if k!='changes'},indent=2))
if __name__=='__main__':main()
