#!/usr/bin/env node
// Recover lost manifest evidence only when the existing implementation AND its
// local helper closure exactly match the current uniform original-source build.
// No code generation, ownership guesses, source stubs or ABI exemptions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),ts=require('typescript');
const ROOT=path.resolve(__dirname,'..'),BUILD=path.join(ROOT,'factory-output/source-first/oct15-world-recovery'),TARGET=path.join(ROOT,'factory-output/source-first/browser-target');
const write=process.argv.includes('--write'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
const build=JSON.parse(fs.readFileSync(path.join(BUILD,'recovery-report.json'),'utf8'));
if(!build.uniform_compiler_revision_verified||build.verified_batch_units!==156||!build.compiler_revision_attestation?.verified)throw Error('Complete uniformly attested build required');
const cache=new Map();
function parse(file){
 if(cache.has(file))return cache.get(file);
 const text=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),map=new Map(),reexports=new Map(),exported=new Set();
 if(tree.parseDiagnostics.length)throw Error('Invalid source module '+file);
 for(const node of tree.statements){
  let names=[];
  if(ts.isFunctionDeclaration(node)||ts.isClassDeclaration(node)){if(node.name)names=[node.name.text];}
  else if(ts.isVariableStatement(node)){for(const d of node.declarationList.declarations)if(ts.isIdentifier(d.name))names.push(d.name.text);}
  else if(ts.isExportDeclaration(node)&&node.moduleSpecifier&&node.exportClause&&ts.isNamedExports(node.exportClause)){
   for(const n of node.exportClause.elements){if(n.propertyName&&n.propertyName.text!==n.name.text)continue;reexports.set(n.name.text,path.resolve(path.dirname(file),node.moduleSpecifier.text));exported.add(n.name.text);}
  }
  for(const name of names){if(map.has(name))throw Error('Duplicate declaration '+name+' in '+file);map.set(name,{code:node.getText(tree),node});if(node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))exported.add(name);}
 }
 const value={map,reexports,exported,text,tree,file};cache.set(file,value);return value;
}
function resolve(module,name,seen=new Set()){
 if(!module.file.startsWith(TARGET+path.sep))throw Error('Source facade escapes browser target');
 if(module.map.has(name))return module;
 if(!module.reexports.has(name))return null;
 if(seen.has(module.file))throw Error('Cyclic source facade');seen.add(module.file);
 return resolve(parse(module.reexports.get(name)),name,seen);
}
function tokens(text){const scan=ts.createScanner(ts.ScriptTarget.Latest,true,ts.LanguageVariant.Standard,text),out=[];let kind;while((kind=scan.scan())!==ts.SyntaxKind.EndOfFileToken)out.push([kind,scan.getTokenText()]);return JSON.stringify(out);}
function prove(active,fresh,name){
 const visited=new Set(),mismatched=[];
 function compare(binding){
  if(visited.has(binding))return;visited.add(binding);
  const a=active.map.get(binding),b=fresh.map.get(binding);
  if(!a||!b){mismatched.push({binding,reason:'missing-local-definition'});return;}
  if(tokens(a.code)!==tokens(b.code)){mismatched.push({binding,reason:'different-source-or-helper-implementation'});return;}
  const dependencies=new Set();
  function walk(node){if(ts.isIdentifier(node)&&fresh.map.has(node.text))dependencies.add(node.text);ts.forEachChild(node,walk);}
  walk(b.node);for(const dep of dependencies)compare(dep);
 }
 compare(name);
 return {passed:mismatched.length===0,bindings:[...visited].sort(),mismatched};
}
const results=[],changes=[];
for(const batch of build.batch_results){
 if(batch.status!=='ok')continue;
 for(const owner of batch.sources){
  const activeFile=path.join(TARGET,owner+'.mjs'),mf=activeFile.replace(/\.mjs$/,'.manifest.json');
  if(!fs.existsSync(activeFile)||!fs.existsSync(mf))continue;
  const freshFile=path.join(BUILD,path.dirname(batch.manifest),owner+'.mjs');
  if(!fs.existsSync(freshFile))continue;
  const actualHashes=batch.artifact_hashes||{};
  const expected=Object.entries(actualHashes).find(([n])=>n.replaceAll('\\','/')===owner+'.mjs')?.[1];
  if(!expected||hash(fs.readFileSync(freshFile))!==expected)throw Error('Current build module hash changed '+owner);
  const freshManifestFile=freshFile.replace(/\.mjs$/,'.manifest.json');
  const expectedManifest=Object.entries(actualHashes).find(([n])=>n.replaceAll('\\','/')===owner+'.manifest.json')?.[1];
  if(!expectedManifest||hash(fs.readFileSync(freshManifestFile))!==expectedManifest)throw Error('Current build manifest hash changed '+owner);
  const current=JSON.parse(fs.readFileSync(freshManifestFile,'utf8')),before=fs.readFileSync(mf,'utf8'),manifest=JSON.parse(before),active=parse(activeFile),fresh=parse(freshFile);
  let count=0;
  for(const definition of current.definitions){
   if(definition.status!=='source-first'||definition.linkage==='internal'||!active.exported.has(definition.name))continue;
   const prior=manifest.definitions.find(d=>d.name===definition.name);
   if(prior?.status==='source-first'&&(!definition.global_storage||JSON.stringify(canonical(prior.global_storage))===JSON.stringify(canonical(definition.global_storage))))continue;
   const implementation=resolve(active,definition.name);
   if(!implementation){results.push({owner,name:definition.name,accepted:false,reason:'active-export-not-backed-by-definition'});continue;}
   const proof=prove(implementation,fresh,definition.name);
   if(proof.passed&&definition.global_storage){
    const binding=definition.global_storage.binding;
    const cell=active.exported.has(binding)?resolve(active,binding):null;
    if(!cell){proof.passed=false;proof.mismatched.push({binding,reason:'missing-original-owner-storage-cell'});}
    else {const p=prove(cell,fresh,binding);proof.passed=p.passed;proof.bindings=[...new Set([...proof.bindings,...p.bindings])].sort();proof.mismatched.push(...p.mismatched);}
   }
   // Fresh full-TU definitions in this attested build have no speculative imports.
   // Any external imports require a separate module-level link audit, so defer.
   if(definition.external_imports?.length){proof.passed=false;proof.mismatched.push({reason:'external-import-closure-requires-separate-proof'});}
   results.push({owner,name:definition.name,accepted:proof.passed,implementation:path.relative(ROOT,implementation.file),proof});
   if(!proof.passed)continue;
   const row={...definition,active_definition_proof:{compiler_fingerprint:batch.compiler_fingerprint,
    original_manifest:path.relative(ROOT,freshManifestFile),original_manifest_sha256:expectedManifest,
    active_implementation:path.relative(ROOT,implementation.file),active_module_sha256:hash(implementation.text),
    compared_bindings:proof.bindings,exact_tokens_and_local_helpers:true}};
   if(prior)Object.assign(prior,row);else manifest.definitions.push(row);
   if(row.global_storage){manifest.storage_exports=(manifest.storage_exports||[]).filter(s=>s.name!==row.name);manifest.storage_exports.push({name:row.name,...row.global_storage});}
   count++;
  }
  if(count){manifest.found=manifest.definitions.length;manifest.emitted=manifest.definitions.filter(d=>d.status==='source-first').length;manifest.blocked=manifest.definitions.filter(d=>d.status==='blocked').length;changes.push({path:mf,before,after:JSON.stringify(manifest,null,2)+'\n',count});}
 }
}
if(write){
 for(const [file,parsed] of cache)if(hash(fs.readFileSync(file))!==hash(parsed.text))throw Error('Implementation changed during provenance audit '+file);
 const backup=path.join(ROOT,'work/pre-definition-proof-reconciliation');fs.mkdirSync(backup,{recursive:true});
 for(const change of changes){const dest=path.join(backup,path.relative(TARGET,change.path));fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.writeFileSync(dest,change.before);}
 const done=[];
 try{for(const change of changes){if(fs.readFileSync(change.path,'utf8')!==change.before)throw Error('Active manifest changed during proof audit');fs.writeFileSync(change.path+'.partial',change.after);fs.renameSync(change.path+'.partial',change.path);done.push(change);}}
 catch(error){for(const change of done)fs.writeFileSync(change.path,change.before);throw error;}
}
const result={format:'browser-definition-proof-reconciliation/1',write_requested:write,gameplay_verified:false,
    complete_compiler_fingerprint:build.compiler_revision_attestation.end_fingerprint,
    attempted:results.length,accepted:results.filter(r=>r.accepted).length,modules_changed:changes.map(c=>({path:path.relative(ROOT,c.path),definitions:c.count})),results};
fs.writeFileSync(path.join(ROOT,'reports/oct15-browser-definition-reconciliation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({attempted:result.attempted,accepted:result.accepted,modules:changes.length,written:write,accepted_names:results.filter(r=>r.accepted).map(r=>r.name).slice(0,30)},null,2));
