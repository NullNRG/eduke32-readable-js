# Original mask-renderer closure recovery

The original E1L1 rooms component passes in Chromium; this remains a room-only
rendering milestone, not original game boot or gameplay. The previous source
checkpoint `9a185af` passed GitHub CI (run 43267389934).

The shared compiler now supports a conservative, Clang-proved subset of local
C++ lambdas: direct calls, reference-only captures, trivial closure destruction,
and no copying, escaping or observable closure-object storage. Selected operator
IDs and capture declarations come from the same AST. Ordinary nested readable
JavaScript functions preserve captured lvalues and existing pointer/reference
cells. Unproved cases remain blocked.

Verification: 3,072 native/full/filtered Node/Chromium comparisons covering scalar
mutation, pointer aliases, reference parameters, const record references,
multiple closures and loop lifetimes. Value captures, copies, object addresses
and escaping closures are rejected. Five targeted compiler/reference/control
flow regressions pass (`nov12-local-lambda-regression.json`). The complete
current regression suite and gameplay acceptance are not yet verified.

The actual original `renderDrawMasks` dependency recovery is running serially.
Resume command:

```powershell
. work/session-env.ps1
python work/recover_boot_reachable.py source/build/src/engine.cpp renderDrawMasks --install-closed-leaves
```

Do not call the mask renderer recovered until its actual source dependency
closure links and executes. The outstanding release work still includes
original `app_main`, CON, menu, sprites, input/combat, audio, saves, offline
player assembly and sustained gameplay verification.
