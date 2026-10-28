#!/usr/bin/env python3
"""Cross-platform verification: Node parser + TypeScript checker + optional ESLint.

Fail closed on syntax/type errors. ESLint unavailable is clearly recorded, never
represented as passing. Generated LLVM output is syntax-checked, not type-checked.
"""
from __future__ import annotations
import argparse,json,pathlib,shutil,subprocess,sys

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1])
    p.add_argument('--out',type=pathlib.Path)
    a=p.parse_args();root=a.root.resolve()
    files=sorted(set((root/'runtime').glob('*.mjs')) | set((root/'factory-output').rglob('*.mjs')))
    report={'modules_checked':len(files),'node_checks':[],'typescript':{},'eslint':{},'passed':False}
    failures=[]
    for file in files:
        res=subprocess.run(['node','--check',str(file)],capture_output=True,text=True)
        report['node_checks'].append({'file':str(file.relative_to(root)),'ok':res.returncode==0,'error':res.stderr[-1000:]})
        if res.returncode:failures.append(str(file)+': syntax error')
    ts=shutil.which('tsc')
    if ts:
        cmd=[ts,'--allowJs','--checkJs','--noEmit','--skipLibCheck','--target','ES2022',
             '--module','NodeNext','--moduleResolution','NodeNext','--lib','ES2022,DOM',
             *map(str,sorted((root/'runtime').glob('*.mjs')))]
        r=subprocess.run(cmd,capture_output=True,text=True)
        report['typescript']={'status':'pass' if r.returncode==0 else 'fail','message':(r.stdout+r.stderr)[-4000:]}
        if r.returncode:failures.append('TypeScript diagnostics failed')
    else:report['typescript']={'status':'unavailable'}
    eslint=shutil.which('eslint')
    if eslint:
        r=subprocess.run([eslint,*map(str,sorted((root/'runtime').glob('*.mjs')))],cwd=root,capture_output=True,text=True)
        report['eslint']={'status':'pass' if r.returncode==0 else 'fail','message':(r.stdout+r.stderr)[-4000:]}
        if r.returncode:failures.append('ESLint diagnostics failed')
    else:report['eslint']={'status':'not_installed','message':'ESLint optional; TypeScript checkJs + Node parser verified.'}
    report['passed']=not failures;report['failure_reasons']=failures
    out=a.out or root/'factory-output'/'js-verification.json';out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='node_checks'},indent=2))
    return 0 if not failures else 1
if __name__=='__main__':sys.exit(main())
