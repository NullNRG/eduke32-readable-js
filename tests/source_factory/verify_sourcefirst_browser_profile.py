"""Configuration derivation preserves captured commands and refuses false coverage."""
import importlib.util,json,sys,tempfile
from pathlib import Path
from unittest.mock import patch
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

sys.path.insert(0,str(ROOT/'tools'))
import build_browser_classic as build

with tempfile.TemporaryDirectory() as directory:
    root=Path(directory)
    commands=root/'compile_commands.json'
    commands.write_text('new commands')
    commands.with_suffix('.header-definitions.witness.json').write_text('{}')
    (root/'changed.cpp').write_bytes(b'new source')
    (root/'unchanged.cpp').write_bytes(b'same source')
    before={'changed.cpp':b'original source','unchanged.cpp':b'same source'}
    report=root/'semantic-refresh.json'

    def refreshed(tool,source,source_option,before_source,commands_option,before_commands,report_option,target):
        assert (tool,source)==('tools/refresh_semantic_unit.py','changed.cpp')
        assert (source_option,commands_option,report_option)==('--before','--before-commands','--report')
        assert before_source.read_bytes()==before[source]
        assert before_commands.read_bytes()==b'original commands' and target==report
        return 0

    with patch.object(build,'run',side_effect=refreshed) as run:
        assert build.refresh_changed_primary(root,commands,before,b'original commands',report)
        assert run.call_count==1
        assert not run.call_args.args[3].exists()
    with patch.object(build,'run',return_value=1):
        assert not build.refresh_changed_primary(root,commands,before,b'original commands',report)
    (root/'unchanged.cpp').write_bytes(b'another change')
    with patch.object(build,'run') as run:
        assert not build.refresh_changed_primary(root,commands,before,b'original commands',report)
        run.assert_not_called()

print('A single edited source uses the attested semantic refresh; failures and several edits use full extraction.')
