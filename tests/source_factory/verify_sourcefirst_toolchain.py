"""Toolchain configuration must preserve ABI and invalidate cached output."""
import hashlib
import os
from pathlib import Path
import sys
import tempfile
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]/'tools'))
import source_first_toolchain as tools

with patch.dict(os.environ, {'EDUKE32_CLANG_TARGET': 'x86_64-w64-mingw32'}):
    try: tools.frontend_config()
    except RuntimeError as error: assert 'LP64' in str(error)
    else: raise AssertionError('Windows LLP64 silently accepted')

with tempfile.TemporaryDirectory(prefix='source first sysroot ') as temp:
    root=Path(temp)
    for suffix in ('usr/include/c++/12/backward', 'usr/include/x86_64-linux-gnu/c++/12'):
        (root/suffix).mkdir(parents=True)
    header=root/'usr/include/test.h'
    header.write_text('#define ORIGINAL 1\n')
    compiler=root/'clang.exe'
    compiler.write_bytes(b'compiler-version-a')
    settings={'EDUKE32_SYSROOT':str(root), 'EDUKE32_CLANG_TARGET':'x86_64-linux-gnu',
              'EDUKE32_CLANGXX':str(compiler)}
    with patch.dict(os.environ, settings):
        frontend, args=tools.frontend_config()
        assert frontend==str(compiler),frontend
        assert '--target=x86_64-linux-gnu' in args,args
        for suffix in ('usr/include/c++/12', 'usr/include/c++/12/backward',
                       'usr/include/x86_64-linux-gnu/c++/12', 'usr/include/x86_64-linux-gnu'):
            assert str(root/suffix) in args,args
        config={'frontend':str(compiler), 'arguments':args}
        with patch.object(tools,'target_attestation',return_value=config):
            def fingerprint():
                result=hashlib.sha256();tools.fingerprint_toolchain(result);return result.hexdigest()
            before=fingerprint()
            assert before==fingerprint()
            header.write_text('#define ORIGINAL 2\n')
            assert before!=fingerprint(),'sysroot header changes must invalidate output'
            before=fingerprint();compiler.write_bytes(b'compiler-version-b')
            assert before!=fingerprint(),'compiler binary changes must invalidate output'
print('PASS: explicit Linux LP64 target, cross-host header paths, header/compiler cache invalidation')
