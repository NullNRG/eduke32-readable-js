"""Keep unchanged, closed original header factories local during owner rebuilds.
No new cross-TU import cycle, data storage, or source recovery is introduced.
"""
import copy,hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def retain(previous,current,old_code,new_code):
 old={r['name']:r for r in previous['definitions'] if r['status']=='source-first'}
 existing={r['name'] for r in current['definitions'] if r['status']=='source-first'}
 roots=[n for n,r in old.items() if n not in existing and r['kind']=='CXXRecordDecl' and r.get('header_record_factory') and r.get('odr_inline')]
 if not roots:return current,new_code
 assert previous['source']==current['source'] and previous['ast_cache_inputs']==current['ast_cache_inputs'] and current['ast_cache_inputs']['preprocessor_verified'],'Original header inputs differ'
 chosen={};pending=list(roots)
 while pending:
  n=pending.pop()
  if n in chosen or n in existing:continue
  r=old[n]
  assert r['kind'] in ('CXXRecordDecl','FunctionDecl') and not r.get('external_imports') and not r.get('external_storage_imports'),('Original header graph is not closed',n)
  chosen[n]=r;pending.extend(set(r.get('source_references',[]))-chosen.keys())
 parser="""import ts from 'typescript';let data='';for await(const c of process.stdin)data+=c;
const {code,names}=JSON.parse(data),ast=ts.createSourceFile('original.mjs',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);if(ast.parseDiagnostics.length)throw Error('Original syntax invalid');const result={};
for(const name of names){const choices=ast.statements.filter(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name);if(choices.length!==1)throw Error('Original declaration missing/ambiguous: '+name);result[name]=choices[0].getText(ast);}process.stdout.write(JSON.stringify(result));"""
 names=list(chosen)
 # This side-effect-free compiler helper is needed by retained by-value class
 # functions. Pointer/allocation/lifetime helpers must remain the current ones.
 if any('cCopyTrivialClass(' in old_code for n in roots) and not re.search(r'(?m)^(?:function|const) cCopyTrivialClass\b',new_code):names+=['cCopyTrivialClass']
 p=subprocess.run(['node','--input-type=module','-e',parser],input=json.dumps({'code':old_code,'names':names}),cwd=ROOT,text=True,capture_output=True,timeout=90)
 assert p.returncode==0,p.stderr
 bodies=json.loads(p.stdout);doc=copy.deepcopy(current);code=new_code
 for n,body in bodies.items():
  if re.search(r'(?m)^export (?:function|const) '+re.escape(n)+r'\b',code):assert code.count(body)==1,('Retained original declaration changed',n)
  else:code+='\n// Unchanged original source-header implementation; not a new recovery.\n'+body+'\n'
 proof={'owner_sha256':hashlib.sha256(old_code.encode()).hexdigest(),'identical_preprocessor_inputs':True,'source_function_sha256':{n:hashlib.sha256(v.encode()).hexdigest() for n,v in bodies.items()},'current_revision_reemission':False,'additional_source_definitions':0}
 doc['definitions'].extend({**r,'retained_original_implementation':proof} for r in chosen.values())
 doc['retained_original_header_factory_closures']=[{'factories':roots,**proof}]
 doc['source_definitions_emitted_before_retention']=doc['emitted'];doc['found']+=len(chosen);doc['emitted']+=len(chosen)
 return doc,code
