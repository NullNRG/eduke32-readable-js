"""Extract finalized native layouts without prematurely freezing packed records.

Clang's complete-dump mode can compute a record before trailing attributes
are parsed, changing even alignof in that compiler invocation. Use a fresh
normal finalized debug-type code-generation pass instead. A syntax-only
used-type retry remains
available when code generation itself is unavailable. Missing layouts block
storage emission; none are inferred from field sizes.
"""
import hashlib,os,subprocess

REVISION='source-finalized-native-record-layouts/2'

def extract(frontend,language,arguments,source,root,timeout=45):
    attempts=[]
    for phase,flags in [('codegen',['-S','-emit-llvm','-femit-all-decls','-o',os.devnull]),
                        ('syntax',['-fsyntax-only'])]:
        mode='-fdump-record-layouts'
        # Finalized debug type emission requests layouts even when an original
        # unit only stores pointers to a type. It runs after parsing trailing
        # attributes and does not rewrite/include the source in another TU.
        debug_types=['-g','-fstandalone-debug','-fno-eliminate-unused-debug-types'] if phase=='codegen' else []
        result=subprocess.run([frontend,*language,'-Xclang',mode,*flags,*arguments,*debug_types,source],
            cwd=root,capture_output=True,text=True,timeout=timeout)
        attempts.append({'mode':mode,'phase':phase,'revision':REVISION,'returncode':result.returncode,
            'stdout_sha256':hashlib.sha256(result.stdout.encode()).hexdigest(),
            'stderr_sha256':hashlib.sha256(result.stderr.encode()).hexdigest()})
        result.layout_attempts=attempts
        if result.returncode==0:return result
    return result
