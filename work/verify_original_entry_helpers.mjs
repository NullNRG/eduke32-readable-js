import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { NativeRuntime } from '../runtime/index.mjs';

const profile = JSON.parse(await readFile(new URL('../tools/browser_classic_profile.json', import.meta.url), 'utf8'));
const moduleRoot = new URL(`../${profile.boot_module_root}/`, import.meta.url);
const { bindBrowserC } = await import(new URL('browser-abi/libc_provider.mjs', moduleRoot));
const runtime = new NativeRuntime({ memoryBytes: 16 << 20 });
runtime.bindSourceMemory();
const release = bindBrowserC(runtime);

try {
    const game = await import(new URL('source/duke3d/src/game.cpp.mjs', moduleRoot));
    const { CONTROL_Flags } = await import(new URL('source/mact/src/control.cpp.mjs', moduleRoot));
    const decode = bytes => new TextDecoder().decode(bytes.subarray(0, bytes.indexOf(0)));
    assert.equal(game.dukeVerbosityCallback(-1), null);
    assert.equal(decode(game.dukeVerbosityCallback(9)), 'VM');
    assert.equal(decode(game.dukeVerbosityCallback(10)), 'CON');
    assert.equal(game.dukeVerbosityCallback(11), null);

    const registered = () => Array.from(CONTROL_Flags, (flag, index) => flag.used ? index : -1)
        .filter(index => index >= 0);
    assert.deepEqual(registered(), []);
    game.G_SetupGameButtons();
    const flags = registered();
    assert.equal(flags.length, 59);
    assert.ok(flags.every(index => {
        const flag = CONTROL_Flags[index];
        return !flag.active && !flag.buttonheld && !flag.cleared && !flag.toggle;
    }));

    console.log(JSON.stringify({ passed: true, verbosity_cases: 4, registered_game_buttons: flags }, null, 2));
} finally {
    release();
    runtime.close();
}
