"""Compare linked CON label tables with the selected Clang target's native object."""
import functools
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from source_first_toolchain import frontend_config
from source_semantic_index import captured_args

SOURCE = 'source/duke3d/src/gamestructures.cpp'
TABLES = ('ActorLabels', 'InputLabels', 'PalDataLabels', 'PlayerLabels',
          'ProjectileLabels', 'SectorLabels', 'TileDataLabels', 'TsprLabels',
          'UserdefsLabels', 'WallLabels')
PROFILE = json.loads((ROOT / 'tools/browser_classic_profile.json').read_text())
MODULE = PROFILE['boot_module_root'] + '/' + SOURCE + '.mjs'


def native_rows(folder):
    command = next(row for row in json.loads((ROOT / PROFILE['derived_commands']).read_text())
                   if row['file'] == SOURCE)
    layout = folder / 'assert-layout.h'
    layout.write_text('#include "gamestructures.h"\n'
                      'static_assert(sizeof(memberlabel_t)==16, "size");\n'
                      'static_assert(__builtin_offsetof(memberlabel_t,name)==0, "name");\n'
                      'static_assert(__builtin_offsetof(memberlabel_t,lId)==8, "lId");\n'
                      'static_assert(__builtin_offsetof(memberlabel_t,flags)==10, "flags");\n'
                      'static_assert(__builtin_offsetof(memberlabel_t,maxParm2)==12, "maxParm2");\n'
                      'static_assert(__builtin_offsetof(memberlabel_t,offset)==14, "offset");\n')
    elf = folder / 'gamestructures.o'
    subprocess.run([frontend_config()[0], *captured_args(command), '-I', 'source/duke3d/src',
                    '-include', str(layout), '-fno-data-sections', '-c', SOURCE, '-o', str(elf)],
                   cwd=command['directory'], capture_output=True, text=True, check=True, timeout=90)
    result = subprocess.check_output(['llvm-readobj', '--symbols', '--sections', '--relocations',
                                      '--expand-relocs', '--elf-output-style=JSON', str(elf)],
                                     text=True, timeout=30)
    data = json.loads(result)[0]
    assert data['FileSummary']['Format'] == 'elf64-x86-64'
    sections = {entry['Section']['Index']: entry['Section'] for entry in data['Sections']}
    symbols = [entry['Symbol'] for entry in data['Symbols']]
    blob = elf.read_bytes()
    expected = {}
    for name in TABLES:
        table, = [s for s in symbols if s['Name']['Name'] == name]
        section = sections[table['Section']['Value']]
        relocs = {r['Relocation']['Offset']: r['Relocation']
                  for group in data['Relocations']
                  if sections[group['SectionIndex']]['Info'] == section['Index']
                  for r in group['Relocs']}
        assert table['Size'] and table['Size'] % 16 == 0
        rows = []
        for slot in range(table['Value'], table['Value'] + table['Size'], 16):
            types = struct.unpack_from('<hHhh', blob, section['Offset'] + slot + 8)
            reloc = relocs.get(slot)
            if reloc:
                assert reloc['Type']['Name'] == 'R_X86_64_64'
                symbol = symbols[reloc['Symbol']['Value']]
                strings = sections[symbol['Section']['Value']]
                start = strings['Offset'] + symbol['Value'] + reloc['Addend']
                limit = strings['Offset'] + strings['Size']
                label = blob[start:blob.index(b'\0', start, limit)].decode('utf-8')
            else:
                assert not any(blob[section['Offset'] + slot:section['Offset'] + slot + 8])
                label = None
            rows.append([label, *types])
        expected[name] = rows
    return expected


EVALUATE = '''async ({url, root, base, tables, initialize}) => {
  const module = await import(url);
  const {sourceCString} = await import(root + 'runtime/source_bytes.mjs');
  const rows = Object.fromEntries(tables.map(name => [name, Array.from(module[name], row =>
    [row.name == null ? null : sourceCString(row.name), row.lId, row.flags, row.maxParm2, row.offset])]));
  if (!initialize) return {rows};
  const {NativeRuntime} = await import(root + 'runtime/index.mjs');
  const runtime = new NativeRuntime({renderer:'canvas2d',memoryBytes:16<<20});
  runtime.bindSourceMemory();
  const release = (await import(base + '/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
  try {
    const layer = await import(base + '/source/build/src/baselayer.cpp.mjs');
    const hash = await import(base + '/source/build/src/hash.cpp.mjs');
    layer.engineSetupAllocator();
    module.VM_InitHashTables();
    const storage = ['h_actor','h_input','h_paldata','h_player','h_projectile',
                     'h_sector','h_tiledata','h_tsprite','h_userdef','h_wall'];
    let checked = 0;
    for (let i = 0; i < tables.length; i++) {
      const records = module[tables[i]];
      const first = new Map();
      for (let j = 0; j < records.length; j++) {
        const label = rows[tables[i]][j][0];
        if (label == null || first.has(label)) continue;
        first.set(label,j);
        const lookup = Number(hash.hash_find(module[storage[i]],records[j].name));
        if (lookup !== j) throw Error('Original hash lookup differs for '+tables[i]+' '+label+': '+lookup+' vs '+j);
        checked++;
      }
    }
    return {rows, checked};
  } finally {
    release();
    runtime.close();
  }
}'''


class QuietHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript'}

    def log_message(self, *_):
        pass


def main():
    with tempfile.TemporaryDirectory(prefix='original-con-label-oracle-') as temp:
        folder = Path(temp)
        expected = native_rows(folder)
        args = {'url': (ROOT / MODULE).as_uri(), 'root': ROOT.as_uri() + '/',
                'tables': TABLES, 'initialize': False}
        runner = folder / 'compare.mjs'
        runner.write_text('console.log(JSON.stringify(await (' + EVALUATE + ')(' + json.dumps(args) + ')));')
        node = subprocess.check_output(['node', str(runner)], cwd=ROOT, text=True, timeout=35)
        assert json.loads(node)['rows'] == expected, 'Node label rows differ from native object'
        server = ThreadingHTTPServer(('127.0.0.1', 0),
                                     functools.partial(QuietHandler, directory=ROOT))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'), headless=True)
                page = browser.new_page()
                origin = f'http://127.0.0.1:{server.server_port}'
                page.goto(origin + '/engine-player.html')
                got = page.evaluate(EVALUATE, {**args, 'url': origin + '/' + MODULE,
                                              'root': origin + '/',
                                              'base': origin + '/' + PROFILE['boot_module_root'],
                                              'initialize': True})
                assert got['rows'] == expected
                assert got['checked'] == sum(len({row[0] for row in rows if row[0] is not None})
                                             for rows in expected.values())
                version = browser.version
                browser.close()
        finally:
            server.shutdown()
            server.server_close()
    counts = {name: len(rows) for name, rows in expected.items()}
    report = {'source': SOURCE, 'native_target': 'elf64-x86-64', 'passed': True,
              'tables': counts, 'row_count': sum(counts.values()),
              'compared_fields': ['name', 'lId', 'flags', 'maxParm2', 'offset'],
              'compiler_native_rows_sha256': hashlib.sha256(json.dumps(expected).encode()).hexdigest(),
              'node_and_chromium_matched': True, 'chromium_version': version,
              'original_vm_hash_initialization_executed': True,
              'original_vm_hash_lookups_checked': got['checked'],
              'original_con_compilation_verified': False}
    (ROOT / 'reports/nov17-original-con-structure-label-parity.json').write_text(
        json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(f'PASS {sum(counts.values())} original label rows across Node, Chromium and native object')


if __name__ == '__main__':
    main()
