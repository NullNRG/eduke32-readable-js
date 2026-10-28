$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$source = Join-Path $project 'work\native-oracle\eduke32-master'
$build = Get-Content -LiteralPath (Join-Path $project 'reports\native-engine-build.json') -Raw | ConvertFrom-Json
if ($build.status -ne 'built') { throw 'Native executable build must succeed before smoke verification.' }
$stdout = Join-Path $project 'reports\native-engine-help.stdout.log'
$stderr = Join-Path $project 'reports\native-engine-help.stderr.log'
$started = [DateTime]::UtcNow
$process = Start-Process -FilePath (Join-Path $source 'eduke32.exe') -ArgumentList @('-usecwd','--help') -WorkingDirectory $source -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
$completed = $process.WaitForExit(30000)
if (-not $completed) { Stop-Process -Id $process.Id -Force }
$out = if (Test-Path -LiteralPath $stdout) { Get-Content -LiteralPath $stdout -Raw } else { '' }
$err = if (Test-Path -LiteralPath $stderr) { Get-Content -LiteralPath $stderr -Raw } else { '' }
$report = [ordered]@{
  startedAt = $started.ToString('o')
  finishedAt = [DateTime]::UtcNow.ToString('o')
  command = @('eduke32.exe','-usecwd','--help')
  workingDirectory = $source
  timedOut = -not $completed
  exitCode = if ($completed) { $process.ExitCode } else { $null }
  usageObserved = (($out + $err) -match 'Usage: eduke32')
  passed = ($completed -and $process.ExitCode -eq 0 -and (($out + $err) -match 'Usage: eduke32'))
  stdout = 'reports/native-engine-help.stdout.log'
  stderr = 'reports/native-engine-help.stderr.log'
  verifies = 'Original native executable can run its original command-line parser and cleanly exit; this is not gameplay or native/JavaScript parity verification.'
}
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $project 'reports\native-engine-smoke.json') -Encoding utf8
$report | ConvertTo-Json -Depth 8
