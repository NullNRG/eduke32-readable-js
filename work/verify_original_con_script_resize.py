"""Exercise the linked original CON relocation with live browser allocations."""
import argparse
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
    const pointerBitmap = Number(addresses.encode(cell('bitptr').value));
    const stateBitmap = Number(addresses.encode(cell('bitstate').value));
    view().setUint8(pointerBitmap, 255);
    view().setUint8(stateBitmap, 255);
    const compiler = units.gamedef;
    const slot = index => addresses.decode(BigInt(moved + 8 * index));
    compiler.scriptWriteValue(-1709);
    compiler.scriptWriteAtOffset(701, slot(5));
    compiler.scriptWritePointer(BigInt(moved + 24), slot(6));
    compiler.scriptWriteStateLocation(131, slot(7));
    const expected = [-1709n, 701n, BigInt(moved + 24), 131n];
    if (expected.some((value, index) => view().getBigInt64(moved + 8 * (index + 4), true) !== value) ||
        addresses.encode(cell('g_scriptPtr').value) !== BigInt(moved + 40) ||
        view().getUint8(pointerBitmap) !== 0x4f ||
        view().getUint8(stateBitmap) !== 0x8f) {
      throw Error('Original CON writers changed the wrong bits, word, or script cursor');
    }
    const hash = await import(base+'/source/build/src/hash.cpp.mjs');
    const labels = cell('h_labels').value;
    hash.hash_init(labels);
    try {
      const input = new TextEncoder().encode('// compiler input\n-2147483648 0x7fffffff 42\0');
      cell('textptr').value = input;
      cell('g_scriptPtr').value = slot(8);
      for (const [index, value] of [-2147483648n, 2147483647n, 42n].entries()) {
        if (compiler.C_GetNextValue(1) !== 0 || view().getBigInt64(moved + 8 * (8 + index), true) !== value) {
          throw Error('Original CON parser did not write the literal at index '+index);
        }
      }
      if (compiler.C_GetNextValue(1) !== -1 || addresses.encode(cell('g_scriptPtr').value) !== BigInt(moved + 88)) {
        throw Error('Original CON parser did not retain the script cursor at EOF');
      }
    } finally {
      hash.hash_free(labels);
    }
    return {diagnostic_executed:true,resize_executed:true,old_count:16,new_count:24,
            script_writer_cases:4,shared_script_cursor_verified:true,relocation_bitmaps_verified:true,
            parsed_original_con_literals:3,original_con_eof_verified:true,
            pointer_relocated:moved!==beginning,original_app_main_executed:false};
  } finally {
    release();
    runtime.close();
  }
}'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', default='reports/nov17-original-con-script-resize.json')
    args = parser.parse_args()
    modules = ROOT / PROFILE['boot_module_root'] / 'source/duke3d/src'
    cells = {}
    for unit, names in {
        'global': ('apScript', 'g_scriptPtr', 'g_scriptSize'),
        'gamedef': ('bitptr', 'bitstate', 'h_labels', 'textptr'),
        'gameexec': ('g_currentEvent',),
    }.items():
        doc = json.loads((modules / (unit + '.cpp.manifest.json')).read_text())
        for name in names:
            definition, = [row for row in doc['definitions']
                           if row['name'] == name and row['status'] == 'source-first']
            declaration = definition.get('global_storage') or definition['private_storage']
            cells[name] = (unit, declaration['binding'])
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
    (ROOT / args.report).write_text(
        json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('PASS original CON relocation, script writes, and literal parsing in Chromium')


if __name__ == '__main__':
    main()
