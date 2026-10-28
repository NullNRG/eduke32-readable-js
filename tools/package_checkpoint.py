#!/usr/bin/env python3
"""Reproducible offline handoff of the canonical original-source EDuke32 project.

Preserve verified payloads from PACKAGE_MANIFEST, and include the current full
source-first inventory/link evidence.  Archive creation never implies that
JavaScript gameplay passed; the strict game gate owns that decision.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'PACKAGE_MANIFEST.json'
DEFAULT_INCLUDE = ('reports/oneshot-20261014', 'factory-output/source-first/oneshot-20261014', 'reports/continued-boot-recovery', 'reports/current-printf',
                   'reports/variadic-original-log', 'reports/browser-20261014', 'factory-output/source-first/automatic',
                   'factory-output/source-first/browser-current-linked', 'factory-output/source-first/browser-original-globals', 'reports/original-global-recovery-20261014', 'reports/accelerated-20261014', 'factory-output/source-first/accelerated-global-link')


def included_paths():
    existing = json.loads(MANIFEST.read_text(encoding='utf-8'))
    paths = {entry['path'] for entry in existing['files']}
    # Results written after a ZIP closes cannot be an input to that same ZIP.
    paths.discard('reports/oneshot-20261014/package-result.json')
    paths.update(('tools/package_checkpoint.py',
                  'tools/source_coroutine_cfg.py',
                  'tools/source_process_runtime.mjs',
                  'tools/source_variadic_runtime.mjs',
                  'tools/source_ast_to_js.py',
                  'tools/source_first_project.py',
                  'tools/source_first_autonomous.py',
                  'tests/source_factory/verify_persistent_ast_epoch.py',
                  'tests/source_factory/verify_sourcefirst_project_fastpath.py',
                  'tools/source_first_automate.py',
                  'tests/source_factory/miniz_original_coroutine.test.mjs',
                  'tools/source_header_records.py',
                  'tools/source_cpp_references.py',
                  'tests/source_factory/verify_sourcefirst_cpp_references.py',
                  'tests/source_factory/verify_sourcefirst_host_heap_alias.py',
                  'tests/source_factory/verify_source_header_offset_index.py',
                  'tests/source_factory/source_first_printf_fixture.cpp',
                  'tests/source_factory/source_first_case_string_fixture.cpp',
                  'tests/source_factory/verify_sourcefirst_printf.py',
                  'tests/source_factory/verify_sourcefirst_case_strings.py',
                  'tests/source_factory/source_first_variadic_fixture.c',
                  'tests/source_factory/source_first_variadic_cpp_fixture.cpp',
                  'tests/source_factory/verify_sourcefirst_variadic.py',
                  'tests/source_factory/verify_real_browser_runtime.py',
                  'tests/source_factory/verify_playable_browser.py',
                  'tests/source_factory/verify_original_globals_browser.py',
                  'reports/browser-original-globals.json',
                  'reports/current-full-game-gate.json',
                  'reports/current-full-game-gate.stderr',
                  'reports/browser-runtime-chromium.json',
                  'reports/browser-runtime-chromium.png',
                  'tests/source_factory/verify_original_vec2_methods_browser.py',
                  'reports/original-vec2-methods-browser.json',
                  'reports/original-vec2-methods-browser.png',
                  'reports/original-vec2-source-recovery.md',
                  'reports/browser-gameplay-attempt.json',
                  'reports/browser-real-strict-game-gate.json',
                  'reports/browser-real-strict-game-gate.stderr',
                  'CURRENT_PORT_STATUS.md',
                  'LLM_CONTINUATION_PROMPT.md'))
    paths.update(('INIT_RECOVERY_HANDOFF.md',
                  'tools/source_first_recover_module_initializers.py',
                  'tools/source_aggregate_runtime.mjs',
                  'tests/source_factory/verify_sourcefirst_anonymous_pointer_union.py',
                  'FIX14_RECOVERY_HANDOFF.md',
                  'reports/fix14/BROWSER_HANDOFF_SUMMARY.json',
                  'tests/source_factory/verify_sourcefirst_default_member_ctor.py',
                  'dist/force-test.html',
                  'tools/build_force_browser.py',
                  'tests/source_factory/verify_force_browser.py',
                  'tests/source_factory/verify_force_init_recovery.py',
                  'tests/source_factory/verify_zero_base_offsets.py',
                  'tests/source_factory/verify_net_field_offsets.mjs'))
    for dirname in ('reports/fix14',
                    'factory-output/source-first/fix14-types',
                    'factory-output/source-first/fix14-extra',
                    'factory-output/source-first/force-recovered',
                    'reports/dmi-constructor-recovery',
                    'factory-output/source-first/dmi-header-recovery',
                    'reports/force-browser',
                    'factory-output/source-first/force-init-recovery',
                    'factory-output/source-first/init-repair-probe',
                    'factory-output/source-first/offset-repair-alias'):
        for item in (ROOT / dirname).rglob('*'):
            if item.is_file() and '__pycache__' not in item.parts:
                paths.add(item.relative_to(ROOT).as_posix())
    paths.update(('tools/source_first_boot_frontier.py',
                  'tests/source_factory/verify_member_operator_header_closure.py',
                  'tests/source_factory/member_operator_fixture.cpp',
                  'tests/source_factory/member_operator_fixture.hpp',
                  'reports/startup/member-operator-parity.json',
                  'reports/startup/original-boot-frontier.json',
                  'STARTUP_CLOSURE_HANDOFF.md'))
    for dirname in ('factory-output/source-first/startup-probe-method',):
        for item in (ROOT/dirname).rglob('*'):
            if item.is_file() and '__pycache__' not in item.parts:
                paths.add(item.relative_to(ROOT).as_posix())
    for dirname in DEFAULT_INCLUDE:
        for item in (ROOT / dirname).rglob('*'):
            if item.is_file() and '__pycache__' not in item.parts and 'clang-ast-cache' not in item.parts:
                paths.add(item.relative_to(ROOT).as_posix())
    for rel in sorted(paths):
        if 'clang-ast-cache' in Path(rel).parts:continue  # rebuildable, potentially multi-GB raw AST cache
        path = Path(rel)
        if path.is_absolute() or not path.parts or '..' in path.parts:
            raise ValueError(f'Unsafe manifest path: {rel!r}')
        absolute = ROOT / path
        if not absolute.is_file() or absolute.is_symlink() or not absolute.resolve().is_relative_to(ROOT):
            raise ValueError(f'Missing/unsafe expected payload: {rel}')
        yield rel, absolute


def pack(output: Path):
    if not output.parent.is_dir():
        output.parent.mkdir(parents=True)
    if output.resolve().is_relative_to(ROOT):
        raise ValueError('Archive destination must be outside project payload')
    rows = []
    for rel, path in included_paths():
        with path.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        rows.append({'path': rel, 'bytes': path.stat().st_size, 'sha256': digest})
    data = (json.dumps({'files': rows}, indent=2) + '\n').encode('utf-8')
    manifest_temp = MANIFEST.with_suffix('.json.tmp')
    manifest_temp.write_bytes(data)
    os.replace(manifest_temp, MANIFEST)
    with tempfile.NamedTemporaryFile(dir=output.parent, suffix='.zip', delete=False) as temporary:
        temporary_path = Path(temporary.name)
    try:
        with zipfile.ZipFile(temporary_path, 'w', compression=zipfile.ZIP_DEFLATED,
                             compresslevel=5, allowZip64=True) as bundle:
            for row in rows:
                bundle.write(ROOT / row['path'], arcname='EDuke32_SourceFactory/' + row['path'])
            bundle.write(MANIFEST, arcname='EDuke32_SourceFactory/PACKAGE_MANIFEST.json')
        with zipfile.ZipFile(temporary_path) as bundle:
            problem = bundle.testzip()
            if problem:
                raise RuntimeError('ZIP CRC failure: ' + problem)
            assert len(bundle.namelist()) == len(rows) + 1
        os.replace(temporary_path, output)
    finally:
        temporary_path.unlink(missing_ok=True)
    with output.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    return {'zip': str(output), 'bytes': output.stat().st_size,
            'sha256': digest, 'payload_files': len(rows), 'zip_crc_verified': True,
            'gameplay_verified': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    arguments = parser.parse_args()
    print(json.dumps(pack(arguments.out), indent=2))

if __name__ == '__main__':
    main()
