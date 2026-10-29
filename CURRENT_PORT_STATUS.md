# Current EDuke32 continuation status

The original game is **not bootable or playable yet**. There is no verified `dist/index.html`, original JavaScript menu, E1L1 rendering or gameplay screenshot. No WASM, emulator or replacement game was introduced.

`npm run compile:game` and the root launcher use `tools/build_browser_classic.py` with the single profile in `tools/browser_classic_profile.json`. Original Make selects **113 units** with classic rendering and SDL, and excludes enhanced rendering, multiplayer, startup dialogs, GTK, mimalloc, optional external codecs and ALSA. Archived source bytes are preserved; the browser overlay contains two attested ALSA capability guards.

The complete profile-specific semantic extraction parsed 113/113 units without errors. The baseline initial JavaScript pass attempted all 113 under one compiler revision: 27,415 emitted definition entries, 3,986 blocked entries and zero invalid imports. These are emission measurements, not semantic recovery or gameplay proof. That pass predates the October 29 fixes below. Its initial global audit has one ambiguous template export group and has not performed fixed-point recovery.

October 29 changes implement source-proven anonymous callback-table closure, empty C++ callback prototype normalization, explicit member operator overload selection, pointer/enum template identities and layouts, and a whole-program ownership contract for standard `new`/`delete`. Class-specific and placement allocation remain source-owned. Configured Clang dependency queries now run serially. The selected command database also reaches blocker generation and boot probes.

The first targeted semantic checkpoint passed 13/13 tests. The broader run exposed a shared typedef/tag cycle regression and an outdated build-command test. Those were corrected; the fresh complete regression is `reports/oct29-final-regression.json`. Read its `complete`, `all_passed`, `regression_inputs_unchanged` and exact fingerprints before claiming a full pass. Earlier interrupted and failing reports remain evidence, not successes.

The last original-source console probe gets past explicit `operator[]` lowering. `OSD_Init` still requires the instantiated original `CircularQueue` construction/destruction ABI; the draw function also needs that class and linked services. An auxiliary Clang experiment instantiated the original queue methods and destructor, but its supplementary source provenance and compiler integration are unfinished. The sound-driver table now gets past anonymous layout extraction and remains blocked by unlinked original callback addresses. These probes have not executed original console initialization or game audio.

The next work is original template member/lifetime extraction, generic allocator semantics, canonical cross-unit template prototypes, fixed-point linking and browser-service integration under this profile. Then the original main loop needs browser frame yielding, followed by actual menu/E1L1 execution and gameplay verification. Candidate browser packaging remains unfinished; the acceptance gate continues to fail.

Current machine-readable evidence and exact resume commands are in `HANDOFF_SNAPSHOT.json` and `reports/project-current-status.json`. The profile-specific blocker reports are under `factory-output/source-first/browser-classic/reports/`; they use the selected command database and the matching semantic index. The index still has explicit extraction limitations and does not prove complete indirect-call analysis or 90% historical semantic recovery.

The earlier `factory-output/source-first/oct20-engine-preinit-browser` tree is a preserved migration input. Its isolated original SDL/palette/hash/checksum proofs do not establish a booted game and cannot be reused across changed configuration, ABI, compiler or runtime fingerprints without verification.

Resume in this canonical directory:

```powershell
. work/session-env.ps1
npm run compile:game
```

Public source: https://github.com/NullNRG/eduke32-readable-js. No playable GitHub Pages release has been deployed. GRP assets remain private.
