$ErrorActionPreference='Stop'
$project=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$nativeRoot=Join-Path $project 'work/native-oracle'
$source=Join-Path $nativeRoot 'eduke32-master'
$cwd=Join-Path $nativeRoot 'frame-game'
$gameData=Join-Path $project 'input-data'
$state=Get-Content -LiteralPath (Join-Path $project 'reports/native-state-samples.json') -Raw | ConvertFrom-Json
$exe=Join-Path $source 'eduke32.exe'
$mapPath=Join-Path $project 'reports/native-engine-link.map'
if ((Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLowerInvariant() -ne $state.executableSha256 -or (Get-FileHash -LiteralPath $mapPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $state.linkerMapSha256) { throw 'Native image/map differs from validated state sampler.' }
$preferredBase=[Convert]::ToUInt64($state.preferredImageBase.Substring(2),16)
$specifications=@(
 @{name='frameplace';bytes=8;type='intptr_t';declaration='source/build/include/baselayer.h:66'},
 @{name='xdim';bytes=4;type='int32_t';declaration='source/build/include/build.h:761'},
 @{name='ydim';bytes=4;type='int32_t';declaration='source/build/include/build.h:761'},
 @{name='bytesperline';bytes=4;type='int32_t';declaration='source/build/include/baselayer.h:64'},
 @{name='bpp';bytes=4;type='int32_t';declaration='source/build/include/baselayer.h:64'},
 @{name='curpalettefaded';bytes=1024;type='palette_t[256]';declaration='source/build/include/palette.h:44';layout='source/build/include/palette.h:38'},
 @{name='offscreenrendering';bytes=1;type='char';declaration='source/build/include/baselayer.h:67'},
 @{name='nogl';bytes=1;type='char';declaration='source/build/include/baselayer.h:36'},
 @{name='inpreparemirror';bytes=1;type='char';declaration='source/build/src/engine.cpp:1585'},
 @{name='g_frameCounter';bytes=4;type='uint32_t';declaration='source/duke3d/src/global.h:174'}
)
$rvas=[Collections.Generic.Dictionary[string,uint64]]::new()
$mapText=[IO.File]::ReadAllText($mapPath)
foreach ($symbol in $specifications) {
 $locations=[regex]::Matches($mapText,'(?m)^\s+0x([0-9a-fA-F]+)\s+'+[regex]::Escape($symbol.name)+'\s*$')
 if ($locations.Count -ne 1) { throw ('Native framebuffer symbol ambiguous/missing: '+$symbol.name) }
 $address=[Convert]::ToUInt64($locations[0].Groups[1].Value,16)
 $symbol.linkedAddress='0x'+$address.ToString('x16');$symbol.rva=$address-$preferredBase
 if ($address -lt $preferredBase -or $symbol.rva+$symbol.bytes -gt $state.imageSize) { throw 'Framebuffer symbol lies outside validated PE image.' }
 $rvas.Add($symbol.name,$symbol.rva)
}
$mapText=$null
$manifest=Get-Content -LiteralPath (Join-Path $project 'reports/native-oracle-source-hashes.json') -Raw | ConvertFrom-Json
$sourceHashes=[ordered]@{}
foreach ($relative in @('source/build/include/baselayer.h','source/build/include/build.h','source/build/include/palette.h','source/build/src/softsurface.cpp','source/build/src/sdlayer.cpp','source/build/src/palette.cpp','source/build/src/engine.cpp')) {
 $sha=(Get-FileHash -LiteralPath (Join-Path $source $relative) -Algorithm SHA256).Hash.ToLowerInvariant()
 if ($manifest.files.('eduke32-master/'+$relative) -ne $sha) { throw ('Native source differs from original archive: '+$relative) }
 $sourceHashes[$relative]=$sha
}
$artifactRelative='artifacts/native-oracle/frames/run-'+[DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
$artifactDirectory=Join-Path $project $artifactRelative
New-Item -ItemType Directory -Force -Path $cwd,$artifactDirectory | Out-Null
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
$environment=[ordered]@{SDL_VIDEODRIVER='dummy';SDL_AUDIODRIVER='dummy';SDL_RENDER_DRIVER='software'};$previous=@{}
$report=[ordered]@{status='running';startedAt=[DateTime]::UtcNow.ToString('o');executableSha256=$state.executableSha256;linkerMapSha256=$state.linkerMapSha256;symbols=$specifications;sourceHashes=$sourceHashes;frames=@();nativeReferenceOnly=$true;browserScreenshot=$false;javascriptParityVerified=$false;atomicFrameCapture=$false;paletteSemantics='palette_t is four char bytes r,g,b,f; softsurface_setPalette consumes RGB as unsigned8 without rescaling; f is unused';memoryAccess='ReadProcessMemory only; no process writes/hooks';isolation='Private noninteractive desktop, dummy SDL; workspace current directory with -usecwd';environment=$environment}
$reportPath=Join-Path $project 'reports/native-frame-capture.json'
try {
 if (-not ('NativeOracleHeadless' -as [type])) { Add-Type -Path (Join-Path $PSScriptRoot 'headless-process.cs') }
 if (-not ('NativeOracleReadOnlyMemory' -as [type])) { Add-Type -Path (Join-Path $PSScriptRoot 'read-only-memory.cs') }
 foreach ($key in $environment.Keys) { $previous[$key]=[Environment]::GetEnvironmentVariable($key,'Process');[Environment]::SetEnvironmentVariable($key,$environment[$key],'Process') }
 $observer=[Action[Diagnostics.Process,IntPtr]] {
  param($nativeProcess,$nativeHandle)
  $runtimeBase=[uint64]$nativeProcess.MainModule.BaseAddress.ToInt64();$report.runtimeImageBase='0x'+$runtimeBase.ToString('x16')
  $watch=[Diagnostics.Stopwatch]::StartNew()
  foreach ($second in @(5,10)) {
   $remaining=[int]($second*1000-$watch.ElapsedMilliseconds)
   if ($remaining -gt 0 -and $nativeProcess.WaitForExit($remaining)) { throw 'Native game exited before frame capture.' }
   $frame=[NativeOracleReadOnlyMemory]::CaptureFrame($nativeHandle,$runtimeBase,$rvas,3000)
   $frameName='native-frame-'+$second
   $metadata=[ordered]@{width=$frame.Width;height=$frame.Height;stride=$frame.Stride;bpp=$frame.Bpp;framePointer='0x'+$frame.FramePointer.ToString('x16');attempts=$frame.Attempts;captureElapsedMilliseconds=$watch.ElapsedMilliseconds;framePointerStableAtRead=$frame.FramePointerStable;drawCounterBefore=$frame.DrawCounterBefore;drawCounterAfter=$frame.DrawCounterAfter;atomicCapture=$false;pixelsFile=$frameName+'.indices.bin';paletteFile=$frameName+'.palette-rgbf.bin';pngFile=$frameName+'.png';pixelsSha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($frame.Pixels)).ToLowerInvariant();paletteSha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($frame.Palette)).ToLowerInvariant();executableSha256=$state.executableSha256;nativeReferenceOnly=$true}
   [IO.File]::WriteAllBytes((Join-Path $artifactDirectory $metadata.pixelsFile),$frame.Pixels)
   [IO.File]::WriteAllBytes((Join-Path $artifactDirectory $metadata.paletteFile),$frame.Palette)
   $metadataPath=Join-Path $artifactDirectory ($frameName+'.json')
   $metadata | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $metadataPath -Encoding utf8
   & python (Join-Path $PSScriptRoot 'encode-native-frame.py') $metadataPath
   if ($LASTEXITCODE -ne 0) { throw 'Original framebuffer PNG encoding failed.' }
   $metadata=Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
   $report.frames+=@([ordered]@{metadata=$artifactRelative+'/'+$frameName+'.json';png=$artifactRelative+'/'+$metadata.pngFile;width=$metadata.width;height=$metadata.height;sha256=$metadata.pngSha256;distinctPixelIndices=$metadata.distinctPixelIndices;frameCounter=$metadata.drawCounterBefore;originalFramebufferSha256=$metadata.pixelsSha256;paletteSha256=$metadata.paletteSha256})
   $report | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $reportPath -Encoding utf8
  }
 }
 $command='"'+$exe+'" -usecwd -nosetup -noautoload -nologo -game_dir "'+$gameData+'" -v1 -l1 -s3 -ns -nm'
 $report.commandLine=$command;$report.workingDirectory=$cwd;$report.boundedRunMilliseconds=15000
 $report.processResult=[NativeOracleHeadless]::Run($exe,$command,$cwd,(Join-Path $project 'reports/native-frame-game.stdout.log'),(Join-Path $project 'reports/native-frame-game.stderr.log'),15000,$observer)
 $report.status='captured'
} catch {$report.status='failed';$report.exception=$_.Exception.ToString()}
finally {
 foreach ($key in $previous.Keys) {[Environment]::SetEnvironmentVariable($key,$previous[$key],'Process')}
 $report.finishedAt=[DateTime]::UtcNow.ToString('o');$report | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $reportPath -Encoding utf8
}
[pscustomobject]$report | Select-Object status,frames,exception | ConvertTo-Json -Depth 6
