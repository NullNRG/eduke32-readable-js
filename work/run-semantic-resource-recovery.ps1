$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
$oldWorkspace = 'C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work'
Set-Location -LiteralPath $projectDirectory
$env:PYTHONPATH = Join-Path $oldWorkspace 'libclang-python'
$env:EDUKE32_CLANG = Join-Path $oldWorkspace 'toolchains\llvm-mingw-20261006-ucrt-x86_64\bin\clang.exe'
$env:EDUKE32_CLANGXX = Join-Path $oldWorkspace 'toolchains\llvm-mingw-20261006-ucrt-x86_64\bin\clang++.exe'
$env:EDUKE32_SYSROOT = Join-Path $oldWorkspace 'toolchains\linux-sysroot'
$env:EDUKE32_LIBCLANG_RESOURCE_DIR = Join-Path $projectDirectory 'work\dependencies\libclang-resources\usr\lib\llvm-18\lib\clang\18'
$env:PYTHONUTF8 = '1'
$started = [DateTimeOffset]::UtcNow.ToString('o')
& C:\Python314\python.exe tools/source_semantic_index.py --resume
$result = $LASTEXITCODE
@{command='python tools/source_semantic_index.py --resume'; exit_code=$result;
  started_utc=$started; finished_utc=[DateTimeOffset]::UtcNow.ToString('o');
  index='reports/semantic-index.sqlite'; summary='reports/semantic-index.summary.json';
  zero_exit_is_not_complete_semantic_extraction=$true} | ConvertTo-Json | Set-Content -LiteralPath 'reports\semantic-resource-recovery-result.json' -Encoding utf8
exit $result
