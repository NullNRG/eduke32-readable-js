# Continue the canonical EDuke32 JavaScript port

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json, reports/nov16-app-main-current-frontier.json and reports/nov16-startup-collision-ci.json. The game is not yet playable. The GRP picker renders original raw MAP geometry; do not call it a game menu or player session.

```powershell
. work/session-env.ps1
python work/verify_original_command_line_init.py
python work/verify_original_game_lookups.py
python work/verify_original_collision_geometry.py
python work/verify_original_masked_frame.py
python work/reproduce_source_ci.py
python tools/recover_browser_component.py --snapshot
```

Next recovery chain: source/build/src/screentext.cpp tilefontGetPtr,tilefontMaybeDefineMapping,tilefontLookup require original std::unordered_map semantics; those unblock original G_InitText. Original G_LoadGroups now needs loaddefinitions_game. Recover shared semantics, retry affected units and original app_main. UI rotatesprite still needs exact packed static-array ClockTicks construction. getzrange and some game functions still enter different lexical scopes through goto; preserve lifetimes/order in generic lowering.

```powershell
python work/recover_boot_reachable.py source/build/src/screentext.cpp tilefontGetPtr,tilefontMaybeDefineMapping,tilefontLookup --whole-unit --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/text.cpp G_InitText --whole-unit --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/game.cpp app_main --whole-unit --install-closed-leaves
```

Existing owned exports short-circuit recovery. To refresh implementations after compiler changes, use tools/recover_browser_component.py --refresh-fragment-sha256 HASH --whole-unit-refresh with the exact active module_fragments entry; preserve its complete interface, source ownership and storage ABI. Never trim hashed shards or choose overloads by name/arity. The new getwalldist provider metadata is attested against unchanged producer/shard/source/header/toolchain fingerprints in reports/nov16-original-overload-attestation.json.

The current semantic index covers the 111-unit classic profile at d906809d; compiler-only edits do not require repeating semantic extraction. Keep heavy Clang work serial on this machine. Do not mix current compiled, linked, executed and gameplay-verified status.

Use npm run serve:project and engine-player.html for local GRP selection; no archive upload occurs. Regenerate its runner with npm run build:engine-launcher. The release still requires original menus, CON/game state, controls/combat, audio, saves, offline standalone HTML and 60 seconds of genuine verified gameplay.

Keep pushing source, active modules and factual evidence to NullNRG/eduke32-readable-js. Include [skip ci] in every checkpoint commit. No paid services, cloud builds, GRPs, SDKs or raw AST/SQLite caches. Do not deploy or label a playable release until the actual acceptance tests pass.
