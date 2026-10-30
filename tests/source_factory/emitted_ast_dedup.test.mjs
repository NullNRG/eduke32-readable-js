import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,readdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const ROOT=resolve(import.meta.dirname,'../..');
const SCRIPT=join(ROOT,'tools/dedup_emitted_ast.mjs');
const MARKER='// Source-first C/C++ -> JavaScript (original identifiers/structured statements).\n';
const HELPERS='const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;\n'
  +'const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;\n'
  +'const cRef = (read, write) => ({ __cReference:true, get value() { return read(); }, set value(v) { write(v); } });\n'
  +'const cArrayRef = (array, index) => cRef(() => array[index], v => { array[index] = v; });\n';
function execute(root,apply=false){
  const p=spawnSync(process.execPath,[SCRIPT,'--root',root,...(apply?['--apply']:[])],{encoding:'utf8'});
  if(p.status!==0)throw Error(p.stderr+' '+p.stdout);
  return JSON.parse(p.stdout);
}
test('identical transpiled helpers become shared runtime modules without merging source storage',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'eduke-generated-ast-'));
  try {
    mkdirSync(join(dir,'nested'));
    const original=MARKER+HELPERS+'export let storage = [5,9];\n'
      +'export function test(){ const slot=cArrayRef(storage,1); slot.value=i32(12);return u32(slot.value);}\n';
    const a=join(dir,'a.mjs'),b=join(dir,'nested/b.mjs');
    writeFileSync(a,original);writeFileSync(b,original);
    const dry=execute(dir);
    assert.equal(dry.modules_rewritten,2);
    assert.ok(dry.shared_helper_variants>=4);
    assert.ok(dry.net_bytes_saved>0);
    assert.equal(readFileSync(a,'utf8'),original);
    const applied=execute(dir,true);
    assert.equal(applied.modules_rewritten,2);
    assert.match(readFileSync(a,'utf8'),/import \{ cRef \}/);
    const ma=await import(pathToFileURL(a).href),mb=await import(pathToFileURL(b).href);
    assert.equal(ma.test(),12);assert.equal(mb.test(),12);
    assert.notEqual(ma.storage,mb.storage);
    assert.equal(execute(dir,true).modules_rewritten,0);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('identical dependent helper code with different dependency implementations is not merged',()=>{
  const dir=mkdtempSync(join(tmpdir(),'eduke-generated-ast-'));
  try {
    const referenceA=HELPERS.replace('get value() { return read(); }','get value() { return read(); }');
    const referenceB=HELPERS.replace('get value() { return read(); }','get value() { return read() + 1; }');
    writeFileSync(join(dir,'a.mjs'),MARKER+referenceA+'export function run(){return 1;}\n');
    writeFileSync(join(dir,'b.mjs'),MARKER+referenceB+'export function run(){return 2;}\n');
    const scan=execute(dir);
    assert.equal(scan.top_groups.some(g=>g.name==='cArrayRef'),false);
    assert.equal(scan.top_groups.some(g=>g.name==='cRef'),false);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
