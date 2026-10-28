#!/usr/bin/env python3
"""Original C and C++ va_list lowering: native executable versus emitted JS."""
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sources=['tests/source_factory/source_first_variadic_fixture.c',
         'tests/source_factory/source_first_variadic_cpp_fixture.cpp']
with tempfile.TemporaryDirectory(prefix='eduke_variadic_native_') as tmp:
    tmp=Path(tmp)
    out=[]
    for src in sources:
        proc=subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',src,'--out-dir',str(tmp)],cwd=ROOT,capture_output=True,text=True,timeout=110)
        assert proc.returncode==0,proc.stderr[-2000:]
        mod=tmp/(src+'.mjs')
        manifest=json.loads(mod.with_suffix('.manifest.json').read_text())
        assert manifest['blocked']==0 and manifest['emitted']>=2,manifest
        text=mod.read_text()
        assert 'cVariadic.start' in text and 'cVariadic.next' in text and 'cVariadic.end' in text
        assert '...__cxx_varargs' in text
        check=subprocess.run(['node','--check',str(mod)],capture_output=True,text=True,timeout=10)
        assert check.returncode==0,check.stderr
        out.append(mod)
    # 128 reproducible runtime signatures per backend, covering n=1..8,
    # negative values, mixed signs, independent va_copy cursor and promoted
    # int varargs. Every result is computed by the original C/C++ source.
    calls=[]
    for i in range(128):
        n=i%8+1
        args=[((i*4381+j*9973+37)%22000)-11000 for j in range(n)]
        calls.append([n,*args])
    native=tmp/'native_driver.cpp'
    native.write_text('''#include <cstdio>\nextern "C" int va_total(int,...),va_copy_check(int,...),va_cpp_total(int,...),va_cpp_copy(int,...);\nint main(){\n'''+''.join(
        'std::printf("%d,%d,%d,%d\\n",va_total({0}),va_copy_check({0}),va_cpp_total({0}),va_cpp_copy({0}));\n'.format(','.join(map(str,call)))
        for call in calls)+ '}\n')
    exe=tmp/'native'
    cobject=tmp/'native_c.o'
    cc=subprocess.run(['clang','-std=c11','-c',str(ROOT/sources[0]),'-o',str(cobject)],capture_output=True,text=True,timeout=20)
    assert cc.returncode==0,cc.stderr
    build=subprocess.run(['clang++','-std=c++17',str(cobject),str(ROOT/sources[1]),str(native),'-o',str(exe)],capture_output=True,text=True,timeout=30)
    assert build.returncode==0,build.stderr
    expected=subprocess.run([str(exe)],capture_output=True,text=True,timeout=10)
    assert expected.returncode==0,expected.stderr
    entry=tmp/'driver.mjs'
    entry.write_text('import {va_total,va_copy_check} from '+json.dumps(out[0].as_uri())+';\n'
                     +'import {va_cpp_total,va_cpp_copy} from '+json.dumps(out[1].as_uri())+';\n'
                     +'const calls='+json.dumps(calls)+';\n'
                     +'for(const args of calls)console.log([va_total(...args),va_copy_check(...args),va_cpp_total(...args),va_cpp_copy(...args)].join(","));\n')
    result=subprocess.run(['node',str(entry)],capture_output=True,text=True,timeout=15)
    assert result.returncode==0,result.stderr
    a=expected.stdout.splitlines();b=result.stdout.splitlines()
    assert len(a)==len(b)==128
    for i,(want,got) in enumerate(zip(a,b)):
        assert want==got,(i,want,got)
    guard=tmp/'guard.mjs'
    guard.write_text((ROOT/'tools/source_variadic_runtime.mjs').read_text()+'''
const fail = fn => {let ok=false;try{fn()}catch(err){ok=err instanceof TypeError || err instanceof RangeError;}if(!ok)throw Error('missing va_list failure guard');};
const ap=cVariadic.empty();fail(()=>cVariadic.next(ap));
cVariadic.start(ap,[1,2]);if(cVariadic.next(ap)!==1)throw Error('va_arg order');
const copy=cVariadic.empty();cVariadic.copy(copy,ap);if(cVariadic.next(copy)!==2)throw Error('va_copy lost cursor');
cVariadic.end(copy);cVariadic.end(ap);fail(()=>cVariadic.next(ap));fail(()=>cVariadic.end(ap));
''')
    gp=subprocess.run(['node',str(guard)],capture_output=True,text=True,timeout=10)
    assert gp.returncode==0,gp.stderr
print('PASS: 512 original C/C++ variadic source-to-JS parity results plus cursor lifetime/overread guards')
