import test from 'node:test';
import assert from 'node:assert/strict';
import { loguru_log } from '../../runtime/browser_loguru.mjs';
import { NativeRuntime } from '../../runtime/index.mjs';
const cstr = value => Uint8Array.from(Buffer.from(value+'\0'));
test('Loguru browser provider renders original printf arguments and source provenance',()=>{
  const lines=[];const original=console.info;
  try {
    console.info=text=>lines.push(text);
    loguru_log(0,cstr('source/duke3d/src/game.cpp'),6095,cstr('%s'),cstr('COOP'));
    loguru_log(0,cstr('unit.cpp'),42,cstr('%d %u %X %%'),-7,-1,255);
  } finally { console.info=original; }
  assert.deepEqual(lines,['source/duke3d/src/game.cpp:6095 COOP','unit.cpp:42 -7 4294967295 FF %']);
});
test('Loguru rejects mismatched C formats and nonterminated strings',()=>{
  assert.throws(()=>loguru_log(0,cstr('f'),2,cstr('%s'),Uint8Array.of(65)),/Unterminated/);
  assert.throws(()=>loguru_log(0,cstr('f'),2,cstr('%Q'),15),/Unsupported/);
  assert.throws(()=>loguru_log(0,cstr('f'),2,cstr('%s')),/Missing/);
});

test('Loguru retains LP64 integers, dynamic widths and percent signs inside strings',()=>{
  const lines=[];const original=console.info;
  try {
    console.info=text=>lines.push(text);
    loguru_log(0,cstr('unit.cpp'),7,cstr('%llu %ld [%*.*s] %s'),18446744073709551615n,-9223372036854775808n,6,3,cstr('abcdef'),cstr('100% done %s'));
  } finally {console.info=original;}
  assert.deepEqual(lines,['unit.cpp:7 18446744073709551615 -9223372036854775808 [   abc] 100% done %s']);
});
test('native math log remains numerically distinct from C++ Loguru logging',()=>{
  const rt=new NativeRuntime();
  try {
    assert.equal(typeof rt.library.symbols.log,'function');
    assert.ok(Math.abs(rt.library.symbols.log(Math.E)-1)<1e-12);
    assert.notEqual(rt.library.symbols.log,loguru_log);
  } finally { rt.close(); }
});
