# Original console constructor frontier

The original JavaScript game is not bootable or playable. The console's direct
remaining semantic failure is `AtomicLogString` construction; its original
class has one base (`AtomicSListNode<AtomicLogString>`), a borrowed `char *`,
and `std::atomic<int>`. This is a shared object-storage/lifetime feature, not
permission to replace the console or drop its logging queue.

The cached original full-TU AST selects `_ZN15AtomicLogStringC1EPc`,
`void (char *)`. Its ordered initializers are the original list-node base,
`m_value{val}`, then `m_isLogged{0}`. The destructor is Clang-proved trivial;
copy/move constructors are deleted. `work/inspect_original_constructor_ast.py`
extracts this evidence from the existing cache without recompiling the game.

The current console fragment contains original `AtomicSList64::push`, pointer
atomic load and compare-exchange bodies. Its shared pointer helper was refreshed
through the expected-hash installer. No original global was duplicated.
`OSD_Dispatch` now lowers and stops at its missing `OSD_Printf` dependency;
`OSD_Printf` stops at `OSD_Puts`. Registration/init callbacks converge on this
chain. See the canonical console frontier JSON for the remaining dependencies.

`reports/nov02-original-atomic-list-parity.json` verifies original `push`,
`pop`, `first` and `isEmpty` in native C++, Node and Chromium. JavaScript consumes
native-constructed snapshots in this diagnostic; this does not verify JavaScript
construction, logging, console initialization or engine startup.

The next implementation should preserve these boundaries:

1. Select the actual Clang constructor and its original initializer/body AST,
   including default member initializers. Require exact target layouts and
   original source provenance. Emit only selected bodies, rather than every
   unused standard-library class method.
2. Initialize base/member subobjects in the same allocation and in Clang's
   original order. The currently verified borrowed layout supports one
   nonvirtual base at offset zero; virtual/multiple inheritance remains blocked.
3. A byte-field projection is not construction permission. The allocation,
   constructor, destructor and failure cleanup must establish the object's
   lifetime separately. Initially require a proved trivial destructor if
   complete nontrivial destruction is unavailable. Do not enable copies or
   assignment through the projection schema.
4. Preserve pointer identity through allocation, fields, atomic slots and
   integer round trips. A decoded native pointer to a source-constructed class
   needs the same verified field storage as its original object. The existing
   managed-object and byte-view representations must not be silently confused.
5. Compare constructor side effects, field bytes, base/member aliasing and
   allocation/deallocation against native C++. Then execute original `OSD_Puts`,
   console initialization and `enginePreInit`; do not seed game state.

`AtomicSList64::pop` uses a release/acquire compare-exchange pair. Its execution
now matches the selected native compiler. The adapter's older ordering table
incorrectly rejected it; `reports/nov02-atomic-order-contract.md` records the
native evidence and retained shared-buffer/alignment/invalid-order guards.

Other acceptance work remains: engine initialization, original menus/world
rendering, input/gameplay/audio/saves, a responsive original outer loop, and a
reproducible playable offline bundle. The partial graph also retains legacy
engine/console storage conflicts and ambiguous exports. Constructor recovery is
the next boot dependency, not a claim that all remaining work is one fix.
