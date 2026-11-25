"""Compare original input mapping against the native joystick implementation."""
import functools
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import threading

from playwright.sync_api import sync_playwright
from verify_original_vfs import MODULES, ProbeServer, Quiet, ROOT, SOURCE, run


JOYSTICK = 'source/mact/src/joystick.cpp'
BASELAYER = 'source/build/src/baselayer.cpp'
ANGLES = [-1, 0, 4400, 9000, 13500, 17999, 22500, 27000, 31500, 35999]
CHECK = r"""async ({base, modules, angles, stateBinding, activeBinding, flagsOffset}) => {
    const {NativeRuntime} = await import(base + '/runtime/index.mjs');
    const runtime = new NativeRuntime({memoryBytes:16 << 20});
    runtime.bindSourceMemory();
    const graph = base + '/' + modules;
    const release = (await import(graph + '/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
    try {
        const layer = await import(graph + '/source/build/src/baselayer.cpp.mjs');
        const platform = await import(graph + '/source/build/src/sdlayer.cpp.mjs');
        const map = await import(graph + '/source/mact/src/joystick.cpp.mjs');
        const joystick = layer[stateBinding]().value;
        const storage = joystick[Symbol.for('source-first.original-byte-record-storage/1')].bytes;
        const active = platform[activeBinding]();
        const hats = new Int32Array(1);
        joystick.pHat = hats;
        return Array.from({length:160}, (_, i) => {
            active.value = (i >> 1) & 1;
            storage[flagsOffset] = i & 1;
            joystick.numButtons = 4 + (i % 10);
            joystick.numHats = (i >> 2) & 1;
            joystick.bits = 0x801 | (i << 3);
            hats[0] = angles[i % angles.length];
            const row = [map.JOYSTICK_GetButtons(), map.JOYSTICK_GetControllerButtons(),
                         map.JOYSTICK_GetHat(0), map.JOYSTICK_GetHat(-1), map.JOYSTICK_GetHat(1)];
            map.JOYSTICK_ClearAllButtons();
            return [...row, joystick.bits];
        });
    } finally {
        release();
        runtime.close();
    }
}"""


def native(folder):
    source = (SOURCE / BASELAYER).read_text(encoding='utf-8')
    original_joy_read, = re.findall(r'^void joyReadButtons\([^\n]+$', source, re.M)
    driver = folder / 'joystick-oracle.cpp'
    executable = folder / 'joystick-oracle.exe'
    driver.write_text('#include <cstddef>\n#include <cstdio>\n#include "compat.h"\n#include "baselayer.h"\n#include "joystick.h"\n'
                      + 'controllerinput_t joystick {};\nchar appactive;\n'
                      + original_joy_read + '\nint main(){\n'
                      + 'int32_t angles[]={' + ','.join(map(str, ANGLES)) + '};\n' + r"""
int32_t hat;
printf("%zu\n", offsetof(controllerinput_t, flags));
joystick.pHat = &hat;
for(int i=0;i<160;i++){
    appactive = (i >> 1) & 1;
    joystick.isGameController = i & 1;
    joystick.numButtons = 4 + i % 10;
    joystick.numHats = (i >> 2) & 1;
    joystick.bits = 0x801 | (i << 3);
    hat = angles[i % (sizeof(angles)/sizeof(*angles))];
    const int buttons = JOYSTICK_GetButtons(), controller = JOYSTICK_GetControllerButtons();
    const int current = JOYSTICK_GetHat(0), negative = JOYSTICK_GetHat(-1), outside = JOYSTICK_GetHat(1);
    JOYSTICK_ClearAllButtons();
    printf("[%d,%d,%d,%d,%d,%d]\n", buttons, controller, current, negative, outside, joystick.bits);
}
}
""", encoding='utf-8')
    headers = ('source/build/include', 'source/mact/include', 'source/audiolib/include',
               'platform/Windows/include', 'platform/Windows/include/SDL2')
    run(['clang++', '-std=gnu++14', '-funsigned-char', '-DNOASM', '-DSDL_TARGET=2', '-DEDUKE32_BROWSER=1',
         *['-I' + str(SOURCE / header) for header in headers], driver, SOURCE / JOYSTICK, '-o', executable])
    offset, *rows = run([executable]).splitlines()
    return int(offset), [json.loads(row) for row in rows]


def binding(unit, variable):
    document = json.loads((MODULES / (unit + '.manifest.json')).read_bytes())
    row, = [row for row in document['definitions'] if row['name'] == variable and row['status'] == 'source-first']
    return row['global_storage']['binding']


def compare(actual, expected):
    assert len(actual) == len(expected)
    for index, (observed, reference) in enumerate(zip(actual, expected)):
        assert observed == reference, (index, observed, reference)


def main():
    info = {'modules': MODULES.relative_to(ROOT).as_posix(), 'angles': ANGLES,
            'stateBinding': binding(BASELAYER, 'joystick'),
            'activeBinding': binding('source/build/src/sdlayer.cpp', 'appactive')}
    with tempfile.TemporaryDirectory(dir=ROOT / 'work', prefix='joystick-native-') as directory:
        folder = Path(directory)
        info['flagsOffset'], expected = native(folder)
        runner = folder / 'run.mjs'
        runner.write_text('console.log(JSON.stringify(await (' + CHECK + ')('
                          + json.dumps({**info, 'base': ROOT.as_uri()}) + ')));', encoding='utf-8')
        compare(json.loads(run(['node', runner])), expected)

    with ProbeServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT))) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'], headless=True)
                try:
                    page = browser.new_page()
                    origin = 'http://127.0.0.1:' + str(server.server_port)
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.goto(origin + '/__original_vfs_probe__')
                    compare(page.evaluate(CHECK, {**info, 'base': origin}), expected)
                    assert not errors, errors
                finally:
                    browser.close()
        finally:
            server.shutdown()
            thread.join()
    report = {'passed': True, 'original_source': JOYSTICK,
              'source_sha256': hashlib.sha256((SOURCE / JOYSTICK).read_bytes()).hexdigest(),
              'native_rows': len(expected), 'native_node_values': len(expected) * 6,
              'native_chromium_values': len(expected) * 6, 'gameplay_verified': False}
    (ROOT / 'reports/nov25-original-joystick-parity.json').write_text(json.dumps(report, indent=2) + '\n',
                                                                       encoding='utf-8')
    print('PASS original joystick button, hat and clear behavior against native C++ in Node and Chromium')


if __name__ == '__main__':
    main()
