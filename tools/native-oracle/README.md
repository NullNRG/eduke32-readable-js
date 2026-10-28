# Original native EDuke32 reference

These scripts build and exercise the archived original game as a development reference. The native executable is separate from the JavaScript game deliverable.

From the project directory, with PowerShell 7:

```powershell
# Optional: override the installed GCC/bin directory.
$env:EDUKE32_NATIVE_TOOLCHAIN = 'C:\path\to\mingw64\bin'
& tools/native-oracle/build-native.ps1
& tools/native-oracle/verify-native-source.ps1
& tools/native-oracle/smoke-native-help.ps1
& tools/native-oracle/smoke-native-game.ps1
& tools/native-oracle/sample-native-state.ps1
& tools/native-oracle/capture-native-frame.ps1
```

The build extracts `input-source/eduke32-master.zip` into `work/native-oracle/eduke32-master` when necessary. GNU Make uses one worker, `NOASM=1`, `OPTLEVEL=0`, and `LTO=0`. The installed reference compiler is WinLibs GCC 16.1.0, x86_64 UCRT MCF. `EDUKE32_NATIVE_TOOLCHAIN` can select another compatible installation.

The archived FLAC static library is version 1.3.0 and imports the legacy MSVCRT `__imp___iob_func`. `build-flac-ucrt.ps1` rebuilds that same upstream version from the official Xiph tag with UCRT, using a pinned archive SHA-256. Its configuration and every compile command are recorded in `reports/native-flac-build.json`. Ogg wrapping and assembly optimizations are disabled in this development codec build; native FLAC decoding remains implemented by the original library. The original archived library is retained byte-for-byte. Linker search order selects the rebuilt library through `-L../flac-ucrt/lib` before `-Lplatform/Windows/lib/64`.

The final native executable is copied to `artifacts/native-oracle/eduke32.exe`. Exact commands, compiler version, executable hash, configuration, and failure history are saved in `reports/native-engine-build*.json` and corresponding logs. Original archive file hashes are verified separately; generated files are excluded from that comparison.

The help smoke test runs the original argument parser and requires usage output and exit code 0. The game startup test uses the supplied original `input-data/DUKE3D.GRP`, classic 8-bit video configuration, and SDL dummy video/audio drivers. It launches the original executable on a private noninteractive Windows desktop, never switches the input desktop, captures its logs, and terminates only its own process after 30 seconds. All config/cache/log writes remain under `work/native-oracle/smoke-game`; the original update-check configuration is disabled.

Startup evidence verifies resource selection, original CON compilation, classic video initialization, and entry into E1L1. The external state sampler reads original drawing/game-update/timer counters, RNG state, counts, and sprite records through `ReadProcessMemory`. It binds the native image to its linker map and computes relocated addresses using the actual loaded module base. It never writes memory, injects code, suspends game threads, or switches the input desktop. Every original declaration file used to decode values is checked against the original archive manifest.

`capture-native-frame.ps1` reads the original active 8-bit software framebuffer and exact four-byte `palette_t` entries. `encode-native-frame.py` encodes those bytes into indexed PNGs with Python's standard library, respecting the native stride and RGB bytes without rescaling. The report and adjacent raw bytes preserve their hashes. These are native reference images; browser output is unverified. The image can be read during drawing before HUD/weapon rendering, and the process keeps running during capture.

Preserve the exact native binary, `reports/native-engine-link.map`, `reports/native-engine-build.json`, `reports/native-oracle-source-hashes.json`, original source ZIP, original GRP, and native tools for reproduction. Build first when the work directory is missing. State/frame scripts use the recorded binary/map/source hashes to prevent silently sampling mismatched addresses. Full raw sprite arrays are optional evidence and can be recomputed.

Input, audible audio, save/load, specific collision/enemy/weapon behavior, atomic/deterministic snapshots, complete presented frames, and JavaScript parity remain separate acceptance tests. No native game source is patched by these scripts.
