import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { NativeRuntime } from '../runtime/index.mjs';
import { sourceAddressSpace } from '../tools/source_address_runtime.mjs';

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

    const source = 'source/duke3d/src/game.cpp';
    const manifestPath = new URL(source + '.manifest.json', moduleRoot);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const callable = name => {
        const definitions = manifest.definitions.filter(row => row.source_name === name
            && row.cpp_function_identity?.translation_unit === source && row.status === 'source-first');
        assert.equal(definitions.length, 1, name);
        assert.equal(typeof game[definitions[0].name], 'function');
        return game[definitions[0].name];
    };
    const malloc = callable('xmalloc');
    const realloc = callable('xrealloc');
    const releaseAnimation = callable('G_FreeHashAnim');
    const destroyAllocator = callable('engineDestroyAllocator');
    const { engineSetupAllocator } = await import(new URL('source/build/src/baselayer.cpp.mjs', moduleRoot));
    engineSetupAllocator();
    const originalAllocationCount = runtime.heap.allocations.size;
    let retainedBytes = 0;
    for (let size = 1; size <= 128; size++) {
        const expected = Uint8Array.from({ length: size }, (_, index) => (index * 13 + size) & 255);
        const allocation = malloc(BigInt(size));
        new Uint8Array(allocation.buffer, allocation.offset, size).set(expected);
        const resized = realloc(allocation, BigInt(size + 53));
        assert.deepEqual(new Uint8Array(resized.buffer, resized.offset, size), expected);
        const address = sourceAddressSpace.encode(resized);
        assert.equal(address % 16n, 0n);
        releaseAnimation(null, BigInt.asIntN(64, address));
        assert.equal(runtime.heap.allocations.size, originalAllocationCount);
        retainedBytes += size;
    }
    destroyAllocator();
    console.log(JSON.stringify({ passed: true, verbosity_cases: 4, registered_game_buttons: flags,
        allocation_cases: 128, preserved_bytes: retainedBytes, gameplay_verified: false }, null, 2));
} finally {
    release();
    runtime.close();
}
