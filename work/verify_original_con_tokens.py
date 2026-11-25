"""Compare original CON character classifiers against native Clang output."""
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

UNIT = 'source/duke3d/src/gamedef.cpp'
FUNCTIONS = ('ispecial', 'isaltok', 'isdigterm', 'C_IsLabelChar')
CHECK = r"""async base => {
    const {NativeRuntime} = await import(base + '/runtime/index.mjs');
    const runtime = new NativeRuntime({memoryBytes: 16 << 20});
    runtime.bindSourceMemory();
    const moduleRoot = base + '/' + MODULES;
    const release = (await import(moduleRoot + '/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
    try {
        const module = await import(moduleRoot + '/' + UNIT + '.mjs');
        return Array.from({length: 256}, (_, c) =>
            [module.ispecial(c), module.isaltok(c), module.isdigterm(c),
             module.C_IsLabelChar(c, 0), module.C_IsLabelChar(c, 1)].map(Number));
    } finally {
        release();
        runtime.close();
    }
}""".replace('MODULES', json.dumps(MODULES.relative_to(ROOT).as_posix())).replace('UNIT', json.dumps(UNIT))


def native_values(folder, source):
    definitions = []
    for name in FUNCTIONS:
        matches = re.findall(r'^static inline bool ' + re.escape(name) + r'\([^\n]+\n\{.*?^\}', source, re.M | re.S)
        assert len(matches) == 1, name
        definitions.append(matches[0])
    driver = folder / 'tokens.cpp'
    executable = folder / 'tokens.exe'
    driver.write_text('#include <ctype.h>\n#include <stdint.h>\n#include <stdio.h>\n' + '\n'.join(definitions) + r"""
int main() {
    for (int byte=0; byte<256; ++byte) {
        const char c = static_cast<char>(byte);
        printf("[%d,%d,%d,%d,%d]\n", ispecial(c), isaltok(c), isdigterm(c),
               C_IsLabelChar(c,0), C_IsLabelChar(c,1));
    }
}
""", encoding='utf-8')
    run(['clang++', '-std=gnu++14', '-funsigned-char', driver, '-o', executable])
    return [json.loads(line) for line in run([executable]).splitlines()]


def main():
    source_path = SOURCE / UNIT
    with tempfile.TemporaryDirectory(dir=ROOT / 'work', prefix='con-tokens-') as temporary:
        folder = Path(temporary)
        expected = native_values(folder, source_path.read_text(encoding='utf-8'))
        node = folder / 'run.mjs'
        node.write_text('console.log(JSON.stringify(await (' + CHECK + ')(' + json.dumps(ROOT.as_uri()) + ')));',
                        encoding='utf-8')
        assert json.loads(run(['node', node])) == expected

    with ProbeServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT))) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'], headless=True)
                try:
                    origin = 'http://127.0.0.1:' + str(server.server_port)
                    page = browser.new_page()
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.goto(origin + '/__original_vfs_probe__')
                    assert page.evaluate(CHECK, origin) == expected
                    assert not errors, errors
                finally:
                    browser.close()
        finally:
            server.shutdown()
            thread.join()
    report = {'passed': True, 'source': UNIT, 'source_sha256': hashlib.sha256(source_path.read_bytes()).hexdigest(),
              'functions': FUNCTIONS, 'native_node_values': 1280, 'native_chromium_values': 1280,
              'gameplay_verified': False}
    (ROOT / 'reports/nov25-original-con-token-classification.json').write_text(json.dumps(report, indent=2) + '\n',
                                                                              encoding='utf-8')
    print('PASS 1,280 original CON token values against native Clang in Node and Chromium')


if __name__ == '__main__':
    main()
