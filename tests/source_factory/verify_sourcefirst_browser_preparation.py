"""Browser source restoration needs no game data and preserves original bytes."""
import sys,tempfile,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from prepare_browser_classic import restore_source_archive,digest,browser_drivers
with tempfile.TemporaryDirectory() as directory:
    root=Path(directory);archive=root/'source.zip';out=root/'extracted'
    original=b'#ifdef __linux__\n#include "driver_alsa.h"\n#endif\nSDL_driver;\n#ifdef __linux__\nALSA_driver;\n#endif\nOPL_driver;\n'
    with zipfile.ZipFile(archive,'w') as z:
        z.writestr('eduke32-master/GNUmakefile','original make rules')
        z.writestr('eduke32-master/source/drivers.cpp',original)
    expected=digest(archive.read_bytes());restore_source_archive(archive,out,expected)
    restored=out/'eduke32-master/source/drivers.cpp';assert restored.read_bytes()==original
    projected=browser_drivers(original)
    assert projected.count(b'!defined(EDUKE32_BROWSER)')==2
    assert b'SDL_driver;' in projected and b'OPL_driver;' in projected
    assert restored.read_bytes()==original and not (root/'input-data').exists()
    restore_source_archive(archive,out,expected)
    restored.write_bytes(b'developer modification')
    try:restore_source_archive(archive,out,expected)
    except ValueError:pass
    else:raise AssertionError('Existing source was overwritten')
    assert restored.read_bytes()==b'developer modification'
    try:restore_source_archive(archive,root/'wrong-hash','0'*64)
    except ValueError:pass
    else:raise AssertionError('Wrong original archive accepted')
    unsafe=root/'unsafe.zip'
    with zipfile.ZipFile(unsafe,'w') as z:
        z.writestr('eduke32-master/GNUmakefile','safe')
        z.writestr('eduke32-master/../../outside','escape')
    try:restore_source_archive(unsafe,root/'unsafe-output',digest(unsafe.read_bytes()))
    except ValueError:pass
    else:raise AssertionError('Unsafe archive accepted')
    assert not (root/'unsafe-output').exists()
print('PASS source-only restore, immutable originals, ALSA capability guard and unsafe-archive rejection.')
