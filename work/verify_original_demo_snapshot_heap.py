"""Exercise original demo snapshot allocation and teardown in Chromium."""
import functools
import json
import os
import threading

from playwright.sync_api import sync_playwright
from verify_original_con_gamevars import PROFILE, ROOT, ProbeServer, QuietHandler


PROBE = r'''async base => {
  const {NativeRuntime} = await import('/runtime/index.mjs');
  const runtime = new NativeRuntime({renderer:'canvas2d', memoryBytes:16<<20});
  runtime.bindSourceMemory();
  const release = (await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
  try {
    const layer = await import(base+'/source/build/src/baselayer.cpp.mjs');
    const save = await import(base+'/source/duke3d/src/savegame.cpp.mjs');
    layer.engineSetupAllocator();
    const count = () => runtime.heap.allocations.size;
    const baseline = count();
    save.SV_AllocSnap(1);
    if (count() !== baseline+3) throw Error('Expected all three original snapshot allocations');
    save.SV_AllocSnap(0);
    if (count() !== baseline+2) throw Error('Snapshot replacement leaked the previous allocation');
    save.sv_freemem();
    save.sv_freemem();
    if (count() !== baseline) throw Error('Snapshot teardown leaked or double-freed an allocation');
    return {original_allocation_and_teardown_verified:true, allocations_by_mode:[3,2],
            repeated_teardown_verified:true, scope:'startup zero-size snapshot state'};
  } finally {
    release();
    runtime.close();
  }
}'''


def run_browser_probe(probe):
    handler = functools.partial(QuietHandler, directory=ROOT)
    with ProbeServer(('127.0.0.1', 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        origin = f'http://127.0.0.1:{server.server_port}'
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'), headless=True)
                page = browser.new_page()
                page.goto(origin + '/engine-player.html')
                result = page.evaluate(probe, origin + '/' + PROFILE['boot_module_root'])
                result['chromium_version'] = browser.version
                browser.close()
        finally:
            server.shutdown()
    return result


if __name__ == '__main__':
    result = run_browser_probe(PROBE)
    (ROOT / 'reports/nov18-original-demo-snapshot-heap.json').write_text(
        json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('PASS original demo snapshot allocation, replacement, and teardown in Chromium')
