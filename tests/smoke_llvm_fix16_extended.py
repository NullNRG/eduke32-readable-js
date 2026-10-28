#!/usr/bin/env python3
"""Compare Clang LLVM-to-JS lowering against the actual EDuke32 native library.

This validates REAL original C++ implementations, including overflow/rounding.
Native binary is compiled on the fly; no reference values are fabricated.
"""
import ctypes, json, os, pathlib, random, shutil, subprocess, sys, tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=pathlib.Path(os.environ.get('EDUKE_SOURCE_ROOT', ROOT.parent/'eduke32-master'))
JS=pathlib.Path(os.environ.get('EDUKE_COMPILED_JS', ROOT/'web'/'compiled_engine_crc32.js'))
SYMBOLS=['fix16_mul','fix16_smul','fix16_lerp8','fix16_lerp16','fix16_lerp32']

def main():
    compiler=shutil.which('clang++')
    if not compiler:raise RuntimeError('clang++ missing: native oracle required')
    with tempfile.TemporaryDirectory(prefix='eduke_native_oracle_') as d:
        so=pathlib.Path(d)/'native.so'
        subprocess.run([compiler,'-std=c++17','-Wno-c++11-narrowing','-O1','-fPIC','-shared',str(SOURCE/'source/build/src/fix16.cpp'),'-I',str(SOURCE/'source/build/include'),'-o',str(so)],check=True,capture_output=True,text=True)
        lib=ctypes.CDLL(str(so))
        rng=random.Random(0xED32)
        boundaries=[-2147483648,-2147483647,-1073741824,-65536,-32768,-1,0,1,32767,32768,65535,65536,131072,1073741823,2147483647]
        vectors=[]
        for i in range(1400):
            a=rng.randint(-2147483648,2147483647) if i%3 else rng.choice(boundaries)
            b=rng.randint(-2147483648,2147483647) if i%3 else rng.choice(boundaries)
            c=rng.getrandbits(32) if i%3 else rng.choice([0,1,255,256,65535,65536,2147483647,4294967295])
            vectors.append([a,b,c])
        native=[]
        for sym in SYMBOLS:
            f=getattr(lib,sym)
            f.restype=ctypes.c_int32
            f.argtypes=[ctypes.c_int32,ctypes.c_int32]+([ctypes.c_uint8] if sym=='fix16_lerp8' else [ctypes.c_uint16] if sym=='fix16_lerp16' else [ctypes.c_uint32] if sym=='fix16_lerp32' else [])
            native.append([f(a,b,c) if 'lerp' in sym else f(a,b) for a,b,c in vectors])
        node_script='''const vm=require('vm'),fs=require('fs');const src=fs.readFileSync(process.argv[1],'utf8');const engine=vm.runInNewContext(src+'\\nEDukeSourceIR;');const {symbols,vectors}=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(symbols.map(k=>vectors.map(([a,b,c])=>k.includes('lerp')?engine[k](a,b,c)|0:engine[k](a,b)|0))));'''
        node=subprocess.run(['node','-e',node_script,str(JS)],input=json.dumps({'symbols':SYMBOLS,'vectors':vectors}),capture_output=True,text=True)
        if node.returncode:raise AssertionError('Node failed: '+node.stderr[-3000:])
        js=json.loads(node.stdout)
        for k,name in enumerate(SYMBOLS):
            for i,(a,b) in enumerate(zip(native[k],js[k])):
                if a!=b:raise AssertionError(f'Native/JS mismatch {name} vector#{i} {vectors[i]}: native={a} JS={b}')
        print('EDuke32 fixed-point LLVM-to-JS native C++ parity PASS', len(SYMBOLS)*len(vectors),'assertions across',len(SYMBOLS),'original functions')
if __name__=='__main__':main()
