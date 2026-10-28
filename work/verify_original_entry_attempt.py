"""Capture real original entry execution (an expected startup failure, not gameplay)."""
import hashlib,json,os
from datetime import datetime,timezone
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=ROOT/'dist/original-entry-attempt.html'
requests=[];errors=[];console=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
    page=browser.new_page(viewport={'width':1100,'height':800})
    page.on('request',lambda r:requests.append(r.url))
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:console.append({'type':m.type,'text':m.text}))
    page.goto(html.as_uri(),wait_until='load',timeout=120000)
    page.locator('#run').click(timeout=120000)
    page.wait_for_function('entryAttempt.error !== null || entryAttempt.entryReturned',timeout=60000)
    result=page.evaluate('entryAttempt')
    # Source-import failures must not be counted as original-entry execution.
    observed=bool(result['entryInvoked'] and any(x['message']=='RETURN original G_ExtPreInit' for x in result['trace']))
    image=ROOT/'reports/oct15-original-entry-attempt.png'
    page.screenshot(path=str(image),full_page=False)
    report={'format':'original-app-main-chromium-execution/1','timestamp':datetime.now(timezone.utc).isoformat(),
        'browser_version':browser.version,'page':str(html.relative_to(ROOT)),
        'page_sha256':hashlib.sha256(html.read_bytes()).hexdigest(),'offline_file_url':True,
        'network_requests':[u for u in requests if u.startswith(('http:','https:'))],
        'page_errors':errors,'console':console,'result':result,
        'original_app_main_execution_observed':observed,'game_booted':False,'gameplay_verified':False,
        'screenshot':str(image.relative_to(ROOT))}
    browser.close()
(ROOT/'reports/oct15-original-entry-attempt-chromium.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
assert observed, 'Original app_main execution did not reach and return from its genuine first callee'
assert not report['network_requests'] and not errors
assert result['assets']['entries']==456 and result['assets']['hasE1L1']
