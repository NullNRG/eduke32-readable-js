The canonical scripts run Python through `tools/run_python.mjs`, which finds an
installed Python 3.10 or newer without relying on the Windows `python3` Store
alias. Set `PYTHON` to an executable path to choose a particular installation.

The archived Make configuration targets x86-64 Linux. The JavaScript lowerer
currently implements little-endian LP64 (8-byte pointer and `long`, 4-byte `int`).
Source AST extraction therefore explicitly targets `x86_64-linux-gnu` on every
host and verifies those properties before extracting declarations. It rejects
Windows LLP64 targets. The compiler version, target flags and ABI attestation
are recorded in each generated source manifest. The compiler executable,
sysroot contents, original source/header files and runtime/compiler helpers
participate in build checkpoint fingerprints.

On Linux, install Clang and the development headers for the captured target.
On Windows, install a Windows-host Clang distribution such as LLVM-Mingw and
provide a Linux header sysroot. `tools/bootstrap_linux_sysroot.py` reconstructs
the Debian bookworm sysroot from package-index-verified packages. This sysroot
supports source AST extraction; it does not provide a runnable native Linux
game executable on Windows.

Extract the project to a short physical path on Windows, for example
`C:\work\EDuke32_SourceFactory`. Hosts with the legacy 260-character path limit
cannot read deeply nested historical manifests from a long extraction path.

Example PowerShell setup, using the toolchains accompanying this checkpoint:

```powershell
$env:PATH = 'C:\path\to\llvm-mingw\bin;' + $env:PATH
$env:EDUKE32_SYSROOT = 'C:\path\to\linux-sysroot'
npm run test:portability
npm run compile:game
```

`EDUKE32_CLANG` and `EDUKE32_CLANGXX` can name specific frontend executables.
`EDUKE32_CLANG_TARGET` may name the equivalent `x86_64-linux-gnu`,
`x86_64-pc-linux-gnu` or `x86_64-unknown-linux-gnu` triples. Debian C++ and
multiarch include directories under `EDUKE32_SYSROOT` are discovered explicitly.

Native fixture tests invoke host `clang++` to create executable oracles. On a
Windows host these are Windows executables; those fixture comparisons do not
attest Linux ABI compatibility or native full-engine gameplay. Full-engine
native parity and browser gameplay remain separate acceptance gates.

Install the semantic extractor dependency with `python -m pip install -r
dev-requirements.txt`. For an isolated dependency directory, use `python -m pip
install --target C:\path\to\python-packages -r dev-requirements.txt` and set
`EDUKE32_PYTHON_PACKAGES` to that directory. The launcher prepends it to
`PYTHONPATH`; an existing `PYTHONPATH` is preserved.

`npm run test:recovery` executes every `verify_sourcefirst*.py` test, the
semantic-index tests and the runtime/launcher tests, continuing after failures. The machine-readable
`reports/recovery-regression.json` and individual logs are saved after each
test. Use `-- --jobs 1 --timeout 240` for hosts with limited memory. A failing
test or timeout makes the command exit nonzero and is retained in the report.

Clang JSON AST retention uses a shared 512 MiB disk LRU. Set
`EDUKE32_AST_CACHE_MAX_BYTES` to change the retained AST payload budget, or `0`
to disable retention. Dumps larger than the budget are decoded completely and
discarded after use. A cross-process directory lock protects active readers
from eviction. Complete dumps are published atomically; temporary full dumps
are automatically deleted when their handles close. The source declarations,
types, original bodies and dependency analysis are unchanged by cache policy.
Generated manifests record `cache_policy_revision`, budget, retention and
eviction statistics under `ast_decode`.

The project builder reuses a unit's completed probe when its other-unit symbol
index is empty. Units with external providers still run the linking emission
pass. Final import ownership, storage ABI, JavaScript syntax and strict blocked
definition checks run for both paths. `project-build.json` records actual
`compiler_passes`, `reused_empty_external_index_probes` and
`relowered_with_external_index` separately from source coverage counts.
