/** Run the same Python tools on Windows, Linux and macOS without shell aliases. */
import {spawn, spawnSync} from 'node:child_process';
import {delimiter} from 'node:path';

const candidates = process.env.PYTHON
  ? [[process.env.PYTHON]]
  : process.platform === 'win32'
    ? [['python'], ['py', '-3'], ['python3']]
    : [['python3'], ['python']];
let selected;
for (const candidate of candidates) {
  const probe = spawnSync(candidate[0], [...candidate.slice(1), '-c',
    'import sys; print(sys.executable); sys.exit(sys.version_info < (3, 10))'],
    {encoding: 'utf8', windowsHide: true, timeout: 10000});
  if (!probe.error && probe.status === 0 && probe.stdout.trim()) {
    selected = probe.stdout.trim();
    break;
  }
}
if (!selected) {
  console.error('Python 3.10+ is required. Install Python or set PYTHON to its executable path.');
  process.exit(127);
}
const child = spawn(selected, process.argv.slice(2), {
  stdio: 'inherit', windowsHide: true,
  env: {...process.env, PYTHON: selected, PYTHONUTF8: '1',
    ...(process.env.EDUKE32_PYTHON_PACKAGES ? {
      PYTHONPATH: [process.env.EDUKE32_PYTHON_PACKAGES, process.env.PYTHONPATH]
        .filter(Boolean).join(delimiter),
    } : {}),
  },
});
child.on('error', error => {console.error(error.message); process.exit(127);});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
