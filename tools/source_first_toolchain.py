"""Explicit source-AST target configuration for the captured Linux LP64 build.

The host compiler can run on Windows; its default Windows LLP64 ABI cannot be
used by the source compiler. Native executable parity tests use the host ABI
separately and must not be represented as Linux full-engine parity.
"""
import functools
import json
import os
from pathlib import Path
import shutil
import subprocess


def frontend_config(cpp=True):
    variable = 'EDUKE32_CLANGXX' if cpp else 'EDUKE32_CLANG'
    frontend = os.environ.get(variable, 'clang++' if cpp else 'clang')
    frontend = shutil.which(frontend) or frontend
    target = os.environ.get('EDUKE32_CLANG_TARGET', 'x86_64-linux-gnu')
    # Other ABI implementations are not yet available in source_ast_to_js.py.
    if target not in ('x86_64-linux-gnu', 'x86_64-unknown-linux-gnu', 'x86_64-pc-linux-gnu'):
        raise RuntimeError('Source-first lowering requires captured x86_64 Linux LP64 ABI; '
                           'unsupported EDUKE32_CLANG_TARGET=' + target)
    args = ['--target=' + target]
    sysroot = os.environ.get('EDUKE32_SYSROOT')
    if sysroot:
        root = Path(sysroot).resolve()
        if not root.is_dir():
            raise RuntimeError('EDUKE32_SYSROOT does not exist: ' + str(root))
        args += ['--sysroot=' + str(root)]
        if cpp:
            versions = sorted((root/'usr/include/c++').glob('*'),
                              key=lambda p: tuple(int(x) for x in p.name.split('.') if x.isdigit()))
            if versions:
                include = versions[-1]
                for path in (include, root/'usr/include/x86_64-linux-gnu/c++'/include.name,
                             include/'backward'):
                    if path.is_dir(): args += ['-isystem', str(path)]
        multiarch = root/'usr/include/x86_64-linux-gnu'
        if multiarch.is_dir(): args += ['-isystem', str(multiarch)]
    return frontend, args


@functools.lru_cache(maxsize=8)
def _probe(frontend, args):
    source = ('#if __SIZEOF_POINTER__ != 8 || __SIZEOF_LONG__ != 8 || '
              '__SIZEOF_INT__ != 4 || __CHAR_BIT__ != 8\n#error Unsupported source ABI\n#endif\n'
              '#if __BYTE_ORDER__ != __ORDER_LITTLE_ENDIAN__\n#error Unsupported byte order\n#endif\n')
    try:
        result = subprocess.run([frontend, *args, '-x', 'c', '-fsyntax-only', '-'],
                                input=source, capture_output=True, text=True, timeout=30)
        version = subprocess.run([frontend, '--version'], capture_output=True,
                                 text=True, timeout=30)
    except OSError as error:
        raise RuntimeError('Clang frontend unavailable: ' + frontend + '; set '
                           'EDUKE32_CLANG and EDUKE32_CLANGXX or add Clang to PATH') from error
    if result.returncode:
        raise RuntimeError('Captured Linux LP64 target probe failed:\n' + result.stderr)
    return {'frontend': frontend, 'arguments': list(args), 'abi': 'x86_64-linux-lp64-le',
            'compiler_version': version.stdout.strip(), 'abi_verified': True}


def target_attestation(cpp=True):
    frontend, args = frontend_config(cpp)
    return _probe(frontend, tuple(args))


def fingerprint_toolchain(hasher):
    """Invalidate build checkpoints when target, compiler or sysroot bytes change."""
    config = [target_attestation(False), target_attestation(True)]
    hasher.update(json.dumps(config, sort_keys=True).encode())
    for name in {item['frontend'] for item in config}:
        path = Path(name)
        if path.is_file():
            with path.open('rb') as stream:
                for block in iter(lambda: stream.read(1024*1024), b''): hasher.update(block)
    sysroot = os.environ.get('EDUKE32_SYSROOT')
    if sysroot:
        root = Path(sysroot).resolve()
        for path in sorted(root.rglob('*')):
            if path.is_file():
                hasher.update(path.relative_to(root).as_posix().encode())
                with path.open('rb') as stream:
                    for block in iter(lambda: stream.read(1024*1024), b''): hasher.update(block)
