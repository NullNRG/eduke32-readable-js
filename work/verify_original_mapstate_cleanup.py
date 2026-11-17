"""Execute the original map-state cleanup on allocations from the game heap."""
import json
import os
import sys
import threading
from http.server import ThreadingHTTPServer

from playwright.sync_api import sync_playwright
from verify_original_con_gamevars import PROFILE, ROOT

sys.path.insert(0, str(ROOT / 'tools'))
from project_launcher import Handler, Project

PROBE = r'''async base => {
  const {NativeRuntime} = await import('/runtime/index.mjs');
  const runtime = new NativeRuntime({renderer:'canvas2d', memoryBytes:16<<20});
  runtime.bindSourceMemory();
  const release = (await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
  try {
    const layer = await import(base+'/source/build/src/baselayer.cpp.mjs');
    const hash = await import(base+'/source/build/src/hash.cpp.mjs');
    const script = await import(base+'/source/duke3d/src/gamedef.cpp.mjs');
    const vars = await import(base+'/source/duke3d/src/gamevars.cpp.mjs');
    const {g_mapInfo} = await import(base+'/source/duke3d/src/global.cpp.mjs');
    const {G_FreeMapState} = await import(base+'/source/duke3d/src/premap.cpp.mjs');
    layer.engineSetupAllocator();
    hash.hash_init(script.h_arrays);
    hash.hash_init(script.h_gamevars);
    const cString = text => new TextEncoder().encode(text+'\0');
    vars.Gv_NewVar(cString('CLEANUP_VAR'), 0n, 1);
    vars.Gv_NewArray(cString('CLEANUP_ARRAY'), null, 2n, 16);
    const heap = runtime.heap, addresses = globalThis[Symbol.for('source-lp64-addresses/2')];
    const allocate = size => layer.xaligned_alloc__header_f5f88f9b86b8(16n, BigInt(size));
    // These extents and offsets are from the selected Clang mapstate_t layout.
    const size=4345416, varOffset=4240960, arrayOffset=4257344;
    const board=g_mapInfo[0];
    G_FreeMapState(0);
    const before=heap.allocations.size;
    board.savedstate=allocate(size);
    const block=Number(addresses.encode(board.savedstate));
    const view = new DataView(heap.buffer,block,size);
    view.setBigUint64(varOffset,addresses.encode(allocate(16)),true);
    view.setBigUint64(arrayOffset,addresses.encode(allocate(16)),true);
    if (heap.allocations.size!==before+3) throw Error('Source fixture allocation count differs');
    G_FreeMapState(0);
    if (board.savedstate!==null || heap.allocations.size!==before)
      throw Error('Original cleanup did not clear all three allocations');
    G_FreeMapState(0);
    vars.Gv_Clear();
    return {original_mapstate_cleanup_executed:true, released_allocations:3,
            snapshot_bytes:size, variable_pointer_offset:varOffset, array_pointer_offset:arrayOffset};
  } finally {
    release();
    runtime.close();
  }
}'''


def main():
    with ThreadingHTTPServer(('127.0.0.1', 0), Handler) as server:
        server.project = Project()
        threading.Thread(target=server.serve_forever, daemon=True).start()
        origin = f'http://127.0.0.1:{server.server_port}'
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'), headless=True)
                page = browser.new_page()
                page.goto(origin + '/engine-player.html')
                result = page.evaluate(PROBE, origin + '/' + PROFILE['boot_module_root'])
                result['project_launcher_imports_verified'] = True
                result['chromium_version'] = browser.version
                browser.close()
        finally:
            server.shutdown()
    (ROOT / 'reports/nov17-original-mapstate-cleanup.json').write_text(
        json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('PASS original map-state cleanup in Chromium')


if __name__ == '__main__':
    main()
