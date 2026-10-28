param(
    [string]$ToolchainDirectory,
    [string]$SysrootDirectory,
    [string]$PythonPackagesDirectory,
    [switch]$SetupOnly
)
$ErrorActionPreference = 'Stop'
$projectDirectory = [IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
if ($projectDirectory.Length -gt 90) {
    throw 'Extract the canonical project to a short path (for example C:\Codex\EDuke32) before building. Generated original-source paths exceed the Windows 260-character limit at longer roots.'
}
Set-Location -LiteralPath $projectDirectory
$pythonCommand = Get-Command python -ErrorAction Stop
$pythonExecutable = (& $pythonCommand.Source -c 'import sys; print(sys.executable)')
if ($LASTEXITCODE -ne 0) { throw 'A working Python installation is required.' }
$dependencyDirectory = Join-Path $projectDirectory 'work\dependencies'
New-Item -ItemType Directory -Path $dependencyDirectory -Force | Out-Null
if (-not $ToolchainDirectory) {
    $ToolchainDirectory = Join-Path $dependencyDirectory 'llvm-mingw-20261006-ucrt-x86_64'
    if (-not (Test-Path -LiteralPath (Join-Path $ToolchainDirectory 'bin\clang++.exe'))) {
        $downloadPath = Join-Path $dependencyDirectory 'llvm-mingw-20261006-ucrt-x86_64.zip'
        $archiveUrl = 'https://github.com/mstorsjo/llvm-mingw/releases/download/20261006/llvm-mingw-20261006-ucrt-x86_64.zip'
        & curl.exe -L --fail --retry 2 --output $downloadPath $archiveUrl
        if ($LASTEXITCODE -ne 0) { throw 'LLVM toolchain download failed.' }
        $expectedHash = '317492C456AA27EE607A5919F1D2D38DCDC1112516A24D0BF4B00D078F52D17A'
        if ((Get-FileHash -LiteralPath $downloadPath -Algorithm SHA256).Hash -ne $expectedHash) {
            throw 'LLVM toolchain SHA256 differs from the verified checkpoint.'
        }
        & $pythonExecutable -m zipfile -e $downloadPath $dependencyDirectory
        if ($LASTEXITCODE -ne 0) { throw 'LLVM toolchain extraction failed.' }
    }
}
if (-not $SysrootDirectory) {
    $SysrootDirectory = Join-Path $dependencyDirectory 'linux-sysroot'
    if (-not (Test-Path -LiteralPath (Join-Path $SysrootDirectory 'sysroot-manifest.json'))) {
        & $pythonExecutable tools/bootstrap_linux_sysroot.py --out $SysrootDirectory --manifest tools/sysroot-lock.json
        if ($LASTEXITCODE -ne 0) { throw 'Linux development sysroot setup failed.' }
    }
}
if (-not $PythonPackagesDirectory) {
    $PythonPackagesDirectory = Join-Path $dependencyDirectory 'python'
}
& $pythonExecutable -c 'import sys; sys.path.insert(0,sys.argv[1]); import ijson; from clang import cindex; assert ijson.__version__ == "3.6.0"' $PythonPackagesDirectory 2>$null
if ($LASTEXITCODE -ne 0) {
    & $pythonExecutable -m pip install --upgrade --target $PythonPackagesDirectory -r dev-requirements.txt
    if ($LASTEXITCODE -ne 0) { throw 'Python semantic-extraction/streaming dependency setup failed.' }
}
$libclangResourcesDirectory = Join-Path $dependencyDirectory 'libclang-resources'
$libclangResourcePath = Join-Path $libclangResourcesDirectory 'usr\lib\llvm-18\lib\clang\18'
if (-not (Test-Path -LiteralPath (Join-Path $libclangResourcePath 'resource-manifest.json'))) {
    & $pythonExecutable tools/bootstrap_libclang_resources.py --out $libclangResourcesDirectory --manifest tools/libclang-resource-lock.json
    if ($LASTEXITCODE -ne 0) { throw 'Matching libclang builtin header setup failed.' }
}
$env:EDUKE32_LIBCLANG_RESOURCE_DIR = [IO.Path]::GetFullPath($libclangResourcePath)
$env:PATH = (Join-Path ([IO.Path]::GetFullPath($ToolchainDirectory)) 'bin') + [IO.Path]::PathSeparator + $env:PATH
$env:EDUKE32_SYSROOT = [IO.Path]::GetFullPath($SysrootDirectory)
$env:EDUKE32_PYTHON_PACKAGES = [IO.Path]::GetFullPath($PythonPackagesDirectory)
$env:PYTHONPATH = $env:EDUKE32_PYTHON_PACKAGES + [IO.Path]::PathSeparator + $env:PYTHONPATH
$env:PYTHON = $pythonExecutable
$env:PYTHONUTF8 = '1'
& $pythonExecutable -c 'import sys; from clang import cindex; sys.path.insert(0,"tools"); from source_first_toolchain import target_attestation; from source_semantic_index import extraction_resource_config; print(target_attestation()["abi"]); print(extraction_resource_config(cindex)); print("libclang bindings and matching resources ready")'
if ($LASTEXITCODE -ne 0) { throw 'Compiler ABI or semantic extractor dependency check failed.' }
if ($SetupOnly) { exit 0 }
& npm.cmd run compile:game
exit $LASTEXITCODE
