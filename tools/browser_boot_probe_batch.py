#!/usr/bin/env python3
"""Source-derived, bounded startup frontier probe. No synthetic provider exports."""
import argparse, concurrent.futures, json, subprocess, sys, time
from pathlib import Path
from collections import defaultdict
ROOT=Path(__file__).resolve().parents[1]
SCRIPT=ROOT/'tools/source_ast_to_js.py'

def run(snapshot,index,out,entry,t,timeout,full_closure=False):
    source=entry['owner']; name=entry['name']; dest=out/name
    dest.mkdir(parents=True,exist_ok=True)
    mapping=dest/'verified-symbol-owners.json'
    mapping.write_text(json.dumps({k:v for k,v in index.items() if v!=source},indent=2)+'\n')
    cmd=[sys.executable,str(SCRIPT),'--root',str(ROOT/'factory-output/source-tree/eduke32-master'), '--source',source,'--filter',name,'--out-dir',str(dest),'--project-symbols',str(mapping),'--enum-closure','--header-dependency-closure']
    if full_closure:cmd.extend(['--header-inlines','--dependency-closure'])
    started=time.monotonic()
    try:
        p=subprocess.run(cmd,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
        log=(p.stdout+'\n'+p.stderr)[-4500:]
        outcome='tool-error' if p.returncode else 'blocked'
        mf=dest/(source+'.manifest.json')
        evidence=None
        if mf.is_file():
            d=json.loads(mf.read_text()); relevant=[x for x in d.get('definitions',[]) if x.get('name')==name]
            if relevant:
                r=relevant[-1];outcome=r['status'];evidence={'reason':r.get('reason'),'imports':r.get('external_imports',[]),'refs':r.get('unresolved_references',[])}
        return {**entry,'result':outcome,'seconds':round(time.monotonic()-started,2),'evidence':evidence,'output':str(dest.relative_to(ROOT)),'log':log[-550:]}
    except subprocess.TimeoutExpired:return {**entry,'result':'timeout','seconds':timeout}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--jobs',type=int,default=3);ap.add_argument('--timeout',type=int,default=45);ap.add_argument('--limit',type=int,default=14);ap.add_argument('--names',nargs='*');ap.add_argument('--full-closure',action='store_true');ap.add_argument('--report',default='reports/browser-target/boot-probes-fresh.json');args=ap.parse_args()
    snap=ROOT/'factory-output/source-first/force-recovered'; idx=json.loads((ROOT/'factory-output/source-first/browser-target/browser-combined-symbol-owners.json').read_text())
    direct=json.loads((ROOT/'reports/browser-target/combined-closure.json').read_text())['app_main_direct_still_unprovided']
    providers=defaultdict(list)
    for f in snap.rglob('*.manifest.json'):
        a=json.loads(f.read_text());src=a.get('source')
        for d in a.get('definitions',[]):
            if d.get('status')=='blocked':providers[d.get('name')].append(src)
    names=args.names or direct
    entries=[]
    for name in names:
        sources=set(providers.get(name,[]))
        if len(sources)==1:entries.append({'name':name,'owner':next(iter(sources))})
    if not args.names:
        entries.sort(key=lambda r: (0 if 'unlinked' in next((d.get('reason','') for f in snap.rglob('*.manifest.json') for a in [json.loads(f.read_text())] if a.get('source')==r['owner'] for d in a.get('definitions',[]) if d.get('name')==r['name']), '') else 1,r['name']))
    entries=entries[:args.limit]
    out=ROOT/'factory-output/source-first/browser-boot-next';out.mkdir(parents=True,exist_ok=True)
    print('Probing',[(x['name'],x['owner']) for x in entries],flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futs={pool.submit(run,snap,idx,out,e,None,args.timeout,args.full_closure):e for e in entries}
        results=[]
        for fut in concurrent.futures.as_completed(futs):
            r=fut.result();results.append(r);print(r['name'],r['result'],str(r.get('evidence',{}).get('reason',''))[:100],flush=True)
    report={'format':'eduke32-browser-boot-fresh-probes/1','probes':sorted(results,key=lambda a:a['name']),'counts':{x:sum(a['result']==x for a in results) for x in set(a['result'] for a in results)}}
    dest=ROOT/args.report;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(report,indent=2)+'\n')
    print('REPORT',dest,'COUNTS',report['counts'],flush=True)
if __name__=='__main__':main()
