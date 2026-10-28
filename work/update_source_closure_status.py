"""Publish evidence from completed source-closure integration, never infer boot."""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from source_first_automate import fingerprint

def read(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8-sig"))

regression_path = "reports/oct20-source-closure-regression.json"
regression = read(regression_path)
assert regression["complete"] and regression["all_passed"] and regression["regression_inputs_unchanged"]
for name, expected in regression["regression_inputs"].items():
    assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == expected, name
job = read("reports/oct20-source-closure-job.json")
assert job["phase"] == "audits-finished", job["phase"]
build_name = "oct20-source-closure-recovery"
linked_name = "oct20-source-closure-linked"
build = read(f"factory-output/source-first/{build_name}/recovery-report.json")
linked = read(f"factory-output/source-first/{linked_name}/global-recovery.json")
composition = read("factory-output/source-first/oct20-source-closure-link-input/recovery-report.json")
game = read("reports/browser-gameplay-attempt.json")
fp = fingerprint(ROOT / "factory-output/compile_commands.json", ROOT / "factory-output/source-tree/eduke32-master", [])
assert build["compiler_revision_attestation"]["verified"]
assert build["compiler_revision_attestation"]["end_fingerprint"] == fp
proofs = [
    "reports/oct19-nested-goto-parity.json",
    "reports/oct19-sysroot-inline-parity.json",
    "reports/oct20-original-macro-header-parity.json",
]
frontier = []
names = {"app_main", "enginePreInit", "engineSetLogFile", "engineSetupLogging",
         "engineLogCallback", "s_mutex", "s_callbacks", "add_callback", "add_file",
         "cansee", "fgrouscan", "classicDrawSprite"}
for path in (ROOT / "factory-output/source-first" / linked_name).rglob("*.manifest.json"):
    if any(part in {"probes", "clang-ast-cache"} for part in path.parts):
        continue
    data = json.loads(path.read_text())
    for row in data.get("definitions", []):
        if row.get("source_name") in names:
            frontier.append({"manifest": path.relative_to(ROOT).as_posix(), **row})
report = {
    "format": "canonical-sourcefactory-status/5",
    "updated_utc": datetime.now(timezone.utc).isoformat(),
    "compiler_sha256": regression["compiler_frontend_sha256"],
    "current_compiler_fingerprint": fp,
    "current_build": build_name,
    "current_recompiled_units": build["verified_batch_units"],
    "current_emitted_definition_entries": build["readable_definitions"],
    "current_blocked_definition_entries": build["blocked_definitions"],
    "current_regression_counts": regression["counts"],
    "current_regression_report": regression_path,
    "all_current_regression_inputs_unchanged": True,
    "compiler_feature_reports": proofs,
    "startup_and_render_frontier": frontier,
    "strict_game_gate": game,
    "latest_bounded_link": {k: linked[k] for k in (
        "module_emitted_definition_entries", "total_blocked_definitions",
        "ambiguous_export_names", "invalid_imports_or_syntax",
        "recovery_round_limit", "full_game_linked")},
    "saved_link_work_reuse": {k: composition[k] for k in (
        "saved_verified_link_overlays", "rejected_incompatible_saved_link_overlays")},
    "uniform_156_unit_current_revision": False,
    "original_gameplay_verified": False,
    "offline_playable_index_present": (ROOT / "dist/index.html").is_file(),
}
assert not report["offline_playable_index_present"], "Verify new game evidence before publishing this status."
resume = "python work/finish_source_closure.py"
text = f"""# EDuke32 SourceFactory — continuation status

**Original browser gameplay remains unverified. No playable dist/index.html exists.**

The compiler now lowers nested lexical goto regions while preserving the original loop/switch break and continue targets. Native C++/Node/Chromium comparisons cover 4,096 values. It recovers actual target-standard-library inline bodies by their Clang identities and physical header locations; std::min/max returned-reference identity and original vec3 constructors are covered by 1,536 compared values. It also recovers macro-generated original Build fixed-point helpers using verified Clang macro expansion provenance. All 96 original mulscale/dmulscale/tmulscale specializations match native C++ in Node and Chromium across 24,576 values. These are compiler and source-function checks, not gameplay.

The complete current regression suite passed {regression['counts']['passed']}/{regression['selected_tests']} tests with every attested input unchanged. Evidence: {regression_path}.

The affected original-source rebuild verified {build['verified_batch_units']} units at compiler fingerprint {fp}: {build['readable_definitions']} emitted entries, {build['blocked_definitions']} blocked entries and {build['invalid_imports']} invalid imports. Other saved units retain their historical compiler revisions. This is not a fresh uniform 156-unit build.

The bounded global link reports {linked['total_blocked_definitions']} blocked observations, {len(linked['ambiguous_export_names'])} ambiguous export groups and {len(linked['invalid_imports_or_syntax'])} invalid import/syntax findings. It ran with a limit of {linked['recovery_round_limit']} recovery rounds and is not a completed whole-game fixed point. Saved recovery work is reused only after ownership, native storage and reference-call contract validation. See reports/all-blockers.json, reports/root-causes.json, reports/dependency-graph.json and reports/boot-blockers.json.

Original startup still needs Loguru recursive-mutex/container/lifetime semantics, OSD object lifetime, original allocator closure and source-pointer/browser-memory integration. Original rendering and gameplay dependencies remain incomplete. The exact startup and renderer definitions are recorded in reports/oct20-current-status.json.

The historical offline diagnostic dist/original-entry-attempt.html mounts the real 456-file GRP, enters original app_main, returns from G_ExtPreInit and stops with engineSetLogFile undefined. It bypasses the unlinked native main preamble and is not proof of boot. That historical page was not regenerated as a successful game.

The strict original-game test fails because dist/index.html is missing. Original menus, E1L1 loading, movement, jumping, shooting, enemies, collision, audio, save/load, 60-second gameplay and full-engine native parity have not passed. No WASM or emulator was added.

Resume from the canonical project after adapting and dot-sourcing work/session-env.ps1:

```powershell
. work/session-env.ps1
{resume}
```

That command verifies the existing regression input hashes, resumes the 12 affected source units, composes verified saved link work, performs bounded dependency retries, refreshes blocker/boot audits and runs the strict game test. After any compiler/runtime/test changes, first run:

```text
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/oct20-source-closure-regression.json
```

Use one heavy worker at a time on this host. Compiler changes invalidate cached emission; persistent raw ASTs may be reused only when their source/header/ABI key matches.
"""
for name in ("reports/oct20-current-status.json", "reports/oct16-current-status.json"):
    (ROOT / name).write_text(json.dumps(report, indent=2) + "\n")
for name in ("CURRENT_PORT_STATUS.md", "reports/oct20-current-status.md", "reports/oct16-current-status.md"):
    (ROOT / name).write_text(text)
print(json.dumps({k: report[k] for k in ("current_recompiled_units", "current_regression_counts", "original_gameplay_verified")}))
