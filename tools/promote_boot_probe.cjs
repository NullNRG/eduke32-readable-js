#!/usr/bin/env node
'use strict';
// Transactional promotion of an original Clang-emitted function into its ONE
// canonical translation unit. Refuses C++ state/ABI conflicts, never supplies
// placeholder exports, and never infers a provider from an uncompiled header.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),ts=require('typescript');
const ROOT=path.resolve(__dirname,'..');
const args=process.argv.slice(2);
function arg(k){let i=args.indexOf(k);return i<0?null:args[i+1]}
function fail(message){throw new Error(message)}
const symbol=arg('--symbol'),owner=arg('--owner'),probeArg=arg('--probe');
if(!/^[a-zA-Z_$][\w$]*$/.test(symbol||''))fail('Invalid symbol');
if(!/^source\/[a-z\d_./-]+\.c(?:pp)?$/.test(owner||'')||owner.includes('..'))fail('Invalid source owner');
if(!probeArg)fail('--probe required');
const probe=path.resolve(probeArg),target=path.join(ROOT,'factory-output/source-first/browser-target',owner+'.mjs');
const source=path.join(probe,owner+'.mjs');
const sourceManifest=source.replace(/\.mjs$/,'.manifest.json'),targetManifest=target.replace(/\.mjs$/,'.manifest.json');
for(const p of [source,sourceManifest,target,targetManifest])if(!fs.existsSync(p))fail('Missing original evidence: '+p);
const sm=JSON.parse(fs.readFileSync(sourceManifest,'utf8'));
if(sm.source!==owner)fail('Original translation unit mismatch');
const verified=sm.definitions.filter(d=>d.name===symbol && d.status==='source-first');
if(verified.length!==1)fail('Symbol not uniquely Clang-emitted: '+symbol);
function parse(txt,label){
 const tree=ts.createSourceFile(label,txt,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 if(tree.parseDiagnostics.length)fail('Syntax error in '+label+': '+tree.parseDiagnostics[0].messageText);
 const rows=[],map=new Map();
 for(const s of tree.statements){
   let name,type='definition';
   if(ts.isImportDeclaration(s)){
     type='import';let c=s.importClause;
     if(!c)name='sideeffect:'+s.moduleSpecifier.text;
     else {const names=[...(c.name?[c.name.text]:[]),...(c.namedBindings?(ts.isNamespaceImport(c.namedBindings)?[c.namedBindings.name.text]:c.namedBindings.elements.map(v=>v.name.text)):[])];
       if(names.length!==1)fail('Ambiguous import declaration in '+label);name=names[0];}
   } else if(ts.isVariableStatement(s)){
     if(s.declarationList.declarations.length!==1||!ts.isIdentifier(s.declarationList.declarations[0].name))fail('Noncanonical storage in '+label);
     name=s.declarationList.declarations[0].name.text;
   } else if(ts.isFunctionDeclaration(s)||ts.isClassDeclaration(s))name=s.name?.text;
   else if(ts.isExportDeclaration(s)){type='reexport';name='reexport:'+s.getText(tree)}
   else fail('Unsafe unrecognized top-level statement in '+label+': '+ts.SyntaxKind[s.kind]);
   if(!name||map.has(name))fail('Duplicate/anonymous declaration in '+label+': '+name);
   const row={name,type,code:s.getText(tree)};rows.push(row);map.set(name,row);
 }
 return {rows,map};
}
const previous=fs.readFileSync(target,'utf8'),next=fs.readFileSync(source,'utf8');
const old=parse(previous,'active'),add=parse(next,'probe');
const emit=add.map.get(symbol);
if(!emit||emit.type!=='definition'||!/^(?:export\s+)?(?:async\s+)?function\s+/.test(emit.code))fail('Original symbol has no callable JS body');
if(verified[0].linkage!=='internal'&&!emit.code.startsWith('export '))fail('External C++ function missing JS export');
const imports=[],definitions=[],conflicts=[];
const canonicalPointer=fs.readFileSync(path.join(ROOT,'tools/source_pointer_runtime.mjs'),'utf8').trim();
let pointerUpgraded=false;
const changes=new Map();
for(const entry of add.rows){
 const prior=old.map.get(entry.name);
 if(!prior){(entry.type==='import'?imports:definitions).push(entry);continue}
 if(prior.type!==entry.type){conflicts.push(entry.name+' (kind)');continue}
 if(prior.code===entry.code)continue;
 if(entry.name==='cPointerElementRef' && entry.code===canonicalPointer && prior.code.startsWith('const cPointerElementRef = (source,index) => {')) {
   pointerUpgraded=true;changes.set(entry.name,entry);continue;
 }
 // Only skip an obsolete helper if the emitted function *and all additions*
 // do not use it, so no new source code can accidentally reference the old ABI.
 if(entry.name==='cRecordObject' && ![emit,...definitions].some(x=>x.code.includes('cRecordObject(')))continue;
 conflicts.push(entry.name);
}
if(conflicts.length)fail('Overlapping original state/ABI disagrees: '+conflicts.join(', '));
// A new ESM import is valid only when its concrete provider module is in
// the active browser target and actually exports the named source binding.
for(const row of imports){
  const match=row.code.match(/from\s*['"]([^'"]+)['"]/);
  if(!match||!match[1].startsWith('.'))fail('Unsupported or unverified import: '+row.code);
  const provider=path.resolve(path.dirname(target),match[1]);
  const boundary=path.join(ROOT,'factory-output/source-first/browser-target');
  if(!provider.startsWith(boundary+path.sep)||!fs.existsSync(provider))fail('Missing original/host provider: '+match[1]);
  const m=row.code.match(/import\s*\{\s*([\w$]+)(?:\s+as\s+[\w$]+)?\s*\}/);
  if(!m)fail('Unsupported import binding for '+row.name);
  const exports=parse(fs.readFileSync(provider,'utf8'),provider).rows;
  if(!exports.some(r=>r.code.startsWith('export ')&&r.name===m[1])){
     // The validated original module facade can also re-export live bindings.
     const code=fs.readFileSync(provider,'utf8');
     if(!new RegExp('export\\s*\\{[^}]*\\b'+m[1]+'\\b[^}]*\\}\\s*from').test(code))
       fail('Unimplemented imported binding '+m[1]+' from '+match[1]);
  }
}
const render=[...old.rows.filter(r=>r.type==='import').map(r=>r.code),...imports.map(r=>r.code),
 ...old.rows.filter(r=>r.type!=='import').map(r=>(changes.get(r.name)||r).code),...definitions.map(r=>r.code),''].join('\n\n');
const final=parse(render,'merged');
for(const key of old.map.keys())if(!final.map.has(key))fail('Existing export/global lost: '+key);
for(const d of definitions)if(!final.map.has(d.name))fail('Recovered definition lost: '+d.name);
const before=JSON.parse(fs.readFileSync(targetManifest,'utf8'));const manifest=structuredClone(before);
for(const def of sm.definitions){
 if(def.status!=='source-first'||!final.map.has(def.name))continue;
 const prior=manifest.definitions.find(d=>d.name===def.name);
 if(prior&&prior.status==='source-first')continue;
 if(prior)Object.assign(prior,def);else manifest.definitions.push(def);
}
manifest.verifiedBootProbes=[...(manifest.verifiedBootProbes||[]).filter(p=>p.symbol!==symbol),
 {symbol,originalSource:owner,sourceManifest:path.relative(ROOT,sourceManifest)}];
// Validate the candidate with node --check before modifying the active target.
const os=require('node:os');const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'eduke-merge-'));
try {
 const candidate=path.join(scratch,'merged.mjs');fs.writeFileSync(candidate,render);
 const result=cp.spawnSync('node',['--check',candidate],{encoding:'utf8',timeout:15000});
 if(result.status!==0)fail('Node syntax check: '+result.stderr);
} finally {fs.rmSync(scratch,{recursive:true,force:true})}
if(args.includes('--write')){
 const oldManifest=fs.readFileSync(targetManifest,'utf8');
 try{fs.writeFileSync(target,render);fs.writeFileSync(targetManifest,JSON.stringify(manifest,null,2)+'\n')}
 catch(e){fs.writeFileSync(target,previous);fs.writeFileSync(targetManifest,oldManifest);throw e}
}
console.log(JSON.stringify({symbol,owner,status:args.includes('--write')?'promoted':'verified',additionalBindings:imports.length+definitions.length,
 preservedBindings:old.rows.length,pointerUpgraded,previousExports:old.rows.filter(r=>r.code.startsWith('export ')).length,
 finalExports:final.rows.filter(r=>r.code.startsWith('export ')).length}));
