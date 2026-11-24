# EDuke32 readable JavaScript port

This project translates original EDuke32 game/Build C/C++ source into readable JavaScript and connects it to browser services. The first target is classic single-player gameplay. Original game/Build code stays JavaScript; approved low-level platform/audio utilities may use WASM.

**Current status: original engine rendering works; original game boot and playable gameplay are not verified. No verified playable dist/index.html exists.**

- Original E1L1 GRP/ART/MAP loading, palettes, room/mask rendering, font initialization and presentation execute in Chromium with zero page exceptions.
- Nine original CON arithmetic helpers match 1,512 native mutations across seven storage modes. Eight original fixed-point arithmetic functions match 4,192 native/Chromium values.
- Original CON division additionally passes 783 native/Chromium operations and 3,132 checked values. Ten targeted compiler/linker regressions pass on the current November 23 compiler. All ten operator calls now bind inside original VM source; its bounded unresolved-reference count falls from 136 to 126. The component audit has zero invalid imports, 46 ambiguous ownership groups and two source units with duplicate-storage findings. Whole-program release acceptance remains blocked.

[Current status and evidence](CURRENT_PORT_STATUS.md) · [How to continue and what to fix](CONTINUE_HERE.md) · [Machine-readable issues](reports/nov23-continuation-frontier.json) · [Continuation prompt](LLM_CONTINUATION_PROMPT.md)

[Release-blocker tracker #2](https://github.com/NullNRG/eduke32-readable-js/issues/2) records the dependency order, affected tools and verification required for the original game release. The November 23 checkpoint adds same-switch terminal-break recovery, JavaScript-safe goto declarations and original CON division; original-game integration is verified separately.

![Original JavaScript Build renderer — raw E1L1 engine test, not gameplay](reports/evidence/nov23-original-text-startup.png)

[Current rendering evidence](reports/nov23-original-text-startup-frame.json) binds the capture to actual module/runtime bytes. Use `npm run serve:project` and engine-player.html for the local GRP/MAP engine preview. Public assets are user-supplied; the preview is not a completed game session.

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
