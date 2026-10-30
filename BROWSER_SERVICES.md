# Readable engine with native browser services

The current user-approved boundary allows WebAssembly for SDL2, platform
services, timing and audio backends. EDuke32 game logic, Build world rendering,
actors, physics, weapons, CON, menus and the game loop remain readable JavaScript.
GRP handling, assets, virtual files and save persistence also remain JavaScript.
Earlier blanket bans on all shipped WASM are historical instructions.

The service build compiles only `runtime/native_services/sdl_services.c`, SDL2
and the Emscripten runtime. It includes no original EDuke32/Build/Mapster units.
`tools/build_browser_services.py` records dependency hashes, source inputs,
exports, SDK identity and the actual WASM/glue hashes. This is an implementation
boundary, not evidence of a booted game.

The game compiler retains Linux LP64. Services use wasm32. Engine pointers must
never be truncated into service pointers. The bridge copies bounded buffers and
uses owned opaque window/device handles. SDL_Surface and SDL_Event must not be
aliased across the two ABIs. The first NativeRuntime integration routes native
performance counters/frequency and the three-byte version record; existing host
event timestamps remain coherent. Full original SDL surface/event integration
and original gameplay still require verification.

Install the pinned SDK locally; it is excluded from source releases:

```powershell
git clone --depth 1 https://github.com/emscripten-core/emsdk.git work/dependencies/emsdk
python work/dependencies/emsdk/emsdk.py install 6.0.13
python work/dependencies/emsdk/emsdk.py activate 6.0.13
python tools/build_browser_services.py
```

The SDL2 module provides native timing, software presentation of supplied RGBA
or indexed pixels, an explicit event envelope, and a queued signed-16-bit PCM
output device. It does not draw a replacement world or generate game simulation.
The asset-free public player and private embedded-GRP HTML remain blocked until
the original JavaScript startup and gameplay pass. Offline packaging must embed
the exact audited service WASM bytes and glue, with no remote dependency.
