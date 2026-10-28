#!/usr/bin/env python3
"""Strict fail-closed gate for the entire original source-first EDuke32 port.

The canonical build is the recovered original Make inventory followed by the
cross-batch ES-module linker. A historical 16-unit sample must never satisfy
this check. Readable source coverage, C++ ABI completeness and real browser
boot/render/play verification are independent prerequisites.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
from verify_port_acceptance import evaluate

ROOT=Path(__file__).resolve().parents[1]
def read(path):return json.loads(path.read_text()) if path.is_file() else None
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root',type=Path,default=ROOT)
parser.add_argument('--reports-root',type=Path)
parser.add_argument('--build-root',type=Path,default=ROOT/'factory-output/source-first/autonomous')
args=parser.parse_args()
ROOT=args.root.resolve()
commands=read(ROOT/'factory-output/compile_commands.json') or []
expected=len({entry['file'] for entry in commands})
build=args.build_root.resolve()
recover=read(build/'automatic/recovery-report.json') or {}
manifest=build/'globally-linked/global-recovery.json'
link=read(manifest) or {}
boot=read(build/'boot-audit.json') or {}
attestation=read(build/'source-build-attestation.json') or {}
# A historical or partly overwritten link manifest must never pass as a fresh
# original source compile; attest against the exact bytes in this build tree.
attested=bool(manifest.is_file() and attestation.get('linked_manifest_sha256')==
              hashlib.sha256(manifest.read_bytes()).hexdigest() and
              (build/'automatic/recovery-report.json').is_file() and
              attestation.get('source_compile_report_present') is True)
verified=int(recover.get('verified_batch_units',0))
failed=int(recover.get('failed_batch_units',expected-verified))
linked_partial_consistent=bool(attested and link and link.get('completed_source_units')==verified and link.get('selected_source_units')==expected)
linked_current=bool(linked_partial_consistent and verified==expected and failed==0 and
                    recover.get('uniform_compiler_revision_verified') is True)
blocked=int(link['total_blocked_definitions'] if linked_current else recover.get('blocked_definitions',0))
invalid=len(link.get('invalid_imports_or_syntax',[])) if linked_current else int(recover.get('invalid_imports',0))
ambiguous=len(link.get('ambiguous_export_names',{})) if linked_current else 0
# The game cannot be declared playable by the compiler's own build statistics.
# Real original-game browser boot, frame, input and sustained gameplay remain
# independent externally verifiable requirements, not fabricated boolean flags.
checks={
  'original_make_selected_translation_units':expected,
  'fresh_autonomous_output_attested':attested,
  'automated_verified_units':verified,
  'same_compiler_revision_verified':recover.get('uniform_compiler_revision_verified') is True,
  'automated_failed_units':failed,
  'readable_definitions':link['unique_exports'] if linked_current else recover.get('readable_definitions',0),
  'partial_link_matches_completed_compilation':linked_partial_consistent,
  'global_link_manifest_matches_current_inventory':linked_current,
  'blocked_definitions':blocked,
  'unverified_or_ambiguous_imports':invalid,
  'ambiguous_original_export_names':ambiguous,
  'original_boot_entry_emitted':boot.get('summary',{}).get('boot_entry_has_emitted_js',False),
  'partial_boot_graph_blocked_definitions':boot.get('summary',{}).get('graph_blocked'),
  'partial_boot_graph_unproven_owners':boot.get('summary',{}).get('no_proven_owner'),
  'llvm_emulation_fallback_used':False,
}
acceptance=evaluate(ROOT,reports_root=args.reports_root,build_root=build)
acceptance_checks={row['id']:row['status'] for row in acceptance['checks']}
checks['original_engine_linked']=(acceptance_checks.get('linked_javascript_integrity')=='passed'
                                 and acceptance_checks.get('startup_dependency_closure')=='passed')
checks['original_browser_boot_frames_input_and_play_verified']=(
    acceptance_checks.get('original_browser_gameplay')=='passed')
checks['all_strict_acceptance_criteria_passed']=acceptance['all_acceptance_criteria_passed']
checks['failed_acceptance_checks']=acceptance['failed_checks']
checks['unverified_acceptance_checks']=acceptance['unverified_checks']
print(json.dumps(checks,indent=2))
if not acceptance['all_acceptance_criteria_passed']:
    print('INCOMPLETE: a complete readable original-source game and browser gameplay must be verified.',file=sys.stderr)
    sys.exit(2)
print('VERIFIED: all original-source gameplay acceptance criteria passed.',file=sys.stderr)
sys.exit(0)
