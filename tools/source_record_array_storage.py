"""Data-only array consumers may borrow the owner's exact native record bytes.

An optional generated JS prototype is not native in-object storage. Consumers
that require a prototype retain the full schema contract. This does not change
record construction, assignment, pointer bounds, or lifetime checks.
"""
import hashlib,json,re
from source_record_data_access import layout_contract, LAYOUT_ABI, physical_schema

DATA_VIEW_ABI = 'source-native-record-array-data-view/1'
NESTED_LAYOUT_ABI = 'source-native-record-array-layout/2'
NESTED_VIEW_ABI = 'source-native-record-array-data-view/2'

def needs_prototype(schema):
    return bool(schema.get('prototype') or any(needs_prototype(field[key])
        for field in schema.get('fields',{}).values() for key in ('byteRecord','recordArray') if key in field))


def metadata(schema):
    result = {'native_element_layout': layout_contract(schema,preserve_nested_prototypes=True),
              'native_nested_layout': {'abi':NESTED_LAYOUT_ABI,
                'sha256':hashlib.sha256(json.dumps(physical_schema(schema),sort_keys=True).encode()).hexdigest()}}
    if not needs_prototype(schema):result['record_array_nested_data_view']=NESTED_VIEW_ABI
    if not schema.get('prototype'):
        result['record_array_data_view'] = DATA_VIEW_ABI
    return result


def compatible(dependency, provider):
    if 'record_array_nested_data_view' in dependency and dependency['record_array_nested_data_view']!=NESTED_VIEW_ABI:return False
    nested=dependency.get('record_array_nested_data_view') == NESTED_VIEW_ABI
    if not nested and dependency.get('record_array_data_view') != DATA_VIEW_ABI:
        return False
    # Array bounds are verified independently by the linker; aliases with
    # different source spellings remain strict until their identity is proven.
    element = lambda spelling: re.sub(r'\[\s*\d*\s*\]', '[]', spelling).strip()
    if not dependency.get('original_type') or element(dependency['original_type']) != element(provider.get('original_type', '')):
        return False
    key='native_nested_layout' if nested else 'native_element_layout'
    expected = dependency.get(key, {})
    actual = provider.get(key, {})
    abi=NESTED_LAYOUT_ABI if nested else LAYOUT_ABI
    digest = expected.get('sha256')
    return bool(expected.get('abi') == actual.get('abi') == abi
                and isinstance(digest, str) and re.fullmatch('[a-f0-9]{64}', digest)
                and digest == actual.get('sha256'))
