# EDuke32 readable JavaScript port

November 19 checkpoint: the original JavaScript Build engine loads the supplied GRP, ART and E1L1 MAP, initializes video and palettes, and renders rooms and masks in Chromium. The latest capture has zero page exceptions; original font initialization and 105 native text-parser cases also pass. [Current rendering evidence](reports/nov19-original-text-startup-frame.json).

Original `VM_Execute` passes source lowering but still has unresolved original providers. The active module now includes 41 additional closed header definitions and a native/browser-verified user-map query. All 11 targeted compiler regressions pass. Original `app_main`, game menus, simulation and the offline playable `dist/index.html` remain unverified. [Current status](CURRENT_PORT_STATUS.md) · [Resume commands](CONTINUE_HERE.md) · [Current regression evidence](reports/nov19-record-access-cache-regressions.json).

## Original font startup verified — November 16

Original `G_InitText` and the text parser now execute in the JavaScript engine. Native comparisons cover 1,536 font-table entries and 105 parser cases; the frozen local compiler profile passes **65/65**. Read [current status](CURRENT_PORT_STATUS.md) and [standard-library service scope](STANDARD_LIBRARY_ADAPTERS.md). **Original app_main, menus and playable gameplay remain incomplete.**

## November 16 integration checkpoint

The frozen local compiler CI profile passes **62/62**. Original command-line defaults and lookup-resource loading now execute in Node and Chromium; cross-file overload identity and collision recovery are integrated. Read [current status](CURRENT_PORT_STATUS.md) for the exact collision evidence and remaining startup dependencies. **Original app_main and playable gameplay remain incomplete.** No paid or hosted builds were used.

Open the developer dashboard with `npm run serve:project`, then choose **Open GRP / level launcher**, or visit `/engine-player.html` on the local server. Select your GRP and MAP; assets stay in your browser. This is a source-engine frame preview, not playable gameplay. Direct file:// module loading is unsupported.

Read [PORT_GUIDE.md](PORT_GUIDE.md) for what works, how the translation and browser adapters work, the current milestones, remaining work and exact commands.

Original **E1L1 rooms and sprites now render in Chromium through the original Build engine in readable JavaScript**. The full game is not playable yet. Original app_main, CON/menu startup, controls, weapons/enemies, audio and saves remain unverified. There is no verified playable dist/index.html.

![Original JavaScript Build rooms and sprites; raw-map component, not gameplay](reports/evidence/nov19-original-text-startup.png)

[Execution report](reports/nov19-original-text-startup-frame.json) binds original GRP/ART/MAP loading, sky, room/mask drawing and stable repeated presentation to exact source modules and runtime bytes. Read CURRENT_PORT_STATUS.md for test scope and remaining work. The user prohibits paid external services; verification runs locally and GitHub checkpoint commits use [skip ci].

November 13 checkpoint: original `Anim_Init` executes in Node and Chromium and matches native C++ for all 12 animation records and 44 sound cues. Shared reference-member/static-lifetime lowering passes native comparisons, and all 59 local compiler CI-profile checks pass under unchanged inputs. See [animation verification](reports/nov13-original-animation-init.json) and the [current startup frontier](reports/nov13-app-main-current-frontier.json). The full game still does not boot.

The project continues the existing Clang-based C/C++ source compiler, source-owned
storage, readable ES modules, cross-unit linker and browser platform adapters.
The intended release uses the original classic software renderer and single-player
gameplay in readable JavaScript. Native WebAssembly is permitted for SDL2,
platform/audio/timing services and low-level utilities; the game and Build
renderer must remain readable JavaScript. No emulation is permitted. Earlier map reconstructions and LLVM
execution diagnostics are not the target and are not playable release artifacts.

Read [CURRENT_PORT_STATUS.md](CURRENT_PORT_STATUS.md) and
[CONTINUE_HERE.md](CONTINUE_HERE.md) for the latest limitations and resume commands.
Read [ENGINEERING_CHECKPOINT.md](ENGINEERING_CHECKPOINT.md) for the current
dependency frontier, verified evidence, limitations and exact resume commands.
The launcher can execute original engine pre-initialization in your browser.
Original allocator, console, hash, division and system initialization now execute;
original `app_main`, source ownership and remaining game dependencies still block boot.
The original checksum, gamma and selected memory/math behavior have scoped native
and Chromium verification. These subsystem tests do not establish game boot.

## Build and development

Install dependencies and configure Clang using [BUILD_PORTABILITY.md](BUILD_PORTABILITY.md).
Then use:

```sh
npm ci
npm run serve:project
npm run verify:engine-startup
npm run recover:app-main
npm run compile:game
npm run test:recovery
```

The strict game build currently fails incomplete-game acceptance. The active
browser profile selects 111 original Make units and excludes desktop dialogs,
GTK, enhanced renderers, multiplayer, mimalloc, optional external codecs and ALSA.
GNU Make is required for source selection. Compilation and recovery share this
configuration and select the original GenericAllocator backend. Read
[BROWSER_SERVICES.md](BROWSER_SERVICES.md) for the pinned native-services SDK.
Original engine pre-initialization passes; original game startup and playable output
remain unfinished. Open `launch-project.cmd` on the configured Windows host or
visit http://127.0.0.1:8765/ after starting the service. The root launcher provides
an interactive original engine diagnostic, targeted app_main recovery, build,
test, acceptance, cleanup and private continuation packaging actions. Its Play
control requires gameplay evidence matching the exact built HTML. The launcher
is a local development interface; it is not a hosted playable game.

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

Original dynamic-name initialization also executes in Node and Chromium, with 2,311 native comparison rows. Use `npm run serve:project -- --port 8766` to select an alternate launcher port. Full game startup and gameplay remain incomplete.
