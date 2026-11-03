"""One fresh-realm original startup probe, shared by automation and launcher.

The existing component harness supplies all runtime bindings and native-table
checks. Fail closed if its shape changes: never silently pre-initialize state.
"""
import ast
from pathlib import Path


def fresh_engine_probe(root: Path) -> str:
    tree = ast.parse((root / 'tools/verify_browser_engine_component.py').read_text())
    scripts = [node.value for node in ast.walk(tree)
               if isinstance(node, ast.Constant) and isinstance(node.value, str)
               and node.value.startswith('async ({base,consoleOnly})=>')]
    if len(scripts) != 1:
        raise ValueError('Component harness JavaScript must be unique')
    code = scripts[0]

    def replace(before, after):
        nonlocal code
        if code.count(before) != 1:
            raise ValueError('Component probe changed: ' + before)
        code = code.replace(before, after, 1)

    replace("if(typeof engine.enginePreInit==='function')await enter('enginePreInit',()=>engine.enginePreInit());\n      else trace.push({name:'enginePreInit',transition:'blocked',reason:'original function has not linked'});", '')
    allocator = "await enter('engineSetupAllocator',()=>baseLayer.engineSetupAllocator());"
    replace(allocator, allocator + "\n      if(consoleOnly)throw Error('Use the canonical console probe for console diagnostics');\n      if(typeof engine.enginePreInit!=='function')throw Error('Original enginePreInit has not linked');\n      const startupResult=await enter('enginePreInit',()=>engine.enginePreInit());\n      if(startupResult!==0)throw Error('Original enginePreInit failed: '+startupResult);")
    replace("await enter('initdivtables',()=>pragmas.initdivtables());", '// Read tables initialized by the original entry.')
    replace("if(typeof platform.initsystem==='function')await enter('initsystem',()=>platform.initsystem());\n      else trace.push({name:'initsystem',transition:'blocked',reason:'original function has not linked'});", '')
    replace("await enter('videoGetModes',()=>platform.videoGetModes(0));", '// Read modes initialized by the original entry.')
    replace('original_engine_startup_verified:startup,trace,gameplay_verified:false',
            'original_engine_startup_verified:startup,fresh_startup_without_precalled_helpers:true,trace,gameplay_verified:false')
    return code
