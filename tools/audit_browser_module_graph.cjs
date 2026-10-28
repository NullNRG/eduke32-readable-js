#!/usr/bin/env node
'use strict';
// Verify ACTUAL ESM imports/exports on disk, not manifest-declared names.
// Includes original Clang-derived legacy shards and verified live reexports.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(ROOT,'factory-output/source-first/browser-target');
const report=path.join(ROOT,'reports/browser-target/active-esm-graph.json');
function files(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(path.join(root,d.name)):(d.name.endsWith('.mjs')?[path.join(root,d.name)]:[]))}
function source(p){const s=ts.createSourceFile(p,fs.readFileSync(p,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);if(s.parseDiagnostics.length)throw new Error('Invalid module syntax '+p);return s}
const cache=new Map(),transitive=new Map(),errors=[];
function info(p){
 if(cache.has(p))return cache.get(p);
 const ast=source(p),exports=new Set(),imports=[],reexports=[];
 for(const s of ast.statements){
   if(ts.isImportDeclaration(s)){
     const names=[],c=s.importClause;
     if(c?.name)names.push({exported:'default',local:c.name.text});
     if(c?.namedBindings){if(ts.isNamespaceImport(c.namedBindings))names.push({exported:'*',local:c.namedBindings.name.text});else for(const e of c.namedBindings.elements)names.push({exported:(e.propertyName||e.name).text,local:e.name.text})}
     imports.push({spec:s.moduleSpecifier.text,names});
   } else if(ts.isExportDeclaration(s)){
     const n=s.exportClause;
     if(n&&ts.isNamedExports(n)){const names=n.elements.map(e=>({exported:(e.propertyName||e.name).text,local:e.name.text}));
       if(s.moduleSpecifier)reexports.push({spec:s.moduleSpecifier.text,names});
       else for(const item of names)exports.add(item.local);
     } else if(s.moduleSpecifier)reexports.push({spec:s.moduleSpecifier.text,names:[{exported:'*',local:'*'}]});
   } else if(s.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)){
     if(ts.isFunctionDeclaration(s)||ts.isClassDeclaration(s)) {if(s.name)exports.add(s.name.text)}
     else if(ts.isVariableStatement(s))for(const d of s.declarationList.declarations)if(ts.isIdentifier(d.name))exports.add(d.name.text);
     if(s.modifiers?.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword))exports.add('default');
   }
 }
 const item={imports,reexports,exports};cache.set(p,item);return item;
}
function resolve(from,spec){
 if(!spec.startsWith('.'))return null;
 const target=path.resolve(path.dirname(from),spec);
 if(!target.startsWith(DIR+path.sep)||!fs.existsSync(target))return null;
 return target;
}
function has(p,name,stack=new Set()){
 if(stack.has(p))return false;
 const token=p+'::'+name;
 if(transitive.has(token))return transitive.get(token);
 let result=false;
 const d=info(p);
 if(d.exports.has(name))result=true;
 else{const sub=new Set(stack);sub.add(p);
  for(const r of d.reexports){const dest=resolve(p,r.spec);if(!dest)continue;
   const mapped=r.names.find(x=>x.local===name||x.local==='*');
   if(mapped && has(dest,mapped.exported==='*'?name:mapped.exported,sub)){result=true;break}
  }
 }
 transitive.set(token,result);return result;
}
let importedEdges=0,linkedEdges=0;
// The generated startup/ and probes/ directories contain test harnesses,
// some of which record absolute build-machine URLs. They are NOT canonical
// runtime modules. Audit canonical source and ABI providers only.
const runtime=files(DIR).filter(p=>{const r=path.relative(DIR,p).replaceAll(path.sep,'/');
  return r.startsWith('source/')||r.startsWith('browser-abi/');});
for(const file of runtime){
 const data=info(file);
 for(const i of [...data.imports,...data.reexports]){
   const dest=resolve(file,i.spec);const rel=path.relative(DIR,file),base={module:rel,provider:i.spec};
   if(!dest){importedEdges+=i.names.length||1;errors.push({...base,type:'missing-provider-module'});continue}
   const targets=i.names.length?i.names:[{exported:'*',local:'*'}];
   for(const t of targets){importedEdges++;
     if(t.exported==='*'||has(dest,t.exported)){linkedEdges++;continue}
     errors.push({...base,type:'missing-export',export:t.exported});
   }
 }
}
const outcome={format:'eduke32-active-original-js-link-audit/1',checkedModules:runtime.length,importedEdges,linkedEdges,
 unresolvedEdges:errors.length,errors:errors.slice(0,300),originalGameBootVerified:false};
fs.mkdirSync(path.dirname(report),{recursive:true});fs.writeFileSync(report,JSON.stringify(outcome,null,2)+'\n');
console.log(JSON.stringify({checkedModules:outcome.checkedModules,importedEdges,linkedEdges,unresolvedEdges:errors.length,sample:errors.slice(0,9)},null,2));
if(process.argv.includes('--strict') && errors.length)process.exitCode=2;
