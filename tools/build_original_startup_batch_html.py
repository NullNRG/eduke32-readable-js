#!/usr/bin/env python3
"""Self-contained Chromium diagnostic for real source-generated startup helpers.
Never claims that app_main or gameplay exists in this artifact.
"""
import ast,html,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TEST=ROOT/'tests/source_factory/verify_original_startup_batch_chromium.py'
spec=importlib.util.spec_from_file_location('source_batch_chrome',TEST)
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
urls,n=module.modules_as_data()
root=ast.parse(TEST.read_text());fn=next(x for x in root.body if isinstance(x,ast.AsyncFunctionDef) and x.name=='main')
assignment=next(x for x in ast.walk(fn) if isinstance(x,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='test' for t in x.targets))
code=ast.literal_eval(assignment.value)
js=f'''const urls={json.dumps(urls)};
const check=({code});
try {{
  const result=await check(urls);
  if(!result.passed)throw Error('Original source verification failed');
  document.getElementById('status').textContent='PASS — source-generated startup functions';
  document.getElementById('status').className='pass';
  document.getElementById('details').textContent=JSON.stringify({{...result,embeddedSourceModules:{n},originalAppMainLinked:false,originalGameplayVerified:false}},null,2);
  window.sourceResult={{pass:true,...result}};
}}catch(error){{
  document.getElementById('status').textContent='FAILED — '+String(error).slice(0,250);
  document.getElementById('status').className='fail';
  window.sourceResult={{pass:false,error:String(error)}};
}}
'''
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>EDuke32 original startup check</title>
<style>body{background:#121a28;color:#e9efff;font:16px system-ui;padding:30px;max-width:850px;margin:auto}h1{font-size:1.7em}.pass{color:#6df0a3}.fail{color:#ff9898}pre{white-space:pre-wrap;word-break:break-word;background:#202b3d;border-radius:8px;padding:16px}small{color:#b5c3d8}</style></head><body><h1>EDuke32 SourceFactory — original startup checks</h1><p id="status">Running original source-generated JavaScript…</p><pre id="details"></pre><p><small>This tests real translated startup helpers and browser VFS services. It is NOT a bootable or playable Duke Nukem 3D game; app_main and rendering are not linked.</small></p><script type="module">'''+js+'</script></body></html>'
out=ROOT/'dist/original-startup-batch-check.html';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(page)
print(json.dumps({'file':str(out),'bytes':out.stat().st_size,'embedded_source_modules':n,'gameplay_verified':False}))
