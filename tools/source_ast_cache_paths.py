"""Persistent full-fingerprint AST cache roots that fit Windows path limits."""
import hashlib,json,os,subprocess
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]

def make_dependency_paths(text):
    """Decode Clang Make dependency escaping, without treating paths as shell."""
    text=text.replace('\\\n','')
    target,separator,body=text.partition(':')
    if not separator or target.strip()!='__sourcefactory_ast_deps__':
        raise ValueError('Unexpected Clang dependency target')
    words=[];word=[];index=0
    while index<len(body):
        char=body[index]
        if char=='\\' and index+1<len(body) and body[index+1] in ' \\#:\t':
            word.append(body[index+1]);index+=2;continue
        if char=='$' and index+1<len(body) and body[index+1]=='$':
            word.append('$');index+=2;continue
        if char.isspace():
            if word:words.append(''.join(word));word=[]
        else:word.append(char)
        index+=1
    if word:words.append(''.join(word))
    if not words:raise ValueError('Clang dependency output contains no original inputs')
    return words

def source_ast_input_fingerprint(root,frontend,language,arguments,source):
    """Attest every actual include, source byte, flag and extraction toolchain.

    A reusable caller-supplied cache directory is not an ownership proof.
    Clang's preprocessor discovers dependencies even with unusual extensions,
    outside the source root, and through target system headers. Hash contents,
    not mtimes; unchanged emitter code does not make changed headers reusable.
    """
    from source_first_toolchain import fingerprint_toolchain
    root=Path(root).resolve()
    command=[frontend,*language,'-M','-MT','__sourcefactory_ast_deps__',*arguments,source]
    result=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=60)
    if result.returncode:raise RuntimeError('Clang AST dependency extraction failed:\n'+result.stderr[-5000:])
    files=set()
    for name in make_dependency_paths(result.stdout):
        path=Path(name);path=(path if path.is_absolute() else root/path).resolve()
        if not path.is_file():raise ValueError('Missing original Clang input: '+str(path))
        files.add(path)
    original=(root/source).resolve()
    if original not in files:raise ValueError('Clang dependency graph omitted original translation unit')
    digest=hashlib.sha256(b'source-ast-clang-dependencies/1\0')
    digest.update(json.dumps([str(root),frontend,language,arguments,source],sort_keys=True).encode())
    fingerprint_toolchain(digest)
    for path in sorted(files):
        data=path.read_bytes();name=str(path).encode()
        digest.update(len(name).to_bytes(8,'little'));digest.update(name)
        digest.update(len(data).to_bytes(8,'little'));digest.update(data)
    return {'format':'source-ast-clang-dependencies/1','sha256':digest.hexdigest(),
            'dependency_count':len(files),'preprocessor_verified':True,'content_hashes_not_mtimes':True}


def persistent_ast_cache_directory(output, epoch, *, workspace=ROOT, windows=None):
    if not re.fullmatch('[0-9a-f]{64}',epoch):
        raise ValueError('AST semantic epoch must retain its complete SHA-256 identity')
    preferred=Path(output)/'clang-ast-cache'/epoch
    if windows is None:windows=os.name=='nt'
    # Reserve the longest source compiler key plus its retention marker.
    # Some supported Windows installations still reject names beyond MAX_PATH.
    # Keeping the full epoch/key is essential; shorten directories, not hashes.
    def fits(directory):
        marker=directory/'shard-00'/('.ast-lru-full-types-'+'f'*64+'.json.gz')
        return len(str(marker.resolve()))<=250
    if not windows or fits(preferred):return preferred
    compact=Path(workspace)/'work/ast'/epoch
    if fits(compact):return compact
    local=os.environ.get('LOCALAPPDATA')
    if local:
        compact=Path(local)/'EDuke32SourceFactory/ast'/epoch
        if fits(compact):return compact
    raise ValueError('No persistent AST cache root fits Windows file paths; use a shorter workspace path')
