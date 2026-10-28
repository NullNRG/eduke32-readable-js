import hashlib,json,os,sys,zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
archive=Path(sys.argv[1]).resolve()
destination=archive.parent/'EDuke32_JS_Original_Entry_Attempt_2026-10-15.html'
with zipfile.ZipFile(archive) as package:
    payload=package.read('EDuke32_SourceFactory/dist/original-entry-attempt.html')
    destination.write_bytes(payload)
    for name in ('HANDOFF_README.md','LLM_CONTINUATION_PROMPT.md','HANDOFF_SNAPSHOT.json','HANDOFF_STATE.json','CURRENT_PORT_STATUS.md'):
        (ROOT/name).write_bytes(package.read('EDuke32_SourceFactory/'+name))
digest=hashlib.sha256(payload).hexdigest()
assert digest==json.loads((ROOT/'reports/oct15-original-entry-attempt-package.json').read_text())['sha256']
requests=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
    page=browser.new_page();page.on('request',lambda r:requests.append(r.url))
    page.goto(destination.as_uri(),wait_until='load',timeout=120000)
    page.locator('#run').click(timeout=120000)
    page.wait_for_function('entryAttempt.error !== null || entryAttempt.entryReturned',timeout=60000)
    result=page.evaluate('entryAttempt')
    observed=page.evaluate('''()=>{
        const r=entryRuntime,p=r.heap.malloc(256);
        try {r.library.symbols.getcwd(p,256);return {cwd:r.heap.readCString(p),searchPaths:r.fs.searchPaths};}
        finally {r.heap.free(p);}
    }''')
    assert result['entryInvoked'] and result['error']['message']=='engineSetLogFile is not defined',result
    assert observed['cwd']=='/home/browser/.config/eduke32',observed
    assert result['assets']['entries']==456 and result['assets']['hasE1L1']
    network=[u for u in requests if u.startswith(('http:','https:'))]
    assert not network,network
    report={'format':'exported-offline-original-entry-execution/1','html':str(destination),
        'html_sha256':digest,'zip':str(archive),'browser_version':browser.version,
        'executed_outside_project':True,'network_requests':network,'actual_startup_effects':observed,
        'result':result,'game_booted':False,'gameplay_verified':False}
    browser.close()
(ROOT/'reports/oct15-exported-entry-attempt.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='result'},indent=2))
