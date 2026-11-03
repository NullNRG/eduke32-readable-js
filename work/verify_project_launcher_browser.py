"""Exercise the real local launcher and original startup page in Chromium."""
import hashlib,json,os,sys,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from project_launcher import Project,Handler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright

def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);server.project=Project(ROOT)
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    errors=[];console=[];evidence=ROOT/'reports/evidence';evidence.mkdir(exist_ok=True)
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
            page=browser.new_page(viewport={'width':1280,'height':1000})
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_port}/')
            page.wait_for_function("document.querySelector('#engine-open').hidden === false")
            assert page.locator('#play').is_hidden(),'Unverified gameplay must not be launchable'
            assert page.locator('#no-game').is_disabled()
            assert page.locator('[data-action="engine-startup"]').is_enabled()
            assert page.locator('[data-action="resume-app-main"]').is_enabled()
            page.get_by_role('button',name='Review cleanup',exact=True).click()
            page.wait_for_function("document.querySelector('#storage').textContent.endsWith('removable')")
            page.get_by_role('button',name='Check game readiness',exact=True).click()
            page.get_by_text('Original game acceptance checks · failed',exact=True).wait_for(timeout=30000)
            assert 'startup_dependency_closure' in page.locator('#log').inner_text()
            assert page.get_by_role('button',name='Create handoff ZIP',exact=True).is_enabled()
            launcher=evidence/'nov02-project-launcher.png';page.screenshot(path=str(launcher),full_page=True)
            with page.expect_popup() as popup:page.locator('#engine-open').click()
            diagnostic=popup.value;diagnostic.on('pageerror',lambda error:errors.append(str(error)))
            diagnostic.on('console',lambda event:console.append({'type':event.type,'text':event.text}))
            diagnostic.get_by_role('button',name='Run original engine startup',exact=True).click()
            diagnostic.wait_for_function('window.__ENGINE_STARTUP_RESULT__ !== undefined',timeout=120000)
            result=diagnostic.evaluate('window.__ENGINE_STARTUP_RESULT__')
            assert result['component_passed'] and result['original_engine_startup_verified'],result
            assert result['fresh_startup_without_precalled_helpers'] and not result['gameplay_verified']
            calls=[row['name'] for row in result['trace'] if row.get('transition')=='enter']
            assert calls.index('engineSetupAllocator')<calls.index('enginePreInit')
            assert not {'initdivtables','initsystem','videoGetModes'}&set(calls),calls
            assert next(row for row in result['trace'] if row['name']=='original divider storage verified')['records']==65532
            diagnostic.get_by_role('button',name='Reload for a fresh run',exact=True).wait_for()
            assert diagnostic.get_by_text('Save this run’s result',exact=True).is_visible()
            startup=evidence/'nov02-engine-startup-diagnostic.png';diagnostic.screenshot(path=str(startup),full_page=True)
            page.set_viewport_size({'width':390,'height':844})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            mobile=evidence/'nov02-project-launcher-mobile.png';page.screenshot(path=str(mobile),full_page=True)
            page.goto((ROOT/'index.html').as_uri())
            assert page.locator('#offline').is_visible()
            assert page.get_by_role('button',name='Run full game build',exact=True).is_disabled()
            assert not errors,errors
            report={'passed':True,'browser_version':browser.version,'page_errors':errors,'console':console,
                    'actual_original_startup_result':result,'gameplay_verified':False,
                    'screenshots_are_gameplay':False,'checks':{'real_acceptance_failure_logged':True,'cleanup_preview':True,'mobile_no_overflow':True,'file_launch_instructions':True},
                    'screenshots':{path.relative_to(ROOT).as_posix():hashlib.sha256(path.read_bytes()).hexdigest() for path in (launcher,startup,mobile)}}
            browser.close()
        (ROOT/'reports/nov02-launcher-browser.json').write_text(json.dumps(report,indent=2)+'\n')
        print('PASS: real launcher opens original engine diagnostic; fresh original enginePreInit returns 0; Play remains gated')
    finally:server.shutdown();server.server_close();thread.join()

if __name__=='__main__':main()
