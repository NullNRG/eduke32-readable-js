#!/usr/bin/env python3
"""Regenerate linked JS from previously compiled LLVM IR without rebuilding C/C++.

Requires compiler-diagnostics.json and every recorded .ll file. Reuses only
unmodified original LLVM IR artifacts from a prior full compilation.
"""
import argparse,json,pathlib,collections,sys,shutil
from whole_program import emit_modules

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--work',type=pathlib.Path,required=True)
    p.add_argument('--require-complete',action='store_true')
    a=p.parse_args();work=a.work.resolve();rows=json.loads((work/'compiler-diagnostics.json').read_text())
    missing=[r['source'] for r in rows if r['status']!='llvm_ir' or not r.get('llvm') or not (work/'llvm'/r['llvm']).exists()]
    if missing:raise SystemExit('Cannot relink: missing original LLVM IR: '+str(missing[:10]))
    before=json.loads((work/'SUMMARY.json').read_text())
    result=emit_modules(rows,work)
    summary={**before,'lowered_js_functions':result['lowered_function_count'],'lowering_blocked_functions':result['blocked_function_count'],
      'cross_file_unresolved_symbols':len(result['unresolved_symbols']),
      'lowered_functions_without_full_link_closure':len(set(result['unlinked_transitive_symbols']) & set(result['symbols_lowered'])),
      'actual_complete_build':False,'complete_engine_transpiled':False,'functional_js_game_port':False,
      'relink_note':'Re-linked all original IR files; did not recompile C/C++ translation units during this step.'}
    if before['translation_units_compilation_blocked']==0 and result['full_symbol_closure'] and not result['unlinked_transitive_symbols']:
      summary['actual_complete_build']=summary['complete_engine_transpiled']=True
    (work/'SUMMARY.json').write_text(json.dumps(summary,indent=2))
    (work/'symbol-link-report.json').write_text(json.dumps({k:v for k,v in result.items() if k!='modules'},indent=2))
    (work/'modules.json').write_text(json.dumps(result['modules'],indent=2))
    # Direct-call dependency reachability from the actual entry point and
    # static LLVM constructors. This is a lower bound: indirect calls, dynamic
    # dispatch, optional paths and function-pointer data tables can add edges.
    dependency_graph={name:set(deps) for m in result['modules'] for name,deps in m['function_dependencies'].items()}
    roots={'main'} | {c['name'] for c in result['llvm_global_constructors']}
    reachable=set();stack=list(roots)
    while stack:
        name=stack.pop()
        if name in reachable:continue
        reachable.add(name)
        stack.extend(dependency_graph.get(name,set())-reachable)
    missing=set(result['unresolved_symbols'])
    (work/'entry-dependency-audit.json').write_text(json.dumps({
        'entry':'main','roots':sorted(roots),
        'limitation':'Direct-call lower bound only; C/C++ indirect calls, address-taken function pointers, global relocation data and late dynamic dispatch are NOT proven unreachable.',
        'reachable_static_nodes':len(reachable),
        'missing_directly_reachable':sorted(reachable & missing),
        'missing_outside_observed_direct_call_graph':sorted(missing-reachable),
        'all_unresolved':sorted(missing)
    },indent=2))
    shutil.copytree(pathlib.Path(__file__).resolve().parents[1]/'runtime',work/'runtime',dirs_exist_ok=True)
    print(json.dumps(summary,indent=2))
    if a.require_complete and not summary['actual_complete_build']:sys.exit(2)
if __name__=='__main__':main()
