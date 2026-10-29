# Current EDuke32 continuation status

The original game is **not bootable or playable yet**. There is no verified `dist/index.html`, original JavaScript menu, E1L1 rendering or gameplay screenshot. No WASM, emulator or replacement game was introduced.

`npm run compile:game` and the root launcher use `tools/build_browser_classic.py` with the single profile in `tools/browser_classic_profile.json`. Original Make selects **113 units** with classic rendering and SDL, and excludes enhanced rendering, multiplayer, startup dialogs, GTK, mimalloc, optional external codecs and ALSA. Archived source bytes are preserved; the browser overlay contains two attested ALSA capability guards.

The complete profile-specific semantic extraction parsed 113/113 units without errors. The baseline initial JavaScript pass attempted all 113 under one compiler revision: 27,415 emitted definition entries, 3,986 blocked entries and zero invalid imports. These are emission measurements, not semantic recovery or gameplay proof. That pass predates the October 29 fixes below. Its initial global audit has one ambiguous template export group and has not performed fixed-point recovery.

October 29 changes implement source-proven anonymous callback-table closure, empty C++ callback prototype normalization, explicit member operator overload selection, pointer/enum template identities and layouts, and a whole-program ownership contract for standard `new`/`delete`. Class-specific and placement allocation remain source-owned. Configured Clang dependency queries now run serially. The selected command database also reaches blocker generation and boot probes.

The frozen checkpoint in `reports/oct29-final-regression.json` passed 170/170 tests. Subsequent cache changes passed 8/8 targeted regressions, and template lifetime changes passed 10/10, including 3,072 native/Node/Chromium values. The 170-test report predates those later changes; a complete run on the newest revision remains pending. Earlier interrupted and failing reports remain evidence, not successes.

The latest original-source console probe gets past explicit `operator[]` lowering and the queue allocation blocker in `OSD_Init`. Missing template destructor bodies are now demanded from Clang with checked original template/macro-context and declaration bindings. The original queue class still needs C allocation/free and original `xfree` providers; console initialization still needs its registration functions, callbacks and other source services. The sound-driver table gets past anonymous layout extraction and remains blocked by unlinked original callback addresses. These probes have not executed original console initialization or game audio.

Windows AST cache paths were too long and failed retention. Shorter full-fingerprint paths and lossless gzip now retain the original 330 MB osd.cpp dump as about 30 MB. A second pass hit that cache and emitted byte-identical readable JavaScript. This verifies cache reuse, not engine execution.

The semantic index also exposes source-defined out-of-line C++ methods absent from the baseline emission catalog, including eight GenericAllocator methods and seven small-allocator methods/constructors. The reported blocked-entry count therefore understates the complete definition inventory.

The next work is original template member/lifetime extraction, generic allocator semantics, canonical cross-unit template prototypes, fixed-point linking and browser-service integration under this profile. Then the original main loop needs browser frame yielding, followed by actual menu/E1L1 execution and gameplay verification. Candidate browser packaging remains unfinished; the acceptance gate continues to fail.

Current machine-readable evidence and exact resume commands are in `HANDOFF_SNAPSHOT.json` and `reports/project-current-status.json`. The profile-specific blocker reports are under `factory-output/source-first/browser-classic/reports/`; they use the selected command database and the matching semantic index. The index still has explicit extraction limitations and does not prove complete indirect-call analysis or 90% historical semantic recovery.

The earlier `factory-output/source-first/oct20-engine-preinit-browser` tree is a preserved migration input. Its isolated original SDL/palette/hash/checksum proofs do not establish a booted game and cannot be reused across changed configuration, ABI, compiler or runtime fingerprints without verification.

Resume in this canonical directory:

```powershell
. work/session-env.ps1
npm run compile:game
```

Public source: https://github.com/NullNRG/eduke32-readable-js. No playable GitHub Pages release has been deployed. GRP assets remain private.
