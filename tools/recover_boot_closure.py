#!/usr/bin/env python3
"""Batch original-source AST recovery from active app_main missing graph.

Uses Clang-declared source ownership, bounded compiler subprocesses and a
fail-closed TypeScript-AST merge. It does not fabricate source functions or
claim a runnable browser game from provider counts. Re-runnable and reportable.
"""
from __future__ import annotations
import argparse,concurrent.futures,hashlib,json,os,re,signal,subprocess,sys,time,uuid
from collections import Counter,defaultdict,deque
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
from source_first_automate import pipeline_inputs,run_compiler_process
from source_first_toolchain import fingerprint_toolchain
SOURCE=ROOT/'factory-output/source-tree/eduke32-master'
BASE=ROOT/'factory-output/source-first'
HISTORY=ROOT/'reports/browser-target/historical-ast-gap.json'
REPORT=ROOT/'reports/browser-target/boot-closure-recovery.json'
LEDGER=ROOT/'reports/browser-target/boot-closure-ledger.json'
IDENT=re.compile(r'^[A-Za-z_$][\w$]*$')

def available_symbols():
    d=json.loads((ROOT/'reports/browser-target/combined-closure.json').read_text())
    return d['app_main_direct_still_unprovided']

def historical_owners():
    providers=defaultdict(set)
    for item in json.loads(HISTORY.read_text())['symbols']:
        for entry in item.get('snapshot_manifest',[]):
            providers[item['name']].add(entry['owner'])
    for p in (BASE/'force-recovered').rglob('*.manifest.json'):
        doc=json.loads(p.read_text());owner=doc.get('source')
        if not owner:continue
        for row in doc.get('definitions',[]):
            if row.get('name') and row.get('linkage')!='internal':providers[row['name']].add(owner)
    return providers

def revision():
    """Invalidate saved probe results when original headers or compiler change."""
    h=hashlib.sha256(b'eduke32-boot-clang-probe/3\0')
    fingerprint_toolchain(h)
    for f in [*pipeline_inputs(None,SOURCE),ROOT/'tools/recover_boot_closure.py',
              ROOT/'factory-output/source-first/browser-target/browser-combined-symbol-owners.json']:
        h.update(str(f.relative_to(ROOT)).encode()+b'\0');h.update(hashlib.sha256(f.read_bytes()).digest())
    for f in sorted(SOURCE.rglob('*')):
        if f.is_file():
            h.update(str(f.relative_to(SOURCE)).encode()+b'\0')
            h.update(hashlib.sha256(f.read_bytes()).digest())
    return h.hexdigest()

def save_json(path,content):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(json.dumps(content,indent=2)+'\n')
    tmp.replace(path)

def source_candidates_same_tu(owner,name):
    """Candidate only: compiler must independently prove source declaration."""
    p=SOURCE/owner
    return bool(p.is_file() and re.search(r'\b'+re.escape(name)+r'\s*\(',p.read_text(errors='replace')))

def run_process(command,timeout):
    try:
        result=run_compiler_process(command,timeout)
    except subprocess.TimeoutExpired as exc:
        def decoded(value):return value.decode(errors='replace') if isinstance(value,bytes) else value or ''
        return -1,(decoded(exc.output)+'\n'+decoded(exc.stderr))[-1300:],'timeout'
    return result.returncode,(result.stdout+'\n'+result.stderr)[-1300:],'completed'

def compile_one(entry,timeout,full):
    name,owner=entry['name'],entry['owner']
    # Every compiler invocation owns a fresh output directory. A timed-out or
    # failed subprocess can never promote yesterday's successful manifest.
    out=BASE/'automated-boot-closure'/name/uuid.uuid4().hex
    out.mkdir(parents=True,exist_ok=True)
    owners=json.loads((BASE/'browser-target/browser-combined-symbol-owners.json').read_text())
    # Existing unique, implemented providers only; exclude the TU being
    # translated, so same-unit declarations can be recovered in its AST.
    owners={k:v for k,v in owners.items() if v!=owner}
    owner_path=out/'owners.json';owner_path.write_text(json.dumps(owners,sort_keys=True)+'\n')
    cmd=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(SOURCE),
      '--source',owner,'--filter',name,'--out-dir',str(out),'--project-symbols',str(owner_path),
      '--enum-closure','--header-dependency-closure','--ast-cache-dir',str(ROOT/'work/ast-cache-boot-probes')]
    if full:cmd.extend(['--header-inlines','--dependency-closure'])
    started=time.monotonic();code,log,state=run_process(cmd,timeout)
    manifest=out/(owner+'.manifest.json');item=None
    if code==0 and state=='completed' and manifest.is_file():
        try:
            j=json.loads(manifest.read_text())
            item=next((r for r in j.get('definitions',[]) if r.get('name')==name),None)
        except (ValueError,OSError):pass
    evidence={'symbol':name,'owner':owner,'status':item.get('status') if item else 'timeout' if state=='timeout' else 'no-clang-definition',
      'reason':item.get('reason') if item else ('timeout' if state=='timeout' else log),
      'dependencies':item.get('unresolved_references',[]) if item else [],
      'externalImports':item.get('external_imports',[]) if item else [],
      'elapsed':round(time.monotonic()-started,2),'compilerReturn':code,'probe':str(out.relative_to(ROOT))}
    evidence['freshInvocation']=True
    if item:evidence['manifestSha256']=hashlib.sha256(manifest.read_bytes()).hexdigest()
    return evidence

def main():
    p=argparse.ArgumentParser();p.add_argument('--jobs',type=int,default=3);p.add_argument('--timeout',type=int,default=35)
    p.add_argument('--limit',type=int,default=20);p.add_argument('--depth',type=int,default=2)
    p.add_argument('--budget-seconds',type=int,default=110,help='Global run budget; incomplete results remain queued')
    p.add_argument('--names',nargs='*');p.add_argument('--write',action='store_true')
    p.add_argument('--fresh',action='store_true',help='Retry previously probed blockers instead of resuming')
    p.add_argument('--quick',action='store_true',help='Skip expensive full AST closure for exploratory diagnostics')
    a=p.parse_args();owners=historical_owners();root_names=a.names or available_symbols()
    direct=set(root_names);seen=set();pending=deque((name,None,0) for name in root_names)
    started=time.monotonic()
    rev=hashlib.sha256((revision()+('quick' if a.quick else 'full')).encode()).hexdigest()
    ledger={'format':'eduke32-original-boot-clang-probe-ledger/1','revision':rev,'entries':{}}
    if LEDGER.is_file() and not a.fresh:
        try:
            prev=json.loads(LEDGER.read_text())
            if prev.get('revision')==rev:ledger=prev
        except (OSError,ValueError):pass
    probed=[];promoted=[];rejected=[];missing=[];skipped=[]
    while pending and len(probed)<a.limit and time.monotonic()-started<a.budget_seconds:
        todo=[]
        while pending and len(todo)<min(a.jobs,a.limit-len(probed)):
            name,parent,depth=pending.popleft()
            if not IDENT.fullmatch(name) or name in seen:continue
            old=ledger['entries'].get(name)
            if old and not a.fresh and (old.get('status')!='source-first' or old.get('promoted')):
                seen.add(name);skipped.append({'symbol':name,'status':old.get('status'),'fromLedger':True})
                # Continue traversing previously discovered helpers, including
                # source-owned internal helpers not present in the global map.
                if depth<a.depth:
                    for child in old.get('dependencies',[]):
                        if IDENT.fullmatch(child) and child not in seen:pending.append((child,old.get('owner'),depth+1))
                continue
            seen.add(name)
            candidates=owners.get(name,set())
            if len(candidates)==1:owner=next(iter(candidates))
            elif not candidates and parent and source_candidates_same_tu(parent,name):owner=parent
            else:
                missing.append({'symbol':name,'reason':'ambiguous-owner' if candidates else 'no-proven-owner','candidates':sorted(candidates)})
                continue
            if not (SOURCE/owner).is_file():missing.append({'symbol':name,'reason':'missing-source','owner':owner});continue
            todo.append({'name':name,'owner':owner,'depth':depth})
        if not todo:continue
        with concurrent.futures.ThreadPoolExecutor(max_workers=a.jobs) as pool:
            remaining=max(1,int(a.budget_seconds-(time.monotonic()-started)))
            results=list(pool.map(lambda e:compile_one(e,min(a.timeout,remaining),not a.quick),todo))
        for task,e in zip(todo,results):
            probed.append(e);print(f"{e['symbol']}: {e['status']} {str(e['reason'])[:100]}",flush=True)
            ledger['entries'][e['symbol']]={k:e.get(k) for k in ('owner','status','reason','dependencies','elapsed')}
            ledger['entries'][e['symbol']]['promoted']=False
            if e['status']=='source-first':
                cmd=['node',str(ROOT/'tools/promote_boot_probe.cjs'),'--symbol',e['symbol'],
                     '--owner',e['owner'],'--probe',str(ROOT/e['probe'])]
                if a.write:cmd.append('--write')
                code,log,state=run_process(cmd,25)
                if code==0:
                    promoted.append({'symbol':e['symbol'],'mode':'written' if a.write else 'validated','details':log[-500:]})
                    ledger['entries'][e['symbol']]['promoted']=bool(a.write)
                else:rejected.append({'symbol':e['symbol'],'reason':log[-650:]})
            save_json(LEDGER,ledger)
            if task['depth']<a.depth:
                for name in e.get('dependencies') or []:
                    if isinstance(name,str) and IDENT.fullmatch(name) and name not in seen:
                        pending.append((name,e['owner'],task['depth']+1))
    report={'format':'eduke32-original-boot-closure-recovery/1','requested':root_names,'probed':probed,'promoted':promoted,
      'rejected':rejected,'unknownOwners':missing,'resumedSkipped':skipped,'unvisited':[n for n,p,d in pending],
      'counts':dict(Counter(row['status'] for row in probed)),
      'writeRequested':a.write,'elapsedSeconds':round(time.monotonic()-started,2),
      'workRemaining':bool(pending),'originalGameBootVerified':False,'rule':'No source body or unverified provider is ever synthesized'}
    save_json(REPORT,report);save_json(LEDGER,ledger)
    print('REPORT',REPORT,'PROBED',len(probed),'PROMOTED',len(promoted),'REJECTED',len(rejected),flush=True)
    return 0
if __name__=='__main__':sys.exit(main())
