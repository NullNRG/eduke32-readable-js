import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const launcher = new URL('../../tools/run_python.mjs', import.meta.url);
function run(args, env = process.env) {
  return spawnSync(process.execPath, [fileURLToPath(launcher), ...args],
    {encoding: 'utf8', env, windowsHide: true});
}
test('Python launcher propagates arguments, UTF-8 and exit status', () => {
  const result = run(['-c', 'import os,sys; print(sys.argv[1]); print(os.environ["PYTHONUTF8"]); sys.exit(7)', 'path with spaces/é']);
  assert.equal(result.status, 7, result.stderr);
  assert.equal(result.stdout.trim().replaceAll('\r\n', '\n'), 'path with spaces/é\n1');
});
test('an explicit missing PYTHON fails clearly instead of falling back', () => {
  const result = run(['-c', 'print("unexpected")'], {...process.env, PYTHON: '__missing_python_for_test__'});
  assert.equal(result.status, 127);
  assert.match(result.stderr, /Python 3\.10\+ is required/);
  assert.equal(result.stdout, '');
});
test('isolated Python package directory with spaces is importable', () => {
  const directory = mkdtempSync(join(tmpdir(), 'source first packages '));
  try {
    writeFileSync(join(directory, 'eduke_launcher_fixture.py'), 'VALUE = 37\n');
    const result = run(['-c', 'from eduke_launcher_fixture import VALUE; print(VALUE)'],
      {...process.env, EDUKE32_PYTHON_PACKAGES: directory});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), '37');
  } finally {rmSync(directory, {recursive: true, force: true});}
});
