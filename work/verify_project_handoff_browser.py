"""Create the real continuation ZIP through the launcher and verify its link."""
import json,os,sys,zipfile
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import urlopen
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
report={'gameplay_verified':False,'page_errors':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
    page=browser.new_page(viewport={'width':1280,'height':1100})
    page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
    page.goto('http://127.0.0.1:8765/')
    if '--existing' not in sys.argv:
        page.get_by_role('button',name='Create handoff ZIP').click()
        print('Continuation packaging started through the actual launcher.',flush=True)
        page.get_by_text('Create continuation ZIP · passed',exact=True).wait_for(timeout=1200000)
    link=page.locator('#handoff a');link.wait_for()
    head=page.request.head(urljoin(page.url,link.get_attribute('href')))
    assert head.status==405 and head.body()==b'',head.status
    # The launcher deliberately disables HEAD. Read only GET headers instead
    # of buffering another complete archive in the browser test process.
    with urlopen(urljoin(page.url,link.get_attribute('href')),timeout=30) as response:
        download_status=response.status
        download_bytes=int(response.headers['content-length'])
    assert download_status==200,download_status
    archive=json.loads((ROOT/'reports/project-handoff.json').read_text())
    assert download_bytes==archive['bytes']
    with zipfile.ZipFile(archive['path']) as z:
        manifest=json.loads(z.read('EDuke32_SourceFactory/CONTINUATION_MANIFEST.json'))
        required={'index.html','CONTINUE_HERE.md','CURRENT_PORT_STATUS.md','HANDOFF_SNAPSHOT.json',
            'tools/source_ast_to_js.py','runtime/index.mjs','input-data/DUKE3D.GRP',
            'factory-output/compile_commands.json','reports/all-blockers.json','reports/all-blockers.csv',
            'reports/dependency-graph.json','reports/root-causes.json','reports/boot-blockers.json',
            'reports/oct21-helper-regression.json','reports/oct21-embedded-helper-repair.json'}
        included={row['path'] for row in manifest['files']}
        assert required<=included,sorted(required-included)
        assert manifest['mode']=='continuation' and not manifest['gameplay_verified']
        assert any(name.startswith('factory-output/source-tree/') for name in included)
        assert not any('clang-ast-cache/' in name or name.endswith('.sqlite') for name in included)
    assert not page.locator('#play').is_visible()
    page.screenshot(path=str(ROOT/'reports/oct21-project-launcher-handoff.png'),full_page=True)
    report.update(passed=not report['page_errors'],browser_version=browser.version,archive=archive,
        required_paths_verified=sorted(required),download_link=link.get_attribute('href'),
        rejected_head_has_no_body=True,download_get_status=download_status,download_content_length=download_bytes)
    browser.close()
(ROOT/'reports/oct21-project-handoff-browser.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2));assert report['passed']
