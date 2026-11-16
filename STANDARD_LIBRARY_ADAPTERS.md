# Typed standard-library services

Original EDuke32/Build functions remain source-lowered JavaScript. The compiler
can now bind a limited `std::unordered_map` interface to a JavaScript library
service instead of lowering the GNU standard library's internal implementation.
No original game function is replaced, and this service contains no game data.

`source-opaque-std-unordered-map/1` admits unsigned 8/16/32-bit keys and unsigned
8/16/32-bit or recursively nested map values. Hash, equality and allocator must
be the original default standard types. Selected methods are identified by
Clang declarations from the configured target GNU C++ headers. A class in an
application header with the same name is not admitted. Per-definition manifests
record the selected native mangling, signature, source header and value schema.

Supported operations include default/copy construction, copy assignment,
`operator[]`, two-argument `emplace`, keyed lookup/erasure, clearing, size,
begin/end and supported iterator operations. Custom hashers/allocators,
nontrivial application values, map moves, postfix iterator increments and other
unimplemented operations remain blocked. Native tests cover the operations
needed by the original font code, copies, iterator comparisons and 64-bit input
narrowing. They do not establish complete standard-library compatibility.

The existing verified standard-heap contract must prove absence of program-wide
global new/delete replacements in a multi-unit project. A stand-alone unit is
checked for authored ordinary allocation/deallocation replacements, including
definitions omitted by a filtered AST. Such replacements disable this service;
allocation hooks are not silently bypassed. Source class-specific and unrelated
placement overloads are distinct from the global default allocator contract.

The service preserves map/element identity and aliases across insertion/growth.
Erasure/destruction invalidates element references. Automatic objects use the
existing structured lifetime cleanup; runtime shutdown destroys global service
objects in reverse construction order. A supported nested map's address survives
inner-map clearing and expires when its containing element is destroyed.

These are **opaque managed C++ objects**, consistent with the existing managed
object address domain. Pointer equality and pointer/integer round trips preserve
identity. They are not advertised as native GNU bucket/node byte layouts. Raw
serialization or native STL-layout interoperability is unsupported; byte service
access fails. Iteration order is unspecified by C++ and is not a promise to
reproduce GNU bucket order. The currently admitted game font functions use keyed
lookup, not container traversal. SDL/native-service boundaries do not receive
these standard-library objects.

Verification is local: `python tests/source_factory/verify_sourcefirst_unordered_maps.py`
compares 2,048 native/full/filtered Node/Chromium results; `node --test
tests/source_factory/unordered_map_service.test.mjs` verifies expiration, stable
aliases, cleanup and rejection of raw-byte access. Native mapping verification
for the original full browser `G_InitText` is described separately in
`reports/nov16-native-original-font-oracle.json`: it compares exact original
mapping statements, not native allocation, tile loading or whole-game behavior.
