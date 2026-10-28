"""Native two-TU storage and linker parity for original header definitions.

Header EXTERN/definition owners must not be confused with declarations;
header-static globals in separate TUs must preserve independent storage.
"""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
ROOT=Path(__file__).resolve().parents[2]

def run(args,cwd,timeout=90):
    task=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=timeout)
    assert task.returncode==0,(args,task.stderr[-2600:],task.stdout[-1200:])
    return task.stdout

with tempfile.TemporaryDirectory(prefix='eduke_header_globals_') as scratch:
    # Keep immutable original inputs separate from linker-produced artifacts.
    # The content guard intentionally hashes every original input, including
    # non-header includes; writing linked outputs under that root is a real
    # input change and must not be "fixed" by weakening the guard.
    root=Path(scratch)/'original';root.mkdir()
    (root/'globals.hpp').write_text('''#ifdef OWNER
#define EXTERN
#else
#define EXTERN extern
#endif
EXTERN int shared_value;
static int private_value = 11;
''')
    (root/'owner.cpp').write_text('''#define OWNER
#include "globals.hpp"
extern "C" int update_shared(){ shared_value=23; return ++private_value; }
''')
    (root/'reader.cpp').write_text('''#include "globals.hpp"
extern "C" int read_shared(){ return shared_value + ++private_value; }
''')
    (root/'main.cpp').write_text('''#include <cstdio>
extern "C" int update_shared(); extern "C" int read_shared();
int main(){printf("%d,%d\\n",update_shared(),read_shared());}
''')
    run(['clang++','owner.cpp','reader.cpp','main.cpp','-o','native'],root)
    expected=run([str(root/'native')],root).strip()
    assert expected=='12,35',expected
    batches=Path(scratch)/'batches';batches.mkdir()
    batch_records=[]
    for i,source in enumerate(('owner.cpp','reader.cpp')):
        plan=root/f'plan{i}.json'
        plan.write_text(json.dumps({'root':str(root),'units':[{'source':source}]}))
        batch=batches/str(i)
        run([sys.executable,str(ROOT/'tools/source_first_project.py'),
             '--plan',str(plan),'--out-dir',str(batch)],root)
        manifest=json.loads((batch/source.replace('.cpp','.cpp.manifest.json')).read_text())
        status={d['source_name']:d for d in manifest['definitions']}
        local=status['private_value']
        assert local['status']=='source-first' and local['linkage']=='internal',local
        assert local['header_global_definition']['source_header']=='globals.hpp',local
        if source=='owner.cpp':
            shared=status['shared_value']
            assert shared['status']=='source-first' and shared['linkage']=='external',shared
        else:
            assert 'shared_value' not in status,'An extern declaration acquired ownership'
        batch_records.append({'status':'ok','manifest':str((batch/'project-build.json').relative_to(batches))})
    (batches/'recovery-report.json').write_text(json.dumps({
        'original_selected_units':2,'batch_results':batch_records}))
    linked=Path(scratch)/'linked'
    run([sys.executable,str(ROOT/'tools/source_first_global_link.py'),
         '--directory',str(batches),'--out',str(linked),
         '--source-root',str(root),'--jobs','1','--rounds','3'],root,timeout=150)
    result=json.loads((linked/'global-recovery.json').read_text())
    assert result['recovered_definitions']>=1,result
    assert not result['invalid_imports_or_syntax'],result
    (Path(scratch)/'entry.mjs').write_text('''import {update_shared} from './linked/owner.cpp.mjs';
import {read_shared} from './linked/reader.cpp.mjs';
console.log(`${update_shared()},${read_shared()}`);
''')
    actual=run(['node','entry.mjs'],Path(scratch)).strip()
    assert expected==actual,(expected,actual)
    print('PASS: native versus JS two-TU EXTERN ownership, shared global mutation, independent header-static lifetimes and global fixed-point link')
