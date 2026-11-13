import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=new URL('../',import.meta.url),directory=new URL('factory-output/source-first/browser-classic/browser-modules/',base);
const url=new URL('source/build/src/mmulti.cpp.mjs',directory),manifest=JSON.parse(await readFile(new URL('source/build/src/mmulti.cpp.manifest.json',directory),'utf8'));
const m=await import(url);
for(const name of ['numplayers','myconnectindex','connecthead']){
 assert.equal(m[name],0);
 const proof=manifest.storage_exports.find(p=>p.name===name);assert.equal(proof.abi,'source-global-cell/2');
 const cell=m[proof.binding]();assert.equal(cell,m[proof.binding]());
 for(let i=-32;i<32;i++){cell.value=i;assert.equal(m[name],i);assert.equal(m[proof.binding]().value,i);}
 cell.value=0;
}
assert.ok(m.connectpoint2 instanceof Int32Array);assert.equal(m.connectpoint2.length,16);
assert.ok([...m.connectpoint2].every(n=>n===0));
for(let i=0;i<16;i++){m.connectpoint2[i]=i*13-9;assert.equal(new DataView(m.connectpoint2.buffer,m.connectpoint2.byteOffset).getInt32(i*4,true),i*13-9);}
m.connectpoint2.fill(0);
const report={passed:true,source:'source/build/src/mmulti.cpp',original_declarations:['numplayers','myconnectindex','connecthead','connectpoint2'],original_zero_initialization:true,persistent_address_cells:true,scalar_alias_cases:192,original_contiguous_array_slots:16,network_services_executed:false,app_main_executed:false,gameplay_verified:false,module_sha256:createHash('sha256').update(await readFile(url)).digest('hex')};
await writeFile(new URL('reports/nov13-original-player-chain-storage.json',base),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
