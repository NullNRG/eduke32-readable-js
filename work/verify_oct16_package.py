"""Verify a continuation ZIP and run only its explicitly incomplete entry diagnostic."""
import hashlib,json,os,sys,tempfile,zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];archive=Path(sys.argv[1]).resolve();prefix='EDuke32_SourceFactory/'
with zipfile.ZipFile(archive) as package:
 manifest=json.loads(package.read(prefix+'PACKAGE_MANIFEST.json'))
 for row in manifest['files']:
  data=package.read(prefix+row['path']);assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'],row['path']
 state=json.loads(package.read(prefix+'HANDOFF_SNAPSHOT.json'))
 regression=json.loads(package.read(prefix+state['current_regressions']['report']))
 assert state['current_build']['completed_units']>0 and regression['all_passed'] and regression['regression_inputs_unchanged']
 for name,expected in regression['regression_inputs'].items():assert hashlib.sha256(package.read(prefix+name)).hexdigest()==expected,name
 assert prefix+'dist/index.html' not in package.namelist()
 assert not any('/clang-ast-cache/' in name or name.endswith('.sqlite') or '/node_modules/' in name for name in package.namelist())
 for name in ('HANDOFF_README.md','LLM_CONTINUATION_PROMPT.md','HANDOFF_STATE.json','HANDOFF_SNAPSHOT.json','CURRENT_PORT_STATUS.md'):
  (ROOT/name).write_bytes(package.read(prefix+name))
 payload=package.read(prefix+'dist/original-entry-attempt.html')
with tempfile.TemporaryDirectory(prefix='eduke-handoff-offline-diagnostic-') as directory:
 html=Path(directory)/'original-entry-attempt.html';html.write_bytes(payload)
 with sync_playwright() as playwright:
  browser=playwright.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
  page=browser.new_page();requests=[];page.on('request',lambda r:requests.append(r.url))
  page.goto(html.as_uri(),wait_until='load',timeout=120000);page.locator('#run').click(timeout=120000)
  page.wait_for_function('entryAttempt.error !== null || entryAttempt.entryReturned',timeout=60000)
  observed=page.evaluate('entryAttempt');assert observed['entryInvoked'] and observed['assets']['entries']==456 and observed['assets']['hasE1L1']
  assert observed['error']['message']=='engineSetLogFile is not defined',observed
  network=[u for u in requests if u.startswith(('http:','https:'))];assert not network,network
  version=browser.version;browser.close()
report={'format':'continuation-package-verification/1','zip':str(archive),'zip_bytes':archive.stat().st_size,'zip_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),
 'payload_files_verified':len(manifest['files']),'current_regression_input_hashes_verified':len(regression['regression_inputs']),
 'completed_work_preserved':True,'raw_ast_database_node_modules_omitted':True,'historical_entry_diagnostic_executed_outside_project':True,
 'network_requests':network,'browser_version':version,'diagnostic':observed,'game_booted':False,'gameplay_verified':False,
 'verification_passed':True,'verification_does_not_mean_original_game_passed':True}
report_path=Path(sys.argv[2]) if len(sys.argv)>2 else ROOT/'reports/oct16-package-verification.json'
report_path.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='diagnostic'},indent=2))
