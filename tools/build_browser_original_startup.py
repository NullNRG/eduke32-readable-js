#!/usr/bin/env python3
"""Reproducible proof-bearing translation of original startup against browser ABI.

This integration target names an original function, but never inserts a game
stub or teaches the generic compiler a game-specific special case.
"""
from __future__ import annotations
import argparse,hashlib,json,re,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
EXPORT=re.compile(r'^export\s+(?:(?:async)\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)\b',re.M)

def read(path):return json.loads(path.read_text())

def verify_export(module,name):
    if not module.is_file() or name not in set(EXPORT.findall(module.read_text())):
        raise RuntimeError(f'Unverified source export {name} from {module}')

def build(out,snapshot,source,entry,include_headers=True,report_name=None):
    original_index=read(out/'browser-combined-symbol-owners.json')
    index={k:v for k,v in original_index.items() if v!=source}
    symbolfile=out/'symbols-original-startup.json'
    symbolfile.write_text(json.dumps(index,sort_keys=True,indent=2)+'\n')
    src=ROOT/'factory-output/source-tree/eduke32-master'
    entries=[name.strip() for name in entry.split(',')]
    if not entries or any(not re.fullmatch(r'[A-Za-z_][A-Za-z_0-9]*',name) for name in entries):
        raise ValueError('Original startup filter must contain exact C function identifiers')
    cmd=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(src),
         '--source',source,'--filter',','.join(entries),'--out-dir',str(out),
         '--project-symbols',str(symbolfile),'--dependency-closure','--enum-closure']
    if include_headers:cmd+=['--header-inlines','--header-dependency-closure']
    job=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True,timeout=100)
    if job.returncode:raise RuntimeError(f'Source transpiler rejected {entry}:\n{job.stdout}\n{job.stderr}')
    manifest=out/(source+'.manifest.json');doc=read(manifest)
    for name in entries:
        rows=[d for d in doc['definitions'] if d['name']==name]
        if len(rows)!=1 or rows[0]['status']!='source-first':
            raise RuntimeError(f'{name} remains blocked: {rows}')
    module=out/(source+'.mjs')
    for name in entries:verify_export(module,name)
    copied=[]
    for dep in doc.get('imports',[]):
        owner=dep['from'];name=dep.get('binding') or dep['name']
        # Generated host providers must be real installed files, never copied
        # from C++ or synthesized as no-op exports.
        target=out/(owner+'.mjs')
        if not target.is_file() and not owner.startswith('browser-abi/'):
            candidate=snapshot/(owner+'.mjs')
            verify_export(candidate,name)
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(candidate,target)
            mf=candidate.with_suffix('.manifest.json')
            if mf.is_file():shutil.copy2(mf,target.with_suffix('.manifest.json'))
            copied.append(owner)
        verify_export(target,name)
    # Syntax validity on the real generated JS, no fake semantics.
    for path in [module,*[out/(name+'.mjs') for name in copied]]:
        check=subprocess.run(['node','--check',str(path)],cwd=ROOT,capture_output=True,text=True,timeout=20)
        if check.returncode:raise RuntimeError(f'Generated source failed syntax: {path}: {check.stderr}')
    report={'format':'eduke32-original-boot-preinit/1','source':source,'entry':entry,'entries':entries,
            'status':'SOURCE_COMPILED_NOT_GAMEPLAY','emitted':True,'linked_source_imports':doc['imports'],
            'copied_source_providers':copied,'source_sha256':hashlib.sha256((src/source).read_bytes()).hexdigest(),
            'generated_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),
            'original_app_main_linked':False,'original_gameplay_verified':False}
    output=ROOT/'reports/browser-target'/(report_name or 'original-preinit-compile.json')
    if not re.fullmatch(r'[A-Za-z_][A-Za-z_0-9.-]*\.json',output.name):
        raise ValueError('Invalid report filename')
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'status':report['status'],'entry':entry,'original_imports':len(doc['imports']),'staged_source_modules':copied},indent=2))
    return report

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--source',default='source/duke3d/src/common.cpp');ap.add_argument('--entry',default='G_ExtPreInit')
    ap.add_argument('--no-header-closure',action='store_true');ap.add_argument('--report-name',default=None)
    a=ap.parse_args();build(ROOT/'factory-output/source-first/browser-target',ROOT/'factory-output/source-first/force-recovered',a.source,a.entry,
                           include_headers=not a.no_header_closure,report_name=a.report_name)
if __name__=='__main__':main()
