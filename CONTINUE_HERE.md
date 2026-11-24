# Continue the canonical EDuke32 JavaScript port

Work in the existing repository. Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json and reports/nov23-continuation-frontier.json first. These distinguish source lowering, linking, execution and gameplay. Do not assume that the rendered raw-map preview is an original game session.

## Reproduce the verified checkpoint

On the configured Windows host:

```powershell
. work/session-env.ps1
python work/verify_original_con_variable_operators.py
python work/verify_original_con_division.py
python work/verify_original_fix16_arithmetic.py
python work/verify_original_fix16_integer_conversion.py
python work/verify_fresh_engine_startup.py --report reports/nov19-current-engine-component.json
python work/verify_original_text_startup_frame.py --checkpoint nov23
python tools/recover_browser_component.py --snapshot
```

Read reports/nov23-tu-callable-regressions.json for the ten tests on the latest compiler and reports/nov19-final-shared-regressions.json for the earlier 20-test checkpoint and its fingerprints. A current checkpoint does not mean the complete historical regression suite or game acceptance passes. Use BUILD_PORTABILITY.md to set up another machine; do not copy local SDKs/caches into public Git.

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

This is a diagnostic frontier, not a complete coverage measurement. The current November 23 probe has 126 unresolved references and one vec3 factory rejection affecting five candidate definitions. Ten original CON operator call bindings now verify. Thirty-four unresolved names still have active same-TU provider candidates; exact bindings/types are listed in reports/nov23-continuation-frontier.json. These include existing implementations, so refresh their source contracts before duplicating code. Do not repeatedly rerun all 111 units for a compiler-only change.

TU-private functions stay outside the global owner index. tools/source_tu_function_bindings.py now loads only this exact TU's verified native body/type/mangling, preprocessor fingerprint and original implementation bytes. tools/source_cpp_function_bindings.py proves selected callsites and rejects name/type mismatches. Imports retain function objects, local statics and callbacks. All ten CON operator contracts are installed and verified in original VM callsites.

Continue by refreshing remaining original providers, not by editing manifest identities manually. tools/install_verified_fragment.py supports metadata reattestation when a fresh source compile produces the exact existing function shard bytes; its report must say implementation_bytes_unchanged. Mixed storage fragments still require an explicit hash and the existing preservation/capture checks. Some legacy helper exports use encoded JS names: select their original Clang names and retain aliases only with original header/template identity proofs. Do not globally alias source_name or choose arbitrary min/swap overloads. Template identities must include native specialization arguments and actual required body/reference ABI. Constant ownership needs its existing initializer/storage proof, not the callable contract.

After provider metadata changes, regenerate the VM probe without --reuse-manifest. The global symbol map alone does not reflect newly available TU-private contracts.

Vector imports still require real original factory implementations. Inspect tools/source_header_records.py and source_first_global_link.py. Obtain an actual method superset from Clang's original definitions; extend proofs for verified anonymous-union/nested-vector storage where appropriate. Keep source bytes, target layout, required methods and alias identity checked. Never merge incompatible factories or drop prototype verification.

The component audit reports duplicate immutable header storage in engine.cpp and savegame.cpp. Inspect the exact active fragments listed in reports/nov23-continuation-frontier.json. Use the existing initializer/identity checks and verified fragment mechanism to retain one storage owner. Do not delete fragments, ignore immutable addresses or fabricate manifests.

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
