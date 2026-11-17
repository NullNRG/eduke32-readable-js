"""Exercise the linked original CON relocation with live browser allocations."""
import functools
import hashlib
import json
import os
import threading

from playwright.sync_api import sync_playwright
from verify_original_con_gamevars import ProbeServer, PROFILE, QuietHandler, ROOT

PROBE = r'''async ({base, cells}) => {
  const {NativeRuntime} = await import('/runtime/index.mjs');
  const runtime = new NativeRuntime({renderer:'canvas2d',memoryBytes:16<<20});
  runtime.bindSourceMemory();
  const release = (await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
  try {
    const layer = await import(base+'/source/build/src/baselayer.cpp.mjs');
    const units = {};
    for (const source of ['global','gamedef','gameexec'])
      units[source] = await import(base+'/source/duke3d/src/'+source+'.cpp.mjs');
    const cell = name => units[cells[name][0]][cells[name][1]]();
    layer.engineSetupAllocator();
    const heap=runtime.heap, addresses=globalThis[Symbol.for('source-lp64-addresses/2')];
    const allocate = size => layer.xrealloc__header_ac8ea5323fd6(null, BigInt(size));
    const [beginning,bitmap,states]=[allocate(128),allocate(3),allocate(3)].map(p=>Number(addresses.encode(p)));
    for (const [offset,size] of [[beginning,128],[bitmap,3],[states,3]])
      new Uint8Array(heap.buffer,offset,size).fill(0);
    const view=()=>new DataView(heap.buffer);
    view().setBigInt64(beginning+8,BigInt(beginning+24),true);
    view().setBigInt64(beginning+16,804n,true);
    view().setUint8(bitmap,2);
    cell('apScript').value=addresses.decode(BigInt(beginning));
    cell('g_scriptPtr').value=addresses.decode(BigInt(beginning+32));
    cell('g_scriptSize').value=16;
    cell('bitptr').value=addresses.decode(BigInt(bitmap));
    cell('bitstate').value=addresses.decode(BigInt(states));
    cell('g_currentEvent').value=0;
    units.gameexec.VM_ScriptInfo(addresses.decode(BigInt(beginning+16)),4);
    units.gamedef.C_SetScriptSize(24);
    const moved=Number(addresses.encode(cell('apScript').value));
    const cursor=Number(addresses.encode(cell('g_scriptPtr').value));
    if (cell('g_scriptSize').value!==24 || cursor-moved!==32 ||
        view().getBigInt64(moved+8,true)!==BigInt(moved+24) ||
        view().getBigInt64(moved+16,true)!==804n ||
        new Uint8Array(heap.buffer,moved+128,64).some(Boolean)) {
      throw Error('Original CON relocation lost script data or pointer offsets');
    }
    return {diagnostic_executed:true,resize_executed:true,old_count:16,new_count:24,
            pointer_relocated:moved!==beginning,original_app_main_executed:false};
  } finally {
    release();
    runtime.close();
  }
}'''


def main():
    modules = ROOT / PROFILE['boot_module_root'] / 'source/duke3d/src'
    cells = {}
    for unit, names in {
        'global': ('apScript', 'g_scriptPtr', 'g_scriptSize'),
        'gamedef': ('bitptr', 'bitstate'),
        'gameexec': ('g_currentEvent',),
    }.items():
        doc = json.loads((modules / (unit + '.cpp.manifest.json')).read_text())
        for name in names:
            definition, = [row for row in doc['definitions']
                           if row['name'] == name and row['status'] == 'source-first']
            cells[name] = (unit, definition['global_storage']['binding'])
    server = ProbeServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=ROOT))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'), headless=True)
            page = browser.new_page()
            origin = f'http://127.0.0.1:{server.server_port}'
            modules_loaded = set()
            def record_module(response):
                if response.ok and response.url.startswith(origin + '/') and response.url.endswith('.mjs'):
                    modules_loaded.add(response.url.removeprefix(origin + '/'))
            page.on('response', record_module)
            page.goto(origin + '/engine-player.html')
            result = page.evaluate(PROBE, {'base': origin + '/' + PROFILE['boot_module_root'], 'cells': cells})
            result['chromium_version'] = browser.version
            result['module_sha256'] = {
                module: hashlib.sha256((ROOT / module).read_bytes()).hexdigest()
                for module in sorted(modules_loaded)
            }
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    (ROOT / 'reports/nov17-original-con-script-resize.json').write_text(
        json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('PASS original script diagnostics and allocation relocation in Chromium')


if __name__ == '__main__':
    main()
