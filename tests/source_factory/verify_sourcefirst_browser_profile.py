"""Configuration derivation preserves captured commands and refuses false coverage."""
import importlib.util,json,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('browser_classic_profile',ROOT/'tools/browser_classic_profile.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
profile=json.loads(m.PROFILE.read_text())
original=[{'file':'unit.cpp','arguments':['clang++','-DHAVE_XMP','-D','USE_MIMALLOC=1','-DNOASM','-DKEEP=2','unit.cpp']}]
saved=json.dumps(original);out,changes=m.derive(profile,original)
assert json.dumps(original)==saved
assert out[0]['arguments']==['clang++','-DNOASM','-DKEEP=2','unit.cpp','-DNETCODE_DISABLE']
assert changes[0]['removed_defines']==['HAVE_XMP','USE_MIMALLOC=1']
try:m.derive(profile,original*2)
except ValueError:pass
else:raise AssertionError('Duplicate compilation command accepted')
try:m.derive(profile,[{'file':'unit.cpp','arguments':['clang++','-D']}])
except ValueError:pass
else:raise AssertionError('Dangling definition accepted')
print('Browser profile preserves original database; optional macros and duplicates are handled explicitly.')

with tempfile.TemporaryDirectory() as directory:
    root=Path(directory);build=root/'build';build.mkdir()
    commands=root/'commands.json';commands.write_text(json.dumps(original))
    manifest={'command_database':'commands.json','commands_sha256':m.sha(commands.read_bytes()),'selected_units':1}
    (build/'build-profile.json').write_text(json.dumps(manifest))
    assert m.selected_commands(root,build)==commands
    commands.write_text('[]')
    try:m.selected_commands(root,build)
    except ValueError:pass
    else:raise AssertionError('Altered selected profile accepted')
print('Profile-aware gates reject changed command database bytes.')

# Per-library options are part of the authoritative profile, not a manual
# command edit that disappears when original Make selection is regenerated.
commands=[{'file':'source/build/src/lz4.c','arguments':['clang','-c','source/build/src/lz4.c']},*original]
saved=json.dumps(commands);configured,_=m.derive(profile,commands)
assert json.dumps(commands)==saved
assert '-DLZ4_FAST_DEC_LOOP=0' in configured[0]['arguments']
assert '-DLZ4_FAST_DEC_LOOP=0' not in configured[1]['arguments']
wrong={**commands[0],'arguments':commands[0]['arguments']+['-D','LZ4_FAST_DEC_LOOP=1']}
try:m.with_source_defines(profile,wrong)
except ValueError:pass
else:raise AssertionError('Conflicting original codec configuration accepted')
print('Portable codec option applies only to its original source unit; other commands remain independent and conflicts are rejected.')
