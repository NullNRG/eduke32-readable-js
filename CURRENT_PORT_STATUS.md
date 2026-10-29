# Current EDuke32 continuation status

The original game is **not bootable or playable yet**. There is no verified `dist/index.html`, original JavaScript menu, E1L1 rendering or gameplay screenshot. No WASM, emulator or replacement game was introduced.

`npm run compile:game` and the root launcher use `tools/build_browser_classic.py` with the single profile in `tools/browser_classic_profile.json`. Original Make selects **113 units** with classic rendering and SDL, and excludes enhanced rendering, multiplayer, startup dialogs, GTK, mimalloc, optional external codecs and ALSA. Archived source bytes are preserved; the browser overlay contains two attested ALSA capability guards.

The complete profile-specific semantic extraction parsed 113/113 units without errors. The baseline initial JavaScript pass attempted all 113 under one compiler revision: 27,415 emitted definition entries, 3,986 blocked entries and zero invalid imports. These are emission measurements, not semantic recovery or gameplay proof. That pass predates the October 29 fixes below. Its initial global audit has one ambiguous template export group and has not performed fixed-point recovery.

October 29 changes implement source-proven anonymous callback-table closure, empty C++ callback prototype normalization, explicit member operator overload selection, pointer/enum template identities and layouts, and a whole-program ownership contract for standard `new`/`delete`. Class-specific and placement allocation remain source-owned. Configured Clang dependency queries now run serially. The selected command database also reaches blocker generation and boot probes.

The earlier frozen checkpoint in `reports/oct29-final-regression.json` passed 170/170 tests. Later cache and template lifetime changes passed their targeted regressions. The current memory integration checks pass 9/9; a fresh 175-test run is recorded in `reports/oct29-memory-final-regression.json`. Check its complete/all_passed fields and fingerprints. Earlier interrupted, mixed-revision and failing reports remain evidence, not successes.

The latest original-source console probe gets past explicit `operator[]`, queue construction/destruction and C calloc/free. Missing template destructor bodies are demanded from Clang with checked original template/macro-context and declaration bindings. The original queue class still needs original `xfree`, which reaches the small-pool allocator. Console initialization still needs registration functions, callbacks and other source services. The sound-driver table gets past anonymous layout extraction and remains blocked by unlinked original callback addresses. These probes have not executed original console initialization or game audio.

The new source memory ABI, `source-lp64-addresses/2`, unifies byte-backed pointer fields and pointer/integer casts. C allocation uses the existing ABIHeap, preserving aliases through growth, realloc/free and cross-unit calls. Allocation begins outside the original pool's low-address sentinel range. Configured C allocation requires a complete selected-unit ownership proof and exact Clang C linkage/signatures. Deferred static pointer relocations retain actual source storage, and C++ delete releases address-registry buffer references. Fragment installation and linking reject incompatible pointer ABIs. Old emitted modules must be recompiled before joining this ABI.

All eight original `sm::GenericAllocator` methods now transpile and pass 257 native/Node/Chromium cases, including alignment, header size, data preservation, allocation failure, low-address sentinels and freeing. `reports/oct29-original-generic-allocator-full-parity.json` binds this evidence to the actual module. It does not verify the original small-pool allocator or engine startup. See `tools/SOURCE_MEMORY_ABI.md` for the supported memory boundary and remaining requirements.

Windows AST cache paths were too long and failed retention. Shorter full-fingerprint paths and lossless gzip now retain the original 330 MB osd.cpp dump as about 30 MB. A second pass hit that cache and emitted byte-identical readable JavaScript. This verifies cache reuse, not engine execution.

The semantic index exposes source-defined out-of-line C++ methods absent from the baseline emission catalog. The eight GenericAllocator static methods are now represented and tested. Seven small-allocator instance methods/constructors still lack complete emission ownership. `reports/oct29-pool-allocator-frontier.json` preserves their exact declaration identities and dependencies. The baseline blocked-entry count understates the complete definition inventory.

The next work is the original small-pool allocator's member/base construction, owned object lifetime, array/unique_ptr/atomic/TLS dependencies and out-of-line instance methods. Canonical cross-unit template prototypes, fixed-point linking and browser-service integration also remain. Then the original main loop needs browser frame yielding, followed by actual menu/E1L1 execution and gameplay verification. Candidate browser packaging remains unfinished; the acceptance gate continues to fail.

`python work/package_current_continuation.py` creates a private continuation ZIP of active work, original sources and supplied DUKE3D.GRP, rather than every obsolete output tree. It includes a lossless compressed export of all current semantic-index tables. Restore it with `work/portable_semantic_checkpoint.py` when needed; an actual restore, table-by-table hash comparison and SQLite check passed. Downloaded toolchains, raw AST caches and unrelated old builds are omitted. This ZIP is not a playable-game deliverable.

Current machine-readable evidence and exact resume commands are in `HANDOFF_SNAPSHOT.json` and `reports/project-current-status.json`. The profile-specific blocker reports are under `factory-output/source-first/browser-classic/reports/`; they use the selected command database and the matching semantic index. The index still has explicit extraction limitations and does not prove complete indirect-call analysis or 90% historical semantic recovery.

The earlier `factory-output/source-first/oct20-engine-preinit-browser` tree is a preserved migration input. Its isolated original SDL/palette/hash/checksum proofs do not establish a booted game and cannot be reused across changed configuration, ABI, compiler or runtime fingerprints without verification.

Resume in this canonical directory:

```powershell
. work/session-env.ps1
npm run compile:game
```

Public source: https://github.com/NullNRG/eduke32-readable-js. No playable GitHub Pages release has been deployed. GRP assets remain private.
