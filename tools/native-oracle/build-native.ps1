$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$nativeWorkspace = Join-Path $project 'work/native-oracle'
$source = Join-Path $project 'work\native-oracle\eduke32-master'
$toolchain = if ($env:EDUKE32_NATIVE_TOOLCHAIN) { $env:EDUKE32_NATIVE_TOOLCHAIN } else { 'C:\Users\andre\AppData\Local\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.MCF.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin' }
$env:PATH = $toolchain + ';' + $env:PATH
$make = Join-Path $toolchain 'mingw32-make.exe'
$arguments = @('-j1', 'eduke32.exe', 'NOASM=1', 'OPTLEVEL=0', 'LTO=0', 'PRETTY_OUTPUT=0')
$flacLibrary = Join-Path $nativeWorkspace 'flac-ucrt/lib/libFLAC.a'
if (-not (Test-Path -LiteralPath $source)) {
  New-Item -ItemType Directory -Force -Path $nativeWorkspace | Out-Null
  Expand-Archive -LiteralPath (Join-Path $project 'input-source/eduke32-master.zip') -DestinationPath $nativeWorkspace
}
if (-not (Test-Path -LiteralPath $flacLibrary)) { & (Join-Path $PSScriptRoot 'build-flac-ucrt.ps1') }
if (-not (Test-Path -LiteralPath $flacLibrary)) { throw 'Matching UCRT FLAC dependency build failed.' }
if (Test-Path -LiteralPath $flacLibrary) { $arguments += 'LDFLAGS=-L../flac-ucrt/lib -Wl,-Map,../../../reports/native-engine-link.map' }
$reportPath = Join-Path $project 'reports\native-engine-build.json'
$logPath = Join-Path $project 'reports\native-engine-build.log'
$report = [ordered]@{
  schemaVersion = 1
  startedAt = [DateTime]::UtcNow.ToString('o')
  status = 'running'
  runnerPid = $PID
  sourceDirectory = $source
  command = [ordered]@{ executable = $make; arguments = $arguments; workingDirectory = $source }
  compilerVersion = ((& (Join-Path $toolchain 'g++.exe') --version) -join "`n")
  makeVersion = ((& $make --version) -join "`n")
  sourceHashManifest = 'reports/native-oracle-source-hashes.json'
  configuration = [ordered]@{ platform = 'Windows x86_64'; cRuntime = 'UCRT'; renderer = 'SDL2 / classic and OpenGL'; assembly = $false; optimization = 0; linkTimeOptimization = $false; parallelMakeJobs = 1 }
  sourceModifications = @()
  rebuiltDependencies = if (Test-Path -LiteralPath $flacLibrary) { @([ordered]@{ library = $flacLibrary; sha256 = (Get-FileHash -LiteralPath $flacLibrary -Algorithm SHA256).Hash.ToLowerInvariant(); buildReport = 'reports/native-flac-build.json' }) } else { @() }
  log = 'reports/native-engine-build.log'
  linkerMap = 'reports/native-engine-link.map'
  parityTests = 'not-run'
  gameplayVerified = $false
}
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8
Push-Location $source
try {
  & $make @arguments *> $logPath
  $report.exitCode = $LASTEXITCODE
  $report.status = if ($LASTEXITCODE -eq 0) { 'built' } else { 'failed' }
} catch {
  $report.status = 'failed'
  $report.exception = $_.Exception.ToString()
} finally {
  Pop-Location
  $report.finishedAt = [DateTime]::UtcNow.ToString('o')
  $executable = Join-Path $source 'eduke32.exe'
  if (Test-Path -LiteralPath $executable) {
    $report.executable = $executable
    $report.executableSha256 = (Get-FileHash -LiteralPath $executable -Algorithm SHA256).Hash.ToLowerInvariant()
    $report.executableBytes = (Get-Item -LiteralPath $executable).Length
    $report.objectFileCount = @(Get-ChildItem -LiteralPath (Join-Path $source 'obj') -Recurse -Filter '*.o').Count
    if ($report.status -eq 'built') {
      $artifactDirectory = Join-Path $project 'artifacts/native-oracle'
      New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
      Copy-Item -LiteralPath $executable -Destination (Join-Path $artifactDirectory 'eduke32.exe') -Force
      $report.packagedExecutable = 'artifacts/native-oracle/eduke32.exe'
    }
  }
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8
}
