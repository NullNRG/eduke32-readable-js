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


def retain_callable_names(previous,current,old_exports,code):
    """Retain a legacy public name for the exact rebuilt original callable.
    Rename the actual JS binding, preserving function-pointer identity; never
    select an overload by argument count or fabricate an implementation.
    """
    assert previous['source']==current['source']
    existing={r['name'] for r in current['definitions'] if r['status']=='source-first'}
    doc=copy.deepcopy(current);renames=[]
    for old in previous['definitions']:
        legacy=old['name']
        if old['status']!='source-first' or old['kind']!='FunctionDecl' or legacy not in old_exports or legacy in existing or legacy!=old.get('source_name',legacy) or not re.fullmatch(r'[A-Za-z_]\w*',legacy):continue
        matches=[r for r in doc['definitions'] if r['status']=='source-first' and r['kind']=='FunctionDecl' and r.get('source_name')==legacy and r.get('original_type')==old.get('original_type') and r.get('line')==old.get('line') and r.get('physical_source',current['source'])==old.get('physical_source',previous['source'])]
        if not matches:continue
        assert previous['ast_cache_inputs']==current['ast_cache_inputs'] and current['ast_cache_inputs']['preprocessor_verified']
        assert len(matches)==1,('Rebuilt original callable ambiguous',legacy)
        actual=matches[0]['name'];assert actual!=legacy and actual not in old_exports
        parser="""import ts from 'typescript';let text='';for await(const c of process.stdin)text+=c;
const {code,actual,legacy}=JSON.parse(text),file='retained.mjs',options={allowJs:true,noResolve:true,noLib:true,target:ts.ScriptTarget.Latest},host=ts.createCompilerHost(options);
host.getSourceFile=(name)=>name===file?ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS):undefined;host.fileExists=n=>n===file;host.readFile=n=>n===file?code:undefined;
const program=ts.createProgram([file],options,host),ast=program.getSourceFile(file),checker=program.getTypeChecker();
const definitions=ast.statements.filter(s=>ts.isFunctionDeclaration(s)&&s.name?.text===actual);if(definitions.length!==1)throw Error('No unique original function binding');
const symbol=checker.getSymbolAtLocation(definitions[0].name),changes=[];if(!symbol)throw Error('Original function binding unproved');
function walk(n){if(ts.isIdentifier(n)&&n.text===actual&&checker.getSymbolAtLocation(n)===symbol)changes.push([n.getStart(ast),n.end]);ts.forEachChild(n,walk);}walk(ast);
let output=code;for(const [a,b]of changes.sort((a,b)=>b[0]-a[0]))output=output.slice(0,a)+legacy+output.slice(b);process.stdout.write(JSON.stringify({code:output,renamed_identifiers:changes.length}));"""
        result=subprocess.run(['node','--input-type=module','-e',parser],input=json.dumps({'code':code,'actual':actual,'legacy':legacy}),cwd=ROOT,text=True,capture_output=True,timeout=90);assert result.returncode==0,result.stderr
        data=json.loads(result.stdout);assert data['renamed_identifiers']>=1;code=data['code']
        proof={'previous_emitted_name':actual,'same_original_callable':True,'same_tu_preprocessor_sha256':current['ast_cache_inputs']['sha256'],'original_type':old['original_type'],'original_line':old['line'],'renamed_identifiers':data['renamed_identifiers'],'additional_source_definition':False}
        matches[0]['name']=legacy;matches[0]['compiler_abi_name_retention']=proof
        for row in doc['definitions']:
            for key in ('source_references','external_imports','unresolved_references'):
                if key in row:row[key]=[legacy if n==actual else n for n in row[key]]
        existing.add(legacy);renames.append({'name':legacy,**proof})
    if renames:doc['retained_original_callable_names']=renames
    return doc,code
