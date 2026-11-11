"""Data-only array consumers may borrow the owner's exact native record bytes.

An optional generated JS prototype is not native in-object storage. Consumers
that require a prototype retain the full schema contract. This does not change
record construction, assignment, pointer bounds, or lifetime checks.
"""
import re
from source_record_data_access import layout_contract, LAYOUT_ABI

DATA_VIEW_ABI = 'source-native-record-array-data-view/1'


def metadata(schema):
    result = {'native_element_layout': layout_contract(schema)}
    if not schema.get('prototype'):
        result['record_array_data_view'] = DATA_VIEW_ABI
    return result


def compatible(dependency, provider):
    if dependency.get('record_array_data_view') != DATA_VIEW_ABI:
        return False
    # Array bounds are verified independently by the linker; aliases with
    # different source spellings remain strict until their identity is proven.
    element = lambda spelling: re.sub(r'\[\s*\d*\s*\]', '[]', spelling).strip()
    if not dependency.get('original_type') or element(dependency['original_type']) != element(provider.get('original_type', '')):
        return False
    expected = dependency.get('native_element_layout', {})
    actual = provider.get('native_element_layout', {})
    digest = expected.get('sha256')
    return bool(expected.get('abi') == actual.get('abi') == LAYOUT_ABI
                and isinstance(digest, str) and re.fullmatch('[a-f0-9]{64}', digest)
                and digest == actual.get('sha256'))
