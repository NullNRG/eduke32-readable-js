# Native layout extraction follow-up - November 11, 2026

Commit `708305d` passed the local 15-test affected suite and real Chromium map/native-codec probes, but GitHub CI failed `verify_sourcefirst_record_pointer_types.py`: finalized codegen omitted a pointee record used only through a pointer in its owning translation unit. The consumer correctly rejected missing provider layout identity.

The follow-up requests Clang finalized standalone debug type emission (`-g -fstandalone-debug -fno-eliminate-unused-debug-types`) while discarding native LLVM output. Original source is unchanged, remains the primary translation unit, and final packed attributes are preserved. There is no complete-record-dump mode and no weakening of the ABI gate. Layout extraction revision is now `source-finalized-native-record-layouts/2`.

The native/JS record-pointer identity, C/C++ packed-macro storage, and failed-codegen/syntax layout-retry tests pass locally. The full 46 Python checks selected by the CI workflow are being reproduced serially in `reports/nov11-ci-reproduction-regression.json`; that report is not complete yet. Original menu, world rendering and gameplay remain unverified.
