$env:PATH='C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\llvm-mingw-20261006-ucrt-x86_64\bin;'+$env:PATH
$env:EDUKE32_SYSROOT='C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot'
$env:EDUKE32_PYTHON_PACKAGES='C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\libclang-python'
$env:PYTHONPATH=$env:EDUKE32_PYTHON_PACKAGES
if (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'dependencies/browser-python')) {
    $env:PYTHONPATH=$env:PYTHONPATH+';'+(Join-Path $PSScriptRoot 'dependencies/browser-python')
}
$env:EDUKE_CHROMIUM_EXECUTABLE='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$env:EDUKE32_LIBCLANG_RESOURCE_DIR=Join-Path $PSScriptRoot 'dependencies/libclang-resources/usr/lib/llvm-18/lib/clang/18'
$env:PYTHONUTF8='1'
if (-not $env:EDUKE32_AST_CACHE_MAX_BYTES) { $env:EDUKE32_AST_CACHE_MAX_BYTES='134217728' }
