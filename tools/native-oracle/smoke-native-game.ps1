$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$source = Join-Path $project 'work/native-oracle/eduke32-master'
$cwd = Join-Path $project 'work/native-oracle/smoke-game'
$gameData = Join-Path $project 'input-data'
$build = Get-Content -LiteralPath (Join-Path $project 'reports/native-engine-build.json') -Raw | ConvertFrom-Json
if ($build.status -ne 'built') { throw 'Native executable must build before startup verification.' }
New-Item -ItemType Directory -Force -Path $cwd | Out-Null
@'
[Setup]
ForceSetup = 0
NoAutoLoad = 1
[Updates]
CheckForUpdates = 0
[Screen Setup]
ScreenBPP = 8
ScreenHeight = 480
ScreenMode = 0
ScreenWidth = 640
'@ | Set-Content -LiteralPath (Join-Path $cwd 'eduke32.cfg') -Encoding utf8
$environment = [ordered]@{ SDL_VIDEODRIVER='dummy'; SDL_AUDIODRIVER='dummy'; SDL_RENDER_DRIVER='software' }
$previous = @{}
foreach ($key in $environment.Keys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key,'Process'); [Environment]::SetEnvironmentVariable($key,$environment[$key],'Process') }
$exe = Join-Path $source 'eduke32.exe'
$arguments = @('-usecwd','-nosetup','-noautoload','-nologo','-game_dir',$gameData,'-v1','-l1','-s3','-ns','-nm')
$command = '"' + $exe + '" -usecwd -nosetup -noautoload -nologo -game_dir "' + $gameData + '" -v1 -l1 -s3 -ns -nm'
$stdout = Join-Path $project 'reports/native-engine-game.stdout.log'
$stderr = Join-Path $project 'reports/native-engine-game.stderr.log'
$report = [ordered]@{ startedAt=[DateTime]::UtcNow.ToString('o'); executableSha256=$build.executableSha256; executable=$exe; arguments=$arguments; workingDirectory=$cwd; environment=$environment; timeoutMilliseconds=30000; status='running'; gameplayVerified=$false; javascriptParityVerified=$false; stdout='reports/native-engine-game.stdout.log'; stderr='reports/native-engine-game.stderr.log'; isolation='Private noninteractive Windows desktop, never switched to input desktop; dummy SDL drivers; workspace-only current directory and -usecwd' }
$reportPath = Join-Path $project 'reports/native-engine-startup.json'
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8
try {
  if (-not ('NativeOracleHeadless' -as [type])) { Add-Type -Path (Join-Path $PSScriptRoot 'headless-process.cs') }
  $result = [NativeOracleHeadless]::Run($exe,$command,$cwd,$stdout,$stderr,30000)
  $report.processResult = $result
  $report.status = if ($result.TimedOut) { 'bounded-run-ended' } else { 'exited' }
} catch {
  $report.status = 'failed'
  $report.exception = $_.Exception.ToString()
} finally {
  foreach ($key in $environment.Keys) { [Environment]::SetEnvironmentVariable($key,$previous[$key],'Process') }
  $logs = ((Get-Content -LiteralPath $stdout -Raw -ErrorAction SilentlyContinue) + (Get-Content -LiteralPath $stderr -Raw -ErrorAction SilentlyContinue))
  $report.observations = [ordered]@{
    originalAppMainRan = ($logs -match 'Application parameters:')
    originalGrpSelected = ($logs -match 'Using DUKE3D.GRP as main data file')
    originalGrpCrc32 = if ($logs -match 'DUKE3D.GRP has checksum (0x[0-9a-f]+)') { $Matches[1] } else { $null }
    originalConCompiledWithoutErrors = ($logs -match '0 error\(s\)' -and $logs -match 'Compiled [0-9]+ bytes')
    classicVideoModeSet = ($logs -match 'Setting video mode 640x480 \(8-bpp windowed\)')
    originalLevelLoaded = ($logs -match 'E1L1: HOLLYWOOD HOLOCAUST')
    nativeGameplayFramesVerified = $false
    inputAudioSaveLoadVerified = $false
    javascriptGameplayVerified = $false
  }
  $report.gameData = [ordered]@{ path=(Join-Path $gameData 'DUKE3D.GRP'); bytes=(Get-Item -LiteralPath (Join-Path $gameData 'DUKE3D.GRP')).Length; sha256=(Get-FileHash -LiteralPath (Join-Path $gameData 'DUKE3D.GRP') -Algorithm SHA256).Hash.ToLowerInvariant() }
  $cache = Get-Content -LiteralPath (Join-Path $cwd 'grpfiles.cache') -Raw -ErrorAction SilentlyContinue
  if ($null -eq $report.observations.originalGrpCrc32 -and $cache -match '"DUKE3D.GRP"\s+\d+\s+\d+\s+(-?\d+)') { $report.observations.originalGrpCrc32 = '0x' + (([long]$Matches[1]) -band 0xffffffffL).ToString('x8'); $report.observations.crcEvidence = 'Original engine grpfiles.cache' }
  $report.startupVerified = $report.observations.originalGrpSelected -and $report.observations.originalConCompiledWithoutErrors -and $report.observations.classicVideoModeSet -and $report.observations.originalLevelLoaded
  $report.traceEvidence = @($logs -split "`r?`n" | Where-Object { $_ -match 'Application parameters:|Initializing SDL|DUKE3D.GRP has checksum|Using DUKE3D.GRP|Compiling:|Including:|0 error\(s\)|Compiled [0-9]+ bytes|Initialized [0-9.]+M cache|Setting video mode|Using SDL DUMMY|E1L1:' })
  $report.finishedAt = [DateTime]::UtcNow.ToString('o')
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8
}
$report | ConvertTo-Json -Depth 8
