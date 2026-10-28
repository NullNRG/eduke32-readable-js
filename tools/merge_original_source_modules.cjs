#!/usr/bin/env node
'use strict';
/**
 * One C++ translation unit -> one live JavaScript module. Merge additions from
 * a partial recent compile into the older broad source translation, retaining
 * exactly one binding for every C++ global. No wrapper module or state clone.
 * Fail closed on changed declarations except the source compiler's two shared
 * aggregate runtime helpers (which carry the newer verified array semantics).
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
let ts;
try{ts=require('typescript')}catch(e){throw new Error('TypeScript parser required; install project devDependencies')}
const root=path.resolve(__dirname,'..');
const base=path.join(root,'factory-output/source-first/force-recovered/source');
const target=path.join(root,'factory-output/source-first/browser-target/source');
const reportFile=path.join(root,'reports/browser-target/integrated-mutable-module-merge.json');
const allowedHelperUpgrades=new Set(['cCopyAggregate','cZeroAggregate','cPointerElementRef']);
const canonicalPointerSource=fs.readFileSync(path.join(root,'tools/source_pointer_runtime.mjs'),'utf8');
function digest(s){return crypto.createHash('sha256').update(s).digest('hex')}
function parse(s,where){const tree=ts.createSourceFile(where,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  if(tree.parseDiagnostics.length) throw new Error(where+': malformed original JS: '+tree.parseDiagnostics[0].messageText);
  return tree;
}
function names(node){
  if(ts.isVariableStatement(node)){
    return node.declarationList.declarations.map(d=>{
      if(!ts.isIdentifier(d.name))throw new Error('Noncanonical destructured top-level declaration');return d.name.text;
    });
  }
  if((ts.isFunctionDeclaration(node)||ts.isClassDeclaration(node))&&node.name)return [node.name.text];
  if(ts.isImportDeclaration(node)){
    if(!node.importClause)return [];
    const c=node.importClause;let ns=[];
    if(c.name)ns.push(c.name.text);
    if(c.namedBindings){if(ts.isNamespaceImport(c.namedBindings))ns.push(c.namedBindings.name.text);
      else ns.push(...c.namedBindings.elements.map(e=>e.name.text));}
    return ns;
  }
  if(ts.isExportDeclaration(node))return [];
  throw new Error('Unsupported top-level declaration '+ts.SyntaxKind[node.kind]);
}
function model(content,label){
 const ast=parse(content,label);const byName=new Map(),top=[];
 for(const item of ast.statements){
   const ns=names(item);const source=item.getText(ast);const importDecl=ts.isImportDeclaration(item);
   if(!ns.length){
     if(importDecl)top.push({kind:'sideEffectImport',code:source});
     else if(ts.isExportDeclaration(item))top.push({kind:'reexport',code:source});
     else throw new Error('Unclassified empty-name statement');continue;
   }
   if(ns.length!==1)throw new Error('Cannot deduplicate multi-binding declarations: '+ns.join(', '));
   const n=ns[0];if(byName.has(n))throw new Error('Original module itself duplicates '+n);
   const meta={name:n,code:source,kind:importDecl?'import':'declaration'};byName.set(n,meta);top.push(meta);
 }
 return {byName,top};
}
function merge(rel,write){
 const a=path.join(base,rel),b=path.join(target,rel);
 const oldText=fs.readFileSync(a,'utf8'),newText=fs.readFileSync(b,'utf8');
 const old=model(oldText,a),newer=model(newText,b);
 let additions=[],upgrades=[],shared=0;
 for(const item of newer.top){
  if(item.kind==='reexport'||item.kind==='sideEffectImport'){
    if(!old.top.some(o=>o.kind===item.kind&&o.code===item.code))additions.push(item);
    continue;
  }
  const same=old.byName.get(item.name);
  if(!same){additions.push(item);continue;}
  ++shared;
  if(same.kind!==item.kind)throw new Error(rel+': incompatible binding '+item.name);
  if(same.code!==item.code){
    if(!allowedHelperUpgrades.has(item.name)||same.kind!=='declaration')
      throw new Error(rel+': overlapping declaration differs: '+item.name);
    // These exact runtime helper implementations are shared by the source
    // compiler. Keep the newer helper so its byte-array copy semantics work.
    if(item.name==='cPointerElementRef'){
      const expected=model(canonicalPointerSource,'source_pointer_runtime.mjs').byName.get(item.name)?.code;
      if(!expected||item.code.trim()!==expected.trim())throw new Error('Unverified pointer helper upgrade');
    }
    upgrades.push(item);
  }
 }
 const byUpgrade=new Map(upgrades.map(u=>[u.name,u.code]));
 // Start from the broad translation: all original static-storage declarations
 // keep their original order, not a second imported copy.
 const rewritten=old.top.map(item=>byUpgrade.get(item.name)||item.code);
 const imports=additions.filter(a=>a.kind==='import'||a.kind==='sideEffectImport');
 const newDefs=additions.filter(a=>a.kind!=='import'&&a.kind!=='sideEffectImport');
 const output=[
  '// SOURCEFACTORY_INTEGRATED_TU: source-identical state, no historical implementation shard.',
  ...imports.map(x=>x.code),
  ...rewritten,
  '// Source-generated additions from the same original C++ translation unit:',
  ...newDefs.map(x=>x.code),
  ''
 ].join('\n\n');
 const final=model(output,'integrated/'+rel);
 // Verify every original and every new binding remains present, once only.
 for(const key of new Set([...old.byName.keys(),...newer.byName.keys()])){
   if(!final.byName.has(key))throw new Error(rel+': missing merged declaration '+key);
 }
 if(write)fs.writeFileSync(b,output);
 return {module:rel,oldBindings:old.byName.size,newBindings:newer.byName.size,
  integratedBindings:final.byName.size,addedBindings:additions.filter(x=>x.name).length,
  upgradedHelpers:upgrades.map(x=>x.name),sharedBindings:shared,
  mutableDuplicateCount:0,sha256:digest(output),status:write?'written':'validated'};
}
function main(){
 const write=process.argv.includes('--write');const results=[],errors=[];
 // Exact three previously blocked TUs. Others remain governed by the
 // conservative live-reexport mechanism; never merge unrelated C++ TUs.
 for(const rel of ['build/src/sdlayer.cpp.mjs','duke3d/src/cheats.cpp.mjs','duke3d/src/common.cpp.mjs']){
  try{results.push(merge(rel,write))}catch(e){errors.push({module:rel,error:e.message})}
 }
 const report={format:'eduke32-integrated-source-tus/1',results,errors,originalGameplayVerified:false};
 fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
}
main();
