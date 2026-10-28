$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath('C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable')
$outputRoot=Join-Path $taskRoot 'outputs'
$canonicalRoot=Split-Path -Parent $PSScriptRoot
$keep=Join-Path $outputRoot 'EDuke32_SourceFactory_Continuation_2026-10-19_References_Heap.zip'
if ((Get-FileHash -LiteralPath $keep -Algorithm SHA256).Hash.ToLowerInvariant() -ne 'e5948106fc9b7e9a6accba1d501239aa422ebe436646ebe2c598596c55c102c5') { throw 'Retained checkpoint differs from its verified hash' }
$names=@(
 'EDuke32_Clean_Fresh_Start.zip',
 'EDuke32_Continue_Current_Work - Copy.zip',
 'EDuke32_Continue_Current_Work.zip',
 'EDuke32_SourceFactory_Continuation_2026-10-15_EntryAttempt.zip',
 'EDuke32_SourceFactory_Continuation_2026-10-15_HeapPointer.zip',
 'EDuke32_SourceFactory_Continuation_2026-10-15_Updated.zip',
 'EDuke32_SourceFactory_Continuation_2026-10-15.zip',
 'EDuke32_SourceFactory_Continuation_2026-10-16_ArrayStorage.zip',
 'EDuke32_JS_Original_Entry_Attempt_2026-10-15.html'
)
$paths=@($names | ForEach-Object {Join-Path $outputRoot $_})
$compilerZip=Join-Path $taskRoot 'work/toolchains/llvm-mingw.zip'
$compilerExe=Join-Path $taskRoot 'work/toolchains/llvm-mingw-20261006-ucrt-x86_64/bin/clang++.exe'
if (Test-Path -LiteralPath $compilerExe) { $paths += $compilerZip }
$records=@()
foreach ($candidate in $paths) {
 if (-not (Test-Path -LiteralPath $candidate)) { continue }
 $resolved=(Resolve-Path -LiteralPath $candidate).Path
 if (-not $resolved.StartsWith($taskRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Cleanup target escaped task workspace' }
 $item=Get-Item -LiteralPath $resolved
 if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Only explicitly named regular files may be removed' }
 $records += @{path=$resolved;bytes=$item.Length;sha256=(Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash.ToLowerInvariant();reason='Superseded generated export or extracted compiler download'}
}
$report=@{format='superseded-project-exports-cleanup/1';retained_verified_zip=$keep;removed_bytes=($records | Measure-Object -Property bytes -Sum).Sum;files=$records;completed=$false}
$reportPath=Join-Path $canonicalRoot 'reports/oct21-export-cleanup.json'
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $reportPath -Encoding utf8
foreach ($record in $records) { Remove-Item -LiteralPath $record.path -Force }
$report.completed=$true
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $reportPath -Encoding utf8
$report | Select-Object removed_bytes,completed,retained_verified_zip | ConvertTo-Json
