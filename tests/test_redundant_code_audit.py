"""Regression tests for the read-only shared-helper/clone auditor."""
from __future__ import annotations
import importlib.util
from pathlib import Path
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / 'tools/audit_redundant_code.py'
spec = importlib.util.spec_from_file_location('audit_redundant_code', MODULE)
audit_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_module)

PY_SAME = '''import json

def read(path):
    return json.loads(path.read_text())

def checksum(path):
    import hashlib
    return hashlib.sha256(path.read_bytes()).hexdigest()
'''
SHARED_JS = '''export function calculate(source) {
    let count = 0;
    const values = [1, 2, 3, 4, 5];
    for (const value of values) {
        if (value > 2) {
            count += value * 17;
            source.push(count);
        }
    }
    const output = values.map(value => value * count);
    return output.reduce((total, value) => total + value, 0);
}
'''

class AuditTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for directory in ('tools', 'runtime', 'tests', 'factory-output'):
            (self.root / directory).mkdir()
        (self.root / 'tools/a.py').write_text(PY_SAME)
        (self.root / 'tools/b.py').write_text(PY_SAME)
        (self.root / 'runtime/a.mjs').write_text(SHARED_JS)
        (self.root / 'runtime/b.mjs').write_text('const unrelated = true;\n' + SHARED_JS)
        (self.root / 'factory-output/generated.mjs').write_text(SHARED_JS)

    def test_ast_exact_and_helper_families(self):
        output = audit_module.audit(self.root, min_tokens=12)
        self.assertEqual(output['meta']['files_scanned'], 4)
        self.assertTrue(output['exact_files'])
        self.assertTrue(output['exact_functions'])
        self.assertTrue(any(x['family'] == 'json-io' for x in output['shared_helper_opportunities']))
        self.assertTrue(any(x['family'] == 'file-hashing' for x in output['shared_helper_opportunities']))
        self.assertTrue(output['same_layout_functions'])
        self.assertEqual(output['parse_errors'], [])

    def test_shifted_js_clone_and_generated_exclusion(self):
        output = audit_module.audit(self.root, min_tokens=35)
        self.assertTrue(any(r['mode'] == 'literal' for r in output['repeated_code_blocks']))
        self.assertFalse(any('factory-output' in str(r) for r in output['repeated_code_blocks']))
        self.assertEqual((self.root / 'runtime/a.mjs').read_text(), SHARED_JS)

    def test_generated_explicit_opt_in(self):
        result = audit_module.audit(self.root, all_dirs=True, include_generated=True, min_tokens=12)
        self.assertEqual(result['meta']['files_scanned'], 5)

if __name__ == '__main__':
    unittest.main()
