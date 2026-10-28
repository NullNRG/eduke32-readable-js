// Scope-aware diagnostics complement import/syntax audits of historical epochs.
import {Linter} from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const directory=path.join(root,process.argv[2]||'factory-output/source-first/oct20-source-closure-linked');
const out=path.join(root,process.argv[3]||'reports/oct20-original-free-identifiers.json');
const linter=new Linter(),rows=[];
const globals=Object.fromEntries(['console','process','Buffer','TextEncoder','TextDecoder','performance','setTimeout','clearTimeout','setInterval','clearInterval','window','document','navigator','requestAnimationFrame','cancelAnimationFrame','URL','URLSearchParams'].map(name=>[name,'readonly']));
const walk=folder=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):entry.name.endsWith('.mjs')?[path.join(folder,entry.name)]:[]);
const moduleHashes={};
for(const file of ['source','obj'].map(name=>path.join(directory,name)).filter(fs.existsSync).flatMap(walk)){
  const content=fs.readFileSync(file,'utf8');
  moduleHashes[path.relative(directory,file).replaceAll('\\','/')]=createHash('sha256').update(content).digest('hex');
  const messages=linter.verify(content,{languageOptions:{ecmaVersion:'latest',sourceType:'module',globals},rules:{'no-undef':'error'}});
  for(const message of messages)rows.push({file:path.relative(directory,file).replaceAll('\\','/'),line:message.line,column:message.column,rule:message.ruleId,message:message.message});
}
const groups={};for(const row of rows)groups[row.message]=(groups[row.message]||0)+1;
const report={format:'original-source-free-identifiers/1',directory:path.relative(root,directory),count:rows.length,groups,rows,module_sha256:moduleHashes,gameplay_verified:false};
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({count:rows.length,groups},null,2));
