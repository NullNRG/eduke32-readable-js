# Continue the canonical EDuke32 JavaScript port

Work in the existing repository. Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json and reports/nov24-vm-current-frontier.json first. These distinguish source lowering, linking, execution and gameplay. Do not assume that the rendered raw-map preview is an original game session.

## Reproduce the verified checkpoint

On the configured Windows host:

```powershell
. work/session-env.ps1
python work/verify_original_con_variable_operators.py
python work/verify_original_con_division.py
python work/verify_original_bulk_vm_helpers.py
python work/verify_original_vm_array_access.py
python work/verify_original_fix16_arithmetic.py
python work/verify_original_fix16_integer_conversion.py
python work/verify_fresh_engine_startup.py --report reports/nov19-current-engine-component.json
python work/verify_original_text_startup_frame.py --checkpoint nov23
python tools/recover_browser_component.py --snapshot
```

Read reports/nov23-header-value-regressions.json for the 13 targeted tests on the latest compiler and reports/nov19-final-shared-regressions.json for the earlier 20-test checkpoint and its fingerprints. A current checkpoint does not mean the complete historical regression suite or game acceptance passes. Use BUILD_PORTABILITY.md to set up another machine; do not copy local SDKs/caches into public Git.

## November 24 original entry follow-up

The current compiler lowers `app_main` after reconnecting the native ClockTicks conversion and the original static forward declarations for game startup helpers. Read reports/nov24-app-main-private-redeclarations.json for the 40 direct unresolved names in the bounded probe. Refresh existing private callable providers with exact source and byte proofs before reimplementing them. Continue with original CON compilation, menus, and the game loop. The verified direct Chromium game module import currently has neither entry export.

Run `node work/verify_original_entry_helpers.mjs` to execute the recovered logging callback, game-button registration, allocation, reallocation, and cleanup helpers against the canonical JavaScript modules. The TU callable regression includes calls through forward declarations and restoration of a callable identity from verified archived source fragment bytes. Reproduce the original entry probe with `python work/recover_boot_reachable.py source/duke3d/src/game.cpp app_main --query-limit 16 --probe-only`.

The November 25 CON probe is `reports/nov25-original-con-compiler-frontier.json`. Compare newly emitted Clang callable identities with the existing `gamedef.cpp.mjs` module before rebuilding parser helpers. The attestation tool accepts a fresh unit manifest and explicit original export names. It requires the original producer manifests and modules saved under the canonical boot-probes directory.

## November 24 storage and sector follow-up

After loading `work/session-env.ps1`, run `python work/verify_original_script_relocation.py` and `python work/verify_original_sector_tags.py`. The active engine and savegame storage have single owners. Keep the pointer relocation parity checks when changing the CON loader. The current launcher engine test passes after normal engine-first initialization. Sector-first import now passes after folding the original compile-time `ARRAY_SIZE(g_origins)` and removing the address bridge’s read of typed scalar storage during static initialization. Run `python work/refresh_save_array_extent.py --prove-only` to recheck the exact extent. Keep the two save descriptor address checks in the sector test.

The timer storage is installed. Close `G_UpdateScreenArea` and `videoCaptureScreen` before relinking the timer callback chain. The newest completed VM probe used the modules before that timer storage and the four sector helpers were installed. Use the fresh 89-name report as its measured scope and recompile affected definitions.

## November 24 original scalar writes

Run `python work/verify_original_vm_leaf_operations.py` after loading `work/session-env.ps1` to compare the installed writer and angle helper against native C++. The first mixed helper batch exposed vec2/vec3 factory requirements even in `P_GetP`, whose original body reads a scalar sprite field through a pointer cast. The compiler now projects direct scalar accesses through opaque-pointer casts onto the checked native field view. The new regression proves reads and writes while preserving native extent and alignment. The 91-name VM diagnostic predates this field change. Actor addresses also propagate through VM state, so the scalar fix alone cannot establish the actor array contract.

Original `P_GetP` and `A_CheckEnemySprite` now link through the scalar field path, together with their enemy tile flag dependency. Run `python work/verify_original_sprite_queries.py` to compare the original exports with native C++ in the selected classic configuration. Recompute the VM frontier after the installed source changes before updating the 91-name measurement.

## Completed checkpoint: original CON division

The nine arithmetic helpers link and pass native/Chromium tests in seven storage modes. Original `Gv_DivVar` now also links and passes 783 native/Chromium divisions / 3,132 checked values across six storage modes. Eight targeted regressions pass. Do not reimplement these verified helpers. Next work is private callable ownership, original vector contracts and VM/startup closure.

```powershell
python work/verify_original_con_division.py
```

Original definition: source/duke3d/src/gamevars.h in the prepared source tree. Its `goto jmp` enters a label attached to `default:` and then executes the original assignment and switch break. tools/source_control_flow.py requires the exact source switch/loop owner and existing lifetime/scope/alias checks. The emitter consistently spells its original `var` local as `__cxx_var`. Nested/sibling switch transfers and entered storage remain rejected. No synthetic dispatcher and no deleted break.

Use native/Node/Chromium differential tests, including pointer-target mutation and all defined original storage modes. Original branchfree divider storage must be initialized through the original initializer. Exclude undefined divisions from parity inputs and test VM error handling separately.

## Ownership and remaining VM closure

```powershell
python work/recover_boot_reachable.py source/duke3d/src/gameexec.cpp VM_Execute --query-limit 64 --probe-only
```

This is a diagnostic frontier, not a complete coverage measurement. The latest November 23 probe has 93 unresolved names and two ABI-rejected imports affecting five candidate definitions. Twenty-nine original helper/operator call bindings now verify and thirteen non-ODR tile constants fold from native declaration facts. Exact rejected imports and candidate definitions are in reports/nov23-vm-provider-rejected-imports.json. These include existing implementations, so refresh their source contracts before duplicating code. Do not repeatedly rerun all 111 units for a compiler-only change.

TU-private functions stay outside the global owner index. tools/source_tu_function_bindings.py now loads only this exact TU's verified native body/type/mangling, preprocessor fingerprint and original implementation bytes. tools/source_cpp_function_bindings.py proves selected callsites and rejects name/type mismatches. Imports retain function objects, local statics and callbacks. All ten CON operator and nineteen shared helper contracts are installed and verified in original VM callsites.

Continue by refreshing remaining original providers, not by editing manifest identities manually. tools/install_verified_fragment.py supports metadata reattestation when a fresh source compile produces the exact existing function shard bytes; its report must say implementation_bytes_unchanged. Mixed storage fragments still require an explicit hash and the existing preservation/capture checks. Some legacy helper exports use encoded JS names: select their original Clang names and retain aliases only with original header/template identity proofs. Do not globally alias source_name or choose arbitrary min/swap overloads. Template identities must include native specialization arguments and actual required body/reference ABI. Constant ownership needs its existing initializer/storage proof, not the callable contract.

After provider metadata changes, regenerate the VM probe without --reuse-manifest. The global symbol map alone does not reflect newly available TU-private contracts.

The current actor provider (`global.cpp`, actor_t[16384], stride 96) already owns contiguous native bytes. The consumer's physical nested layout matches, but it expects nested vec3 prototypes absent from the provider schema. Do not replace the actor buffer, invent storage, or accept physical equality without proving the actual operations. Extend data-only use proofs only for genuine direct scalar/pointer access; methods, escapes and whole-object operations must retain their original contracts.

The typed-reader switch fix belongs in tools/source_ast_to_js.py CaseStmt lowering: Clang's converted case type must match the discriminant's Number/BigInt domain. Non-ODR constants are selected by full-TU native declaration ID, caller body/type/offset and reference ordinal in tools/source_non_odr_constants.py. Address/volatile references must retain storage.

Vector imports still require real original factory implementations. Inspect tools/source_header_records.py and source_first_global_link.py. Obtain an actual method superset from Clang's original definitions; extend proofs for verified anonymous-union/nested-vector storage where appropriate. Keep source bytes, target layout, required methods and alias identity checked. Never merge incompatible factories or drop prototype verification.

The active component audit verifies unique original storage in engine.cpp and savegame.cpp. Continue to use the existing initializer and identity checks when refreshing those fragments.

## Safe incremental recovery/refresh

```powershell
python work/recover_boot_reachable.py SOURCE NAMES --included-functions --install-closed-leaves
python tools/recover_browser_component.py SOURCE NAMES --refresh-fragment-sha256 FULL_64_HEX_HASH --preserve-fragment-storage
```

Use the actual active hash from the owner manifest. The installer preserves unchanged functions, verified header factories and original storage only when retained definitions do not capture replaced functions. Every emitted duplicate VarDecl is rejected. Read local compile/integration logs; the last script exit alone does not prove every requested overload family resolved.

The authoritative profile is tools/browser_classic_profile.json. All launchers/compiler/linker/audits must consume its active paths. Preserve AST caches only under their source/header/configuration/ABI/toolchain fingerprints. Emission keys also include compiler/runtime helpers. Keep heavy Clang work serial.

## Original game boot and release

After shared closure repairs, refresh these actual chains rather than seeding game state:

```powershell
python work/recover_boot_reachable.py source/duke3d/src/gamedef.cpp C_Compile,C_ParseCommand --whole-unit --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/game.cpp G_Startup,app_main --whole-unit --install-closed-leaves
npm run compile:game
python tools/verify_port_acceptance.py --build-root factory-output/source-first/browser-classic --reports factory-output/source-first/browser-classic/reports --out reports/nov19-current-release-acceptance.json --strict
```

The strict gate currently fails. Reconcile the selected 111-unit profile with stale 113-unit attempt evidence and verify the complete selected set once shared semantics stabilize. Implement actual original startup/resources/CON/menu, then the yielding source frame loop, gameplay/input/audio/save paths. Require real menu/E1L1 captures, 60 seconds of controlled gameplay, native state comparisons, save/restart restoration and offline HTML tests. The separate 90% declaration recovery metric still needs stable identities and a comparable baseline.

`npm run serve:project` opens the developer dashboard. engine-player.html accepts a local GRP/MAP and displays the original raw-map renderer. Neither is the completed game. Publish dist/index.html only after actual gameplay verification. Public Git/Pages must be asset-free; players supply their GRP. Private local offline builds may embed supplied assets.

Use `npm run handoff:project` for a compact private continuation ZIP with current source, active fragments, input assets and evidence. It is not a fresh start. Never publish that asset-bearing ZIP. GitHub source checkpoints use [skip ci], local verification and no paid services.
