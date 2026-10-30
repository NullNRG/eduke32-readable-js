#!/usr/bin/env node
// Verify all helper imports created by the two source-first deduplication passes.
import ts from 'typescript';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
const SKIP=new Set(['node_modules','.git']);
function files(root){
  const out=[];
  function scan(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory()&&!SKIP.has(entry.name))scan(full);
      else if(entry.isFile()&&entry.name.endsWith('.mjs'))out.push(full);
    }
  }
  scan(root);return out;
}
function declaration(node){
  if(ts.isVariableStatement(node)){
    return node.declarationList.declarations.filter(x=>ts.isIdentifier(x.name)).map(x=>x.name.text);
  }
  if((ts.isFunctionDeclaration(node)||ts.isClassDeclaration(node))&&node.name)return [node.name.text];
  return [];
}
function validate(root,checkNode=false){
  const list=files(root),asts=new Map(),errors=[];
  for(const file of list) {
    const src=fs.readFileSync(file,'utf8');
    const ast=ts.createSourceFile(file,src,ts.ScriptTarget.ESNext,true,ts.ScriptKind.JS);
    if(ast.parseDiagnostics.length)errors.push({file,reason:'parser-diagnostics',count:ast.parseDiagnostics.length});
    asts.set(file,{ast,src});
  }
  let inspected=0,sharedImports=0;
  for(const [file,{ast}] of asts) {
    const own=new Set();
    for(const stmt of ast.statements)for(const name of declaration(stmt))own.add(name);
    for(const stmt of ast.statements){
      if(!ts.isImportDeclaration(stmt)||!ts.isStringLiteral(stmt.moduleSpecifier))continue;
      const spec=stmt.moduleSpecifier.text;
      if(!spec.includes('_source_shared'))continue;
      sharedImports++;
      const expected=path.resolve(path.dirname(file),spec);
      const rel=path.relative(root,expected);
      if(rel.startsWith('..')||path.isAbsolute(rel)||!asts.has(expected)){
        errors.push({file,spec,reason:'shared-runtime-module-missing-or-outside-build'});
        continue;
      }
      if(!stmt.importClause || !ts.isNamedImports(stmt.importClause.namedBindings)){
        errors.push({file,spec,reason:'unexpected-shared-import-shape'});
        continue;
      }
      const provider=asts.get(expected).ast;
      const exported=new Set();
      const provided=new Set();
      for(const p of provider.statements) {
        for(const name of declaration(p))provided.add(name);
        if(ts.isExportDeclaration(p)&&p.exportClause&&ts.isNamedExports(p.exportClause))
          for(const e of p.exportClause.elements)exported.add(e.name.text);
      }
      for(const binding of stmt.importClause.namedBindings.elements) {
        const remote=binding.propertyName?.text||binding.name.text;
        if(!exported.has(remote)||!provided.has(remote)){
          errors.push({file,spec,name:remote,reason:'helper-import-not-proven-exported'});
        }
        if(own.has(binding.name.text)){
          errors.push({file,spec,name:binding.name.text,reason:'helper-import-shadows-local-declaration'});
        }
        inspected++;
      }
    }
    if(checkNode && path.basename(file).endsWith('.mjs')){
      const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8',timeout:15000});
      if(result.status!==0)errors.push({file,reason:'node-syntax',details:result.stderr?.slice(-600)});
    }
  }
  return {files:list.length,sharedImports,verifiedBindings:inspected,errors,errorCount:errors.length};
}
const args=process.argv.slice(2),idx=args.indexOf('--root');
if(idx<0||!args[idx+1])throw Error('Usage: node tools/verify_shared_emitted_modules.mjs --root OUTPUT [--check-node]');
const root=path.resolve(args[idx+1]);
const result=validate(root,args.includes('--check-node'));
console.log(JSON.stringify(result,null,2));
if(result.errors.length)process.exitCode=2;
