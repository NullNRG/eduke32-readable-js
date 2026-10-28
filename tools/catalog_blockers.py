#!/usr/bin/env python3
"""Group all unsupported LLVM functions and external symbols into root-cause families.

Keeps every original function, source path, error, and missing symbol in machine-
readable JSON. The Markdown catalog has ONE numbered list rather than copying
hundreds of duplicate compiler diagnostics into the main handoff.
"""
import argparse,collections,json,pathlib,re

def lowering(error):
    e=error
    if e.startswith('varargs function ABI'):return 'Variadic C and C++ function definitions/va_list ABI'
    if e.startswith('indirect/unsupported call'):
        if ' asm ' in e:return 'x86 inline assembly and multi-register return ABI'
        if re.search(r'call (?:fastcc )?<\d+ x ',e):return 'Vector-valued function returns'
        if re.search(r'call (?:fastcc )?\{',e):return 'Aggregate-valued function returns'
        if 'llvm.assume' in e:return 'LLVM operand-bundle call metadata'
        return 'Other unsupported call signatures'
    if e.startswith('unsupported call argument: metadata'):return 'Compile-time debug/alias metadata arguments'
    if e.startswith('unsupported call argument'):return 'Unrecognized call argument ABI'
    if e.startswith('bit width '):return 'Nonstandard integer widths and 128-bit operations'
    if e.startswith('instruction: fence'):return 'Thread fences and memory ordering'
    if e.startswith('instruction:'):return 'Standalone LLVM instruction forms'
    if e.startswith('unsupported opcode: insertvalue'):return 'LLVM aggregate insert/extract operations'
    if e.startswith('unsupported opcode: select'):return 'Vector conditional selection'
    if e.startswith('unsupported opcode:'):return 'Remaining unsupported LLVM opcodes'
    if e.startswith(('unsupported operand poison','poison incoming PHI','unsupported operand undef')):return 'LLVM poison/undef semantics'
    if e.startswith(('unsupported operand getelementptr','unsupported operand ptrtoint')):return 'Nested pointer/GEP constant expressions'
    if e.startswith('missing IR type layout'):return 'Named C++ aggregate/type layouts'
    if e.startswith('unsupported IR type layout'):return 'Other aggregate/vector type layouts'
    if e.startswith('phi operands'):return 'PHI control-flow merges'
    if e.startswith('store:'):return 'Volatile stores/memory operations'
    if e.startswith('argument ABI'):return 'Function entry argument ABI'
    if e.startswith('aggregate insertvalue'):return 'LLVM aggregate insert/extract operations'
    if e.startswith('unsupported vector value'):return 'LLVM vector operand handling'
    return 'Miscellaneous LLVM lowering blockers'

def linking(s):
    if s.startswith('SDL_'):return 'SDL2 video, input, audio, controllers, threading'
    if s.startswith('llvm.'):return 'LLVM runtime intrinsics'
    if s.startswith('FLAC__'):return 'FLAC audio decoder API'
    if s.startswith('LZ4_'):return 'LZ4 compression API'
    if s.startswith(('_mi_','mi_')):return 'mimalloc allocator and statistics'
    if s.startswith(('_ZN6loguru','_ZNK6loguru')):return 'loguru logging library'
    if s.startswith(('_ZN5ImGui','_ZNK5ImGui','_Z5ImGui')):return 'ImGui user-interface functions'
    if s.startswith(('_ZNSt','_ZSt','_ZNKSt','_Zdl','_Zda','_Znwm','_Znaj','_ZTV','_ZTI','_ZTS','__cxa','__gxx','_Unwind')):return 'C++ standard library, exceptions, RTTI and ABI'
    if s.startswith('_Z'):return 'Other mangled C++ engine functions'
    if s.startswith(('A_','G_','M_','VM_')):return 'Original Duke engine gameplay/renderer functions'
    if s.startswith(('_mi_','mi_')):return 'mimalloc allocator and statistics'
    if s.startswith(('flac','vorbis','op_','ov_','xmp_','FMOD','SF_')):return 'Other audio codec functions'
    if s.startswith(('pthread','thrd_','mtx_','cnd_','sem_','fork','dlopen','dlsym','mmap','mprotect','syscall','open','close','read','write','fstat','access','stat','pipe')):return 'POSIX filesystem/OS/thread functions'
    return 'Other C runtime, memory, platform and engine externals'

def summary(report,catfn,key,is_functions=False):
    d=collections.defaultdict(list)
    for item in report[key]:
        cat=catfn(item['error']) if is_functions else catfn(item)
        d[cat].append(item)
    return d

def build(now,baseline=None):
    all_groups=[]
    for domain,fn,key,isf in [('lowering',lowering,'unsupported_functions',True),('linking',linking,'unresolved_symbols',False)]:
        current=summary(now,fn,key,isf)
        previous=summary(baseline,fn,key,isf) if baseline else {}
        names=sorted(set(current)|set(previous),key=lambda n:(-len(previous.get(n,[])),n))
        for cat in names:
            cur=current.get(cat,[]);prev=previous.get(cat,[])
            all_groups.append({'domain':domain,'category':cat,'baseline_count':len(prev) if baseline else None,
                'remaining_count':len(cur),'change_since_baseline':len(cur)-len(prev) if baseline else None,
                'affected':cur,'samples':cur[:5]})
    meta={'format':'eduke-dedup-blockers/1',
        'baseline':{'blocked_functions':len(baseline['unsupported_functions']),'unresolved_symbols':len(baseline['unresolved_symbols'])} if baseline else None,
        'current':{'blocked_functions':len(now['unsupported_functions']),'unresolved_symbols':len(now['unresolved_symbols']),
           'generated_js_functions':now['lowered_function_count'],
           'lowered_functions_without_link_closure':len(set(now['unlinked_transitive_symbols']) & set(now['symbols_lowered']))},
        'group_count':len(all_groups), 'catalog':all_groups,
        'caveat':'Function and symbol counts are distinct diagnostics, may reflect one dependency; syntax lowering is not behavioral equivalence or a playable engine.'}
    return meta

def main():
    p=argparse.ArgumentParser();p.add_argument('--report',required=True,type=pathlib.Path)
    p.add_argument('--baseline',type=pathlib.Path)
    p.add_argument('--baseline-catalog',type=pathlib.Path,help='Preserve deduplicated historical category counts')
    p.add_argument('--out',required=True,type=pathlib.Path)
    args=p.parse_args();now=json.loads(args.report.read_text());old=json.loads(args.baseline.read_text()) if args.baseline else None
    obj=build(now,old)
    if args.baseline_catalog:
        historical=json.loads(args.baseline_catalog.read_text())
        obj['baseline']=historical['baseline']
        previous={(g['domain'],g['category']):g['baseline_count'] for g in historical['catalog']}
        current={(g['domain'],g['category']):g for g in obj['catalog']}
        for key,count in previous.items():
            if key not in current:
                g={'domain':key[0],'category':key[1],'baseline_count':count,
                   'remaining_count':0,'change_since_baseline':-count,'affected':[],'samples':[]}
                obj['catalog'].append(g)
            else:
                g=current[key];g['baseline_count']=count;g['change_since_baseline']=g['remaining_count']-count
        obj['catalog'].sort(key=lambda g:(0 if g['domain']=='lowering' else 1,-(g['baseline_count'] or 0),g['category']))
        obj['group_count']=len(obj['catalog'])
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(obj,indent=2))
    md=['# EDuke32 — single deduplicated blocker catalog','',
        f"Current: **{obj['current']['blocked_functions']} blocked LLVM functions**, **{obj['current']['unresolved_symbols']} missing symbols**, **{obj['current']['generated_js_functions']} emitted JS bodies**.",
        f"Baseline: {obj['baseline']}" if obj['baseline'] else 'No baseline supplied.',
        '','The two error inventories can overlap. Categories group recurring causes, not independent patches.','']
    for i,g in enumerate(obj['catalog'],1):
        prefix='Compiler' if g['domain']=='lowering' else 'Linker'
        delta=f"; baseline {g['baseline_count']}, delta {g['change_since_baseline']:+d}" if obj['baseline'] else ''
        md.append(f"{i}. **{prefix}: {g['category']}** — {g['remaining_count']} remaining{delta}.")
    md.extend(['','The JSON alongside this Markdown preserves **every** affected function, source file, exact compiler error, and unresolved linker symbol.','',
               '**Build status:** Incomplete. This file does not demonstrate a source-compiled playable Duke Nukem 3D.'])
    args.out.with_suffix('.md').write_text('\n'.join(md)+'\n')
    print(json.dumps({'groups':len(obj['catalog']),'current':obj['current']},indent=2))
if __name__=='__main__':main()
