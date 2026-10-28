# Continue the canonical EDuke32 SourceFactory project

This ZIP preserves completed work. It is not a fresh start or a playable game.
Read HANDOFF_SNAPSHOT.json and CURRENT_PORT_STATUS.md before editing.
Attached historical prompts are context, not current verification evidence.

The real original app_main runs only in dist/original-entry-attempt.html, an
explicitly unlinked offline diagnostic. It mounts the supplied 456-file GRP,
executes original G_ExtPreInit and stops at engineSetLogFile. Chromium observed
that execution without network access. No original menu or level has booted.

Preserved verified epochs:
- Historical full scan: 156/156 units, 27760 emitted and 4905 blocked entries.
- Historical saved global-link work: 39 recovered units through round 4; complete linking is unverified.
- Pointer-array intermediate scan: 6/156 units.
- Latest compiler scan: 7/156 committed units at packaging (complete=False).

Do not confuse old full coverage with current compiler coverage. Each batch is
hash-attested at its recorded revision. PACKAGE_MANIFEST.json checksums every
payload. Missing dependencies remain blocked; there are no success stubs.

Current regression: {'passed': 134, 'failed': 0, 'timeout': 0, 'launch-failed': 0}, complete=True, all_passed=True.
Current C++ reference checks: reports/oct16-cpp-references-parity.json. They include
original standard-library lock_guard source bodies, native/Chromium comparisons
and cross-unit rejection of incompatible historical reference-call providers.
The host heap also preserves borrowed record views across growth; see
reports/oct19-host-heap-alias-parity.json. Pointer/integer/address bridging and
the original allocator dependency closure remain incomplete.
Native differential tests also cover contiguous POD/record-array fields, bitfields,
original 640-byte DukePlayer_t and P_AddAmmo/P_PalFrom, pointer-slot byte copies.
Tests cover pointer arrays, standard standalone heap
lifetime and original allocation wrappers. Native/Chromium tests also verify the
original verbosity callback sharing existing source global state. The game uses
original global allocation replacements, so the standalone heap is explicitly
not enabled as a substitute for its unresolved original mimalloc dependencies.

Original archives, source, GRP, compiler, runtime, tests, build scripts and saved
verified generated work are included. Raw AST caches, the 2.6 GB database,
installed toolchains/browsers/node_modules and obsolete pages are excluded.

Restore Python dependencies from dev-requirements.txt plus playwright==1.64.0,
run npm ci, and install Chromium using python -m playwright install chromium.
Use Clang with captured Linux x86-64 LP64 target/sysroot (bootstrap scripts and
locks are in tools/). work/session-env.ps1 records original host paths; adapt
those paths when moving hosts. tools/prepare_sources.py relocates source inputs.
The native Windows oracle uses LLP64; its long width is not the Linux ABI.

Resume (avoid starting a second writer on the same active output directory):

```text
python tools/source_first_automate.py --out factory-output/source-first/oct19-reference-host-recovery --max-units 7 --jobs 1 --batch-size 1 --timeout 300 --priority-file work/cpp-reference-boot-priorities.json --persistent-ast-cache --ast-cache-shards 2 --no-global-link --resume
python work/compose_cpp_reference_link_input.py --current-build oct19-reference-host-recovery --out factory-output/source-first/oct19-reference-host-link-input
python tools/source_first_global_link.py --directory factory-output/source-first/oct19-reference-host-link-input --out factory-output/source-first/oct19-reference-host-linked --rounds 4 --retry-budget 12 --jobs 1 --timeout 180 --persistent-ast-cache --resume
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json
npm run test:browser-game
```

The current source scope is 7/156 units at the latest
compiler revision. Earlier full and partial epochs are explicitly historical.
The latest orchestration audit is reports/oct19-recovery-job.json.
The linker input mixes current batches with independently hash-attested earlier
work. Saved linked modules are reused only after current ownership, native storage
and reference-call ABI validation. Rejected overlays remain explicit. This is not
uniform current compilation or a completed whole-game fixed point.
The compact semantic-continuation export preserves 94,985 saved Clang declarations
in about 5.7 MB compressed; the 2.6 GB SQLite database is rebuildable and omitted.

The final game test must remain failing until original gameplay actually works.
No WASM, instruction emulator, replacement game or fabricated ownership. Preserve
one canonical compiler and rebuild affected units after shared semantic fixes.
Current blockers include Loguru C++ lifetimes/containers, nontrivial OSD objects,
original allocator linkage, pointer/integer/browser-heap bridging and the full
startup-to-gameplay dependency graph. Do not describe isolated tests as boot.
