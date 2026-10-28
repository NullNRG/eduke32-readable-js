"""Prepare/review narrow compiler changes without mutating the frozen compiler."""
from pathlib import Path
import difflib
import shutil

ROOT = Path(__file__).resolve().parents[1]
STAGED = ROOT/'work/staged-trivial-assignment'
STAGED.mkdir(exist_ok=True)
shutil.copytree(ROOT/'tools', STAGED/'tools', dirs_exist_ok=True)


def replace(path, old, new, count=1):
    text = path.read_text(encoding='utf-8')
    assert text.count(old) == count, (path, old, text.count(old), count)
    path.write_text(text.replace(old, new), encoding='utf-8')


path = STAGED/'tools/source_ast_to_js.py'
replace(path, 'from source_byte_records import recover_byte_records, clean_type as clean_record_type',
        'from source_byte_records import recover_byte_records, clean_type as clean_record_type\nfrom source_trivial_assignment import recover_trivial_assignment_methods')
replace(path, "if not static_storage and any(kind(child)=='CXXMethodDecl' and any(kind(inner)=='CompoundStmt' for inner in kids(child))",
        "if not static_storage and any(kind(child)=='CXXMethodDecl' and not child.get('isImplicit') and any(kind(inner)=='CompoundStmt' for inner in kids(child))")
replace(path, '                method=self.member_operators.get(key)', '''                assignment=getattr(self,'trivial_assignment_methods',{}).get(decl.get('id'))
                if name=='operator=' and assignment and len(a)==3:
                    receiver=normalized_record_name(qual(a[1]),self.type_aliases)
                    argument=normalized_record_name(qual(a[2]),self.type_aliases)
                    schema=aggregate_type_schema(qual(a[1]),self.aggregate_records,self.type_aliases,self.record_layouts)
                    if not receiver or receiver!=argument or schema is None:
                        raise Unsupported('trivial assignment requires matching Clang-proven pointer-free storage: '+str(key))
                    return f'cAssignAggregate({self.expr(a[1])}, {self.expr(a[2])}, {json.dumps(schema,sort_keys=True)})'
                method=self.member_operators.get(key)''')
replace(path, 'def reference_names(node, resolver=None, class_dependencies=None):',
        'def reference_names(node, resolver=None, class_dependencies=None, trivial_assignments=None):')
replace(path, "                if cls:result.add(js_ident(cls))\n        if kind(n)=='DeclRefExpr':",
        "                if cls and ref.get('id') not in (trivial_assignments or {}):result.add(js_ident(cls))\n        if kind(n)=='DeclRefExpr':")
replace(path, '    aggregate_records=recover_trivial_aggregate_records(ast)',
        '    trivial_assignments=recover_trivial_assignment_methods(ast)\n    aggregate_records=recover_trivial_aggregate_records(ast)')
replace(path, 'reference_names(n,resolve,class_dependencies)',
        'reference_names(n,resolve,class_dependencies,trivial_assignments)', count=2)
replace(path, '        em=Emit();em.enum_values=enum_values;em.record_layouts=record_layouts',
        '        em=Emit();em.trivial_assignment_methods=trivial_assignments;em.enum_values=enum_values;em.record_layouts=record_layouts')
replace(path, "('cCopyAggregate(', 'cZeroAggregate(', 'cInitByteRecord(')",
        "('cCopyAggregate(', 'cZeroAggregate(', 'cInitByteRecord(', 'cAssignAggregate(')")
replace(path, '    memory_helpers=(HERE/',
        "    assignment_helpers=(HERE/'tools/source_aggregate_assignment_runtime.mjs').read_text(encoding='utf-8')+'\\n' if 'cAssignAggregate(' in body else ''\n    memory_helpers=(HERE/")
replace(path, 'span_helpers+aggregate_helpers+memory_helpers',
        'span_helpers+aggregate_helpers+assignment_helpers+memory_helpers')
replace(STAGED/'tools/source_byte_records.py',
        "if any(child.get('kind') in ('CXXMethodDecl','CXXConversionDecl') and\n               any(item.get('kind')=='CompoundStmt' for item in children(child))",
        "if any(child.get('kind') in ('CXXMethodDecl','CXXConversionDecl') and not child.get('isImplicit') and\n               any(item.get('kind')=='CompoundStmt' for item in children(child))")
replace(STAGED/'tools/source_first_automate.py',
        "ROOT/'tools/source_byte_records.py',",
        "ROOT/'tools/source_byte_records.py',ROOT/'tools/source_trivial_assignment.py',\n        ROOT/'tools/source_aggregate_assignment_runtime.mjs',")
replace(STAGED/'tools/source_first_global_link.py',
        "ROOT/'tools/source_byte_records.py',",
        "ROOT/'tools/source_byte_records.py',\n             ROOT/'tools/source_trivial_assignment.py',\n             ROOT/'tools/source_aggregate_assignment_runtime.mjs',")
patch = []
for name in ('source_ast_to_js.py','source_byte_records.py','source_first_automate.py','source_first_global_link.py'):
    original=(ROOT/'tools'/name).read_text(encoding='utf-8').splitlines(keepends=True)
    changed=(STAGED/'tools'/name).read_text(encoding='utf-8').splitlines(keepends=True)
    patch.extend(difflib.unified_diff(original,changed,fromfile='a/tools/'+name,tofile='b/tools/'+name))
(ROOT/'work/trivial-assignment-integration.patch').write_text(''.join(patch),encoding='utf-8')
print(STAGED/'tools')
