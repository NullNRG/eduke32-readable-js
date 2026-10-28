"""Every initial/recovery pass uses the selected preprocessor configuration."""
import hashlib,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory(prefix='source-project-profile-') as directory:
    root=Path(directory);source=root/'source';source.mkdir()
    guard='#ifndef TEST_BROWSER_BUILD\n#error Browser profile was dropped\n#endif\n'
    (source/'provider.cpp').write_text(guard+'int original_provider(int x){return x+7;}')
    (source/'caller.cpp').write_text(guard+'extern int original_provider(int);int original_caller(int x){return original_provider(x)*3;}')
    commands=root/'commands.json';commands.write_text(json.dumps([{'file':name,'arguments':['clang++','-std=c++14','-DTEST_BROWSER_BUILD=1',name]} for name in ('provider.cpp','caller.cpp')]))
    plan=root/'plan.json';plan.write_text(json.dumps({'root':str(source),'compile_commands':str(commands),'units':[{'source':n} for n in ('provider.cpp','caller.cpp')]}))
    out=root/'out'
    result=subprocess.run([sys.executable,str(ROOT/'tools/source_first_project.py'),'--plan',str(plan),'--out-dir',str(out),'--strict'],cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert result.returncode==0,(result.stdout[-1000:],result.stderr[-2000:])
    summary=json.loads((out/'project-build.json').read_text())
    assert summary['compile_commands_sha256']==hashlib.sha256(commands.read_bytes()).hexdigest()
    runner=root/'run.mjs';runner.write_text('import {original_caller} from '+json.dumps((out/'caller.cpp.mjs').as_uri())+';if(original_caller(5)!==36)throw Error("original source behavior changed");')
    subprocess.run(['node',str(runner)],check=True)
print('PASS selected browser defines survive initial and cross-unit source emission.')
