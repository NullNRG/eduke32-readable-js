# Static POD callback dependency

The original `classicDrawSprite` now passes source control-flow lowering using
the original sibling tail and common postlude. Its exact anonymous union layout
and Clang-proved trivial destructor are carried into the lifetime proof. The
current blocker is an unresolved original `classicDrawVoxel` dependency:
`divideu32_noinline -> divideu32`, owned by pragmas.cpp/pragmas.h.

The compiler now accepts only Clang-proved trivial, argument-free default
construction of function-static byte records with verified layouts, trivial
destruction and no authored prototype. Native zero initialization occurs once
and storage persists across calls. Authored constructors remain blocked here.
Packed-record assignment, aliases and independent static objects match native
behavior for 2,048 values in full/filtered Node and Chromium. Six focused shared
compiler regressions pass (`nov12-static-pod-regression.json`). The preceding
anonymous-union revision passed 56/56 local CI-profile checks; the complete
regression suite and game acceptance remain incomplete.

The narrow original callback query retained a record without enough namespace
context for its ABI layout and remained blocked. The existing whole-unit mode
is being used to retain the complete original context, without inventing a
layout or removing the original voxel path. Once that owner links, retry the
whole engine for masks/sprites and execute the actual browser renderer probe.

The existing real E1L1 screenshot remains room-only engine evidence. Original
app_main/CON/menu/gameplay, audio, saves, offline player and sustained gameplay
have not passed.

User cost constraint: local compilation/browser verification only. Future
GitHub commits use `[skip ci]` to avoid starting cloud builds. No paid external
services or additional hosted compute may be used.
