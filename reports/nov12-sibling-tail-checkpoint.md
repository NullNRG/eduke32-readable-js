# Original sprite branch recovery

The compiler can now statically duplicate an original sibling-branch tail and
its original function postlude for a proved void-function jump. This retains
ordinary JavaScript branches/loops and original statements. It introduces no
program counter, rendering replacement or game-specific function bypass.

The proof rejects entering loops/switches, nontrivial destruction, observable
shadow capture and target locals that require skipped initialization. Original
uninitialized trivial target locals remain uninitialized until the original
statements assign them. Native early returns skip the postlude as before.

Native/full/filtered Node/Chromium comparisons pass for 1,024 inputs, including
an independent loop jump in the same function. Five targeted reference-lambda,
packed-layout and control-flow regressions pass. The preceding lambda compiler
revision passed 55/55 local CI checks and GitHub CI; this new revision still
needs its complete CI reproduction and actual original sprite execution.

Repeated physical-header scans during typedef provenance recovery now retain
header bytes only within one recovery invocation. Exact token/offset checks and
ambiguity rejection remain unchanged. There is no cache across compilations;
changed inputs are read again. Packed native-storage regression passes.

The canonical whole-engine source recovery is being retried with
`renderDrawMasks --whole-unit --install-closed-leaves`. Its result must be
checked before claiming the sprite dependency linked. The previously verified
E1L1 capture remains room-only evidence. app_main, menus, CON, complete gameplay,
audio/saves, offline bundling and sustained gameplay tests remain incomplete.
