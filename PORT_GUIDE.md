# EDuke32 readable JavaScript port

This project translates the original EDuke32 C/C++ game and Build engine into
human-readable JavaScript. It preserves the original rendering, geometry,
actors, scripts and simulation rather than substituting another game engine.

## Run the current launcher

Start the local server from this repository:

```powershell
npm run serve:project
```

Or open `launch-project.cmd`. Use the address printed by the server, usually
`http://127.0.0.1:8765/`. An additional development server may use port 8766.

- **index.html:** developer dashboard for builds, tests, status, cleanup and
  continuation packaging. Its Play action stays gated on verified gameplay.
- **engine-player.html:** choose a base Duke GRP, choose one of its MAP files,
  and render it through the compiled original engine. The archive is read by
  the browser and transferred to a fresh iframe; it is never uploaded.
- **engine-startup.html:** the earlier allocator/enginePreInit diagnostic.

The level launcher currently renders one frame from the original MAP start.
It is not a game menu, interactive player or replacement gameplay prototype.
Reloading a level creates a fresh JavaScript realm and original globals. Actual
frame PNGs and source execution traces can be downloaded from the launcher.

Open these pages over HTTP. Direct `file://` loading of the ES module tree is
unsupported. A fully standalone offline `dist/index.html` remains a release
requirement, not an available deliverable.

## Verified position (rendering checkpoint, November 13, 2026)

| Area | Current evidence |
| --- | --- |
| Original engine | Allocator, console, enginePreInit, engineInit and enginePostInit execute |
| Assets | Original GRP indexing, ART/cache initialization and MAP loading execute |
| Rendering | Original room, voxel-fallback, sprite and mask dependencies link; rooms/fences/props render |
| Presentation | Repeated RGBX window presentation retains the frame without changing source pixels |
| Launcher | Local GRP selection and fresh E1L1/E1L2 sessions are tested in Chromium |
| Original game startup | app_main is not yet linked/executed |
| Playable gameplay | Not verified; original menus, CON initialization, controls, combat, audio and saves remain incomplete |
| Release | No verified playable standalone HTML or browser deployment |

See `reports/nov12-original-masked-frame.json`,
`reports/nov12-grp-launcher.json`, and their screenshots for exact evidence.
The image uses raw MAP engine state. Original game sprite animation has not
run. Historical campaign loading checks cover 41 maps under their recorded
artifacts; the current launcher test covers two selected maps. These are
different checks and must not be conflated.

The compiler's local CI-profile checks now pass **59/59 under frozen inputs**. Relevant Node SDL/display tests, the local Chromium runtime check and actual file-selection/engine frame checks also pass. Expanded parameter-pack bindings match native behavior for 4,096 values. The complete current regression suite, native game-state parity and 60-second gameplay acceptance are still incomplete. Historical emission/blocker counts span revisions and are not a completion percentage.

The current app_main dependency catalog is reports/nov12-app-main-current-frontier.json. The latest compiler repair allowed 60 closed source definitions to install, but original startup still has unresolved dependencies. Anim_Init now executes and matches native C++ for all 12 records and 44 sound cues. Rotatesprite's packed ClockTicks array, script events and the timer special-key path need further work. Original MUSIC_Update is now linked with its original empty body; this does not establish audio functionality.

November 13: original Anim_Init is linked and executes in Node and Chromium. Its 12 animation records and 44 sound cues match native C++ compiled from exact original declaration extents plus original hash/allocator code. Scalar reference members now preserve Clang-proven LP64 address slots, static converted-temporary lifetime and nested byte-record aliases. The compiler fixture passes 2,048 native/full/filtered Node/Chromium results; automatic reference-temporary lifetimes outside this supported domain remain blocked. See reports/nov13-original-animation-init.json and reports/nov13-app-main-current-frontier.json. The frozen local CI profile passes 59/59. The original masked E1L1 renderer still passes. app_main, menus, CON initialization, interactive simulation, audio, saves and the offline playable release remain incomplete.

## How the port works

1. The classic single-player profile selects original source with NOASM and
   excludes optional desktop/enhanced-renderer features. Exclusions are
   cataloged separately from recovered implementations.
2. Clang supplies declaration identities, selected overloads, types and native
   ABI layouts. The compiler emits ordinary readable JavaScript functions and
   checked memory operations, blocking unsupported semantics.
3. Source ownership and the linker preserve global storage, callbacks and
   cross-unit dependencies. Partial extension manifests retain provenance;
   they do not establish a complete, uniform-revision whole-game build.
4. Browser adapters supply filesystem access, pixel presentation, input,
   timing and audio services. Original engine/game behavior remains JavaScript.
   The approved design permits WASM only for low-level platform services,
   never for game/Build execution or CPU emulation.
5. Native-versus-JavaScript tests check shared semantics. Browser tests invoke
   original functions and retain runtime hashes, traces and actual screenshots.

The launcher runner is generated from the existing verified engine probe. It
adds selected archive bytes and a MAP argument; it does not implement geometry,
rendering or game rules independently. Regenerate it with:

```powershell
npm run build:engine-launcher
```

## What remains and the next engineering step

The next objective is original game startup, not more static-frame features.
Recover the `app_main` dependency graph, original CON initialization and menus.
The UI drawing path still needs packed static-array construction with
ClockTicks members for rotatesprite. Continue through original level setup,
sprite/game initialization and a yielding original frame loop.

Then verify movement, collision, jumping, weapons, enemies, interactions,
sound/music, progression and save/load; run at least 60 seconds of controlled
gameplay and test offline operation. Only then publish a playable release.
The separately requested declaration-by-declaration recovery comparison also
remains unfinished. There is no supported completion date yet.

```powershell
. work/session-env.ps1
python work/recover_boot_reachable.py source/duke3d/src/game.cpp app_main --whole-unit --install-closed-leaves
python work/verify_original_masked_frame.py
python work/verify_engine_launcher.py
```

Keep heavy Clang work serial. Reuse the current native semantic index and
source fingerprints; do not restart all selected units after a compiler-only
change. See `CONTINUE_HERE.md` for refresh and semantic-cache restrictions.
`npm run compile:game` is the canonical release build interface, but currently
fails incomplete-game acceptance. Do not bypass that gate.

## GitHub, assets and cost

Keep source, compiler/runtime work, launcher files and factual evidence in
`NullNRG/eduke32-readable-js`. Do not commit GRPs, downloaded toolchains, raw
AST/SQLite caches or asset-bearing HTML. Players provide their own GRP.

The user prohibits paid external services. Build and test locally; checkpoint
commits include `[skip ci]` so pushes do not start cloud Actions builds. No
additional hosted compute, paid APIs or deployment services are authorized.
The developer dashboard retains the existing continuation ZIP tools; their
source/semantic fingerprint gates must pass before an archive is called valid.

November 16 integration: see CURRENT_PORT_STATUS.md for the new compiler, command-line, lookup and collision checks. The frozen local CI profile now passes 62/62; the table above describes rendering components, not full game boot.
