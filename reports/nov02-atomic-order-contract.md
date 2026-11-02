# Native atomic-order contract

The selected Clang compiler accepts the original `AtomicSList64::pop` operation
under the unchanged `-std=gnu++14` build. Its native LLVM output contains a
`cmpxchg weak` with success `release` and failure `acquire`. The JavaScript
runtime had rejected that original operation using a stricter ordering table.

The adapter now matches this selected native contract: success orders are
0–5; failure orders are the load orders 0, 1, 2 and 5. Release/acq_rel failure
orders remain rejected before any value or expected-pointer mutation. Shared
buffers remain unsupported. Integral atomics retain their width/alignment
checks; pointer atomics additionally enforce the attested eight-byte alignment.

This distinction is documented in [WG21 P0418R2](https://open-std.org/JTC1/SC22/WG21/docs/papers/2016/p0418r2.html)
and the current [LLVM compare-exchange contract](https://llvm.org/docs/LangRef.html#cmpxchg-instruction).
The original game source and its language configuration were not changed.
LLVM output is used only as development evidence; JavaScript executes source
operations on original lvalues, with no instruction interpreter or shared-worker
concurrency claim.

`verify_sourcefirst_atomic_operations.py` compares 1,414 native/Node/Chromium
values, including all 24 accepted order pairs and invalid-order/alignment guards.
`reports/nov02-original-atomic-list-parity.json` separately verifies original list
push, pop, first, isEmpty, link order, pointer identity and empty-pop behavior in
256 native/Node/Chromium cases. These tests use native-constructed snapshots;
JavaScript object construction and original console/engine startup remain
unverified.
