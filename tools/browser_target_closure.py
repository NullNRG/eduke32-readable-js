#!/usr/bin/env python3
"""Produce a verified browser-host + original-source import ownership frontier.

Never map a blocked game/engine function to a placeholder. Real host symbols
are introspected from NativeRuntime and imported from executable adapter modules.
Original-source providers must be present in an emitted .mjs file and unique.
"""
from __future__ import annotations
import argparse,hashlib,json,os,re,subprocess,shutil
from collections import defaultdict,Counter,deque
from pathlib import Path
from browser_target_abi import ROOT,build as build_sdl

OWNER='browser-abi/libc_provider'
EXPORT=re.compile(r'^export\s+(?:(?:async)\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)\b',re.M)
IDENT=re.compile(r'^[a-zA-Z_$][\w$]*$')

REEXPORT=re.compile(r'^export\s*\{([^}]*)\}\s*from\s*["\'](\./_source_legacy_[^"\']+)["\'];?$',re.M)
def active_exports(module):
    """Count named ESM exports only when their actual implementation exists.

    Generated facades may re-export live bindings from a same-directory,
    Clang-derived implementation shard. Never infer exports from an old
    manifest when the active module silently shadowed its declarations.
    """
    content=module.read_text(encoding='utf-8')
    exports=set(EXPORT.findall(content))
    for names,filename in REEXPORT.findall(content):
        shard=(module.parent/filename).resolve()
        if shard.parent!=module.parent.resolve() or not shard.is_file():
            raise RuntimeError('Invalid or missing verified source shard: '+filename)
        available=set(EXPORT.findall(shard.read_text(encoding='utf-8')))
        declared={item.strip() for item in names.split(',')}
        if not declared or not declared.issubset(available):
            raise RuntimeError('Reexport not backed by original generated source: '+filename)
        exports.update(declared)
    return exports

def libc_symbols():
    js='import {NativeRuntime} from "./runtime/index.mjs"; const r=new NativeRuntime();console.log(JSON.stringify(Object.keys(r.library.symbols).filter(n=>typeof r.library.symbols[n]==="function").sort()));r.close();'
    p=subprocess.run(['node','--input-type=module','-e',js],cwd=ROOT,text=True,capture_output=True,timeout=25,check=True)
    result=json.loads(p.stdout)
    if len(result)<100 or len(result)!=len(set(result)):raise ValueError('Unexpected browser C-runtime export table')
    return result

def emitted_owners(folder):
    candidates=defaultdict(list)
    blocked=defaultdict(list)
    for manifest_path in sorted(folder.rglob('*.manifest.json')):
        m=json.loads(manifest_path.read_text(encoding='utf-8'))
        source=m.get('source')
        if not source or not isinstance(source,str):continue
        module=folder/(source+'.mjs')
        if not module.is_file():continue
        exported=active_exports(module)
        for row in m.get('definitions',[]):
            name=row.get('name')
            if not isinstance(name,str) or not IDENT.fullmatch(name):continue
            if row.get('status')!='source-first':
                if row.get('status')=='blocked':blocked[name].append(source)
                continue
            if row.get('linkage')=='internal':continue
            # The linker may only claim exact generated JS source exports.
            if name in exported:candidates[name].append(source)
    unique={name:paths[0] for name,paths in candidates.items() if len(set(paths))==1}
    ambiguous={name:sorted(set(paths)) for name,paths in candidates.items() if len(set(paths))>1}
    return unique,ambiguous,blocked

def runtime_module(names,source_bytes_import):
    # Constructor source is actual existing runtime, not a synthesized service.
    content='''// Auto-generated from NativeRuntime's real, tested C ABI table.
import {bindLoguruHeap} from './loguru_provider.mjs';
import {sourceHeapAddress} from SOURCE_BYTES_IMPORT;
let active=null;
export const BROWSER_C_SYMBOLS=Object.freeze(LIST);
export function bindBrowserC(runtime) {
  if (active) throw new Error('Browser C ABI already bound');
  const symbols=runtime?.library?.symbols;
  if (!symbols) throw new TypeError('NativeRuntime C services required');
  for (const name of BROWSER_C_SYMBOLS) if (typeof symbols[name]!=='function')
    throw new Error('Missing implemented browser C function: '+name);
  const releaseLoguru=bindLoguruHeap(runtime.heap);
  active={symbols,heap:runtime.heap};
  let detached=false;
  return ()=>{if (!detached){detached=true;releaseLoguru();if (active?.symbols===symbols)active=null;}};
}
// C literals and stack arrays emitted by Clang are Uint8Array, while POSIX
// routines use numeric pointers into the project's explicit C ABI heap.
// Original source-first C pointer arrays are byte views; the native host C
// heap uses numeric addresses. For owned string returns, preserve pointer
// lifetime via identity so the original allocator can free the same storage.
const ownedCStrings=new WeakMap();
const sourceOwnedString=name=>{
  const ptr=call(name,[]);
  if (!ptr) return null;
  const size=active.heap.strlen(ptr)+1;
  const view=active.heap.u8.subarray(ptr,ptr+size);
  ownedCStrings.set(view,{ptr,heap:active.heap});
  return view;
};
const freeSourceValue=value=>{
  if (value instanceof Uint8Array && ownedCStrings.has(value)) {
    const {ptr,heap}=ownedCStrings.get(value);
    ownedCStrings.delete(value); heap.free(ptr); return;
  }
  return call('free',[value]);
};
const cStringBytes=value=>{
  if (!(value instanceof Uint8Array)) throw new TypeError('Expected original C byte array');
  const end=value.indexOf(0);
  if (end<0) throw new TypeError('Original C string lacks a terminating NUL');
  return value.subarray(0,end+1);
};
const withCStrings=(args,indexes,fn)=>{
  const copied=[...args],owned=[];
  try {
    for (const index of indexes) if (copied[index] instanceof Uint8Array){
      const bytes=cStringBytes(copied[index]),p=active.heap.malloc(bytes.length);
      owned.push(p);active.heap.u8.set(bytes,p);copied[index]=p;
    }
    return fn(copied);
  } finally {for(const p of owned)active.heap.free(p);}
};
// Directory handles and dirent results are borrowed ORIGINAL host-heap
// allocations. Source pointer fields must store their real LP64 addresses;
// raw host numbers cannot be treated as unrelated source address tokens.
const sourceAllocatedPointer=ptr=>{
  if(!ptr)return null;
  const size=active.heap.allocations.get(ptr);
  if(!Number.isSafeInteger(size)||size<1)throw new TypeError('Directory service returned no live allocation');
  return active.heap.borrow(ptr,size);
};
const call=(name,args)=>{
  if (!active) throw new Error('Browser C ABI is not bound: '+name);
  const fn=active.symbols[name];
  if (typeof fn!=='function') throw new Error('Browser C ABI missing actual implementation: '+name);
  if(name==='opendir')return withCStrings(args,[0],a=>sourceAllocatedPointer(fn(...a)));
  if(name==='readdir')return sourceAllocatedPointer(fn(sourceHeapAddress(args[0],active.heap)));
  if(name==='closedir')return fn(sourceHeapAddress(args[0],active.heap));
  if ((name==='chdir'||name==='mkdir'||name==='stat'||name==='open'||name==='unlink') && args[0] instanceof Uint8Array)
    return withCStrings(args,[0],a=>fn(...a));
  if (name==='getcwd' && args[0] instanceof Uint8Array){
    const out=args[0],count=Number(args[1]);
    if(!Number.isSafeInteger(count)||count<1||count>out.length)throw new RangeError('getcwd destination outside Clang array');
    const ptr=active.heap.malloc(count);
    try {
      const success=fn(ptr,count);
      if (!success)return null;
      const n=active.heap.u8.subarray(ptr,ptr+count).indexOf(0);
      if (n<0)throw new RangeError('getcwd output not terminated');
      out.set(active.heap.u8.subarray(ptr,ptr+n+1));
      return out;
    } finally {active.heap.free(ptr);}
  }
  if (name==='strcat' && args[0] instanceof Uint8Array && args[1] instanceof Uint8Array){
    const dst=args[0],src=cStringBytes(args[1]),end=dst.indexOf(0);
    if(end<0||end+src.length>dst.length)throw new RangeError('C strcat exceeds original destination storage');
    dst.set(src,end);return dst;
  }
  return fn(...args);
};
'''.replace('LIST',json.dumps(names)).replace('SOURCE_BYTES_IMPORT',json.dumps(source_bytes_import))
    for name in names:
        if not IDENT.fullmatch(name):continue
        if name in ('Bgethomedir','Bgetappdir'):
            content+=f'export function {name}(){{return sourceOwnedString({json.dumps(name)});}}\n'
        elif name=='free':
            content+='export function free(value){return freeSourceValue(value);}'+'\n'
        else:
            content+=f'export function {name}(...args){{return call({json.dumps(name)},args);}}\n'
    return content


def startup_graph(snapshot, index, entry='app_main'):
    """Source-backed transitive priority inventory, not executable closure proof."""
    providers=defaultdict(list)
    for path in snapshot.rglob('*.manifest.json'):
        doc=json.loads(path.read_text())
        source=doc.get('source')
        if not source:continue
        for row in doc.get('definitions',[]):
            name=row.get('name')
            if name and row.get('status') in ('blocked','source-first'):
                providers[name].append((source,row))
    queue=deque([entry]);visited=set();missing=Counter();reachable=Counter()
    edges=0;missing_provider=set();details=[]
    while queue and len(visited)<60000:
        name=queue.popleft()
        if name in visited:continue
        visited.add(name)
        if name!=entry and index.get(name,'').startswith('browser-abi/'):
            reachable['browser-host-function']+=1;continue
        options=providers.get(name,[])
        if not options:
            reachable['missing-original-declaration']+=1;missing_provider.add(name);continue
        # Multi-owner names are never arbitrarily promoted; preserve ambiguity.
        exact=[(owner,row) for owner,row in options if index.get(name)==owner and row.get('status')=='source-first']
        if len(exact)==1:owner,row=exact[0]
        elif len(options)==1:owner,row=options[0]
        else:
            reachable['ambiguous-original-owner']+=1;missing['ambiguous original declaration']+=1
            details.append({'name':name,'kind':'ambiguous','owners':sorted({v[0] for v in options})[:8]})
            continue
        if row.get('status')=='source-first':reachable['source-emitted']+=1
        else:
            reachable['source-blocked']+=1
            reason=row.get('reason','unknown')
            category=reason.split(':',1)[0]
            missing[category]+=1
            if len(details)<1500:details.append({'name':name,'kind':'source-blocked','owner':owner,'reason':reason[:250]})
        refs=row.get('source_references') or row.get('unresolved_references') or []
        if isinstance(refs,list):
            for ref in refs:
                if isinstance(ref,str) and ref!=name:
                    queue.append(ref);edges+=1
    return {'visited_symbols':len(visited),'reference_edges_followed':edges,
            'by_state':dict(reachable),'blocked_semantics_types':dict(missing.most_common(30)),
            'missing_declaration_symbols':sorted(missing_provider)[:200],
            'blockers_sample':details[:120],
            'note':'Static source references from historical manifests; graph reachability does not establish successful import linkage.'}

def build(snapshot,out,report_path,entry_source='source/duke3d/src/game.cpp',entry_name='app_main'):
    out.mkdir(parents=True,exist_ok=True)
    sdl_report=report_path.parent/'abi-provider.json'
    sd=build_sdl(out,sdl_report)
    c=libc_symbols()
    file=out/(OWNER+'.mjs');file.parent.mkdir(parents=True,exist_ok=True)
    source_bytes_import=os.path.relpath(ROOT/'runtime/source_bytes.mjs',file.parent).replace('\\','/')
    if not source_bytes_import.startswith('.'):source_bytes_import='./'+source_bytes_import
    file.write_text(runtime_module(c,source_bytes_import),encoding='utf-8')
    source,ambiguous,blocked=emitted_owners(snapshot)
    # Preserve source-derived newly emitted functions from the browser target.
    # Accept only the same exact original TU owner and an actual export; a
    # disagreement is ambiguous and cannot be promoted as a linker provider.
    incremental, incremental_ambiguous, _ = emitted_owners(out)
    for name,owner in incremental.items():
        if name in source and source[name]!=owner:
            ambiguous[name]=sorted({source.pop(name),owner})
        elif name not in ambiguous:source[name]=owner
    for name,owners in incremental_ambiguous.items():
        source.pop(name,None);ambiguous[name]=owners
    # A promoted partial module shadows the snapshot module of the same C++
    # translation unit.  It cannot provide missing historic names just because
    # the old file still exists in the force-recovered directory. Count only
    # the active .mjs file and validated, live named ES reexports.
    replaced={}
    for module in out.glob('source/**/*.mjs'):
        if module.name.startswith('_source_legacy_'):continue
        # `source/` is part of the ORIGINAL captured TU path, not an output
        # staging prefix. Removing it prevented active modules from shadowing
        # their snapshot and falsely retained providers absent from the target.
        owner=module.relative_to(out).as_posix().removesuffix('.mjs')
        replaced[owner]=active_exports(module)
    shadowed=[{'name':name,'source':owner} for name,owner in list(source.items())
              if owner in replaced and name not in replaced[owner]]
    for item in shadowed:source.pop(item['name'],None)
    sdl=set(sd['symbols']);libc=set(c)
    # Only existing host functions can be substitutions. Deliberately prioritize
    # the browser C/SDL platform ABI over duplicate OS implementations.
    host={name:'browser-abi/sdl_provider' for name in sdl if IDENT.fullmatch(name)}
    host.update({name:OWNER for name in c if IDENT.fullmatch(name) and name not in sdl})
    # libdivide is an original third-party arithmetic library, not Duke gameplay.
    # Keep its exact four signed generator implementations in one browser-native
    # service module. They are validated against the bundled C++ header over the
    # entire DIVTABLESIZE range; never manufacture missing engine providers.
    math_names=('libdivide_u32_gen','libdivide_u32_branchfree_gen','libdivide_s32_gen','libdivide_s32_branchfree_gen',
                'libdivide_s64_gen','libdivide_s64_branchfree_gen')
    math_source=ROOT/'runtime/libdivide_abi.mjs'
    math_target=out/'browser-abi/libdivide_provider.mjs'
    if not math_source.is_file():raise FileNotFoundError(math_source)
    unsigned_parity=json.loads((ROOT/'reports/oct30-unsigned-libdivide-parity.json').read_text())
    original_header=ROOT/'factory-output/source-tree/eduke32-master/source/build/include/libdivide.h'
    if (not unsigned_parity.get('passed')
        or unsigned_parity.get('module_sha256')!=hashlib.sha256(math_source.read_bytes()).hexdigest()
        or unsigned_parity.get('header_sha256')!=hashlib.sha256(original_header.read_bytes()).hexdigest()
        or unsigned_parity.get('native_node_records',0)<32875
        or unsigned_parity.get('native_node_records')!=unsigned_parity.get('native_chromium_records')):
        raise RuntimeError('Unsigned libdivide source/parity evidence differs; rerun native/browser verification')
    math_target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(math_source,math_target)
    for symbol in math_names:
        if not re.search(r'^export function '+re.escape(symbol)+r'\(',math_target.read_text(),re.M):
            raise RuntimeError('Unverified browser libdivide export: '+symbol)
        host[symbol]='browser-abi/libdivide_provider'

    # These operations are canonical compiler output from the original header,
    # including its high-half multiplication helpers. Require both exact source
    # provenance and native/browser parity before advertising any provider.
    division_source=ROOT/'runtime/libdivide_division_source.mjs'
    provenance=json.loads(division_source.with_suffix('.provenance.json').read_text())
    parity=json.loads((ROOT/'reports/oct25-original-libdivide-parity.json').read_text())
    header=ROOT/'factory-output/source-tree/eduke32-master'/provenance['source_header']
    source_hash=hashlib.sha256(header.read_bytes()).hexdigest()
    module_hash=hashlib.sha256(division_source.read_bytes()).hexdigest()
    if (provenance.get('format')!='original-header-js-provider/1'
            or provenance.get('source_header_sha256')!=source_hash
            or provenance.get('module_sha256')!=module_hash
            or parity.get('passed') is not True or not parity.get('original_header_compiled')
            or parity.get('source_header_sha256')!=source_hash or parity.get('module_sha256')!=module_hash
            or parity.get('native_node')!=parity.get('chromium')):
        raise RuntimeError('Original libdivide source/parity evidence does not match; rebuild and verify provider')
    division_exports=active_exports(division_source)
    required={'libdivide_'+kind+mode for kind in ('u32','s32','u64','s64') for mode in ('_do','_branchfree_do')}
    if set(provenance.get('exports',[]))!=required or not required<=division_exports:
        raise RuntimeError('Original libdivide provider exports are incomplete')
    shutil.copyfile(division_source,out/'browser-abi/libdivide_source.mjs')
    for symbol in required:host[symbol]='browser-abi/libdivide_source'

    # Exact original XXH3 source, with its own native/browser differential
    # evidence. Never replace the original checksum with a host approximation.
    checksum=ROOT/'runtime/xxhash_source.mjs'
    provenance=json.loads(checksum.with_suffix('.provenance.json').read_text())
    parity=json.loads((ROOT/'reports/oct27-original-xxhash-parity.json').read_text())
    header=ROOT/'factory-output/source-tree/eduke32-master'/provenance['source_header']
    module_hash=hashlib.sha256(checksum.read_bytes()).hexdigest()
    source_hash=hashlib.sha256(header.read_bytes()).hexdigest()
    if (provenance.get('format')!='original-header-js-provider/1'
            or provenance.get('exports')!=['XXH3_64bits']
            or provenance.get('module_sha256')!=module_hash
            or provenance.get('source_header_sha256')!=source_hash
            or parity.get('passed') is not True or parity.get('export')!='XXH3_64bits'
            or parity.get('module_sha256')!=module_hash
            or parity.get('source_header_sha256')!=source_hash
            or parity.get('native_node_cases',0)<272
            or parity.get('native_chromium_cases')!=parity.get('native_node_cases')
            or 'XXH3_64bits' not in active_exports(checksum)):
        raise RuntimeError('Original xxHash source/parity evidence does not match; rebuild and verify provider')
    shutil.copyfile(checksum,out/'browser-abi/xxhash_source.mjs')
    host['XXH3_64bits']='browser-abi/xxhash_source'

    # C++ Loguru's namespace-qualified printf logger has a different ABI
    # from libc math log(double). Export it under a type-qualified host name;
    # the compiler's exact Clang signature bridge selects the correct one.
    logger_source=ROOT/'runtime/browser_loguru.mjs'
    logger_target=out/'browser-abi/loguru_provider.mjs'
    if not logger_source.is_file():raise FileNotFoundError(logger_source)
    shutil.copyfile(logger_source,logger_target)
    # The logger consumes actual source byte pointers through this shared helper.
    shutil.copyfile(ROOT/'runtime/source_bytes.mjs',out/'browser-abi/source_bytes.mjs')
    shutil.copyfile(ROOT/'runtime/c_printf.mjs',out/'browser-abi/c_printf.mjs')
    if not re.search(r'^export function loguru_log\(',logger_target.read_text(),re.M):
        raise RuntimeError('No concrete browser Loguru implementation')
    host['loguru_log']='browser-abi/loguru_provider'

    # Never claim a source provider that cannot be found and exported.
    overlap=sorted(host.keys() & source.keys())
    index=dict(source);index.update(host)
    path=out/'browser-combined-symbol-owners.json'
    path.write_text(json.dumps(index,sort_keys=True,indent=2)+'\n')
    # Fragment installation checks the engine-side pointer ABI on host imports
    # too. These are executable runtime adapters, never Clang game definitions.
    for owner in sorted(set(host.values())):
        module=out/(owner+'.mjs')
        exports=sorted(name for name,provider in host.items() if provider==owner)
        if not set(exports)<=active_exports(module):raise RuntimeError('Missing host export '+owner)
        module.with_suffix('.manifest.json').write_text(json.dumps({
            'format':'browser-host-provider/1','source':None,
            'native_pointer_abi':'source-lp64-addresses/2','exports':exports,'definitions':[],
            'module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),
            'original_game_or_build_engine_implementation':False,
            'role':'verified-runtime-library-adapter','gameplay_verified':False},indent=2)+'\n')
    # Compiler forbids claiming symbols owned by the same translation unit.
    for source_unit in ['source/audiolib/src/driver_sdl.cpp']:
        local=out/('symbols-'+source_unit.replace('/','_')+'.json')
        local.write_text(json.dumps({name:owner for name,owner in index.items() if owner!=source_unit},sort_keys=True,indent=2)+'\n')
    entry=json.loads((snapshot/(entry_source+'.manifest.json')).read_text())
    main=next(d for d in entry['definitions'] if d.get('name')==entry_name)
    refs=set(main.get('unresolved_references',[]))
    result={'format':'eduke32-browser-source-closure/1','manifest_snapshot':str(snapshot),
        'entry_source':entry_source,'entry_name':entry_name,
        'browser_libc_symbols':len(c),'browser_sdl_symbols':len(sdl),
        'source_emitted_verified_owners':len(source),'ambiguous_original_owners':len(ambiguous),
        'browser_override_existing_emitted':overlap,
        'source_exports_shadowed_by_partial_modules':shadowed,
        'source_shadowed_count':len(shadowed),
        'combined_provider_count':len(index),'app_main_direct_missing_snapshot':len(refs),
        'app_main_direct_with_verified_providers':sorted(refs & index.keys()),
        'app_main_direct_still_unprovided':sorted(refs-index.keys()),
        'app_main_source_emitted':False,'original_gameplay_verified':False,
        'symbols_index':str(path.relative_to(ROOT)),
        'transitive_startup_dependency_audit':startup_graph(snapshot,index,entry_name),
        'warnings':['Untranslated game symbols remain blocked','Source snapshot may not reflect newest compiler','Passing source ownership does not prove a fully executable transitive dependency graph']}
    report_path.parent.mkdir(parents=True,exist_ok=True)
    report_path.write_text(json.dumps(result,indent=2)+'\n')
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--snapshot',type=Path,default=ROOT/'factory-output/source-first/force-recovered')
    p.add_argument('--entry-source',default='source/duke3d/src/game.cpp')
    p.add_argument('--entry',default='app_main')
    p.add_argument('--out',type=Path,default=ROOT/'factory-output/source-first/browser-target')
    p.add_argument('--report',type=Path,default=ROOT/'reports/browser-target/combined-closure.json')
    a=p.parse_args();r=build(a.snapshot.resolve(),a.out.resolve(),a.report.resolve(),a.entry_source,a.entry)
    print(json.dumps({k:r[k] if k!='app_main_direct_with_verified_providers' else len(r[k]) for k in ['browser_libc_symbols','browser_sdl_symbols','source_emitted_verified_owners','combined_provider_count','app_main_direct_with_verified_providers']},indent=2))
if __name__=='__main__':main()
