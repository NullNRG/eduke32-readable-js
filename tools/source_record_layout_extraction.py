"""Retry actual used-type ABI dumps when an older Clang complete dump fails.

Both strategies ask the same target compiler for offsets and sizes. Missing
records remain missing; no source type, padding or alignment is inferred.
"""
import hashlib,subprocess

def extract(frontend,language,arguments,source,root,timeout=45):
    attempts=[]
    for mode in ('-fdump-record-layouts-complete','-fdump-record-layouts'):
        result=subprocess.run([frontend,*language,'-Xclang',mode,'-fsyntax-only',*arguments,source],
            cwd=root,capture_output=True,text=True,timeout=timeout)
        attempts.append({'mode':mode,'returncode':result.returncode,
            'stdout_sha256':hashlib.sha256(result.stdout.encode()).hexdigest(),
            'stderr_sha256':hashlib.sha256(result.stderr.encode()).hexdigest()})
        result.layout_attempts=attempts
        if result.returncode==0:return result
    return result
