#!/usr/bin/env python3
"""Build strict browser SDL ABI providers for C++ -> native JS source imports.

This maps existing, IMPLEMENTED SDL browser adapter functions into the original
source compiler's verified project-symbol owner format. It is not a stub
provider: an unbound runtime throws, unsupported host operations retain their
original adapter's failure semantics, and no EDuke32 gameplay symbol is forged.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
OWNER = 'browser-abi/sdl_provider'
# Borrowed, NUL-terminated SDL strings returned by these APIs must be visible
# as Clang-emitted C byte arrays to source-translated callers. Allocator-owned
# strings (SDL_GetClipboardText etc.) stay numeric to preserve SDL_free lifetime.
BORROWED_CSTRING_RETURNS = frozenset({'SDL_GetAudioDriver','SDL_GetCurrentAudioDriver',
    'SDL_GetVideoDriver','SDL_GetCurrentVideoDriver','SDL_GetError','SDL_GetDisplayName',
    'SDL_GetHint','SDL_GetAudioDeviceName','SDL_GetGameControllerName',
    'SDL_GameControllerName','SDL_JoystickName','SDL_GetScancodeName',
    'SDL_GetKeyName','SDL_GetPlatform'})

def source_symbols(path: Path) -> list[str]:
    data = path.read_text(encoding='utf-8')
    # Only literal exported ABI properties from the actual createSDLBrowser()
    # symbols table qualify; comments and calls cannot become providers.
    body = data.split('  const symbols={', 1)
    if len(body) != 2:
        raise ValueError('Missing SDL ABI symbol table')
    body = body[1].split('  return Object.freeze({symbols:', 1)
    if len(body) != 2:
        raise ValueError('SDL ABI symbol table end not found')
    names = re.findall(r'^\s*(SDL_[A-Za-z0-9_]+)\s*:', body[0], re.M)
    if len(names) < 40 or len(set(names)) != len(names):
        raise ValueError('SDL ABI source symbols missing or duplicated')
    return sorted(names)

def build(output: Path, report: Path) -> dict:
    source = ROOT / 'runtime/sdl_browser.mjs'
    names = source_symbols(source)
    output.mkdir(parents=True, exist_ok=True)
    module = output / (OWNER + '.mjs')
    module.parent.mkdir(parents=True, exist_ok=True)
    contents = '''// AUTO-GENERATED: executable browser SDL ABI functions, never no-op symbol stubs.
// Generated from runtime/sdl_browser.mjs by tools/browser_target_abi.py.
let active = null;
let heap = null;
const BORROWED_CSTRINGS = new Set(BORROWED_LIST);
const sourceReturn = (name,value) => {
  if (!BORROWED_CSTRINGS.has(name) || !value) return value;
  if (!heap || !Number.isSafeInteger(value)) throw new TypeError('Borrowed SDL string needs ABI pointer');
  return new TextEncoder().encode(heap.readCString(value) + '\\0');
};
export function bindBrowserSDL(runtime) {
  if (active !== null) throw new Error('Browser SDL ABI is already bound');
  const provided = runtime?.sdl?.symbols;
  if (!provided || typeof provided !== 'object') throw new TypeError('NativeRuntime SDL services are required');
  for (const name of BROWSER_SDL_SYMBOLS)
    if (typeof provided[name] !== 'function') throw new Error('Missing real browser SDL service: ' + name);
  active = provided; heap = runtime.heap;
  let detached = false;
  return () => { if (detached) return; detached = true; if (active === provided) { active = null; heap = null; } };
}
export const BROWSER_SDL_SYMBOLS = Object.freeze(SYMBOL_LIST);
'''.replace('SYMBOL_LIST', json.dumps(names)).replace('BORROWED_LIST',json.dumps(sorted(set(names) & BORROWED_CSTRING_RETURNS)))
    for name in names:
        contents += (f'export function {name}(...args) {{\n'
                     f'  if (!active) throw new Error("Browser SDL ABI is not bound: {name}");\n'
                     f'  return sourceReturn({json.dumps(name)}, active.{name}(...args));\n}}\n')
    module.write_text(contents, encoding='utf-8')
    owner_map = {name: OWNER for name in names}
    index_path = output / 'browser-sdl-symbol-owners.json'
    index_path.write_text(json.dumps(owner_map, indent=2) + '\n', encoding='utf-8')
    result = {'format': 'eduke32-sourcefactory-browser-sdl-provider/1',
              'owner': OWNER, 'provider': str(module.relative_to(output)),
              'provided_count': len(names), 'symbols': names,
              'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'exports_generated': True, 'original_gameplay_verified': False,
              'notes': 'These are executable SDL browser host bindings; C++ engine/game functions are NOT replaced.'}
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return result

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out', type=Path, default=ROOT/'factory-output/source-first/browser-target')
    ap.add_argument('--report', type=Path, default=ROOT/'reports/browser-target/abi-provider.json')
    args = ap.parse_args()
    x = build(args.out.resolve(), args.report.resolve())
    print(json.dumps({'provider': x['provider'], 'provided_count': x['provided_count'], 'original_gameplay_verified': False}))

if __name__ == '__main__':
    main()
