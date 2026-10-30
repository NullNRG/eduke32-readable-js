"""The browser allocator selection preserves original wrappers and input bytes."""
import importlib.util,json,re,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('prepare_browser_classic',ROOT/'tools/prepare_browser_classic.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with zipfile.ZipFile(ROOT/'input-source/eduke32-master.zip') as archive:
    originals={name:archive.read('eduke32-master/'+name) for name,_,_ in m.ADAPTATIONS}
    original_generic=archive.read('eduke32-master/source/build/src/smmalloc_generic.cpp')
for name,adapt,_ in m.ADAPTATIONS:
    data=originals[name];saved=bytes(data)
    result=m.adapted_bytes(data,adapt)
    assert data==saved and result!=data,name
    # The transformation is independent of the source's newline convention.
    lf=data.replace(b'\r\n',b'\n')
    assert m.adapted_bytes(lf,adapt)==result.replace(b'\r\n',b'\n'),name
    assert m.adapted_bytes(lf.replace(b'\n',b'\r\n'),adapt)==result.replace(b'\r\n',b'\n').replace(b'\n',b'\r\n'),name
    try:m.adapted_bytes(b'unrelated source\n',adapt)
    except ValueError:pass
    else:raise AssertionError('Source adaptation silently accepted unrelated bytes: '+name)
try:m.adapted_bytes(b'mixed\r\nnewline\n',lambda data:data)
except ValueError:pass
else:raise AssertionError('Mixed newlines accepted')
compat=originals[m.COMPAT].replace(b'\r\n',b'\n')
adapted=m.adapted_bytes(compat,m.browser_allocator_compat)
browser=adapted.split(b'#if defined(EDUKE32_BROWSER)\n',1)[1]
browser,desktop=browser.split(b'\n#else\nextern sm_allocator g_sm_heap;',1)
desktop=b'extern sm_allocator g_sm_heap;'+desktop
original=compat[compat.index(b'extern sm_allocator g_sm_heap;'):]
original=original[:original.index(b'\n#endif',original.index(b'static FORCE_INLINE void xaligned_free('))]
assert desktop.startswith(original+b'\n#endif\n'), 'Desktop fallback changed'
assert not re.search(rb'\b_sm_\w+\s*\(',browser)
assert b'g_sm_heap = sm::GenericAllocator::Create();' in browser
assert b'sm::GenericAllocator::Destroy(g_sm_heap);' in browser
# Every byte of the wrappers, including all error/zeroing/copy paths, is retained
# apart from selecting the actual source-defined allocation methods.
start=original.index(b'#ifdef BITNESS64')
expected=original[start:]
for old,new in ((b'_sm_malloc(',b'sm::GenericAllocator::Alloc('),
                (b'_sm_realloc(',b'sm::GenericAllocator::Realloc('),
                (b'_sm_free(',b'sm::GenericAllocator::Free(')):
    expected=expected.replace(old,new)
assert browser[browser.index(b'#ifdef BITNESS64'):]==expected
assert browser.count(b'handle_memerr(')==original.count(b'handle_memerr(')
profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
assert profile['allocator_backend']=='original-sm-GenericAllocator'
assert set(profile['excluded_allocator_units'])==m.POOL_UNITS
# Source backend implementation is never replaced by an adapter or a stub.
assert b'std::malloc(bytesCount + offset)' in original_generic
assert b'std::memmove(p2, p, std::min(oldBlockSize, bytesCount))' in original_generic
assert b'std::free(h->p)' in original_generic
print('PASS: source-attested browser GenericAllocator selection; original wrappers, errors, backend and desktop fallback preserved')
