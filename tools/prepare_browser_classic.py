"""Prepare a byte-attested browser source overlay and original Make inventory.

The only source adaptation excludes Linux ALSA from the platform driver table.
Original game/mixer code and the archived source tree remain unchanged.
"""
import argparse,hashlib,json,os,re,shlex,shutil,subprocess,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
DRIVERS='source/audiolib/src/drivers.cpp'
def digest(data):return hashlib.sha256(data).hexdigest()
def browser_drivers(data):
    guard=b'#ifdef __linux__'
    if data.count(guard)!=2:raise ValueError('Original ALSA platform guards changed')
    return data.replace(guard,b'#if defined(__linux__) && !defined(EDUKE32_BROWSER)')
def restore_source_archive(archive,destination,expected_sha):
    if digest(archive.read_bytes())!=expected_sha:raise ValueError('Original source archive checksum mismatch')
    destination=destination.resolve()
    with zipfile.ZipFile(archive) as source:
        members=source.infolist()
        for member in members:
            name=PurePosixPath(member.filename)
            if (name.is_absolute() or not name.parts or name.parts[0]!='eduke32-master'
                    or '..' in name.parts or '\\' in member.filename or ':' in member.filename
                    or (member.external_attr>>16)&0o170000==0o120000):
                raise ValueError('Unsafe original source archive member')
        for member in members:
            target=(destination/member.filename).resolve()
            if not target.is_relative_to(destination):raise ValueError('Source extraction escapes destination')
            if member.is_dir():target.mkdir(parents=True,exist_ok=True);continue
            if target.exists():
                if target.read_bytes()!=source.read(member):raise ValueError('Existing source differs; refusing overwrite')
                continue
            target.parent.mkdir(parents=True,exist_ok=True)
            with source.open(member) as incoming,target.open('wb') as output:shutil.copyfileobj(incoming,output)
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--make');a=p.parse_args()
    original=ROOT/'factory-output/source-tree/eduke32-master'
    folder=ROOT/'factory-output/browser-classic';overlay=folder/'source-tree/eduke32-master'
    if not (original/'GNUmakefile').is_file():
        restore_source_archive(ROOT/'input-source/eduke32-master.zip',original.parent,
            '495b988eb88a5f95256e30fe26c91d4fcbed2def5dd60a391512f05bce9dd097')
    make=a.make or shutil.which('make') or shutil.which('mingw32-make')
    native=ROOT/'reports/native-engine-build.json'
    if not make and native.is_file():make=json.loads(native.read_text())['command']['executable']
    if not make or not Path(make).is_file():raise SystemExit('Provide GNU Make with --make')
    folder.mkdir(parents=True,exist_ok=True)
    # This is a generated source overlay, never a second project or a reset of
    # emitted code. Preserve the input tree and record every differing byte.
    shutil.copytree(original,overlay,dirs_exist_ok=True)
    before=(original/DRIVERS).read_bytes();after=browser_drivers(before)
    (overlay/DRIVERS).write_bytes(after)
    flags=['PLATFORM=LINUX','SUBPLATFORM=BROWSER','NOASM=1','USE_OPENGL=0','POLYMER=0',
           'STARTUP_WINDOW=0','HAVE_GTK2=0','NETCODE=0','USE_MIMALLOC=0','HAVE_VORBIS=0','HAVE_FLAC=0',
           'HAVE_XMP=0','USE_LIBVPX=0','LTO=0','PRETTY_OUTPUT=0']
    command=[make,'-n','-B','eduke32',*flags]
    env={**os.environ,'PATH':str(Path(make).parent)+os.pathsep+os.environ['PATH']}
    run=subprocess.run(command,cwd=overlay,env=env,text=True,capture_output=True,timeout=90)
    (folder/'make-dryrun.log').write_text(run.stdout+'\n'+run.stderr)
    if run.returncode:raise SystemExit('Original Make selection failed; see make-dryrun.log')
    rows={}
    for line in run.stdout.splitlines():
        if not re.match(r'^(?:g\+\+|gcc|clang\+\+|clang)\s',line):continue
        args=shlex.split(line)
        if '-c' not in args:continue
        names=[v for v in args if v.startswith(('source/','obj/')) and v.endswith(('.cpp','.c','.cc'))]
        if len(names)!=1 or names[0] in rows:raise ValueError('Ambiguous compile command')
        clean=[];skip=False
        for arg in args:
            if skip:skip=False;continue
            if arg=='-dumpdir':skip=True;continue
            if arg.startswith('-save-temps'):continue
            clean.append(arg)
        clean.append('-DEDUKE32_BROWSER=1')
        rows[names[0]]={'directory':str(overlay),'file':names[0],'arguments':clean}
    if not rows or any('/mimalloc/' in n or '/libxmp-lite/' in n or n.endswith('driver_alsa.cpp') for n in rows):
        raise ValueError('Desktop backend leaked into browser selection')
    captured={r['file'] for r in json.loads((ROOT/'factory-output/compile_commands.json').read_text())}
    payload=(json.dumps(list(rows.values()),indent=2)+'\n').encode()
    (folder/'compile_commands.json').write_bytes(payload)
    report={'format':'browser-classic-source-preparation/1','source_root':str(overlay),
        'command_database':'factory-output/browser-classic/compile_commands.json',
        'make_command':command,'make_returncode':run.returncode,'selected_units':len(rows),
        'selected_files':sorted(rows),'excluded_captured_units':sorted(captured-rows.keys()),
        'commands_sha256':digest(payload),'source_adaptations':[{'file':DRIVERS,
            'original_sha256':digest(before),'browser_sha256':digest(after),
            'reason':'Exclude ALSA backend; retain original SDL, OPL and mixer behavior'}],
        'source_compilation_verified':False,'gameplay_verified':False}
    (ROOT/'reports/browser-classic-preparation.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ('selected_files','excluded_captured_units','make_command')},indent=2))
if __name__=='__main__':main()
