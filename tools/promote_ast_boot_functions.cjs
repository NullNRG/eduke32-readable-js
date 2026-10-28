#!/usr/bin/env node
'use strict';
/** Preserve the original C++ translation unit while promoting AST-verified declarations.
 * No guessed providers, no duplicate C++ globals, no conflicting declaration rewrites.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),ts=require('typescript');
const ROOT=path.resolve(__dirname,'..'),BASE=path.join(ROOT,'factory-output/source-first');
const plan=[
  {name:'S_ClearSoundLocks',owner:'duke3d/src/sounds.cpp'},
  {name:'kclose',owner:'build/src/vfs.cpp'},
];
function parse(txt,label){
  const ast=ts.createSourceFile(label,txt,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  if(ast.parseDiagnostics.length)throw Error(label+': '+ast.parseDiagnostics[0].messageText);
  const rows=[],keys=new Map();
  for(const stmt of ast.statements){
    let key,kind='def';
    if(ts.isImportDeclaration(stmt)){
      kind='import';const c=stmt.importClause;
      if(!c){key='side-effect:'+stmt.moduleSpecifier.text;}else{
        const names=[...(c.name?[c.name.text]:[]),...(c.namedBindings?(ts.isNamespaceImport(c.namedBindings)?[c.namedBindings.name.text]:c.namedBindings.elements.map(v=>v.name.text)):[])];
        if(names.length!==1)throw Error('Ambiguous multiple import bindings: '+label);
        key=names[0];
      }
    } else if(ts.isVariableStatement(stmt)){
      if(stmt.declarationList.declarations.length!==1||!ts.isIdentifier(stmt.declarationList.declarations[0].name))throw Error('Noncanonical variables: '+label);
      key=stmt.declarationList.declarations[0].name.text;
    } else if(ts.isFunctionDeclaration(stmt)||ts.isClassDeclaration(stmt))key=stmt.name?.text;
    else if(ts.isExportDeclaration(stmt)){kind='export';key='reexport:'+stmt.getText(ast);}
    else throw Error('Unsupported top-level statement: '+ts.SyntaxKind[stmt.kind]);
    if(!key||keys.has(key))throw Error('Duplicate/anonymous binding '+key+' in '+label);
    const row={key,kind,code:stmt.getText(ast)};rows.push(row);keys.set(key,row);
  }
  return {rows,keys};
}
const write=process.argv.includes('--write'),results=[];
for(const {name,owner} of plan){
 const probe=path.join(BASE,'boot-closure-fresh',name,'source',owner+'.mjs');
 const target=path.join(BASE,'browser-target/source',owner+'.mjs');
 const sourceManifest=probe.replace(/\.mjs$/,'.manifest.json'),destManifest=target.replace(/\.mjs$/,'.manifest.json');
 const document=JSON.parse(fs.readFileSync(sourceManifest,'utf8'));
 if(document.source!=='source/'+owner)throw Error(name+': wrong original C++ source proof');
 const verified=document.definitions.find(d=>d.name===name&&d.status==='source-first');
 if(!verified)throw Error(name+': AST did not emit verified source function');
 const oldTxt=fs.readFileSync(target,'utf8'),newTxt=fs.readFileSync(probe,'utf8');
 const old=parse(oldTxt,target),next=parse(newTxt,probe);
 if(!next.keys.has(name)||!next.keys.get(name).code.startsWith('export function '+name+'('))throw Error('Compiled function not exported: '+name);
 const additions=[],skipped=[],conflicts=[],upgrades=new Map();
 const canonicalPointer=parse(fs.readFileSync(path.join(ROOT,'tools/source_pointer_runtime.mjs'),'utf8'),'canonical pointer helper').keys.get('cPointerElementRef').code;
 for(const row of next.rows){
   const existing=old.keys.get(row.key);
   if(!existing){additions.push(row);continue;}
   if(existing.kind!==row.kind)throw Error(owner+': source import/declaration collision: '+row.key);
   if(existing.code===row.code)continue;
   if(row.key==='cPointerElementRef' && row.kind==='def' && row.code===canonicalPointer &&
      existing.code.startsWith('const cPointerElementRef = (source,index) => {')) {
     upgrades.set(row.key,row);continue;
   }
   // This helper changed with AST-filtered record discovery. The newly emitted
   // S_ClearSoundLocks never calls it. Keep the old original TU implementation.
   if(row.key==='cRecordObject'&&name==='S_ClearSoundLocks'&&!next.keys.get(name).code.includes('cRecordObject(')){
     skipped.push(row.key);continue;
   }
   conflicts.push(row.key);
 }
 if(conflicts.length)throw Error(owner+': conflicting source declarations: '+conflicts.join(', '));
 const newImports=additions.filter(r=>r.kind==='import');
 const newDefs=additions.filter(r=>r.kind!=='import');
 // Preserve all prior original declarations, initialization order, and
 // writable globals, plus imports ordered before any evaluated source state.
 const output=[...old.rows.filter(r=>r.kind==='import').map(r=>r.code),...newImports.map(r=>r.code),
    ...old.rows.filter(r=>r.kind!=='import').map(r=>(upgrades.get(r.key)||r).code),...newDefs.map(r=>r.code),''].join('\n\n');
 const final=parse(output,'promoted/'+owner);
 for(const k of new Set([...old.keys.keys(),...next.keys.keys()])){
   if(k==='cRecordObject'&&skipped.includes(k))continue;
   if(!final.keys.has(k))throw Error('Promotion dropped a binding: '+k);
 }
 // Require every actual original top-level declaration to occur only once.
 if(write){fs.writeFileSync(target,output);const dest=JSON.parse(fs.readFileSync(destManifest,'utf8'));
  for(const def of document.definitions){
    if(def.status!=='source-first'||!final.keys.has(def.name)||!['def'].includes(final.keys.get(def.name).kind))continue;
    const previous=dest.definitions.find(d=>d.name===def.name);
    if(previous&&previous.status==='source-first')continue;
    if(previous)Object.assign(previous,def);else dest.definitions.push(def);
  }
  dest.astBootPromotion={source:document.source,entry:name,sourceManifest:path.relative(ROOT,sourceManifest)};
  fs.writeFileSync(destManifest,JSON.stringify(dest,null,2)+'\n');
 }
 results.push({symbol:name,owner,status:write?'promoted':'validated',added:additions.map(r=>r.key),keptLegacyHelpers:skipped,upgradedPointerHelpers:[...upgrades.keys()],
     previousExports:[...old.keys.values()].filter(x=>x.code.startsWith('export ')).length,
     mergedExports:[...final.keys.values()].filter(x=>x.code.startsWith('export ')).length,
     sha256:crypto.createHash('sha256').update(output).digest('hex')});
}
const report={format:'eduke32-ast-boot-promotion/1',results,originalGameplayVerified:false};
const reportFile=path.join(ROOT,'reports/browser-target/ast-boot-promotion.json');
fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
