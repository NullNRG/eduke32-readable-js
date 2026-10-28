"""Check the actual project launcher in Chromium, including failure output."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
report={'format':'project-launcher-browser/1','gameplay_verified':False,'page_errors':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
    page=browser.new_page(viewport={'width':1280,'height':1100})
    page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
    page.goto('http://127.0.0.1:8765/')
    page.get_by_text('Original game is blocked; no playable dist/index.html yet',exact=True).wait_for()
    assert page.locator('#no-game').is_disabled() and not page.locator('#play').is_visible()
    page.get_by_role('button',name='Review cleanup').click()
    page.get_by_text('0.00 GB removable',exact=True).wait_for()
    assert not page.locator('#clean').is_visible()
    page.get_by_role('button',name='Check game readiness').click()
    page.get_by_text('Original game acceptance checks · failed',exact=True).wait_for(timeout=30000)
    assert 'startup_dependency_closure' in page.locator('#log').inner_text()
    assert page.get_by_role('button',name='Create handoff ZIP').is_enabled()
    page.screenshot(path=str(ROOT/'reports/oct20-project-launcher-desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path=str(ROOT/'reports/oct20-project-launcher-mobile.png'),full_page=True)
    page.goto((ROOT/'index.html').as_uri())
    assert page.locator('#offline').is_visible() and page.get_by_role('button',name='Compile original game').is_disabled()
    report.update(passed=not report['page_errors'],browser_version=browser.version,
        checks={'missing_game_disabled':True,'empty_cleanup_preview':True,'real_acceptance_failure_logged':True,'mobile_no_overflow':True,'file_launch_instructions':True})
    browser.close()
(ROOT/'reports/oct20-project-launcher-browser.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
assert report['passed']
