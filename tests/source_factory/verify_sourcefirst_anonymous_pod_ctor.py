"""Anonymous typedef POD storage uses its original Clang tag and byte layout."""
import base64,copy,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import reference_names,parse_json_stream,parse_clang_record_layouts,recover_type_aliases,descendants
from source_byte_records import recover_byte_records

# Removing an already-lowered constructor must never erase a same-named
# runtime declaration, or a different constructor that still needs a provider.
ctor={'kind':'CXXConstructExpr','type':{'qualType':'Display'}}
other_ctor={'kind':'CXXConstructExpr','type':{'qualType':'Display'}}
var={'kind':'DeclRefExpr','referencedDecl':{'id':'global','kind':'VarDecl','name':'Display'}}
tree={'kind':'CompoundStmt','inner':[ctor]}
assert reference_names(tree,class_dependencies={'Display'})=={'Display'}
assert reference_names(tree,class_dependencies={'Display'},storage_constructor_nodes={id(ctor)})==set()
for other in (var,other_ctor):
    tree['inner']=[ctor,other]
    assert reference_names(tree,class_dependencies={'Display'},storage_constructor_nodes={id(ctor)})=={'Display'}
def run(args):
    r=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=90)
    assert r.returncode==0,(args,r.stdout[-1500:],r.stderr[-2000:])
    return r.stdout
with tempfile.TemporaryDirectory(prefix='source-anonymous-pod-') as td:
    p=Path(td)
    (p/'types.h').write_text('typedef struct {unsigned format;int w,h,rate;void *driver;} Display;\n')
    (p/'unit.cpp').write_text('''#include "types.h"
extern "C" int display_value(int x){
 Display m; int backing[1]={x*11};
 m.format=7;m.w=x+320;m.h=200-x;m.rate=60;m.driver=backing;
 Display copy;__builtin_memcpy(&copy,&m,sizeof(m));
 *((int*)copy.driver)+=3;
 return m.w+m.h+m.rate+m.format+backing[0]+100*(m.driver==copy.driver);
}
''')
    (p/'main.cpp').write_text('#include <stdio.h>\nextern "C" int display_value(int);\nint main(){for(int i=-128;i<128;i++)printf("%d\\n",display_value(i));}\n')
    exe=p/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14',str(p/'unit.cpp'),str(p/'main.cpp'),'-o',str(exe)])
    expected=[int(line) for line in run([str(exe)]).splitlines()]
    ast_command=['clang++','-std=c++14','-Xclang','-ast-dump=json','-fsyntax-only',str(p/'unit.cpp')]
    first=parse_json_stream(run(ast_command));second=parse_json_stream(run(ast_command))
    layouts=parse_clang_record_layouts(run(['clang++','-std=c++14','-Xclang',
        '-fdump-record-layouts-complete','-fsyntax-only',str(p/'unit.cpp')]))
    def byte_records(roots):
        return recover_byte_records(roots,layouts,recover_type_aliases(roots),source_root=p)
    single=byte_records(first)['Display'];combined=byte_records(first+second)['Display']
    assert single['byte_schema']==combined['byte_schema'] and combined['anonymous_typedef']
    changed=copy.deepcopy(second)
    for root in changed:
        for node in descendants(root):
            if node.get('kind')=='FieldDecl' and node.get('name')=='w':node['type']['qualType']='unsigned int'
    assert 'Display' not in byte_records(first+changed),'Conflicting declaration shape was deduplicated'
    changed=copy.deepcopy(second)
    for root in changed:
        for node in descendants(root):
            if node.get('kind')=='CXXRecordDecl' and node.get('completeDefinition') and not node.get('name'):
                node['loc']['offset']+=1
    assert 'Display' not in byte_records(first+changed),'Unproven physical declaration was deduplicated'
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(p),'--source','unit.cpp',
        '--filter','display_value','--out-dir',str(p/'out'),'--dependency-closure','--header-dependency-closure'])
    module=p/'out/unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
    entry=next(row for row in doc['definitions'] if row['name']=='display_value')
    assert entry['status']=='source-first',doc
    assert entry['storage_constructor_count']==2 and 'Display' not in entry['source_references'],entry
    assert 'new Display(' not in module.read_text(),module.read_text()[-2000:]
    js='async url=>{const m=await import(url);return Array.from({length:256},(_,i)=>m.display_value(i-128));}'
    (p/'check.mjs').write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    actual=json.loads(run(['node',str(p/'check.mjs')]));assert actual==expected,(actual[:5],expected[:5])
    report={'passed':True,'native_node_cases':256,'anonymous_typedef_layout_and_pointer_copy_verified':True,
        'independent_ast_identity_verified':True,'conflicting_declarations_rejected':True,'gameplay_verified':False}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
            assert actual==expected and not errors,(actual[:5],errors)
            report.update(chromium_cases=256,browser_version=browser.version);browser.close()
    (ROOT/'reports/oct24-anonymous-pod-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
