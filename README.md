# EDuke32 readable JavaScript port

Work in progress: the original game is not yet bootable or playable in JavaScript.
There is no verified playable `dist/index.html` and no JavaScript gameplay screenshot.

The project continues the existing Clang-based C/C++ source compiler, source-owned
storage, readable ES modules, cross-unit linker and browser platform adapters.
The intended release uses the original classic software renderer and single-player
gameplay in readable JavaScript. Native WebAssembly is permitted for SDL2,
platform/audio/timing services and low-level utilities; the game and Build
renderer must remain readable JavaScript. No emulation is permitted. Earlier map reconstructions and LLVM
execution diagnostics are not the target and are not playable release artifacts.

Read [CURRENT_PORT_STATUS.md](CURRENT_PORT_STATUS.md) and
[CONTINUE_HERE.md](CONTINUE_HERE.md) for the latest limitations and resume commands.
Native SDL2 services now pass real Chromium subsystem checks. Original console,
hash-table, platform initialization and global-storage dependencies still block boot.
The original checksum, gamma and selected memory/math behavior have scoped native
and Chromium verification. These subsystem tests do not establish game boot.

## Build and development

Install dependencies and configure Clang using [BUILD_PORTABILITY.md](BUILD_PORTABILITY.md).
Then use:

```sh
npm ci
npm run serve:project
npm run compile:game
npm run test:recovery
```

The strict game build currently fails incomplete-game acceptance. The active
browser profile selects 111 original Make units and excludes desktop dialogs,
GTK, enhanced renderers, multiplayer, mimalloc, optional external codecs and ALSA.
GNU Make is required for source selection. Compilation and recovery share this
configuration and select the original GenericAllocator backend. Read
[BROWSER_SERVICES.md](BROWSER_SERVICES.md) for the pinned native-services SDK.
Original engine startup and playable output remain unfinished.
The root launcher provides local build, test, acceptance and packaging actions.

## Assets and publication

Game data is not included in this public repository. Supply your own `DUKE3D.GRP`
locally. Do not commit GRP archives or generated HTML containing embedded game data.
The public player will load a local GRP; local offline builds may embed it.

The original source archives and license notices are preserved. Downloaded
compilers, raw AST caches, old builds and large generated databases are excluded.
`python tools/project_workspace.py package --public` creates a source-only archive;
the existing private continuation package can include local game data.

GitHub Actions currently runs basic source/runtime checks. Deployment is disabled
until original startup, menu, level rendering and controlled gameplay pass.
