param([int[]]$SampleSeconds = @(5,10,15,20,25), [int]$DurationSeconds = 30)
$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$nativeRoot = Join-Path $project 'work/native-oracle'
$source = Join-Path $nativeRoot 'eduke32-master'
$cwd = Join-Path $nativeRoot 'state-game'
$gameData = Join-Path $project 'input-data'
$reportPath = Join-Path $project 'reports/native-state-samples.json'
$artifactRelativeDirectory = 'artifacts/native-oracle/state-samples/run-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
$artifactDirectory = Join-Path $project $artifactRelativeDirectory
$build = Get-Content -LiteralPath (Join-Path $project 'reports/native-engine-build.json') -Raw | ConvertFrom-Json
$exe = Join-Path $source 'eduke32.exe'
$mapPath = Join-Path $project 'reports/native-engine-link.map'
if ($build.status -ne 'built' -or (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLowerInvariant() -ne $build.executableSha256) { throw 'Native executable does not match successful recorded build.' }
if ($DurationSeconds -lt 2 -or $DurationSeconds -gt 60 -or @($SampleSeconds | Where-Object { $_ -lt 1 -or $_ -ge $DurationSeconds }).Count) { throw 'Samples must occur before a bounded 2..60 second run.' }
New-Item -ItemType Directory -Force -Path $cwd,$artifactDirectory | Out-Null
$pe = [IO.File]::ReadAllBytes($exe)
$peOffset = [BitConverter]::ToInt32($pe,0x3c)
if ([Text.Encoding]::ASCII.GetString($pe,$peOffset,4) -ne "PE`0`0" -or [BitConverter]::ToUInt16($pe,$peOffset + 24) -ne 0x20b) { throw 'Expected a PE32+ Win64 reference executable.' }
$preferredBase = [BitConverter]::ToUInt64($pe,$peOffset + 48)
$imageSize = [BitConverter]::ToUInt32($pe,$peOffset + 80)
$pe = $null
$definitions = @(
  @{name='g_frameCounter';bytes=4;signed=$false;type='uint32_t';declaration='source/duke3d/src/global.h:174';increment='source/duke3d/src/game.cpp:6506';meaning='drawframe_do completed G_DrawRooms and G_DisplayRest; increment precedes videoNextPage'},
  @{name='g_moveThingsCount';bytes=4;signed=$false;type='uint32_t';declaration='source/duke3d/src/global.h:165';increment='source/duke3d/src/game.cpp:7307';meaning='Original G_DoMoveThings game update executions; increment precedes remaining actor updates'},
  @{name='numframes';bytes=4;signed=$true;type='int32_t';declaration='source/build/include/build.h:805';increment='source/build/src/engine.cpp:12122';meaning='Original videoNextPage executions'},
  @{name='totalclock';bytes=4;signed=$true;type='ClockTicks.wholeTicks';declaration='source/build/include/build.h:802';layout='source/build/include/clockticks.hpp:137';meaning='First int32_t field explicitly supports pointer-to-int32_t access; 120 timer ticks per second'},
  @{name='numsectors';bytes=2;signed=$true;type='int16_t';declaration='source/build/include/build.h:798';meaning='Loaded world sector count'},
  @{name='numwalls';bytes=2;signed=$true;type='int16_t';declaration='source/build/include/build.h:798';meaning='Loaded world wall count'},
  @{name='Numsprites';bytes=4;signed=$true;type='int32_t';declaration='source/build/include/build.h:797';meaning='Live engine sprite count'},
  @{name='randomseed';bytes=4;signed=$true;type='int32_t';declaration='source/build/include/random.h:19';meaning='Original game random-number-generator state'},
  @{name='sprite';bytes=8;signed=$false;type='spritetype*';declaration='source/build/include/build.h:621';meaning='Native pointer to original spritetypev7 array'}
)
$mapText = [IO.File]::ReadAllText($mapPath)
foreach ($definition in $definitions) {
  $matchesForSymbol = [regex]::Matches($mapText,'(?m)^\s+0x([0-9a-fA-F]+)\s+' + [regex]::Escape($definition.name) + '\s*$')
  if ($matchesForSymbol.Count -ne 1) { throw ('Expected exactly one linker address for ' + $definition.name) }
  $linkedAddress = [Convert]::ToUInt64($matchesForSymbol[0].Groups[1].Value,16)
  $rva = $linkedAddress - $preferredBase
  if ($linkedAddress -lt $preferredBase -or $rva + $definition.bytes -gt $imageSize) { throw ('Symbol address outside PE image: ' + $definition.name) }
  $definition.linkedAddress = '0x' + $linkedAddress.ToString('x16')
  $definition.rva = $rva
}
$mapText = $null
$originalManifest = Get-Content -LiteralPath (Join-Path $project 'reports/native-oracle-source-hashes.json') -Raw | ConvertFrom-Json
$sourceHashes = [ordered]@{}
foreach ($relativeSource in @('source/duke3d/src/global.h','source/duke3d/src/game.cpp','source/build/src/engine.cpp','source/build/include/build.h','source/build/include/clockticks.hpp','source/build/include/buildtypes.h','source/build/include/tracker.hpp','source/build/include/random.h','source/duke3d/src/names.h')) {
  $actual = (Get-FileHash -LiteralPath (Join-Path $source $relativeSource) -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($originalManifest.files.('eduke32-master/' + $relativeSource) -ne $actual) { throw ('Original declaration source differs from archive: ' + $relativeSource) }
  $sourceHashes[$relativeSource] = $actual
}
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
$environment = [ordered]@{SDL_VIDEODRIVER='dummy';SDL_AUDIODRIVER='dummy';SDL_RENDER_DRIVER='software'}
$previous = @{}
$arguments = @('-usecwd','-nosetup','-noautoload','-nologo','-game_dir',$gameData,'-v1','-l1','-s3','-ns','-nm')
$command = '"' + $exe + '" -usecwd -nosetup -noautoload -nologo -game_dir "' + $gameData + '" -v1 -l1 -s3 -ns -nm'
$stdout = Join-Path $project 'reports/native-state-game.stdout.log'
$stderr = Join-Path $project 'reports/native-state-game.stderr.log'
$report = [ordered]@{
  schemaVersion=1;startedAt=[DateTime]::UtcNow.ToString('o');status='running';executableSha256=$build.executableSha256
  executable=$exe;linkerMap='reports/native-engine-link.map';linkerMapSha256=(Get-FileHash -LiteralPath $mapPath -Algorithm SHA256).Hash.ToLowerInvariant()
  preferredImageBase='0x' + $preferredBase.ToString('x16');imageSize=$imageSize;symbols=$definitions
  sourceHashes=$sourceHashes;originalArchiveSha256=$originalManifest.archive_sha256
  arguments=$arguments;workingDirectory=$cwd;environment=$environment;durationSeconds=$DurationSeconds;scheduledSampleSeconds=$SampleSeconds
  memoryAccess='ReadProcessMemory only; no writes, injection, thread suspension, hooks, or synthesized game counters'
  desktopIsolation='Private Windows desktop; never switched to input desktop; SDL dummy video and audio'
  sampleConsistency='Live sequential reads without pausing; counter brackets are evidence only, not an atomic snapshot guarantee'
  spriteLayout=@{type='spritetypev7';bytes=44;source='source/build/include/buildtypes.h:166';alias='source/build/include/build.h:350';tracker='source/build/include/tracker.hpp:5';capacity=16384;nativeLayoutProbeRun=$false;derivation='Original source and Win64 scalar alignment; tracker wraps one primitive field'}
  samples=@();nativeStateSnapshotsDeterministic=$false;nativeJavaScriptParityVerified=$false;javascriptGameplayVerified=$false
}
$report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $reportPath -Encoding utf8
try {
  if (-not ('NativeOracleHeadless' -as [type])) { Add-Type -Path (Join-Path $PSScriptRoot 'headless-process.cs') }
  if (-not ('NativeOracleReadOnlyMemory' -as [type])) { Add-Type -Path (Join-Path $PSScriptRoot 'read-only-memory.cs') }
  foreach ($key in $environment.Keys) { $previous[$key]=[Environment]::GetEnvironmentVariable($key,'Process'); [Environment]::SetEnvironmentVariable($key,$environment[$key],'Process') }
  $samples = [Collections.Generic.List[object]]::new()
  $observer = [Action[Diagnostics.Process,IntPtr]] {
    param($nativeProcess,$nativeHandle)
    $nativeProcess.Refresh()
    $runtimeBase = [uint64]$nativeProcess.MainModule.BaseAddress.ToInt64()
    $report.runtimeImageBase = '0x' + $runtimeBase.ToString('x16')
    $report.addressAdjustment = 'runtime module base + (linker address - PE preferred ImageBase)'
    $watch = [Diagnostics.Stopwatch]::StartNew()
    foreach ($seconds in ($SampleSeconds | Sort-Object -Unique)) {
      $remaining = [int]([double]$seconds * 1000 - $watch.ElapsedMilliseconds)
      if ($remaining -gt 0 -and $nativeProcess.WaitForExit($remaining)) { break }
      if ($nativeProcess.HasExited) { break }
      $sample = [ordered]@{elapsedMilliseconds=$watch.ElapsedMilliseconds;observedAt=[DateTime]::UtcNow.ToString('o');values=[ordered]@{};rawHex=[ordered]@{}}
      $moveDefinition = $definitions | Where-Object name -eq 'g_moveThingsCount'
      $sample.moveCounterBefore = [BitConverter]::ToUInt32([NativeOracleReadOnlyMemory]::Read($nativeHandle,($runtimeBase + $moveDefinition.rva),4),0)
      foreach ($definition in $definitions) {
        $bytes = [NativeOracleReadOnlyMemory]::Read($nativeHandle,($runtimeBase + $definition.rva),$definition.bytes)
        $value = if ($definition.bytes -eq 8) { [BitConverter]::ToUInt64($bytes,0) } elseif ($definition.bytes -eq 2) { [BitConverter]::ToInt16($bytes,0) } elseif ($definition.signed) { [BitConverter]::ToInt32($bytes,0) } else { [BitConverter]::ToUInt32($bytes,0) }
        $sample.values[$definition.name] = $value
        $sample.rawHex[$definition.name] = [Convert]::ToHexString($bytes).ToLowerInvariant()
      }
      if ($sample.values.sprite -gt 0 -and $sample.values.numsectors -gt 0) {
        $spriteBytes = [NativeOracleReadOnlyMemory]::Read($nativeHandle,[uint64]$sample.values.sprite,(16384*44))
      } else { $spriteBytes = $null }
      $sample.moveCounterAfter = [BitConverter]::ToUInt32([NativeOracleReadOnlyMemory]::Read($nativeHandle,($runtimeBase + $moveDefinition.rva),4),0)
      $sample.moveCounterBracketUnchanged = $sample.moveCounterBefore -eq $sample.moveCounterAfter
      $sample.capturedElapsedMilliseconds = $watch.ElapsedMilliseconds
      if ($null -ne $spriteBytes) {
        $sample.spriteArraySha256 = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($spriteBytes)).ToLowerInvariant()
        $sampleFile = 'sample-' + $samples.Count.ToString('00') + '.sprites.bin'
        [IO.File]::WriteAllBytes((Join-Path $artifactDirectory $sampleFile),$spriteBytes)
        $sample.spriteArrayArtifact = $artifactRelativeDirectory + '/' + $sampleFile
        $sample.spriteArrayBytes = $spriteBytes.Length
        $active = [Collections.Generic.List[object]]::new()
        $playerCandidates = [Collections.Generic.List[object]]::new()
        for ($index=0; $index -lt 16384; $index++) {
          $offset = $index*44
          $statnum = [BitConverter]::ToInt16($spriteBytes,$offset+26)
          $sectnum = [BitConverter]::ToInt16($spriteBytes,$offset+24)
          if ($statnum -lt 0 -or $statnum -ge 1024 -or $sectnum -lt 0 -or $sectnum -ge $sample.values.numsectors) { continue }
          $entity = [ordered]@{index=$index;x=[BitConverter]::ToInt32($spriteBytes,$offset);y=[BitConverter]::ToInt32($spriteBytes,$offset+4);z=[BitConverter]::ToInt32($spriteBytes,$offset+8);picnum=[BitConverter]::ToInt16($spriteBytes,$offset+14);sectnum=$sectnum;statnum=$statnum;angle=[BitConverter]::ToInt16($spriteBytes,$offset+28);extra=[BitConverter]::ToInt16($spriteBytes,$offset+42)}
          $active.Add($entity)
          if ($entity.picnum -eq 1405) { $playerCandidates.Add($entity) }
        }
        $sample.activeSpriteRecords = $active.Count
        $sample.firstActiveSprites = @($active | Select-Object -First 12)
        $sample.playerTileCandidates = $playerCandidates.ToArray()
      }
      $sample.completedElapsedMilliseconds = $watch.ElapsedMilliseconds
      $samples.Add($sample)
      $report.samples = $samples.ToArray()
      $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $reportPath -Encoding utf8
    }
  }
  $report.processResult = [NativeOracleHeadless]::Run($exe,$command,$cwd,$stdout,$stderr,($DurationSeconds*1000),$observer)
  $report.status = 'sampled'
} catch {
  $report.status = 'failed'
  $report.exception = $_.Exception.ToString()
} finally {
  foreach ($key in $previous.Keys) { [Environment]::SetEnvironmentVariable($key,$previous[$key],'Process') }
  $logs = (Get-Content -LiteralPath $stderr -Raw -ErrorAction SilentlyContinue)
  $report.originalLevelLoaded = $logs -match 'E1L1: HOLLYWOOD HOLOCAUST'
  $report.grpSha256=(Get-FileHash -LiteralPath (Join-Path $gameData 'DUKE3D.GRP') -Algorithm SHA256).Hash.ToLowerInvariant()
  $loadedSamples = @($report.samples | Where-Object { $_.values.numsectors -gt 0 -and $_.values.numwalls -gt 0 })
  $report.progression = [ordered]@{sampleCount=$report.samples.Count;loadedWorldSampleCount=$loadedSamples.Count;timerTicksAdvanced=$false;originalGameUpdatesAdvanced=$false;originalDrawFramesAdvanced=$false;originalVideoNextPageAdvanced=$false;inputVerified=$false;audioOutputVerified=$false;saveLoadVerified=$false;enemyWeaponCollisionBehaviorVerified=$false}
  $report.progression.pixelOutputVerified=$false
  if ($loadedSamples.Count -ge 2) {
    $first=$loadedSamples[0].values; $last=$loadedSamples[-1].values
    $report.progression.timerTickDelta=[long]$last.totalclock-[long]$first.totalclock
    $report.progression.gameUpdateDelta=[long]$last.g_moveThingsCount-[long]$first.g_moveThingsCount
    $report.progression.drawFrameDelta=[long]$last.g_frameCounter-[long]$first.g_frameCounter
    $report.progression.videoNextPageDelta=[long]$last.numframes-[long]$first.numframes
    $report.progression.timerTicksAdvanced=$report.progression.timerTickDelta -gt 0
    $report.progression.originalGameUpdatesAdvanced=$report.progression.gameUpdateDelta -gt 0
    $report.progression.originalDrawFramesAdvanced=$report.progression.drawFrameDelta -gt 0
    $report.progression.originalVideoNextPageAdvanced=$report.progression.videoNextPageDelta -gt 0
    $report.progression.observedElapsedSeconds=($loadedSamples[-1].elapsedMilliseconds-$loadedSamples[0].elapsedMilliseconds)/1000.0
    $report.progression.observedGameUpdatesPerSecond=$report.progression.gameUpdateDelta/$report.progression.observedElapsedSeconds
    $report.progression.observedDrawFramesPerSecond=$report.progression.drawFrameDelta/$report.progression.observedElapsedSeconds
  }
  $report.finishedAt=[DateTime]::UtcNow.ToString('o')
  $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $reportPath -Encoding utf8
}
[pscustomobject]$report | Select-Object status,originalLevelLoaded,progression,exception | ConvertTo-Json -Depth 6
