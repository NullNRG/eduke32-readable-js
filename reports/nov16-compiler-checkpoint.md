# Compiler checkpoint — November 16, 2026

The original game is not yet playable. These changes repair shared compiler
semantics; they do not establish original game boot or gameplay acceptance.

- C++ `if` condition declarations retain lexical scope and evaluate their
  initializer once. Floating-to-boolean conversion now preserves C++ NaN
  behavior. The native/full/filtered Node/Chromium fixture checks 14,336 results.
- Supported backward conditional tail retries become structured loops while
  preserving source suffix order. Scope/lifetime-unsafe jumps remain blocked.
  The fixture checks 4,096 native/full/filtered Node/Chromium results. Original
  `yax_getzsofslope` is recovered by this feature.
- External overload selection uses the exact Clang-selected native function
  identity and original type, with provider ownership/export auditing. Reference
  ABI metadata is preserved. The fixture passes 2,048 native/full/filtered
  Node/Chromium results and rejects a competing namespace and altered identity.

All three tests pass locally on this compiler revision. A frozen 62-check local
CI-profile run is in progress at this source checkpoint. Its completed result
will be recorded separately; the earlier 61/61 run predates overload binding.
No hosted build or paid service was started.

The next integration step is to attest the two existing original `getwalldist`
providers against fresh Clang extraction with identical source/header/toolchain
inputs, then retry `clipupdatesector`, `clipmove` and `pushmove`. Existing generated
function bodies and source-owned storage must remain intact.
