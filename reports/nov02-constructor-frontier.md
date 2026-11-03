# Original constructor and console checkpoint

The original JavaScript game is not bootable or playable. The previous direct
`AtomicLogString` construction failure is resolved for its selected constructor.
Do not repeat that obsolete blocker as the current startup diagnosis.

`tools/source_byte_constructors.py` emits original constructor thunks taking an
existing receiver. One native byte allocation backs the complete object, base
and member views. Exact Clang layouts, original source tokens, selected constructor
types and mangling prove each body. Base/member initializers execute in Clang's
order, including original default member initializers. The supported domain
requires one nonvirtual base at offset zero and trivial destruction. It grants
no copying, virtual/multiple inheritance, class arrays or general nontrivial
inherited destruction. Existing managed-class lifetime support is preserved.

The actual original `_ZN15AtomicLogStringC1EPc` constructor, list-node default
initializer and scalar atomic constructor pass 256 native/Node/Chromium cases:
`reports/nov02-original-log-constructor-parity.json`. The fixture copies the
byte-identical original record span, not a handwritten equivalent constructor.
Its configured allocator ownership uses a real semantic-index proof.

Shared fixes also implement scalar/pointer C++ while-condition declarations,
repeat allocation-declaration recovery through dependency closure, prove sized
delete declarations from the configured SDK, and preserve source integer
function-address sentinels for storage/comparison/round trips. Sentinels acquire
neither callbacks nor readable allocations; invalid calls/data reads still fail.
Compiler and link cache keys now include every source lowering helper.

Native/Node/Chromium fixtures verify 1,536 constructor results, 512 while-condition
results and 512 function-address results. Frozen targeted reports are retained
separately from the earlier full 210/211 run; no current full-suite pass is claimed.

`reports/nov02-original-console-chromium.json` records original `OSD_Init`, logging,
queue draining, builtin echo, command registration/dispatch and alias expansion.
Two diagnostic command callbacks inspect actual original tokenized arguments.
No existing original implementation/callback is replaced. Chromium reports zero
page exceptions. Exact module/runtime fingerprints bind that execution evidence;
rerun it after changing the module graph:

```powershell
. work/session-env.ps1
python tools/verify_browser_engine_component.py --console-only --report reports/nov02-original-console-chromium.json
```

Original `enginePreInit` now links and returns 0 in a fresh Chromium realm, without manual helper initialization. Continue original `app_main` using the canonical game.cpp frontier and ENGINEERING_CHECKPOINT.md. Do not seed missing engine/game state.

Remaining release work includes game startup, original menu/world rendering,
clock initialization, responsive original loop yielding, input/gameplay/audio,
progression, saves and offline bundling. Legacy original storage conflicts,
ambiguous exports and complete selected-unit verification also remain. Console
execution is a concrete subsystem milestone, not game boot or gameplay evidence.
