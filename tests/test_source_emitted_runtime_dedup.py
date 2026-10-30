"""Real ESM execution and fail-closed tests for emitted runtime sharing."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'tools/source_emitted_runtime_dedup.py'
spec = importlib.util.spec_from_file_location('source_emitted_runtime_dedup', SCRIPT)
D = importlib.util.module_from_spec(spec)
spec.loader.exec_module(D)

BODY = """
export const originalSymbol = new Uint8Array([3, 5, 7, 9]);
export function read_original() {
  return cPointer(originalSymbol).__cPointer === true &&
         cByteMemory.memcmp(originalSymbol, new Uint8Array([3,5,7,9]), 4) === 0;
}
export function record_init() {
  return typeof cInitByteRecord === 'function' &&
         typeof cCopyAggregate === 'function';
}
"""

class EmittedHelperSharingTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'source').mkdir()
        self.catalog = D.catalogue(D.REPO)

    def emit(self, relative, keys, body=BODY):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        text = D.MARKER + '\n// Original translation unit: smoke.cpp\n'
        text += ''.join(self.catalog[k]['content'] for k in keys)
        text += body
        path.write_text(text)
        return path

    def test_shared_esm_executes_in_two_translation_units(self):
        keys = ['address', 'pointer', 'aggregate', 'memory']
        first = self.emit('source/a.cpp.mjs', keys)
        second = self.emit('source/nested/b.cpp.mjs', keys)
        untouched = self.emit('source/original.cpp.mjs', [], '\nexport const original = 42;\n')
        previous = untouched.read_bytes()
        result = D.optimize(self.root, apply=False, verify=True)
        self.assertEqual(result['modules_rewritten'], 2)
        self.assertEqual(result['helper_occurrences_removed'], 8)
        self.assertGreater(result['estimated_net_bytes_saved'], 0)
        self.assertEqual(first.read_text().count('const cPointer ='), 1)
        applied = D.optimize(self.root, apply=True, verify=True)
        self.assertEqual(applied['modules_rewritten'], 2)
        self.assertEqual(untouched.read_bytes(), previous)
        self.assertNotIn('const cPointer =', first.read_text())
        self.assertRegex(first.read_text(), r'import \{ [^\n}]*cPointer[^\n}]* \} from')
        self.assertTrue((self.root / D.SHARED_DIR).is_dir())
        script = (f"const a=await import({json.dumps(first.as_uri())});\n"
                  f"const b=await import({json.dumps(second.as_uri())});\n"
                  "if(!a.read_original()||!b.read_original()||"
                  "!a.record_init()||!b.record_init()) throw new Error('ABI failed');\n"
                  "if(a.originalSymbol===b.originalSymbol)throw new Error('TU storage merged');\n")
        subprocess.run(['node','--input-type=module','-e',script],
                       check=True, capture_output=True, text=True, timeout=20)
        self.assertEqual(D.optimize(self.root, apply=True)['modules_rewritten'], 0)

    def test_refuses_missing_lexical_dependencies(self):
        source = self.emit('source/bad.cpp.mjs', ['aggregate'], BODY)
        previous = source.read_bytes()
        with self.assertRaisesRegex(ValueError, 'missing required embedded address'):
            D.optimize(self.root, apply=True)
        self.assertEqual(source.read_bytes(), previous)

    def test_no_helper_or_non_generated_source_is_mangled(self):
        file = self.root/'source/plain.mjs'
        file.write_text(self.catalog['pointer']['content'])
        (self.root/'source/foreign.cpp.mjs').write_text(
            '/* handwritten */\n' + self.catalog['address']['content'])
        self.assertEqual(D.optimize(self.root)['modules_rewritten'], 0)

    def test_dependency_order_and_hashes_stable(self):
        keys = ['address','c_heap','lifetime','cpp_heap','pointer',
                'span','aggregate','assignment','variadic','memory','process']
        p = self.emit('source/full.cpp.mjs', keys, '\nexport function shared(){return cSourceAddresses.abi;}\n')
        report = D.optimize(self.root, apply=True, verify=True)
        self.assertEqual(report['canonical_helper_kinds'], len(keys))
        self.assertEqual(len(report['canonical_implementations']), len(keys))
        code = p.read_text()
        self.assertLess(code.index('address-'), code.index('pointer-'))
        subprocess.run(['node','--input-type=module','-e',
                        f'const m=await import({json.dumps(p.as_uri())});'
                        'if(m.shared()!=="source-lp64-addresses/2")throw new Error("ABI drift")'],
                       check=True, capture_output=True, text=True, timeout=20)

if __name__ == '__main__':
    unittest.main()
