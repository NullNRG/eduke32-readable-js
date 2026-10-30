#!/usr/bin/env node
// Deduplicate identical transpiled support declarations, not source functions.
// Dependency fingerprints prevent sharing differently configured helper bodies.
import ts from 'typescript';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
const MARKER='// Source-first C/C++ -> JavaScript (original identifiers/structured statements).';
const DIR='_source_shared_ast';
const NAMES=new Set((
  'ABIHeap cSourceAddresses cPointer cStaticPointer cPointerElementRef '+
  'cTypedPointer cPointerOffset cDeref cScalarStorage cPointerCompare '+
  'cPointerDiff cAlignedStorage cRecordObject cStaticReference '+
  'cObjectFieldRef cRef cArrayRef cAggregateRecordTag cMarkAggregate '+
  'cByteRecordStorageTag cByteRecordStorage cByteRecordNative '+
  'cByteRecordPointers cPointerArray cByteArrayMember cInitByteRecord '+
  'cByteRecordArrayStorage cByteRecordArray cByteRecordNDArray '+
  'cRecordPointerViews cRecordPointer cCopyAggregate cZeroAggregate '+
  'cAssignAggregate cByteMemory cxxHeap cCHeap cLifetime cStackAlloc '+
  'cUMullOverflow cxxPointerSpan cVariadic cProcess cCopyTrivialClass '+
  'i32 u32 i64 u64 i128 u128 powf sinf cosf sqrtf fmodf clz64 ctz64 popcnt'
).split(/\s+/));
const hash=s=>createHash('sha256').update(s).digest('hex');
function files(root){
  const result=[];
  function descend(dir){
    for(const item of fs.readdirSync(dir,{withFileTypes:true})){
      if(item.name===DIR||item.name==='_source_shared')continue;
      const filename=path.join(dir,item.name);
      if(item.isDirectory())descend(filename);
      else if(item.isFile()&&filename.endsWith('.mjs'))result.push(filename);
    }
  }
  descend(root);
  return result.sort();
}
function nameOf(n){
  if(ts.isVariableStatement(n)&&n.declarationList.declarations.length===1){
    const d=n.declarationList.declarations[0];
    return ts.isIdentifier(d.name)?d.name.text:null;
  }
  if((ts.isFunctionDeclaration(n)||ts.isClassDeclaration(n))&&n.name)return n.name.text;
  return null;
}
function isExport(n){
  return !!ts.getModifiers(n)?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword||m.kind===ts.SyntaxKind.DefaultKeyword);
}
function references(stmt){
  const out=new Set();
  function visit(n){
    if(ts.isIdentifier(n)){
      const p=n.parent;
      if(!((ts.isPropertyAccessExpression(p)||ts.isPropertyAssignment(p)||
        ts.isMethodDeclaration(p)||ts.isPropertyDeclaration(p)||
        ts.isVariableDeclaration(p)||ts.isFunctionDeclaration(p)||
        ts.isClassDeclaration(p)||ts.isParameter(p))&&p.name===n))out.add(n.text);
    }
    ts.forEachChild(n,visit);
  }
  visit(stmt);return out;
}
function parse(file){
  const source=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
  if(!source.startsWith(MARKER))return null;
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.ESNext,true,ts.ScriptKind.JS);
  if(ast.parseDiagnostics.length)throw Error('Invalid source-first ESM: '+file);
  const original=new Set();
  for(const node of ast.statements){const name=nameOf(node);if(name)original.add(name);}
  const candidates=[];
  let sourceStarted=false;
  for(const node of ast.statements){
    if(isExport(node))sourceStarted=true;
    if(sourceStarted)continue;
    const name=nameOf(node);
    if(!name||!NAMES.has(name))continue;
    const start=node.getStart(ast),end=node.getEnd();
    const text=source.slice(start,end);
    if(text.length<55)continue;
    candidates.push({file,name,text,sourceHash:hash(text),start,end,ids:references(node)});
  }
  const mapping=new Map(candidates.map(c=>[c.name,c]));
  const sourceOwned=new Set([...original].filter(x=>!mapping.has(x)));
  const imports=new Set();
  for(const n of ast.statements){
    if(!ts.isImportDeclaration(n)||!n.importClause)continue;
    if(n.importClause.name)imports.add(n.importClause.name.text);
    const b=n.importClause.namedBindings;
    if(b&&ts.isNamedImports(b))for(const e of b.elements)imports.add(e.name.text);
    else if(b&&ts.isNamespaceImport(b))imports.add(b.name.text);
  }
  for(const c of candidates){
    c.deps=[...c.ids].filter(x=>x!==c.name&&mapping.has(x)).sort();
    c.blocked=[...c.ids].filter(x=>x!==c.name&&
      (sourceOwned.has(x)||imports.has(x)||(NAMES.has(x)&&!mapping.has(x)))).sort();
  }
  return {file,source,candidates,mapping};
}
function listGroups(modules){
  const groups=new Map();
  for(const module of modules){
    const cache=new Map();
    function signature(name,stack=new Set()){
      if(cache.has(name))return cache.get(name);
      const item=module.mapping.get(name);
      if(!item||item.blocked.length||stack.has(name))return null;
      const deps=[],next=new Set([...stack,name]);
      for(const dep of item.deps){
        const fingerprint=signature(dep,next);
        if(!fingerprint)return null;
        deps.push([dep,fingerprint.signature]);
      }
      const value={...item,depsFingerprint:deps,
        signature:hash(JSON.stringify([name,item.sourceHash,deps]))};
      cache.set(name,value);
      return value;
    }
    for(const item of module.candidates){
      const entry=signature(item.name);
      if(!entry)continue;
      const key=entry.name+':'+entry.signature;
      if(!groups.has(key))groups.set(key,{...entry,entries:[],files:new Set()});
      const group=groups.get(key);
      group.entries.push(entry);
      group.files.add(module.file);
    }
  }
  return groups;
}
function slug(g){return g.name+'-'+g.signature.slice(0,24)+'.mjs';}
function optimize(root,apply=false){
  root=path.resolve(root);
  const all=files(root);
  const modules=all.map(parse).filter(Boolean);
  const groups=listGroups(modules);
  const eligible=new Map([...groups].filter(([_,v])=>v.files.size>=2&&v.text.length>=55));
  // A shared declaration must have the exact source identity of every helper
  // it references. Never capture a declaration from a different translation unit.
  for(;;){
    const invalid=[...eligible].filter(([_,g])=>
      g.depsFingerprint.some(([dep,sig])=>!eligible.has(dep+':'+sig)));
    if(!invalid.length)break;
    for(const [key] of invalid)eligible.delete(key);
  }
  const byFile=new Map();
  for(const g of eligible.values()){
    for(const entry of g.entries){
      if(!byFile.has(entry.file))byFile.set(entry.file,[]);
      byFile.get(entry.file).push({group:g,entry});
    }
  }
  const changes=[],used=new Map();
  for(const module of modules){
    const chunks=byFile.get(module.file)||[];
    if(!chunks.length)continue;
    chunks.sort((a,b)=>a.entry.start-b.entry.start);
    let updated=module.source;
    const imports=[];
    for(const {group,entry} of chunks){
      const filename=path.join(root,DIR,slug(group));
      let spec=path.relative(path.dirname(module.file),filename).split(path.sep).join('/');
      if(!spec.startsWith('.'))spec='./'+spec;
      imports.push('import { '+group.name+' } from '+JSON.stringify(spec)+';');
      used.set(group.name+':'+group.signature,group);
    }
    for(const {entry} of [...chunks].reverse())
      updated=updated.slice(0,entry.start)+updated.slice(entry.end);
    const offset=updated.indexOf('\n')+1;
    updated=updated.slice(0,offset)+imports.join('\n')+'\n'+updated.slice(offset);
    changes.push({file:module.file,source:updated,before:Buffer.byteLength(module.source),
      after:Buffer.byteLength(updated),names:chunks.map(x=>x.group.name)});
  }
  const shared=[];
  for(const group of [...used.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.signature.localeCompare(b.signature))){
    const deps=group.depsFingerprint.map(([dep,signature])=>{
      const other=eligible.get(dep+':'+signature);
      if(!other)throw Error('Missing helper dependency: '+dep);
      return 'import { '+dep+' } from '+JSON.stringify('./'+slug(other))+';';
    });
    const source='// Source-first shared helper: exact original declaration with closed dependencies.\n'
      +'// Original declaration SHA-256: '+group.sourceHash+'\n'
      +(deps.length?deps.join('\n')+'\n':'')+group.text+'\n'
      +'export { '+group.name+' };\n';
    shared.push({file:path.join(root,DIR,slug(group)),source});
  }
  if(apply){
    fs.mkdirSync(path.join(root,DIR),{recursive:true});
    for(const v of [...shared,...changes]){
      const tmp=v.file+'.partial-'+process.pid;
      fs.writeFileSync(tmp,v.source,'utf8');
      fs.renameSync(tmp,v.file);
    }
  }
  const saved=changes.reduce((n,x)=>n+x.before-x.after,0);
  const sharedSize=shared.reduce((n,x)=>n+Buffer.byteLength(x.source),0);
  return {
    format:'source-first-generated-ast-dedup/1',mode:apply?'applied':'dry-run',
    files_scanned:all.length,generated_modules:modules.length,
    candidate_helpers:modules.reduce((n,x)=>n+x.candidates.length,0),
    shared_helper_variants:shared.length,modules_rewritten:changes.length,
    helper_instances_removed:changes.reduce((n,x)=>n+x.names.length,0),
    gross_bytes_removed:saved,shared_bytes_added:sharedSize,net_bytes_saved:saved-sharedSize,
    top_groups:[...used.values()].sort((a,b)=>b.files.size*b.text.length-a.files.size*a.text.length)
      .slice(0,20).map(g=>({name:g.name,copies:g.files.size,bytes_each:Buffer.byteLength(g.text),signature:g.signature})),
    examples:changes.slice(0,15).map(c=>({file:path.relative(root,c.file),helpers:c.names}))
  };
}
function main(){
  const args=process.argv.slice(2),i=args.indexOf('--root');
  if(i<0||!args[i+1])throw Error('Usage: node tools/dedup_emitted_ast.mjs --root OUTPUT [--apply] [--report FILE]');
  const data=optimize(args[i+1],args.includes('--apply'));
  const j=args.indexOf('--report');
  if(j>=0){if(!args[j+1])throw Error('Missing report path');
    fs.mkdirSync(path.dirname(path.resolve(args[j+1])),{recursive:true});
    fs.writeFileSync(args[j+1],JSON.stringify(data,null,2)+'\n');}
  console.log(JSON.stringify(data,null,2));
}
main();
