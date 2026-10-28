import json,hashlib,re,shlex,subprocess,os
from pathlib import Path
root=Path('.').resolve();old=json.loads((root/'reports/native-engine-build.json').read_text());native=Path(old['sourceDirectory']);canonical=root/'factory-output/source-tree/eduke32-master'
for name in ('GNUmakefile','Common.mak'):
 assert (native/name).read_bytes()==(canonical/name).read_bytes(),name
flags=['PLATFORM=LINUX','NOASM=1','USE_OPENGL=0','POLYMER=0','STARTUP_WINDOW=0','NETCODE=0','USE_MIMALLOC=0','HAVE_VORBIS=0','HAVE_FLAC=0','HAVE_XMP=0','USE_LIBVPX=0','LTO=0','PRETTY_OUTPUT=0']
command=[old['command']['executable'],'-n','-B','eduke32',*flags]
env={**os.environ,'PATH':str(Path(command[0]).parent)+';'+os.environ['PATH']}
p=subprocess.run(command,cwd=native,env=env,capture_output=True,text=True,timeout=90)
(root/'reports/oct28-classic-make-dryrun.log').write_text(p.stdout+'\n'+p.stderr)
assert p.returncode==0,p.stderr
rows={}
for line in p.stdout.splitlines():
 if not re.match(r'^(?:g\+\+|gcc|clang\+\+|clang)\s',line):continue
 args=shlex.split(line)
 if '-c' not in args:continue
 sources=[a for a in args if a.startswith(('source/','obj/')) and a.endswith(('.c','.cpp','.cc'))]
 assert len(sources)==1,(line,sources)
 name=sources[0];assert name not in rows,name
 rows[name]={'file':name,'directory':str(canonical),'arguments':args}
assert rows
out=root/'factory-output/browser-classic';out.mkdir(exist_ok=True,parents=True)
payload=(json.dumps(list(rows.values()),indent=2)+'\n').encode();(out/'make-compile_commands.json').write_bytes(payload)
captured={r['file'] for r in json.loads((root/'factory-output/compile_commands.json').read_text())}
report={'format':'original-make-classic-selection/1','make_returncode':p.returncode,'command':command,'original_makefile_hashes':{n:hashlib.sha256((canonical/n).read_bytes()).hexdigest() for n in ('GNUmakefile','Common.mak')},'selected_units':len(rows),'selected_files':sorted(rows),'excluded_captured_units':sorted(captured-rows.keys()),'new_selected_units':sorted(rows.keys()-captured),'missing_generated_or_original_files':[n for n in rows if not (canonical/n).is_file()],'commands_sha256':hashlib.sha256(payload).hexdigest(),'configuration_inventory_verified':True,'source_compilation_verified':False,'gameplay_verified':False}
(root/'reports/oct28-classic-make-inventory.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ('selected_files','command')},indent=2))
