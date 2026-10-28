"""Public source archives exclude asset-bearing inputs and diagnostics."""
import sys,tempfile,zipfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from project_workspace import package
with tempfile.TemporaryDirectory(prefix='source-public-package-') as directory:
    root=Path(directory)
    for name in ('tools','runtime','tests','licenses','input-source','input-data','factory-output/source-tree',
                 'factory-output/source-first','work','reports','dist'):
        (root/name).mkdir(parents=True,exist_ok=True)
    (root/'tools/compiler.py').write_text('original compiler')
    (root/'input-data/DUKE3D.GRP').write_bytes(b'KenSilverman private fixture')
    (root/'dist/original-entry-attempt.html').write_text('private embedded diagnostic')
    public=root/'public.zip';private=root/'private.zip'
    package(root,public,public=True);package(root,private)
    with zipfile.ZipFile(public) as archive:
        names=archive.namelist()
        assert not any(name.lower().endswith('.grp') or '/dist/' in name for name in names),names
        assert any(name.endswith('tools/compiler.py') for name in names)
    with zipfile.ZipFile(private) as archive:
        names=archive.namelist()
        assert any(name.endswith('input-data/DUKE3D.GRP') for name in names)
        assert any(name.endswith('dist/original-entry-attempt.html') for name in names)
    (root/'tools/leak.mjs').write_bytes(b'a'*1_000_000+b'S2VuU2lsdmVybWFu')
    try:package(root,root/'bad.zip',public=True)
    except ValueError as error:assert 'Possible embedded GRP' in str(error)
    else:raise AssertionError('Public source package admitted embedded GRP marker')
print('Public package excludes GRP and dist; private continuation retains both; embedded marker rejected.')
