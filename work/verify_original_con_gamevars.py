"""Exercise original CON variable, array and cleanup code in the browser."""
import functools
import json
import os
from pathlib import Path
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PROFILE = json.loads((ROOT / 'tools/browser_classic_profile.json').read_text())
PROBE = r'''async base => {
  const {NativeRuntime} = await import('/runtime/index.mjs');
  const {sourceCString} = await import('/runtime/source_bytes.mjs');
  const runtime = new NativeRuntime({renderer:'canvas2d',memoryBytes:16<<20});
  runtime.bindSourceMemory();
  const release = (await import(base + '/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
  try {
    const layer = await import(base + '/source/build/src/baselayer.cpp.mjs');
    const hash = await import(base + '/source/build/src/hash.cpp.mjs');
    const vm = await import(base + '/source/duke3d/src/gamestructures.cpp.mjs');
    const script = await import(base + '/source/duke3d/src/gamedef.cpp.mjs');
    const variable = await import(base + '/source/duke3d/src/gamevars.cpp.mjs');
    const bytes = text => Uint8Array.from([...new TextEncoder().encode(text), 0]);
    layer.engineSetupAllocator();
    vm.VM_InitHashTables();
    hash.hash_init(script.h_arrays);
    hash.hash_init(script.h_gamevars);
    const count = () => [variable.g_gameVarCount, variable.g_gameArrayCount];
    const expect = (condition, error) => { if (!condition) throw Error(error); };
    expect(count().every(x => x === 0), 'Original BSS counts must start at zero');
    variable.Gv_NewVar(bytes('FACTORY_VAR'), -8191n, 0);
    variable.Gv_NewArray(bytes('FACTORY_ARRAY'), null, 8n, 0);
    const v = variable.aGameVars[0], a = variable.aGameArrays[0];
    expect(count().join(',') === '1,1', 'Original create did not publish both items');
    const sourceValue = v.__cxx_anonymous_0.global;
    expect(v.defaultValue === -8191n && sourceValue === -8191n, 'Initial variable value differs');
    expect(a.size === 8n && a.pValues != null, 'Original array allocation differs');
    expect(sourceCString(v.szLabel,runtime.heap) === 'FACTORY_VAR' &&
      sourceCString(a.szLabel,runtime.heap) === 'FACTORY_ARRAY', 'Original label storage differs');
    expect(Number(hash.hash_find(script.h_gamevars,v.szLabel)) === 0 &&
      Number(hash.hash_find(script.h_arrays,a.szLabel)) === 0, 'Original hash lookup differs');
    variable.Gv_Clear();
    expect(count().every(x => x === 0), 'Original cleanup did not clear counts');
    expect(v.szLabel == null && a.szLabel == null && a.pValues == null, 'Original cleanup retained stale storage');
    return {original_creates_executed:2, original_cleanup_executed:true,
      values_and_owner_storage_verified:true, final_counts:count(), original_app_main_executed:false};
  } finally {
    release();
    runtime.close();
  }
}'''


class QuietHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript'}

    def log_message(self, *_):
        pass


class ProbeServer(HTTPServer):
    request_queue_size = 128


def main():
    server = ProbeServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=ROOT))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'), headless=True)
            page = browser.new_page()
            origin = f'http://127.0.0.1:{server.server_port}'
            page.goto(origin + '/engine-player.html')
            result = page.evaluate(PROBE, origin + '/' + PROFILE['boot_module_root'])
            result['chromium_version'] = browser.version
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    (ROOT / 'reports/nov17-original-con-gamevar-lifecycle.json').write_text(
        json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('PASS original game-variable and array creation and cleanup in Chromium')


if __name__ == '__main__':
    main()
