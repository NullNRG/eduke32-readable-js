#!/usr/bin/env python3
"""Opt-in LLVM IR auto-discovery, strict per-function lowering and diagnostics.

No names are allowlisted; definitions are discovered from actual compiled IR.
A function gets JS 'compiled' status ONLY when strict lowering succeeds.
Compiler output is non-playable until a complete required symbol closure links.
"""
import argparse,json,pathlib,re,subprocess,sys
from llvm_ir_to_js import translate

def lower(files,out):
    irs=[p.read_text() for p in files]
    defined=set()
    for ir in irs:
        defined.update(re.findall(r'^define\s+[^\n]*?@([\w.$]+)\(',ir,re.M))
    result=[];successful=[]
    for name in sorted(defined):
        selected=[]
        for i,ir in enumerate(irs):
            if re.search(r'^define\s+[^\n]*?@'+re.escape(name)+r'\(',ir,re.M):
                selected=[i];break
        if not selected and name not in re.findall(r'^define\s+[^\n]*?@([\w.$]+)\(',irs[0],re.M):selected=[0]
        # Existing strict backend models globals only in CRC32 and no cross calls.
        try:
            js=translate(irs[selected[0]],{name})
            output=out/(re.sub('[^a-zA-Z0-9._-]','_',name)+'.mjs')
            output.write_text(js+'\nexport {EDukeSourceIR};\n')
            check=subprocess.run(['node','--check',str(output)],capture_output=True,text=True)
            if check.returncode:raise ValueError(check.stderr[-300:])
            result.append({'name':name,'status':'generated_js_not_parity_verified','file':output.name})
            successful.append(name)
        except Exception as e:
            result.append({'name':name,'status':'blocked','reason':str(e)[:350]})
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--ir',action='append',type=pathlib.Path,required=True)
    p.add_argument('--out',type=pathlib.Path,required=True)
    a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
    result=lower(a.ir,a.out)
    summary={'attempted':len(result),'lowered':sum(r['status']=='generated_js_not_parity_verified' for r in result),
             'blocked':sum(r['status']=='blocked' for r in result),
             'independent_function_translation_only':True,'complete_linked_engine':False,
             'functions':result}
    (a.out/'autolower-manifest.json').write_text(json.dumps(summary,indent=2))
    print(json.dumps({k:v for k,v in summary.items() if k!='functions'},indent=2))
if __name__=='__main__':main()
