"""Compare the exact original pointer relocation function against the linked JS."""
import functools
import argparse
import hashlib
import json
import os
import re
import subprocess
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PROFILE = json.loads((ROOT / 'tools/browser_classic_profile.json').read_text())
SOURCE = ROOT / PROFILE['prepared_source_root'] / 'source/duke3d/src'
MODULE = PROFILE['boot_module_root'] + '/source/duke3d/src/savegame.cpp.mjs'
BODY = (SOURCE / 'savegame.cpp').read_text()
DEFINITION = BODY[BODY.index('void G_Util_PtrToIdx2('):].split('\n}\n', 1)[0] + '\n}\n'
HEADER = (SOURCE / 'savegame.h').read_text()
ENUM = re.search(r'enum\s*\{\s*P2I_BACK_BIT[^}]+\};', HEADER)[0]
NATIVE = r'''
int main() {
    uint8_t script[2048]={};
    intptr_t base = reinterpret_cast<intptr_t>(script);
    for(int trial=0;trial<256;++trial){
        intptr_t slots[80];
        for(int i=0;i<80;i++)slots[i]=-45678+i;
        int step=1+(trial%5), count=1+((trial>>2)%13);
        bool only=trial%2;
        for(int i=0;i<count;i++)
            slots[step*i]=(only && (i+trial)%4==0)?0:base+8*(1+(trial*11+i*17)%200);
        G_Util_PtrToIdx2(slots,count,step*sizeof(intptr_t),script,only?P2I_FWD_NON0:P2I_FWD);
        for(int i=0;i<80;i++)printf("%lld ",(long long)slots[i]);
        G_Util_PtrToIdx2(slots,count,step*sizeof(intptr_t),script,only?P2I_BACK_NON0:P2I_BACK);
        for(int i=0;i<80;i++){
            auto value=slots[i];
            if(i%step==0 && i/step<count && value)value-=base;
            printf("%lld%s",(long long)value,i==79?"\n":" ");
        }
    }
}
'''
JS = r'''async ({moduleUrl, runtimeUrl, libcUrl, modes})=>{
  const {NativeRuntime}=await import(runtimeUrl);
  const runtime=new NativeRuntime({memoryBytes:16<<20});
  runtime.bindSourceMemory();
  const release=(await import(libcUrl)).bindBrowserC(runtime);
  try {
  const source=await import(moduleUrl), result=[];
  const addresses=globalThis[Symbol.for('source-lp64-addresses/2')];
  const script=new Uint8Array(2048), base=addresses.encode(script);
  for(let trial=0;trial<256;trial++){
    const slots=BigInt64Array.from({length:80},(_,i)=>BigInt(-45678+i));
    const step=1+(trial%5), count=1+((trial>>2)%13), only=trial%2;
    for(let i=0;i<count;i++)
      slots[step*i]=only && (i+trial)%4===0?0n:base+BigInt(8*(1+(trial*11+i*17)%200));
    source.G_Util_PtrToIdx2(slots,count,BigInt(step*8),script,modes[only?2:0]);
    const forward=Array.from(slots,String);
    source.G_Util_PtrToIdx2(slots,count,BigInt(step*8),script,modes[only?3:1]);
    result.push([...forward,...Array.from(slots,(value,i)=>String(
      i%step===0 && i/step<count && value!==0n?value-base:value))].join(' '));
  }
    return result;
  } finally {release();runtime.close();}
}'''


class QuietHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript'}

    def log_message(self, *_):
        pass


def run(args):
    result = subprocess.run(list(map(str, args)), cwd=ROOT, capture_output=True,
                            text=True, timeout=120)
    if result.returncode:
        raise RuntimeError(result.stderr[-3000:])
    return result.stdout.splitlines()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path,
                        default=ROOT / 'reports/nov16-original-script-relocation-parity.json')
    options = parser.parse_args()
    modes = [sum(map(int, re.search(r'\b' + key + r'\s*=\s*([0-9+]+)', ENUM)[1].split('+')))
             for key in ('P2I_FWD', 'P2I_BACK', 'P2I_FWD_NON0', 'P2I_BACK_NON0')]
    with tempfile.TemporaryDirectory(prefix='original-script-relocation-') as temp:
        temp = Path(temp)
        driver = temp / 'oracle.cpp'
        driver.write_text('#include <stdint.h>\n#include <cstdio>\nusing bssize_t = intptr_t;\n'
                          + ENUM + '\n' + DEFINITION + NATIVE, encoding='utf-8')
        exe = temp / 'oracle.exe'
        run(['clang++', '-std=c++17', '-O2', driver, '-o', exe])
        expected = run([exe])
        assert len(expected) == 256
        node = temp / 'test.mjs'
        runtime = 'runtime/index.mjs'
        libc = PROFILE['boot_module_root'] + '/browser-abi/libc_provider.mjs'
        args = {'moduleUrl': (ROOT / MODULE).as_uri(), 'runtimeUrl': (ROOT / runtime).as_uri(),
                'libcUrl': (ROOT / libc).as_uri(), 'modes': modes}
        node.write_text('console.log((await (' + JS + ')(' + json.dumps(args)
                        + ')).join("\\n"));', encoding='utf-8')
        assert run(['node', node]) == expected
        server = ThreadingHTTPServer(('127.0.0.1', 0),
                                     functools.partial(QuietHandler, directory=ROOT))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'), headless=True)
                page = browser.new_page()
                address = f'http://127.0.0.1:{server.server_port}'
                page.goto(address + '/engine-player.html', wait_until='domcontentloaded')
                assert page.evaluate(JS, {**args, 'moduleUrl': address + '/' + MODULE,
                                          'runtimeUrl': address + '/' + runtime,
                                          'libcUrl': address + '/' + libc}) == expected
                version = browser.version
                browser.close()
        finally:
            server.shutdown()
            server.server_close()
    report = {'native_source': 'source/duke3d/src/savegame.cpp', 'function': 'G_Util_PtrToIdx2',
              'definition_sha256': hashlib.sha256(DEFINITION.encode()).hexdigest(),
              'native_node_chromium_cases': len(expected), 'compared_words': 256 * 160,
              'native_output_sha256': hashlib.sha256('\n'.join(expected).encode()).hexdigest(),
              'browser_version': version, 'modes': modes, 'gameplay_verified': False}
    options.report.write_text(
        json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print('PASS: 256 native/Node/Chromium original relocation cases; all four modes, strides, null entries and unrelated words')


if __name__ == '__main__':
    main()
