# Duplicate-code and shared-helper audit

This project contains compiler tools, source-derived runtime modules,
verification harnesses and generated artifacts. Similar-looking code is a
**candidate**, not proof it is safe to replace.

## Run

```sh
python tools/audit_redundant_code.py
python tools/audit_redundant_code.py --min-tokens 30 --limit 120
python tools/audit_redundant_code.py --all --include-generated --out reports/whole-tree-duplicates.json
python -m unittest discover -s tests -p test_redundant_code_audit.py
```

Default scope includes tools/, runtime/, tests/ and root launch scripts.
Generated output, work caches, reports and input archives are excluded.
The optional whole-tree scan includes generated **source** but not ZIPs.
Output defaults to reports/redundant-code-audit.json. The tool does not
edit any source files.

The JSON report contains exact_files (byte-identical), exact_functions
(Python AST or heuristic JS lexical), same_layout_functions (normalized
tokens), near_duplicate_functions (similarity scores), repeated_code_blocks
(cross-file literal or layout token windows), shared_helper_opportunities
(pattern-level candidate families), parse_errors and skipped_files.

The report is capped by --limit. Listed counts may therefore be truncated.
JavaScript function extraction is heuristic: some methods or templates may not
be recognized as standalone functions, although generic block scanning still
covers their source. Structural similarity can be false positive. Block clone
groups show representative windows; they are not exhaustive savings estimates.

## Refactor priorities

1. File hashing and workspace root resolution: narrow stateless helpers, with
   explicit fingerprint/byte contract.
2. JSON I/O and report persistence: preserve strictness, encoding, atomic
   replacement and Windows-safe retries.
3. Command runner: unify cwd, timeout, environment, capture, cancellation,
   signal handling and exit-code policies only where they truly agree.
4. ESM export/symbol index: preserve original symbol identity, TU ownership,
   manifests, evidence, ambiguity and fail-closed behavior.
5. Compiler-generated code and AST/ABI translation: audit separately. Repeated
   output may legitimately represent independently owned source units.

For each candidate, compare preconditions, side effects, failure modes and
provenance; build parity tests; refactor one family at a time. Run project
regressions (including npm run test:recovery and relevant native/browser
parity checks). Never replace source-derived engine behavior with a stand-in
just because two snippets look similar. This is not a game-boot proof.
